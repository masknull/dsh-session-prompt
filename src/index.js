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
 *
 * DSH 0.1.7 removed that method (and `register`) in favour of projecting the
 * plugin's own `Config` schema into the settings document: a field the user may
 * edit is marked `.volatile()`, the Host serves it (its `describe()` reads
 * `entry.fiber.runtime.Config`) and hands `apply` a stable reference per field
 * instead of a plain value. Both paths are therefore probed at runtime — see
 * `volatileField` and `readField` — and a host with neither keeps working on
 * the composition entry alone.
 */

import z from '@deepseek-ai/schemastery'
import { randomBytes } from 'node:crypto'
import { SettingsStore, dataDir, settingsFilePath, readLegacySections } from './settings-store.js'

/** Plugin-owned keys: exactly what the migration deletes from the entry config. */
const OWN_KEYS = ['enabled', 'prompt']

/**
 * The schema defaults, spelled out: the seed rule below uses them to tell a
 * real profile override apart from the defaults the Host hands out once the
 * one-time cleanup has emptied the entry's config.
 */
const DEFAULT_FOR_FIELD = { enabled: true, prompt: '' }

/**
 * The section names the 0.1.5 host keyed this plugin's settings under. The
 * 0.1.7 platform refuses to import sections whose names are not profile entry
 * ids, so the plugin reads them out of the legacy document itself.
 */
const LEGACY_NAMESPACES = ['session-head-prompt']

/** Route base for the browser half's settings face. */
const ROUTE_BASE = '/plugins/dsh-session-prompt'

/**
 * Read one config field.
 *
 * A `.volatile()` field parses into a stable reference read with `.get()`
 * (0.1.7), while an older host hands the plain value through; a profile that
 * supplies its own object (a hand-written entry, the smoke test) keeps working
 * because a non-reference value falls through unchanged. Every read of a
 * volatile field goes through here — a raw read would compare and render the
 * reference object instead of the value behind it.
 * @param {object} config - the object the field lives on.
 * @param {string} field - field name.
 * @returns {unknown} the field's current value, or undefined when it carries none.
 */
function readField(config, field) {
  const value = config?.[field]
  return value !== null && typeof value === 'object' && typeof value.get === 'function'
    ? value.get()
    : value
}

/**
 * Mark one field volatile when the resolved schemastery supports it.
 *
 * The marker is what puts the field into the 0.1.7 settings document, and what
 * makes the Host hand `apply` a live reference instead of a frozen value. The
 * 0.1.5 schemastery has no `volatile` method at all, so the call is probed:
 * an unconditional `.volatile()` would throw there and take the plugin down.
 * @param {object} field - the field schema to mark.
 * @returns {object} the marked schema, or the field unchanged on an older host.
 */
function volatileField(field) {
  if (typeof field.volatile === 'function') return field.volatile()
  if (typeof field.extra === 'function') return field.extra('volatile', true)
  if (field && typeof field === 'object') {
    field.meta = { ...field.meta, volatile: true }
    return field
  }
  return field
}

/**
 * Settings namespace owning the user-editable section of this plugin
 * (lowercase kebab-case; paired with the same key on the web settings card).
 * On DSH >= 0.1.5-rc.x a namespace is a plain string. On 0.1.7 the settings
 * document is keyed by profile entry id instead, which this plugin's
 * cordis.patch.yml spells as the same `session-head-prompt`.
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

/** The assembly registry this plugin contributes to, plus the card's settings face. */
export const inject = ['systemPrompt', 'webServer']

/**
 * Plugin configuration: whether injection is on, and the prompt text.
 * @typedef {object} Config
 * @property {boolean} [enabled] Master switch; disabled sections render nothing.
 * @property {string} [prompt]   Text injected at the head of every session's system prompt.
 */

/** Runtime schema for the row and the settings namespace (defaults included). */
export const Config = z.object({
  enabled: volatileField(z.boolean().default(true)),
  prompt: volatileField(z.string().default('')),
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
 * Whether a value equals the schema default.
 *
 * Deep, and it has to be: `[]` and `[]` are two array literals, so `!==`
 * reports every array field as a real override — which silently erased a
 * user's disabled-model list on the boot after the migration. Configuration
 * values are JSON-shaped, so a canonical-JSON comparison is exact here.
 */
function isDefaultValue(value, fallback) {
  if (value === fallback) return true
  if (typeof value !== typeof fallback) return false
  if (value === null || fallback === null || typeof value !== 'object') return false
  try {
    return JSON.stringify(value) === JSON.stringify(fallback)
  } catch {
    return false
  }
}

/**
 * Delete this plugin's own keys from the profile entry config, leaving every
 * other key of the row untouched.
 *
 * One-time, right after the settings file has been seeded: the entry returns to
 * its shipped state, so no second source of truth remains. The change callback
 * returns INHERITED plus the row's foreign keys, not "the row minus our keys":
 * the profile's composition check (`isDeepStrictEqual(next, inherited)`) is
 * what lets the editor drop the row's user layer entirely, and a hand-built
 * `{}` fails that check whenever a bundle layer still carries a config for this
 * entry. Returning inherited makes the check pass either way.
 *
 * RETRIES, deliberately: `configEditor.edit` writes under the profile's
 * package.json lock, and every plugin migrating on the same boot contends for
 * that ONE lock — four sibling plugins seeding at once measured exactly one
 * winner and three "timed out waiting for the writer lock" failures. The write
 * is idempotent, so backing off (with jitter, so the four do not retry in
 * lockstep) is what makes the rest land.
 *
 * @param {import('@deepseek-ai/cordis').Context} ctx - plugin context.
 * @param {object} entryConfig - the entry config as the Host handed it over.
 * @returns {Promise<void>} resolves once the cleanup landed or was skipped.
 */
/**
 * When the profile tree last recomposed, module-level so every apply sees it.
 *
 * The legacy settings.yaml import writes the profile patch one section at a
 * time for seconds after the Loader settles, emitting this event on every
 * write. Cleaning up our row in that window is futile — the import's next
 * section simply writes it back — so the cleanup waits for the tree to fall
 * quiet first.
 */
let lastConfigReloadAt = Date.now()

/**
 * Wait until the profile tree has been quiet for a while (the legacy import
 * finished), or the deadline passes.
 * @returns {Promise<void>} resolves when it is quiet, or on the deadline.
 */
async function waitForProfileQuiet() {
  const deadline = Date.now() + 120_000
  for (;;) {
    const since = Date.now() - lastConfigReloadAt
    if (since >= 5_000) return
    if (Date.now() >= deadline) return
    await new Promise(resolve => setTimeout(resolve, 1_000))
  }
}

async function cleanupEntryConfig(ctx, entryConfig) {
  const attempts = 10
  for (let attempt = 0; attempt < attempts; attempt++) {
    try {
      // The legacy settings.yaml import writes this same profile patch, one
      // section at a time, for seconds after the Loader settles — and it holds
      // the very lock this cleanup needs. Wait for that write storm to end
      // before the first attempt, then back off between retries.
      if (attempt === 0) await waitForProfileQuiet()
      else await new Promise(resolve => setTimeout(resolve, 2_000 + Math.random() * 1_000))
      // 0.1.7: edit the profile row, dropping only this plugin's keys.
      //
      // configEditor is probed on two paths — this ctx (the 0.1.7 idiom), then
      // the settings service's ownerContext, where the Host keeps it. A plugin
      // ctx that never injected the service answers undefined (or throws) on
      // the first path, which is why the second one exists.
      const own = typeof ctx.get === 'function'
        ? (() => { try { return ctx.get('configEditor') } catch { return undefined } })()
        : undefined
      const editor = own ?? await new Promise(resolve => {
        ctx.inject(['settings'], settingsCtx => {
          const owner = settingsCtx.settings?.ownerContext
          const viaOwner = typeof owner?.get === 'function'
            ? (() => { try { return owner.get('configEditor') } catch { return undefined } })()
            : undefined
          resolve(viaOwner)
        })
      })
      const entry = ctx.fiber?.entry
      if (editor !== undefined && entry !== undefined) {
        await editor.edit(entry, (raw, inherited) => {
          const next = { ...(inherited ?? {}) }
          for (const [key, value] of Object.entries(raw ?? {})) {
            if (OWN_KEYS.includes(key)) continue
            if (!Object.hasOwn(next, key)) next[key] = value
          }
          return next
        })
        return
      }
      // 0.1.5: rebuild the namespace's user layer from the foreign keys only.
      await new Promise((resolve) => {
        ctx.inject(['settings'], (settingsCtx) => {
          const settings = settingsCtx.settings
          if (typeof settings?.replace !== 'function') { resolve(); return }
          const keep = Object.fromEntries(
            Object.entries(entryConfig).filter(([key]) => !OWN_KEYS.includes(key)),
          )
          Promise.resolve(settings.replace(SETTINGS_NAMESPACE, keep))
            .catch(() => {})
            .then(resolve)
        })
      })
      return
    } catch (error) {
      // A failed cleanup must never take the host down: the store file is the
      // live source already, the row simply keeps its migrated values.
      if (attempt === attempts - 1) {
        ctx.logger?.warn?.('session-head-prompt: entry config cleanup failed', error)
        return
      }
      await new Promise(resolve => setTimeout(resolve, 500 * (attempt + 1) + Math.random() * 500))
    }
  }
}

/** Loopback guard for the settings face (the Host's own rule for plugin routes). */
function trustedRequest(req) {
  const host = req.headers.host ?? ''
  const origin = req.headers.origin
  if (!/^(localhost|127(?:\.\d{1,3}){3}|\[::1\])(?::\d+)?$/i.test(host)) return false
  return origin === undefined || /^https?:\/\/(localhost|127(?:\.\d{1,3}){3}|\[::1\])(?::\d+)?$/i.test(origin)
}

/** Read the JSON request body, or undefined when it is absent or oversized. */
function readBody(req) {
  return new Promise((resolve) => {
    let body = ''
    req.on('data', (chunk) => {
      body += chunk
      if (body.length > 1e6) { resolve(undefined); req.destroy() }
    })
    req.on('end', () => resolve(body))
    req.on('error', () => resolve(undefined))
  })
}

/** JSON response helper. */
function json(res, status, body) {
  const payload = JSON.stringify(body)
  res.writeHead(status, { 'Content-Type': 'application/json' })
  res.end(payload)
}

/**
 * Register the settings face (GET/POST) the browser card talks to.
 *
 * The key is minted per plugin lifetime and rides the GET response — that
 * response already passed the loopback guard, exactly like the probe routes of
 * the sibling plugins. The POST authorizes with it in a header, validates the
 * patch against the same rule the schema used to enforce (no complete `{{…}}`
 * group in the prompt), writes the store, and answers with the new view.
 *
 * @param {import('@deepseek-ai/cordis').Context} ctx - plugin context.
 * @param {SettingsStore} store - this plugin's settings store.
 * @returns {void}
 */
function registerSettingsFace(ctx, store) {
  ctx.inject(['webServer'], (webCtx) => {
    const server = webCtx.webServer
    if (server === undefined) return
    webCtx.effect(() => {
      const key = randomBytes(24).toString('hex')
      /** The document both routes answer with. */
      const view = () => ({
        key,
        value: {
          enabled: store.value('enabled', true),
          prompt: store.value('prompt', ''),
        },
        base: { enabled: true, prompt: '' },
        user: store.values(),
      })
      const dispose = server.register({
        kind: 'exact',
        path: `${ROUTE_BASE}/settings`,
        handler: async (req, res) => {
          if (!trustedRequest(req)) { json(res, 403, { error: 'request-not-trusted' }); return }
          if (req.method === 'GET') { json(res, 200, view()); return }
          if (req.method !== 'POST') { json(res, 405, { error: 'method not allowed' }); return }
          if (req.headers['x-session-prompt-key'] !== key) { json(res, 403, { error: 'invalid-key' }); return }
          const body = await readBody(req)
          if (body === undefined) { json(res, 413, { error: 'body too large' }); return }
          let patch
          try { patch = JSON.parse(body || '{}') } catch { json(res, 400, { error: 'invalid json' }); return }
          // Validate exactly what the 0.1.5 namespace validator used to: a
          // complete `{{…}}` group would break the prompt renderer on the next
          // request, so the write that would produce it is refused here.
          if (Object.hasOwn(patch, 'prompt')) {
            const prompt = patch.prompt
            if (prompt !== null && (typeof prompt !== 'string' || COMPLETE_GROUP.test(prompt))) {
              json(res, 400, { error: 'invalid prompt' }); return
            }
          }
          if (Object.hasOwn(patch, 'enabled') && patch.enabled !== null && typeof patch.enabled !== 'boolean') {
            json(res, 400, { error: 'invalid enabled' }); return
          }
          // A card write: the file holds live user edits from here on.
          store.patch(patch, true)
          json(res, 200, view())
        },
      })
      return () => { dispose() }
    }, 'session-head-prompt: settings face')
  })
}

/**
 * Register the settings namespace (with the composition entry as the base
 * layer) and the head prompt section whose text follows the effective
 * settings on every assembly.
 * @param {import('@deepseek-ai/cordis').Context} ctx - plugin context carrying
 *   the injected systemPrompt service.
 * @param {Config} config - the composition entry config, used as the settings base
 *   (on 0.1.7 the entry's volatile fields arrive as live references).
 */
export function apply(ctx, config) {
  // The plugin-owned store: read once at apply (the file is tiny and the
  // section provider is synchronous).
  //
  // SEED RULE — per field, highest priority first:
  //   1. the file already holds it AND the card has written this file
  //      (`edited` true) → keep the file: a runtime edit is never regressed;
  //   2. the entry carries a NON-DEFAULT value → take the entry: that is a
  //      value written on 0.1.7 (the settings page, or a profile edit), and it
  //      is newer than anything the 0.1.5 document holds;
  //   3. the legacy settings document holds a NON-DEFAULT value for it → take
  //      that: the platform refuses sections whose names are not profile entry
  //      ids, so this plugin's 0.1.5 values can survive only there;
  //   4. otherwise keep what the file already has (its first seed, which is
  //      the schema default on a fresh profile).
  //
  // Legacy sits BELOW the entry (a 0.1.7 re-configuration wins over the 0.1.5
  // document) and ABOVE the file's first-seed default (a fresh install
  // recovers the old settings). Reading the document also makes the seed
  // independent of the platform import's timing: that import commits through
  // the loader's volatile fast path, which never re-runs apply() — this reads
  // the file directly instead of waiting for a second apply.
  const store = new SettingsStore()
  const legacy = readLegacySections(LEGACY_NAMESPACES)
  const seeded = {}
  for (const key of OWN_KEYS) {
    const entryValue = readField(config, key)
    const legacyValue = legacy === undefined ? undefined : legacy[key]
    const holds = Object.hasOwn(store.user, key)
    if (!holds) {
      // First seed — the first NON-DEFAULT candidate, entry before legacy, and
      // only then an explicit default so the stored layer stays complete. A
      // schema default (an empty prompt, an empty array) is NOT a value to seed
      // on: seeding it here is what starved the legacy layer — the only
      // surviving copy of this plugin's 0.1.5 settings.
      if (entryValue !== undefined && !isDefaultValue(entryValue, DEFAULT_FOR_FIELD[key])) seeded[key] = entryValue
      else if (legacyValue !== undefined && !isDefaultValue(legacyValue, DEFAULT_FOR_FIELD[key])) seeded[key] = legacyValue
      else if (entryValue !== undefined) seeded[key] = entryValue
      else if (legacyValue !== undefined) seeded[key] = legacyValue
      continue
    }
    if (store.edited) continue
    if (entryValue !== undefined && !isDefaultValue(entryValue, DEFAULT_FOR_FIELD[key])) {
      seeded[key] = entryValue
      continue
    }
    if (legacy !== undefined && legacy[key] !== undefined && !isDefaultValue(legacy[key], DEFAULT_FOR_FIELD[key])) {
      seeded[key] = legacy[key]
    }
  }
  if (Object.keys(seeded).length > 0) {
    store.patch(seeded)
    void cleanupEntryConfig(ctx, config)
  }
  // A volatile-only configuration change — which is what the legacy
  // settings.yaml import performs, because every field of this plugin's Config
  // is .volatile() — commits through the loader's volatile fast path: the
  // references are updated IN PLACE and apply() is NOT run again. Seeding only
  // inside apply() would therefore never observe values that arrive that way
  // (measured: the import landed 16 s after the first apply and the file kept
  // its pre-import default). This event fires on exactly that commit, so the
  // seed rule re-evaluates — the same mechanism the built-in dsh-llm-pi-ai
  // uses to recompute its registration facts.
  ctx.on('loader/volatile-update', () => { migrateOwnSettings() })
  // Every profile recomposition — including each section the legacy import
  // writes — refreshes this stamp, which is what {@link waitForProfileQuiet}
  // reads before cleaning our row up.
  ctx.on('app-boot/config-reload', () => { lastConfigReloadAt = Date.now() })

  registerSettingsFace(ctx, store)

  // The section text reads the store per assembly, so a write from the card
  // applies on the next request — no re-registration, no restart.
  const effective = () => ({
    enabled: store.value('enabled', true),
    prompt: store.value('prompt', ''),
  })

  ctx.systemPrompt.section({
    name: HEAD_SECTION,
    order: HEAD_ORDER,
    // Evaluated at every assembly: empty text is dropped by the renderer, so
    // toggling the switch or editing the prompt applies live.
    text: () => {
      const settings = effective()
      return settings.enabled !== false && typeof settings.prompt === 'string' && settings.prompt !== ''
        ? settings.prompt
        : ''
    },
  })
}