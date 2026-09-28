import z from "@deepseek-ai/schemastery";
import { randomBytes } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, readdirSync, realpathSync, renameSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
//#region src/settings-store.js
/**
* Plugin-owned settings store — the single source of truth for this plugin's
* user configuration on every host line.
*
* WHY THIS EXISTS
*
* DSH 0.1.7 persists a settings write through the profile patch
* (`configEditor.edit` → cordis.patch.yml), and every such write reconciles the
* whole loader tree and hot-reloads the plugin's fiber (~1–1.5 s, plus a storm
* of client mirror refreshes). The plugin's own files — the credential, the
* catalog cache — have always lived in `<profile>/.dsh-session-prompt/`, so the
* settings move there too: a write becomes a small atomic local file write with
* an in-memory apply, no tree reconcile, no reload.
*
* FILE
*   <profile>/.dsh-session-prompt/settings.json
*
* The profile directory is discovered the same way the credential store's is:
* `$DSH_HOME/profiles/*`, keeping the one whose package.json declares this
* plugin (and, when several do, the one whose node_modules link resolves to
* this package). `DSH_SESSION_PROMPT_DATA_DIR` overrides the whole directory —
* the tests and a relocated profile use it.
*
* MIGRATION (one time, on the first boot after upgrading)
*   the file is absent → seed it from the composition entry config (the values
*   the profile patch carried) → write the file → delete ONLY this plugin's own
*   keys from the entry config (see ./index.js), so the profile row returns to
*   its shipped state and no second source of truth remains.
*
* @module dsh-session-head-prompt/settings-store
*/
/** Package name, used to find the declaring profile. */
const PACKAGE_NAME = "dsh-session-prompt";
/** Data-directory name inside the profile (same directory as the credential). */
const DATA_DIR_NAME = ".dsh-session-prompt";
/** Settings file name inside the data directory. */
const SETTINGS_FILE_NAME = "settings.json";
/** Environment override for the whole data directory (tests, relocated profiles). */
const DATA_DIR_ENV = "DSH_SESSION_PROMPT_DATA_DIR";
/**
* Resolve `$DSH_HOME` the way the Host does, without importing the Host's
* path helper (a client bundle must not depend on a Host package, and this
* module runs inside the host process where that helper is not exported to
* plugins either).
* @returns {string} the Harness home directory.
*/
function dshHome() {
	const fromEnv = process.env.DSH_HOME?.trim();
	if (fromEnv) return fromEnv;
	return join(homedir(), ".dsh");
}
/**
* This package's own root (the checkout, or the profile's node_modules copy).
* @returns {string} absolute path.
*/
function packageRoot() {
	return dirname(fileURLToPath(import.meta.url)).replace(/[\\/]lib$/, "");
}
/** Read a directory's package.json dependencies, tolerating absence. */
function declaredBy(dir, packageName) {
	try {
		const manifest = JSON.parse(readFileSync(join(dir, "package.json"), "utf8"));
		return typeof {
			...manifest.dependencies,
			...manifest.devDependencies
		}[packageName] === "string";
	} catch {
		return false;
	}
}
/**
* The profile that owns this plugin's data: the single profile under
* `$DSH_HOME/profiles` declaring this package, or — when several do — the one
* whose installed copy resolves to this package.
* @returns {string | undefined} the profile directory, or undefined when none
*   declares this plugin (a bare checkout run: the caller then uses the env
*   override or falls back to the Home itself).
*/
function discoverProfileDir() {
	const override = process.env[DATA_DIR_ENV]?.trim();
	if (override) return override;
	const root = join(dshHome(), "profiles");
	let entries;
	try {
		entries = readdirSync(root, { withFileTypes: true });
	} catch {
		return;
	}
	const candidates = entries.filter((entry) => entry.isDirectory() || entry.isSymbolicLink()).map((entry) => join(root, entry.name)).filter((dir) => declaredBy(dir, PACKAGE_NAME));
	if (candidates.length === 0) return void 0;
	if (candidates.length === 1) return candidates[0];
	const own = packageRoot();
	return candidates.find((dir) => {
		try {
			return realpathSync(join(dir, "node_modules", PACKAGE_NAME)) === realpathSync(own);
		} catch {
			return false;
		}
	}) ?? candidates[0];
}
/** This plugin's data directory, created on demand. @returns {string} absolute path. */
function dataDir() {
	const profile = discoverProfileDir() ?? dshHome();
	return join(profile, DATA_DIR_NAME);
}
/** Absolute path of the settings file. @returns {string} */
function settingsFilePath() {
	return join(dataDir(), SETTINGS_FILE_NAME);
}
/** Read + parse the settings file; `undefined` when absent or unreadable. */
function readFile() {
	const path = settingsFilePath();
	if (!existsSync(path)) return void 0;
	try {
		const parsed = JSON.parse(readFileSync(path, "utf8"));
		return parsed !== null && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : void 0;
	} catch {
		return;
	}
}
/**
* Write the settings file atomically (tmp + rename), creating the directory.
* @param {object} values - the whole user layer (keys this plugin owns).
* @returns {void}
*/
function writeSettings(values) {
	const path = settingsFilePath();
	mkdirSync(dirname(path), { recursive: true });
	const tmp = `${path}.tmp`;
	writeFileSync(tmp, `${JSON.stringify(values, null, 2)}\n`, "utf8");
	renameSync(tmp, path);
}
/**
* Reserved bookkeeping key: how many writes the settings card has made through
* this store. Its presence separates "the file holds the startup seed" from
* "the file holds the user's live edits" — see the seed rule in ./index.js.
* Field readers address their fields by name and never collide with it.
*/
const WRITE_MARK = "__writes";
/**
* One store instance: the plugin's own settings file, with the entry config as
* the migration source and the schema defaults as the last fallback.
*/
var SettingsStore = class {
	/** The user layer exactly as stored (presence marks an override). */
	user;
	/**
	* @param {object} [initial] - the user layer to adopt (migration seed).
	*/
	constructor(initial) {
		this.user = initial ?? readFile() ?? {};
	}
	/** Whether the store file exists (a fresh profile has none). */
	exists() {
		return existsSync(settingsFilePath());
	}
	/**
	* Whether the settings card has ever written through this store.
	*
	* While false the entry config stays authoritative; once the card writes,
	* the file is — a runtime edit must never be regressed by a stale row.
	* @returns {boolean}
	*/
	get edited() {
		return typeof this.user[WRITE_MARK] === "number" && this.user[WRITE_MARK] > 0;
	}
	/**
	* The effective value of one field: the stored user value, else the schema
	* default the caller passes in.
	* @param {string} field - field name.
	* @param {unknown} fallback - the schema default for this field.
	* @returns {unknown} the effective value.
	*/
	value(field, fallback) {
		return Object.hasOwn(this.user, field) ? this.user[field] : fallback;
	}
	/**
	* Apply one patch in memory and persist it.
	* @param {object} patch - field to value; a `null` value clears the field.
	* @param {boolean} [fromCard] - true when the settings card made this write;
	*   marks the file as holding live user edits from then on.
	* @returns {object} the new user layer.
	*/
	patch(patch, fromCard = false) {
		const next = { ...this.user };
		for (const [field, value] of Object.entries(patch)) if (value === null) delete next[field];
		else next[field] = value;
		if (fromCard) next[WRITE_MARK] = (typeof next[WRITE_MARK] === "number" ? next[WRITE_MARK] : 0) + 1;
		writeSettings(next);
		for (const key of Object.keys(this.user)) delete this.user[key];
		Object.assign(this.user, next);
		return this.user;
	}
	/** Read the current user layer without touching the disk. */
	values() {
		return this.user;
	}
};
//#endregion
//#region src/index.js
/**
* Session head prompt — Host half (plain ESM; the node build config copies
* this file to lib/index.js verbatim).
*
* Registers one user-editable configuration and one global system-prompt
* section that renders the configured text at the VERY TOP of every session's
* assembled prompt (before the harness identity opener at -100 and the
* deployment persona at 0). Because the section text is a provider evaluated
* at each assembly, edits made on the web settings page take effect on the
* next request — no re-registration, no restart.
*
* @module dsh-session-head-prompt
*/
/** Plugin-owned keys: exactly what the migration deletes from the entry config. */
const OWN_KEYS = ["enabled", "prompt"];
/**
* The schema defaults, spelled out: the seed rule below uses them to tell a
* real profile override apart from the defaults the Host hands out once the
* one-time cleanup has emptied the entry's config.
*/
const DEFAULT_FOR_FIELD = {
	enabled: true,
	prompt: ""
};
/** Route base for the browser half's settings face. */
const ROUTE_BASE = "/plugins/dsh-session-prompt";
/**
* Read one config field.
*
* A `.volatile()` field parses into a stable reference read with `.get()`
* (0.1.7), while an older host hands the plain value through; a profile that
* supplies its own object (a hand-written entry, the smoke test) keeps working
* because a non-reference value falls through unchanged. Every read of a
* volatile field goes through here — a raw read would compare and render the
* reference object instead of the value behind it.
* @param {object} config - the object the field lives on.
* @param {string} field - field name.
* @returns {unknown} the field's current value, or undefined when it carries none.
*/
function readField(config, field) {
	const value = config?.[field];
	return value !== null && typeof value === "object" && typeof value.get === "function" ? value.get() : value;
}
/**
* Mark one field volatile.
*
* The marker is what puts the field into the 0.1.7 settings document, and what
* makes the Host hand `apply` a live reference instead of a frozen value. The
* call is probed so a schemastery without the method (or with only the older
* `extra` escape hatch) still produces a field the Host serves.
* @param {object} field - the field schema to mark.
* @returns {object} the marked schema, or the field unchanged.
*/
function volatileField(field) {
	if (typeof field.volatile === "function") return field.volatile();
	if (typeof field.extra === "function") return field.extra("volatile", true);
	if (field && typeof field === "object") {
		field.meta = {
			...field.meta,
			volatile: true
		};
		return field;
	}
	return field;
}
/**
* Profile entry id this plugin's settings are addressed by.
*
* On 0.1.7 a plugin's settings namespace IS its profile entry id (the Loader
* row id): the Host keys every served form by `entry.options.id`, and this
* plugin's row is declared in ./cordis.patch.yml as `id: session-head-prompt`.
* @type {string}
*/
const SETTINGS_NAMESPACE = "session-head-prompt";
/**
* Prompt order of the injected section. Sections concatenate in ascending
* order; the harness identity sits at -100 and the deployment persona at 0.
* -200 renders first, so the custom prompt is the first thing the model
* reads in every session.
*/
const HEAD_ORDER = -200;
/** Unique section name (a duplicate registration would throw). */
const HEAD_SECTION = "session-head-prompt:head";
/** Cordis plugin name (the row id in cordis.yml may differ). */
const name = "session-head-prompt";
/** The assembly registry this plugin contributes to, plus the card's settings face. */
const inject = ["systemPrompt", "webServer"];
/**
* Plugin configuration: whether injection is on, and the prompt text.
* @typedef {object} Config
* @property {boolean} [enabled] Master switch; disabled sections render nothing.
* @property {string} [prompt]   Text injected at the head of every session's system prompt.
*/
/** Runtime schema for the row and the settings namespace (defaults included). */
const Config = z.object({
	enabled: volatileField(z.boolean().default(true)),
	prompt: volatileField(z.string().default(""))
});
/**
* Matches a complete `{{…}}` group. The prompt renderer interpolates strict
* `{{variable}}` references and THROWS on unknown or malformed groups (a
* `{{name}}` nobody registered, `{{}}`, `{{ spaced }}`), which would break
* every request. The settings validator below therefore refuses such text at
* the write that produces it, before anything is stored. A lone `{{` without
* a later `}}` is literal prose and stays allowed.
*/
const COMPLETE_GROUP = /\{\{[^{}]*\}\}/;
/**
* Whether a value equals the schema default.
*
* Deep, and it has to be: `[]` and `[]` are two array literals, so `!==`
* reports every array field as a real override — which silently erased a
* user's disabled-model list on the boot after the migration. Configuration
* values are JSON-shaped, so a canonical-JSON comparison is exact here.
*/
function isDefaultValue(value, fallback) {
	if (value === fallback) return true;
	if (typeof value !== typeof fallback) return false;
	if (value === null || fallback === null || typeof value !== "object") return false;
	try {
		return JSON.stringify(value) === JSON.stringify(fallback);
	} catch {
		return false;
	}
}
/**
* Delete this plugin's own keys from the profile entry config, leaving every
* other key of the row untouched.
*
* One-time, right after the settings file has been seeded: the entry returns to
* its shipped state, so no second source of truth remains. The change callback
* returns INHERITED plus the row's foreign keys, not "the row minus our keys":
* the profile's composition check (`isDeepStrictEqual(next, inherited)`) is
* what lets the editor drop the row's user layer entirely, and a hand-built
* `{}` fails that check whenever a bundle layer still carries a config for this
* entry. Returning inherited makes the check pass either way.
*
* RETRIES, deliberately: `configEditor.edit` writes under the profile's
* package.json lock, and every plugin migrating on the same boot contends for
* that ONE lock — four sibling plugins seeding at once measured exactly one
* winner and three "timed out waiting for the writer lock" failures. The write
* is idempotent, so backing off (with jitter, so the four do not retry in
* lockstep) is what makes the rest land.
*
* @param {import('@deepseek-ai/cordis').Context} ctx - plugin context.
* @returns {Promise<void>} resolves once the cleanup landed or was skipped.
*/
async function cleanupEntryConfig(ctx) {
	const attempts = 10;
	for (let attempt = 0; attempt < attempts; attempt++) try {
		if (attempt > 0) await new Promise((resolve) => setTimeout(resolve, 2e3 + Math.random() * 1e3));
		const editor = (typeof ctx.get === "function" ? (() => {
			try {
				return ctx.get("configEditor");
			} catch {
				return;
			}
		})() : void 0) ?? await new Promise((resolve) => {
			ctx.inject(["settings"], (settingsCtx) => {
				const owner = settingsCtx.settings?.ownerContext;
				resolve(typeof owner?.get === "function" ? (() => {
					try {
						return owner.get("configEditor");
					} catch {
						return;
					}
				})() : void 0);
			});
		});
		const entry = ctx.fiber?.entry;
		if (editor !== void 0 && entry !== void 0) {
			await editor.edit(entry, (raw, inherited) => {
				const next = { ...inherited ?? {} };
				for (const [key, value] of Object.entries(raw ?? {})) {
					if (OWN_KEYS.includes(key)) continue;
					if (!Object.hasOwn(next, key)) next[key] = value;
				}
				return next;
			});
			return;
		}
		return;
	} catch (error) {
		if (attempt === 9) {
			ctx.logger?.warn?.("session-head-prompt: entry config cleanup failed", error);
			return;
		}
		await new Promise((resolve) => setTimeout(resolve, 500 * (attempt + 1) + Math.random() * 500));
	}
}
/** Loopback guard for the settings face (the Host's own rule for plugin routes). */
function trustedRequest(req) {
	const host = req.headers.host ?? "";
	const origin = req.headers.origin;
	if (!/^(localhost|127(?:\.\d{1,3}){3}|\[::1\])(?::\d+)?$/i.test(host)) return false;
	return origin === void 0 || /^https?:\/\/(localhost|127(?:\.\d{1,3}){3}|\[::1\])(?::\d+)?$/i.test(origin);
}
/** Read the JSON request body, or undefined when it is absent or oversized. */
function readBody(req) {
	return new Promise((resolve) => {
		let body = "";
		req.on("data", (chunk) => {
			body += chunk;
			if (body.length > 1e6) {
				resolve(void 0);
				req.destroy();
			}
		});
		req.on("end", () => resolve(body));
		req.on("error", () => resolve(void 0));
	});
}
/** JSON response helper. */
function json(res, status, body) {
	const payload = JSON.stringify(body);
	res.writeHead(status, { "Content-Type": "application/json" });
	res.end(payload);
}
/**
* Register the settings face (GET/POST) the browser card talks to.
*
* The key is minted per plugin lifetime and rides the GET response — that
* response already passed the loopback guard, exactly like the probe routes of
* the sibling plugins. The POST authorizes with it in a header, validates the
* patch against the same rule the schema used to enforce (no complete `{{…}}`
* group in the prompt), writes the store, and answers with the new view.
*
* @param {import('@deepseek-ai/cordis').Context} ctx - plugin context.
* @param {SettingsStore} store - this plugin's settings store.
* @returns {void}
*/
function registerSettingsFace(ctx, store) {
	ctx.inject(["webServer"], (webCtx) => {
		const server = webCtx.webServer;
		if (server === void 0) return;
		webCtx.effect(() => {
			const key = randomBytes(24).toString("hex");
			/** The document both routes answer with. */
			const view = () => ({
				key,
				value: {
					enabled: store.value("enabled", true),
					prompt: store.value("prompt", "")
				},
				base: {
					enabled: true,
					prompt: ""
				},
				user: store.values()
			});
			const dispose = server.register({
				kind: "exact",
				path: `${ROUTE_BASE}/settings`,
				handler: async (req, res) => {
					if (!trustedRequest(req)) {
						json(res, 403, { error: "request-not-trusted" });
						return;
					}
					if (req.method === "GET") {
						json(res, 200, view());
						return;
					}
					if (req.method !== "POST") {
						json(res, 405, { error: "method not allowed" });
						return;
					}
					if (req.headers["x-session-prompt-key"] !== key) {
						json(res, 403, { error: "invalid-key" });
						return;
					}
					const body = await readBody(req);
					if (body === void 0) {
						json(res, 413, { error: "body too large" });
						return;
					}
					let patch;
					try {
						patch = JSON.parse(body || "{}");
					} catch {
						json(res, 400, { error: "invalid json" });
						return;
					}
					if (Object.hasOwn(patch, "prompt")) {
						const prompt = patch.prompt;
						if (prompt !== null && (typeof prompt !== "string" || COMPLETE_GROUP.test(prompt))) {
							json(res, 400, { error: "invalid prompt" });
							return;
						}
					}
					if (Object.hasOwn(patch, "enabled") && patch.enabled !== null && typeof patch.enabled !== "boolean") {
						json(res, 400, { error: "invalid enabled" });
						return;
					}
					store.patch(patch, true);
					json(res, 200, view());
				}
			});
			return () => {
				dispose();
			};
		}, "session-head-prompt: settings face");
	});
}
/**
* Register the settings namespace (with the composition entry as the base
* layer) and the head prompt section whose text follows the effective
* settings on every assembly.
* @param {import('@deepseek-ai/cordis').Context} ctx - plugin context carrying
*   the injected systemPrompt service.
* @param {Config} config - the composition entry config, used as the settings base
*   (on 0.1.7 the entry's volatile fields arrive as live references).
*/
function apply(ctx, config) {
	const store = new SettingsStore();
	/**
	* Seed the store file from the entry config, then drop this plugin's keys
	* from the entry row so no second source of truth remains.
	*
	* SEED RULE — per field, highest priority first:
	*   1. the file already holds it AND the card has written this file
	*      (`edited` true) → keep the file: a runtime edit is never regressed;
	*   2. the entry carries a NON-DEFAULT value → take the entry: that is a
	*      value written on 0.1.7 (the settings page, or a profile edit);
	*   3. otherwise keep what the file already has (its first seed, which is
	*      the schema default on a fresh profile).
	*
	* That last clause is load-bearing: a bundle layer's insert config does NOT
	* reach the composition (verified with `dsh --dump-config`), so once the
	* one-time cleanup has emptied the entry row the entry answers pure defaults —
	* treating those as authoritative would erase the user's values on the next
	* boot.
	*/
	const migrateOwnSettings = () => {
		const seeded = {};
		for (const key of OWN_KEYS) {
			const entryValue = readField(config, key);
			if (!Object.hasOwn(store.user, key)) {
				if (entryValue !== void 0 && !isDefaultValue(entryValue, DEFAULT_FOR_FIELD[key])) seeded[key] = entryValue;
				else if (entryValue !== void 0) seeded[key] = entryValue;
				continue;
			}
			if (store.edited) continue;
			if (entryValue !== void 0 && !isDefaultValue(entryValue, DEFAULT_FOR_FIELD[key])) seeded[key] = entryValue;
		}
		if (Object.keys(seeded).length > 0) {
			store.patch(seeded);
			cleanupEntryConfig(ctx);
		}
	};
	migrateOwnSettings();
	ctx.on("loader/volatile-update", () => {
		migrateOwnSettings();
	});
	registerSettingsFace(ctx, store);
	const effective = () => ({
		enabled: store.value("enabled", true),
		prompt: store.value("prompt", "")
	});
	ctx.systemPrompt.section({
		name: HEAD_SECTION,
		order: HEAD_ORDER,
		text: () => {
			const settings = effective();
			return settings.enabled !== false && typeof settings.prompt === "string" && settings.prompt !== "" ? settings.prompt : "";
		}
	});
}
//#endregion
export { Config, HEAD_ORDER, HEAD_SECTION, SETTINGS_NAMESPACE, apply, inject, name };
