/**
 * Session head prompt — browser half. Registers the settings card into
 * whichever settings surface the Host offers: the 0.1.5 plugins tab's keyed
 * `settings.plugin.item` slot, or the shared "Plugin settings" block of the
 * 0.1.7 settings page (see ./plugin-settings-section.tsx). The card reads and
 * writes through the Host's settings controller — `settingsScope` on 0.1.5,
 * `configForms` on 0.1.7 — which fences each write with the revision it read.
 */

import type { Context } from '@deepseek-ai/cordis'
// Type-only: the ctx.locale Context merge.
import type {} from '@deepseek-ai/dsh-client-locale/client'
// Type-only: the 0.1.5 `settings.plugin.item` keyed slot declaration (the 0.1.5
// path registers into that key; cross-plugin value imports are forbidden).
import type {} from '@deepseek-ai/dsh-client-ui-settings-plugins/client'
import { booleanField, textField, CardForm } from './card-form.ts'
import type { CardShell, SettingsScope } from './card-form.ts'
import { OwnSettingsScope } from './http-settings-scope.ts'
import { LOCALE_NS, en, zh } from './locales.ts'
import { HeadPromptCard, CARD_CSS } from './Card.tsx'
import { setPromptCardState } from './prompt-settings-store.ts'
import {
  SHARED_SECTION_ID,
  SHARED_SECTION_LABEL,
  SHARED_SECTION_ORDER,
  SHARED_SECTION_SLOT,
  SharedPluginSettingsSection,
} from './plugin-settings-section.tsx'
import { SHARED_ITEM_SLOT } from './plugin-settings-section.tsx'
import type { SharedItemComponent } from './plugin-settings-section.tsx'
import type { HeadPromptCardFace, HeadPromptCardState, HeadPromptSettings } from './types.ts'

export type { HeadPromptCardProps } from './Card.tsx'
export type { HeadPromptCardFace, HeadPromptCardState, HeadPromptSettings } from './types.ts'
export type { CardActions, CardShell, SettingsScope, SettingsSnapshot } from './card-form.ts'
export { LOCALE_NS } from './locales.ts'
export { SHARED_ITEM_SLOT, SHARED_SECTION_ID, SHARED_SECTION_SLOT } from './plugin-settings-section.tsx'

/**
 * Settings namespace this card edits on 0.1.5. Spelled here rather than imported
 * from the Host package: a client package must not depend on a Host package.
 */
export const SETTINGS_NS = 'session-head-prompt'

/**
 * Package name: the id this plugin registers its card under inside the shared
 * block's child slot (every attached plugin owns exactly one such id).
 */
export const PACKAGE_ID = 'dsh-session-prompt'

/**
 * Profile entry id the 0.1.7 settings form is addressed by.
 *
 * On 0.1.7 a plugin's settings namespace IS its profile entry id (the Loader row
 * id): the Host keys every served form by `entry.options.id` and resolves a
 * write with `configEditor.entries().find((row) => row.options.id === ns)`, and
 * the built-in cards follow the same rule (their keys are the row ids
 * `bash-sandbox`, `pwsh-sandbox`, `ui-conversation` — not package names). This
 * plugin's row is declared in ./cordis.patch.yml as `id: session-head-prompt`,
 * which is also the namespace the 0.1.5 half registers, so both versions edit
 * one and the same section. Asking for any other id (the package name included)
 * answers "No configurable plugin entry".
 */
export const ENTRY_ID = 'session-head-prompt'

/** Bridges the settings scope onto the card's staged form. */
class HeadPromptCardController {
  private readonly form: CardForm<HeadPromptSettings>

  /** @param scope - the settings scope for this card (plugin-owned on both hosts). */
  constructor(private readonly scope: SettingsScope<HeadPromptSettings>) {
    this.form = new CardForm(scope, [booleanField('enabled'), textField('prompt')])
    // The card reads its state from the module store (see
    // ./prompt-settings-store.ts) with a plain `useSyncExternalStore` call, so
    // the form's projection is mirrored into that store on every publish rather
    // than handed to the renderer as an inject-face hook.
    const store = this.form.bind(() => this.project())
    setPromptCardState(store.getSnapshot())
    store.subscribe(() => { setPromptCardState(store.getSnapshot()) })
  }

  private project(): HeadPromptCardState {
    return {
      ...this.form.shell(),
      enabled: this.form.field('enabled'),
      prompt: this.form.field('prompt'),
    }
  }

  /** Build the face the card's slot registration injects (plain props only). */
  inject(t: HeadPromptCardFace['t']): HeadPromptCardFace {
    return { t, ...this.form.actions() }
  }
}

// Unified Qoder & WorkBuddy proven pattern
export const inject = ['slots', 'locale']

/**
 * Mount the settings card.
 * @param ctx - the browser plugin context.
 */
export function apply(ctx: Context): void {
  ctx.effect(() => {
    const tag = document.createElement('style')
    tag.dataset.plugin = 'dsh-session-head-prompt'
    tag.textContent = CARD_CSS
    document.head.appendChild(tag)
    return () => { tag.remove() }
  }, 'session-head-prompt: card stylesheet')

  ctx.effect(
    () => ctx.locale.register(LOCALE_NS, { zh, en }),
    'session-head-prompt: card dictionaries',
  )

  // 诊断：槽位渲染器把「条目渲染崩溃」送到 onEntryError 监督通道，而它自己的
  // 报错文本是 `slot entry crashed in '<slot>'` —— 不带本插件前缀，很容易在
  // 控制台按插件名过滤时被漏掉，从而表现为「section 在、卡片凭空消失」
  // （渲染器对崩溃条目的处理是 abdicate：从投影里永久剔除）。
  // 这里把该通道转成带前缀的 error，让崩溃一眼可见。
  const supervision = ctx.slots as unknown as {
    onEntryError?: (fn: (key: string, entry: unknown, error: unknown, info: { abdicated?: boolean }) => void) => () => void
  }
  if (typeof supervision.onEntryError === 'function') {
    ctx.effect(
      () => supervision.onEntryError!((key, entry, error, info) => {
        const id = (entry as { options?: { id?: string; key?: string } } | undefined)?.options
        const owner = id?.id ?? id?.key ?? '(unknown)'
        if (key === SHARED_ITEM_SLOT || key === SHARED_SECTION_SLOT || owner === PACKAGE_ID || owner === SETTINGS_NS) {
          console.error(
            '[dsh-session-prompt] ENTRY CRASHED slot=', key, 'owner=', owner,
            'abdicated=', info?.abdicated === true, 'cause=', error,
          )
        }
      }),
      'session-head-prompt: entry-crash supervision',
    )
  }

  // The card's scope is adopted once (plugin-owned on both host lines), so the
  // unused-host branches of registerCard are gone: the shared block's child slot
  // is this plugin's only surface now. The 0.1.5 plugins tab reads the same
  // scope through the host half's settings face — on that line the plugin row
  // keeps its namespace, and the own-file store answers both.
  let promptController: HeadPromptCardController | undefined
  const adoptScope = (scope: SettingsScope<HeadPromptSettings>) => {
    promptController = new HeadPromptCardController(scope)
  }

  const registerCard = (slot: 'settings.plugin.item' | 'plugin-settings.item'): (() => void) => {
    // The face is fixed at registration time (plain props only, no hooks): the
    // two sibling connect plugins whose cards render on this Host pass their
    // translator and actions the same way, and a stable prop shape is what keeps
    // the card's Hook order constant across renders.
    const localeFace = ctx.locale as unknown as { bind?: (ns: string) => HeadPromptCardFace['t'] }
    const t: HeadPromptCardFace['t'] = typeof localeFace.bind === 'function'
      ? localeFace.bind.call(ctx.locale, LOCALE_NS)
      : key => key
    const getInject = () => (promptController
      ? promptController.inject(t)
      : {
          t,
          edit: () => {},
          resetField: () => {},
          save: () => {},
          discard: () => {},
        })

    if (slot === 'settings.plugin.item') {
      return ctx.slots.inject(slot, () => ctx.slots.register({
        name: slot,
        key: SETTINGS_NS,
        priority: 50,
        inject: getInject,
      }, HeadPromptCard))
    }

    return ctx.slots.inject(slot, () => ctx.slots.register({
      name: slot,
      id: PACKAGE_ID,
      // 《插件设置》卡片统一排位（列表按 order 升序渲染）：
      // session-prompt 10 / workbuddy 20 / qoder 30 —— 本卡排最前。
      order: 10,
      inject: getInject,
    }, HeadPromptCard as unknown as SharedItemComponent))
  }

  // 幂等防护：卡片在子槽位里的注册只能发生一次。重复 register 同 id 会在
  // slots.inject 的 declaration effect 里同步抛错，进而杀死整个插件 fiber
  // （表现为宿主报 dsh-session-prompt: failed，卡片被整体撤下）。
  let joined = false
  const joinSharedSettingsBlock = (): void => {
    if (joined) return
    joined = true
    ctx.slots.inject(SHARED_SECTION_SLOT, () => {
      let disposeContainer: (() => void) | undefined
      const claimed = ctx.slots.entries(SHARED_SECTION_SLOT)
        .some(entry => entry.options?.id === SHARED_SECTION_ID)
      if (!claimed) {
        try {
          disposeContainer = ctx.slots.register({
            name: SHARED_SECTION_SLOT,
            id: SHARED_SECTION_ID,
            order: SHARED_SECTION_ORDER,
            label: () => SHARED_SECTION_LABEL,
            children: { [SHARED_ITEM_SLOT]: { kind: 'list', scope: 'root' } },
          }, SharedPluginSettingsSection)
        } catch (error: unknown) {
          console.error('[dsh-session-prompt] shared block container registration failed:', error)
        }
      }
      const disposeItem = registerCard(SHARED_ITEM_SLOT)
      return () => {
        disposeItem()
        disposeContainer?.()
      }
    })
  }

  // 插件自有配置（<profile>/.dsh-session-prompt/settings.json）：两条宿主线的
  // 读写都走宿主半的 settings face，不再经过 settingsScope / configForms。
  // 0.1.7 的 configForms 写入会整树 reconcile + fiber 热重载（每次约 1~1.5 秒，
  // 且每次保存都刷新所有客户端镜像），自有文件写入是本地毫秒级原子写。
  // 卡片注册无条件进行：scope 在启动时载入，迟到也不会漏掉 UI。
  const ownScope = new OwnSettingsScope()
  void ownScope.load().catch(() => {})
  adoptScope(ownScope as unknown as SettingsScope<HeadPromptSettings>)
  joinSharedSettingsBlock()
}
