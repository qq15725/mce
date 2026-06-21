import collaboration from './collaborationPlugin'
import presence from './presencePlugin'

export * from './AbstractProvider'
export { default as collaborationPlugin } from './collaborationPlugin'
export { default as presencePlugin } from './presencePlugin'
export * from './WebsocketProvider'

/** 注册「协同会话」+「在场感知」两个插件（presence 依赖 collaboration 的 provider，顺序固定）。 */
export function plugin() {
  return [collaboration, presence]
}

export default plugin
