[**mce**](../../../../README.md)

***

[mce](../../../../README.md) / [Mce](../README.md) / InternalDocument

# Interface: InternalDocument

Defined in: [packages/mce/src/plugins/doc.ts:11](https://github.com/qq15725/mce/blob/865b01d697eb28080c375f733b243ebfb2a27a39/packages/mce/src/plugins/doc.ts#L11)

## Extends

- `Document`

## Properties

### activeElement

> `readonly` **activeElement**: `Element` \| `null`

Defined in: node\_modules/.pnpm/typescript@5.9.3/node\_modules/typescript/lib/lib.dom.d.ts:10439

Returns the deepest element in the document through which or to which key events are being routed. This is, roughly speaking, the focused element in the document.

For the purposes of this API, when a child browsing context is focused, its container is focused in the parent browsing context. For example, if the user moves the focus to a text control in an iframe, the iframe is the element returned by the activeElement API in the iframe's node document.

Similarly, when the focused element is in a different node tree than documentOrShadowRoot, the element returned will be the host that's located in the same node tree as documentOrShadowRoot if documentOrShadowRoot is a shadow-including inclusive ancestor of the focused element, and null if not.

[MDN Reference](https://developer.mozilla.org/docs/Web/API/Document/activeElement)

#### Inherited from

`Document.activeElement`

***

### adoptedStyleSheets

> **adoptedStyleSheets**: `CSSStyleSheet`[]

Defined in: node\_modules/.pnpm/typescript@5.9.3/node\_modules/typescript/lib/lib.dom.d.ts:10441

[MDN Reference](https://developer.mozilla.org/docs/Web/API/Document/adoptedStyleSheets)

#### Inherited from

`Document.adoptedStyleSheets`

***

### ~~alinkColor~~

> **alinkColor**: `string`

Defined in: node\_modules/.pnpm/typescript@5.9.3/node\_modules/typescript/lib/lib.dom.d.ts:9780

Returns or sets the color of an active link in the document body.

#### Deprecated

[MDN Reference](https://developer.mozilla.org/docs/Web/API/Document/alinkColor)

#### Inherited from

`Document.alinkColor`

***

### ~~all~~

> `readonly` **all**: `HTMLAllCollection`

Defined in: node\_modules/.pnpm/typescript@5.9.3/node\_modules/typescript/lib/lib.dom.d.ts:9787

The Document interface's read-only **`all`** property returns an HTMLAllCollection rooted at the document node.

#### Deprecated

[MDN Reference](https://developer.mozilla.org/docs/Web/API/Document/all)

#### Inherited from

`Document.all`

***

### ~~anchors~~

> `readonly` **anchors**: `HTMLCollectionOf`\<`HTMLAnchorElement`\>

Defined in: node\_modules/.pnpm/typescript@5.9.3/node\_modules/typescript/lib/lib.dom.d.ts:9794

The **`anchors`** read-only property of the An HTMLCollection.

#### Deprecated

[MDN Reference](https://developer.mozilla.org/docs/Web/API/Document/anchors)

#### Inherited from

`Document.anchors`

***

### ~~applets~~

> `readonly` **applets**: `HTMLCollection`

Defined in: node\_modules/.pnpm/typescript@5.9.3/node\_modules/typescript/lib/lib.dom.d.ts:9801

The **`applets`** property of the Document returns an empty HTMLCollection.

#### Deprecated

[MDN Reference](https://developer.mozilla.org/docs/Web/API/Document/applets)

#### Inherited from

`Document.applets`

***

### ATTRIBUTE\_NODE

> `readonly` **ATTRIBUTE\_NODE**: `2`

Defined in: node\_modules/.pnpm/typescript@5.9.3/node\_modules/typescript/lib/lib.dom.d.ts:21835

#### Inherited from

`Document.ATTRIBUTE_NODE`

***

### baseURI

> `readonly` **baseURI**: `string`

Defined in: node\_modules/.pnpm/typescript@5.9.3/node\_modules/typescript/lib/lib.dom.d.ts:21664

The read-only **`baseURI`** property of the Node interface returns the absolute base URL of the document containing the node.

[MDN Reference](https://developer.mozilla.org/docs/Web/API/Node/baseURI)

#### Inherited from

`Document.baseURI`

***

### ~~bgColor~~

> **bgColor**: `string`

Defined in: node\_modules/.pnpm/typescript@5.9.3/node\_modules/typescript/lib/lib.dom.d.ts:9808

The deprecated `bgColor` property gets or sets the background color of the current document.

#### Deprecated

[MDN Reference](https://developer.mozilla.org/docs/Web/API/Document/bgColor)

#### Inherited from

`Document.bgColor`

***

### body

> **body**: `HTMLElement`

Defined in: node\_modules/.pnpm/typescript@5.9.3/node\_modules/typescript/lib/lib.dom.d.ts:9814

The **`Document.body`** property represents the `null` if no such element exists.

[MDN Reference](https://developer.mozilla.org/docs/Web/API/Document/body)

#### Inherited from

`Document.body`

***

### CDATA\_SECTION\_NODE

> `readonly` **CDATA\_SECTION\_NODE**: `4`

Defined in: node\_modules/.pnpm/typescript@5.9.3/node\_modules/typescript/lib/lib.dom.d.ts:21839

node is a CDATASection node.

#### Inherited from

`Document.CDATA_SECTION_NODE`

***

### characterSet

> `readonly` **characterSet**: `string`

Defined in: node\_modules/.pnpm/typescript@5.9.3/node\_modules/typescript/lib/lib.dom.d.ts:9820

The **`Document.characterSet`** read-only property returns the character encoding of the document that it's currently rendered with.

[MDN Reference](https://developer.mozilla.org/docs/Web/API/Document/characterSet)

#### Inherited from

`Document.characterSet`

***

### ~~charset~~

> `readonly` **charset**: `string`

Defined in: node\_modules/.pnpm/typescript@5.9.3/node\_modules/typescript/lib/lib.dom.d.ts:9826

#### Deprecated

This is a legacy alias of `characterSet`.

[MDN Reference](https://developer.mozilla.org/docs/Web/API/Document/characterSet)

#### Inherited from

`Document.charset`

***

### childElementCount

> `readonly` **childElementCount**: `number`

Defined in: node\_modules/.pnpm/typescript@5.9.3/node\_modules/typescript/lib/lib.dom.d.ts:22668

[MDN Reference](https://developer.mozilla.org/docs/Web/API/Document/childElementCount)

#### Inherited from

`Document.childElementCount`

***

### childNodes

> `readonly` **childNodes**: `NodeListOf`\<`ChildNode`\>

Defined in: node\_modules/.pnpm/typescript@5.9.3/node\_modules/typescript/lib/lib.dom.d.ts:21670

The read-only **`childNodes`** property of the Node interface returns a live the first child node is assigned index `0`.

[MDN Reference](https://developer.mozilla.org/docs/Web/API/Node/childNodes)

#### Inherited from

`Document.childNodes`

***

### children

> `readonly` **children**: `HTMLCollection`

Defined in: node\_modules/.pnpm/typescript@5.9.3/node\_modules/typescript/lib/lib.dom.d.ts:22674

Returns the child elements.

[MDN Reference](https://developer.mozilla.org/docs/Web/API/Document/children)

#### Inherited from

`Document.children`

***

### COMMENT\_NODE

> `readonly` **COMMENT\_NODE**: `8`

Defined in: node\_modules/.pnpm/typescript@5.9.3/node\_modules/typescript/lib/lib.dom.d.ts:21845

node is a Comment node.

#### Inherited from

`Document.COMMENT_NODE`

***

### compatMode

> `readonly` **compatMode**: `string`

Defined in: node\_modules/.pnpm/typescript@5.9.3/node\_modules/typescript/lib/lib.dom.d.ts:9832

The **`Document.compatMode`** read-only property indicates whether the document is rendered in Quirks mode or Standards mode.

[MDN Reference](https://developer.mozilla.org/docs/Web/API/Document/compatMode)

#### Inherited from

`Document.compatMode`

***

### contentType

> `readonly` **contentType**: `string`

Defined in: node\_modules/.pnpm/typescript@5.9.3/node\_modules/typescript/lib/lib.dom.d.ts:9838

The **`Document.contentType`** read-only property returns the MIME type that the document is being rendered as.

[MDN Reference](https://developer.mozilla.org/docs/Web/API/Document/contentType)

#### Inherited from

`Document.contentType`

***

### cookie

> **cookie**: `string`

Defined in: node\_modules/.pnpm/typescript@5.9.3/node\_modules/typescript/lib/lib.dom.d.ts:9844

The Document property `cookie` lets you read and write cookies associated with the document.

[MDN Reference](https://developer.mozilla.org/docs/Web/API/Document/cookie)

#### Inherited from

`Document.cookie`

***

### currentScript

> `readonly` **currentScript**: `HTMLOrSVGScriptElement` \| `null`

Defined in: node\_modules/.pnpm/typescript@5.9.3/node\_modules/typescript/lib/lib.dom.d.ts:9850

The **`Document.currentScript`** property returns the script element whose script is currently being processed and isn't a JavaScript module.

[MDN Reference](https://developer.mozilla.org/docs/Web/API/Document/currentScript)

#### Inherited from

`Document.currentScript`

***

### defaultView

> `readonly` **defaultView**: `Window` & *typeof* `globalThis` \| `null`

Defined in: node\_modules/.pnpm/typescript@5.9.3/node\_modules/typescript/lib/lib.dom.d.ts:9856

In browsers, **`document.defaultView`** returns the This property is read-only.

[MDN Reference](https://developer.mozilla.org/docs/Web/API/Document/defaultView)

#### Inherited from

`Document.defaultView`

***

### designMode

> **designMode**: `string`

Defined in: node\_modules/.pnpm/typescript@5.9.3/node\_modules/typescript/lib/lib.dom.d.ts:9862

**`document.designMode`** controls whether the entire document is editable.

[MDN Reference](https://developer.mozilla.org/docs/Web/API/Document/designMode)

#### Inherited from

`Document.designMode`

***

### dir

> **dir**: `string`

Defined in: node\_modules/.pnpm/typescript@5.9.3/node\_modules/typescript/lib/lib.dom.d.ts:9868

The **`Document.dir`** property is a string representing the directionality of the text of the document, whether left to right (default) or right to left.

[MDN Reference](https://developer.mozilla.org/docs/Web/API/Document/dir)

#### Inherited from

`Document.dir`

***

### doctype

> `readonly` **doctype**: `DocumentType` \| `null`

Defined in: node\_modules/.pnpm/typescript@5.9.3/node\_modules/typescript/lib/lib.dom.d.ts:9874

The **`doctype`** read-only property of the Document interface is a DocumentType object representing the Doctype associated with the current document.

[MDN Reference](https://developer.mozilla.org/docs/Web/API/Document/doctype)

#### Inherited from

`Document.doctype`

***

### DOCUMENT\_FRAGMENT\_NODE

> `readonly` **DOCUMENT\_FRAGMENT\_NODE**: `11`

Defined in: node\_modules/.pnpm/typescript@5.9.3/node\_modules/typescript/lib/lib.dom.d.ts:21851

node is a DocumentFragment node.

#### Inherited from

`Document.DOCUMENT_FRAGMENT_NODE`

***

### DOCUMENT\_NODE

> `readonly` **DOCUMENT\_NODE**: `9`

Defined in: node\_modules/.pnpm/typescript@5.9.3/node\_modules/typescript/lib/lib.dom.d.ts:21847

node is a document.

#### Inherited from

`Document.DOCUMENT_NODE`

***

### DOCUMENT\_POSITION\_CONTAINED\_BY

> `readonly` **DOCUMENT\_POSITION\_CONTAINED\_BY**: `16`

Defined in: node\_modules/.pnpm/typescript@5.9.3/node\_modules/typescript/lib/lib.dom.d.ts:21862

Set when other is a descendant of node.

#### Inherited from

`Document.DOCUMENT_POSITION_CONTAINED_BY`

***

### DOCUMENT\_POSITION\_CONTAINS

> `readonly` **DOCUMENT\_POSITION\_CONTAINS**: `8`

Defined in: node\_modules/.pnpm/typescript@5.9.3/node\_modules/typescript/lib/lib.dom.d.ts:21860

Set when other is an ancestor of node.

#### Inherited from

`Document.DOCUMENT_POSITION_CONTAINS`

***

### DOCUMENT\_POSITION\_DISCONNECTED

> `readonly` **DOCUMENT\_POSITION\_DISCONNECTED**: `1`

Defined in: node\_modules/.pnpm/typescript@5.9.3/node\_modules/typescript/lib/lib.dom.d.ts:21854

Set when node and other are not in the same tree.

#### Inherited from

`Document.DOCUMENT_POSITION_DISCONNECTED`

***

### DOCUMENT\_POSITION\_FOLLOWING

> `readonly` **DOCUMENT\_POSITION\_FOLLOWING**: `4`

Defined in: node\_modules/.pnpm/typescript@5.9.3/node\_modules/typescript/lib/lib.dom.d.ts:21858

Set when other is following node.

#### Inherited from

`Document.DOCUMENT_POSITION_FOLLOWING`

***

### DOCUMENT\_POSITION\_IMPLEMENTATION\_SPECIFIC

> `readonly` **DOCUMENT\_POSITION\_IMPLEMENTATION\_SPECIFIC**: `32`

Defined in: node\_modules/.pnpm/typescript@5.9.3/node\_modules/typescript/lib/lib.dom.d.ts:21863

#### Inherited from

`Document.DOCUMENT_POSITION_IMPLEMENTATION_SPECIFIC`

***

### DOCUMENT\_POSITION\_PRECEDING

> `readonly` **DOCUMENT\_POSITION\_PRECEDING**: `2`

Defined in: node\_modules/.pnpm/typescript@5.9.3/node\_modules/typescript/lib/lib.dom.d.ts:21856

Set when other is preceding node.

#### Inherited from

`Document.DOCUMENT_POSITION_PRECEDING`

***

### DOCUMENT\_TYPE\_NODE

> `readonly` **DOCUMENT\_TYPE\_NODE**: `10`

Defined in: node\_modules/.pnpm/typescript@5.9.3/node\_modules/typescript/lib/lib.dom.d.ts:21849

node is a doctype.

#### Inherited from

`Document.DOCUMENT_TYPE_NODE`

***

### documentElement

> `readonly` **documentElement**: `HTMLElement`

Defined in: node\_modules/.pnpm/typescript@5.9.3/node\_modules/typescript/lib/lib.dom.d.ts:9880

The **`documentElement`** read-only property of the Document interface returns the example, the html element for HTML documents).

[MDN Reference](https://developer.mozilla.org/docs/Web/API/Document/documentElement)

#### Inherited from

`Document.documentElement`

***

### documentURI

> `readonly` **documentURI**: `string`

Defined in: node\_modules/.pnpm/typescript@5.9.3/node\_modules/typescript/lib/lib.dom.d.ts:9886

The **`documentURI`** read-only property of the A string.

[MDN Reference](https://developer.mozilla.org/docs/Web/API/Document/documentURI)

#### Inherited from

`Document.documentURI`

***

### ~~domain~~

> **domain**: `string`

Defined in: node\_modules/.pnpm/typescript@5.9.3/node\_modules/typescript/lib/lib.dom.d.ts:9893

The **`domain`** property of the Document interface gets/sets the domain portion of the origin of the current document, as used by the same-origin policy.

#### Deprecated

[MDN Reference](https://developer.mozilla.org/docs/Web/API/Document/domain)

#### Inherited from

`Document.domain`

***

### ELEMENT\_NODE

> `readonly` **ELEMENT\_NODE**: `1`

Defined in: node\_modules/.pnpm/typescript@5.9.3/node\_modules/typescript/lib/lib.dom.d.ts:21834

node is an element.

#### Inherited from

`Document.ELEMENT_NODE`

***

### embeds

> `readonly` **embeds**: `HTMLCollectionOf`\<`HTMLEmbedElement`\>

Defined in: node\_modules/.pnpm/typescript@5.9.3/node\_modules/typescript/lib/lib.dom.d.ts:9899

The **`embeds`** read-only property of the An HTMLCollection.

[MDN Reference](https://developer.mozilla.org/docs/Web/API/Document/embeds)

#### Inherited from

`Document.embeds`

***

### ENTITY\_NODE

> `readonly` **ENTITY\_NODE**: `6`

Defined in: node\_modules/.pnpm/typescript@5.9.3/node\_modules/typescript/lib/lib.dom.d.ts:21841

#### Inherited from

`Document.ENTITY_NODE`

***

### ENTITY\_REFERENCE\_NODE

> `readonly` **ENTITY\_REFERENCE\_NODE**: `5`

Defined in: node\_modules/.pnpm/typescript@5.9.3/node\_modules/typescript/lib/lib.dom.d.ts:21840

#### Inherited from

`Document.ENTITY_REFERENCE_NODE`

***

### ~~fgColor~~

> **fgColor**: `string`

Defined in: node\_modules/.pnpm/typescript@5.9.3/node\_modules/typescript/lib/lib.dom.d.ts:9906

**`fgColor`** gets/sets the foreground color, or text color, of the current document.

#### Deprecated

[MDN Reference](https://developer.mozilla.org/docs/Web/API/Document/fgColor)

#### Inherited from

`Document.fgColor`

***

### firstChild

> `readonly` **firstChild**: `ChildNode` \| `null`

Defined in: node\_modules/.pnpm/typescript@5.9.3/node\_modules/typescript/lib/lib.dom.d.ts:21676

The read-only **`firstChild`** property of the Node interface returns the node's first child in the tree, or `null` if the node has no children.

[MDN Reference](https://developer.mozilla.org/docs/Web/API/Node/firstChild)

#### Inherited from

`Document.firstChild`

***

### firstElementChild

> `readonly` **firstElementChild**: `Element` \| `null`

Defined in: node\_modules/.pnpm/typescript@5.9.3/node\_modules/typescript/lib/lib.dom.d.ts:22680

Returns the first child that is an element, and null otherwise.

[MDN Reference](https://developer.mozilla.org/docs/Web/API/Document/firstElementChild)

#### Inherited from

`Document.firstElementChild`

***

### fonts

> `readonly` **fonts**: `FontFaceSet`

Defined in: node\_modules/.pnpm/typescript@5.9.3/node\_modules/typescript/lib/lib.dom.d.ts:12211

[MDN Reference](https://developer.mozilla.org/docs/Web/API/Document/fonts)

#### Inherited from

`Document.fonts`

***

### forms

> `readonly` **forms**: `HTMLCollectionOf`\<`HTMLFormElement`\>

Defined in: node\_modules/.pnpm/typescript@5.9.3/node\_modules/typescript/lib/lib.dom.d.ts:9912

The **`forms`** read-only property of the Document interface returns an HTMLCollection listing all the form elements contained in the document.

[MDN Reference](https://developer.mozilla.org/docs/Web/API/Document/forms)

#### Inherited from

`Document.forms`

***

### fragmentDirective

> `readonly` **fragmentDirective**: `FragmentDirective`

Defined in: node\_modules/.pnpm/typescript@5.9.3/node\_modules/typescript/lib/lib.dom.d.ts:9918

The **`fragmentDirective`** read-only property of the Document interface returns the FragmentDirective for the current document.

[MDN Reference](https://developer.mozilla.org/docs/Web/API/Document/fragmentDirective)

#### Inherited from

`Document.fragmentDirective`

***

### ~~fullscreen~~

> `readonly` **fullscreen**: `boolean`

Defined in: node\_modules/.pnpm/typescript@5.9.3/node\_modules/typescript/lib/lib.dom.d.ts:9925

The obsolete Document interface's **`fullscreen`** read-only property reports whether or not the document is currently displaying content in fullscreen mode.

#### Deprecated

[MDN Reference](https://developer.mozilla.org/docs/Web/API/Document/fullscreen)

#### Inherited from

`Document.fullscreen`

***

### fullscreenElement

> `readonly` **fullscreenElement**: `Element` \| `null`

Defined in: node\_modules/.pnpm/typescript@5.9.3/node\_modules/typescript/lib/lib.dom.d.ts:10447

Returns document's fullscreen element.

[MDN Reference](https://developer.mozilla.org/docs/Web/API/Document/fullscreenElement)

#### Inherited from

`Document.fullscreenElement`

***

### fullscreenEnabled

> `readonly` **fullscreenEnabled**: `boolean`

Defined in: node\_modules/.pnpm/typescript@5.9.3/node\_modules/typescript/lib/lib.dom.d.ts:9931

The read-only **`fullscreenEnabled`** property on the Document interface indicates whether or not fullscreen mode is available.

[MDN Reference](https://developer.mozilla.org/docs/Web/API/Document/fullscreenEnabled)

#### Inherited from

`Document.fullscreenEnabled`

***

### head

> `readonly` **head**: `HTMLHeadElement`

Defined in: node\_modules/.pnpm/typescript@5.9.3/node\_modules/typescript/lib/lib.dom.d.ts:9937

The **`head`** read-only property of the Document interface returns the head element of the current document.

[MDN Reference](https://developer.mozilla.org/docs/Web/API/Document/head)

#### Inherited from

`Document.head`

***

### hidden

> `readonly` **hidden**: `boolean`

Defined in: node\_modules/.pnpm/typescript@5.9.3/node\_modules/typescript/lib/lib.dom.d.ts:9943

The **`Document.hidden`** read-only property returns a Boolean value indicating if the page is considered hidden or not.

[MDN Reference](https://developer.mozilla.org/docs/Web/API/Document/hidden)

#### Inherited from

`Document.hidden`

***

### id

> **id**: `string`

Defined in: [packages/mce/src/plugins/doc.ts:12](https://github.com/qq15725/mce/blob/865b01d697eb28080c375f733b243ebfb2a27a39/packages/mce/src/plugins/doc.ts#L12)

***

### images

> `readonly` **images**: `HTMLCollectionOf`\<`HTMLImageElement`\>

Defined in: node\_modules/.pnpm/typescript@5.9.3/node\_modules/typescript/lib/lib.dom.d.ts:9949

The **`images`** read-only property of the Document interface returns a collection of the images in the current HTML document.

[MDN Reference](https://developer.mozilla.org/docs/Web/API/Document/images)

#### Inherited from

`Document.images`

***

### implementation

> `readonly` **implementation**: `DOMImplementation`

Defined in: node\_modules/.pnpm/typescript@5.9.3/node\_modules/typescript/lib/lib.dom.d.ts:9955

The **`Document.implementation`** property returns a A DOMImplementation object.

[MDN Reference](https://developer.mozilla.org/docs/Web/API/Document/implementation)

#### Inherited from

`Document.implementation`

***

### ~~inputEncoding~~

> `readonly` **inputEncoding**: `string`

Defined in: node\_modules/.pnpm/typescript@5.9.3/node\_modules/typescript/lib/lib.dom.d.ts:9961

#### Deprecated

This is a legacy alias of `characterSet`.

[MDN Reference](https://developer.mozilla.org/docs/Web/API/Document/characterSet)

#### Inherited from

`Document.inputEncoding`

***

### isConnected

> `readonly` **isConnected**: `boolean`

Defined in: node\_modules/.pnpm/typescript@5.9.3/node\_modules/typescript/lib/lib.dom.d.ts:21682

The read-only **`isConnected`** property of the Node interface returns a boolean indicating whether the node is connected (directly or indirectly) to a Document object.

[MDN Reference](https://developer.mozilla.org/docs/Web/API/Node/isConnected)

#### Inherited from

`Document.isConnected`

***

### lastChild

> `readonly` **lastChild**: `ChildNode` \| `null`

Defined in: node\_modules/.pnpm/typescript@5.9.3/node\_modules/typescript/lib/lib.dom.d.ts:21688

The read-only **`lastChild`** property of the Node interface returns the last child of the node, or `null` if there are no child nodes.

[MDN Reference](https://developer.mozilla.org/docs/Web/API/Node/lastChild)

#### Inherited from

`Document.lastChild`

***

### lastElementChild

> `readonly` **lastElementChild**: `Element` \| `null`

Defined in: node\_modules/.pnpm/typescript@5.9.3/node\_modules/typescript/lib/lib.dom.d.ts:22686

Returns the last child that is an element, and null otherwise.

[MDN Reference](https://developer.mozilla.org/docs/Web/API/Document/lastElementChild)

#### Inherited from

`Document.lastElementChild`

***

### lastModified

> `readonly` **lastModified**: `string`

Defined in: node\_modules/.pnpm/typescript@5.9.3/node\_modules/typescript/lib/lib.dom.d.ts:9967

The **`lastModified`** property of the Document interface returns a string containing the date and local time on which the current document was last modified.

[MDN Reference](https://developer.mozilla.org/docs/Web/API/Document/lastModified)

#### Inherited from

`Document.lastModified`

***

### ~~linkColor~~

> **linkColor**: `string`

Defined in: node\_modules/.pnpm/typescript@5.9.3/node\_modules/typescript/lib/lib.dom.d.ts:9974

The **`Document.linkColor`** property gets/sets the color of links within the document.

#### Deprecated

[MDN Reference](https://developer.mozilla.org/docs/Web/API/Document/linkColor)

#### Inherited from

`Document.linkColor`

***

### links

> `readonly` **links**: `HTMLCollectionOf`\<`HTMLAnchorElement` \| `HTMLAreaElement`\>

Defined in: node\_modules/.pnpm/typescript@5.9.3/node\_modules/typescript/lib/lib.dom.d.ts:9980

The **`links`** read-only property of the Document interface returns a collection of all area elements and a elements in a document with a value for the href attribute.

[MDN Reference](https://developer.mozilla.org/docs/Web/API/Document/links)

#### Inherited from

`Document.links`

***

### meta

> **meta**: `object`

Defined in: [packages/mce/src/plugins/doc.ts:13](https://github.com/qq15725/mce/blob/865b01d697eb28080c375f733b243ebfb2a27a39/packages/mce/src/plugins/doc.ts#L13)

#### Index Signature

\[`key`: `string`\]: `any`

#### inEditorIs

> **inEditorIs**: `"Doc"`

***

### nextSibling

> `readonly` **nextSibling**: `ChildNode` \| `null`

Defined in: node\_modules/.pnpm/typescript@5.9.3/node\_modules/typescript/lib/lib.dom.d.ts:21694

The read-only **`nextSibling`** property of the Node interface returns the node immediately following the specified one in their parent's Node.childNodes, or returns `null` if the specified node is the last child in the parent element.

[MDN Reference](https://developer.mozilla.org/docs/Web/API/Node/nextSibling)

#### Inherited from

`Document.nextSibling`

***

### nodeName

> `readonly` **nodeName**: `string`

Defined in: node\_modules/.pnpm/typescript@5.9.3/node\_modules/typescript/lib/lib.dom.d.ts:21700

The read-only **`nodeName`** property of Node returns the name of the current node as a string.

[MDN Reference](https://developer.mozilla.org/docs/Web/API/Node/nodeName)

#### Inherited from

`Document.nodeName`

***

### nodeType

> `readonly` **nodeType**: `number`

Defined in: node\_modules/.pnpm/typescript@5.9.3/node\_modules/typescript/lib/lib.dom.d.ts:21706

The read-only **`nodeType`** property of a Node interface is an integer that identifies what the node is.

[MDN Reference](https://developer.mozilla.org/docs/Web/API/Node/nodeType)

#### Inherited from

`Document.nodeType`

***

### nodeValue

> **nodeValue**: `string` \| `null`

Defined in: node\_modules/.pnpm/typescript@5.9.3/node\_modules/typescript/lib/lib.dom.d.ts:21712

The **`nodeValue`** property of the Node interface returns or sets the value of the current node.

[MDN Reference](https://developer.mozilla.org/docs/Web/API/Node/nodeValue)

#### Inherited from

`Document.nodeValue`

***

### NOTATION\_NODE

> `readonly` **NOTATION\_NODE**: `12`

Defined in: node\_modules/.pnpm/typescript@5.9.3/node\_modules/typescript/lib/lib.dom.d.ts:21852

#### Inherited from

`Document.NOTATION_NODE`

***

### onabort

> **onabort**: (`this`, `ev`) => `any` \| `null`

Defined in: node\_modules/.pnpm/typescript@5.9.3/node\_modules/typescript/lib/lib.dom.d.ts:12743

[MDN Reference](https://developer.mozilla.org/docs/Web/API/HTMLMediaElement/abort_event)

#### Inherited from

`Document.onabort`

***

### onanimationcancel

> **onanimationcancel**: (`this`, `ev`) => `any` \| `null`

Defined in: node\_modules/.pnpm/typescript@5.9.3/node\_modules/typescript/lib/lib.dom.d.ts:12745

[MDN Reference](https://developer.mozilla.org/docs/Web/API/Element/animationcancel_event)

#### Inherited from

`Document.onanimationcancel`

***

### onanimationend

> **onanimationend**: (`this`, `ev`) => `any` \| `null`

Defined in: node\_modules/.pnpm/typescript@5.9.3/node\_modules/typescript/lib/lib.dom.d.ts:12747

[MDN Reference](https://developer.mozilla.org/docs/Web/API/Element/animationend_event)

#### Inherited from

`Document.onanimationend`

***

### onanimationiteration

> **onanimationiteration**: (`this`, `ev`) => `any` \| `null`

Defined in: node\_modules/.pnpm/typescript@5.9.3/node\_modules/typescript/lib/lib.dom.d.ts:12749

[MDN Reference](https://developer.mozilla.org/docs/Web/API/Element/animationiteration_event)

#### Inherited from

`Document.onanimationiteration`

***

### onanimationstart

> **onanimationstart**: (`this`, `ev`) => `any` \| `null`

Defined in: node\_modules/.pnpm/typescript@5.9.3/node\_modules/typescript/lib/lib.dom.d.ts:12751

[MDN Reference](https://developer.mozilla.org/docs/Web/API/Element/animationstart_event)

#### Inherited from

`Document.onanimationstart`

***

### onauxclick

> **onauxclick**: (`this`, `ev`) => `any` \| `null`

Defined in: node\_modules/.pnpm/typescript@5.9.3/node\_modules/typescript/lib/lib.dom.d.ts:12753

[MDN Reference](https://developer.mozilla.org/docs/Web/API/Element/auxclick_event)

#### Inherited from

`Document.onauxclick`

***

### onbeforeinput

> **onbeforeinput**: (`this`, `ev`) => `any` \| `null`

Defined in: node\_modules/.pnpm/typescript@5.9.3/node\_modules/typescript/lib/lib.dom.d.ts:12755

[MDN Reference](https://developer.mozilla.org/docs/Web/API/Element/beforeinput_event)

#### Inherited from

`Document.onbeforeinput`

***

### onbeforematch

> **onbeforematch**: (`this`, `ev`) => `any` \| `null`

Defined in: node\_modules/.pnpm/typescript@5.9.3/node\_modules/typescript/lib/lib.dom.d.ts:12757

[MDN Reference](https://developer.mozilla.org/docs/Web/API/Element/beforematch_event)

#### Inherited from

`Document.onbeforematch`

***

### onbeforetoggle

> **onbeforetoggle**: (`this`, `ev`) => `any` \| `null`

Defined in: node\_modules/.pnpm/typescript@5.9.3/node\_modules/typescript/lib/lib.dom.d.ts:12759

[MDN Reference](https://developer.mozilla.org/docs/Web/API/HTMLElement/beforetoggle_event)

#### Inherited from

`Document.onbeforetoggle`

***

### onblur

> **onblur**: (`this`, `ev`) => `any` \| `null`

Defined in: node\_modules/.pnpm/typescript@5.9.3/node\_modules/typescript/lib/lib.dom.d.ts:12761

[MDN Reference](https://developer.mozilla.org/docs/Web/API/Element/blur_event)

#### Inherited from

`Document.onblur`

***

### oncancel

> **oncancel**: (`this`, `ev`) => `any` \| `null`

Defined in: node\_modules/.pnpm/typescript@5.9.3/node\_modules/typescript/lib/lib.dom.d.ts:12763

[MDN Reference](https://developer.mozilla.org/docs/Web/API/HTMLDialogElement/cancel_event)

#### Inherited from

`Document.oncancel`

***

### oncanplay

> **oncanplay**: (`this`, `ev`) => `any` \| `null`

Defined in: node\_modules/.pnpm/typescript@5.9.3/node\_modules/typescript/lib/lib.dom.d.ts:12765

[MDN Reference](https://developer.mozilla.org/docs/Web/API/HTMLMediaElement/canplay_event)

#### Inherited from

`Document.oncanplay`

***

### oncanplaythrough

> **oncanplaythrough**: (`this`, `ev`) => `any` \| `null`

Defined in: node\_modules/.pnpm/typescript@5.9.3/node\_modules/typescript/lib/lib.dom.d.ts:12767

[MDN Reference](https://developer.mozilla.org/docs/Web/API/HTMLMediaElement/canplaythrough_event)

#### Inherited from

`Document.oncanplaythrough`

***

### onchange

> **onchange**: (`this`, `ev`) => `any` \| `null`

Defined in: node\_modules/.pnpm/typescript@5.9.3/node\_modules/typescript/lib/lib.dom.d.ts:12769

[MDN Reference](https://developer.mozilla.org/docs/Web/API/HTMLElement/change_event)

#### Inherited from

`Document.onchange`

***

### onclick

> **onclick**: (`this`, `ev`) => `any` \| `null`

Defined in: node\_modules/.pnpm/typescript@5.9.3/node\_modules/typescript/lib/lib.dom.d.ts:12771

[MDN Reference](https://developer.mozilla.org/docs/Web/API/Element/click_event)

#### Inherited from

`Document.onclick`

***

### onclose

> **onclose**: (`this`, `ev`) => `any` \| `null`

Defined in: node\_modules/.pnpm/typescript@5.9.3/node\_modules/typescript/lib/lib.dom.d.ts:12773

[MDN Reference](https://developer.mozilla.org/docs/Web/API/HTMLDialogElement/close_event)

#### Inherited from

`Document.onclose`

***

### oncontextlost

> **oncontextlost**: (`this`, `ev`) => `any` \| `null`

Defined in: node\_modules/.pnpm/typescript@5.9.3/node\_modules/typescript/lib/lib.dom.d.ts:12775

[MDN Reference](https://developer.mozilla.org/docs/Web/API/HTMLCanvasElement/contextlost_event)

#### Inherited from

`Document.oncontextlost`

***

### oncontextmenu

> **oncontextmenu**: (`this`, `ev`) => `any` \| `null`

Defined in: node\_modules/.pnpm/typescript@5.9.3/node\_modules/typescript/lib/lib.dom.d.ts:12777

[MDN Reference](https://developer.mozilla.org/docs/Web/API/Element/contextmenu_event)

#### Inherited from

`Document.oncontextmenu`

***

### oncontextrestored

> **oncontextrestored**: (`this`, `ev`) => `any` \| `null`

Defined in: node\_modules/.pnpm/typescript@5.9.3/node\_modules/typescript/lib/lib.dom.d.ts:12779

[MDN Reference](https://developer.mozilla.org/docs/Web/API/HTMLCanvasElement/contextrestored_event)

#### Inherited from

`Document.oncontextrestored`

***

### oncopy

> **oncopy**: (`this`, `ev`) => `any` \| `null`

Defined in: node\_modules/.pnpm/typescript@5.9.3/node\_modules/typescript/lib/lib.dom.d.ts:12781

[MDN Reference](https://developer.mozilla.org/docs/Web/API/Element/copy_event)

#### Inherited from

`Document.oncopy`

***

### oncuechange

> **oncuechange**: (`this`, `ev`) => `any` \| `null`

Defined in: node\_modules/.pnpm/typescript@5.9.3/node\_modules/typescript/lib/lib.dom.d.ts:12783

[MDN Reference](https://developer.mozilla.org/docs/Web/API/HTMLTrackElement/cuechange_event)

#### Inherited from

`Document.oncuechange`

***

### oncut

> **oncut**: (`this`, `ev`) => `any` \| `null`

Defined in: node\_modules/.pnpm/typescript@5.9.3/node\_modules/typescript/lib/lib.dom.d.ts:12785

[MDN Reference](https://developer.mozilla.org/docs/Web/API/Element/cut_event)

#### Inherited from

`Document.oncut`

***

### ondblclick

> **ondblclick**: (`this`, `ev`) => `any` \| `null`

Defined in: node\_modules/.pnpm/typescript@5.9.3/node\_modules/typescript/lib/lib.dom.d.ts:12787

[MDN Reference](https://developer.mozilla.org/docs/Web/API/Element/dblclick_event)

#### Inherited from

`Document.ondblclick`

***

### ondrag

> **ondrag**: (`this`, `ev`) => `any` \| `null`

Defined in: node\_modules/.pnpm/typescript@5.9.3/node\_modules/typescript/lib/lib.dom.d.ts:12789

[MDN Reference](https://developer.mozilla.org/docs/Web/API/HTMLElement/drag_event)

#### Inherited from

`Document.ondrag`

***

### ondragend

> **ondragend**: (`this`, `ev`) => `any` \| `null`

Defined in: node\_modules/.pnpm/typescript@5.9.3/node\_modules/typescript/lib/lib.dom.d.ts:12791

[MDN Reference](https://developer.mozilla.org/docs/Web/API/HTMLElement/dragend_event)

#### Inherited from

`Document.ondragend`

***

### ondragenter

> **ondragenter**: (`this`, `ev`) => `any` \| `null`

Defined in: node\_modules/.pnpm/typescript@5.9.3/node\_modules/typescript/lib/lib.dom.d.ts:12793

[MDN Reference](https://developer.mozilla.org/docs/Web/API/HTMLElement/dragenter_event)

#### Inherited from

`Document.ondragenter`

***

### ondragleave

> **ondragleave**: (`this`, `ev`) => `any` \| `null`

Defined in: node\_modules/.pnpm/typescript@5.9.3/node\_modules/typescript/lib/lib.dom.d.ts:12795

[MDN Reference](https://developer.mozilla.org/docs/Web/API/HTMLElement/dragleave_event)

#### Inherited from

`Document.ondragleave`

***

### ondragover

> **ondragover**: (`this`, `ev`) => `any` \| `null`

Defined in: node\_modules/.pnpm/typescript@5.9.3/node\_modules/typescript/lib/lib.dom.d.ts:12797

[MDN Reference](https://developer.mozilla.org/docs/Web/API/HTMLElement/dragover_event)

#### Inherited from

`Document.ondragover`

***

### ondragstart

> **ondragstart**: (`this`, `ev`) => `any` \| `null`

Defined in: node\_modules/.pnpm/typescript@5.9.3/node\_modules/typescript/lib/lib.dom.d.ts:12799

[MDN Reference](https://developer.mozilla.org/docs/Web/API/HTMLElement/dragstart_event)

#### Inherited from

`Document.ondragstart`

***

### ondrop

> **ondrop**: (`this`, `ev`) => `any` \| `null`

Defined in: node\_modules/.pnpm/typescript@5.9.3/node\_modules/typescript/lib/lib.dom.d.ts:12801

[MDN Reference](https://developer.mozilla.org/docs/Web/API/HTMLElement/drop_event)

#### Inherited from

`Document.ondrop`

***

### ondurationchange

> **ondurationchange**: (`this`, `ev`) => `any` \| `null`

Defined in: node\_modules/.pnpm/typescript@5.9.3/node\_modules/typescript/lib/lib.dom.d.ts:12803

[MDN Reference](https://developer.mozilla.org/docs/Web/API/HTMLMediaElement/durationchange_event)

#### Inherited from

`Document.ondurationchange`

***

### onemptied

> **onemptied**: (`this`, `ev`) => `any` \| `null`

Defined in: node\_modules/.pnpm/typescript@5.9.3/node\_modules/typescript/lib/lib.dom.d.ts:12805

[MDN Reference](https://developer.mozilla.org/docs/Web/API/HTMLMediaElement/emptied_event)

#### Inherited from

`Document.onemptied`

***

### onended

> **onended**: (`this`, `ev`) => `any` \| `null`

Defined in: node\_modules/.pnpm/typescript@5.9.3/node\_modules/typescript/lib/lib.dom.d.ts:12807

[MDN Reference](https://developer.mozilla.org/docs/Web/API/HTMLMediaElement/ended_event)

#### Inherited from

`Document.onended`

***

### onerror

> **onerror**: `OnErrorEventHandler`

Defined in: node\_modules/.pnpm/typescript@5.9.3/node\_modules/typescript/lib/lib.dom.d.ts:12809

[MDN Reference](https://developer.mozilla.org/docs/Web/API/HTMLElement/error_event)

#### Inherited from

`Document.onerror`

***

### onfocus

> **onfocus**: (`this`, `ev`) => `any` \| `null`

Defined in: node\_modules/.pnpm/typescript@5.9.3/node\_modules/typescript/lib/lib.dom.d.ts:12811

[MDN Reference](https://developer.mozilla.org/docs/Web/API/Element/focus_event)

#### Inherited from

`Document.onfocus`

***

### onformdata

> **onformdata**: (`this`, `ev`) => `any` \| `null`

Defined in: node\_modules/.pnpm/typescript@5.9.3/node\_modules/typescript/lib/lib.dom.d.ts:12813

[MDN Reference](https://developer.mozilla.org/docs/Web/API/HTMLFormElement/formdata_event)

#### Inherited from

`Document.onformdata`

***

### onfullscreenchange

> **onfullscreenchange**: (`this`, `ev`) => `any` \| `null`

Defined in: node\_modules/.pnpm/typescript@5.9.3/node\_modules/typescript/lib/lib.dom.d.ts:9989

[MDN Reference](https://developer.mozilla.org/docs/Web/API/Document/fullscreenchange_event)

#### Inherited from

`Document.onfullscreenchange`

***

### onfullscreenerror

> **onfullscreenerror**: (`this`, `ev`) => `any` \| `null`

Defined in: node\_modules/.pnpm/typescript@5.9.3/node\_modules/typescript/lib/lib.dom.d.ts:9991

[MDN Reference](https://developer.mozilla.org/docs/Web/API/Document/fullscreenerror_event)

#### Inherited from

`Document.onfullscreenerror`

***

### ongotpointercapture

> **ongotpointercapture**: (`this`, `ev`) => `any` \| `null`

Defined in: node\_modules/.pnpm/typescript@5.9.3/node\_modules/typescript/lib/lib.dom.d.ts:12815

[MDN Reference](https://developer.mozilla.org/docs/Web/API/Element/gotpointercapture_event)

#### Inherited from

`Document.ongotpointercapture`

***

### oninput

> **oninput**: (`this`, `ev`) => `any` \| `null`

Defined in: node\_modules/.pnpm/typescript@5.9.3/node\_modules/typescript/lib/lib.dom.d.ts:12817

[MDN Reference](https://developer.mozilla.org/docs/Web/API/Element/input_event)

#### Inherited from

`Document.oninput`

***

### oninvalid

> **oninvalid**: (`this`, `ev`) => `any` \| `null`

Defined in: node\_modules/.pnpm/typescript@5.9.3/node\_modules/typescript/lib/lib.dom.d.ts:12819

[MDN Reference](https://developer.mozilla.org/docs/Web/API/HTMLInputElement/invalid_event)

#### Inherited from

`Document.oninvalid`

***

### onkeydown

> **onkeydown**: (`this`, `ev`) => `any` \| `null`

Defined in: node\_modules/.pnpm/typescript@5.9.3/node\_modules/typescript/lib/lib.dom.d.ts:12821

[MDN Reference](https://developer.mozilla.org/docs/Web/API/Element/keydown_event)

#### Inherited from

`Document.onkeydown`

***

### ~~onkeypress~~

> **onkeypress**: (`this`, `ev`) => `any` \| `null`

Defined in: node\_modules/.pnpm/typescript@5.9.3/node\_modules/typescript/lib/lib.dom.d.ts:12827

#### Deprecated

[MDN Reference](https://developer.mozilla.org/docs/Web/API/Element/keypress_event)

#### Inherited from

`Document.onkeypress`

***

### onkeyup

> **onkeyup**: (`this`, `ev`) => `any` \| `null`

Defined in: node\_modules/.pnpm/typescript@5.9.3/node\_modules/typescript/lib/lib.dom.d.ts:12829

[MDN Reference](https://developer.mozilla.org/docs/Web/API/Element/keyup_event)

#### Inherited from

`Document.onkeyup`

***

### onload

> **onload**: (`this`, `ev`) => `any` \| `null`

Defined in: node\_modules/.pnpm/typescript@5.9.3/node\_modules/typescript/lib/lib.dom.d.ts:12831

[MDN Reference](https://developer.mozilla.org/docs/Web/API/HTMLElement/load_event)

#### Inherited from

`Document.onload`

***

### onloadeddata

> **onloadeddata**: (`this`, `ev`) => `any` \| `null`

Defined in: node\_modules/.pnpm/typescript@5.9.3/node\_modules/typescript/lib/lib.dom.d.ts:12833

[MDN Reference](https://developer.mozilla.org/docs/Web/API/HTMLMediaElement/loadeddata_event)

#### Inherited from

`Document.onloadeddata`

***

### onloadedmetadata

> **onloadedmetadata**: (`this`, `ev`) => `any` \| `null`

Defined in: node\_modules/.pnpm/typescript@5.9.3/node\_modules/typescript/lib/lib.dom.d.ts:12835

[MDN Reference](https://developer.mozilla.org/docs/Web/API/HTMLMediaElement/loadedmetadata_event)

#### Inherited from

`Document.onloadedmetadata`

***

### onloadstart

> **onloadstart**: (`this`, `ev`) => `any` \| `null`

Defined in: node\_modules/.pnpm/typescript@5.9.3/node\_modules/typescript/lib/lib.dom.d.ts:12837

[MDN Reference](https://developer.mozilla.org/docs/Web/API/HTMLMediaElement/loadstart_event)

#### Inherited from

`Document.onloadstart`

***

### onlostpointercapture

> **onlostpointercapture**: (`this`, `ev`) => `any` \| `null`

Defined in: node\_modules/.pnpm/typescript@5.9.3/node\_modules/typescript/lib/lib.dom.d.ts:12839

[MDN Reference](https://developer.mozilla.org/docs/Web/API/Element/lostpointercapture_event)

#### Inherited from

`Document.onlostpointercapture`

***

### onmousedown

> **onmousedown**: (`this`, `ev`) => `any` \| `null`

Defined in: node\_modules/.pnpm/typescript@5.9.3/node\_modules/typescript/lib/lib.dom.d.ts:12841

[MDN Reference](https://developer.mozilla.org/docs/Web/API/Element/mousedown_event)

#### Inherited from

`Document.onmousedown`

***

### onmouseenter

> **onmouseenter**: (`this`, `ev`) => `any` \| `null`

Defined in: node\_modules/.pnpm/typescript@5.9.3/node\_modules/typescript/lib/lib.dom.d.ts:12843

[MDN Reference](https://developer.mozilla.org/docs/Web/API/Element/mouseenter_event)

#### Inherited from

`Document.onmouseenter`

***

### onmouseleave

> **onmouseleave**: (`this`, `ev`) => `any` \| `null`

Defined in: node\_modules/.pnpm/typescript@5.9.3/node\_modules/typescript/lib/lib.dom.d.ts:12845

[MDN Reference](https://developer.mozilla.org/docs/Web/API/Element/mouseleave_event)

#### Inherited from

`Document.onmouseleave`

***

### onmousemove

> **onmousemove**: (`this`, `ev`) => `any` \| `null`

Defined in: node\_modules/.pnpm/typescript@5.9.3/node\_modules/typescript/lib/lib.dom.d.ts:12847

[MDN Reference](https://developer.mozilla.org/docs/Web/API/Element/mousemove_event)

#### Inherited from

`Document.onmousemove`

***

### onmouseout

> **onmouseout**: (`this`, `ev`) => `any` \| `null`

Defined in: node\_modules/.pnpm/typescript@5.9.3/node\_modules/typescript/lib/lib.dom.d.ts:12849

[MDN Reference](https://developer.mozilla.org/docs/Web/API/Element/mouseout_event)

#### Inherited from

`Document.onmouseout`

***

### onmouseover

> **onmouseover**: (`this`, `ev`) => `any` \| `null`

Defined in: node\_modules/.pnpm/typescript@5.9.3/node\_modules/typescript/lib/lib.dom.d.ts:12851

[MDN Reference](https://developer.mozilla.org/docs/Web/API/Element/mouseover_event)

#### Inherited from

`Document.onmouseover`

***

### onmouseup

> **onmouseup**: (`this`, `ev`) => `any` \| `null`

Defined in: node\_modules/.pnpm/typescript@5.9.3/node\_modules/typescript/lib/lib.dom.d.ts:12853

[MDN Reference](https://developer.mozilla.org/docs/Web/API/Element/mouseup_event)

#### Inherited from

`Document.onmouseup`

***

### onpaste

> **onpaste**: (`this`, `ev`) => `any` \| `null`

Defined in: node\_modules/.pnpm/typescript@5.9.3/node\_modules/typescript/lib/lib.dom.d.ts:12855

[MDN Reference](https://developer.mozilla.org/docs/Web/API/Element/paste_event)

#### Inherited from

`Document.onpaste`

***

### onpause

> **onpause**: (`this`, `ev`) => `any` \| `null`

Defined in: node\_modules/.pnpm/typescript@5.9.3/node\_modules/typescript/lib/lib.dom.d.ts:12857

[MDN Reference](https://developer.mozilla.org/docs/Web/API/HTMLMediaElement/pause_event)

#### Inherited from

`Document.onpause`

***

### onplay

> **onplay**: (`this`, `ev`) => `any` \| `null`

Defined in: node\_modules/.pnpm/typescript@5.9.3/node\_modules/typescript/lib/lib.dom.d.ts:12859

[MDN Reference](https://developer.mozilla.org/docs/Web/API/HTMLMediaElement/play_event)

#### Inherited from

`Document.onplay`

***

### onplaying

> **onplaying**: (`this`, `ev`) => `any` \| `null`

Defined in: node\_modules/.pnpm/typescript@5.9.3/node\_modules/typescript/lib/lib.dom.d.ts:12861

[MDN Reference](https://developer.mozilla.org/docs/Web/API/HTMLMediaElement/playing_event)

#### Inherited from

`Document.onplaying`

***

### onpointercancel

> **onpointercancel**: (`this`, `ev`) => `any` \| `null`

Defined in: node\_modules/.pnpm/typescript@5.9.3/node\_modules/typescript/lib/lib.dom.d.ts:12863

[MDN Reference](https://developer.mozilla.org/docs/Web/API/Element/pointercancel_event)

#### Inherited from

`Document.onpointercancel`

***

### onpointerdown

> **onpointerdown**: (`this`, `ev`) => `any` \| `null`

Defined in: node\_modules/.pnpm/typescript@5.9.3/node\_modules/typescript/lib/lib.dom.d.ts:12865

[MDN Reference](https://developer.mozilla.org/docs/Web/API/Element/pointerdown_event)

#### Inherited from

`Document.onpointerdown`

***

### onpointerenter

> **onpointerenter**: (`this`, `ev`) => `any` \| `null`

Defined in: node\_modules/.pnpm/typescript@5.9.3/node\_modules/typescript/lib/lib.dom.d.ts:12867

[MDN Reference](https://developer.mozilla.org/docs/Web/API/Element/pointerenter_event)

#### Inherited from

`Document.onpointerenter`

***

### onpointerleave

> **onpointerleave**: (`this`, `ev`) => `any` \| `null`

Defined in: node\_modules/.pnpm/typescript@5.9.3/node\_modules/typescript/lib/lib.dom.d.ts:12869

[MDN Reference](https://developer.mozilla.org/docs/Web/API/Element/pointerleave_event)

#### Inherited from

`Document.onpointerleave`

***

### onpointerlockchange

> **onpointerlockchange**: (`this`, `ev`) => `any` \| `null`

Defined in: node\_modules/.pnpm/typescript@5.9.3/node\_modules/typescript/lib/lib.dom.d.ts:9993

[MDN Reference](https://developer.mozilla.org/docs/Web/API/Document/pointerlockchange_event)

#### Inherited from

`Document.onpointerlockchange`

***

### onpointerlockerror

> **onpointerlockerror**: (`this`, `ev`) => `any` \| `null`

Defined in: node\_modules/.pnpm/typescript@5.9.3/node\_modules/typescript/lib/lib.dom.d.ts:9995

[MDN Reference](https://developer.mozilla.org/docs/Web/API/Document/pointerlockerror_event)

#### Inherited from

`Document.onpointerlockerror`

***

### onpointermove

> **onpointermove**: (`this`, `ev`) => `any` \| `null`

Defined in: node\_modules/.pnpm/typescript@5.9.3/node\_modules/typescript/lib/lib.dom.d.ts:12871

[MDN Reference](https://developer.mozilla.org/docs/Web/API/Element/pointermove_event)

#### Inherited from

`Document.onpointermove`

***

### onpointerout

> **onpointerout**: (`this`, `ev`) => `any` \| `null`

Defined in: node\_modules/.pnpm/typescript@5.9.3/node\_modules/typescript/lib/lib.dom.d.ts:12873

[MDN Reference](https://developer.mozilla.org/docs/Web/API/Element/pointerout_event)

#### Inherited from

`Document.onpointerout`

***

### onpointerover

> **onpointerover**: (`this`, `ev`) => `any` \| `null`

Defined in: node\_modules/.pnpm/typescript@5.9.3/node\_modules/typescript/lib/lib.dom.d.ts:12875

[MDN Reference](https://developer.mozilla.org/docs/Web/API/Element/pointerover_event)

#### Inherited from

`Document.onpointerover`

***

### onpointerrawupdate

> **onpointerrawupdate**: (`this`, `ev`) => `any` \| `null`

Defined in: node\_modules/.pnpm/typescript@5.9.3/node\_modules/typescript/lib/lib.dom.d.ts:12881

Available only in secure contexts.

[MDN Reference](https://developer.mozilla.org/docs/Web/API/Element/pointerrawupdate_event)

#### Inherited from

`Document.onpointerrawupdate`

***

### onpointerup

> **onpointerup**: (`this`, `ev`) => `any` \| `null`

Defined in: node\_modules/.pnpm/typescript@5.9.3/node\_modules/typescript/lib/lib.dom.d.ts:12883

[MDN Reference](https://developer.mozilla.org/docs/Web/API/Element/pointerup_event)

#### Inherited from

`Document.onpointerup`

***

### onprogress

> **onprogress**: (`this`, `ev`) => `any` \| `null`

Defined in: node\_modules/.pnpm/typescript@5.9.3/node\_modules/typescript/lib/lib.dom.d.ts:12885

[MDN Reference](https://developer.mozilla.org/docs/Web/API/HTMLMediaElement/progress_event)

#### Inherited from

`Document.onprogress`

***

### onratechange

> **onratechange**: (`this`, `ev`) => `any` \| `null`

Defined in: node\_modules/.pnpm/typescript@5.9.3/node\_modules/typescript/lib/lib.dom.d.ts:12887

[MDN Reference](https://developer.mozilla.org/docs/Web/API/HTMLMediaElement/ratechange_event)

#### Inherited from

`Document.onratechange`

***

### onreadystatechange

> **onreadystatechange**: (`this`, `ev`) => `any` \| `null`

Defined in: node\_modules/.pnpm/typescript@5.9.3/node\_modules/typescript/lib/lib.dom.d.ts:9997

[MDN Reference](https://developer.mozilla.org/docs/Web/API/Document/readystatechange_event)

#### Inherited from

`Document.onreadystatechange`

***

### onreset

> **onreset**: (`this`, `ev`) => `any` \| `null`

Defined in: node\_modules/.pnpm/typescript@5.9.3/node\_modules/typescript/lib/lib.dom.d.ts:12889

[MDN Reference](https://developer.mozilla.org/docs/Web/API/HTMLFormElement/reset_event)

#### Inherited from

`Document.onreset`

***

### onresize

> **onresize**: (`this`, `ev`) => `any` \| `null`

Defined in: node\_modules/.pnpm/typescript@5.9.3/node\_modules/typescript/lib/lib.dom.d.ts:12891

[MDN Reference](https://developer.mozilla.org/docs/Web/API/HTMLVideoElement/resize_event)

#### Inherited from

`Document.onresize`

***

### onscroll

> **onscroll**: (`this`, `ev`) => `any` \| `null`

Defined in: node\_modules/.pnpm/typescript@5.9.3/node\_modules/typescript/lib/lib.dom.d.ts:12893

[MDN Reference](https://developer.mozilla.org/docs/Web/API/Document/scroll_event)

#### Inherited from

`Document.onscroll`

***

### onscrollend

> **onscrollend**: (`this`, `ev`) => `any` \| `null`

Defined in: node\_modules/.pnpm/typescript@5.9.3/node\_modules/typescript/lib/lib.dom.d.ts:12895

[MDN Reference](https://developer.mozilla.org/docs/Web/API/Document/scrollend_event)

#### Inherited from

`Document.onscrollend`

***

### onsecuritypolicyviolation

> **onsecuritypolicyviolation**: (`this`, `ev`) => `any` \| `null`

Defined in: node\_modules/.pnpm/typescript@5.9.3/node\_modules/typescript/lib/lib.dom.d.ts:12897

[MDN Reference](https://developer.mozilla.org/docs/Web/API/Document/securitypolicyviolation_event)

#### Inherited from

`Document.onsecuritypolicyviolation`

***

### onseeked

> **onseeked**: (`this`, `ev`) => `any` \| `null`

Defined in: node\_modules/.pnpm/typescript@5.9.3/node\_modules/typescript/lib/lib.dom.d.ts:12899

[MDN Reference](https://developer.mozilla.org/docs/Web/API/HTMLMediaElement/seeked_event)

#### Inherited from

`Document.onseeked`

***

### onseeking

> **onseeking**: (`this`, `ev`) => `any` \| `null`

Defined in: node\_modules/.pnpm/typescript@5.9.3/node\_modules/typescript/lib/lib.dom.d.ts:12901

[MDN Reference](https://developer.mozilla.org/docs/Web/API/HTMLMediaElement/seeking_event)

#### Inherited from

`Document.onseeking`

***

### onselect

> **onselect**: (`this`, `ev`) => `any` \| `null`

Defined in: node\_modules/.pnpm/typescript@5.9.3/node\_modules/typescript/lib/lib.dom.d.ts:12903

[MDN Reference](https://developer.mozilla.org/docs/Web/API/HTMLInputElement/select_event)

#### Inherited from

`Document.onselect`

***

### onselectionchange

> **onselectionchange**: (`this`, `ev`) => `any` \| `null`

Defined in: node\_modules/.pnpm/typescript@5.9.3/node\_modules/typescript/lib/lib.dom.d.ts:12905

[MDN Reference](https://developer.mozilla.org/docs/Web/API/Document/selectionchange_event)

#### Inherited from

`Document.onselectionchange`

***

### onselectstart

> **onselectstart**: (`this`, `ev`) => `any` \| `null`

Defined in: node\_modules/.pnpm/typescript@5.9.3/node\_modules/typescript/lib/lib.dom.d.ts:12907

[MDN Reference](https://developer.mozilla.org/docs/Web/API/Node/selectstart_event)

#### Inherited from

`Document.onselectstart`

***

### onslotchange

> **onslotchange**: (`this`, `ev`) => `any` \| `null`

Defined in: node\_modules/.pnpm/typescript@5.9.3/node\_modules/typescript/lib/lib.dom.d.ts:12909

[MDN Reference](https://developer.mozilla.org/docs/Web/API/HTMLSlotElement/slotchange_event)

#### Inherited from

`Document.onslotchange`

***

### onstalled

> **onstalled**: (`this`, `ev`) => `any` \| `null`

Defined in: node\_modules/.pnpm/typescript@5.9.3/node\_modules/typescript/lib/lib.dom.d.ts:12911

[MDN Reference](https://developer.mozilla.org/docs/Web/API/HTMLMediaElement/stalled_event)

#### Inherited from

`Document.onstalled`

***

### onsubmit

> **onsubmit**: (`this`, `ev`) => `any` \| `null`

Defined in: node\_modules/.pnpm/typescript@5.9.3/node\_modules/typescript/lib/lib.dom.d.ts:12913

[MDN Reference](https://developer.mozilla.org/docs/Web/API/HTMLFormElement/submit_event)

#### Inherited from

`Document.onsubmit`

***

### onsuspend

> **onsuspend**: (`this`, `ev`) => `any` \| `null`

Defined in: node\_modules/.pnpm/typescript@5.9.3/node\_modules/typescript/lib/lib.dom.d.ts:12915

[MDN Reference](https://developer.mozilla.org/docs/Web/API/HTMLMediaElement/suspend_event)

#### Inherited from

`Document.onsuspend`

***

### ontimeupdate

> **ontimeupdate**: (`this`, `ev`) => `any` \| `null`

Defined in: node\_modules/.pnpm/typescript@5.9.3/node\_modules/typescript/lib/lib.dom.d.ts:12917

[MDN Reference](https://developer.mozilla.org/docs/Web/API/HTMLMediaElement/timeupdate_event)

#### Inherited from

`Document.ontimeupdate`

***

### ontoggle

> **ontoggle**: (`this`, `ev`) => `any` \| `null`

Defined in: node\_modules/.pnpm/typescript@5.9.3/node\_modules/typescript/lib/lib.dom.d.ts:12919

[MDN Reference](https://developer.mozilla.org/docs/Web/API/HTMLElement/toggle_event)

#### Inherited from

`Document.ontoggle`

***

### ontouchcancel?

> `optional` **ontouchcancel**: (`this`, `ev`) => `any` \| `null`

Defined in: node\_modules/.pnpm/typescript@5.9.3/node\_modules/typescript/lib/lib.dom.d.ts:12921

[MDN Reference](https://developer.mozilla.org/docs/Web/API/Element/touchcancel_event)

#### Inherited from

`Document.ontouchcancel`

***

### ontouchend?

> `optional` **ontouchend**: (`this`, `ev`) => `any` \| `null`

Defined in: node\_modules/.pnpm/typescript@5.9.3/node\_modules/typescript/lib/lib.dom.d.ts:12923

[MDN Reference](https://developer.mozilla.org/docs/Web/API/Element/touchend_event)

#### Inherited from

`Document.ontouchend`

***

### ontouchmove?

> `optional` **ontouchmove**: (`this`, `ev`) => `any` \| `null`

Defined in: node\_modules/.pnpm/typescript@5.9.3/node\_modules/typescript/lib/lib.dom.d.ts:12925

[MDN Reference](https://developer.mozilla.org/docs/Web/API/Element/touchmove_event)

#### Inherited from

`Document.ontouchmove`

***

### ontouchstart?

> `optional` **ontouchstart**: (`this`, `ev`) => `any` \| `null`

Defined in: node\_modules/.pnpm/typescript@5.9.3/node\_modules/typescript/lib/lib.dom.d.ts:12927

[MDN Reference](https://developer.mozilla.org/docs/Web/API/Element/touchstart_event)

#### Inherited from

`Document.ontouchstart`

***

### ontransitioncancel

> **ontransitioncancel**: (`this`, `ev`) => `any` \| `null`

Defined in: node\_modules/.pnpm/typescript@5.9.3/node\_modules/typescript/lib/lib.dom.d.ts:12929

[MDN Reference](https://developer.mozilla.org/docs/Web/API/Element/transitioncancel_event)

#### Inherited from

`Document.ontransitioncancel`

***

### ontransitionend

> **ontransitionend**: (`this`, `ev`) => `any` \| `null`

Defined in: node\_modules/.pnpm/typescript@5.9.3/node\_modules/typescript/lib/lib.dom.d.ts:12931

[MDN Reference](https://developer.mozilla.org/docs/Web/API/Element/transitionend_event)

#### Inherited from

`Document.ontransitionend`

***

### ontransitionrun

> **ontransitionrun**: (`this`, `ev`) => `any` \| `null`

Defined in: node\_modules/.pnpm/typescript@5.9.3/node\_modules/typescript/lib/lib.dom.d.ts:12933

[MDN Reference](https://developer.mozilla.org/docs/Web/API/Element/transitionrun_event)

#### Inherited from

`Document.ontransitionrun`

***

### ontransitionstart

> **ontransitionstart**: (`this`, `ev`) => `any` \| `null`

Defined in: node\_modules/.pnpm/typescript@5.9.3/node\_modules/typescript/lib/lib.dom.d.ts:12935

[MDN Reference](https://developer.mozilla.org/docs/Web/API/Element/transitionstart_event)

#### Inherited from

`Document.ontransitionstart`

***

### onvisibilitychange

> **onvisibilitychange**: (`this`, `ev`) => `any` \| `null`

Defined in: node\_modules/.pnpm/typescript@5.9.3/node\_modules/typescript/lib/lib.dom.d.ts:9999

[MDN Reference](https://developer.mozilla.org/docs/Web/API/Document/visibilitychange_event)

#### Inherited from

`Document.onvisibilitychange`

***

### onvolumechange

> **onvolumechange**: (`this`, `ev`) => `any` \| `null`

Defined in: node\_modules/.pnpm/typescript@5.9.3/node\_modules/typescript/lib/lib.dom.d.ts:12937

[MDN Reference](https://developer.mozilla.org/docs/Web/API/HTMLMediaElement/volumechange_event)

#### Inherited from

`Document.onvolumechange`

***

### onwaiting

> **onwaiting**: (`this`, `ev`) => `any` \| `null`

Defined in: node\_modules/.pnpm/typescript@5.9.3/node\_modules/typescript/lib/lib.dom.d.ts:12939

[MDN Reference](https://developer.mozilla.org/docs/Web/API/HTMLMediaElement/waiting_event)

#### Inherited from

`Document.onwaiting`

***

### ~~onwebkitanimationend~~

> **onwebkitanimationend**: (`this`, `ev`) => `any` \| `null`

Defined in: node\_modules/.pnpm/typescript@5.9.3/node\_modules/typescript/lib/lib.dom.d.ts:12945

#### Deprecated

This is a legacy alias of `onanimationend`.

[MDN Reference](https://developer.mozilla.org/docs/Web/API/Element/animationend_event)

#### Inherited from

`Document.onwebkitanimationend`

***

### ~~onwebkitanimationiteration~~

> **onwebkitanimationiteration**: (`this`, `ev`) => `any` \| `null`

Defined in: node\_modules/.pnpm/typescript@5.9.3/node\_modules/typescript/lib/lib.dom.d.ts:12951

#### Deprecated

This is a legacy alias of `onanimationiteration`.

[MDN Reference](https://developer.mozilla.org/docs/Web/API/Element/animationiteration_event)

#### Inherited from

`Document.onwebkitanimationiteration`

***

### ~~onwebkitanimationstart~~

> **onwebkitanimationstart**: (`this`, `ev`) => `any` \| `null`

Defined in: node\_modules/.pnpm/typescript@5.9.3/node\_modules/typescript/lib/lib.dom.d.ts:12957

#### Deprecated

This is a legacy alias of `onanimationstart`.

[MDN Reference](https://developer.mozilla.org/docs/Web/API/Element/animationstart_event)

#### Inherited from

`Document.onwebkitanimationstart`

***

### ~~onwebkittransitionend~~

> **onwebkittransitionend**: (`this`, `ev`) => `any` \| `null`

Defined in: node\_modules/.pnpm/typescript@5.9.3/node\_modules/typescript/lib/lib.dom.d.ts:12963

#### Deprecated

This is a legacy alias of `ontransitionend`.

[MDN Reference](https://developer.mozilla.org/docs/Web/API/Element/transitionend_event)

#### Inherited from

`Document.onwebkittransitionend`

***

### onwheel

> **onwheel**: (`this`, `ev`) => `any` \| `null`

Defined in: node\_modules/.pnpm/typescript@5.9.3/node\_modules/typescript/lib/lib.dom.d.ts:12965

[MDN Reference](https://developer.mozilla.org/docs/Web/API/Element/wheel_event)

#### Inherited from

`Document.onwheel`

***

### ownerDocument

> `readonly` **ownerDocument**: `null`

Defined in: node\_modules/.pnpm/typescript@5.9.3/node\_modules/typescript/lib/lib.dom.d.ts:10000

The read-only **`ownerDocument`** property of the Node interface returns the top-level document object of the node.

[MDN Reference](https://developer.mozilla.org/docs/Web/API/Node/ownerDocument)

#### Inherited from

`Document.ownerDocument`

***

### parentElement

> `readonly` **parentElement**: `HTMLElement` \| `null`

Defined in: node\_modules/.pnpm/typescript@5.9.3/node\_modules/typescript/lib/lib.dom.d.ts:21724

The read-only **`parentElement`** property of Node interface returns the DOM node's parent Element, or `null` if the node either has no parent, or its parent isn't a DOM Element.

[MDN Reference](https://developer.mozilla.org/docs/Web/API/Node/parentElement)

#### Inherited from

`Document.parentElement`

***

### parentNode

> `readonly` **parentNode**: `ParentNode` \| `null`

Defined in: node\_modules/.pnpm/typescript@5.9.3/node\_modules/typescript/lib/lib.dom.d.ts:21730

The read-only **`parentNode`** property of the Node interface returns the parent of the specified node in the DOM tree.

[MDN Reference](https://developer.mozilla.org/docs/Web/API/Node/parentNode)

#### Inherited from

`Document.parentNode`

***

### pictureInPictureElement

> `readonly` **pictureInPictureElement**: `Element` \| `null`

Defined in: node\_modules/.pnpm/typescript@5.9.3/node\_modules/typescript/lib/lib.dom.d.ts:10449

[MDN Reference](https://developer.mozilla.org/docs/Web/API/Document/pictureInPictureElement)

#### Inherited from

`Document.pictureInPictureElement`

***

### pictureInPictureEnabled

> `readonly` **pictureInPictureEnabled**: `boolean`

Defined in: node\_modules/.pnpm/typescript@5.9.3/node\_modules/typescript/lib/lib.dom.d.ts:10006

The read-only **`pictureInPictureEnabled`** property of the available.

[MDN Reference](https://developer.mozilla.org/docs/Web/API/Document/pictureInPictureEnabled)

#### Inherited from

`Document.pictureInPictureEnabled`

***

### plugins

> `readonly` **plugins**: `HTMLCollectionOf`\<`HTMLEmbedElement`\>

Defined in: node\_modules/.pnpm/typescript@5.9.3/node\_modules/typescript/lib/lib.dom.d.ts:10012

The **`plugins`** read-only property of the containing one or more HTMLEmbedElements representing the An HTMLCollection.

[MDN Reference](https://developer.mozilla.org/docs/Web/API/Document/plugins)

#### Inherited from

`Document.plugins`

***

### pointerLockElement

> `readonly` **pointerLockElement**: `Element` \| `null`

Defined in: node\_modules/.pnpm/typescript@5.9.3/node\_modules/typescript/lib/lib.dom.d.ts:10451

[MDN Reference](https://developer.mozilla.org/docs/Web/API/Document/pointerLockElement)

#### Inherited from

`Document.pointerLockElement`

***

### previousSibling

> `readonly` **previousSibling**: `ChildNode` \| `null`

Defined in: node\_modules/.pnpm/typescript@5.9.3/node\_modules/typescript/lib/lib.dom.d.ts:21736

The read-only **`previousSibling`** property of the Node interface returns the node immediately preceding the specified one in its parent's or `null` if the specified node is the first in that list.

[MDN Reference](https://developer.mozilla.org/docs/Web/API/Node/previousSibling)

#### Inherited from

`Document.previousSibling`

***

### PROCESSING\_INSTRUCTION\_NODE

> `readonly` **PROCESSING\_INSTRUCTION\_NODE**: `7`

Defined in: node\_modules/.pnpm/typescript@5.9.3/node\_modules/typescript/lib/lib.dom.d.ts:21843

node is a ProcessingInstruction node.

#### Inherited from

`Document.PROCESSING_INSTRUCTION_NODE`

***

### readyState

> `readonly` **readyState**: `DocumentReadyState`

Defined in: node\_modules/.pnpm/typescript@5.9.3/node\_modules/typescript/lib/lib.dom.d.ts:10018

The **`Document.readyState`** property describes the loading state of the document.

[MDN Reference](https://developer.mozilla.org/docs/Web/API/Document/readyState)

#### Inherited from

`Document.readyState`

***

### referrer

> `readonly` **referrer**: `string`

Defined in: node\_modules/.pnpm/typescript@5.9.3/node\_modules/typescript/lib/lib.dom.d.ts:10024

The **`Document.referrer`** property returns the URI of the page that linked to this page.

[MDN Reference](https://developer.mozilla.org/docs/Web/API/Document/referrer)

#### Inherited from

`Document.referrer`

***

### ~~rootElement~~

> `readonly` **rootElement**: `SVGSVGElement` \| `null`

Defined in: node\_modules/.pnpm/typescript@5.9.3/node\_modules/typescript/lib/lib.dom.d.ts:10031

**`Document.rootElement`** returns the Element that is the root element of the document if it is an documents.

#### Deprecated

[MDN Reference](https://developer.mozilla.org/docs/Web/API/Document/rootElement)

#### Inherited from

`Document.rootElement`

***

### scripts

> `readonly` **scripts**: `HTMLCollectionOf`\<`HTMLScriptElement`\>

Defined in: node\_modules/.pnpm/typescript@5.9.3/node\_modules/typescript/lib/lib.dom.d.ts:10037

The **`scripts`** property of the Document interface returns a list of the script elements in the document.

[MDN Reference](https://developer.mozilla.org/docs/Web/API/Document/scripts)

#### Inherited from

`Document.scripts`

***

### scrollingElement

> `readonly` **scrollingElement**: `Element` \| `null`

Defined in: node\_modules/.pnpm/typescript@5.9.3/node\_modules/typescript/lib/lib.dom.d.ts:10043

The **`scrollingElement`** read-only property of the scrolls the document.

[MDN Reference](https://developer.mozilla.org/docs/Web/API/Document/scrollingElement)

#### Inherited from

`Document.scrollingElement`

***

### styleSheets

> `readonly` **styleSheets**: `StyleSheetList`

Defined in: node\_modules/.pnpm/typescript@5.9.3/node\_modules/typescript/lib/lib.dom.d.ts:10453

[MDN Reference](https://developer.mozilla.org/docs/Web/API/Document/styleSheets)

#### Inherited from

`Document.styleSheets`

***

### TEXT\_NODE

> `readonly` **TEXT\_NODE**: `3`

Defined in: node\_modules/.pnpm/typescript@5.9.3/node\_modules/typescript/lib/lib.dom.d.ts:21837

node is a Text node.

#### Inherited from

`Document.TEXT_NODE`

***

### timeline

> `readonly` **timeline**: `DocumentTimeline`

Defined in: node\_modules/.pnpm/typescript@5.9.3/node\_modules/typescript/lib/lib.dom.d.ts:10049

The `timeline` readonly property of the Document interface represents the default timeline of the current document.

[MDN Reference](https://developer.mozilla.org/docs/Web/API/Document/timeline)

#### Inherited from

`Document.timeline`

***

### title

> **title**: `string`

Defined in: node\_modules/.pnpm/typescript@5.9.3/node\_modules/typescript/lib/lib.dom.d.ts:10055

The **`document.title`** property gets or sets the current title of the document.

[MDN Reference](https://developer.mozilla.org/docs/Web/API/Document/title)

#### Inherited from

`Document.title`

***

### URL

> `readonly` **URL**: `string`

Defined in: node\_modules/.pnpm/typescript@5.9.3/node\_modules/typescript/lib/lib.dom.d.ts:9773

The **`URL`** read-only property of the Document interface returns the document location as a string.

[MDN Reference](https://developer.mozilla.org/docs/Web/API/Document/URL)

#### Inherited from

`Document.URL`

***

### visibilityState

> `readonly` **visibilityState**: `DocumentVisibilityState`

Defined in: node\_modules/.pnpm/typescript@5.9.3/node\_modules/typescript/lib/lib.dom.d.ts:10061

The **`Document.visibilityState`** read-only property returns the visibility of the document.

[MDN Reference](https://developer.mozilla.org/docs/Web/API/Document/visibilityState)

#### Inherited from

`Document.visibilityState`

***

### ~~vlinkColor~~

> **vlinkColor**: `string`

Defined in: node\_modules/.pnpm/typescript@5.9.3/node\_modules/typescript/lib/lib.dom.d.ts:10068

The **`Document.vlinkColor`** property gets/sets the color of links that the user has visited in the document.

#### Deprecated

[MDN Reference](https://developer.mozilla.org/docs/Web/API/Document/vlinkColor)

#### Inherited from

`Document.vlinkColor`

## Accessors

### location

#### Get Signature

> **get** **location**(): `Location`

Defined in: node\_modules/.pnpm/typescript@5.9.3/node\_modules/typescript/lib/lib.dom.d.ts:9986

The **`Document.location`** read-only property returns a and provides methods for changing that URL and loading another URL.

[MDN Reference](https://developer.mozilla.org/docs/Web/API/Document/location)

##### Returns

`Location`

#### Set Signature

> **set** **location**(`href`): `void`

Defined in: node\_modules/.pnpm/typescript@5.9.3/node\_modules/typescript/lib/lib.dom.d.ts:9987

##### Parameters

###### href

`string`

##### Returns

`void`

#### Inherited from

`Document.location`

***

### textContent

#### Get Signature

> **get** **textContent**(): `null`

Defined in: node\_modules/.pnpm/typescript@5.9.3/node\_modules/typescript/lib/lib.dom.d.ts:10393

[MDN Reference](https://developer.mozilla.org/en-US/docs/Web/API/Node/textContent)

##### Returns

`null`

#### Inherited from

`Document.textContent`

## Methods

### addEventListener()

#### Call Signature

> **addEventListener**\<`K`\>(`type`, `listener`, `options?`): `void`

Defined in: node\_modules/.pnpm/typescript@5.9.3/node\_modules/typescript/lib/lib.dom.d.ts:10394

The **`addEventListener()`** method of the EventTarget interface sets up a function that will be called whenever the specified event is delivered to the target.

[MDN Reference](https://developer.mozilla.org/docs/Web/API/EventTarget/addEventListener)

##### Type Parameters

###### K

`K` *extends* keyof `DocumentEventMap`

##### Parameters

###### type

`K`

###### listener

(`this`, `ev`) => `any`

###### options?

`boolean` | `AddEventListenerOptions`

##### Returns

`void`

##### Inherited from

`Document.addEventListener`

#### Call Signature

> **addEventListener**(`type`, `listener`, `options?`): `void`

Defined in: node\_modules/.pnpm/typescript@5.9.3/node\_modules/typescript/lib/lib.dom.d.ts:10395

The **`addEventListener()`** method of the EventTarget interface sets up a function that will be called whenever the specified event is delivered to the target.

[MDN Reference](https://developer.mozilla.org/docs/Web/API/EventTarget/addEventListener)

##### Parameters

###### type

`string`

###### listener

`EventListenerOrEventListenerObject`

###### options?

`boolean` | `AddEventListenerOptions`

##### Returns

`void`

##### Inherited from

`Document.addEventListener`

***

### adoptNode()

> **adoptNode**\<`T`\>(`node`): `T`

Defined in: node\_modules/.pnpm/typescript@5.9.3/node\_modules/typescript/lib/lib.dom.d.ts:10074

**`Document.adoptNode()`** transfers a node/dom from another Document into the method's document.

[MDN Reference](https://developer.mozilla.org/docs/Web/API/Document/adoptNode)

#### Type Parameters

##### T

`T` *extends* `Node`

#### Parameters

##### node

`T`

#### Returns

`T`

#### Inherited from

`Document.adoptNode`

***

### append()

> **append**(...`nodes`): `void`

Defined in: node\_modules/.pnpm/typescript@5.9.3/node\_modules/typescript/lib/lib.dom.d.ts:22694

Inserts nodes after the last child of node, while replacing strings in nodes with equivalent Text nodes.

Throws a "HierarchyRequestError" DOMException if the constraints of the node tree are violated.

[MDN Reference](https://developer.mozilla.org/docs/Web/API/Document/append)

#### Parameters

##### nodes

...(`string` \| `Node`)[]

#### Returns

`void`

#### Inherited from

`Document.append`

***

### appendChild()

> **appendChild**\<`T`\>(`node`): `T`

Defined in: node\_modules/.pnpm/typescript@5.9.3/node\_modules/typescript/lib/lib.dom.d.ts:21748

The **`appendChild()`** method of the Node interface adds a node to the end of the list of children of a specified parent node.

[MDN Reference](https://developer.mozilla.org/docs/Web/API/Node/appendChild)

#### Type Parameters

##### T

`T` *extends* `Node`

#### Parameters

##### node

`T`

#### Returns

`T`

#### Inherited from

`Document.appendChild`

***

### ~~captureEvents()~~

> **captureEvents**(): `void`

Defined in: node\_modules/.pnpm/typescript@5.9.3/node\_modules/typescript/lib/lib.dom.d.ts:10076

#### Returns

`void`

#### Deprecated

#### Inherited from

`Document.captureEvents`

***

### caretPositionFromPoint()

> **caretPositionFromPoint**(`x`, `y`, `options?`): `CaretPosition` \| `null`

Defined in: node\_modules/.pnpm/typescript@5.9.3/node\_modules/typescript/lib/lib.dom.d.ts:10082

The **`caretPositionFromPoint()`** method of the Document interface returns a CaretPosition object, containing the DOM node, along with the caret and caret's character offset within that node.

[MDN Reference](https://developer.mozilla.org/docs/Web/API/Document/caretPositionFromPoint)

#### Parameters

##### x

`number`

##### y

`number`

##### options?

`CaretPositionFromPointOptions`

#### Returns

`CaretPosition` \| `null`

#### Inherited from

`Document.caretPositionFromPoint`

***

### ~~caretRangeFromPoint()~~

> **caretRangeFromPoint**(`x`, `y`): `Range` \| `null`

Defined in: node\_modules/.pnpm/typescript@5.9.3/node\_modules/typescript/lib/lib.dom.d.ts:10084

#### Parameters

##### x

`number`

##### y

`number`

#### Returns

`Range` \| `null`

#### Deprecated

#### Inherited from

`Document.caretRangeFromPoint`

***

### ~~clear()~~

> **clear**(): `void`

Defined in: node\_modules/.pnpm/typescript@5.9.3/node\_modules/typescript/lib/lib.dom.d.ts:10091

The **`Document.clear()`** method does nothing, but doesn't raise any error.

#### Returns

`void`

#### Deprecated

[MDN Reference](https://developer.mozilla.org/docs/Web/API/Document/clear)

#### Inherited from

`Document.clear`

***

### cloneNode()

> **cloneNode**(`subtree?`): `Node`

Defined in: node\_modules/.pnpm/typescript@5.9.3/node\_modules/typescript/lib/lib.dom.d.ts:21754

The **`cloneNode()`** method of the Node interface returns a duplicate of the node on which this method was called.

[MDN Reference](https://developer.mozilla.org/docs/Web/API/Node/cloneNode)

#### Parameters

##### subtree?

`boolean`

#### Returns

`Node`

#### Inherited from

`Document.cloneNode`

***

### close()

> **close**(): `void`

Defined in: node\_modules/.pnpm/typescript@5.9.3/node\_modules/typescript/lib/lib.dom.d.ts:10097

The **`Document.close()`** method finishes writing to a document, opened with Document.open().

[MDN Reference](https://developer.mozilla.org/docs/Web/API/Document/close)

#### Returns

`void`

#### Inherited from

`Document.close`

***

### compareDocumentPosition()

> **compareDocumentPosition**(`other`): `number`

Defined in: node\_modules/.pnpm/typescript@5.9.3/node\_modules/typescript/lib/lib.dom.d.ts:21760

The **`compareDocumentPosition()`** method of the Node interface reports the position of its argument node relative to the node on which it is called.

[MDN Reference](https://developer.mozilla.org/docs/Web/API/Node/compareDocumentPosition)

#### Parameters

##### other

`Node`

#### Returns

`number`

#### Inherited from

`Document.compareDocumentPosition`

***

### contains()

> **contains**(`other`): `boolean`

Defined in: node\_modules/.pnpm/typescript@5.9.3/node\_modules/typescript/lib/lib.dom.d.ts:21766

The **`contains()`** method of the Node interface returns a boolean value indicating whether a node is a descendant of a given node, that is the node itself, one of its direct children (Node.childNodes), one of the children's direct children, and so on.

[MDN Reference](https://developer.mozilla.org/docs/Web/API/Node/contains)

#### Parameters

##### other

`Node` | `null`

#### Returns

`boolean`

#### Inherited from

`Document.contains`

***

### createAttribute()

> **createAttribute**(`localName`): `Attr`

Defined in: node\_modules/.pnpm/typescript@5.9.3/node\_modules/typescript/lib/lib.dom.d.ts:10103

The **`Document.createAttribute()`** method creates a new attribute node, and returns it.

[MDN Reference](https://developer.mozilla.org/docs/Web/API/Document/createAttribute)

#### Parameters

##### localName

`string`

#### Returns

`Attr`

#### Inherited from

`Document.createAttribute`

***

### createAttributeNS()

> **createAttributeNS**(`namespace`, `qualifiedName`): `Attr`

Defined in: node\_modules/.pnpm/typescript@5.9.3/node\_modules/typescript/lib/lib.dom.d.ts:10109

The **`Document.createAttributeNS()`** method creates a new attribute node with the specified namespace URI and qualified name, and returns it.

[MDN Reference](https://developer.mozilla.org/docs/Web/API/Document/createAttributeNS)

#### Parameters

##### namespace

`string` | `null`

##### qualifiedName

`string`

#### Returns

`Attr`

#### Inherited from

`Document.createAttributeNS`

***

### createCDATASection()

> **createCDATASection**(`data`): `CDATASection`

Defined in: node\_modules/.pnpm/typescript@5.9.3/node\_modules/typescript/lib/lib.dom.d.ts:10115

**`createCDATASection()`** creates a new CDATA section node, and returns it.

[MDN Reference](https://developer.mozilla.org/docs/Web/API/Document/createCDATASection)

#### Parameters

##### data

`string`

#### Returns

`CDATASection`

#### Inherited from

`Document.createCDATASection`

***

### createComment()

> **createComment**(`data`): `Comment`

Defined in: node\_modules/.pnpm/typescript@5.9.3/node\_modules/typescript/lib/lib.dom.d.ts:10121

**`createComment()`** creates a new comment node, and returns it.

[MDN Reference](https://developer.mozilla.org/docs/Web/API/Document/createComment)

#### Parameters

##### data

`string`

#### Returns

`Comment`

#### Inherited from

`Document.createComment`

***

### createDocumentFragment()

> **createDocumentFragment**(): `DocumentFragment`

Defined in: node\_modules/.pnpm/typescript@5.9.3/node\_modules/typescript/lib/lib.dom.d.ts:10127

Creates a new empty DocumentFragment into which DOM nodes can be added to build an offscreen DOM tree.

[MDN Reference](https://developer.mozilla.org/docs/Web/API/Document/createDocumentFragment)

#### Returns

`DocumentFragment`

#### Inherited from

`Document.createDocumentFragment`

***

### createElement()

#### Call Signature

> **createElement**\<`K`\>(`tagName`, `options?`): `HTMLElementTagNameMap`\[`K`\]

Defined in: node\_modules/.pnpm/typescript@5.9.3/node\_modules/typescript/lib/lib.dom.d.ts:10133

In an HTML document, the **`document.createElement()`** method creates the HTML element specified by `localName`, or an HTMLUnknownElement if `localName` isn't recognized.

[MDN Reference](https://developer.mozilla.org/docs/Web/API/Document/createElement)

##### Type Parameters

###### K

`K` *extends* keyof `HTMLElementTagNameMap`

##### Parameters

###### tagName

`K`

###### options?

`ElementCreationOptions`

##### Returns

`HTMLElementTagNameMap`\[`K`\]

##### Inherited from

`Document.createElement`

#### Call Signature

> **createElement**\<`K`\>(`tagName`, `options?`): `HTMLElementDeprecatedTagNameMap`\[`K`\]

Defined in: node\_modules/.pnpm/typescript@5.9.3/node\_modules/typescript/lib/lib.dom.d.ts:10135

##### Type Parameters

###### K

`K` *extends* keyof `HTMLElementDeprecatedTagNameMap`

##### Parameters

###### tagName

`K`

###### options?

`ElementCreationOptions`

##### Returns

`HTMLElementDeprecatedTagNameMap`\[`K`\]

##### Deprecated

##### Inherited from

`Document.createElement`

#### Call Signature

> **createElement**(`tagName`, `options?`): `HTMLElement`

Defined in: node\_modules/.pnpm/typescript@5.9.3/node\_modules/typescript/lib/lib.dom.d.ts:10136

##### Parameters

###### tagName

`string`

###### options?

`ElementCreationOptions`

##### Returns

`HTMLElement`

##### Inherited from

`Document.createElement`

***

### createElementNS()

#### Call Signature

> **createElementNS**(`namespaceURI`, `qualifiedName`): `HTMLElement`

Defined in: node\_modules/.pnpm/typescript@5.9.3/node\_modules/typescript/lib/lib.dom.d.ts:10142

Creates an element with the specified namespace URI and qualified name.

[MDN Reference](https://developer.mozilla.org/docs/Web/API/Document/createElementNS)

##### Parameters

###### namespaceURI

`"http://www.w3.org/1999/xhtml"`

###### qualifiedName

`string`

##### Returns

`HTMLElement`

##### Inherited from

`Document.createElementNS`

#### Call Signature

> **createElementNS**\<`K`\>(`namespaceURI`, `qualifiedName`): `SVGElementTagNameMap`\[`K`\]

Defined in: node\_modules/.pnpm/typescript@5.9.3/node\_modules/typescript/lib/lib.dom.d.ts:10143

##### Type Parameters

###### K

`K` *extends* keyof `SVGElementTagNameMap`

##### Parameters

###### namespaceURI

`"http://www.w3.org/2000/svg"`

###### qualifiedName

`K`

##### Returns

`SVGElementTagNameMap`\[`K`\]

##### Inherited from

`Document.createElementNS`

#### Call Signature

> **createElementNS**(`namespaceURI`, `qualifiedName`): `SVGElement`

Defined in: node\_modules/.pnpm/typescript@5.9.3/node\_modules/typescript/lib/lib.dom.d.ts:10144

##### Parameters

###### namespaceURI

`"http://www.w3.org/2000/svg"`

###### qualifiedName

`string`

##### Returns

`SVGElement`

##### Inherited from

`Document.createElementNS`

#### Call Signature

> **createElementNS**\<`K`\>(`namespaceURI`, `qualifiedName`): `MathMLElementTagNameMap`\[`K`\]

Defined in: node\_modules/.pnpm/typescript@5.9.3/node\_modules/typescript/lib/lib.dom.d.ts:10145

##### Type Parameters

###### K

`K` *extends* keyof `MathMLElementTagNameMap`

##### Parameters

###### namespaceURI

`"http://www.w3.org/1998/Math/MathML"`

###### qualifiedName

`K`

##### Returns

`MathMLElementTagNameMap`\[`K`\]

##### Inherited from

`Document.createElementNS`

#### Call Signature

> **createElementNS**(`namespaceURI`, `qualifiedName`): `MathMLElement`

Defined in: node\_modules/.pnpm/typescript@5.9.3/node\_modules/typescript/lib/lib.dom.d.ts:10146

##### Parameters

###### namespaceURI

`"http://www.w3.org/1998/Math/MathML"`

###### qualifiedName

`string`

##### Returns

`MathMLElement`

##### Inherited from

`Document.createElementNS`

#### Call Signature

> **createElementNS**(`namespaceURI`, `qualifiedName`, `options?`): `Element`

Defined in: node\_modules/.pnpm/typescript@5.9.3/node\_modules/typescript/lib/lib.dom.d.ts:10147

##### Parameters

###### namespaceURI

`string` | `null`

###### qualifiedName

`string`

###### options?

`ElementCreationOptions`

##### Returns

`Element`

##### Inherited from

`Document.createElementNS`

#### Call Signature

> **createElementNS**(`namespace`, `qualifiedName`, `options?`): `Element`

Defined in: node\_modules/.pnpm/typescript@5.9.3/node\_modules/typescript/lib/lib.dom.d.ts:10148

##### Parameters

###### namespace

`string` | `null`

###### qualifiedName

`string`

###### options?

`string` | `ElementCreationOptions`

##### Returns

`Element`

##### Inherited from

`Document.createElementNS`

***

### createEvent()

#### Call Signature

> **createEvent**(`eventInterface`): `AnimationEvent`

Defined in: node\_modules/.pnpm/typescript@5.9.3/node\_modules/typescript/lib/lib.dom.d.ts:10155

Creates an event of the type specified.

##### Parameters

###### eventInterface

`"AnimationEvent"`

##### Returns

`AnimationEvent`

##### Deprecated

[MDN Reference](https://developer.mozilla.org/docs/Web/API/Document/createEvent)

##### Inherited from

`Document.createEvent`

#### Call Signature

> **createEvent**(`eventInterface`): `AnimationPlaybackEvent`

Defined in: node\_modules/.pnpm/typescript@5.9.3/node\_modules/typescript/lib/lib.dom.d.ts:10156

##### Parameters

###### eventInterface

`"AnimationPlaybackEvent"`

##### Returns

`AnimationPlaybackEvent`

##### Inherited from

`Document.createEvent`

#### Call Signature

> **createEvent**(`eventInterface`): `AudioProcessingEvent`

Defined in: node\_modules/.pnpm/typescript@5.9.3/node\_modules/typescript/lib/lib.dom.d.ts:10157

##### Parameters

###### eventInterface

`"AudioProcessingEvent"`

##### Returns

`AudioProcessingEvent`

##### Inherited from

`Document.createEvent`

#### Call Signature

> **createEvent**(`eventInterface`): `BeforeUnloadEvent`

Defined in: node\_modules/.pnpm/typescript@5.9.3/node\_modules/typescript/lib/lib.dom.d.ts:10158

##### Parameters

###### eventInterface

`"BeforeUnloadEvent"`

##### Returns

`BeforeUnloadEvent`

##### Inherited from

`Document.createEvent`

#### Call Signature

> **createEvent**(`eventInterface`): `BlobEvent`

Defined in: node\_modules/.pnpm/typescript@5.9.3/node\_modules/typescript/lib/lib.dom.d.ts:10159

##### Parameters

###### eventInterface

`"BlobEvent"`

##### Returns

`BlobEvent`

##### Inherited from

`Document.createEvent`

#### Call Signature

> **createEvent**(`eventInterface`): `ClipboardEvent`

Defined in: node\_modules/.pnpm/typescript@5.9.3/node\_modules/typescript/lib/lib.dom.d.ts:10160

##### Parameters

###### eventInterface

`"ClipboardEvent"`

##### Returns

`ClipboardEvent`

##### Inherited from

`Document.createEvent`

#### Call Signature

> **createEvent**(`eventInterface`): `CloseEvent`

Defined in: node\_modules/.pnpm/typescript@5.9.3/node\_modules/typescript/lib/lib.dom.d.ts:10161

##### Parameters

###### eventInterface

`"CloseEvent"`

##### Returns

`CloseEvent`

##### Inherited from

`Document.createEvent`

#### Call Signature

> **createEvent**(`eventInterface`): `CompositionEvent`

Defined in: node\_modules/.pnpm/typescript@5.9.3/node\_modules/typescript/lib/lib.dom.d.ts:10162

##### Parameters

###### eventInterface

`"CompositionEvent"`

##### Returns

`CompositionEvent`

##### Inherited from

`Document.createEvent`

#### Call Signature

> **createEvent**(`eventInterface`): `ContentVisibilityAutoStateChangeEvent`

Defined in: node\_modules/.pnpm/typescript@5.9.3/node\_modules/typescript/lib/lib.dom.d.ts:10163

##### Parameters

###### eventInterface

`"ContentVisibilityAutoStateChangeEvent"`

##### Returns

`ContentVisibilityAutoStateChangeEvent`

##### Inherited from

`Document.createEvent`

#### Call Signature

> **createEvent**(`eventInterface`): `CookieChangeEvent`

Defined in: node\_modules/.pnpm/typescript@5.9.3/node\_modules/typescript/lib/lib.dom.d.ts:10164

##### Parameters

###### eventInterface

`"CookieChangeEvent"`

##### Returns

`CookieChangeEvent`

##### Inherited from

`Document.createEvent`

#### Call Signature

> **createEvent**(`eventInterface`): `CustomEvent`

Defined in: node\_modules/.pnpm/typescript@5.9.3/node\_modules/typescript/lib/lib.dom.d.ts:10165

##### Parameters

###### eventInterface

`"CustomEvent"`

##### Returns

`CustomEvent`

##### Inherited from

`Document.createEvent`

#### Call Signature

> **createEvent**(`eventInterface`): `DeviceMotionEvent`

Defined in: node\_modules/.pnpm/typescript@5.9.3/node\_modules/typescript/lib/lib.dom.d.ts:10166

##### Parameters

###### eventInterface

`"DeviceMotionEvent"`

##### Returns

`DeviceMotionEvent`

##### Inherited from

`Document.createEvent`

#### Call Signature

> **createEvent**(`eventInterface`): `DeviceOrientationEvent`

Defined in: node\_modules/.pnpm/typescript@5.9.3/node\_modules/typescript/lib/lib.dom.d.ts:10167

##### Parameters

###### eventInterface

`"DeviceOrientationEvent"`

##### Returns

`DeviceOrientationEvent`

##### Inherited from

`Document.createEvent`

#### Call Signature

> **createEvent**(`eventInterface`): `DragEvent`

Defined in: node\_modules/.pnpm/typescript@5.9.3/node\_modules/typescript/lib/lib.dom.d.ts:10168

##### Parameters

###### eventInterface

`"DragEvent"`

##### Returns

`DragEvent`

##### Inherited from

`Document.createEvent`

#### Call Signature

> **createEvent**(`eventInterface`): `ErrorEvent`

Defined in: node\_modules/.pnpm/typescript@5.9.3/node\_modules/typescript/lib/lib.dom.d.ts:10169

##### Parameters

###### eventInterface

`"ErrorEvent"`

##### Returns

`ErrorEvent`

##### Inherited from

`Document.createEvent`

#### Call Signature

> **createEvent**(`eventInterface`): `Event`

Defined in: node\_modules/.pnpm/typescript@5.9.3/node\_modules/typescript/lib/lib.dom.d.ts:10170

##### Parameters

###### eventInterface

`"Event"`

##### Returns

`Event`

##### Inherited from

`Document.createEvent`

#### Call Signature

> **createEvent**(`eventInterface`): `Event`

Defined in: node\_modules/.pnpm/typescript@5.9.3/node\_modules/typescript/lib/lib.dom.d.ts:10171

##### Parameters

###### eventInterface

`"Events"`

##### Returns

`Event`

##### Inherited from

`Document.createEvent`

#### Call Signature

> **createEvent**(`eventInterface`): `FocusEvent`

Defined in: node\_modules/.pnpm/typescript@5.9.3/node\_modules/typescript/lib/lib.dom.d.ts:10172

##### Parameters

###### eventInterface

`"FocusEvent"`

##### Returns

`FocusEvent`

##### Inherited from

`Document.createEvent`

#### Call Signature

> **createEvent**(`eventInterface`): `FontFaceSetLoadEvent`

Defined in: node\_modules/.pnpm/typescript@5.9.3/node\_modules/typescript/lib/lib.dom.d.ts:10173

##### Parameters

###### eventInterface

`"FontFaceSetLoadEvent"`

##### Returns

`FontFaceSetLoadEvent`

##### Inherited from

`Document.createEvent`

#### Call Signature

> **createEvent**(`eventInterface`): `FormDataEvent`

Defined in: node\_modules/.pnpm/typescript@5.9.3/node\_modules/typescript/lib/lib.dom.d.ts:10174

##### Parameters

###### eventInterface

`"FormDataEvent"`

##### Returns

`FormDataEvent`

##### Inherited from

`Document.createEvent`

#### Call Signature

> **createEvent**(`eventInterface`): `GamepadEvent`

Defined in: node\_modules/.pnpm/typescript@5.9.3/node\_modules/typescript/lib/lib.dom.d.ts:10175

##### Parameters

###### eventInterface

`"GamepadEvent"`

##### Returns

`GamepadEvent`

##### Inherited from

`Document.createEvent`

#### Call Signature

> **createEvent**(`eventInterface`): `HashChangeEvent`

Defined in: node\_modules/.pnpm/typescript@5.9.3/node\_modules/typescript/lib/lib.dom.d.ts:10176

##### Parameters

###### eventInterface

`"HashChangeEvent"`

##### Returns

`HashChangeEvent`

##### Inherited from

`Document.createEvent`

#### Call Signature

> **createEvent**(`eventInterface`): `IDBVersionChangeEvent`

Defined in: node\_modules/.pnpm/typescript@5.9.3/node\_modules/typescript/lib/lib.dom.d.ts:10177

##### Parameters

###### eventInterface

`"IDBVersionChangeEvent"`

##### Returns

`IDBVersionChangeEvent`

##### Inherited from

`Document.createEvent`

#### Call Signature

> **createEvent**(`eventInterface`): `InputEvent`

Defined in: node\_modules/.pnpm/typescript@5.9.3/node\_modules/typescript/lib/lib.dom.d.ts:10178

##### Parameters

###### eventInterface

`"InputEvent"`

##### Returns

`InputEvent`

##### Inherited from

`Document.createEvent`

#### Call Signature

> **createEvent**(`eventInterface`): `KeyboardEvent`

Defined in: node\_modules/.pnpm/typescript@5.9.3/node\_modules/typescript/lib/lib.dom.d.ts:10179

##### Parameters

###### eventInterface

`"KeyboardEvent"`

##### Returns

`KeyboardEvent`

##### Inherited from

`Document.createEvent`

#### Call Signature

> **createEvent**(`eventInterface`): `MIDIConnectionEvent`

Defined in: node\_modules/.pnpm/typescript@5.9.3/node\_modules/typescript/lib/lib.dom.d.ts:10180

##### Parameters

###### eventInterface

`"MIDIConnectionEvent"`

##### Returns

`MIDIConnectionEvent`

##### Inherited from

`Document.createEvent`

#### Call Signature

> **createEvent**(`eventInterface`): `MIDIMessageEvent`

Defined in: node\_modules/.pnpm/typescript@5.9.3/node\_modules/typescript/lib/lib.dom.d.ts:10181

##### Parameters

###### eventInterface

`"MIDIMessageEvent"`

##### Returns

`MIDIMessageEvent`

##### Inherited from

`Document.createEvent`

#### Call Signature

> **createEvent**(`eventInterface`): `MediaEncryptedEvent`

Defined in: node\_modules/.pnpm/typescript@5.9.3/node\_modules/typescript/lib/lib.dom.d.ts:10182

##### Parameters

###### eventInterface

`"MediaEncryptedEvent"`

##### Returns

`MediaEncryptedEvent`

##### Inherited from

`Document.createEvent`

#### Call Signature

> **createEvent**(`eventInterface`): `MediaKeyMessageEvent`

Defined in: node\_modules/.pnpm/typescript@5.9.3/node\_modules/typescript/lib/lib.dom.d.ts:10183

##### Parameters

###### eventInterface

`"MediaKeyMessageEvent"`

##### Returns

`MediaKeyMessageEvent`

##### Inherited from

`Document.createEvent`

#### Call Signature

> **createEvent**(`eventInterface`): `MediaQueryListEvent`

Defined in: node\_modules/.pnpm/typescript@5.9.3/node\_modules/typescript/lib/lib.dom.d.ts:10184

##### Parameters

###### eventInterface

`"MediaQueryListEvent"`

##### Returns

`MediaQueryListEvent`

##### Inherited from

`Document.createEvent`

#### Call Signature

> **createEvent**(`eventInterface`): `MediaStreamTrackEvent`

Defined in: node\_modules/.pnpm/typescript@5.9.3/node\_modules/typescript/lib/lib.dom.d.ts:10185

##### Parameters

###### eventInterface

`"MediaStreamTrackEvent"`

##### Returns

`MediaStreamTrackEvent`

##### Inherited from

`Document.createEvent`

#### Call Signature

> **createEvent**(`eventInterface`): `MessageEvent`

Defined in: node\_modules/.pnpm/typescript@5.9.3/node\_modules/typescript/lib/lib.dom.d.ts:10186

##### Parameters

###### eventInterface

`"MessageEvent"`

##### Returns

`MessageEvent`

##### Inherited from

`Document.createEvent`

#### Call Signature

> **createEvent**(`eventInterface`): `MouseEvent`

Defined in: node\_modules/.pnpm/typescript@5.9.3/node\_modules/typescript/lib/lib.dom.d.ts:10187

##### Parameters

###### eventInterface

`"MouseEvent"`

##### Returns

`MouseEvent`

##### Inherited from

`Document.createEvent`

#### Call Signature

> **createEvent**(`eventInterface`): `MouseEvent`

Defined in: node\_modules/.pnpm/typescript@5.9.3/node\_modules/typescript/lib/lib.dom.d.ts:10188

##### Parameters

###### eventInterface

`"MouseEvents"`

##### Returns

`MouseEvent`

##### Inherited from

`Document.createEvent`

#### Call Signature

> **createEvent**(`eventInterface`): `OfflineAudioCompletionEvent`

Defined in: node\_modules/.pnpm/typescript@5.9.3/node\_modules/typescript/lib/lib.dom.d.ts:10189

##### Parameters

###### eventInterface

`"OfflineAudioCompletionEvent"`

##### Returns

`OfflineAudioCompletionEvent`

##### Inherited from

`Document.createEvent`

#### Call Signature

> **createEvent**(`eventInterface`): `PageRevealEvent`

Defined in: node\_modules/.pnpm/typescript@5.9.3/node\_modules/typescript/lib/lib.dom.d.ts:10190

##### Parameters

###### eventInterface

`"PageRevealEvent"`

##### Returns

`PageRevealEvent`

##### Inherited from

`Document.createEvent`

#### Call Signature

> **createEvent**(`eventInterface`): `PageSwapEvent`

Defined in: node\_modules/.pnpm/typescript@5.9.3/node\_modules/typescript/lib/lib.dom.d.ts:10191

##### Parameters

###### eventInterface

`"PageSwapEvent"`

##### Returns

`PageSwapEvent`

##### Inherited from

`Document.createEvent`

#### Call Signature

> **createEvent**(`eventInterface`): `PageTransitionEvent`

Defined in: node\_modules/.pnpm/typescript@5.9.3/node\_modules/typescript/lib/lib.dom.d.ts:10192

##### Parameters

###### eventInterface

`"PageTransitionEvent"`

##### Returns

`PageTransitionEvent`

##### Inherited from

`Document.createEvent`

#### Call Signature

> **createEvent**(`eventInterface`): `PaymentMethodChangeEvent`

Defined in: node\_modules/.pnpm/typescript@5.9.3/node\_modules/typescript/lib/lib.dom.d.ts:10193

##### Parameters

###### eventInterface

`"PaymentMethodChangeEvent"`

##### Returns

`PaymentMethodChangeEvent`

##### Inherited from

`Document.createEvent`

#### Call Signature

> **createEvent**(`eventInterface`): `PaymentRequestUpdateEvent`

Defined in: node\_modules/.pnpm/typescript@5.9.3/node\_modules/typescript/lib/lib.dom.d.ts:10194

##### Parameters

###### eventInterface

`"PaymentRequestUpdateEvent"`

##### Returns

`PaymentRequestUpdateEvent`

##### Inherited from

`Document.createEvent`

#### Call Signature

> **createEvent**(`eventInterface`): `PictureInPictureEvent`

Defined in: node\_modules/.pnpm/typescript@5.9.3/node\_modules/typescript/lib/lib.dom.d.ts:10195

##### Parameters

###### eventInterface

`"PictureInPictureEvent"`

##### Returns

`PictureInPictureEvent`

##### Inherited from

`Document.createEvent`

#### Call Signature

> **createEvent**(`eventInterface`): `PointerEvent`

Defined in: node\_modules/.pnpm/typescript@5.9.3/node\_modules/typescript/lib/lib.dom.d.ts:10196

##### Parameters

###### eventInterface

`"PointerEvent"`

##### Returns

`PointerEvent`

##### Inherited from

`Document.createEvent`

#### Call Signature

> **createEvent**(`eventInterface`): `PopStateEvent`

Defined in: node\_modules/.pnpm/typescript@5.9.3/node\_modules/typescript/lib/lib.dom.d.ts:10197

##### Parameters

###### eventInterface

`"PopStateEvent"`

##### Returns

`PopStateEvent`

##### Inherited from

`Document.createEvent`

#### Call Signature

> **createEvent**(`eventInterface`): `ProgressEvent`

Defined in: node\_modules/.pnpm/typescript@5.9.3/node\_modules/typescript/lib/lib.dom.d.ts:10198

##### Parameters

###### eventInterface

`"ProgressEvent"`

##### Returns

`ProgressEvent`

##### Inherited from

`Document.createEvent`

#### Call Signature

> **createEvent**(`eventInterface`): `PromiseRejectionEvent`

Defined in: node\_modules/.pnpm/typescript@5.9.3/node\_modules/typescript/lib/lib.dom.d.ts:10199

##### Parameters

###### eventInterface

`"PromiseRejectionEvent"`

##### Returns

`PromiseRejectionEvent`

##### Inherited from

`Document.createEvent`

#### Call Signature

> **createEvent**(`eventInterface`): `RTCDTMFToneChangeEvent`

Defined in: node\_modules/.pnpm/typescript@5.9.3/node\_modules/typescript/lib/lib.dom.d.ts:10200

##### Parameters

###### eventInterface

`"RTCDTMFToneChangeEvent"`

##### Returns

`RTCDTMFToneChangeEvent`

##### Inherited from

`Document.createEvent`

#### Call Signature

> **createEvent**(`eventInterface`): `RTCDataChannelEvent`

Defined in: node\_modules/.pnpm/typescript@5.9.3/node\_modules/typescript/lib/lib.dom.d.ts:10201

##### Parameters

###### eventInterface

`"RTCDataChannelEvent"`

##### Returns

`RTCDataChannelEvent`

##### Inherited from

`Document.createEvent`

#### Call Signature

> **createEvent**(`eventInterface`): `RTCErrorEvent`

Defined in: node\_modules/.pnpm/typescript@5.9.3/node\_modules/typescript/lib/lib.dom.d.ts:10202

##### Parameters

###### eventInterface

`"RTCErrorEvent"`

##### Returns

`RTCErrorEvent`

##### Inherited from

`Document.createEvent`

#### Call Signature

> **createEvent**(`eventInterface`): `RTCPeerConnectionIceErrorEvent`

Defined in: node\_modules/.pnpm/typescript@5.9.3/node\_modules/typescript/lib/lib.dom.d.ts:10203

##### Parameters

###### eventInterface

`"RTCPeerConnectionIceErrorEvent"`

##### Returns

`RTCPeerConnectionIceErrorEvent`

##### Inherited from

`Document.createEvent`

#### Call Signature

> **createEvent**(`eventInterface`): `RTCPeerConnectionIceEvent`

Defined in: node\_modules/.pnpm/typescript@5.9.3/node\_modules/typescript/lib/lib.dom.d.ts:10204

##### Parameters

###### eventInterface

`"RTCPeerConnectionIceEvent"`

##### Returns

`RTCPeerConnectionIceEvent`

##### Inherited from

`Document.createEvent`

#### Call Signature

> **createEvent**(`eventInterface`): `RTCTrackEvent`

Defined in: node\_modules/.pnpm/typescript@5.9.3/node\_modules/typescript/lib/lib.dom.d.ts:10205

##### Parameters

###### eventInterface

`"RTCTrackEvent"`

##### Returns

`RTCTrackEvent`

##### Inherited from

`Document.createEvent`

#### Call Signature

> **createEvent**(`eventInterface`): `SecurityPolicyViolationEvent`

Defined in: node\_modules/.pnpm/typescript@5.9.3/node\_modules/typescript/lib/lib.dom.d.ts:10206

##### Parameters

###### eventInterface

`"SecurityPolicyViolationEvent"`

##### Returns

`SecurityPolicyViolationEvent`

##### Inherited from

`Document.createEvent`

#### Call Signature

> **createEvent**(`eventInterface`): `SpeechSynthesisErrorEvent`

Defined in: node\_modules/.pnpm/typescript@5.9.3/node\_modules/typescript/lib/lib.dom.d.ts:10207

##### Parameters

###### eventInterface

`"SpeechSynthesisErrorEvent"`

##### Returns

`SpeechSynthesisErrorEvent`

##### Inherited from

`Document.createEvent`

#### Call Signature

> **createEvent**(`eventInterface`): `SpeechSynthesisEvent`

Defined in: node\_modules/.pnpm/typescript@5.9.3/node\_modules/typescript/lib/lib.dom.d.ts:10208

##### Parameters

###### eventInterface

`"SpeechSynthesisEvent"`

##### Returns

`SpeechSynthesisEvent`

##### Inherited from

`Document.createEvent`

#### Call Signature

> **createEvent**(`eventInterface`): `StorageEvent`

Defined in: node\_modules/.pnpm/typescript@5.9.3/node\_modules/typescript/lib/lib.dom.d.ts:10209

##### Parameters

###### eventInterface

`"StorageEvent"`

##### Returns

`StorageEvent`

##### Inherited from

`Document.createEvent`

#### Call Signature

> **createEvent**(`eventInterface`): `SubmitEvent`

Defined in: node\_modules/.pnpm/typescript@5.9.3/node\_modules/typescript/lib/lib.dom.d.ts:10210

##### Parameters

###### eventInterface

`"SubmitEvent"`

##### Returns

`SubmitEvent`

##### Inherited from

`Document.createEvent`

#### Call Signature

> **createEvent**(`eventInterface`): `TextEvent`

Defined in: node\_modules/.pnpm/typescript@5.9.3/node\_modules/typescript/lib/lib.dom.d.ts:10211

##### Parameters

###### eventInterface

`"TextEvent"`

##### Returns

`TextEvent`

##### Inherited from

`Document.createEvent`

#### Call Signature

> **createEvent**(`eventInterface`): `ToggleEvent`

Defined in: node\_modules/.pnpm/typescript@5.9.3/node\_modules/typescript/lib/lib.dom.d.ts:10212

##### Parameters

###### eventInterface

`"ToggleEvent"`

##### Returns

`ToggleEvent`

##### Inherited from

`Document.createEvent`

#### Call Signature

> **createEvent**(`eventInterface`): `TouchEvent`

Defined in: node\_modules/.pnpm/typescript@5.9.3/node\_modules/typescript/lib/lib.dom.d.ts:10213

##### Parameters

###### eventInterface

`"TouchEvent"`

##### Returns

`TouchEvent`

##### Inherited from

`Document.createEvent`

#### Call Signature

> **createEvent**(`eventInterface`): `TrackEvent`

Defined in: node\_modules/.pnpm/typescript@5.9.3/node\_modules/typescript/lib/lib.dom.d.ts:10214

##### Parameters

###### eventInterface

`"TrackEvent"`

##### Returns

`TrackEvent`

##### Inherited from

`Document.createEvent`

#### Call Signature

> **createEvent**(`eventInterface`): `TransitionEvent`

Defined in: node\_modules/.pnpm/typescript@5.9.3/node\_modules/typescript/lib/lib.dom.d.ts:10215

##### Parameters

###### eventInterface

`"TransitionEvent"`

##### Returns

`TransitionEvent`

##### Inherited from

`Document.createEvent`

#### Call Signature

> **createEvent**(`eventInterface`): `UIEvent`

Defined in: node\_modules/.pnpm/typescript@5.9.3/node\_modules/typescript/lib/lib.dom.d.ts:10216

##### Parameters

###### eventInterface

`"UIEvent"`

##### Returns

`UIEvent`

##### Inherited from

`Document.createEvent`

#### Call Signature

> **createEvent**(`eventInterface`): `UIEvent`

Defined in: node\_modules/.pnpm/typescript@5.9.3/node\_modules/typescript/lib/lib.dom.d.ts:10217

##### Parameters

###### eventInterface

`"UIEvents"`

##### Returns

`UIEvent`

##### Inherited from

`Document.createEvent`

#### Call Signature

> **createEvent**(`eventInterface`): `WebGLContextEvent`

Defined in: node\_modules/.pnpm/typescript@5.9.3/node\_modules/typescript/lib/lib.dom.d.ts:10218

##### Parameters

###### eventInterface

`"WebGLContextEvent"`

##### Returns

`WebGLContextEvent`

##### Inherited from

`Document.createEvent`

#### Call Signature

> **createEvent**(`eventInterface`): `WheelEvent`

Defined in: node\_modules/.pnpm/typescript@5.9.3/node\_modules/typescript/lib/lib.dom.d.ts:10219

##### Parameters

###### eventInterface

`"WheelEvent"`

##### Returns

`WheelEvent`

##### Inherited from

`Document.createEvent`

#### Call Signature

> **createEvent**(`eventInterface`): `Event`

Defined in: node\_modules/.pnpm/typescript@5.9.3/node\_modules/typescript/lib/lib.dom.d.ts:10220

##### Parameters

###### eventInterface

`string`

##### Returns

`Event`

##### Inherited from

`Document.createEvent`

***

### createExpression()

> **createExpression**(`expression`, `resolver?`): `XPathExpression`

Defined in: node\_modules/.pnpm/typescript@5.9.3/node\_modules/typescript/lib/lib.dom.d.ts:37349

[MDN Reference](https://developer.mozilla.org/docs/Web/API/Document/createExpression)

#### Parameters

##### expression

`string`

##### resolver?

`XPathNSResolver` | `null`

#### Returns

`XPathExpression`

#### Inherited from

`Document.createExpression`

***

### createNodeIterator()

> **createNodeIterator**(`root`, `whatToShow?`, `filter?`): `NodeIterator`

Defined in: node\_modules/.pnpm/typescript@5.9.3/node\_modules/typescript/lib/lib.dom.d.ts:10226

The **`Document.createNodeIterator()`** method returns a new `NodeIterator` object.

[MDN Reference](https://developer.mozilla.org/docs/Web/API/Document/createNodeIterator)

#### Parameters

##### root

`Node`

##### whatToShow?

`number`

##### filter?

`NodeFilter` | `null`

#### Returns

`NodeIterator`

#### Inherited from

`Document.createNodeIterator`

***

### ~~createNSResolver()~~

> **createNSResolver**(`nodeResolver`): `Node`

Defined in: node\_modules/.pnpm/typescript@5.9.3/node\_modules/typescript/lib/lib.dom.d.ts:37355

#### Parameters

##### nodeResolver

`Node`

#### Returns

`Node`

#### Deprecated

[MDN Reference](https://developer.mozilla.org/docs/Web/API/Document/createNSResolver)

#### Inherited from

`Document.createNSResolver`

***

### createProcessingInstruction()

> **createProcessingInstruction**(`target`, `data`): `ProcessingInstruction`

Defined in: node\_modules/.pnpm/typescript@5.9.3/node\_modules/typescript/lib/lib.dom.d.ts:10232

`createProcessingInstruction()` generates a new processing instruction node and returns it.

[MDN Reference](https://developer.mozilla.org/docs/Web/API/Document/createProcessingInstruction)

#### Parameters

##### target

`string`

##### data

`string`

#### Returns

`ProcessingInstruction`

#### Inherited from

`Document.createProcessingInstruction`

***

### createRange()

> **createRange**(): `Range`

Defined in: node\_modules/.pnpm/typescript@5.9.3/node\_modules/typescript/lib/lib.dom.d.ts:10238

The **`Document.createRange()`** method returns a new ```js-nolint createRange() ``` None.

[MDN Reference](https://developer.mozilla.org/docs/Web/API/Document/createRange)

#### Returns

`Range`

#### Inherited from

`Document.createRange`

***

### createTextNode()

> **createTextNode**(`data`): `Text`

Defined in: node\_modules/.pnpm/typescript@5.9.3/node\_modules/typescript/lib/lib.dom.d.ts:10244

Creates a new Text node.

[MDN Reference](https://developer.mozilla.org/docs/Web/API/Document/createTextNode)

#### Parameters

##### data

`string`

#### Returns

`Text`

#### Inherited from

`Document.createTextNode`

***

### createTreeWalker()

> **createTreeWalker**(`root`, `whatToShow?`, `filter?`): `TreeWalker`

Defined in: node\_modules/.pnpm/typescript@5.9.3/node\_modules/typescript/lib/lib.dom.d.ts:10250

The **`Document.createTreeWalker()`** creator method returns a newly created TreeWalker object.

[MDN Reference](https://developer.mozilla.org/docs/Web/API/Document/createTreeWalker)

#### Parameters

##### root

`Node`

##### whatToShow?

`number`

##### filter?

`NodeFilter` | `null`

#### Returns

`TreeWalker`

#### Inherited from

`Document.createTreeWalker`

***

### dispatchEvent()

> **dispatchEvent**(`event`): `boolean`

Defined in: node\_modules/.pnpm/typescript@5.9.3/node\_modules/typescript/lib/lib.dom.d.ts:11575

The **`dispatchEvent()`** method of the EventTarget sends an Event to the object, (synchronously) invoking the affected event listeners in the appropriate order.

[MDN Reference](https://developer.mozilla.org/docs/Web/API/EventTarget/dispatchEvent)

#### Parameters

##### event

`Event`

#### Returns

`boolean`

#### Inherited from

`Document.dispatchEvent`

***

### elementFromPoint()

> **elementFromPoint**(`x`, `y`): `Element` \| `null`

Defined in: node\_modules/.pnpm/typescript@5.9.3/node\_modules/typescript/lib/lib.dom.d.ts:10454

#### Parameters

##### x

`number`

##### y

`number`

#### Returns

`Element` \| `null`

#### Inherited from

`Document.elementFromPoint`

***

### elementsFromPoint()

> **elementsFromPoint**(`x`, `y`): `Element`[]

Defined in: node\_modules/.pnpm/typescript@5.9.3/node\_modules/typescript/lib/lib.dom.d.ts:10455

#### Parameters

##### x

`number`

##### y

`number`

#### Returns

`Element`[]

#### Inherited from

`Document.elementsFromPoint`

***

### evaluate()

> **evaluate**(`expression`, `contextNode`, `resolver?`, `type?`, `result?`): `XPathResult`

Defined in: node\_modules/.pnpm/typescript@5.9.3/node\_modules/typescript/lib/lib.dom.d.ts:37357

[MDN Reference](https://developer.mozilla.org/docs/Web/API/Document/evaluate)

#### Parameters

##### expression

`string`

##### contextNode

`Node`

##### resolver?

`XPathNSResolver` | `null`

##### type?

`number`

##### result?

`XPathResult` | `null`

#### Returns

`XPathResult`

#### Inherited from

`Document.evaluate`

***

### ~~execCommand()~~

> **execCommand**(`commandId`, `showUI?`, `value?`): `boolean`

Defined in: node\_modules/.pnpm/typescript@5.9.3/node\_modules/typescript/lib/lib.dom.d.ts:10257

The **`execCommand`** method implements multiple different commands.

#### Parameters

##### commandId

`string`

##### showUI?

`boolean`

##### value?

`string`

#### Returns

`boolean`

#### Deprecated

[MDN Reference](https://developer.mozilla.org/docs/Web/API/Document/execCommand)

#### Inherited from

`Document.execCommand`

***

### exitFullscreen()

> **exitFullscreen**(): `Promise`\<`void`\>

Defined in: node\_modules/.pnpm/typescript@5.9.3/node\_modules/typescript/lib/lib.dom.d.ts:10263

The Document method **`exitFullscreen()`** requests that the element on this document which is currently being presented in fullscreen mode be taken out of fullscreen mode, restoring the previous state of the screen.

[MDN Reference](https://developer.mozilla.org/docs/Web/API/Document/exitFullscreen)

#### Returns

`Promise`\<`void`\>

#### Inherited from

`Document.exitFullscreen`

***

### exitPictureInPicture()

> **exitPictureInPicture**(): `Promise`\<`void`\>

Defined in: node\_modules/.pnpm/typescript@5.9.3/node\_modules/typescript/lib/lib.dom.d.ts:10269

The **`exitPictureInPicture()`** method of the Document interface requests that a video contained in this document, which is currently floating, be taken out of picture-in-picture mode, restoring the previous state of the screen.

[MDN Reference](https://developer.mozilla.org/docs/Web/API/Document/exitPictureInPicture)

#### Returns

`Promise`\<`void`\>

#### Inherited from

`Document.exitPictureInPicture`

***

### exitPointerLock()

> **exitPointerLock**(): `void`

Defined in: node\_modules/.pnpm/typescript@5.9.3/node\_modules/typescript/lib/lib.dom.d.ts:10275

The **`exitPointerLock()`** method of the Document interface asynchronously releases a pointer lock previously requested through Element.requestPointerLock.

[MDN Reference](https://developer.mozilla.org/docs/Web/API/Document/exitPointerLock)

#### Returns

`void`

#### Inherited from

`Document.exitPointerLock`

***

### getAnimations()

> **getAnimations**(): `Animation`[]

Defined in: node\_modules/.pnpm/typescript@5.9.3/node\_modules/typescript/lib/lib.dom.d.ts:10457

[MDN Reference](https://developer.mozilla.org/docs/Web/API/Document/getAnimations)

#### Returns

`Animation`[]

#### Inherited from

`Document.getAnimations`

***

### getElementById()

> **getElementById**(`elementId`): `HTMLElement` \| `null`

Defined in: node\_modules/.pnpm/typescript@5.9.3/node\_modules/typescript/lib/lib.dom.d.ts:10276

Returns the first element within node's descendants whose ID is elementId.

[MDN Reference](https://developer.mozilla.org/docs/Web/API/Document/getElementById)

#### Parameters

##### elementId

`string`

#### Returns

`HTMLElement` \| `null`

#### Inherited from

`Document.getElementById`

***

### getElementsByClassName()

> **getElementsByClassName**(`classNames`): `HTMLCollectionOf`\<`Element`\>

Defined in: node\_modules/.pnpm/typescript@5.9.3/node\_modules/typescript/lib/lib.dom.d.ts:10282

The **`getElementsByClassName`** method of of all child elements which have all of the given class name(s).

[MDN Reference](https://developer.mozilla.org/docs/Web/API/Document/getElementsByClassName)

#### Parameters

##### classNames

`string`

#### Returns

`HTMLCollectionOf`\<`Element`\>

#### Inherited from

`Document.getElementsByClassName`

***

### getElementsByName()

> **getElementsByName**(`elementName`): `NodeListOf`\<`HTMLElement`\>

Defined in: node\_modules/.pnpm/typescript@5.9.3/node\_modules/typescript/lib/lib.dom.d.ts:10288

The **`getElementsByName()`** method of the Document object returns a NodeList Collection of elements with a given `name` attribute in the document.

[MDN Reference](https://developer.mozilla.org/docs/Web/API/Document/getElementsByName)

#### Parameters

##### elementName

`string`

#### Returns

`NodeListOf`\<`HTMLElement`\>

#### Inherited from

`Document.getElementsByName`

***

### getElementsByTagName()

#### Call Signature

> **getElementsByTagName**\<`K`\>(`qualifiedName`): `HTMLCollectionOf`\<`HTMLElementTagNameMap`\[`K`\]\>

Defined in: node\_modules/.pnpm/typescript@5.9.3/node\_modules/typescript/lib/lib.dom.d.ts:10294

The **`getElementsByTagName`** method of The complete document is searched, including the root node.

[MDN Reference](https://developer.mozilla.org/docs/Web/API/Document/getElementsByTagName)

##### Type Parameters

###### K

`K` *extends* keyof `HTMLElementTagNameMap`

##### Parameters

###### qualifiedName

`K`

##### Returns

`HTMLCollectionOf`\<`HTMLElementTagNameMap`\[`K`\]\>

##### Inherited from

`Document.getElementsByTagName`

#### Call Signature

> **getElementsByTagName**\<`K`\>(`qualifiedName`): `HTMLCollectionOf`\<`SVGElementTagNameMap`\[`K`\]\>

Defined in: node\_modules/.pnpm/typescript@5.9.3/node\_modules/typescript/lib/lib.dom.d.ts:10295

##### Type Parameters

###### K

`K` *extends* keyof `SVGElementTagNameMap`

##### Parameters

###### qualifiedName

`K`

##### Returns

`HTMLCollectionOf`\<`SVGElementTagNameMap`\[`K`\]\>

##### Inherited from

`Document.getElementsByTagName`

#### Call Signature

> **getElementsByTagName**\<`K`\>(`qualifiedName`): `HTMLCollectionOf`\<`MathMLElementTagNameMap`\[`K`\]\>

Defined in: node\_modules/.pnpm/typescript@5.9.3/node\_modules/typescript/lib/lib.dom.d.ts:10296

##### Type Parameters

###### K

`K` *extends* keyof `MathMLElementTagNameMap`

##### Parameters

###### qualifiedName

`K`

##### Returns

`HTMLCollectionOf`\<`MathMLElementTagNameMap`\[`K`\]\>

##### Inherited from

`Document.getElementsByTagName`

#### Call Signature

> **getElementsByTagName**\<`K`\>(`qualifiedName`): `HTMLCollectionOf`\<`HTMLElementDeprecatedTagNameMap`\[`K`\]\>

Defined in: node\_modules/.pnpm/typescript@5.9.3/node\_modules/typescript/lib/lib.dom.d.ts:10298

##### Type Parameters

###### K

`K` *extends* keyof `HTMLElementDeprecatedTagNameMap`

##### Parameters

###### qualifiedName

`K`

##### Returns

`HTMLCollectionOf`\<`HTMLElementDeprecatedTagNameMap`\[`K`\]\>

##### Deprecated

##### Inherited from

`Document.getElementsByTagName`

#### Call Signature

> **getElementsByTagName**(`qualifiedName`): `HTMLCollectionOf`\<`Element`\>

Defined in: node\_modules/.pnpm/typescript@5.9.3/node\_modules/typescript/lib/lib.dom.d.ts:10299

##### Parameters

###### qualifiedName

`string`

##### Returns

`HTMLCollectionOf`\<`Element`\>

##### Inherited from

`Document.getElementsByTagName`

***

### getElementsByTagNameNS()

#### Call Signature

> **getElementsByTagNameNS**(`namespaceURI`, `localName`): `HTMLCollectionOf`\<`HTMLElement`\>

Defined in: node\_modules/.pnpm/typescript@5.9.3/node\_modules/typescript/lib/lib.dom.d.ts:10305

Returns a list of elements with the given tag name belonging to the given namespace.

[MDN Reference](https://developer.mozilla.org/docs/Web/API/Document/getElementsByTagNameNS)

##### Parameters

###### namespaceURI

`"http://www.w3.org/1999/xhtml"`

###### localName

`string`

##### Returns

`HTMLCollectionOf`\<`HTMLElement`\>

##### Inherited from

`Document.getElementsByTagNameNS`

#### Call Signature

> **getElementsByTagNameNS**(`namespaceURI`, `localName`): `HTMLCollectionOf`\<`SVGElement`\>

Defined in: node\_modules/.pnpm/typescript@5.9.3/node\_modules/typescript/lib/lib.dom.d.ts:10306

##### Parameters

###### namespaceURI

`"http://www.w3.org/2000/svg"`

###### localName

`string`

##### Returns

`HTMLCollectionOf`\<`SVGElement`\>

##### Inherited from

`Document.getElementsByTagNameNS`

#### Call Signature

> **getElementsByTagNameNS**(`namespaceURI`, `localName`): `HTMLCollectionOf`\<`MathMLElement`\>

Defined in: node\_modules/.pnpm/typescript@5.9.3/node\_modules/typescript/lib/lib.dom.d.ts:10307

##### Parameters

###### namespaceURI

`"http://www.w3.org/1998/Math/MathML"`

###### localName

`string`

##### Returns

`HTMLCollectionOf`\<`MathMLElement`\>

##### Inherited from

`Document.getElementsByTagNameNS`

#### Call Signature

> **getElementsByTagNameNS**(`namespace`, `localName`): `HTMLCollectionOf`\<`Element`\>

Defined in: node\_modules/.pnpm/typescript@5.9.3/node\_modules/typescript/lib/lib.dom.d.ts:10308

##### Parameters

###### namespace

`string` | `null`

###### localName

`string`

##### Returns

`HTMLCollectionOf`\<`Element`\>

##### Inherited from

`Document.getElementsByTagNameNS`

***

### getRootNode()

> **getRootNode**(`options?`): `Node`

Defined in: node\_modules/.pnpm/typescript@5.9.3/node\_modules/typescript/lib/lib.dom.d.ts:21772

The **`getRootNode()`** method of the Node interface returns the context object's root, which optionally includes the shadow root if it is available.

[MDN Reference](https://developer.mozilla.org/docs/Web/API/Node/getRootNode)

#### Parameters

##### options?

`GetRootNodeOptions`

#### Returns

`Node`

#### Inherited from

`Document.getRootNode`

***

### getSelection()

> **getSelection**(): `Selection` \| `null`

Defined in: node\_modules/.pnpm/typescript@5.9.3/node\_modules/typescript/lib/lib.dom.d.ts:10314

The **`getSelection()`** method of the Document interface returns the Selection object associated with this document, representing the range of text selected by the user, or the current position of the caret.

[MDN Reference](https://developer.mozilla.org/docs/Web/API/Document/getSelection)

#### Returns

`Selection` \| `null`

#### Inherited from

`Document.getSelection`

***

### hasChildNodes()

> **hasChildNodes**(): `boolean`

Defined in: node\_modules/.pnpm/typescript@5.9.3/node\_modules/typescript/lib/lib.dom.d.ts:21778

The **`hasChildNodes()`** method of the Node interface returns a boolean value indicating whether the given Node has child nodes or not.

[MDN Reference](https://developer.mozilla.org/docs/Web/API/Node/hasChildNodes)

#### Returns

`boolean`

#### Inherited from

`Document.hasChildNodes`

***

### hasFocus()

> **hasFocus**(): `boolean`

Defined in: node\_modules/.pnpm/typescript@5.9.3/node\_modules/typescript/lib/lib.dom.d.ts:10320

The **`hasFocus()`** method of the Document interface returns a boolean value indicating whether the document or any element inside the document has focus.

[MDN Reference](https://developer.mozilla.org/docs/Web/API/Document/hasFocus)

#### Returns

`boolean`

#### Inherited from

`Document.hasFocus`

***

### hasStorageAccess()

> **hasStorageAccess**(): `Promise`\<`boolean`\>

Defined in: node\_modules/.pnpm/typescript@5.9.3/node\_modules/typescript/lib/lib.dom.d.ts:10326

The **`hasStorageAccess()`** method of the Document interface returns a Promise that resolves with a boolean value indicating whether the document has access to third-party, unpartitioned cookies.

[MDN Reference](https://developer.mozilla.org/docs/Web/API/Document/hasStorageAccess)

#### Returns

`Promise`\<`boolean`\>

#### Inherited from

`Document.hasStorageAccess`

***

### importNode()

> **importNode**\<`T`\>(`node`, `options?`): `T`

Defined in: node\_modules/.pnpm/typescript@5.9.3/node\_modules/typescript/lib/lib.dom.d.ts:10332

The Document object's **`importNode()`** method creates a copy of a inserted into the current document later.

[MDN Reference](https://developer.mozilla.org/docs/Web/API/Document/importNode)

#### Type Parameters

##### T

`T` *extends* `Node`

#### Parameters

##### node

`T`

##### options?

`boolean` | `ImportNodeOptions`

#### Returns

`T`

#### Inherited from

`Document.importNode`

***

### insertBefore()

> **insertBefore**\<`T`\>(`node`, `child`): `T`

Defined in: node\_modules/.pnpm/typescript@5.9.3/node\_modules/typescript/lib/lib.dom.d.ts:21784

The **`insertBefore()`** method of the Node interface inserts a node before a _reference node_ as a child of a specified _parent node_.

[MDN Reference](https://developer.mozilla.org/docs/Web/API/Node/insertBefore)

#### Type Parameters

##### T

`T` *extends* `Node`

#### Parameters

##### node

`T`

##### child

`Node` | `null`

#### Returns

`T`

#### Inherited from

`Document.insertBefore`

***

### isDefaultNamespace()

> **isDefaultNamespace**(`namespace`): `boolean`

Defined in: node\_modules/.pnpm/typescript@5.9.3/node\_modules/typescript/lib/lib.dom.d.ts:21790

The **`isDefaultNamespace()`** method of the Node interface accepts a namespace URI as an argument.

[MDN Reference](https://developer.mozilla.org/docs/Web/API/Node/isDefaultNamespace)

#### Parameters

##### namespace

`string` | `null`

#### Returns

`boolean`

#### Inherited from

`Document.isDefaultNamespace`

***

### isEqualNode()

> **isEqualNode**(`otherNode`): `boolean`

Defined in: node\_modules/.pnpm/typescript@5.9.3/node\_modules/typescript/lib/lib.dom.d.ts:21796

The **`isEqualNode()`** method of the Node interface tests whether two nodes are equal.

[MDN Reference](https://developer.mozilla.org/docs/Web/API/Node/isEqualNode)

#### Parameters

##### otherNode

`Node` | `null`

#### Returns

`boolean`

#### Inherited from

`Document.isEqualNode`

***

### isSameNode()

> **isSameNode**(`otherNode`): `boolean`

Defined in: node\_modules/.pnpm/typescript@5.9.3/node\_modules/typescript/lib/lib.dom.d.ts:21802

The **`isSameNode()`** method of the Node interface is a legacy alias the for the `===` strict equality operator.

[MDN Reference](https://developer.mozilla.org/docs/Web/API/Node/isSameNode)

#### Parameters

##### otherNode

`Node` | `null`

#### Returns

`boolean`

#### Inherited from

`Document.isSameNode`

***

### lookupNamespaceURI()

> **lookupNamespaceURI**(`prefix`): `string` \| `null`

Defined in: node\_modules/.pnpm/typescript@5.9.3/node\_modules/typescript/lib/lib.dom.d.ts:21808

The **`lookupNamespaceURI()`** method of the Node interface takes a prefix as parameter and returns the namespace URI associated with it on the given node if found (and `null` if not).

[MDN Reference](https://developer.mozilla.org/docs/Web/API/Node/lookupNamespaceURI)

#### Parameters

##### prefix

`string` | `null`

#### Returns

`string` \| `null`

#### Inherited from

`Document.lookupNamespaceURI`

***

### lookupPrefix()

> **lookupPrefix**(`namespace`): `string` \| `null`

Defined in: node\_modules/.pnpm/typescript@5.9.3/node\_modules/typescript/lib/lib.dom.d.ts:21814

The **`lookupPrefix()`** method of the Node interface returns a string containing the prefix for a given namespace URI, if present, and `null` if not.

[MDN Reference](https://developer.mozilla.org/docs/Web/API/Node/lookupPrefix)

#### Parameters

##### namespace

`string` | `null`

#### Returns

`string` \| `null`

#### Inherited from

`Document.lookupPrefix`

***

### normalize()

> **normalize**(): `void`

Defined in: node\_modules/.pnpm/typescript@5.9.3/node\_modules/typescript/lib/lib.dom.d.ts:21820

The **`normalize()`** method of the Node interface puts the specified node and all of its sub-tree into a _normalized_ form.

[MDN Reference](https://developer.mozilla.org/docs/Web/API/Node/normalize)

#### Returns

`void`

#### Inherited from

`Document.normalize`

***

### open()

#### Call Signature

> **open**(`unused1?`, `unused2?`): `Document`

Defined in: node\_modules/.pnpm/typescript@5.9.3/node\_modules/typescript/lib/lib.dom.d.ts:10338

The **`Document.open()`** method opens a document for This does come with some side effects.

[MDN Reference](https://developer.mozilla.org/docs/Web/API/Document/open)

##### Parameters

###### unused1?

`string`

###### unused2?

`string`

##### Returns

`Document`

##### Inherited from

`Document.open`

#### Call Signature

> **open**(`url`, `name`, `features`): `Window` \| `null`

Defined in: node\_modules/.pnpm/typescript@5.9.3/node\_modules/typescript/lib/lib.dom.d.ts:10339

##### Parameters

###### url

`string` | `URL`

###### name

`string`

###### features

`string`

##### Returns

`Window` \| `null`

##### Inherited from

`Document.open`

***

### prepend()

> **prepend**(...`nodes`): `void`

Defined in: node\_modules/.pnpm/typescript@5.9.3/node\_modules/typescript/lib/lib.dom.d.ts:22702

Inserts nodes before the first child of node, while replacing strings in nodes with equivalent Text nodes.

Throws a "HierarchyRequestError" DOMException if the constraints of the node tree are violated.

[MDN Reference](https://developer.mozilla.org/docs/Web/API/Document/prepend)

#### Parameters

##### nodes

...(`string` \| `Node`)[]

#### Returns

`void`

#### Inherited from

`Document.prepend`

***

### ~~queryCommandEnabled()~~

> **queryCommandEnabled**(`commandId`): `boolean`

Defined in: node\_modules/.pnpm/typescript@5.9.3/node\_modules/typescript/lib/lib.dom.d.ts:10346

The **`Document.queryCommandEnabled()`** method reports whether or not the specified editor command is enabled by the browser.

#### Parameters

##### commandId

`string`

#### Returns

`boolean`

#### Deprecated

[MDN Reference](https://developer.mozilla.org/docs/Web/API/Document/queryCommandEnabled)

#### Inherited from

`Document.queryCommandEnabled`

***

### ~~queryCommandIndeterm()~~

> **queryCommandIndeterm**(`commandId`): `boolean`

Defined in: node\_modules/.pnpm/typescript@5.9.3/node\_modules/typescript/lib/lib.dom.d.ts:10348

#### Parameters

##### commandId

`string`

#### Returns

`boolean`

#### Deprecated

#### Inherited from

`Document.queryCommandIndeterm`

***

### ~~queryCommandState()~~

> **queryCommandState**(`commandId`): `boolean`

Defined in: node\_modules/.pnpm/typescript@5.9.3/node\_modules/typescript/lib/lib.dom.d.ts:10355

The **`queryCommandState()`** method will tell you if the current selection has a certain Document.execCommand() command applied.

#### Parameters

##### commandId

`string`

#### Returns

`boolean`

#### Deprecated

[MDN Reference](https://developer.mozilla.org/docs/Web/API/Document/queryCommandState)

#### Inherited from

`Document.queryCommandState`

***

### ~~queryCommandSupported()~~

> **queryCommandSupported**(`commandId`): `boolean`

Defined in: node\_modules/.pnpm/typescript@5.9.3/node\_modules/typescript/lib/lib.dom.d.ts:10362

The **`Document.queryCommandSupported()`** method reports whether or not the specified editor command is supported by the browser.

#### Parameters

##### commandId

`string`

#### Returns

`boolean`

#### Deprecated

[MDN Reference](https://developer.mozilla.org/docs/Web/API/Document/queryCommandSupported)

#### Inherited from

`Document.queryCommandSupported`

***

### ~~queryCommandValue()~~

> **queryCommandValue**(`commandId`): `string`

Defined in: node\_modules/.pnpm/typescript@5.9.3/node\_modules/typescript/lib/lib.dom.d.ts:10364

#### Parameters

##### commandId

`string`

#### Returns

`string`

#### Deprecated

#### Inherited from

`Document.queryCommandValue`

***

### querySelector()

#### Call Signature

> **querySelector**\<`K`\>(`selectors`): `HTMLElementTagNameMap`\[`K`\] \| `null`

Defined in: node\_modules/.pnpm/typescript@5.9.3/node\_modules/typescript/lib/lib.dom.d.ts:22708

Returns the first element that is a descendant of node that matches selectors.

[MDN Reference](https://developer.mozilla.org/docs/Web/API/Document/querySelector)

##### Type Parameters

###### K

`K` *extends* keyof `HTMLElementTagNameMap`

##### Parameters

###### selectors

`K`

##### Returns

`HTMLElementTagNameMap`\[`K`\] \| `null`

##### Inherited from

`Document.querySelector`

#### Call Signature

> **querySelector**\<`K`\>(`selectors`): `SVGElementTagNameMap`\[`K`\] \| `null`

Defined in: node\_modules/.pnpm/typescript@5.9.3/node\_modules/typescript/lib/lib.dom.d.ts:22709

##### Type Parameters

###### K

`K` *extends* keyof `SVGElementTagNameMap`

##### Parameters

###### selectors

`K`

##### Returns

`SVGElementTagNameMap`\[`K`\] \| `null`

##### Inherited from

`Document.querySelector`

#### Call Signature

> **querySelector**\<`K`\>(`selectors`): `MathMLElementTagNameMap`\[`K`\] \| `null`

Defined in: node\_modules/.pnpm/typescript@5.9.3/node\_modules/typescript/lib/lib.dom.d.ts:22710

##### Type Parameters

###### K

`K` *extends* keyof `MathMLElementTagNameMap`

##### Parameters

###### selectors

`K`

##### Returns

`MathMLElementTagNameMap`\[`K`\] \| `null`

##### Inherited from

`Document.querySelector`

#### Call Signature

> **querySelector**\<`K`\>(`selectors`): `HTMLElementDeprecatedTagNameMap`\[`K`\] \| `null`

Defined in: node\_modules/.pnpm/typescript@5.9.3/node\_modules/typescript/lib/lib.dom.d.ts:22712

##### Type Parameters

###### K

`K` *extends* keyof `HTMLElementDeprecatedTagNameMap`

##### Parameters

###### selectors

`K`

##### Returns

`HTMLElementDeprecatedTagNameMap`\[`K`\] \| `null`

##### Deprecated

##### Inherited from

`Document.querySelector`

#### Call Signature

> **querySelector**\<`E`\>(`selectors`): `E` \| `null`

Defined in: node\_modules/.pnpm/typescript@5.9.3/node\_modules/typescript/lib/lib.dom.d.ts:22713

##### Type Parameters

###### E

`E` *extends* `Element` = `Element`

##### Parameters

###### selectors

`string`

##### Returns

`E` \| `null`

##### Inherited from

`Document.querySelector`

***

### querySelectorAll()

#### Call Signature

> **querySelectorAll**\<`K`\>(`selectors`): `NodeListOf`\<`HTMLElementTagNameMap`\[`K`\]\>

Defined in: node\_modules/.pnpm/typescript@5.9.3/node\_modules/typescript/lib/lib.dom.d.ts:22719

Returns all element descendants of node that match selectors.

[MDN Reference](https://developer.mozilla.org/docs/Web/API/Document/querySelectorAll)

##### Type Parameters

###### K

`K` *extends* keyof `HTMLElementTagNameMap`

##### Parameters

###### selectors

`K`

##### Returns

`NodeListOf`\<`HTMLElementTagNameMap`\[`K`\]\>

##### Inherited from

`Document.querySelectorAll`

#### Call Signature

> **querySelectorAll**\<`K`\>(`selectors`): `NodeListOf`\<`SVGElementTagNameMap`\[`K`\]\>

Defined in: node\_modules/.pnpm/typescript@5.9.3/node\_modules/typescript/lib/lib.dom.d.ts:22720

##### Type Parameters

###### K

`K` *extends* keyof `SVGElementTagNameMap`

##### Parameters

###### selectors

`K`

##### Returns

`NodeListOf`\<`SVGElementTagNameMap`\[`K`\]\>

##### Inherited from

`Document.querySelectorAll`

#### Call Signature

> **querySelectorAll**\<`K`\>(`selectors`): `NodeListOf`\<`MathMLElementTagNameMap`\[`K`\]\>

Defined in: node\_modules/.pnpm/typescript@5.9.3/node\_modules/typescript/lib/lib.dom.d.ts:22721

##### Type Parameters

###### K

`K` *extends* keyof `MathMLElementTagNameMap`

##### Parameters

###### selectors

`K`

##### Returns

`NodeListOf`\<`MathMLElementTagNameMap`\[`K`\]\>

##### Inherited from

`Document.querySelectorAll`

#### Call Signature

> **querySelectorAll**\<`K`\>(`selectors`): `NodeListOf`\<`HTMLElementDeprecatedTagNameMap`\[`K`\]\>

Defined in: node\_modules/.pnpm/typescript@5.9.3/node\_modules/typescript/lib/lib.dom.d.ts:22723

##### Type Parameters

###### K

`K` *extends* keyof `HTMLElementDeprecatedTagNameMap`

##### Parameters

###### selectors

`K`

##### Returns

`NodeListOf`\<`HTMLElementDeprecatedTagNameMap`\[`K`\]\>

##### Deprecated

##### Inherited from

`Document.querySelectorAll`

#### Call Signature

> **querySelectorAll**\<`E`\>(`selectors`): `NodeListOf`\<`E`\>

Defined in: node\_modules/.pnpm/typescript@5.9.3/node\_modules/typescript/lib/lib.dom.d.ts:22724

##### Type Parameters

###### E

`E` *extends* `Element` = `Element`

##### Parameters

###### selectors

`string`

##### Returns

`NodeListOf`\<`E`\>

##### Inherited from

`Document.querySelectorAll`

***

### ~~releaseEvents()~~

> **releaseEvents**(): `void`

Defined in: node\_modules/.pnpm/typescript@5.9.3/node\_modules/typescript/lib/lib.dom.d.ts:10366

#### Returns

`void`

#### Deprecated

#### Inherited from

`Document.releaseEvents`

***

### removeChild()

> **removeChild**\<`T`\>(`child`): `T`

Defined in: node\_modules/.pnpm/typescript@5.9.3/node\_modules/typescript/lib/lib.dom.d.ts:21826

The **`removeChild()`** method of the Node interface removes a child node from the DOM and returns the removed node.

[MDN Reference](https://developer.mozilla.org/docs/Web/API/Node/removeChild)

#### Type Parameters

##### T

`T` *extends* `Node`

#### Parameters

##### child

`T`

#### Returns

`T`

#### Inherited from

`Document.removeChild`

***

### removeEventListener()

#### Call Signature

> **removeEventListener**\<`K`\>(`type`, `listener`, `options?`): `void`

Defined in: node\_modules/.pnpm/typescript@5.9.3/node\_modules/typescript/lib/lib.dom.d.ts:10396

The **`removeEventListener()`** method of the EventTarget interface removes an event listener previously registered with EventTarget.addEventListener() from the target.

[MDN Reference](https://developer.mozilla.org/docs/Web/API/EventTarget/removeEventListener)

##### Type Parameters

###### K

`K` *extends* keyof `DocumentEventMap`

##### Parameters

###### type

`K`

###### listener

(`this`, `ev`) => `any`

###### options?

`boolean` | `EventListenerOptions`

##### Returns

`void`

##### Inherited from

`Document.removeEventListener`

#### Call Signature

> **removeEventListener**(`type`, `listener`, `options?`): `void`

Defined in: node\_modules/.pnpm/typescript@5.9.3/node\_modules/typescript/lib/lib.dom.d.ts:10397

The **`removeEventListener()`** method of the EventTarget interface removes an event listener previously registered with EventTarget.addEventListener() from the target.

[MDN Reference](https://developer.mozilla.org/docs/Web/API/EventTarget/removeEventListener)

##### Parameters

###### type

`string`

###### listener

`EventListenerOrEventListenerObject`

###### options?

`boolean` | `EventListenerOptions`

##### Returns

`void`

##### Inherited from

`Document.removeEventListener`

***

### replaceChild()

> **replaceChild**\<`T`\>(`node`, `child`): `T`

Defined in: node\_modules/.pnpm/typescript@5.9.3/node\_modules/typescript/lib/lib.dom.d.ts:21832

The **`replaceChild()`** method of the Node interface replaces a child node within the given (parent) node.

[MDN Reference](https://developer.mozilla.org/docs/Web/API/Node/replaceChild)

#### Type Parameters

##### T

`T` *extends* `Node`

#### Parameters

##### node

`Node`

##### child

`T`

#### Returns

`T`

#### Inherited from

`Document.replaceChild`

***

### replaceChildren()

> **replaceChildren**(...`nodes`): `void`

Defined in: node\_modules/.pnpm/typescript@5.9.3/node\_modules/typescript/lib/lib.dom.d.ts:22732

Replace all children of node with nodes, while replacing strings in nodes with equivalent Text nodes.

Throws a "HierarchyRequestError" DOMException if the constraints of the node tree are violated.

[MDN Reference](https://developer.mozilla.org/docs/Web/API/Document/replaceChildren)

#### Parameters

##### nodes

...(`string` \| `Node`)[]

#### Returns

`void`

#### Inherited from

`Document.replaceChildren`

***

### requestStorageAccess()

> **requestStorageAccess**(): `Promise`\<`void`\>

Defined in: node\_modules/.pnpm/typescript@5.9.3/node\_modules/typescript/lib/lib.dom.d.ts:10372

The **`requestStorageAccess()`** method of the Document interface allows content loaded in a third-party context (i.e., embedded in an iframe) to request access to third-party cookies and unpartitioned state.

[MDN Reference](https://developer.mozilla.org/docs/Web/API/Document/requestStorageAccess)

#### Returns

`Promise`\<`void`\>

#### Inherited from

`Document.requestStorageAccess`

***

### startViewTransition()

> **startViewTransition**(`callbackOptions?`): `ViewTransition`

Defined in: node\_modules/.pnpm/typescript@5.9.3/node\_modules/typescript/lib/lib.dom.d.ts:10378

The **`startViewTransition()`** method of the Document interface starts a new same-document (SPA) view transition and returns a ViewTransition object to represent it.

[MDN Reference](https://developer.mozilla.org/docs/Web/API/Document/startViewTransition)

#### Parameters

##### callbackOptions?

`ViewTransitionUpdateCallback` | `StartViewTransitionOptions`

#### Returns

`ViewTransition`

#### Inherited from

`Document.startViewTransition`

***

### ~~write()~~

> **write**(...`text`): `void`

Defined in: node\_modules/.pnpm/typescript@5.9.3/node\_modules/typescript/lib/lib.dom.d.ts:10385

The **`write()`** method of the Document interface writes text in one or more TrustedHTML or string parameters to a document stream opened by document.open().

#### Parameters

##### text

...`string`[]

#### Returns

`void`

#### Deprecated

[MDN Reference](https://developer.mozilla.org/docs/Web/API/Document/write)

#### Inherited from

`Document.write`

***

### writeln()

> **writeln**(...`text`): `void`

Defined in: node\_modules/.pnpm/typescript@5.9.3/node\_modules/typescript/lib/lib.dom.d.ts:10391

The **`writeln()`** method of the Document interface writes text in one or more TrustedHTML or string parameters to a document stream opened by document.open(), followed by a newline character.

[MDN Reference](https://developer.mozilla.org/docs/Web/API/Document/writeln)

#### Parameters

##### text

...`string`[]

#### Returns

`void`

#### Inherited from

`Document.writeln`
