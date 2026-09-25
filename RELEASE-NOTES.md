# dsh-session-prompt — Release Notes

## 0.2.2

**迁移：配置存储改为插件自有文件**（0.1.5 / 0.1.7 行为一致，不再走宿主设置写通路）

### 新增
- 配置的**唯一事实源**改为插件自有文件 `<profile>/.dsh-session-prompt/settings.json`，与凭证、catalog 缓存同目录。
- 一次性迁移：文件不存在时，从 profile entry 的旧值播种，并从 `settings.yaml` / `settings.yaml.imported`（0.1.5 时代的配置文档）读取本插件的旧 section——宿主只导入“名字与 profile 条目 id 相同”的 section，旧命名空间的 section 不被导入，数据只存在于那份文档里，由插件自行读取。
- 新增 HTTP 设置面 `GET/POST /plugins/dsh-session-prompt/settings`（loopback + per-process key 鉴权），浏览器卡片经它读写。
- 迁移完成后，自动把 profile patch（cordis.patch.yml）里本插件写过的字段删掉——只删自己的，不碰其他插件/用户的字段。

### 性能
- 设置保存不再触发任何 profile 重组：旧的写入通路（0.1.7 的 `configEditor.edit`）要全量 reconcile profile 树、热重载插件 fiber，并刷新所有客户端镜像；现在是一次本地原子文件写（tmp + rename）加原地应用，**实测 8–20ms**，代价恒定，不随配置规模增长，也与宿主后续版本对设置写入的优化无关（0.1.7-rc.2 已改善切换模型时的等待，本插件路径同样受益但不受其影响）。

### 修复
- bundle patch（cordis.patch.yml）由“insert + 自带示例 config”改为**纯 insert**：该示例 config 会作为 inherited 层长期留在组合里，每次清理用户层后都会以“非默认值”身份覆盖用户配置，导致已同步的设置在后续开机被重置为示例值。
- 迁移种子规则的默认值改为从 schema 的 `meta.default` 读取（此前手写默认值与 schema 不一致：`triggers` 写成五个 true、`fields` 写成 `{}`，导致 schema 自身的默认值被误判为“真实覆盖”，旧配置永远同步不过来）。

### 兼容性

**宿主要求**：DSH ≥ 0.1.5-rc.2（0.1.5 线终点）。该下限已写入 `package.json` 的 `engines.dsh`，宿主会按它跳过不兼容的版本并提示。peer：`cordis` 4.0.1、`schemastery` 3.18.1、`dsh-settings` ≥ 0.1.5-rc.1。

| 宿主版本 | 状态 | 说明 |
|---|---|---|
| 0.1.5-rc.2 | ✅ 支持 | 最低支持版本 |
| 0.1.7-rc.1 | ✅ 已验证 | 端到端实测：一次性迁移、prompt 从旧文档恢复、patch 行清理 |
| 0.1.7-rc.2 | ✅ 支持 | 该版本改善了切换模型时的等待，本插件路径不受影响 |

**为什么两个版本行为一致**：本插件的配置不再经过宿主设置服务，而是插件自有的 `<profile>/.dsh-session-prompt/settings.json`。宿主版本之间设置写通路的差异（0.1.7 的 `configEditor.edit` 全树 reconcile、`describe()` 按条目投影）完全不参与读写，因此不存在“某版本下写入慢 / 失效 / 被 inherited 层覆盖”的版本性差异。

**迁移来源（0.1.5 时代配置）**：插件自行读取 `settings.yaml`（0.1.5 原件）或 `settings.yaml.imported`（0.1.7 首次启动时的改名备份）中的 `session-head-prompt` section。这一步不依赖宿主的导入机制——宿主只会导入名字与 profile 条目 id 相同的 section，且导入跑在插件首次加载之后，时机不可控。`js-yaml` 缺失时该层自动跳过，其余功能不受影响。

**版本差异与取舍**：无。设置入口始终是「设置 - 插件设置」里的本插件卡片，两个版本一致。

### 设置入口变更（自本版本起）

**自 0.2.2 起，本插件的设置卡片固定在「设置 - 插件设置」共享块内**（排位 10）。此前入口（0.1.5 时代的插件 tab / 命名空间表单）不再承载配置编辑——所有读写收敛到这一张卡片，配置的唯一事实源是插件自有文件。若升级后找不到设置项，请到「设置 - 插件设置」查看；两个宿主版本（0.1.5 / 0.1.7）入口位置一致。

### 升级注意
- 首次启动自动完成迁移并清理 patch 行，无需手工操作；若自有文件已存在且从未在卡片上保存过，0.1.5 文档中的旧值优先于 schema 默认值生效。
