import { createSharedComposable } from '@vueuse/core'

export const useSharedTextAssets = createSharedComposable(() => {
  const requests = new Map<string, Promise<Response>>()

  function baseFetch<T>(url: string, handle: (rep: Response) => T | Promise<T>): Promise<T> {
    let rep = requests.get(url) as any
    if (!rep) {
      rep = fetch(url).then(handle)
      requests.set(url, rep)
    }
    return rep
  }

  async function fetchToText(url: string): Promise<string> {
    return baseFetch(url, rep => rep.text())
  }

  return {
    fetchToText,
  }
})
