import { existsSync } from 'node:fs'
import { fileURLToPath, URL } from 'node:url'

/**
 * 本地源码联调 alias（在根集中定义，供各包 vite.config 与 playground 共用）。
 *
 * 当兄弟目录存在 modern-idoc / modern-canvas 的源码时，把它们 alias 到各自 `src`：
 * 改底层库源码即时生效，无需 build + 拷 dist。CI / 发布环境没有兄弟目录，返回空表，
 * 自动回退到 node_modules 里安装的 npm 包——因此本配置可安全提交，不会破坏 CI。
 *
 * 仅影响「会真实解析这两个包的场景」（playground dev、各包 vitest）；各包 build 时
 * 它们是 external，不受影响。
 */
export function localLibAlias(): Record<string, string> {
  const alias: Record<string, string> = {}
  for (const lib of ['modern-idoc', 'modern-canvas']) {
    const src = fileURLToPath(new URL(`../${lib}/src/index.ts`, import.meta.url))
    if (existsSync(src))
      alias[lib] = src
  }
  return alias
}
