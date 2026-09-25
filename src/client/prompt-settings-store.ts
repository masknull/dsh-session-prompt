/**
 * Module-level state store for the settings card.
 *
 * The card reads its state through this store with a plain
 * `useSyncExternalStore(subscribe, getSnapshot)` call in the component, rather
 * than through a hook handed in by the slot renderer's `inject` face. Two
 * reasons, both learned the hard way on 0.1.7:
 *
 *  - an inject-face hook (`props.useHeadPromptCard`) has to be called
 *    unconditionally to satisfy React's rules, and a face without the hook made
 *    the call conditional — the resulting hook-count mismatch crashed the entry
 *    on a later render, and the slot renderer responds to a crash by abdicating
 *    the entry, which removes the card from the list for the rest of the
 *    session (the section stays, the card is gone);
 *  - the two sibling connect plugins whose cards render fine on this Host bind
 *    their state exactly this way (a module store read with
 *    `useSyncExternalStore`), and the inject face carries plain props only.
 *
 * Writing the state is the controller's job (see `index.tsx`): it mirrors the
 * staged form's snapshot into this store whenever the form publishes.
 */

import type { HeadPromptCardState } from './types.ts'

/** State before the Host serves this namespace. */
const INITIAL_STATE: HeadPromptCardState = {
  available: false,
  writable: false,
  dirty: false,
  invalid: false,
  saving: false,
  failed: false,
  enabled: { text: 'false', overridden: false, invalid: false },
  prompt: { text: '', overridden: false, invalid: false },
}

let state: HeadPromptCardState = INITIAL_STATE
const listeners = new Set<() => void>()

/**
 * Read the current card state.
 * @returns the latest snapshot (a stable reference until the next publish).
 */
export function promptCardState(): HeadPromptCardState {
  return state
}

/**
 * Observe card-state publishes.
 * @param listener - called after each publish.
 * @returns the unsubscribe function.
 */
export function subscribePromptCard(listener: () => void): () => void {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

/**
 * Publish a new card state.
 * @param next - the projection the controller just built.
 */
export function setPromptCardState(next: HeadPromptCardState): void {
  state = next
  for (const listener of [...listeners]) listener()
}
