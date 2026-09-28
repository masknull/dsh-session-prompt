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

import { existsSync, mkdirSync, readdirSync, readFileSync, realpathSync, renameSync, writeFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

/** Package name, used to find the declaring profile. */
const PACKAGE_NAME = 'dsh-session-prompt'

/** Data-directory name inside the profile (same directory as the credential). */
const DATA_DIR_NAME = '.dsh-session-prompt'

/** Settings file name inside the data directory. */
const SETTINGS_FILE_NAME = 'settings.json'

/** Environment override for the whole data directory (tests, relocated profiles). */
const DATA_DIR_ENV = 'DSH_SESSION_PROMPT_DATA_DIR'

/**
 * Resolve `$DSH_HOME` the way the Host does, without importing the Host's
 * path helper (a client bundle must not depend on a Host package, and this
 * module runs inside the host process where that helper is not exported to
 * plugins either).
 * @returns {string} the Harness home directory.
 */
function dshHome() {
  const fromEnv = process.env.DSH_HOME?.trim()
  if (fromEnv) return fromEnv
  return join(homedir(), '.dsh')
}

/**
 * This package's own root (the checkout, or the profile's node_modules copy).
 * @returns {string} absolute path.
 */
function packageRoot() {
  return dirname(fileURLToPath(import.meta.url)).replace(/[\\/]lib$/, '')
}

/** Read a directory's package.json dependencies, tolerating absence. */
function declaredBy(dir, packageName) {
  try {
    const manifest = JSON.parse(readFileSync(join(dir, 'package.json'), 'utf8'))
    const deps = { ...manifest.dependencies, ...manifest.devDependencies }
    return typeof deps?.[packageName] === 'string'
  } catch {
    return false
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
export function discoverProfileDir() {
  const override = process.env[DATA_DIR_ENV]?.trim()
  if (override) return override
  const root = join(dshHome(), 'profiles')
  let entries
  try {
    entries = readdirSync(root, { withFileTypes: true })
  } catch {
    return undefined
  }
  const candidates = entries
    .filter(entry => entry.isDirectory() || entry.isSymbolicLink())
    .map(entry => join(root, entry.name))
    .filter(dir => declaredBy(dir, PACKAGE_NAME))
  if (candidates.length === 0) return undefined
  if (candidates.length === 1) return candidates[0]
  const own = packageRoot()
  const linked = candidates.find(dir => {
    try {
      return realpathSync(join(dir, 'node_modules', PACKAGE_NAME)) === realpathSync(own)
    } catch {
      return false
    }
  })
  return linked ?? candidates[0]
}

/** This plugin's data directory, created on demand. @returns {string} absolute path. */
export function dataDir() {
  const profile = discoverProfileDir() ?? dshHome()
  return join(profile, DATA_DIR_NAME)
}

/** Absolute path of the settings file. @returns {string} */
export function settingsFilePath() {
  return join(dataDir(), SETTINGS_FILE_NAME)
}

/** Read + parse the settings file; `undefined` when absent or unreadable. */
function readFile() {
  const path = settingsFilePath()
  if (!existsSync(path)) return undefined
  try {
    const parsed = JSON.parse(readFileSync(path, 'utf8'))
    return parsed !== null && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : undefined
  } catch {
    // A corrupt file is not a reason to take the host down: the caller falls
    // back to the entry config (migration re-seeds the file).
    return undefined
  }
}

/**
 * Write the settings file atomically (tmp + rename), creating the directory.
 * @param {object} values - the whole user layer (keys this plugin owns).
 * @returns {void}
 */
export function writeSettings(values) {
  const path = settingsFilePath()
  mkdirSync(dirname(path), { recursive: true })
  const tmp = `${path}.tmp`
  writeFileSync(tmp, `${JSON.stringify(values, null, 2)}\n`, 'utf8')
  renameSync(tmp, path)
}

/**
 * Reserved bookkeeping key: how many writes the settings card has made through
 * this store. Its presence separates "the file holds the startup seed" from
 * "the file holds the user's live edits" — see the seed rule in ./index.js.
 * Field readers address their fields by name and never collide with it.
 */
const WRITE_MARK = '__writes'

/**
 * One store instance: the plugin's own settings file, with the entry config as
 * the migration source and the schema defaults as the last fallback.
 */
export class SettingsStore {
  /** The user layer exactly as stored (presence marks an override). */
  user

  /**
   * @param {object} [initial] - the user layer to adopt (migration seed).
   */
  constructor(initial) {
    this.user = initial ?? readFile() ?? {}
  }

  /** Whether the store file exists (a fresh profile has none). */
  exists() {
    return existsSync(settingsFilePath())
  }

  /**
   * Whether the settings card has ever written through this store.
   *
   * While false the entry config stays authoritative; once the card writes,
   * the file is — a runtime edit must never be regressed by a stale row.
   * @returns {boolean}
   */
  get edited() {
    return typeof this.user[WRITE_MARK] === 'number' && this.user[WRITE_MARK] > 0
  }

  /**
   * The effective value of one field: the stored user value, else the schema
   * default the caller passes in.
   * @param {string} field - field name.
   * @param {unknown} fallback - the schema default for this field.
   * @returns {unknown} the effective value.
   */
  value(field, fallback) {
    return Object.hasOwn(this.user, field) ? this.user[field] : fallback
  }

  /**
   * Apply one patch in memory and persist it.
   * @param {object} patch - field to value; a `null` value clears the field.
   * @param {boolean} [fromCard] - true when the settings card made this write;
   *   marks the file as holding live user edits from then on.
   * @returns {object} the new user layer.
   */
  patch(patch, fromCard = false) {
    const next = { ...this.user }
    for (const [field, value] of Object.entries(patch)) {
      if (value === null) delete next[field]
      else next[field] = value
    }
    if (fromCard) next[WRITE_MARK] = (typeof next[WRITE_MARK] === 'number' ? next[WRITE_MARK] : 0) + 1
    writeSettings(next)
    // Keep the in-memory view in step with the file without swapping the
    // reference the host captured: mutate in place.
    for (const key of Object.keys(this.user)) delete this.user[key]
    Object.assign(this.user, next)
    return this.user
  }

  /** Read the current user layer without touching the disk. */
  values() {
    return this.user
  }
}
