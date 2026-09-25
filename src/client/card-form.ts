/**
 * Compact staged form model for the settings card.
 *
 * Mirrors the semantics of the Host plugins settings section's shared form
 * (which this card cannot import at value: cross-plugin value imports are
 * forbidden by the client bundle purity rules): the card stages what the user
 * types and writes it only on save, through a revision-fenced settings scope.
 * A field shows its effective value — the user layer over the composition
 * layer over the schema default — and whether the user layer carries it
 * (presence, not value equality, marks an override).
 */

import { createSnapshotStore, type SnapshotStore } from '@deepseek-ai/dsh-client-store'

/**
 * One namespace's state as the Host serves it.
 *
 * Spelled structurally rather than imported: 0.1.5 serves it from
 * `ctx.settingsScope` (a namespace the plugin registers), 0.1.7 from
 * `ctx.configForms` (a profile entry), and both answer the same fields — so the
 * form below needs one shape instead of a type from a specific Host version
 * (a client bundle may not depend on a Host package anyway).
 */
export interface SettingsSnapshot<T> {
  /** `'ready'` once the Host serves this namespace; anything else means it is not served (yet). */
  status: string
  /** Effective value: the user layer over the composition layer over the schema default. */
  value: T | undefined
  /** The composition layer the user layer starts from. */
  base: T | undefined
  /** Raw user layer; presence of a field, not value equality, marks an override. */
  user: T | undefined
  /** Host revision the last read answered; writes are fenced with it. */
  revision: number | undefined
  /** Whether the Host document accepts writes. */
  writable: boolean
  /** Persistence mode the Host answered with. */
  mode: string
}

/** The settings controller face both Host versions answer. */
export interface SettingsScope<T> {
  /** Current synchronous snapshot (stable reference until the next change). */
  getSnapshot(): SettingsSnapshot<T>
  /** Observe snapshot replacements. */
  subscribe(listener: () => void): () => void
  /** Queue one field write. */
  set(field: string, value: unknown): Promise<unknown>
  /** Queue one field clear. */
  unset(field: string): Promise<unknown>
}

/** The write one field's staged text performs when the card is saved. */
export type FieldWrite =
  | { kind: 'set'; value: unknown }
  | { kind: 'clear' }

/** How one section field converts between its stored value and its draft text. */
export interface CardFieldSpec {
  /** Field name inside the namespace section. */
  field: string
  /** Render a stored value as draft text; the empty string when the section carries none. */
  format: (value: unknown) => string
  /** The write this draft text stages, or undefined when the text is not accepted. */
  parse: (text: string) => FieldWrite | undefined
}

/** One field as a card's control renders it. */
export interface CardFieldState {
  /** Draft text the control renders. */
  text: string
  /** Whether saving would leave a user-layer entry for this field. */
  overridden: boolean
  /** Whether the draft is not a value this field accepts. */
  invalid: boolean
}

/** Form state every plugin card shares. */
export interface CardShell {
  /** False while the namespace is not served; the card renders nothing. */
  available: boolean
  /** Whether the Host document accepts writes. */
  writable: boolean
  /** Whether the form holds edits that a save would write. */
  dirty: boolean
  /** Whether any staged draft is invalid, which blocks the save. */
  invalid: boolean
  /** Whether a save is crossing the wire. */
  saving: boolean
  /** Whether the last save did not land as staged; cleared by the next edit or save. */
  failed: boolean
}

/** The write actions every plugin card's slot entry injects. */
export interface CardActions {
  /** Stage draft text for one field. */
  edit: (field: string, text: string) => void
  /** Stage a clear, so saving lets the field re-inherit the composition layer. */
  resetField: (field: string) => void
  /** Write every staged edit, then re-seed from what the Host accepted. */
  save: () => void
  /** Drop every staged edit. */
  discard: () => void
}

/** A whole-number text draft — unused by this card, kept for spec symmetry. */
// (no number field today; the card edits a boolean and a free-text field)

/**
 * A free-text field. An empty draft clears the field.
 * @param field - field name inside the namespace section.
 * @returns the field's conversion spec.
 */
export function textField(field: string): CardFieldSpec {
  return {
    field,
    format: value => typeof value === 'string' ? value : '',
    parse: (text) => {
      const trimmed = text.trim()
      return trimmed === '' ? { kind: 'clear' } : { kind: 'set', value: trimmed }
    },
  }
}

/**
 * A boolean field over draft texts `'true'` / `'false'` (the control is a
 * checkbox whose onChange stages the corresponding text).
 * @param field - field name inside the namespace section.
 * @returns the field's conversion spec.
 */
export function booleanField(field: string): CardFieldSpec {
  return {
    field,
    format: value => value === true ? 'true' : value === false ? 'false' : '',
    parse: (text) => {
      if (text === 'true') return { kind: 'set', value: true }
      if (text === 'false') return { kind: 'set', value: false }
      return undefined
    },
  }
}

/** One field's staged edit. */
interface StagedEdit {
  /** Draft text the control renders. */
  text: string
  /** True when this edit clears the field whatever text it shows. */
  clear: boolean
}

/** One staged edit resolved into the write a save performs. */
interface PlannedWrite {
  /** Field this entry writes. */
  field: string
  /** Perform the write and report whether the Host holds the staged value afterwards. */
  run: (() => Promise<boolean>) | undefined
}

/**
 * Stages one card's edits over one settings namespace and writes them on save.
 */
export class CardForm<T> {
  private readonly specs = new Map<string, CardFieldSpec>()
  private readonly staged = new Map<string, StagedEdit>()
  private readonly listeners = new Set<() => void>()
  private saving = false
  private failed = false

  /**
   * @param scope - the bound settings scope for this card's namespace.
   * @param specs - the section fields this card edits.
   */
  constructor(
    private readonly scope: SettingsScope<T>,
    specs: CardFieldSpec[],
  ) {
    for (const spec of specs) this.specs.set(spec.field, spec)
    scope.subscribe(() => { this.publish() })
  }

  /**
   * Publish a projection of this form, rebuilt whenever the scope or a draft changes.
   * @param project - build the card's state from the form's current reads.
   * @returns the store the card's component reads through its bound selector.
   */
  bind<S>(project: () => S): SnapshotStore<S> {
    const store = createSnapshotStore(project())
    this.listeners.add(() => { store.set(project()) })
    return store
  }

  /** Read the card-level state: what the Host serves, and what a save would do. */
  shell(): CardShell {
    const snapshot = this.scope.getSnapshot()
    const plan = this.plan()
    return {
      available: snapshot.status === 'ready' || snapshot.status === 'loading',
      writable: snapshot.writable,
      dirty: plan.length > 0,
      invalid: plan.some(item => item.run === undefined),
      saving: this.saving,
      failed: this.failed,
    }
  }

  /** Read one control's state. */
  field(field: string): CardFieldState {
    const staged = this.staged.get(field)
    const spec = this.spec(field)
    if (staged === undefined) {
      return { text: spec.format(this.sectionValue(field)), overridden: this.stored(field), invalid: false }
    }
    const write = staged.clear ? { kind: 'clear' as const } : spec.parse(staged.text)
    return {
      text: staged.text,
      overridden: write?.kind === 'set',
      invalid: write === undefined,
    }
  }

  /** Build the edit, reset, save, and discard actions bound to this form. */
  actions(): CardActions {
    return {
      edit: (field, text) => { this.stage(field, { text, clear: false }) },
      resetField: (field) => {
        this.stage(field, { text: this.spec(field).format(this.baseValue(field)), clear: true })
      },
      save: () => { void this.save() },
      discard: () => {
        if (this.staged.size === 0 && !this.failed) return
        this.staged.clear()
        this.failed = false
        this.publish()
      },
    }
  }

  /** Write every staged edit, then re-seed from what the Host accepted. */
  async save(): Promise<void> {
    const plan = this.plan()
    const writes = plan.flatMap(item => item.run === undefined ? [] : [item.run])
    if (plan.length === 0 || this.saving || writes.length !== plan.length) return
    this.saving = true
    this.failed = false
    this.publish()
    let landed = true
    for (const write of writes) {
      landed = await write() && landed
    }
    if (landed) this.staged.clear()
    this.saving = false
    this.failed = !landed
    this.publish()
  }

  /** Every staged edit a save would write (an invalid draft carries no write). */
  private plan(): PlannedWrite[] {
    const plan: PlannedWrite[] = []
    for (const [field, staged] of this.staged) {
      const spec = this.spec(field)
      if (staged.clear) {
        if (this.stored(field)) plan.push({ field, run: () => this.clear(field) })
        continue
      }
      if (staged.text === spec.format(this.sectionValue(field))) continue
      const write = spec.parse(staged.text)
      if (write === undefined) plan.push({ field, run: undefined })
      else if (write.kind === 'clear') plan.push({ field, run: () => this.clear(field) })
      else plan.push({ field, run: () => this.store(field, write.value) })
    }
    return plan
  }

  private async clear(field: string): Promise<boolean> {
    await this.scope.unset(field)
    return !this.stored(field)
  }

  private async store(field: string, value: unknown): Promise<boolean> {
    await this.scope.set(field, value)
    return this.userLayer()?.[field] === value
  }

  private stage(field: string, edit: StagedEdit): void {
    this.staged.set(field, edit)
    this.failed = false
    this.publish()
  }

  private spec(field: string): CardFieldSpec {
    const spec = this.specs.get(field)
    if (spec === undefined) throw new Error(`session-head-prompt card has no field ${field}`)
    return spec
  }

  private sectionValue(field: string): unknown {
    const value = this.scope.getSnapshot().value
    return (value as unknown as Record<string, unknown> | undefined)?.[field]
  }

  private baseValue(field: string): unknown {
    const value = this.scope.getSnapshot().base
    return (value as unknown as Record<string, unknown> | undefined)?.[field]
  }

  private userLayer(): Record<string, unknown> | undefined {
    return this.scope.getSnapshot().user as unknown as Record<string, unknown> | undefined
  }

  private stored(field: string): boolean {
    const user = this.userLayer()
    return user !== undefined && Object.hasOwn(user, field)
  }

  private publish(): void {
    for (const listener of this.listeners) listener()
  }
}