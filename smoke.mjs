// 冒烟测试:模拟 Cordis 在应用启动时调用插件的 apply,验证 section 注册与文本 provider。
// 宿主半区依赖 @deepseek-ai 的 peer 包,只有在已安装的 profile 环境里才能解析;
// 在裸克隆中运行会给出提示而不是崩溃。
import { rmSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

// 环境隔离:插件自有设置落在 $DSH_HOME(或 DSH_SESSION_PROMPT_DATA_DIR)下,开发机上
// 这两个变量常指向运行中的 DSH 实例 —— smoke 会因此读到真实 profile 的用户配置
// (写过卡的配置文件 edited=true,不再重新播种,断言随即误报失败)。这里把数据目录
// 改道到仓库内的临时目录,进程退出时清理,保证任何机器上结果一致。
const smokeDataDir = fileURLToPath(new URL('.smoke-data/', import.meta.url))
process.env.DSH_HOME = smokeDataDir
delete process.env.DSH_SESSION_PROMPT_DATA_DIR
process.on('exit', () => {
  try { rmSync(smokeDataDir, { recursive: true, force: true }) } catch {}
})

let lib
try {
  lib = await import('./lib/index.js')
} catch (error) {
  console.error('[skip] @deepseek-ai peer deps are not resolvable here — install the plugin into a DSH profile')
  console.error('      (dsh plugin --profile <name> add github:masknull/dsh-session-prompt), then run npm run smoke from the installed copy')
  process.exit(2)
}

const { apply, Config, HEAD_ORDER, HEAD_SECTION, name, inject } = lib

let section
const ctx = {
  // 无 settings 服务时 installSettingsSection 的内部注入不触发,插件回退到组合配置,
  // 与无 settings provider 的 profile 同路径。
  inject: () => {},
  // apply() 订阅 loader/volatile-update 与 app-boot/config-reload 两个事件;
  // mock 环境无事件总线,注册为空操作、返回空 disposer。
  on: () => () => {},
  systemPrompt: { section: (s) => { section = s } },
}
const ok = (cond, msg) => { if (!cond) { console.error('FAIL', msg); process.exitCode = 1 } else console.log('PASS', msg) }

ok(name === 'session-head-prompt', `name = ${name}`)
ok(Array.isArray(inject) && inject.includes('systemPrompt'), 'inject = ["systemPrompt"]')
ok(typeof Config === 'function' || (typeof Config === 'object' && Config !== null), 'Config schema exported')

apply(ctx, { enabled: true, prompt: '  头部提示词  ' })
ok(section && section.name === HEAD_SECTION, `section name = ${HEAD_SECTION}`)
ok(section.order === -200 && HEAD_ORDER === -200, `order = ${HEAD_ORDER} (before identity -100 / persona 0)`)
ok(typeof section.text === 'function', 'text is a per-assembly provider')
ok(section.text({}) === '  头部提示词  ', 'renders the configured prompt verbatim')

apply(ctx, { enabled: false, prompt: '不该出现' })
ok(section.text({}) === '', 'disabled -> empty text (dropped at render)')
apply(ctx, { enabled: true, prompt: '' })
ok(section.text({}) === '', 'empty prompt -> empty text')
apply(ctx, { enabled: true })
ok(section.text({}) === '', 'missing prompt -> empty text (schema default)')

console.log('smoke done')