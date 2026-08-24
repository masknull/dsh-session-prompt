/**
 * Locale dictionaries for the settings card, and the declared locale
 * namespace that types the framework-injected `t` seat.
 */

/** Dictionary key union of this card's copy. */
export type HeadPromptLocaleKey =
  | 'title'
  | 'description'
  | 'enabledLabel'
  | 'enabledHint'
  | 'promptLabel'
  | 'promptHint'
  | 'overridden'
  | 'reset'
  | 'save'
  | 'saving'
  | 'discard'
  | 'unsaved'
  | 'saveFailed'
  | 'readOnly'
  | 'collapse'
  | 'expand'

/** Locale namespace owned by this card (declared into the shared table). */
export const LOCALE_NS = 'session-head-prompt.card'

declare module '@deepseek-ai/dsh-client-ui-slots' {
  interface LocaleNamespaceMap {
    [LOCALE_NS]: HeadPromptLocaleKey
  }
}

export const zh: Record<HeadPromptLocaleKey, string> = {
  title: '会话头部提示词',
  description: '在每个会话的系统提示词最前注入自定义内容',
  enabledLabel: '启用注入',
  enabledHint: '关闭后不注入任何内容',
  promptLabel: '提示词内容',
  promptHint: '注入到每个会话系统提示词的最顶部(位于内置身份与角色设定之前),修改保存后对下一次请求立即生效。内容不要包含完整的 {{…}} 花括号组(会被系统提示词渲染器当作模板变量并报错)。',
  overridden: '已覆盖',
  reset: '恢复默认',
  save: '保存',
  saving: '保存中…',
  discard: '放弃',
  unsaved: '未保存',
  saveFailed: '保存失败:内容可能包含不被接受的字符,请检查后重试',
  readOnly: '设置文档当前为只读',
  collapse: '收起',
  expand: '展开',
}

export const en: Record<HeadPromptLocaleKey, string> = {
  title: 'Session head prompt',
  description: 'Inject custom content at the very top of every session\'s system prompt',
  enabledLabel: 'Enable injection',
  enabledHint: 'When disabled, nothing is injected',
  promptLabel: 'Prompt text',
  promptHint: 'Injected at the top of every session\'s system prompt (before the built-in identity and persona); saved changes apply to the next request. Do not include complete {{…}} groups — the system-prompt renderer would try to interpolate them as template variables and fail.',
  overridden: 'Overridden',
  reset: 'Reset',
  save: 'Save',
  saving: 'Saving…',
  discard: 'Discard',
  unsaved: 'Unsaved',
  saveFailed: 'Save failed: the content may contain characters the Host refused; check and retry',
  readOnly: 'The settings document is currently read-only',
  collapse: 'Collapse',
  expand: 'Expand',
}