import { convertElement, convertLayout } from '../convert'

interface SignedData {
  data: string
  signature: string
  timestamp: number
}

export interface BigeClipboardData {
  _flag: string
  type: string
  data: any
  tid?: string
  bid?: string
}

export function clipboardLoader(): Mce.Loader {
  const BIGE_CLIPBOARD_DATA_KEY = 'BIGE_CLIPBOARD_DATA'
  const BIGE_CLIPBOARD_DATA_FLAG = `__${BIGE_CLIPBOARD_DATA_KEY}__`
  const BIGE_CLIPBOARD_DATA_SECRET = `${BIGE_CLIPBOARD_DATA_KEY}_SECRET_2025`

  function isSignedData(obj: any): obj is SignedData {
    return (
      obj
      && typeof obj === 'object'
      && typeof obj.data === 'string'
      && typeof obj.signature === 'string'
      && typeof obj.timestamp === 'number'
    )
  }

  async function generateSignature(data: string, secret: string) {
    return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(data + secret))))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('')
  }

  function decodeBase64(base64: string) {
    try {
      const binary = atob(base64)
      const bytes = new Uint8Array(binary.length)
      for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i)
      }
      return new TextDecoder().decode(bytes)
    }
    // eslint-disable-next-line unused-imports/no-unused-vars
    catch (_error) {
      throw new Error('解码失败')
    }
  }

  async function decode<T = unknown>(signedData: unknown) {
    if (!isSignedData(signedData)) {
      throw new Error('格式异常')
    }

    const { data, signature, timestamp } = signedData

    const signatureData = data + timestamp
    const isValid = (await generateSignature(signatureData, BIGE_CLIPBOARD_DATA_SECRET)) === signature
    if (!isValid) {
      throw new Error('签名无效')
    }

    try {
      return JSON.parse(decodeBase64(data)) as T
    }
    // eslint-disable-next-line unused-imports/no-unused-vars
    catch (_error) {
      throw new Error('数据异常')
    }
  }

  return {
    name: 'bige-clipboard',
    test: (doc: Document) => {
      return doc instanceof Document
        && Boolean(doc.querySelector('bige-clipboard'))
    },
    load: async (doc: Document) => {
      const clipboard = doc.querySelector('bige-clipboard')!
      const decoded = await decode<BigeClipboardData>(JSON.parse(clipboard.textContent))
      if (decoded && decoded._flag === BIGE_CLIPBOARD_DATA_FLAG) {
        switch (decoded.type) {
          case 'element':
            return [await convertElement(decoded.data)]
          case 'layout':
            return [await convertLayout(decoded.data)]
        }
      }
      return []
    },
  }
}
