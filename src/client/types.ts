/**
 * Shared type contracts of the card: the settings section shape, the card's
 * snapshot projection, and the injected business face.
 */

import type { CardActions, CardFieldState, CardShell } from './card-form.ts'

/** The host useEffect the card edits. Kept typed here rather than copied from the Host package. */
export interface HeadPromptSettings {
  /** Master switch; disabled sections render nothing. */
  enabled?: boolean
  /** Text injected at the head of every session's system prompt. */
  prompt?: string
}

/** What the card renders. */
export interface HeadPromptCardState extends CardShell {
  /** Master-switch control state (draft text 'true'/'false'). */
  enabled: CardFieldState
  /** Prompt-text control state. */
  prompt: CardFieldState
}

/**
 * The registration-side face the card's slot entry injects.
 *
 * Plain props only — no `hooks` compartment. The card's state travels through
 * the module store (`./prompt-settings-store.ts`) with a
 * `useSyncExternalStore` call inside the component, the same shape the sibling
 * connect plugins use for their cards on this Host; a renderer-bound hook here
 * made the hook call conditional and crashed the entry (see the store module).
 */
export interface HeadPromptCardFace extends CardActions {
  /** Translator bound to this card's locale namespace by the registering half. */
  t: (key: string, params?: Record<string, unknown>) => string
}
