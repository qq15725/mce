import { defineMixin } from '../mixin'

declare global {
  namespace Mce {
    type HttpMethod
      = | 'get' | 'GET'
        | 'delete' | 'DELETE'
        | 'head' | 'HEAD'
        | 'options' | 'OPTIONS'
        | 'post' | 'POST'
        | 'put' | 'PUT'
        | 'patch' | 'PATCH'
        | 'purge' | 'PURGE'
        | 'link' | 'LINK'
        | 'unlink' | 'UNLINK'

    type HttpResponseType
      = | 'arraybuffer'
        | 'blob'
        | 'document'
        | 'json'
        | 'text'
        | 'stream'
        | 'formdata'

    interface HttpRequestConfig {
      url: string
      method?: HttpMethod | string
      data?: any
      responseType?: HttpResponseType
    }

    interface Http {
      request: (config: HttpRequestConfig) => Promise<any>
    }

    interface Options {
      http?: Http
    }

    interface Editor {
      http: Http
    }
  }
}

function createHttp(): Mce.Http {
  async function request(config: Mce.HttpRequestConfig): Promise<any> {
    const {
      url,
      method = 'GET',
      data,
      responseType,
    } = config

    const fetchConfig: RequestInit = {
      method: method.toUpperCase(),
      headers: new Headers(),
    }

    if (data !== undefined) {
      if (data instanceof FormData || data instanceof URLSearchParams || data instanceof Blob) {
        fetchConfig.body = data
      }
      else if (typeof data === 'object') {
        fetchConfig.body = JSON.stringify(data)
        ;(fetchConfig.headers as Headers).set('Content-Type', 'application/json')
      }
      else {
        fetchConfig.body = String(data)
      }
    }

    const response = await fetch(url, fetchConfig)

    if (!response.ok) {
      const error: any = new Error(`HTTP Error: ${response.status} ${response.statusText}`)
      error.response = {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
        data: await response.text().catch(() => null),
      }
      throw error
    }

    let _responseType = responseType
    if (!_responseType) {
      const repContentType = response.headers.get('content-type')
      if (repContentType) {
        if (repContentType.includes('application/json')) {
          _responseType = 'json'
        }
      }
    }

    switch (_responseType ?? 'text') {
      case 'arraybuffer':
        return await response.arrayBuffer()
      case 'blob':
        return await response.blob()
      case 'json':
        return await response.json()
      case 'document':
      case 'stream':
      case 'formdata':
      case 'text':
      default:
        return await response.text()
    }
  }

  return {
    request,
  }
}

export default defineMixin((editor, options) => {
  Object.assign(editor, {
    http: options.http ?? createHttp(),
  })
})
