import { merge } from 'lodash-es'
import { computed } from 'vue'
import { defineMixin } from '../editor'
import en from '../locale/en'

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
      },
    }, locale)

    return {
      locale: _locale,
      localeMessages: messages[_locale],
      fallbackMessages: messages[_fallback],
    }
  })

  function t(key: string, fallback?: string): string | undefined {
    const { locale, localeMessages, fallbackMessages } = messages.value

    const value = options.t?.(key, fallback)
      ?? localeMessages?.[key]
      ?? fallbackMessages?.[key]
      ?? localeMessages?.[fallback]
      ?? fallbackMessages?.[fallback]

    if (value === undefined) {
      console.warn(`[mce] Not found '${key}' key in '${locale}' locale messages.`)
    }

    return value ?? key ?? fallback
  }

  Object.assign(editor, {
    t,
  })
})
