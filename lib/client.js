window.__ModuleLoader__.load({
	id: "dsh-session-prompt",
	factory: (require) => {
		var module = { exports: {} };
		var exports = module.exports;
		Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
		let _deepseek_ai_dsh_client_runtime_client = require("@deepseek-ai/dsh-client-runtime/client");
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
				const store = (0, _deepseek_ai_dsh_client_runtime_client.createSnapshotStore)(project());
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
		const CARD_CSS = "/*\n * 设置卡片外观 — 复刻系统共享卡片的布局与设计 token(--dsw-alias-*),\n * 类名加 shp- 前缀避免与宿主样式冲突;由构建期的 css-text 内联,\n * apply 时注入 <style>。\n */\n\n.shp-card {\n  list-style: none;\n  border: 1px solid var(--dsw-alias-border-l2);\n  border-radius: 12px;\n  background: var(--dsw-alias-bg-layer-3);\n  transition: border-color 0.16s, background 0.16s;\n}\n\n.shp-card:hover {\n  border-color: var(--dsw-alias-label-dimmed);\n}\n\n/* 展开的卡片作为\"正在操作\"的表现,而非仅仅变高 */\n.shp-cardOpen {\n  background: var(--dsw-alias-bg-layer-2);\n  border-color: var(--dsw-alias-label-dimmed);\n}\n\n.shp-header {\n  width: 100%;\n  appearance: none;\n  border: 0;\n  background: none;\n  font: inherit;\n  color: inherit;\n  text-align: left;\n  cursor: pointer;\n  display: flex;\n  align-items: center;\n  gap: 12px;\n  padding: 14px 16px;\n  border-radius: 12px;\n}\n\n.shp-header:focus-visible {\n  outline: 2px solid var(--dsw-alias-brand-primary);\n  outline-offset: -2px;\n}\n\n.shp-headText {\n  flex: 1;\n  min-width: 0;\n  display: flex;\n  flex-direction: column;\n  gap: 4px;\n}\n\n.shp-name {\n  font-size: 15px;\n  font-weight: 600;\n  line-height: 1.4;\n  color: var(--dsw-alias-label-primary);\n}\n\n.shp-description {\n  font-size: 13px;\n  line-height: 1.5;\n  color: var(--dsw-alias-label-tertiary);\n}\n\n.shp-chevron {\n  flex: none;\n  color: var(--dsw-alias-label-tertiary);\n  transition: transform 0.16s;\n}\n\n.shp-chevronOpen {\n  transform: rotate(180deg);\n}\n\n.shp-body {\n  border-top: 1px solid var(--dsw-alias-border-l2);\n  margin: 0 16px;\n  padding-bottom: 8px;\n}\n\n.shp-readOnly {\n  margin: 12px 0 0;\n  font-size: 12px;\n  line-height: 1.5;\n  color: var(--dsw-alias-label-tertiary);\n}\n\n/* 挂在头部上,折叠时也能看到未保存的编辑 */\n.shp-pending {\n  flex: none;\n  border-radius: 999px;\n  padding: 1px 8px;\n  font-size: 11px;\n  line-height: 17px;\n  font-weight: 500;\n  white-space: nowrap;\n  background: var(--dsw-alias-bg-module-platform);\n  color: var(--dsw-alias-label-secondary);\n}\n\n.shp-field {\n  display: flex;\n  flex-direction: column;\n  gap: 6px;\n  padding: 12px 0;\n}\n\n.shp-field + .shp-field {\n  border-top: 1px solid var(--dsw-alias-border-l2);\n}\n\n.shp-head {\n  display: flex;\n  align-items: center;\n  gap: 8px;\n}\n\n.shp-label {\n  flex: 1;\n  min-width: 0;\n  font-size: 13px;\n  font-weight: 500;\n  line-height: 1.5;\n  color: var(--dsw-alias-label-primary);\n}\n\n.shp-badges {\n  display: inline-flex;\n  align-items: center;\n  gap: 8px;\n}\n\n.shp-badge {\n  border-radius: 999px;\n  padding: 1px 8px;\n  font-size: 11px;\n  line-height: 17px;\n  white-space: nowrap;\n  font-weight: 500;\n  background: var(--dsw-alias-bg-module-platform);\n  color: var(--dsw-alias-label-secondary);\n}\n\n.shp-reset {\n  border: none;\n  background: none;\n  padding: 0;\n  font: inherit;\n  font-size: 12px;\n  line-height: 1.5;\n  color: var(--dsw-alias-label-secondary);\n  cursor: pointer;\n}\n\n.shp-reset:hover:not(:disabled) {\n  color: var(--dsw-alias-label-primary);\n}\n\n.shp-reset:disabled {\n  cursor: default;\n}\n\n.shp-input {\n  width: 100%;\n  box-sizing: border-box;\n  height: 34px;\n  padding: 0 12px;\n  border: 1px solid var(--dsw-alias-border-l2);\n  border-radius: 8px;\n  background: var(--dsw-alias-bg-layer-3);\n  font: inherit;\n  font-size: 13px;\n  line-height: 1.5;\n  color: var(--dsw-alias-label-primary);\n}\n\n.shp-input:focus-visible {\n  outline: none;\n  border-color: var(--dsw-alias-brand-primary);\n}\n\n.shp-input:disabled {\n  color: var(--dsw-alias-label-tertiary);\n  cursor: default;\n}\n\n/* 多行提示词输入框 */\n.shp-textarea {\n  width: 100%;\n  box-sizing: border-box;\n  min-height: 140px;\n  padding: 8px 12px;\n  border: 1px solid var(--dsw-alias-border-l2);\n  border-radius: 8px;\n  background: var(--dsw-alias-bg-layer-3);\n  font: inherit;\n  font-family: ui-monospace, SFMono-Regular, Consolas, \"Liberation Mono\", monospace;\n  font-size: 13px;\n  line-height: 1.5;\n  color: var(--dsw-alias-label-primary);\n  resize: vertical;\n}\n\n.shp-textarea:focus-visible {\n  outline: none;\n  border-color: var(--dsw-alias-brand-primary);\n}\n\n.shp-textarea:disabled {\n  color: var(--dsw-alias-label-tertiary);\n  cursor: default;\n}\n\n.shp-checkbox {\n  width: 16px;\n  height: 16px;\n  margin: 0;\n  accent-color: var(--dsw-alias-brand-primary);\n  cursor: pointer;\n}\n\n.shp-checkbox:disabled {\n  cursor: default;\n  opacity: 0.4;\n}\n\n.shp-hint {\n  margin: 0;\n  font-size: 12px;\n  line-height: 1.5;\n  color: var(--dsw-alias-label-tertiary);\n}\n\n.shp-footer {\n  display: flex;\n  align-items: center;\n  justify-content: flex-end;\n  gap: 8px;\n  padding: 12px 0 4px;\n  border-top: 1px solid var(--dsw-alias-border-l2);\n}\n\n.shp-failed {\n  flex: 1;\n  min-width: 0;\n  margin: 0;\n  font-size: 12px;\n  line-height: 1.5;\n  color: var(--dsw-alias-label-error);\n}\n\n.shp-discard,\n.shp-save {\n  appearance: none;\n  border: 1px solid transparent;\n  border-radius: 8px;\n  padding: 5px 14px;\n  font: inherit;\n  font-size: 13px;\n  line-height: 1.5;\n  cursor: pointer;\n}\n\n.shp-discard {\n  border-color: var(--dsw-alias-border-l2);\n  background: none;\n  color: var(--dsw-alias-label-secondary);\n}\n\n.shp-discard:hover:not(:disabled) {\n  color: var(--dsw-alias-label-primary);\n  border-color: var(--dsw-alias-label-dimmed);\n}\n\n.shp-save {\n  background: var(--dsw-alias-label-primary);\n  color: var(--dsw-alias-bg-layer-3);\n}\n\n.shp-discard:disabled,\n.shp-save:disabled {\n  opacity: 0.4;\n  cursor: default;\n}\n\n.shp-discard:focus-visible,\n.shp-save:focus-visible {\n  outline: 2px solid var(--dsw-alias-brand-primary);\n  outline-offset: 1px;\n}";
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
	}
});

//# sourceMappingURL=client.js.map