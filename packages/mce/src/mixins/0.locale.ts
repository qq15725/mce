import { merge } from 'lodash-es'
import { computed } from 'vue'
import { defineMixin } from '../editor'
import en from '../locale/en'
import zhHans from '../locale/zh-Hans'

declare global {
  namespace Mce {
    type Translation = (key: string, fallback?: string) => string

    interface Editor {
      t: Translation
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
      localeMessages: (messages as any)[_locale] as Record<string, any>,
      fallbackMessages: (messages as any)[_fallback] as Record<string, any>,
    }
  })

  function t(key: string, fallback?: string): string | undefined {
    const { locale, localeMessages, fallbackMessages } = messages.value

    const value = options.t?.(key, fallback)
      ?? localeMessages?.[key ?? -1]
      ?? fallbackMessages?.[key ?? -1]
      ?? localeMessages?.[fallback ?? -1]
      ?? fallbackMessages?.[fallback ?? -1]

    if (value === undefined) {
      console.warn(`[mce] Not found '${key}' key in '${locale}' locale messages.`)
    }

    return value ?? key ?? fallback
  }

  Object.assign(editor, {
    t,
  })
})
