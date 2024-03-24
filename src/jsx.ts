declare global {
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
        ? "relList" | "text" | "charset" | "coords" | "name" | "shape"
        : K extends "area"
        ? "relList"
        : K extends "br"
        ? "clear"
        : K extends "body"
        ? "aLink" | "link" | "text" | "vLink"
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
        ? "options"
        : K extends "dialog"
        ? "close" | "show" | "showModal"
        : K extends "embed"
        ? "getSVGDocument"
        : K extends "fieldset"
        ? "elements" | ValidationBannedKeys
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
        ? "contentDocument" | "contentWindow" | "sandbox" | "getSVGDocument"
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
        ? "control" | "form"
        : K extends "label"
        ? "form"
        : K extends "link"
        ? "relList"
        : K extends "map"
        ? "areas"
        : K extends "meter"
        ? "labels"
        : K extends "object"
        ?
        | ValidationBannedKeys
        | "contentDocument"
        | "contentWindow"
        | "getSVGDocument"
        : K extends "option"
        ? "index"
        : K extends "output"
        ? ValidationBannedKeys | "htmlFor" | "type"
        : K extends "progress"
        ? "labels" | "position"
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
        ? "assign" | "assignedElements" | "assignedNodes"
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
        : K extends "tbody" | "tfoot" | "thead"
        ? "rows" | "deleteRow" | "insertRow"
        : K extends "td" | "th"
        ? "cellIndex"
        : K extends "template"
        ? "content"
        : K extends "textarea"
        ?
        | ValidationBannedKeys
        | "textLength"
        | "type"
        | "select"
        | "setRangeText"
        | "setSelectionRange"
        : K extends "tr"
        ? "cells" | "rowIndex" | "sectionRowIndex" | "deleteCell" | "insertCell"
        : K extends "track"
        ? "readyState" | "track" | "NONE" | "LOADING" | "LOADED" | "ERROR"
        : K extends "video"
        ?
        | "videoHeight"
        | "videoWidth"
        | "cancelVideoFrameCallback"
        | "getVideoPlaybackQuality"
        | "requestPictureInPicture"
        | "requestVideoFrameCallback"
        : never;

    interface CorrectedFormType extends HTMLElement {
        /**
         * Sets or retrieves a list of character encodings for input data that must be accepted by the server processing the form.
         *
         * [MDN Reference](https://developer.mozilla.org/docs/Web/API/HTMLFormElement/acceptCharset)
         */
        acceptCharset: string;
        /**
         * Sets or retrieves the URL to which the form content is sent for processing.
         *
         * [MDN Reference](https://developer.mozilla.org/docs/Web/API/HTMLFormElement/action)
         */
        action: string;
        /**
         * Specifies whether autocomplete is applied to an editable text field.
         *
         * [MDN Reference](https://developer.mozilla.org/docs/Web/API/HTMLFormElement/autocomplete)
         */
        autocomplete: AutoFillBase;
        /**
         * Sets or retrieves the MIME encoding for the form.
         *
         * [MDN Reference](https://developer.mozilla.org/docs/Web/API/HTMLFormElement/encoding)
         */
        encoding: string;
        /**
         * Sets or retrieves the encoding type for the form.
         *
         * [MDN Reference](https://developer.mozilla.org/docs/Web/API/HTMLFormElement/enctype)
         */
        enctype: string;
        /**
         * Sets or retrieves how to send the form data to the server.
         *
         * [MDN Reference](https://developer.mozilla.org/docs/Web/API/HTMLFormElement/method)
         */
        method: string;
        /**
         * Sets or retrieves the name of the object.
         *
         * [MDN Reference](https://developer.mozilla.org/docs/Web/API/HTMLFormElement/name)
         */
        name: string;
        /**
         * Designates a form that is not validated when submitted.
         *
         * [MDN Reference](https://developer.mozilla.org/docs/Web/API/HTMLFormElement/noValidate)
         */
        noValidate: boolean;
        rel: string;
        /**
         * Sets or retrieves the window or frame at which to target content.
         *
         * [MDN Reference](https://developer.mozilla.org/docs/Web/API/HTMLFormElement/target)
         */
        target: string;
    }

    type MaybeArray<T> = T | T[] | (T | T[])[];
    type MaybeFunction<T> = T | (() => T);

    namespace JSX {
        type ElementType<K extends keyof HTMLElementTagNameMap> = Partial<
            Omit<
                K extends "form" ? CorrectedFormType : HTMLElementTagNameMap[K],
                keyof ParentNode | BannedKeys | BannedKeysSpecific<K>
            >
        >;
        type IntrinsicElements = {
            [K in keyof HTMLElementTagNameMap]: ElementType<K> & {
                children?: Element | Element[] | (Element | Element[])[] | Element[][];
                ref?: { current?: HTMLElementTagNameMap[K] };
            };
        };
        type Element = MaybeArray<
            MaybeFunction<
                | HTMLElement
                | DocumentFragment
                | string
                | number
                | boolean
                | null
                | undefined
            >
        >;
        interface ElementChildrenAttribute {
            children: {};
        }
        type ResolvedChildren =
            | HTMLElement
            | DocumentFragment
            | string
            | number
            | boolean
            | null
            | undefined;
        type Context = {
            startComponentStack: <T>(
                component: string | ((props: T) => HTMLElement),
                key?: string
            ) => void;
            endComponentStack: () => void;
        };
        class Fragment {
            children?: Element[];
        }
    }

    var Fragment: JSX.Fragment;

    var h: <T extends object>(
        component: string | ((props?: T) => HTMLElement),
        props?: T | null,
        ...children: JSX.Element[]
    ) => () => HTMLElement | JSX.Fragment;
}

export {}