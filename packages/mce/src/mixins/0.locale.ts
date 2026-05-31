import { merge } from 'lodash-es'
import { computed, ref } from 'vue'
import en from '../locale/en'
import zhHans from '../locale/zh-Hans'
import { defineMixin } from '../mixin'
import { logger } from '../utils/console'

declare global {
  namespace Mce {
    type Translation = (key: string, fallback?: string) => string

    interface Editor {
      t: Translation
      /** 插件追加自己的 i18n 文案，按 locale（如 en / zhHans）合并，避免全部聚合到核心 locale。 */
      registerMessages: (messages: Partial<Record<string, LocaleMessages>>) => void
    }

    interface LocaleMessages {
      [key: string]: LocaleMessages | string
    }

    interface Locale {
      locale?: string
      fallback?: string
      messages?: LocaleMessages
    }

    interface Options {
      t?: Translation
      locale?: Locale
    }
  }
}

export default defineMixin((editor, options) => {
  const {
    locale,
  } = options

  // 插件通过 registerMessages 追加自己的 i18n（按 locale 合并），不必塞进核心 locale 文件
  const pluginMessages = ref<Record<string, Mce.LocaleMessages>>({})

  function registerMessages(value: Partial<Record<string, Mce.LocaleMessages>>): void {
    pluginMessages.value = merge({}, pluginMessages.value, value)
  }

  const messages = computed(() => {
    const {
      locale: _locale,
      fallback: _fallback,
      messages = {},
    } = merge({
      locale: 'en',
      fallback: 'en',
      messages: {
        en,
        zhHans,
      },
    }, locale)

    return {
      locale: _locale as string,
      localeMessages: merge({}, (messages as any)[_locale], pluginMessages.value[_locale]) as Record<string, any>,
      fallbackMessages: merge({}, (messages as any)[_fallback], pluginMessages.value[_fallback]) as Record<string, any>,
    }
  })

  function t(key: string, fallback?: string): string {
    const { locale, localeMessages, fallbackMessages } = messages.value

    const value = options.t?.(key, fallback)
      ?? localeMessages?.[key ?? -1]
      ?? fallbackMessages?.[key ?? -1]
      ?? localeMessages?.[fallback ?? -1]
      ?? fallbackMessages?.[fallback ?? -1]

    if (value === undefined) {
      logger.warn(`[mce] Not found '${key}' key in '${locale}' locale messages.`)
    }

    return value ?? key ?? fallback ?? ''
  }

  Object.assign(editor, {
    t,
    registerMessages,
  })
})
