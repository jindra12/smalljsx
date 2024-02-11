type ElementType<K extends keyof HTMLElementTagNameMap> = Partial<
    Omit<
        HTMLElementTagNameMap[K],
        keyof ParentNode | BannedKeys | BannedKeysSpecific<K>
    >
>;
type BannedKeys =
    | "align"
    | "accessKey"
    | "accessKeyLabel"
    | "after"
    | "animate"
    | "blur"
    | "focus"
    | "assignedSlot"
    | "innerText"
    | "offsetHeight"
    | "offsetLeft"
    | "offsetTop"
    | "offsetWidth"
    | "outerText"
    | "attachInternals"
    | "click"
    | "hidePopover"
    | "showPopover"
    | "togglePopover"
    | "addEventListener"
    | "removeEventListener"
    | "classList"
    | "attributes"
    | "clientHeight"
    | "clientLeft"
    | "clientTop"
    | "clientWidth"
    | "localName"
    | "namespaceURI"
    | "ownerDocument"
    | "part"
    | "prefix"
    | "scrollHeight"
    | "scrollLeft"
    | "scrollTop"
    | "scrollWith"
    | "shadowRoot"
    | "tagName"
    | "attachShadow"
    | "checkVisibility"
    | "closest"
    | "computedStyleMap"
    | "getAttribute"
    | "getAttributeNS"
    | "getAttributeNames"
    | "getAttributeNode"
    | "getAttributeNodeNS"
    | "getBoundingClientRect"
    | "getClientRects"
    | "getElementsByClassName"
    | "getElementsByTagName"
    | "getElementsByTagNameNS"
    | "hasAttribute"
    | "hasAttributeNS"
    | "offsetParent"
    | "hasAttributes"
    | "hasPointerCapture"
    | "insertAdjacentElement"
    | "insertAdjacentHTML"
    | "insertAdjacentText"
    | "matches"
    | "releasePointerCapture"
    | "removeAttribute"
    | "removeAttributeNS"
    | "removeAttributeNode"
    | "requestFullscreen"
    | "requestPointerLock"
    | "scroll"
    | "scrollBy"
    | "scrollTo"
    | "scrollWidth"
    | "scrollIntoView"
    | "setAttribute"
    | "setAttributeNS"
    | "setAttributeNode"
    | "setAttributeNodeNS"
    | "setPointerCapture"
    | "toggleAttribute"
    | "webkitMatchesSelector"
    | "before"
    | "remove"
    | "replaceWith"
    | "outerHTML"
    | "nextElementSibling"
    | "previousElementSibling"
    | "getAnimations"
    | "attributeStyleMap";

type ValidationBannedKeys =
| "form"
| "labels"
| "validationMessage"
| "validity"
| "willValidate"
| "checkValidity"
| "reportValidity"
| "setCustomValidity";

type BannedKeysSpecific<K extends keyof HTMLElementTagNameMap> =
    K extends "input"
    ?
    | ValidationBannedKeys
    | "files"
    | "list"
    | "useMap"
    | "webkitEntries"
    | "webkitdirectory"
    | "select"
    | "setCustomValidity"
    | "setRangeText"
    | "setSelectionRange"
    | "showPicker"
    | "stepDown"
    | "stepUp"
    : K extends "a"
    ?
    | "relList"
    | "text"
    | "charset"
    | "coords"
    | "name"
    | "shape"
    : K extends "area"
    ?
    | "relList"
    : K extends "br"
    ? "clear"
    : K extends "body"
    ?
    | "aLink"
    | "link"
    | "text"
    | "vLink"
    : K extends "button"
    ? ValidationBannedKeys
    : K extends "canvas"
    ?
    | "captureStream"
    | "getContext"
    | "toBlob"
    | "toDataURL"
    | "transferControlToOffscreen"
    : K extends "datalist"
    ?
    | "options"
    : K extends "dialog"
    ?
    | "close"
    | "show"
    | "showModal"
    : K extends "embed"
    ?
    | "getSVGDocument"
    : K extends "fieldset"
    ?
    | "elements"
    | ValidationBannedKeys
    : K extends "form"
    ?
    | "elements"
    | "length"
    | "relList"
    | "reset"
    | "submit"
    | number
    | ValidationBannedKeys
    | "requestSubmit"
    : K extends "iframe"
    ?
    | "contentDocument"
    | "contentWindow"
    | "sandbox"
    | "getSVGDocument"
    : K extends "img"
    ?
    | "complete"
    | "currentSrc"
    | "longDesc"
    | "name"
    | "naturalHeight"
    | "naturalWidth"
    | "decode"
    : K extends "label"
    ?
    | "control"
    | "form"
    : K extends "label"
    ?
    | "form"
    : K extends "link"
    ?
    | "relList"
    : K extends "map"
    ?
    | "areas"
    : K extends "meter"
    ?
    | "labels"
    : K extends "object"
    ?
    | ValidationBannedKeys
    | "contentDocument"
    | "contentWindow"
    | "getSVGDocument"
    : K extends "option"
    ?
    | "index"
    : K extends "output"
    ?
    | ValidationBannedKeys
    | "htmlFor"
    | "type"
    : K extends "progress"
    ?
    | "labels"
    | "position"
    : K extends "select"
    ?
    | ValidationBannedKeys
    | "options"
    | "selectedOptions"
    | "type"
    | "add"
    | "item"
    | "namedItem"
    | "remove"
    | number
    : K extends "slot"
    ?
    | "assign"
    | "assignedElements"
    | "assignedNodes"
    : K extends "table"
    ?
    | "rows"
    | "tBodies"
    | "tFoot"
    | "tHead"
    | "createCaption"
    | "createTBody"
    | "createTFoot"
    | "createTHead"
    | "deleteCaption"
    | "deleteRow"
    | "deleteTFoot"
    | "deleteTHead"
    | "insertRow"
    : K extends ("tbody" | "tfoot" | "thead")
    ?
    | "rows"
    | "deleteRow"
    | "insertRow"
    : K extends ("td" | "th")
    ?
    | "cellIndex"
    : K extends "template"
    ?
    | "content"
    : K extends "textarea"
    ?
    | ValidationBannedKeys
    | "textLength"
    | "type"
    | "select"
    | "setRangeText"
    | "setSelectionRange"
    : K extends "tr"
    ?
    | "cells"
    | "rowIndex"
    | "sectionRowIndex"
    | "deleteCell"
    | "insertCell"
    : K extends "track"
    ?
    | "readyState"
    | "track"
    | "NONE"
    | "LOADING"
    | "LOADED"
    | "ERROR"
    : K extends "video"
    ?
    | "videoHeight"
    | "videoWidth"
    | "cancelVideoFrameCallback"
    | "getVideoPlaybackQuality"
    | "requestPictureInPicture"
    | "requestVideoFrameCallback"
    : never;

type ChildType = HTMLElement[] | HTMLElement | string | string[] | number | number[] | boolean | boolean[] | undefined;

declare namespace JSX {
    type IntrinsicElements = {
        [K in keyof HTMLElementTagNameMap]: (ElementType<K> & {
            children?: ChildType | ChildType[];
        });
    };
    type Element = HTMLElement;
    interface ElementChildrenAttribute {
        children: {}
    }
}

type RenderingChildren = (() => HTMLElement) | string | number | boolean | null | undefined;
type ResolvedChildren = HTMLElement | string | number | boolean | null | undefined;

declare var h: <T extends object>(
    component: string | ((props?: T) => JSX.Element),
    props?: T | null,
    ...children: RenderingChildren[]
) => () => HTMLElement;
