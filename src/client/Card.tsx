/**
 * The settings card: an expandable entry in the web settings page's
 * "Plugin configuration" tab, keyed by the settings namespace it edits.
 * It draws its own chrome — mirroring the shared plugin-card design tokens
 * (see ./card.css) — because cross-plugin value imports are forbidden; the
 * card writes only through the staged form's save action.
 */

import { useState } from 'react'
import type { InjectFace, PropsLocale, PropsRuntime } from '@deepseek-ai/dsh-client-ui-slots'
import { IconChevronDownOutline14 } from '@deepseek-ai/dsh-client-ui-primitives'
// Type-only: the keyed slot's declaration (cross-plugin collaboration goes
// through cordis services; a value import would fail the bundle purity gate).
import type {} from '@deepseek-ai/dsh-client-ui-settings-plugins/client'
import type { HeadPromptCardFace } from './types.ts'
import css from './card.css'

/** The stylesheet text injected by the client entry's apply(). */
export const CARD_CSS = css

/** Props the renderer binds for this card. */
export type HeadPromptCardProps =
  PropsRuntime<'settings.plugin.item'>
  & PropsLocale<'session-head-prompt.card'>
  & InjectFace<HeadPromptCardFace>

/**
 * Render the card.
 * @param props - locale copy, the card snapshot, and its form actions.
 * @returns the card, or nothing while the namespace is not served.
 */
export function HeadPromptCard(props: HeadPromptCardProps) {
  const { t } = props
  const state = props.useHeadPromptCard(snapshot => snapshot)
  const [open, setOpen] = useState(false)
  if (!state.available) return null
  const title = t('title')
  return (
    <li className={`shp-card${open ? ' shp-cardOpen' : ''}`}>
      <button
        type="button"
        className="shp-header"
        aria-expanded={open}
        aria-label={`${t(open ? 'collapse' : 'expand')}: ${title}`}
        onClick={() => { setOpen(!open) }}
      >
        <span className="shp-headText">
          <span className="shp-name">{title}</span>
          <span className="shp-description">{t('description')}</span>
        </span>
        {state.dirty ? <span className="shp-pending">{t('unsaved')}</span> : null}
        <IconChevronDownOutline14 className={`shp-chevron${open ? ' shp-chevronOpen' : ''}`} />
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
                checked={state.enabled.text === 'true'}
                disabled={!state.writable}
                onChange={(event) => {
                  props.edit('enabled', event.target.checked ? 'true' : 'false')
                }}
              />
              <p className="shp-hint">{t('enabledHint')}</p>
            </div>
            <div className="shp-field">
              <div className="shp-head">
                <label className="shp-label" htmlFor="shp-prompt">{t('promptLabel')}</label>
                {state.prompt.overridden
                  ? (
                    <span className="shp-badges">
                      <span className="shp-badge">{t('overridden')}</span>
                      <button
                        type="button"
                        className="shp-reset"
                        disabled={!state.writable}
                        onClick={() => { props.resetField('prompt') }}
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
                value={state.prompt.text}
                disabled={!state.writable}
                onChange={(event) => { props.edit('prompt', event.target.value) }}
              />
              <p className="shp-hint">{t('promptHint')}</p>
            </div>
            <div className="shp-footer">
              {state.failed ? <p className="shp-failed" role="status">{t('saveFailed')}</p> : null}
              <button
                type="button"
                className="shp-discard"
                disabled={!state.dirty || state.saving}
                onClick={props.discard}
              >
                {t('discard')}
              </button>
              <button
                type="button"
                className="shp-save"
                disabled={!state.dirty || state.invalid || state.saving}
                onClick={props.save}
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