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
			let _deepseek_ai_dsh_client_ui_primitives = require("@deepseek-ai/dsh-client-ui-primitives");
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
						available: snapshot.status === "ready",
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
			//#region src/client/Card.tsx
			/**
			* The settings card: an expandable entry in the web settings page's
			* "Plugin configuration" tab, keyed by the settings namespace it edits.
			* It draws its own chrome — mirroring the shared plugin-card design tokens
			* (see ./card.css) — because cross-plugin value imports are forbidden; the
			* card writes only through the staged form's save action.
			*/
			/** The stylesheet text injected by the client entry's apply(). */
			const CARD_CSS = "/*\r\n * 设置卡片外观 — 复刻系统共享卡片的布局与设计 token(--dsw-alias-*),\r\n * 类名加 shp- 前缀避免与宿主样式冲突;由构建期的 css-text 内联,\r\n * apply 时注入 <style>。\r\n */\r\n\r\n.shp-card {\r\n  list-style: none;\r\n  border: 1px solid var(--dsw-alias-border-l2);\r\n  border-radius: 12px;\r\n  background: var(--dsw-alias-bg-layer-3);\r\n  transition: border-color 0.16s, background 0.16s;\r\n}\r\n\r\n.shp-card:hover {\r\n  border-color: var(--dsw-alias-label-dimmed);\r\n}\r\n\r\n/* 展开的卡片作为\"正在操作\"的表现,而非仅仅变高 */\r\n.shp-cardOpen {\r\n  background: var(--dsw-alias-bg-layer-2);\r\n  border-color: var(--dsw-alias-label-dimmed);\r\n}\r\n\r\n.shp-header {\r\n  width: 100%;\r\n  appearance: none;\r\n  border: 0;\r\n  background: none;\r\n  font: inherit;\r\n  color: inherit;\r\n  text-align: left;\r\n  cursor: pointer;\r\n  display: flex;\r\n  align-items: center;\r\n  gap: 12px;\r\n  padding: 14px 16px;\r\n  border-radius: 12px;\r\n}\r\n\r\n.shp-header:focus-visible {\r\n  outline: 2px solid var(--dsw-alias-brand-primary);\r\n  outline-offset: -2px;\r\n}\r\n\r\n.shp-headText {\r\n  flex: 1;\r\n  min-width: 0;\r\n  display: flex;\r\n  flex-direction: column;\r\n  gap: 4px;\r\n}\r\n\r\n.shp-name {\r\n  font-size: 15px;\r\n  font-weight: 600;\r\n  line-height: 1.4;\r\n  color: var(--dsw-alias-label-primary);\r\n}\r\n\r\n.shp-description {\r\n  font-size: 13px;\r\n  line-height: 1.5;\r\n  color: var(--dsw-alias-label-tertiary);\r\n}\r\n\r\n.shp-chevron {\r\n  flex: none;\r\n  color: var(--dsw-alias-label-tertiary);\r\n  transition: transform 0.16s;\r\n}\r\n\r\n.shp-chevronOpen {\r\n  transform: rotate(180deg);\r\n}\r\n\r\n.shp-body {\r\n  border-top: 1px solid var(--dsw-alias-border-l2);\r\n  margin: 0 16px;\r\n  padding-bottom: 8px;\r\n}\r\n\r\n.shp-readOnly {\r\n  margin: 12px 0 0;\r\n  font-size: 12px;\r\n  line-height: 1.5;\r\n  color: var(--dsw-alias-label-tertiary);\r\n}\r\n\r\n/* 挂在头部上,折叠时也能看到未保存的编辑 */\r\n.shp-pending {\r\n  flex: none;\r\n  border-radius: 999px;\r\n  padding: 1px 8px;\r\n  font-size: 11px;\r\n  line-height: 17px;\r\n  font-weight: 500;\r\n  white-space: nowrap;\r\n  background: var(--dsw-alias-bg-module-platform);\r\n  color: var(--dsw-alias-label-secondary);\r\n}\r\n\r\n.shp-field {\r\n  display: flex;\r\n  flex-direction: column;\r\n  gap: 6px;\r\n  padding: 12px 0;\r\n}\r\n\r\n.shp-field + .shp-field {\r\n  border-top: 1px solid var(--dsw-alias-border-l2);\r\n}\r\n\r\n.shp-head {\r\n  display: flex;\r\n  align-items: center;\r\n  gap: 8px;\r\n}\r\n\r\n.shp-label {\r\n  flex: 1;\r\n  min-width: 0;\r\n  font-size: 13px;\r\n  font-weight: 500;\r\n  line-height: 1.5;\r\n  color: var(--dsw-alias-label-primary);\r\n}\r\n\r\n.shp-badges {\r\n  display: inline-flex;\r\n  align-items: center;\r\n  gap: 8px;\r\n}\r\n\r\n.shp-badge {\r\n  border-radius: 999px;\r\n  padding: 1px 8px;\r\n  font-size: 11px;\r\n  line-height: 17px;\r\n  white-space: nowrap;\r\n  font-weight: 500;\r\n  background: var(--dsw-alias-bg-module-platform);\r\n  color: var(--dsw-alias-label-secondary);\r\n}\r\n\r\n.shp-reset {\r\n  border: none;\r\n  background: none;\r\n  padding: 0;\r\n  font: inherit;\r\n  font-size: 12px;\r\n  line-height: 1.5;\r\n  color: var(--dsw-alias-label-secondary);\r\n  cursor: pointer;\r\n}\r\n\r\n.shp-reset:hover:not(:disabled) {\r\n  color: var(--dsw-alias-label-primary);\r\n}\r\n\r\n.shp-reset:disabled {\r\n  cursor: default;\r\n}\r\n\r\n.shp-input {\r\n  width: 100%;\r\n  box-sizing: border-box;\r\n  height: 34px;\r\n  padding: 0 12px;\r\n  border: 1px solid var(--dsw-alias-border-l2);\r\n  border-radius: 8px;\r\n  background: var(--dsw-alias-bg-layer-3);\r\n  font: inherit;\r\n  font-size: 13px;\r\n  line-height: 1.5;\r\n  color: var(--dsw-alias-label-primary);\r\n}\r\n\r\n.shp-input:focus-visible {\r\n  outline: none;\r\n  border-color: var(--dsw-alias-brand-primary);\r\n}\r\n\r\n.shp-input:disabled {\r\n  color: var(--dsw-alias-label-tertiary);\r\n  cursor: default;\r\n}\r\n\r\n/* 多行提示词输入框 */\r\n.shp-textarea {\r\n  width: 100%;\r\n  box-sizing: border-box;\r\n  min-height: 140px;\r\n  padding: 8px 12px;\r\n  border: 1px solid var(--dsw-alias-border-l2);\r\n  border-radius: 8px;\r\n  background: var(--dsw-alias-bg-layer-3);\r\n  font: inherit;\r\n  font-family: ui-monospace, SFMono-Regular, Consolas, \"Liberation Mono\", monospace;\r\n  font-size: 13px;\r\n  line-height: 1.5;\r\n  color: var(--dsw-alias-label-primary);\r\n  resize: vertical;\r\n}\r\n\r\n.shp-textarea:focus-visible {\r\n  outline: none;\r\n  border-color: var(--dsw-alias-brand-primary);\r\n}\r\n\r\n.shp-textarea:disabled {\r\n  color: var(--dsw-alias-label-tertiary);\r\n  cursor: default;\r\n}\r\n\r\n.shp-checkbox {\r\n  width: 16px;\r\n  height: 16px;\r\n  margin: 0;\r\n  accent-color: var(--dsw-alias-brand-primary);\r\n  cursor: pointer;\r\n}\r\n\r\n.shp-checkbox:disabled {\r\n  cursor: default;\r\n  opacity: 0.4;\r\n}\r\n\r\n.shp-hint {\r\n  margin: 0;\r\n  font-size: 12px;\r\n  line-height: 1.5;\r\n  color: var(--dsw-alias-label-tertiary);\r\n}\r\n\r\n.shp-footer {\r\n  display: flex;\r\n  align-items: center;\r\n  justify-content: flex-end;\r\n  gap: 8px;\r\n  padding: 12px 0 4px;\r\n  border-top: 1px solid var(--dsw-alias-border-l2);\r\n}\r\n\r\n.shp-failed {\r\n  flex: 1;\r\n  min-width: 0;\r\n  margin: 0;\r\n  font-size: 12px;\r\n  line-height: 1.5;\r\n  color: var(--dsw-alias-label-error);\r\n}\r\n\r\n.shp-discard,\r\n.shp-save {\r\n  appearance: none;\r\n  border: 1px solid transparent;\r\n  border-radius: 8px;\r\n  padding: 5px 14px;\r\n  font: inherit;\r\n  font-size: 13px;\r\n  line-height: 1.5;\r\n  cursor: pointer;\r\n}\r\n\r\n.shp-discard {\r\n  border-color: var(--dsw-alias-border-l2);\r\n  background: none;\r\n  color: var(--dsw-alias-label-secondary);\r\n}\r\n\r\n.shp-discard:hover:not(:disabled) {\r\n  color: var(--dsw-alias-label-primary);\r\n  border-color: var(--dsw-alias-label-dimmed);\r\n}\r\n\r\n.shp-save {\r\n  background: var(--dsw-alias-label-primary);\r\n  color: var(--dsw-alias-bg-layer-3);\r\n}\r\n\r\n.shp-discard:disabled,\r\n.shp-save:disabled {\r\n  opacity: 0.4;\r\n  cursor: default;\r\n}\r\n\r\n.shp-discard:focus-visible,\r\n.shp-save:focus-visible {\r\n  outline: 2px solid var(--dsw-alias-brand-primary);\r\n  outline-offset: 1px;\r\n}";
			/**
			* Render the card.
			* @param props - locale copy, the card snapshot, and its form actions.
			* @returns the card, or nothing while the namespace is not served.
			*/
			function HeadPromptCard(props) {
				const { t } = props;
				const state = props.useHeadPromptCard((snapshot) => snapshot);
				const [open, setOpen] = (0, react.useState)(false);
				if (!state.available) return null;
				const title = t("title");
				return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("li", {
					className: `shp-card${open ? " shp-cardOpen" : ""}`,
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
									children: t("description")
								})]
							}),
							state.dirty ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
								className: "shp-pending",
								children: t("unsaved")
							}) : null,
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconChevronDownOutline14, { className: `shp-chevron${open ? " shp-chevronOpen" : ""}` })
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
										checked: state.enabled.text === "true",
										disabled: !state.writable,
										onChange: (event) => {
											props.edit("enabled", event.target.checked ? "true" : "false");
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
										}), state.prompt.overridden ? /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
											className: "shp-badges",
											children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
												className: "shp-badge",
												children: t("overridden")
											}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
												type: "button",
												className: "shp-reset",
												disabled: !state.writable,
												onClick: () => {
													props.resetField("prompt");
												},
												children: t("reset")
											})]
										}) : null]
									}),
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)("textarea", {
										id: "shp-prompt",
										className: "shp-textarea",
										rows: 9,
										value: state.prompt.text,
										disabled: !state.writable,
										onChange: (event) => {
											props.edit("prompt", event.target.value);
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
										onClick: props.discard,
										children: t("discard")
									}),
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
										type: "button",
										className: "shp-save",
										disabled: !state.dirty || state.invalid || state.saving,
										onClick: props.save,
										children: t(state.saving ? "saving" : "save")
									})
								]
							})
						]
					}) : null]
				});
			}
			//#endregion
			//#region src/client/index.tsx
			/**
			* Settings namespace this card edits. Spelled here rather than imported from
			* the Host package: a client package must not depend on a Host package.
			*/
			const SETTINGS_NS = "session-head-prompt";
			/** Required services. */
			const inject = [
				"slots",
				"locale",
				"settingsScope"
			];
			/** Bridges the settings scope onto the card's staged form. */
			var HeadPromptCardController = class {
				form;
				store;
				/** @param scope - the bound settings scope for this card's namespace. */
				constructor(scope) {
					this.form = new CardForm(scope, [booleanField("enabled"), textField("prompt")]);
					this.store = this.form.bind(() => this.project());
				}
				project() {
					return {
						...this.form.shell(),
						enabled: this.form.field("enabled"),
						prompt: this.form.field("prompt")
					};
				}
				/** Build the face the card's slot registration injects. */
				inject() {
					return {
						hooks: { headPromptCard: this.store },
						...this.form.actions()
					};
				}
			};
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
				const controller = new HeadPromptCardController(ctx.settingsScope.bind({ namespace: SETTINGS_NS }));
				ctx.slots.inject("settings.plugin.item", () => ctx.slots.register({
					name: "settings.plugin.item",
					key: SETTINGS_NS,
					locale: LOCALE_NS,
					inject: () => controller.inject()
				}, HeadPromptCard));
			}
			//#endregion
			exports.LOCALE_NS = LOCALE_NS;
			exports.SETTINGS_NS = SETTINGS_NS;
			exports.apply = apply;
			exports.inject = inject;
			return module.exports;
		} catch (cause) {
			throw __dshClientCompatGuard(cause);
		}
	}
});

//# sourceMappingURL=client.js.map