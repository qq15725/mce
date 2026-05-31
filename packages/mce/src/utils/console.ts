// 轻量 Logger：受编辑器 `options.debug` 控制（启动时 `setDebug` 注入），
// 全局唯一实例。代码各处优先用这个而不是裸 console.*，便于生产构建静音 trace
// 日志、或下游应用接管输出。
type LogFn = (...args: any[]) => void

let debugEnabled = false

export function setDebug(value: boolean): void {
  debugEnabled = value
}

function ts(): string {
  return `[mce][${new Date().toLocaleTimeString()}]`
}

export const logger = {
  /** 仅当 `options.debug` 为 true 才输出；trace/dev 用。 */
  debug: ((...args) => {
    if (debugEnabled)
      console.log(ts(), ...args)
  }) as LogFn,
  /** 常规可见事件（如加载完成、状态变化）。 */
  info: ((...args) => console.info(ts(), ...args)) as LogFn,
  /** 可恢复问题（配置异常、回退路径、未知 clipboard 类型等）。 */
  warn: ((...args) => console.warn(ts(), ...args)) as LogFn,
  /** 异常 / 失败的操作（mixin/plugin setup 失败、CRDT 事务异常等）。 */
  error: ((...args) => console.error(ts(), ...args)) as LogFn,
}
