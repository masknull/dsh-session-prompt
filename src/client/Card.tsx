/**
 * The settings card: an expandable entry in the web settings page's
 * "Plugin configuration" tab, keyed by the settings namespace it edits.
 * It draws its own chrome — mirroring the shared plugin-card design tokens
 * (see ./card.css) — because cross-plugin value imports are forbidden; the
 * card writes only through the staged form's save action.
 */

import { useState, useSyncExternalStore } from 'react'
import type { InjectFace, PropsRuntime } from '@deepseek-ai/dsh-client-ui-slots'
// Type-only: the keyed slot's declaration (cross-plugin collaboration goes
// through cordis services; a value import would fail the bundle purity gate).
import type {} from '@deepseek-ai/dsh-client-ui-settings-plugins/client'
import type { HeadPromptCardFace } from './types.ts'
import { promptCardState, subscribePromptCard } from './prompt-settings-store.ts'
import css from './card.css'

/**
 * The disclosure chevron, byte-identical to the sibling connect plugins' cards.
 *
 * Both dsh-qoder-connect and dsh-workbuddy-connect draw this exact outline (a
 * copy of the built-in Settings card's 14px chevron: 14×14, filled with
 * `currentColor`) instead of importing from
 * `@deepseek-ai/dsh-client-ui-primitives`, whose icon names are not stable
 * across Host lines (0.1.7 has no `IconChevronDownOutline14` — importing it
 * surfaces `undefined` as a component, React error #130, an abdicated entry).
 * A third copy of the same path keeps every card in the shared 《插件设置》
 * list pixel-identical.
 *
 * @returns the chevron element.
 */
function ChevronDownIcon() {
  return (
    <svg
      width={14}
      height={14}
      viewBox="0 0 14 14"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M11.8486 5.5L11.4238 5.92383L8.69727 8.65137C8.44157 8.90706 8.21562 9.13382 8.01172 9.29785C7.79912 9.46883 7.55595 9.61756 7.25 9.66602C7.08435 9.69222 6.91565 9.69222 6.75 9.66602C6.44405 9.61756 6.20088 9.46883 5.98828 9.29785C5.78438 9.13382 5.55843 8.90706 5.30273 8.65137L2.57617 5.92383L2.15137 5.5L3 4.65137L3.42383 5.07617L6.15137 7.80273C6.42595 8.07732 6.59876 8.24849 6.74023 8.3623C6.87291 8.46904 6.92272 8.47813 6.9375 8.48047C6.97895 8.48703 7.02105 8.48703 7.0625 8.48047C7.07728 8.47813 7.12709 8.46904 7.25977 8.3623C7.40124 8.24849 7.57405 8.07732 7.84863 7.80273L10.5762 5.07617L11 4.65137L11.8486 5.5Z"
        fill="currentColor"
      />
    </svg>
  )
}

/** The stylesheet text injected by the client entry's apply(). */
export const CARD_CSS = css

/** Props the renderer binds for this card. */
export type HeadPromptCardProps =
  PropsRuntime<'settings.plugin.item'>
  & InjectFace<HeadPromptCardFace>

/** Copy used when the face carries no translator (a Host without the locale service). */
const FALLBACK_COPY: Record<string, string> = {
  title: '提示词注入',
  description: '在每个会话的系统提示词头部注入自定义内容',
  enabledLabel: '启用注入',
  enabledHint: '关闭后不再向系统提示词头部注入任何内容',
  promptLabel: '提示词内容',
  promptHint: '保存后对下一次请求立即生效',
  overridden: '已覆盖',
  reset: '重置',
  unsaved: '未保存',
  readOnly: '当前配置为只读',
  saveFailed: '保存未生效，请重试',
  saving: '保存中…',
  save: '保存',
  discard: '放弃',
  expand: '展开',
  collapse: '收起',
}

/**
 * Render the card.
 *
 * Hook order is fixed: exactly one `useSyncExternalStore` over the module store
 * plus one `useState`. The state never arrives through a renderer-bound hook
 * prop, so no call here is conditional — a conditional hook call is what crashed
 * this entry (and got it abdicated) before.
 *
 * @param props - the card's actions and translator, bound by the registration.
 * @returns the card element.
 */
export function HeadPromptCard(props: HeadPromptCardProps) {
  const state = useSyncExternalStore(subscribePromptCard, promptCardState, promptCardState)
  const [open, setOpen] = useState(false)
  const face = (props ?? {}) as Partial<HeadPromptCardFace>
  const bound = typeof face.t === 'function' ? face.t : undefined
  const t = (key: string): string => bound?.(key) ?? FALLBACK_COPY[key] ?? key
  const title = t('title')
  const description = t('description')
  return (
    <li className={`shp-card${open ? ' shp-cardOpen' : ''}`} style={{ listStyle: 'none' }}>
      <button
        type="button"
        className="shp-header"
        aria-expanded={open}
        aria-label={`${t(open ? 'collapse' : 'expand')}: ${title}`}
        onClick={() => { setOpen(!open) }}
      >
        <span className="shp-headText">
          <span className="shp-name">{title}</span>
          <span className="shp-description">{description}</span>
        </span>
        {state.dirty ? <span className="shp-pending">{t('unsaved')}</span> : null}
        <span className="shp-chevron" style={{ transform: open ? 'rotate(180deg)' : 'none' }}>
          <ChevronDownIcon />
        </span>
      </button>
      {open
        ? (
          <div className="shp-body">
            {!state.writable ? <p className="shp-readOnly" role="status">{t('readOnly')}</p> : null}
            <div className="shp-field">
              <div className="shp-head">
                <label className="shp-label" htmlFor="shp-enabled">{t('enabledLabel')}</label>
              </div>
              <input
                id="shp-enabled"
                className="shp-checkbox"
                type="checkbox"
                checked={state.enabled?.text === 'true'}
                disabled={!state.writable}
                onChange={(event) => {
                  face.edit?.('enabled', event.target.checked ? 'true' : 'false')
                }}
              />
              <p className="shp-hint">{t('enabledHint')}</p>
            </div>
            <div className="shp-field">
              <div className="shp-head">
                <label className="shp-label" htmlFor="shp-prompt">{t('promptLabel')}</label>
                {state.prompt?.overridden
                  ? (
                    <span className="shp-badges">
                      <span className="shp-badge">{t('overridden')}</span>
                      <button
                        type="button"
                        className="shp-reset"
                        disabled={!state.writable}
                        onClick={() => { face.resetField?.('prompt') }}
                      >
                        {t('reset')}
                      </button>
                    </span>
                  )
                  : null}
              </div>
              <textarea
                id="shp-prompt"
                className="shp-textarea"
                rows={9}
                value={state.prompt?.text ?? ''}
                disabled={!state.writable}
                onChange={(event) => { face.edit?.('prompt', event.target.value) }}
              />
              <p className="shp-hint">{t('promptHint')}</p>
            </div>
            <div className="shp-footer">
              {state.failed ? <p className="shp-failed" role="status">{t('saveFailed')}</p> : null}
              <button
                type="button"
                className="shp-discard"
                disabled={!state.dirty || state.saving}
                onClick={() => { face.discard?.() }}
              >
                {t('discard')}
              </button>
              <button
                type="button"
                className="shp-save"
                disabled={!state.dirty || state.invalid || state.saving}
                onClick={() => { face.save?.() }}
              >
                {t(state.saving ? 'saving' : 'save')}
              </button>
            </div>
          </div>
        )
        : null}
    </li>
  )
}