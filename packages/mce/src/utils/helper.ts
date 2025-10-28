import type { ComponentInternalInstance, ComponentPublicInstance, InjectionKey, VNodeChild } from 'vue'
import { shallowRef } from 'vue'

export function isClickInsideElement(event: MouseEvent, targetDiv: HTMLElement): boolean {
  const mouseX = event.clientX
  const mouseY = event.clientY
  const divRect = targetDiv.getBoundingClientRect()
  const divLeft = divRect.left
  const divTop = divRect.top
  const divRight = divRect.right
  const divBottom = divRect.bottom
  return mouseX >= divLeft && mouseX <= divRight && mouseY >= divTop && mouseY <= divBottom
}

export interface TemplateRef {
  (target: Element | ComponentPublicInstance | null): void
  value: HTMLElement | ComponentPublicInstance | null | undefined
  readonly el: HTMLElement | undefined
}

export function refElement(obj?: ComponentPublicInstance<any> | HTMLElement): HTMLElement | undefined {
  if (obj && '$el' in obj) {
    const el = obj.$el as HTMLElement
    if (el?.nodeType === Node.TEXT_NODE) {
      // Multi-root component, use the first element
      return el.nextElementSibling as HTMLElement
    }
    return el
  }
  return obj as HTMLElement
}

export function convertToUnit(str: number, unit?: string): string
export function convertToUnit(str: string | number | null | undefined, unit?: string): string | undefined
export function convertToUnit(str: string | number | null | undefined, unit = 'px'): string | undefined {
  if (str == null || str === '') {
    return undefined
  }
  const num = Number(str)
  if (Number.isNaN(num)) {
    return String(str)
  }
  else if (!Number.isFinite(num)) {
    return undefined
  }
  else {
    return `${num}${unit}`
  }
}

export function templateRef() {
  const el = shallowRef<HTMLElement | ComponentPublicInstance | null>()
  const fn = (target: HTMLElement | ComponentPublicInstance | null) => {
    el.value = target
  }
  Object.defineProperty(fn, 'value', {
    enumerable: true,
    get: () => el.value,
    set: val => el.value = val,
  })
  Object.defineProperty(fn, 'el', {
    enumerable: true,
    get: () => refElement(el.value),
  })
  return fn as TemplateRef
}

export function findChildrenWithProvide(
  key: InjectionKey<any> | symbol,
  vnode?: VNodeChild,
): ComponentInternalInstance[] {
  if (!vnode || typeof vnode !== 'object')
    return []

  if (Array.isArray(vnode)) {
    return vnode.map(child => findChildrenWithProvide(key, child)).flat(1)
  }
  else if (vnode.suspense) {
    return findChildrenWithProvide(key, (vnode as any).ssContent!)
  }
  else if (Array.isArray(vnode.children)) {
    return vnode.children.map(child => findChildrenWithProvide(key, child)).flat(1)
  }
  else if (vnode.component) {
    if (Object.getOwnPropertySymbols((vnode.component as any).provides).includes(key as symbol)) {
      return [vnode.component]
    }
    else if (vnode.component.subTree) {
      return findChildrenWithProvide(key, vnode.component.subTree).flat(1)
    }
  }

  return []
}
