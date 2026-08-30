/**
 * Shared type contracts of the card: the settings section shape, the card's
 * snapshot projection, and the injected business face.
 */

import type { SnapshotStore } from '@deepseek-ai/dsh-client-store'
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
 * The registration-side face the card's slot entry injects: the staged-form
 * actions plus the snapshot store the renderer binds as `useHeadPromptCard`.
 */
export interface HeadPromptCardFace extends CardActions {
  hooks: {
    headPromptCard: SnapshotStore<HeadPromptCardState>
  }
}