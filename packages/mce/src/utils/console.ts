import { warn } from 'vue'

export function consoleWarn(message: string): void {
  warn(`mce: ${message}`)
}

export function consoleError(message: string): void {
  warn(`mce error: ${message}`)
}
