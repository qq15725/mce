/**
 * 将 base64 字符串（或 data URL）解码为字节数组。
 * 统一各插件中重复的 `atob(...).charCodeAt` 解码样板。
 */
export function base64ToBytes(base64: string): Uint8Array {
  // data URL 形如 `data:...;base64,xxxx`，base64 字母表不含逗号，按逗号截取是安全的
  const raw = base64.includes(',') ? base64.slice(base64.indexOf(',') + 1) : base64
  const binary = atob(raw)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i)
  }
  return bytes
}

/** 将 base64 字符串解码为 UTF-8 文本。 */
export function base64ToText(base64: string): string {
  return new TextDecoder().decode(base64ToBytes(base64))
}
