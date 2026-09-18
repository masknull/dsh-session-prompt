# dsh-session-prompt

[DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) 插件:在每个会话的**系统提示词最顶部**注入自定义提示词,并可在 Web 设置页中即时编辑。

A [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) plugin that injects a user-configured custom prompt at the **very top of every session's system prompt**, editable live from the web settings page.

- 注入位置 **Where it lands**:每次模型请求组装系统提示词时的第一节(`order: -200`,位于内置身份 `-100` 与角色设定 `0` 之前)——所有会话、每一次请求。
- 界面 **GUI**:设置页「插件配置」标签中的一张卡片,含启用开关、多行提示词编辑、保存/放弃、恢复默认。
- 即时生效 **Live**:提示词文本在每次组装时读取最新设置,保存后对下一次请求立即生效,无需重启。

---

## 中文文档

### 环境要求

- 安装了 Web UI 的 DSH 实例(含 profile 与用户设置提供方),且 `dsh` CLI 在 `PATH` 中。
- **版本 v0.2.1 起要求 DSH ≥ `0.1.5-rc.1`**(0.1.5-rc.x 从 `@deepseek-ai/dsh-settings` 移除了 `installSettingsSection` / `settingsNamespace` 导出,设置命名空间改为普通字符串,注册走 `settings` 服务的 `installSection` 方法)。在更老的宿主上本插件**无法加载**;DSH `dsh-v0.1.2-alpha.1` ~ `0.1.4.x` 请使用 v0.2.0,更早的宿主请使用 v0.1.x。

### 安装

本包自带构建产物(`lib/`),从 Git 安装无需构建脚本、无需构建放行:

```sh
dsh plugin --profile <你的profile名> add github:masknull/dsh-session-prompt
```

该命令会链接包、记入依赖,并因包声明了 `dsh.bundle` 而自动加入 profile 的 bundle 列表。**重启 DSH** 使新的 bundle 层生效,然后打开 Web 界面。

> 供应链安全可固定提交:`github:masknull/dsh-session-prompt#<commit sha>`。

### 使用

1. 打开 **设置 → 插件配置**;
2. 展开「会话头部提示词」卡片;
3. 勾选 **启用注入**,编辑 **提示词内容**,点 **保存**。

说明:

- 提示词注入到**每个**会话(全局根 section),不是单会话。
- 关闭开关或提示词为空时不注入任何内容。
- **`{{…}}` 限制**:系统提示词渲染器会对 `{{变量}}` 做严格模板插值,遇到未注册或格式错误的组会直接报错;本插件会在**保存时**拒绝包含完整 `{{…}}` 组的文本,保证坏提示词永远不会弄坏请求。单独的 `{{`(无闭合 `}}`)是字面量,允许。

### 卸载

```sh
dsh plugin --profile <你的profile名> remove dsh-session-prompt
```

如曾手工把配置行加进 profile 的 `cordis.patch.yml`,请一并删除。

### 从源码构建

```sh
git clone https://github.com/masknull/dsh-session-prompt
cd dsh-session-prompt
npm install          # 仅开发依赖:tsdown
npm run bundle       # 产出 lib/index.js(宿主半区)+ lib/client.js(浏览器半区)
npm run smoke        # 冒烟:验证宿主 apply() 与 section 文本 provider
```

`lib/` 已提交进仓库;改动 `src/` 后请连同重建产物一起提交。

> `npm run smoke` 需要能解析 `@deepseek-ai` peer 依赖的环境(即已安装进 profile 的副本);在裸克隆中运行会给出提示而非崩溃。

### 目录结构

```
dsh-session-prompt/
├── package.json          # dsh.bundle + dsh.client 声明;运行时依赖仅为 peer
├── cordis.patch.yml      # bundle 补丁:插入插件行(含默认配置)
├── tsdown.config.ts      # 自包含的双半区构建
├── smoke.mjs             # 宿主半区冒烟测试
├── src/
│   ├── index.js          # 宿主半区:设置注册 + 头部提示词 section
│   └── client/           # 浏览器半区:设置卡片
└── lib/                  # 构建产物(已提交)
```

宿主半区的运行时依赖(`@deepseek-ai/cordis`、`@deepseek-ai/schemastery`、`@deepseek-ai/dsh-settings`)声明为 **peer dependencies**,由 DSH 宿主解析——插件不携带、不遮蔽宿主包。

### 许可证

MIT

---

## English Documentation

### Requirements

- A DSH installation that hosts the web UI (a profile and the user-settings provider must be present), and the `dsh` CLI on `PATH`.
- **v0.2.1+ requires DSH ≥ `0.1.5-rc.1`** (0.1.5-rc.x removed the `installSettingsSection` / `settingsNamespace` exports from `@deepseek-ai/dsh-settings`; a settings namespace is now a plain string registered through the settings service's `installSection` method). Older hosts cannot load this plugin; use v0.2.0 on DSH `dsh-v0.1.2-alpha.1` ~ `0.1.4.x`, and the v0.1.x line on anything older.

### Install

The package ships prebuilt artifacts (`lib/`), so a git install needs no build scripts and no build allowance:

```sh
dsh plugin --profile <your-profile> add github:masknull/dsh-session-prompt
```

The command links the package, records it as a dependency, and — because the package declares `dsh.bundle` — appends it to the profile's bundle list. **Restart DSH** for the new bundle layer to take effect, then open the web UI.

> Optionally pin a commit for supply-chain hygiene: `github:masknull/dsh-session-prompt#<sha>`.

### Usage

1. Open **Settings → Plugin configuration**.
2. Expand the **Session head prompt** card.
3. Toggle **Enable injection** and edit **Prompt text**, then **Save**.

Notes:

- The prompt is injected into **every** session (a root-global section), not per-conversation.
- An empty prompt, or the switch off, injects nothing.
- **`{{…}}` restriction**: the system-prompt renderer interpolates strict `{{variable}}` references and throws on unknown or malformed groups. The plugin refuses to save text containing a complete `{{…}}` group, so a bad prompt can never break requests. A lone `{{` without a closing `}}` is literal prose and is allowed.

### Uninstall

```sh
dsh plugin --profile <your-profile> remove dsh-session-prompt
```

If you previously hand-added the row to the profile's `cordis.patch.yml`, remove that entry too.

### Build from source

```sh
git clone https://github.com/masknull/dsh-session-prompt
cd dsh-session-prompt
npm install          # dev-only: tsdown
npm run bundle       # -> lib/index.js (host half) + lib/client.js (browser half)
npm run smoke        # sanity-checks the host half's apply() and section provider
```

`lib/` is committed, so contributors can change `src/` and commit the rebuilt artifacts for the next release.

> `npm run smoke` needs an environment where the `@deepseek-ai` peer deps resolve (i.e. the copy installed into a profile); on a bare clone it prints a hint instead of crashing.

### Layout

```
dsh-session-prompt/
├── package.json          # dsh.bundle + dsh.client declarations, peer-only deps
├── cordis.patch.yml      # bundle patch: inserts the plugin row with default config
├── tsdown.config.ts      # self-contained build for both halves
├── smoke.mjs             # host-half smoke test
├── src/
│   ├── index.js          # host half: settings registration + head prompt section
│   └── client/           # browser half: settings card
└── lib/                  # built artifacts (committed)
```

The host half's runtime dependencies (`@deepseek-ai/cordis`, `@deepseek-ai/schemastery`, `@deepseek-ai/dsh-settings`) are declared as **peer dependencies** and resolved from the DSH host — the plugin never ships or shadows host packages.

### License

MIT