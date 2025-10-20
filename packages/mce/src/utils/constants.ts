import { IN_BROWSER } from 'modern-canvas'

export const SUPPORTS_CLIPBOARD = IN_BROWSER && window.navigator && 'clipboard' in navigator
export const USER_AGENT = IN_BROWSER ? window.navigator?.userAgent : ''
export const isMac = /Macintosh|Mac OS X/i.test(USER_AGENT)
export const isWindows = /Windows/i.test(USER_AGENT)
