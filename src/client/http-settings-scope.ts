/**
 * Plugin-owned settings scope over the host's settings face.
 *
 * The 0.1.7 write path persists every settings change through the profile
 * patch (`configEditor.edit`), which reconciles the whole loader tree, reloads
 * the plugin fiber (~1–1.5 s), and refreshes every client mirror — so a card
 * that toggles one switch pays a full tree recompose, and a card that saves
 * nine fields pays it nine times (each intermediate snapshot then overwrites
 * the form the user is still typing in).
 *
 * This plugin now owns its settings in `<profile>/.dsh-session-prompt/
 * settings.json` and serves them over a loopback route the browser card talks
 * to. This module is the browser half of that contract: it implements the same
 * `SettingsScope` surface `CardForm` was written against (snapshot, subscribe,
 * set, unset), so the staged-edit form needs no change at all.
 */

import type { SettingsScope, SettingsSnapshot } from './card-form.ts'
import type { HeadPromptSettings } from './types.ts'

/** Base path of the host half's settings face. */
const ROUTE_BASE = '/plugins/dsh-session-prompt'

/** The document the host's GET and POST answer with. */
interface SettingsFaceDocument {
  /** Write authorizer, minted per host plugin lifetime. */
  key: string
  /** Effective values (user layer over the schema defaults). */
  value: HeadPromptSettings
  /** The schema defaults the host serves. */
  base: HeadPromptSettings
  /** The user layer exactly as stored (presence marks an override). */
  user: Partial<HeadPromptSettings>
}

/**
 * Fetch one settings face document.
 * @param init - the request init (method, headers, body).
 * @returns the parsed document.
 * @throws when the transport or the host refuses the request.
 */
async function request(init: RequestInit): Promise<SettingsFaceDocument> {
  const response = await fetch(`${ROUTE_BASE}/settings`, {
    credentials: 'same-origin',
    ...init,
  })
  const value: unknown = await response.json().catch(() => undefined)
  if (!response.ok) {
    const error = typeof value === 'object' && value !== null && 'error' in value
      ? String((value as Record<string, unknown>)['error'])
      : `HTTP ${response.status}`
    throw new Error(error)
  }
  if (typeof value !== 'object' || value === null || !('value' in value)) {
    throw new Error('session-head-prompt: settings face answered an invalid document')
  }
  return value as SettingsFaceDocument
}

/**
 * The scope the card was written against, backed by this plugin's own file.
 *
 * A write optimistically adopts the value it just sent, then confirms with the
 * host's answer (which is authoritative: it re-reads the file it wrote), so the
 * staged form never renders a value the host does not hold.
 */
export class OwnSettingsScope implements SettingsScope<HeadPromptSettings> {
  private document: SettingsFaceDocument | undefined
  private readonly listeners = new Set<() => void>()

  /**
   * Load the current document. Call once before the form binds; repeated calls
   * are harmless and re-read the host.
   * @returns the effective values.
   */
  async load(): Promise<HeadPromptSettings> {
    this.document = await request({ headers: { accept: 'application/json' } })
    for (const listener of this.listeners) listener()
    return this.document.value
  }

  /** @returns the stable snapshot the form reads (ready once loaded). */
  getSnapshot(): SettingsSnapshot<HeadPromptSettings> {
    const document = this.document
    if (document === undefined) {
      return {
        status: 'loading',
        mode: 'live',
        writable: true,
        revision: 0,
        value: { enabled: true, prompt: '' },
        base: { enabled: true, prompt: '' },
        user: {},
      }
    }
    return {
      status: 'ready',
      mode: 'live',
      writable: true,
      revision: this.revision,
      value: document.value,
      base: document.base,
      user: document.user as HeadPromptSettings,
    }
  }

  /** Local write fence, mirroring the host's revision discipline. */
  private revision = 1

  /** @param listener - invoked after every snapshot change. @returns the disposer. */
  subscribe(listener: () => void): () => void {
    this.listeners.add(listener)
    return () => { this.listeners.delete(listener) }
  }

  /**
   * Write one field.
   * @param field - field name inside the settings document.
   * @param value - the JSON-shaped value to store.
   * @returns whether the host accepted the write.
   */
  async set(field: string, value: unknown): Promise<boolean> {
    return this.patch({ [field]: value })
  }

  /**
   * Clear one field: the value falls back to the schema default.
   * @param field - field name inside the settings document.
   * @returns whether the host accepted the clear.
   */
  async unset(field: string): Promise<boolean> {
    return this.patch({ [field]: null })
  }

  /** Send one patch and adopt the host's answer. */
  private async patch(patch: Record<string, unknown>): Promise<boolean> {
    const key = this.document?.key
    if (key === undefined) return false
    try {
      this.document = await request({
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Session-Prompt-Key': key,
        },
        body: JSON.stringify(patch),
      })
      this.revision += 1
      for (const listener of this.listeners) listener()
      return true
    } catch {
      return false
    }
  }
}
