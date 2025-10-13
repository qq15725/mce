export const IN_BROWSER = typeof window !== 'undefined'
export const IN_IFRAME = IN_BROWSER && window.top !== window.self
export const SUPPORTS_INTERSECTION_OBSERVER = IN_BROWSER && 'IntersectionObserver' in window
export const SUPPORTS_RESIZE_OBSERVER = IN_BROWSER && 'ResizeObserver' in window
export const SUPPORTS_CLIPBOARD = IN_BROWSER && window.navigator && 'clipboard' in navigator
export const SUPPORTS_TOUCH = IN_BROWSER && ('ontouchstart' in window || window.navigator.maxTouchPoints > 0)
export const USER_AGENT = IN_BROWSER ? window.navigator?.userAgent : ''
export const IN_CHROME = USER_AGENT.includes('Chrome')
export const IN_SAFARI = USER_AGENT.includes('AppleWebKit') && !IN_CHROME
export const IN_WECHAT = USER_AGENT.includes('MicroMessenger')
export const IN_MOBILE = USER_AGENT.includes('Mobile') || USER_AGENT.includes('Android')
export const isMac = /Macintosh|Mac OS X/i.test(USER_AGENT)
export const isWindows = /Windows/i.test(USER_AGENT)
