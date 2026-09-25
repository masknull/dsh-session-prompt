window.__ModuleLoader__.load({
	id: "dsh-session-prompt",
	factory: (require) => {
		try {
			var module = { exports: {} };
			var exports = module.exports;
			function __dshClientCompatGuard(cause) {
				var message = cause instanceof Error ? cause.message : String(cause);
				if (message.indexOf("missed the module table") !== -1 && message.indexOf("@deepseek-ai/dsh-client-store") !== -1) return /* @__PURE__ */ new Error("dsh-session-prompt requires DSH >= dsh-v0.1.2-alpha.1: the Host frozen module table lacks @deepseek-ai/dsh-client-store (the client-runtime package was removed upstream). Update DeepSeek Harness, or use a plugin release built for older DSH. Underlying: " + message);
				return cause;
			}
			Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
			let _deepseek_ai_dsh_client_store = require("@deepseek-ai/dsh-client-store");
			let react = require("react");
			let react_jsx_runtime = require("react/jsx-runtime");
			//#region src/client/card-form.ts
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
			/** A whole-number text draft — unused by this card, kept for spec symmetry. */
			/**
			* A free-text field. An empty draft clears the field.
			* @param field - field name inside the namespace section.
			* @returns the field's conversion spec.
			*/
			function textField(field) {
				return {
					field,
					format: (value) => typeof value === "string" ? value : "",
					parse: (text) => {
						const trimmed = text.trim();
						return trimmed === "" ? { kind: "clear" } : {
							kind: "set",
							value: trimmed
						};
					}
				};
			}
			/**
			* A boolean field over draft texts `'true'` / `'false'` (the control is a
			* checkbox whose onChange stages the corresponding text).
			* @param field - field name inside the namespace section.
			* @returns the field's conversion spec.
			*/
			function booleanField(field) {
				return {
					field,
					format: (value) => value === true ? "true" : value === false ? "false" : "",
					parse: (text) => {
						if (text === "true") return {
							kind: "set",
							value: true
						};
						if (text === "false") return {
							kind: "set",
							value: false
						};
					}
				};
			}
			/**
			* Stages one card's edits over one settings namespace and writes them on save.
			*/
			var CardForm = class {
				scope;
				specs = /* @__PURE__ */ new Map();
				staged = /* @__PURE__ */ new Map();
				listeners = /* @__PURE__ */ new Set();
				saving = false;
				failed = false;
				/**
				* @param scope - the bound settings scope for this card's namespace.
				* @param specs - the section fields this card edits.
				*/
				constructor(scope, specs) {
					this.scope = scope;
					for (const spec of specs) this.specs.set(spec.field, spec);
					scope.subscribe(() => {
						this.publish();
					});
				}
				/**
				* Publish a projection of this form, rebuilt whenever the scope or a draft changes.
				* @param project - build the card's state from the form's current reads.
				* @returns the store the card's component reads through its bound selector.
				*/
				bind(project) {
					const store = (0, _deepseek_ai_dsh_client_store.createSnapshotStore)(project());
					this.listeners.add(() => {
						store.set(project());
					});
					return store;
				}
				/** Read the card-level state: what the Host serves, and what a save would do. */
				shell() {
					const snapshot = this.scope.getSnapshot();
					const plan = this.plan();
					return {
						available: snapshot.status === "ready" || snapshot.status === "loading",
						writable: snapshot.writable,
						dirty: plan.length > 0,
						invalid: plan.some((item) => item.run === void 0),
						saving: this.saving,
						failed: this.failed
					};
				}
				/** Read one control's state. */
				field(field) {
					const staged = this.staged.get(field);
					const spec = this.spec(field);
					if (staged === void 0) return {
						text: spec.format(this.sectionValue(field)),
						overridden: this.stored(field),
						invalid: false
					};
					const write = staged.clear ? { kind: "clear" } : spec.parse(staged.text);
					return {
						text: staged.text,
						overridden: write?.kind === "set",
						invalid: write === void 0
					};
				}
				/** Build the edit, reset, save, and discard actions bound to this form. */
				actions() {
					return {
						edit: (field, text) => {
							this.stage(field, {
								text,
								clear: false
							});
						},
						resetField: (field) => {
							this.stage(field, {
								text: this.spec(field).format(this.baseValue(field)),
								clear: true
							});
						},
						save: () => {
							this.save();
						},
						discard: () => {
							if (this.staged.size === 0 && !this.failed) return;
							this.staged.clear();
							this.failed = false;
							this.publish();
						}
					};
				}
				/** Write every staged edit, then re-seed from what the Host accepted. */
				async save() {
					const plan = this.plan();
					const writes = plan.flatMap((item) => item.run === void 0 ? [] : [item.run]);
					if (plan.length === 0 || this.saving || writes.length !== plan.length) return;
					this.saving = true;
					this.failed = false;
					this.publish();
					let landed = true;
					for (const write of writes) landed = await write() && landed;
					if (landed) this.staged.clear();
					this.saving = false;
					this.failed = !landed;
					this.publish();
				}
				/** Every staged edit a save would write (an invalid draft carries no write). */
				plan() {
					const plan = [];
					for (const [field, staged] of this.staged) {
						const spec = this.spec(field);
						if (staged.clear) {
							if (this.stored(field)) plan.push({
								field,
								run: () => this.clear(field)
							});
							continue;
						}
						if (staged.text === spec.format(this.sectionValue(field))) continue;
						const write = spec.parse(staged.text);
						if (write === void 0) plan.push({
							field,
							run: void 0
						});
						else if (write.kind === "clear") plan.push({
							field,
							run: () => this.clear(field)
						});
						else plan.push({
							field,
							run: () => this.store(field, write.value)
						});
					}
					return plan;
				}
				async clear(field) {
					await this.scope.unset(field);
					return !this.stored(field);
				}
				async store(field, value) {
					await this.scope.set(field, value);
					return this.userLayer()?.[field] === value;
				}
				stage(field, edit) {
					this.staged.set(field, edit);
					this.failed = false;
					this.publish();
				}
				spec(field) {
					const spec = this.specs.get(field);
					if (spec === void 0) throw new Error(`session-head-prompt card has no field ${field}`);
					return spec;
				}
				sectionValue(field) {
					return this.scope.getSnapshot().value?.[field];
				}
				baseValue(field) {
					return this.scope.getSnapshot().base?.[field];
				}
				userLayer() {
					return this.scope.getSnapshot().user;
				}
				stored(field) {
					const user = this.userLayer();
					return user !== void 0 && Object.hasOwn(user, field);
				}
				publish() {
					for (const listener of this.listeners) listener();
				}
			};
			//#endregion
			//#region src/client/http-settings-scope.ts
			/** Base path of the host half's settings face. */
			const ROUTE_BASE = "/plugins/dsh-session-prompt";
			/**
			* Fetch one settings face document.
			* @param init - the request init (method, headers, body).
			* @returns the parsed document.
			* @throws when the transport or the host refuses the request.
			*/
			async function request(init) {
				const response = await fetch(`${ROUTE_BASE}/settings`, {
					credentials: "same-origin",
					...init
				});
				const value = await response.json().catch(() => void 0);
				if (!response.ok) {
					const error = typeof value === "object" && value !== null && "error" in value ? String(value["error"]) : `HTTP ${response.status}`;
					throw new Error(error);
				}
				if (typeof value !== "object" || value === null || !("value" in value)) throw new Error("session-head-prompt: settings face answered an invalid document");
				return value;
			}
			/**
			* The scope the card was written against, backed by this plugin's own file.
			*
			* A write optimistically adopts the value it just sent, then confirms with the
			* host's answer (which is authoritative: it re-reads the file it wrote), so the
			* staged form never renders a value the host does not hold.
			*/
			var OwnSettingsScope = class {
				document;
				listeners = /* @__PURE__ */ new Set();
				/**
				* Load the current document. Call once before the form binds; repeated calls
				* are harmless and re-read the host.
				* @returns the effective values.
				*/
				async load() {
					this.document = await request({ headers: { accept: "application/json" } });
					for (const listener of this.listeners) listener();
					return this.document.value;
				}
				/** @returns the stable snapshot the form reads (ready once loaded). */
				getSnapshot() {
					const document = this.document;
					if (document === void 0) return {
						status: "loading",
						mode: "live",
						writable: true,
						revision: 0,
						value: {
							enabled: true,
							prompt: ""
						},
						base: {
							enabled: true,
							prompt: ""
						},
						user: {}
					};
					return {
						status: "ready",
						mode: "live",
						writable: true,
						revision: this.revision,
						value: document.value,
						base: document.base,
						user: document.user
					};
				}
				/** Local write fence, mirroring the host's revision discipline. */
				revision = 1;
				/** @param listener - invoked after every snapshot change. @returns the disposer. */
				subscribe(listener) {
					this.listeners.add(listener);
					return () => {
						this.listeners.delete(listener);
					};
				}
				/**
				* Write one field.
				* @param field - field name inside the settings document.
				* @param value - the JSON-shaped value to store.
				* @returns whether the host accepted the write.
				*/
				async set(field, value) {
					return this.patch({ [field]: value });
				}
				/**
				* Clear one field: the value falls back to the schema default.
				* @param field - field name inside the settings document.
				* @returns whether the host accepted the clear.
				*/
				async unset(field) {
					return this.patch({ [field]: null });
				}
				/** Send one patch and adopt the host's answer. */
				async patch(patch) {
					const key = this.document?.key;
					if (key === void 0) return false;
					try {
						this.document = await request({
							method: "POST",
							headers: {
								"Content-Type": "application/json",
								"X-Session-Prompt-Key": key
							},
							body: JSON.stringify(patch)
						});
						this.revision += 1;
						for (const listener of this.listeners) listener();
						return true;
					} catch {
						return false;
					}
				}
			};
			//#endregion
			//#region src/client/locales.ts
			/** Locale namespace owned by this card (declared into the shared table). */
			const LOCALE_NS = "session-head-prompt.card";
			const zh = {
				title: "会话头部提示词",
				description: "在每个会话的系统提示词最前注入自定义内容",
				enabledLabel: "启用注入",
				enabledHint: "关闭后不注入任何内容",
				promptLabel: "提示词内容",
				promptHint: "注入到每个会话系统提示词的最顶部(位于内置身份与角色设定之前),修改保存后对下一次请求立即生效。内容不要包含完整的 {{…}} 花括号组(会被系统提示词渲染器当作模板变量并报错)。",
				overridden: "已覆盖",
				reset: "恢复默认",
				save: "保存",
				saving: "保存中…",
				discard: "放弃",
				unsaved: "未保存",
				saveFailed: "保存失败:内容可能包含不被接受的字符,请检查后重试",
				readOnly: "设置文档当前为只读",
				collapse: "收起",
				expand: "展开"
			};
			const en = {
				title: "Session head prompt",
				description: "Inject custom content at the very top of every session's system prompt",
				enabledLabel: "Enable injection",
				enabledHint: "When disabled, nothing is injected",
				promptLabel: "Prompt text",
				promptHint: "Injected at the top of every session's system prompt (before the built-in identity and persona); saved changes apply to the next request. Do not include complete {{…}} groups — the system-prompt renderer would try to interpolate them as template variables and fail.",
				overridden: "Overridden",
				reset: "Reset",
				save: "Save",
				saving: "Saving…",
				discard: "Discard",
				unsaved: "Unsaved",
				saveFailed: "Save failed: the content may contain characters the Host refused; check and retry",
				readOnly: "The settings document is currently read-only",
				collapse: "Collapse",
				expand: "Expand"
			};
			//#endregion
			//#region src/client/prompt-settings-store.ts
			let state = {
				available: false,
				writable: false,
				dirty: false,
				invalid: false,
				saving: false,
				failed: false,
				enabled: {
					text: "false",
					overridden: false,
					invalid: false
				},
				prompt: {
					text: "",
					overridden: false,
					invalid: false
				}
			};
			const listeners = /* @__PURE__ */ new Set();
			/**
			* Read the current card state.
			* @returns the latest snapshot (a stable reference until the next publish).
			*/
			function promptCardState() {
				return state;
			}
			/**
			* Observe card-state publishes.
			* @param listener - called after each publish.
			* @returns the unsubscribe function.
			*/
			function subscribePromptCard(listener) {
				listeners.add(listener);
				return () => {
					listeners.delete(listener);
				};
			}
			/**
			* Publish a new card state.
			* @param next - the projection the controller just built.
			*/
			function setPromptCardState(next) {
				state = next;
				for (const listener of [...listeners]) listener();
			}
			//#endregion
			//#region \0shp-css:E:\AI\tmp\dsh-session-prompt\src\client\card.css.mjs
			var card_css_default = "/*\r\n * 设置卡片外观 — 复刻系统共享卡片的布局与设计 token(--dsw-alias-*),\r\n * 类名加 shp- 前缀避免与宿主样式冲突;由构建期的 css-text 内联,\r\n * apply 时注入 <style>。\r\n */\r\n\r\n.shp-card {\r\n  list-style: none;\r\n  border: 1px solid var(--dsw-alias-border-l2);\r\n  border-radius: 12px;\r\n  background: var(--dsw-alias-bg-layer-3);\r\n  transition: border-color 0.16s, background 0.16s;\r\n}\r\n\r\n.shp-card:hover {\r\n  border-color: var(--dsw-alias-label-dimmed);\r\n}\r\n\r\n/* 展开的卡片作为\"正在操作\"的表现,而非仅仅变高 */\r\n.shp-cardOpen {\r\n  background: var(--dsw-alias-bg-layer-2);\r\n  border-color: var(--dsw-alias-label-dimmed);\r\n}\r\n\r\n.shp-header {\r\n  width: 100%;\r\n  appearance: none;\r\n  border: 0;\r\n  background: none;\r\n  font: inherit;\r\n  color: inherit;\r\n  text-align: left;\r\n  cursor: pointer;\r\n  display: flex;\r\n  align-items: center;\r\n  gap: 12px;\r\n  padding: 14px 16px;\r\n  border-radius: 12px;\r\n}\r\n\r\n.shp-header:focus-visible {\r\n  outline: 2px solid var(--dsw-alias-brand-primary);\r\n  outline-offset: -2px;\r\n}\r\n\r\n.shp-headText {\r\n  flex: 1;\r\n  min-width: 0;\r\n  display: flex;\r\n  flex-direction: column;\r\n  gap: 4px;\r\n}\r\n\r\n.shp-name {\r\n  font-size: 15px;\r\n  font-weight: 600;\r\n  line-height: 1.4;\r\n  color: var(--dsw-alias-label-primary);\r\n}\r\n\r\n.shp-description {\r\n  font-size: 13px;\r\n  line-height: 1.5;\r\n  color: var(--dsw-alias-label-tertiary);\r\n}\r\n\r\n/* 与 qoder/workbuddy 卡片一致的 chevron 规则:固定三层色,只有旋转有动画 */\r\n.shp-chevron {\r\n  flex: none;\r\n  display: flex;\r\n  color: var(--dsw-alias-label-tertiary);\r\n  transition: transform 0.16s;\r\n}\r\n\r\n.shp-body {\r\n  border-top: 1px solid var(--dsw-alias-border-l2);\r\n  margin: 0 16px;\r\n  padding-bottom: 8px;\r\n}\r\n\r\n.shp-readOnly {\r\n  margin: 12px 0 0;\r\n  font-size: 12px;\r\n  line-height: 1.5;\r\n  color: var(--dsw-alias-label-tertiary);\r\n}\r\n\r\n/* 挂在头部上,折叠时也能看到未保存的编辑 */\r\n.shp-pending {\r\n  flex: none;\r\n  border-radius: 999px;\r\n  padding: 1px 8px;\r\n  font-size: 11px;\r\n  line-height: 17px;\r\n  font-weight: 500;\r\n  white-space: nowrap;\r\n  background: var(--dsw-alias-bg-module-platform);\r\n  color: var(--dsw-alias-label-secondary);\r\n}\r\n\r\n.shp-field {\r\n  display: flex;\r\n  flex-direction: column;\r\n  gap: 6px;\r\n  padding: 12px 0;\r\n}\r\n\r\n.shp-field + .shp-field {\r\n  border-top: 1px solid var(--dsw-alias-border-l2);\r\n}\r\n\r\n.shp-head {\r\n  display: flex;\r\n  align-items: center;\r\n  gap: 8px;\r\n}\r\n\r\n.shp-label {\r\n  flex: 1;\r\n  min-width: 0;\r\n  font-size: 13px;\r\n  font-weight: 500;\r\n  line-height: 1.5;\r\n  color: var(--dsw-alias-label-primary);\r\n}\r\n\r\n.shp-badges {\r\n  display: inline-flex;\r\n  align-items: center;\r\n  gap: 8px;\r\n}\r\n\r\n.shp-badge {\r\n  border-radius: 999px;\r\n  padding: 1px 8px;\r\n  font-size: 11px;\r\n  line-height: 17px;\r\n  white-space: nowrap;\r\n  font-weight: 500;\r\n  background: var(--dsw-alias-bg-module-platform);\r\n  color: var(--dsw-alias-label-secondary);\r\n}\r\n\r\n.shp-reset {\r\n  border: none;\r\n  background: none;\r\n  padding: 0;\r\n  font: inherit;\r\n  font-size: 12px;\r\n  line-height: 1.5;\r\n  color: var(--dsw-alias-label-secondary);\r\n  cursor: pointer;\r\n}\r\n\r\n.shp-reset:hover:not(:disabled) {\r\n  color: var(--dsw-alias-label-primary);\r\n}\r\n\r\n.shp-reset:disabled {\r\n  cursor: default;\r\n}\r\n\r\n.shp-input {\r\n  width: 100%;\r\n  box-sizing: border-box;\r\n  height: 34px;\r\n  padding: 0 12px;\r\n  border: 1px solid var(--dsw-alias-border-l2);\r\n  border-radius: 8px;\r\n  background: var(--dsw-alias-bg-layer-3);\r\n  font: inherit;\r\n  font-size: 13px;\r\n  line-height: 1.5;\r\n  color: var(--dsw-alias-label-primary);\r\n}\r\n\r\n.shp-input:focus-visible {\r\n  outline: none;\r\n  border-color: var(--dsw-alias-brand-primary);\r\n}\r\n\r\n.shp-input:disabled {\r\n  color: var(--dsw-alias-label-tertiary);\r\n  cursor: default;\r\n}\r\n\r\n/* 多行提示词输入框 */\r\n.shp-textarea {\r\n  width: 100%;\r\n  box-sizing: border-box;\r\n  min-height: 140px;\r\n  padding: 8px 12px;\r\n  border: 1px solid var(--dsw-alias-border-l2);\r\n  border-radius: 8px;\r\n  background: var(--dsw-alias-bg-layer-3);\r\n  font: inherit;\r\n  font-family: ui-monospace, SFMono-Regular, Consolas, \"Liberation Mono\", monospace;\r\n  font-size: 13px;\r\n  line-height: 1.5;\r\n  color: var(--dsw-alias-label-primary);\r\n  resize: vertical;\r\n}\r\n\r\n.shp-textarea:focus-visible {\r\n  outline: none;\r\n  border-color: var(--dsw-alias-brand-primary);\r\n}\r\n\r\n.shp-textarea:disabled {\r\n  color: var(--dsw-alias-label-tertiary);\r\n  cursor: default;\r\n}\r\n\r\n.shp-checkbox {\r\n  width: 16px;\r\n  height: 16px;\r\n  margin: 0;\r\n  accent-color: var(--dsw-alias-brand-primary);\r\n  cursor: pointer;\r\n}\r\n\r\n.shp-checkbox:disabled {\r\n  cursor: default;\r\n  opacity: 0.4;\r\n}\r\n\r\n.shp-hint {\r\n  margin: 0;\r\n  font-size: 12px;\r\n  line-height: 1.5;\r\n  color: var(--dsw-alias-label-tertiary);\r\n}\r\n\r\n.shp-footer {\r\n  display: flex;\r\n  align-items: center;\r\n  justify-content: flex-end;\r\n  gap: 8px;\r\n  padding: 12px 0 4px;\r\n  border-top: 1px solid var(--dsw-alias-border-l2);\r\n}\r\n\r\n.shp-failed {\r\n  flex: 1;\r\n  min-width: 0;\r\n  margin: 0;\r\n  font-size: 12px;\r\n  line-height: 1.5;\r\n  color: var(--dsw-alias-label-error);\r\n}\r\n\r\n.shp-discard,\r\n.shp-save {\r\n  appearance: none;\r\n  border: 1px solid transparent;\r\n  border-radius: 8px;\r\n  padding: 5px 14px;\r\n  font: inherit;\r\n  font-size: 13px;\r\n  line-height: 1.5;\r\n  cursor: pointer;\r\n}\r\n\r\n.shp-discard {\r\n  border-color: var(--dsw-alias-border-l2);\r\n  background: none;\r\n  color: var(--dsw-alias-label-secondary);\r\n}\r\n\r\n.shp-discard:hover:not(:disabled) {\r\n  color: var(--dsw-alias-label-primary);\r\n  border-color: var(--dsw-alias-label-dimmed);\r\n}\r\n\r\n.shp-save {\r\n  background: var(--dsw-alias-label-primary);\r\n  color: var(--dsw-alias-bg-layer-3);\r\n}\r\n\r\n.shp-discard:disabled,\r\n.shp-save:disabled {\r\n  opacity: 0.4;\r\n  cursor: default;\r\n}\r\n\r\n.shp-discard:focus-visible,\r\n.shp-save:focus-visible {\r\n  outline: 2px solid var(--dsw-alias-brand-primary);\r\n  outline-offset: 1px;\r\n}";
			//#endregion
			//#region src/client/Card.tsx
			/**
			* The settings card: an expandable entry in the web settings page's
			* "Plugin configuration" tab, keyed by the settings namespace it edits.
			* It draws its own chrome — mirroring the shared plugin-card design tokens
			* (see ./card.css) — because cross-plugin value imports are forbidden; the
			* card writes only through the staged form's save action.
			*/
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
				return /* @__PURE__ */ (0, react_jsx_runtime.jsx)("svg", {
					width: 14,
					height: 14,
					viewBox: "0 0 14 14",
					fill: "none",
					xmlns: "http://www.w3.org/2000/svg",
					"aria-hidden": "true",
					children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", {
						d: "M11.8486 5.5L11.4238 5.92383L8.69727 8.65137C8.44157 8.90706 8.21562 9.13382 8.01172 9.29785C7.79912 9.46883 7.55595 9.61756 7.25 9.66602C7.08435 9.69222 6.91565 9.69222 6.75 9.66602C6.44405 9.61756 6.20088 9.46883 5.98828 9.29785C5.78438 9.13382 5.55843 8.90706 5.30273 8.65137L2.57617 5.92383L2.15137 5.5L3 4.65137L3.42383 5.07617L6.15137 7.80273C6.42595 8.07732 6.59876 8.24849 6.74023 8.3623C6.87291 8.46904 6.92272 8.47813 6.9375 8.48047C6.97895 8.48703 7.02105 8.48703 7.0625 8.48047C7.07728 8.47813 7.12709 8.46904 7.25977 8.3623C7.40124 8.24849 7.57405 8.07732 7.84863 7.80273L10.5762 5.07617L11 4.65137L11.8486 5.5Z",
						fill: "currentColor"
					})
				});
			}
			/** The stylesheet text injected by the client entry's apply(). */
			const CARD_CSS = card_css_default;
			/** Copy used when the face carries no translator (a Host without the locale service). */
			const FALLBACK_COPY = {
				title: "提示词注入",
				description: "在每个会话的系统提示词头部注入自定义内容",
				enabledLabel: "启用注入",
				enabledHint: "关闭后不再向系统提示词头部注入任何内容",
				promptLabel: "提示词内容",
				promptHint: "保存后对下一次请求立即生效",
				overridden: "已覆盖",
				reset: "重置",
				unsaved: "未保存",
				readOnly: "当前配置为只读",
				saveFailed: "保存未生效，请重试",
				saving: "保存中…",
				save: "保存",
				discard: "放弃",
				expand: "展开",
				collapse: "收起"
			};
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
			function HeadPromptCard(props) {
				const state = (0, react.useSyncExternalStore)(subscribePromptCard, promptCardState, promptCardState);
				const [open, setOpen] = (0, react.useState)(false);
				const face = props ?? {};
				const bound = typeof face.t === "function" ? face.t : void 0;
				const t = (key) => bound?.(key) ?? FALLBACK_COPY[key] ?? key;
				const title = t("title");
				const description = t("description");
				return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("li", {
					className: `shp-card${open ? " shp-cardOpen" : ""}`,
					style: { listStyle: "none" },
					children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("button", {
						type: "button",
						className: "shp-header",
						"aria-expanded": open,
						"aria-label": `${t(open ? "collapse" : "expand")}: ${title}`,
						onClick: () => {
							setOpen(!open);
						},
						children: [
							/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
								className: "shp-headText",
								children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
									className: "shp-name",
									children: title
								}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
									className: "shp-description",
									children: description
								})]
							}),
							state.dirty ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
								className: "shp-pending",
								children: t("unsaved")
							}) : null,
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
								className: "shp-chevron",
								style: { transform: open ? "rotate(180deg)" : "none" },
								children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(ChevronDownIcon, {})
							})
						]
					}), open ? /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: "shp-body",
						children: [
							!state.writable ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
								className: "shp-readOnly",
								role: "status",
								children: t("readOnly")
							}) : null,
							/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
								className: "shp-field",
								children: [
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
										className: "shp-head",
										children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("label", {
											className: "shp-label",
											htmlFor: "shp-enabled",
											children: t("enabledLabel")
										})
									}),
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
										id: "shp-enabled",
										className: "shp-checkbox",
										type: "checkbox",
										checked: state.enabled?.text === "true",
										disabled: !state.writable,
										onChange: (event) => {
											face.edit?.("enabled", event.target.checked ? "true" : "false");
										}
									}),
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
										className: "shp-hint",
										children: t("enabledHint")
									})
								]
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
								className: "shp-field",
								children: [
									/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
										className: "shp-head",
										children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("label", {
											className: "shp-label",
											htmlFor: "shp-prompt",
											children: t("promptLabel")
										}), state.prompt?.overridden ? /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
											className: "shp-badges",
											children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
												className: "shp-badge",
												children: t("overridden")
											}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
												type: "button",
												className: "shp-reset",
												disabled: !state.writable,
												onClick: () => {
													face.resetField?.("prompt");
												},
												children: t("reset")
											})]
										}) : null]
									}),
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)("textarea", {
										id: "shp-prompt",
										className: "shp-textarea",
										rows: 9,
										value: state.prompt?.text ?? "",
										disabled: !state.writable,
										onChange: (event) => {
											face.edit?.("prompt", event.target.value);
										}
									}),
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
										className: "shp-hint",
										children: t("promptHint")
									})
								]
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
								className: "shp-footer",
								children: [
									state.failed ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
										className: "shp-failed",
										role: "status",
										children: t("saveFailed")
									}) : null,
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
										type: "button",
										className: "shp-discard",
										disabled: !state.dirty || state.saving,
										onClick: () => {
											face.discard?.();
										},
										children: t("discard")
									}),
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
										type: "button",
										className: "shp-save",
										disabled: !state.dirty || state.invalid || state.saving,
										onClick: () => {
											face.save?.();
										},
										children: t(state.saving ? "saving" : "save")
									})
								]
							})
						]
					}) : null]
				});
			}
			//#endregion
			//#region src/client/plugin-settings-section.tsx
			/** Slot the container occupies (declared by the Host in both versions). */
			const SHARED_SECTION_SLOT = "settings.section";
			/** Container entry id: the shared block's identity, identical in every copy. */
			const SHARED_SECTION_ID = "plugin-settings";
			/** Child slot the container declares; every attached plugin registers into it. */
			const SHARED_ITEM_SLOT = "plugin-settings.item";
			/** Section label, spelled once so every attached plugin's nav row reads the same. */
			const SHARED_SECTION_LABEL = "插件设置";
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
			function SharedPluginSettingsSection(props) {
				const renderSlot = props.renderSlot;
				if (typeof renderSlot !== "function") {
					console.error("[dsh-session-prompt] shared block rendered without a renderSlot prop — props keys:", Object.keys(props ?? {}).join(","));
					return /* @__PURE__ */ (0, react_jsx_runtime.jsx)("ul", {
						className: "dsh-plugin-settings-cards",
						style: CARD_LIST_STYLE,
						children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("li", {
							style: {
								listStyle: "none",
								opacity: .7
							},
							children: "[dsh-session-prompt] 容器缺少 renderSlot（详情见浏览器控制台）"
						})
					});
				}
				return /* @__PURE__ */ (0, react_jsx_runtime.jsx)("ul", {
					className: "dsh-plugin-settings-cards",
					style: CARD_LIST_STYLE,
					children: renderSlot(SHARED_ITEM_SLOT, {})
				});
			}
			/** The card list wrapper: a plain column, tight gap, no list markers. */
			const CARD_LIST_STYLE = {
				display: "flex",
				flexDirection: "column",
				gap: 6,
				padding: 0,
				listStyle: "none"
			};
			//#endregion
			//#region src/client/index.tsx
			/**
			* Settings namespace this card edits on 0.1.5. Spelled here rather than imported
			* from the Host package: a client package must not depend on a Host package.
			*/
			const SETTINGS_NS = "session-head-prompt";
			/**
			* Package name: the id this plugin registers its card under inside the shared
			* block's child slot (every attached plugin owns exactly one such id).
			*/
			const PACKAGE_ID = "dsh-session-prompt";
			/**
			* Profile entry id the 0.1.7 settings form is addressed by.
			*
			* On 0.1.7 a plugin's settings namespace IS its profile entry id (the Loader row
			* id): the Host keys every served form by `entry.options.id` and resolves a
			* write with `configEditor.entries().find((row) => row.options.id === ns)`, and
			* the built-in cards follow the same rule (their keys are the row ids
			* `bash-sandbox`, `pwsh-sandbox`, `ui-conversation` — not package names). This
			* plugin's row is declared in ./cordis.patch.yml as `id: session-head-prompt`,
			* which is also the namespace the 0.1.5 half registers, so both versions edit
			* one and the same section. Asking for any other id (the package name included)
			* answers "No configurable plugin entry".
			*/
			const ENTRY_ID = "session-head-prompt";
			/** Bridges the settings scope onto the card's staged form. */
			var HeadPromptCardController = class {
				scope;
				form;
				/** @param scope - the settings scope for this card (plugin-owned on both hosts). */
				constructor(scope) {
					this.scope = scope;
					this.form = new CardForm(scope, [booleanField("enabled"), textField("prompt")]);
					const store = this.form.bind(() => this.project());
					setPromptCardState(store.getSnapshot());
					store.subscribe(() => {
						setPromptCardState(store.getSnapshot());
					});
				}
				project() {
					return {
						...this.form.shell(),
						enabled: this.form.field("enabled"),
						prompt: this.form.field("prompt")
					};
				}
				/** Build the face the card's slot registration injects (plain props only). */
				inject(t) {
					return {
						t,
						...this.form.actions()
					};
				}
			};
			const inject = ["slots", "locale"];
			/**
			* Mount the settings card.
			* @param ctx - the browser plugin context.
			*/
			function apply(ctx) {
				ctx.effect(() => {
					const tag = document.createElement("style");
					tag.dataset.plugin = "dsh-session-head-prompt";
					tag.textContent = CARD_CSS;
					document.head.appendChild(tag);
					return () => {
						tag.remove();
					};
				}, "session-head-prompt: card stylesheet");
				ctx.effect(() => ctx.locale.register(LOCALE_NS, {
					zh,
					en
				}), "session-head-prompt: card dictionaries");
				const supervision = ctx.slots;
				if (typeof supervision.onEntryError === "function") ctx.effect(() => supervision.onEntryError((key, entry, error, info) => {
					const id = entry?.options;
					const owner = id?.id ?? id?.key ?? "(unknown)";
					if (key === "plugin-settings.item" || key === "settings.section" || owner === "dsh-session-prompt" || owner === "session-head-prompt") console.error("[dsh-session-prompt] ENTRY CRASHED slot=", key, "owner=", owner, "abdicated=", info?.abdicated === true, "cause=", error);
				}), "session-head-prompt: entry-crash supervision");
				let promptController;
				const adoptScope = (scope) => {
					promptController = new HeadPromptCardController(scope);
				};
				const registerCard = (slot) => {
					const localeFace = ctx.locale;
					const t = typeof localeFace.bind === "function" ? localeFace.bind.call(ctx.locale, LOCALE_NS) : (key) => key;
					const getInject = () => promptController ? promptController.inject(t) : {
						t,
						edit: () => {},
						resetField: () => {},
						save: () => {},
						discard: () => {}
					};
					if (slot === "settings.plugin.item") return ctx.slots.inject(slot, () => ctx.slots.register({
						name: slot,
						key: SETTINGS_NS,
						priority: 50,
						inject: getInject
					}, HeadPromptCard));
					return ctx.slots.inject(slot, () => ctx.slots.register({
						name: slot,
						id: PACKAGE_ID,
						order: 10,
						inject: getInject
					}, HeadPromptCard));
				};
				let joined = false;
				const joinSharedSettingsBlock = () => {
					if (joined) return;
					joined = true;
					ctx.slots.inject(SHARED_SECTION_SLOT, () => {
						let disposeContainer;
						if (!ctx.slots.entries("settings.section").some((entry) => entry.options?.id === "plugin-settings")) try {
							disposeContainer = ctx.slots.register({
								name: SHARED_SECTION_SLOT,
								id: SHARED_SECTION_ID,
								order: 900,
								label: () => SHARED_SECTION_LABEL,
								children: { [SHARED_ITEM_SLOT]: {
									kind: "list",
									scope: "root"
								} }
							}, SharedPluginSettingsSection);
						} catch (error) {
							console.error("[dsh-session-prompt] shared block container registration failed:", error);
						}
						const disposeItem = registerCard(SHARED_ITEM_SLOT);
						return () => {
							disposeItem();
							disposeContainer?.();
						};
					});
				};
				const ownScope = new OwnSettingsScope();
				ownScope.load().catch(() => {});
				adoptScope(ownScope);
				joinSharedSettingsBlock();
			}
			//#endregion
			exports.ENTRY_ID = ENTRY_ID;
			exports.LOCALE_NS = LOCALE_NS;
			exports.PACKAGE_ID = PACKAGE_ID;
			exports.SETTINGS_NS = SETTINGS_NS;
			exports.SHARED_ITEM_SLOT = SHARED_ITEM_SLOT;
			exports.SHARED_SECTION_ID = SHARED_SECTION_ID;
			exports.SHARED_SECTION_SLOT = SHARED_SECTION_SLOT;
			exports.apply = apply;
			exports.inject = inject;
			return module.exports;
		} catch (cause) {
			throw __dshClientCompatGuard(cause);
		}
	}
});

//# sourceMappingURL=client.js.map