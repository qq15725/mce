import type { Element2D } from 'modern-canvas'
import { Aabb2D, Node } from 'modern-canvas'

export class Page extends Node {
  selection: Element2D[] = []
  selectionMarquee = new Aabb2D()
}
