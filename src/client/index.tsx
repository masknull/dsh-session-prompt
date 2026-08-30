/**
 * Session head prompt — browser half. Registers the settings card into the
 * shared "Plugin configuration" tab, keyed by this plugin's settings
 * namespace; the Host pairs the two without ever learning what the namespace
 * means. The card reads and writes through `ctx.settingsScope`, which fences
 * each write with the revision it read.
 */

import type { Context } from '@deepseek-ai/cordis'
import type { SnapshotStore } from '@deepseek-ai/dsh-client-store'
import type { SettingsScope } from '@deepseek-ai/dsh-client-ui-settings/client'
import { createSnapshotStore } from '@deepseek-ai/dsh-client-store'
// Type-only: the ctx.settingsScope Context merge (cross-plugin value imports
// are forbidden; type-only imports are erased before resolution).
import type {} from '@deepseek-ai/dsh-client-ui-settings/client'
// Type-only: the ctx.locale Context merge.
import type {} from '@deepseek-ai/dsh-client-locale/client'
import { booleanField, textField, CardForm } from './card-form.ts'
import type { CardActions, CardShell } from './card-form.ts'
import { LOCALE_NS, en, zh } from './locales.ts'
import { HeadPromptCard, CARD_CSS } from './Card.tsx'
import type { HeadPromptCardState, HeadPromptSettings } from './types.ts'

export type { HeadPromptCardProps } from './Card.tsx'
export type { HeadPromptCardFace, HeadPromptCardState, HeadPromptSettings } from './types.ts'
export type { CardActions, CardShell } from './card-form.ts'
export { LOCALE_NS } from './locales.ts'

/**
 * Settings namespace this card edits. Spelled here rather than imported from
 * the Host package: a client package must not depend on a Host package.
 */
export const SETTINGS_NS = 'session-head-prompt'

/** Required services. */
export const inject = ['slots', 'locale', 'settingsScope']

/** Bridges the settings scope onto the card's staged form. */
class HeadPromptCardController {
  private readonly form: CardForm<HeadPromptSettings>
  private readonly store: SnapshotStore<HeadPromptCardState>

  /** @param scope - the bound settings scope for this card's namespace. */
  constructor(scope: SettingsScope<HeadPromptSettings>) {
    this.form = new CardForm(scope, [booleanField('enabled'), textField('prompt')])
    this.store = this.form.bind(() => this.project())
  }

  private project(): HeadPromptCardState {
    return {
      ...this.form.shell(),
      enabled: this.form.field('enabled'),
      prompt: this.form.field('prompt'),
    }
  }

  /** Build the face the card's slot registration injects. */
  inject() {
    return {
      hooks: { headPromptCard: this.store },
      ...this.form.actions(),
    }
  }
}

/**
 * Mount the settings card.
 * @param ctx - the browser plugin context.
 */
export function apply(ctx: Context): void {
  // The card draws its own chrome; install its stylesheet for this fiber's
  // lifetime (removal is covered by the effect disposer).
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
  const controller = new HeadPromptCardController(
    ctx.settingsScope.bind<HeadPromptSettings>({ namespace: SETTINGS_NS }),
  )
  ctx.slots.inject('settings.plugin.item', () => ctx.slots.register({
    name: 'settings.plugin.item',
    key: SETTINGS_NS,
    locale: LOCALE_NS,
    inject: () => controller.inject(),
  }, HeadPromptCard))
}