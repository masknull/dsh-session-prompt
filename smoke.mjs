// 冒烟测试:模拟 Cordis 在应用启动时调用插件的 apply,验证 section 注册与文本 provider。
// 宿主半区依赖 @deepseek-ai 的 peer 包,只有在已安装的 profile 环境里才能解析;
// 在裸克隆中运行会给出提示而不是崩溃。
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