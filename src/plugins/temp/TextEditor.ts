import type {
  NormalizedFragment,
  NormalizedParagraph,
  NormalizedTextContent,
  PropertyAccessor
} from 'modern-idoc'
import type { Character } from 'modern-text'
import { diffChars } from 'diff'
import { isCRLF, normalizeCRLF, normalizeTextContent, property, textContentToString } from 'modern-idoc'
import { Text } from 'modern-text'

export interface IndexCharacter {
  paragraphIndex: number
  fragmentIndex: number
  charIndex: number
  color: string
  left: number
  top: number
  width: number
  height: number
  content: string
  isFirst?: boolean
  isLast?: boolean
  isLastSelected?: boolean
  isCrlf?: boolean
}

function normalizeStyle(style: Record<string, any>): Record<string, any> {
  const newStyle: Record<string, any> = {}
  for (const key in style) {
    if (key !== 'id' && style[key] !== undefined && style[key] !== '') {
      newStyle[key] = style[key]
    }
  }
  return newStyle
}

function textContentToCharStyles(textContent: NormalizedTextContent): Record<string, any>[] {
  return textContent.flatMap((p) => {
    const { fragments } = p
    const res = fragments.flatMap((f) => {
      const { content, ...fStyle } = f
      return Array.from(normalizeCRLF(content)).map(() => ({ ...fStyle }))
    })
    if (isCRLF(normalizeCRLF(fragments[fragments.length - 1]?.content ?? ''))) {
      return res
    }
    return [...res, {}]
  })
}

function isEqualStyle(style1: Record<string, any>, style2: Record<string, any>): boolean {
  const keys1 = Object.keys(style1)
  const keys2 = Object.keys(style2)
  const keys = Array.from(new Set([...keys1, ...keys2]))
  return !keys.length || keys.every(key => style1[key] === style2[key])
}

const emojiRE
  = /[#*0-9]\uFE0F?\u20E3|[\xA9\xAE\u203C\u2049\u2122\u2139\u2194-\u2199\u21A9\u21AA\u231A\u231B\u2328\u23CF\u23ED-\u23EF\u23F1\u23F2\u23F8-\u23FA\u24C2\u25AA\u25AB\u25B6\u25C0\u25FB\u25FC\u25FE\u2600-\u2604\u260E\u2611\u2614\u2615\u2618\u2620\u2622\u2623\u2626\u262A\u262E\u262F\u2638-\u263A\u2640\u2642\u2648-\u2653\u265F\u2660\u2663\u2665\u2666\u2668\u267B\u267E\u267F\u2692\u2694-\u2697\u2699\u269B\u269C\u26A0\u26A7\u26AA\u26B0\u26B1\u26BD\u26BE\u26C4\u26C8\u26CF\u26D1\u26E9\u26F0-\u26F5\u26F7\u26F8\u26FA\u2702\u2708\u2709\u270F\u2712\u2714\u2716\u271D\u2721\u2733\u2734\u2744\u2747\u2757\u2763\u27A1\u2934\u2935\u2B05-\u2B07\u2B1B\u2B1C\u2B55\u3030\u303D\u3297\u3299]\uFE0F?|[\u261D\u270C\u270D](?:\uD83C[\uDFFB-\uDFFF]|\uFE0F)?|[\u270A\u270B](?:\uD83C[\uDFFB-\uDFFF])?|[\u23E9-\u23EC\u23F0\u23F3\u25FD\u2693\u26A1\u26AB\u26C5\u26CE\u26D4\u26EA\u26FD\u2705\u2728\u274C\u274E\u2753-\u2755\u2795-\u2797\u27B0\u27BF\u2B50]|\u26D3\uFE0F?(?:\u200D\uD83D\uDCA5)?|\u26F9(?:\uD83C[\uDFFB-\uDFFF]|\uFE0F)?(?:\u200D[\u2640\u2642]\uFE0F?)?|\u2764\uFE0F?(?:\u200D(?:\uD83D\uDD25|\uD83E\uDE79))?|\uD83C(?:[\uDC04\uDD70\uDD71\uDD7E\uDD7F\uDE02\uDE37\uDF21\uDF24-\uDF2C\uDF36\uDF7D\uDF96\uDF97\uDF99-\uDF9B\uDF9E\uDF9F\uDFCD\uDFCE\uDFD4-\uDFDF\uDFF5\uDFF7]\uFE0F?|[\uDF85\uDFC2\uDFC7](?:\uD83C[\uDFFB-\uDFFF])?|[\uDFC4\uDFCA](?:\uD83C[\uDFFB-\uDFFF])?(?:\u200D[\u2640\u2642]\uFE0F?)?|[\uDFCB\uDFCC](?:\uD83C[\uDFFB-\uDFFF]|\uFE0F)?(?:\u200D[\u2640\u2642]\uFE0F?)?|[\uDCCF\uDD8E\uDD91-\uDD9A\uDE01\uDE1A\uDE2F\uDE32-\uDE36\uDE38-\uDE3A\uDE50\uDE51\uDF00-\uDF20\uDF2D-\uDF35\uDF37-\uDF43\uDF45-\uDF4A\uDF4C-\uDF7C\uDF7E-\uDF84\uDF86-\uDF93\uDFA0-\uDFC1\uDFC5\uDFC6\uDFC8\uDFC9\uDFCF-\uDFD3\uDFE0-\uDFF0\uDFF8-\uDFFF]|\uDDE6\uD83C[\uDDE8-\uDDEC\uDDEE\uDDF1\uDDF2\uDDF4\uDDF6-\uDDFA\uDDFC\uDDFD\uDDFF]|\uDDE7\uD83C[\uDDE6\uDDE7\uDDE9-\uDDEF\uDDF1-\uDDF4\uDDF6-\uDDF9\uDDFB\uDDFC\uDDFE\uDDFF]|\uDDE8\uD83C[\uDDE6\uDDE8\uDDE9\uDDEB-\uDDEE\uDDF0-\uDDF7\uDDFA-\uDDFF]|\uDDE9\uD83C[\uDDEA\uDDEC\uDDEF\uDDF0\uDDF2\uDDF4\uDDFF]|\uDDEA\uD83C[\uDDE6\uDDE8\uDDEA\uDDEC\uDDED\uDDF7-\uDDFA]|\uDDEB\uD83C[\uDDEE-\uDDF0\uDDF2\uDDF4\uDDF7]|\uDDEC\uD83C[\uDDE6\uDDE7\uDDE9-\uDDEE\uDDF1-\uDDF3\uDDF5-\uDDFA\uDDFC\uDDFE]|\uDDED\uD83C[\uDDF0\uDDF2\uDDF3\uDDF7\uDDF9\uDDFA]|\uDDEE\uD83C[\uDDE8-\uDDEA\uDDF1-\uDDF4\uDDF6-\uDDF9]|\uDDEF\uD83C[\uDDEA\uDDF2\uDDF4\uDDF5]|\uDDF0\uD83C[\uDDEA\uDDEC-\uDDEE\uDDF2\uDDF3\uDDF5\uDDF7\uDDFC\uDDFE\uDDFF]|\uDDF1\uD83C[\uDDE6-\uDDE8\uDDEE\uDDF0\uDDF7-\uDDFB\uDDFE]|\uDDF2\uD83C[\uDDE6\uDDE8-\uDDED\uDDF0-\uDDFF]|\uDDF3\uD83C[\uDDE6\uDDE8\uDDEA-\uDDEC\uDDEE\uDDF1\uDDF4\uDDF5\uDDF7\uDDFA\uDDFF]|\uDDF4\uD83C\uDDF2|\uDDF5\uD83C[\uDDE6\uDDEA-\uDDED\uDDF0-\uDDF3\uDDF7-\uDDF9\uDDFC\uDDFE]|\uDDF6\uD83C\uDDE6|\uDDF7\uD83C[\uDDEA\uDDF4\uDDF8\uDDFA\uDDFC]|\uDDF8\uD83C[\uDDE6-\uDDEA\uDDEC-\uDDF4\uDDF7-\uDDF9\uDDFB\uDDFD-\uDDFF]|\uDDF9\uD83C[\uDDE6\uDDE8\uDDE9\uDDEB-\uDDED\uDDEF-\uDDF4\uDDF7\uDDF9\uDDFB\uDDFC\uDDFF]|\uDDFA\uD83C[\uDDE6\uDDEC\uDDF2\uDDF3\uDDF8\uDDFE\uDDFF]|\uDDFB\uD83C[\uDDE6\uDDE8\uDDEA\uDDEC\uDDEE\uDDF3\uDDFA]|\uDDFC\uD83C[\uDDEB\uDDF8]|\uDDFD\uD83C\uDDF0|\uDDFE\uD83C[\uDDEA\uDDF9]|\uDDFF\uD83C[\uDDE6\uDDF2\uDDFC]|\uDF44(?:\u200D\uD83D\uDFEB)?|\uDF4B(?:\u200D\uD83D\uDFE9)?|\uDFC3(?:\uD83C[\uDFFB-\uDFFF])?(?:\u200D(?:[\u2640\u2642]\uFE0F?(?:\u200D\u27A1\uFE0F?)?|\u27A1\uFE0F?))?|\uDFF3\uFE0F?(?:\u200D(?:\u26A7\uFE0F?|\uD83C\uDF08))?|\uDFF4(?:\u200D\u2620\uFE0F?|\uDB40\uDC67\uDB40\uDC62\uDB40(?:\uDC65\uDB40\uDC6E\uDB40\uDC67|\uDC73\uDB40\uDC63\uDB40\uDC74|\uDC77\uDB40\uDC6C\uDB40\uDC73)\uDB40\uDC7F)?)|\uD83D(?:[\uDC3F\uDCFD\uDD49\uDD4A\uDD6F\uDD70\uDD73\uDD76-\uDD79\uDD87\uDD8A-\uDD8D\uDDA5\uDDA8\uDDB1\uDDB2\uDDBC\uDDC2-\uDDC4\uDDD1-\uDDD3\uDDDC-\uDDDE\uDDE1\uDDE3\uDDE8\uDDEF\uDDF3\uDDFA\uDECB\uDECD-\uDECF\uDEE0-\uDEE5\uDEE9\uDEF0\uDEF3]\uFE0F?|[\uDC42\uDC43\uDC46-\uDC50\uDC66\uDC67\uDC6B-\uDC6D\uDC72\uDC74-\uDC76\uDC78\uDC7C\uDC83\uDC85\uDC8F\uDC91\uDCAA\uDD7A\uDD95\uDD96\uDE4C\uDE4F\uDEC0\uDECC](?:\uD83C[\uDFFB-\uDFFF])?|[\uDC6E\uDC70\uDC71\uDC73\uDC77\uDC81\uDC82\uDC86\uDC87\uDE45-\uDE47\uDE4B\uDE4D\uDE4E\uDEA3\uDEB4\uDEB5](?:\uD83C[\uDFFB-\uDFFF])?(?:\u200D[\u2640\u2642]\uFE0F?)?|[\uDD74\uDD90](?:\uD83C[\uDFFB-\uDFFF]|\uFE0F)?|[\uDC00-\uDC07\uDC09-\uDC14\uDC16-\uDC25\uDC27-\uDC3A\uDC3C-\uDC3E\uDC40\uDC44\uDC45\uDC51-\uDC65\uDC6A\uDC79-\uDC7B\uDC7D-\uDC80\uDC84\uDC88-\uDC8E\uDC90\uDC92-\uDCA9\uDCAB-\uDCFC\uDCFF-\uDD3D\uDD4B-\uDD4E\uDD50-\uDD67\uDDA4\uDDFB-\uDE2D\uDE2F-\uDE34\uDE37-\uDE41\uDE43\uDE44\uDE48-\uDE4A\uDE80-\uDEA2\uDEA4-\uDEB3\uDEB7-\uDEBF\uDEC1-\uDEC5\uDED0-\uDED2\uDED5-\uDED7\uDEDC-\uDEDF\uDEEB\uDEEC\uDEF4-\uDEFC\uDFE0-\uDFEB\uDFF0]|\uDC08(?:\u200D\u2B1B)?|\uDC15(?:\u200D\uD83E\uDDBA)?|\uDC26(?:\u200D(?:\u2B1B|\uD83D\uDD25))?|\uDC3B(?:\u200D\u2744\uFE0F?)?|\uDC41\uFE0F?(?:\u200D\uD83D\uDDE8\uFE0F?)?|\uDC68(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\u2764\uFE0F?\u200D\uD83D(?:\uDC8B\u200D\uD83D)?\uDC68|\uD83C[\uDF3E\uDF73\uDF7C\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D(?:[\uDC68\uDC69]\u200D\uD83D(?:\uDC66(?:\u200D\uD83D\uDC66)?|\uDC67(?:\u200D\uD83D[\uDC66\uDC67])?)|[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uDC66(?:\u200D\uD83D\uDC66)?|\uDC67(?:\u200D\uD83D[\uDC66\uDC67])?)|\uD83E(?:[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3]))|\uD83C(?:\uDFFB(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\u2764\uFE0F?\u200D\uD83D(?:\uDC8B\u200D\uD83D)?\uDC68\uD83C[\uDFFB-\uDFFF]|\uD83C[\uDF3E\uDF73\uDF7C\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E(?:[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3]|\uDD1D\u200D\uD83D\uDC68\uD83C[\uDFFC-\uDFFF])))?|\uDFFC(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\u2764\uFE0F?\u200D\uD83D(?:\uDC8B\u200D\uD83D)?\uDC68\uD83C[\uDFFB-\uDFFF]|\uD83C[\uDF3E\uDF73\uDF7C\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E(?:[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3]|\uDD1D\u200D\uD83D\uDC68\uD83C[\uDFFB\uDFFD-\uDFFF])))?|\uDFFD(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\u2764\uFE0F?\u200D\uD83D(?:\uDC8B\u200D\uD83D)?\uDC68\uD83C[\uDFFB-\uDFFF]|\uD83C[\uDF3E\uDF73\uDF7C\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E(?:[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3]|\uDD1D\u200D\uD83D\uDC68\uD83C[\uDFFB\uDFFC\uDFFE\uDFFF])))?|\uDFFE(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\u2764\uFE0F?\u200D\uD83D(?:\uDC8B\u200D\uD83D)?\uDC68\uD83C[\uDFFB-\uDFFF]|\uD83C[\uDF3E\uDF73\uDF7C\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E(?:[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3]|\uDD1D\u200D\uD83D\uDC68\uD83C[\uDFFB-\uDFFD\uDFFF])))?|\uDFFF(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\u2764\uFE0F?\u200D\uD83D(?:\uDC8B\u200D\uD83D)?\uDC68\uD83C[\uDFFB-\uDFFF]|\uD83C[\uDF3E\uDF73\uDF7C\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E(?:[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3]|\uDD1D\u200D\uD83D\uDC68\uD83C[\uDFFB-\uDFFE])))?))?|\uDC69(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\u2764\uFE0F?\u200D\uD83D(?:\uDC8B\u200D\uD83D)?[\uDC68\uDC69]|\uD83C[\uDF3E\uDF73\uDF7C\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D(?:[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uDC66(?:\u200D\uD83D\uDC66)?|\uDC67(?:\u200D\uD83D[\uDC66\uDC67])?|\uDC69\u200D\uD83D(?:\uDC66(?:\u200D\uD83D\uDC66)?|\uDC67(?:\u200D\uD83D[\uDC66\uDC67])?))|\uD83E(?:[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3]))|\uD83C(?:\uDFFB(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\u2764\uFE0F?\u200D\uD83D(?:[\uDC68\uDC69]|\uDC8B\u200D\uD83D[\uDC68\uDC69])\uD83C[\uDFFB-\uDFFF]|\uD83C[\uDF3E\uDF73\uDF7C\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E(?:[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3]|\uDD1D\u200D\uD83D[\uDC68\uDC69]\uD83C[\uDFFC-\uDFFF])))?|\uDFFC(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\u2764\uFE0F?\u200D\uD83D(?:[\uDC68\uDC69]|\uDC8B\u200D\uD83D[\uDC68\uDC69])\uD83C[\uDFFB-\uDFFF]|\uD83C[\uDF3E\uDF73\uDF7C\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E(?:[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3]|\uDD1D\u200D\uD83D[\uDC68\uDC69]\uD83C[\uDFFB\uDFFD-\uDFFF])))?|\uDFFD(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\u2764\uFE0F?\u200D\uD83D(?:[\uDC68\uDC69]|\uDC8B\u200D\uD83D[\uDC68\uDC69])\uD83C[\uDFFB-\uDFFF]|\uD83C[\uDF3E\uDF73\uDF7C\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E(?:[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3]|\uDD1D\u200D\uD83D[\uDC68\uDC69]\uD83C[\uDFFB\uDFFC\uDFFE\uDFFF])))?|\uDFFE(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\u2764\uFE0F?\u200D\uD83D(?:[\uDC68\uDC69]|\uDC8B\u200D\uD83D[\uDC68\uDC69])\uD83C[\uDFFB-\uDFFF]|\uD83C[\uDF3E\uDF73\uDF7C\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E(?:[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3]|\uDD1D\u200D\uD83D[\uDC68\uDC69]\uD83C[\uDFFB-\uDFFD\uDFFF])))?|\uDFFF(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\u2764\uFE0F?\u200D\uD83D(?:[\uDC68\uDC69]|\uDC8B\u200D\uD83D[\uDC68\uDC69])\uD83C[\uDFFB-\uDFFF]|\uD83C[\uDF3E\uDF73\uDF7C\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E(?:[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3]|\uDD1D\u200D\uD83D[\uDC68\uDC69]\uD83C[\uDFFB-\uDFFE])))?))?|\uDC6F(?:\u200D[\u2640\u2642]\uFE0F?)?|\uDD75(?:\uD83C[\uDFFB-\uDFFF]|\uFE0F)?(?:\u200D[\u2640\u2642]\uFE0F?)?|\uDE2E(?:\u200D\uD83D\uDCA8)?|\uDE35(?:\u200D\uD83D\uDCAB)?|\uDE36(?:\u200D\uD83C\uDF2B\uFE0F?)?|\uDE42(?:\u200D[\u2194\u2195]\uFE0F?)?|\uDEB6(?:\uD83C[\uDFFB-\uDFFF])?(?:\u200D(?:[\u2640\u2642]\uFE0F?(?:\u200D\u27A1\uFE0F?)?|\u27A1\uFE0F?))?)|\uD83E(?:[\uDD0C\uDD0F\uDD18-\uDD1F\uDD30-\uDD34\uDD36\uDD77\uDDB5\uDDB6\uDDBB\uDDD2\uDDD3\uDDD5\uDEC3-\uDEC5\uDEF0\uDEF2-\uDEF8](?:\uD83C[\uDFFB-\uDFFF])?|[\uDD26\uDD35\uDD37-\uDD39\uDD3D\uDD3E\uDDB8\uDDB9\uDDCD\uDDCF\uDDD4\uDDD6-\uDDDD](?:\uD83C[\uDFFB-\uDFFF])?(?:\u200D[\u2640\u2642]\uFE0F?)?|[\uDDDE\uDDDF](?:\u200D[\u2640\u2642]\uFE0F?)?|[\uDD0D\uDD0E\uDD10-\uDD17\uDD20-\uDD25\uDD27-\uDD2F\uDD3A\uDD3F-\uDD45\uDD47-\uDD76\uDD78-\uDDB4\uDDB7\uDDBA\uDDBC-\uDDCC\uDDD0\uDDE0-\uDDFF\uDE70-\uDE7C\uDE80-\uDE89\uDE8F-\uDEC2\uDEC6\uDECE-\uDEDC\uDEDF-\uDEE9]|\uDD3C(?:\u200D[\u2640\u2642]\uFE0F?|\uD83C[\uDFFB-\uDFFF])?|\uDDCE(?:\uD83C[\uDFFB-\uDFFF])?(?:\u200D(?:[\u2640\u2642]\uFE0F?(?:\u200D\u27A1\uFE0F?)?|\u27A1\uFE0F?))?|\uDDD1(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\uD83C[\uDF3E\uDF73\uDF7C\uDF84\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E(?:[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3]|\uDD1D\u200D\uD83E\uDDD1|\uDDD1\u200D\uD83E\uDDD2(?:\u200D\uD83E\uDDD2)?|\uDDD2(?:\u200D\uD83E\uDDD2)?))|\uD83C(?:\uDFFB(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\u2764\uFE0F?\u200D(?:\uD83D\uDC8B\u200D)?\uD83E\uDDD1\uD83C[\uDFFC-\uDFFF]|\uD83C[\uDF3E\uDF73\uDF7C\uDF84\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E(?:[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3]|\uDD1D\u200D\uD83E\uDDD1\uD83C[\uDFFB-\uDFFF])))?|\uDFFC(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\u2764\uFE0F?\u200D(?:\uD83D\uDC8B\u200D)?\uD83E\uDDD1\uD83C[\uDFFB\uDFFD-\uDFFF]|\uD83C[\uDF3E\uDF73\uDF7C\uDF84\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E(?:[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3]|\uDD1D\u200D\uD83E\uDDD1\uD83C[\uDFFB-\uDFFF])))?|\uDFFD(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\u2764\uFE0F?\u200D(?:\uD83D\uDC8B\u200D)?\uD83E\uDDD1\uD83C[\uDFFB\uDFFC\uDFFE\uDFFF]|\uD83C[\uDF3E\uDF73\uDF7C\uDF84\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E(?:[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3]|\uDD1D\u200D\uD83E\uDDD1\uD83C[\uDFFB-\uDFFF])))?|\uDFFE(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\u2764\uFE0F?\u200D(?:\uD83D\uDC8B\u200D)?\uD83E\uDDD1\uD83C[\uDFFB-\uDFFD\uDFFF]|\uD83C[\uDF3E\uDF73\uDF7C\uDF84\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E(?:[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3]|\uDD1D\u200D\uD83E\uDDD1\uD83C[\uDFFB-\uDFFF])))?|\uDFFF(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\u2764\uFE0F?\u200D(?:\uD83D\uDC8B\u200D)?\uD83E\uDDD1\uD83C[\uDFFB-\uDFFE]|\uD83C[\uDF3E\uDF73\uDF7C\uDF84\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E(?:[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3]|\uDD1D\u200D\uD83E\uDDD1\uD83C[\uDFFB-\uDFFF])))?))?|\uDEF1(?:\uD83C(?:\uDFFB(?:\u200D\uD83E\uDEF2\uD83C[\uDFFC-\uDFFF])?|\uDFFC(?:\u200D\uD83E\uDEF2\uD83C[\uDFFB\uDFFD-\uDFFF])?|\uDFFD(?:\u200D\uD83E\uDEF2\uD83C[\uDFFB\uDFFC\uDFFE\uDFFF])?|\uDFFE(?:\u200D\uD83E\uDEF2\uD83C[\uDFFB-\uDFFD\uDFFF])?|\uDFFF(?:\u200D\uD83E\uDEF2\uD83C[\uDFFB-\uDFFE])?))?)/g

function parseHTML(html: string): HTMLElement {
  const template = document.createElement('template')
  template.innerHTML = html
  return template.content.cloneNode(true) as HTMLElement
}

const SUPPORTS_POINTER_EVENTS = 'PointerEvent' in globalThis

export class TextEditor extends HTMLElement implements PropertyAccessor {
  @property({ fallback: () => [0, 0] }) declare selection: number[]
  @property({ fallback: () => ({ min: 0, max: 0 }) }) declare selectionMinMax: { min: number, max: number }
  @property({ fallback: () => ([] as IndexCharacter[]) }) declare chars: IndexCharacter[]
  @property({ fallback: () => ([] as IndexCharacter[]) }) declare selectedChars: IndexCharacter[]
  @property() declare cursorPosition?: { left: number, top: number, width: number, height: number, color: string }
  @property({ fallback: false  }) declare showCursor: boolean

  prevSelection = [0, 0]
  composition = false

  static register(): void {
    customElements.define('text-editor', this)
  }

  protected _text = new Text()
  get text(): Text { return this._text }
  set text(newText: Text) {
    if (newText) {
      this._text?.off('update', this._update)
      newText.on('update', this._update)
      this._text = newText
      this.setTextInput(this.getPlaintext())
      this.text.update()
      this._update()
    }
  }

  protected _oldText = ''

  $container: HTMLDivElement
  $selection: HTMLDivElement
  $textarea: HTMLTextAreaElement
  $cursor: HTMLElement

  onUpdateProperty(key: string, _newValue: unknown, _oldValue: unknown): void {
    switch (key) {
      case 'selection':
        this.selectionMinMax = {
          min: Math.min(...this.selection),
          max: Math.max(...this.selection),
        }
        break
      case 'selectionMinMax':
      case 'chars':
        this.updateSelectedChars()
        this.updateCursorPosition()
        break
      case 'showCursor':
      case 'cursorPosition':
        this.renderCursor()
        break
      case 'selectedChars':
        this.renderCursor()
        this.renderSelectRange()
        break
    }
  }

  updateChars(): void {
    const paragraphs: Character[][][] = []
    this.text.paragraphs.forEach((p, paragraphIndex) => {
      p.fragments.forEach((f, fragmentIndex) => {
        f.characters.forEach((c) => {
          if (!paragraphs[paragraphIndex])
            paragraphs[paragraphIndex] = []
          if (!paragraphs[paragraphIndex][fragmentIndex])
            paragraphs[paragraphIndex][fragmentIndex] = []
          paragraphs[paragraphIndex][fragmentIndex].push(c)
        })
      })
    })
    const toIndexChar = (c: Character): IndexCharacter => {
      return {
        paragraphIndex: -1,
        fragmentIndex: -1,
        charIndex: -1,
        color: c.computedStyle.color,
        left: c.lineBox.left - this.text.boundingBox.left,
        top: c.lineBox.top - this.text.boundingBox.top,
        width: c.lineBox.width,
        height: c.lineBox.height,
        content: c.content,
      }
    }
    const chars: IndexCharacter[] = []
    let pos = 0
    paragraphs.forEach((p, paragraphIndex) => {
      if (p.length === 1 && p[0].length === 1 && isCRLF(p[0][0].content)) {
        const c = p[0][0]
        chars[pos] = {
          ...toIndexChar(c),
          paragraphIndex,
          fragmentIndex: 0,
          charIndex: 0,
          isCrlf: true,
        }
      }
      else {
        p.forEach((f, fragmentIndex) => {
          f.forEach((c, charIndex) => {
            const char = toIndexChar(c)
            chars[pos] = {
              ...char,
              paragraphIndex,
              fragmentIndex,
              charIndex,
            }
            pos++
            if (!isCRLF(c.content)) {
              chars[pos] = {
                ...char,
                paragraphIndex,
                fragmentIndex,
                charIndex,
                content: ' ',
                isLastSelected: true,
              }
            }
          })
        })
      }
      pos++
    })
    if (chars[0]) {
      chars[0].isFirst = true
    }
    if (chars[chars.length - 1]) {
      chars[chars.length - 1].isLast = true
    }
    this.chars = chars
  }

  updateSelectedChars(): void {
    this.selectedChars = this.chars.filter((_char, index) => {
      return index >= this.selectionMinMax.min && index < this.selectionMinMax.max
    })
    this.emit('selected', [
      this.chars[this.selectionMinMax.min],
      this.chars[this.selectionMinMax.max],
    ])
  }

  updateCursorPosition(): void {
    let left = 0
    let top = 0
    const char = this.chars[this.selectionMinMax.min]
    if (char?.isLastSelected) {
      if (this.text.isVertical) {
        top += char?.height ?? 0
      }
      else {
        left += char?.width ?? 0
      }
    }
    left += char?.left ?? 0
    top += char?.top ?? 0
    this.cursorPosition = {
      color: char?.color,
      left,
      top,
      height: char?.height ?? 0,
      width: char?.width ?? 0,
    }
  }

  constructor() {
    super()

    const shadowRoot = this.attachShadow({ mode: 'open' })

    shadowRoot.appendChild(
      parseHTML(`
  <style>
  :host {
    position: absolute;
    width: 0;
    height: 0;
  }

  .container {
    position: absolute;
  }

  textarea {
    position: absolute;
    opacity: 0;
    caret-color: transparent;
    left: 0;
    top: 0;
    width: 100%;
    height: 100%;
    padding: 0;
    border: 0;
    white-space: pre;
  }

  .selection {
    position: absolute;
    left: 0;
    top: 0;
    pointer-events: none;
  }

  .selection > * {
    position: absolute;
    left: 0;
    top: 0;
    background: rgba(var(--color, 0, 0, 0), 0.4);
  }

  .cursor {
    position: absolute;
    left: 0;
    top: 0;
    pointer-events: none;
  }

  .cursor.blink {
    animation: cursor-blink 1s steps(2, start) infinite;
  }

  @keyframes cursor-blink {
    100% {
      visibility: hidden;
    }
  }
  </style>

  <div class="container">
    <textarea></textarea>
    <div class="selection"></div>
    <div class="cursor blink"></div>
  </div>
`),
    )

    this.$container = shadowRoot.querySelector('.container') as HTMLDivElement
    this.$selection = shadowRoot.querySelector('.selection') as HTMLDivElement
    this.$textarea = shadowRoot.querySelector('textarea') as HTMLTextAreaElement
    this.$cursor = shadowRoot.querySelector('.cursor') as HTMLElement
    this.bindEventListeners()
    this._update = this._update.bind(this)
  }

  connectedCallback(): void {
    this.emit('init')
  }

  getPlaintext(): string {
    return textContentToString(
      this.getNewContent(
        this.text.content,
      ),
    )
  }

  getNewContent(
    content: NormalizedTextContent,
    newString = textContentToString(content),
    oldString = newString,
  ): NormalizedTextContent {
    // 1. normalize text
    newString = normalizeCRLF(newString)
    newString = newString.replace(emojiRE, (emoji) => {
      if (Array.from(emoji).length > 1) {
        return '?'
      }
      return emoji
    })
    oldString = normalizeCRLF(oldString)
    // 2. diff style
    const oldStyles = textContentToCharStyles(content)
    const styles: Record<string, any>[] = []
    let styleIndex = 0
    let oldStyleIndex = 0
    let prevOldStyle: Record<string, any> = {}
    const changes = diffChars(oldString, newString)
    changes.forEach((change) => {
      const chars = Array.from(change.value)
      if (change.removed) {
        oldStyleIndex += chars.length
      }
      else {
        chars.forEach(() => {
          if (change.added) {
            styles[styleIndex] = { ...prevOldStyle }
          }
          else {
            prevOldStyle = normalizeStyle(oldStyles[oldStyleIndex])
            styles[styleIndex] = { ...prevOldStyle }
            oldStyleIndex++
          }
          styleIndex++
        })
      }
    })
    // 3. create new content
    let charIndex = 0
    const newContents: NormalizedTextContent = []
    normalizeTextContent(newString).forEach((p, pI) => {
      const { fragments: _, ...pStyle } = content[pI] ?? {}
      let newParagraph: NormalizedParagraph = { ...pStyle, fragments: [] }
      let newFragment: NormalizedFragment | undefined
      p.fragments.forEach((f) => {
        Array.from(f.content).forEach((char) => {
          const style = styles[charIndex] ?? {}
          if (newFragment) {
            const { content: _, ..._style } = newFragment
            if (isEqualStyle(style, _style)) {
              newFragment.content += char
            }
            else {
              newParagraph.fragments.push(newFragment)
              newFragment = { ...style, content: char }
            }
          }
          else {
            newFragment = { ...style, content: char }
          }
          charIndex++
        })
      })
      if (!isCRLF(p.fragments[p.fragments.length - 1]?.content ?? '')) {
        charIndex++
      }
      if (newFragment) {
        newParagraph.fragments.push(newFragment)
      }
      if (newParagraph.fragments.length) {
        newContents.push(newParagraph)
        newParagraph = { ...pStyle, fragments: [] }
      }
    })
    return newContents
  }

  setTextInput(newText: string): void {
    this.$textarea.value = newText
    this._oldText = newText
  }

  onInput(): void {
    const newText = this.$textarea.value
    this.text.content = this.getNewContent(
      this.text.content,
      newText,
      this._oldText,
    )
    this._oldText = newText
    this.text.update()
    this.emit('update')
  }

  protected _timer?: any

  onKeydown(e: KeyboardEvent): void {
    e.stopPropagation()
    switch (e.key) {
      case 'Escape':
        return this.$textarea.blur()
    }
    this.updateSelectionByDom()
    setTimeout(() => this.updateSelectionByDom(), 0)
    setTimeout(() => this.updateSelectionByDom(), 100)
  }

  onFocus(): void {
    this.showCursor = true
  }

  onBlur(): void {
    this.showCursor = false
  }

  findNearest(options: {
    x: number
    y: number
    xWeight?: number
    yWeight?: number
  }): number {
    const { x, y, xWeight = 1, yWeight = 1 } = options

    const char = this.chars.reduce(
      (prev, current, index) => {
        const diff = (
          Math.abs(current.left + current.width / 2 - x) * xWeight
          + Math.abs(current.top + current.height / 2 - y) * yWeight
        )
        if (diff < prev.diff) {
          return {
            diff,
            index,
            value: current,
          }
        }
        return prev
      },
      {
        diff: Number.MAX_SAFE_INTEGER,
        index: -1,
        value: undefined as IndexCharacter | undefined,
      },
    )

    if (char?.value) {
      const middleX = char.value.left + char.value.width / 2
      if (x > middleX && !char.value.isCrlf && !char.value.isLastSelected) {
        return char.index + 1
      }
      return char.index
    }

    return -1
  }

  updateSelectionByDom(): void {
    if (this.composition) {
      this.selection = this.prevSelection
    }
    else {
      let count = 0
      const _selection: number[] = []
      this.chars.forEach((char, index) => {
        if (count <= this.$textarea.selectionStart) {
          _selection[0] = index
        }
        else if (count <= this.$textarea.selectionEnd) {
          _selection[1] = index
        }
        count += char.content.length
      })
      const oldSelection = this.selection
      this.selection = _selection
      this.prevSelection = oldSelection
    }
  }

  updateDomSelection(): void {
    let start = 0
    let end = 0
    this.chars.forEach((char, index) => {
      if (index < this.selectionMinMax.min) {
        start += char.content.length
        end = start
      }
      else if (index < this.selectionMinMax.max) {
        end += char.content.length
      }
    })
    this.$textarea.selectionStart = start
    this.$textarea.selectionEnd = end
  }

  protected _update(): void {
    this.updateChars()
    const host = this.shadowRoot!.host as HTMLElement
    host.style.width = `${this.text.boundingBox.width}px`
    host.style.height = `${this.text.boundingBox.height}px`
    this.$container.style.left = `${this.text.glyphBox.left}px`
    this.$container.style.top = `${this.text.glyphBox.top}px`
    this.$container.style.width = `${this.text.glyphBox.width}px`
    this.$container.style.height = `${this.text.glyphBox.height}px`
    this.$textarea.style.fontSize = `${this.text.computedStyle.fontSize}px`
    this.$textarea.style.writingMode = this.text.computedStyle.writingMode
    this.renderSelectRange()
    this.renderCursor()
  }

  bindEventListeners(): void {
    this.$textarea.addEventListener('compositionstart', () => this.composition = true)
    this.$textarea.addEventListener('compositionend', () => this.composition = false)
    this.$textarea.addEventListener('keydown', this.onKeydown.bind(this))
    this.$textarea.addEventListener('input', this.onInput.bind(this) as any)
    this.$textarea.addEventListener('focus', this.onFocus.bind(this) as any)
    this.$textarea.addEventListener('blur', this.onBlur.bind(this) as any)
    if (SUPPORTS_POINTER_EVENTS) {
      this.$textarea.addEventListener('pointerdown', this.start.bind(this) as any)
    }
    else {
      this.$textarea.addEventListener('mousedown', this.start.bind(this) as any)
    }

    ;['keyup', 'mouseup', 'input', 'paste', 'cut'].forEach((key) => {
      this.$textarea.addEventListener(key, () => {
        this.updateSelectionByDom()
      })
    })
  }

  start(e?: MouseEvent): boolean {
    if (e && e.button !== 0) {
      e.preventDefault()
      e.stopPropagation()
      return false
    }

    const host = this.shadowRoot!.host as HTMLElement
    const rect = host.getBoundingClientRect()
    const originalWidth = host.offsetWidth
    const originalHeight = host.offsetHeight
    const scaleX = rect.width / originalWidth
    const scaleY = rect.height / originalHeight
    let offsetX = 0
    let offsetY = 0

    if (e) {
      offsetX = (e.clientX - rect.left) / scaleX
      offsetY = (e.clientY - rect.top) / scaleY

      if (
        !(
          offsetX > this.text.glyphBox.left
          && offsetX < this.text.glyphBox.left + this.text.glyphBox.width
          && offsetY > this.text.glyphBox.top
          && offsetY < this.text.glyphBox.top + this.text.glyphBox.height
        )
      ) {
        return false
      }

      e.preventDefault()
      e.stopPropagation()
    }

    const index = this.findNearest({ x: offsetX, y: offsetY })
    this.selection = [index, index]
    this.updateDomSelection()

    if (e && !['mouseup', 'pointerup'].includes(e.type)) {
      const onMove = (e: MouseEvent): void => {
        const offsetX = (e.clientX - rect.left) / scaleX
        const offsetY = (e.clientY - rect.top) / scaleY
        this.selection = [
          this.selection[0],
          this.findNearest({ x: offsetX, y: offsetY }),
        ]
        this.updateDomSelection()
      }
      const onUp = (): void => {
        if (SUPPORTS_POINTER_EVENTS) {
          document.removeEventListener('pointermove', onMove)
          document.removeEventListener('pointerup', onUp)
        }
        else {
          document.removeEventListener('mousemove', onMove)
          document.removeEventListener('mouseup', onUp)
        }
      }
      if (SUPPORTS_POINTER_EVENTS) {
        document.addEventListener('pointermove', onMove)
        document.addEventListener('pointerup', onUp)
      }
      else {
        document.addEventListener('mousemove', onMove)
        document.addEventListener('mouseup', onUp)
      }
    }

    this.$textarea.focus()

    return true
  }

  attributeChangedCallback(name: string, _oldValue: any, newValue: any): void {
    ;(this as any)[name] = newValue
  }

  emit(type: string, detail?: any): boolean {
    return this.dispatchEvent(
      new CustomEvent(type, {
        bubbles: true,
        cancelable: true,
        composed: true,
        detail,
      }),
    )
  }

  renderSelectRange(): void {
    if (
      this.selection[0] !== this.prevSelection[0]
      || this.selection[1] !== this.prevSelection[1]
    ) {
      const isVertical = this.text.isVertical
      const boxesGroupsMap: Record<number, Record<string, any>[]> = {}
      this.selectedChars.forEach((char) => {
        if (char.isLastSelected) {
          return
        }
        const key = isVertical
          ? char.left
          : char.top
        if (!boxesGroupsMap[key]) {
          boxesGroupsMap[key] = []
        }
        boxesGroupsMap[key].push({
          x: char.left - this.text.glyphBox.left,
          y: char.top - this.text.glyphBox.top,
          w: char.width,
          h: char.height,
        })
      })
      const boxesGroups = Object.values(boxesGroupsMap)
      const sourceLen = this.$selection.children.length
      const targetLen = boxesGroups.length
      const len = Math.max(sourceLen, targetLen)

      const deleted: (HTMLElement | undefined)[] = []
      for (let i = 0; i < len; i++) {
        let element = this.$selection.children.item(i) as HTMLElement | undefined
        const boxes = boxesGroups[i]
        if (!boxes) {
          deleted.push(element)
          continue
        } else if (!element) {
          element = document.createElement('div')
          this.$selection.append(element)
        }
        const min = {
          x: Math.min(...boxes.map(v => v.x)),
          y: Math.min(...boxes.map(v => v.y)),
        }
        const max = {
          x: Math.max(...boxes.map(v => v.x + v.w)),
          y: Math.max(...boxes.map(v => v.y + v.h)),
        }
        element.style.width = `${max.x - min.x}px`
        element.style.height = `${max.y - min.y}px`
        element.style.transform = `translate(${min.x}px, ${min.y}px)`
      }

      deleted.forEach(el => el?.remove())
    }
  }

  renderCursor(): void {
    if (
      this.showCursor
      && this.cursorPosition
      && this.selectedChars.length === 0
    ) {
      const cursorPosition = this.cursorPosition
      this.$cursor.style.display = 'block'
      this.$cursor.style.backgroundColor = cursorPosition.color ?? 'rgba(var(--color))'
      this.$cursor.style.left = `${cursorPosition.left - this.text.glyphBox.left}px`
      this.$cursor.style.top = `${cursorPosition.top - this.text.glyphBox.top}px`
      this.$cursor.style.height = this.text.isVertical ? '1px' : `${cursorPosition.height}px`
      this.$cursor.style.width = this.text.isVertical ? `${cursorPosition.width}px` : '1px'
    } else {
      this.$cursor.style.display = 'none'
    }
    this.$cursor.classList.remove('blink')
    if (this._timer) {
      clearTimeout(this._timer)
    }
    this._timer = setTimeout(() => this.$cursor.classList.add('blink'), 500)
  }
}
