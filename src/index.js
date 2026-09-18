/**
 * Session head prompt — Host half (plain ESM; the node build config copies
 * this file to lib/index.js verbatim).
 *
 * Registers one user-editable settings namespace and one global system-prompt
 * section that renders the configured text at the VERY TOP of every session's
 * assembled prompt (before the harness identity opener at -100 and the
 * deployment persona at 0). Because the section text is a provider evaluated
 * at each assembly, edits made on the web settings page take effect on the
 * next request — no re-registration, no restart.
 *
 * @module dsh-session-head-prompt
 */

/**
 * Host-API note: DSH 0.1.5-rc.x removed the `installSettingsSection` /
 * `settingsNamespace` exports from `@deepseek-ai/dsh-settings`. A settings
 * namespace is now a plain validated string, and registration goes through
 * the `settings` service's `installSection` method, wrapped in
 * `ctx.inject(['settings'], ...)` so a profile without a settings provider
 * falls back to the composition entry (the same pattern the host's own
 * bash-local and web-search-deepseek plugins use).
 */

import z from '@deepseek-ai/schemastery'

/**
 * Settings namespace owning the user-editable section of this plugin
 * (lowercase kebab-case; paired with the same key on the web settings card).
 * On DSH >= 0.1.5-rc.x a namespace is a plain string.
 * @type {string}
 */
export const SETTINGS_NAMESPACE = 'session-head-prompt'

/**
 * Prompt order of the injected section. Sections concatenate in ascending
 * order; the harness identity sits at -100 and the deployment persona at 0.
 * -200 renders first, so the custom prompt is the first thing the model
 * reads in every session.
 */
export const HEAD_ORDER = -200

/** Unique section name (a duplicate registration would throw). */
export const HEAD_SECTION = 'session-head-prompt:head'

/** Cordis plugin name (the row id in cordis.yml may differ). */
export const name = 'session-head-prompt'

/** The assembly registry this plugin contributes to. */
export const inject = ['systemPrompt']

/**
 * Plugin configuration: whether injection is on, and the prompt text.
 * @typedef {object} Config
 * @property {boolean} [enabled] Master switch; disabled sections render nothing.
 * @property {string} [prompt]   Text injected at the head of every session's system prompt.
 */

/** Runtime schema for the row and the settings namespace (defaults included). */
export const Config = z.object({
  enabled: z.boolean().default(true),
  prompt: z.string().default(''),
})

/**
 * Matches a complete `{{…}}` group. The prompt renderer interpolates strict
 * `{{variable}}` references and THROWS on unknown or malformed groups (a
 * `{{name}}` nobody registered, `{{}}`, `{{ spaced }}`), which would break
 * every request. The settings validator below therefore refuses such text at
 * the write that produces it, before anything is stored. A lone `{{` without
 * a later `}}` is literal prose and stays allowed.
 */
const COMPLETE_GROUP = /\{\{[^{}]*\}\}/

/**
 * Register the settings namespace (with the composition entry as the base
 * layer) and the head prompt section whose text follows the effective
 * settings on every assembly.
 * @param {import('@deepseek-ai/cordis').Context} ctx - plugin context carrying
 *   the injected systemPrompt service.
 * @param {Config} config - the composition entry config, used as the settings base.
 */
export function apply(ctx, config) {
  // The effective source: the resolved settings scope while one is attached
  // (user document over the entry), the composition entry otherwise.
  let source = () => config
  // Register with the settings service when present; the inject wrapper keeps
  // profiles without a settings provider on the composition-entry fallback.
  ctx.inject(['settings'], (settingsCtx) => {
    settingsCtx.settings.installSection(ctx, SETTINGS_NAMESPACE, Config, config, {
      // A prompt the renderer could not render must not be stored: refuse the
      // write that would produce it instead of failing the next request.
      validate: (value) => {
        if (typeof value.prompt !== 'string') return
        if (COMPLETE_GROUP.test(value.prompt)) {
          throw new Error(
            'session-head-prompt: the prompt contains a complete {{…}} group, which the system-prompt '
            + 'renderer would try to interpolate as a template variable and fail on; remove the '
            + 'braces or reformulate the text',
          )
        }
      },
      setSource: (current) => { source = current },
      // The section provider reads source() per assembly, so a committed change
      // needs no rebuild here — it is already what the next request renders.
      onChange: () => {},
    })
  })
  ctx.systemPrompt.section({
    name: HEAD_SECTION,
    order: HEAD_ORDER,
    // Evaluated at every assembly: empty text is dropped by the renderer, so
    // toggling the switch or editing the prompt applies live.
    text: () => {
      const settings = source()
      const text = typeof settings.prompt === 'string' ? settings.prompt : ''
      return settings.enabled !== false && text !== '' ? text : ''
    },
  })
}