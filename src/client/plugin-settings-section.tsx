/**
 * The shared "Plugin settings" block: ONE `settings.section` entry that holds
 * the settings cards of every card-shipping plugin.
 *
 * DSH 0.1.5 hosts such cards in the plugins tab's keyed `settings.plugin.item`
 * slot; 0.1.7 removed both the tab and that slot while keeping
 * `settings.section`. A card plugin therefore contributes a section of its own
 * there — and since several plugins ship the same kind of card, they share one
 * section instead of stacking one block each: every copy of this module
 * declares the same container id, child slot, order, and label, the first
 * plugin to load builds the container, and the others attach their card to it
 * (see `attachToSharedPluginSettings`).
 *
 * The constants below are a contract between those plugins, not local choices:
 * changing one in isolation leaves the other copies attached to a different
 * block, or building a second, half-populated one.
 */

import type { Context } from '@deepseek-ai/cordis'
import type { PropsRenderSlots, PropsRuntime, SlotComponent } from '@deepseek-ai/dsh-client-ui-slots'

/** Slot the container occupies (declared by the Host in both versions). */
export const SHARED_SECTION_SLOT = 'settings.section'

/** Container entry id: the shared block's identity, identical in every copy. */
export const SHARED_SECTION_ID = 'plugin-settings'

/** Child slot the container declares; every attached plugin registers into it. */
export const SHARED_ITEM_SLOT = 'plugin-settings.item'

/** Display order of the block: after the Host's own sections. */
export const SHARED_SECTION_ORDER = 900

/** Section label, spelled once so every attached plugin's nav row reads the same. */
export const SHARED_SECTION_LABEL = '插件设置'

// Type-only: the child slot this container declares and renders is not part of
// the Host's SlotMap, so this plugin declares it locally.
declare module '@deepseek-ai/dsh-client-ui-slots' {
  interface SlotMap {
    /** Host section list this container occupies. */
    'settings.section': { kind: 'list', scope: 'root' }
    /** Card list this container owns. */
    'plugin-settings.item': { kind: 'list', scope: 'root' }
  }
}

/** Props the Host binds for one section entry, plus the child render share. */
export type SharedSectionProps =
  PropsRuntime<typeof SHARED_SECTION_SLOT>
  & PropsRenderSlots<typeof SHARED_ITEM_SLOT>

/** Props one attached card receives from the block's child slot. */
export type SharedItemProps = PropsRuntime<typeof SHARED_ITEM_SLOT>

/** Shape an attached card component must satisfy. */
export type SharedItemComponent = SlotComponent<SharedItemProps>

/**
 * Render the shared block: the card list the attached plugins fill.
 *
 * Defensive on purpose: a container entry whose component threw would be
 * abdicated by the slot renderer, which removes the whole section body from the
 * page (the nav row survives, so the user sees an empty 《插件设置》). The
 * missing-`renderSlot` case is reported instead of thrown, so a wiring problem
 * shows up as text plus a console line rather than as a silently empty page.
 *
 * @param props - the Host's section share and the declared child render share.
 * @returns the card list.
 */
export function SharedPluginSettingsSection(props: SharedSectionProps) {
  const renderSlot = (props as unknown as { renderSlot?: unknown }).renderSlot
  if (typeof renderSlot !== 'function') {
    console.error(
      '[dsh-session-prompt] shared block rendered without a renderSlot prop — props keys:',
      Object.keys(props ?? {}).join(','),
    )
    return (
      <ul className="dsh-plugin-settings-cards" style={CARD_LIST_STYLE}>
        <li style={{ listStyle: 'none', opacity: 0.7 }}>
          [dsh-session-prompt] 容器缺少 renderSlot（详情见浏览器控制台）
        </li>
      </ul>
    )
  }
  return (
    <ul className="dsh-plugin-settings-cards" style={CARD_LIST_STYLE}>
      {(renderSlot as (key: typeof SHARED_ITEM_SLOT, owner: object) => unknown)(SHARED_ITEM_SLOT, {})}
    </ul>
  )
}

/** The card list wrapper: a plain column, tight gap, no list markers. */
const CARD_LIST_STYLE = {
  display: 'flex',
  flexDirection: 'column' as const,
  gap: 6,
  padding: 0,
  listStyle: 'none',
}

/**
 * Attach this plugin's card to the shared block, building the block first when
 * this plugin is the one that got there first.
 *
 * The block's child slot is declared by whichever plugin registers the
 * container, so it need not exist when this runs: both steps wait through
 * `slots.inject`, which runs its callback once the slot is declared and
 * collects the disposers the callback returns. The registration is synchronous,
 * so the probe and the register call cannot interleave in practice; the
 * try/catch covers the case anyway, and falls through to the same attach branch.
 * @param ctx - the browser plugin context.
 * @param card - register the card into the block's child slot; returns its disposer.
 * @returns the disposer for the wait and any active contribution.
 */
export function attachToSharedPluginSettings(ctx: Context, card: () => () => void): () => void {
  return ctx.slots.inject(SHARED_SECTION_SLOT, () => {
    let disposeContainer: (() => void) | undefined
    const claimed = ctx.slots.entries(SHARED_SECTION_SLOT)
      .some(entry => entry.options?.id === SHARED_SECTION_ID)
    if (!claimed) {
      try {
        disposeContainer = ctx.slots.register({
          name: SHARED_SECTION_SLOT,
          id: SHARED_SECTION_ID,
          order: SHARED_SECTION_ORDER,
          label: SHARED_SECTION_LABEL,
          children: { [SHARED_ITEM_SLOT]: { kind: 'list', scope: 'root' } },
        }, SharedPluginSettingsSection)
      } catch (error: unknown) {
        console.error('[dsh-session-prompt] shared plugin-settings block lost the race; attaching to the winner:', error)
      }
    }
    const disposeItem = ctx.slots.inject(SHARED_ITEM_SLOT, card)
    return () => {
      disposeItem()
      disposeContainer?.()
    }
  })
}
