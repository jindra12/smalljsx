const dispatchUpdate = () => {
    const event = new CustomEvent("smalljsx-update");
    document.dispatchEvent(event);
};

type RenderedType = Text | HTMLElement | DocumentFragment;
type ChildType<T, TOriginal> = T extends { children: any }
    ? T & { key?: string | number }
    : T & { children?: TOriginal; key?: string | number };
export type Component<T extends object = {}> = (
    props: ChildType<T, never>
) => JSX.Element;
export type ParentComponent<T extends object = {}> = (
    props: ChildType<T, JSX.Element>
) => JSX.Element;

class Fragment { }

const isFragmentConstructor = (
    component: any
): component is new () => Fragment => component === Fragment;

let count = 0;
const getUniqueId = () => {
    count++;
    return `id__${count}`;
};

class HooksStack {
    stored: any[] = [];
    postActions: Array<() => void> = [];
    unmountActions: Array<() => void> = [];
    index = 0;
    onRerender?: () => void;

    constructor(onRerender?: () => void) {
        this.onRerender = onRerender;
    }

    reset = () => {
        if (this.index !== this.stored.length) {
            throw `Conditional calls to hooks not allowed!`;
        }
        this.postActions = [];
        this.index = 0;
    };

    storeStack = (initialState: any) => {
        if (this.index < this.stored.length) {
            this.stored[this.index] = initialState;
        } else {
            this.stored.push(initialState);
        }
        this.index++;
    };

    updateStack = (index: number, state: any, rerender: boolean) => {
        this.stored[index] = state;
        if (rerender) {
            this.onRerender?.();
        }
    };

    hasStack = () => this.index < this.stored.length;

    peekStack = () => this.stored[this.index];
}

interface StateHelper {
    useState<T>(
        initialState: T | (() => T)
    ): [T, (value: T | ((prevValue: T) => T)) => void];
    useState<T>(): [T | undefined, (value: T | ((prevValue: T) => T)) => void];
}

type StateFn = StateHelper["useState"];

export const useState: StateFn = <T>(
    initialState?: T | (() => T)
): [T, (value: T | ((prevValue: T) => T)) => void] => {
    const hooks = context.pointer.hooks;
    const index = hooks.index;
    const currentState = hooks.hasStack()
        ? hooks.peekStack()
        : typeof initialState === "function"
            ? (initialState as Function)()
            : initialState;
    hooks.storeStack(currentState);
    return [
        currentState,
        (nextValue) => {
            const nextState =
                typeof nextValue === "function"
                    ? (nextValue as any)(currentState)
                    : nextValue;
            hooks.updateStack(index, nextState, currentState !== nextState);
        },
    ];
};

interface RefHelper {
    useRef<T>(): { current: T | undefined };
    useRef<T>(initialRef: T | (() => T) | undefined): { current: T };
}

type RefFn = RefHelper["useRef"];

export const useRef: RefFn = <T>(
    initialRef?: T | (() => T) | undefined
): { current: T | undefined } => {
    const hooks = context.pointer.hooks;
    const index = hooks.index;
    const currentRef = hooks.hasStack()
        ? hooks.peekStack()
        : typeof initialRef === "function"
            ? (initialRef as Function)()
            : initialRef;
    hooks.storeStack(currentRef);
    return {
        get current() {
            return hooks.stored[index];
        },
        set current(value: T) {
            hooks.updateStack(index, value, false);
        },
    };
};

export type Ref<T> = { current: T };

const getHasChangedDeps = (
    deps: any[],
    depsGetter: (deps: any) => any[],
    depsSetter: (deps: any[]) => any
) => {
    const hooks = context.pointer.hooks;
    let hasChangedDeps = false;
    if (hooks.hasStack()) {
        const currentDeps: any[] = depsGetter(hooks.peekStack());
        if (currentDeps.length !== deps.length) {
            throw `Deps in useEffect must always have the same length`;
        }
        for (let i = 0; i < currentDeps.length; i++) {
            if (hasChangedDeps) {
                break;
            }
            hasChangedDeps = currentDeps[i] !== deps[i];
        }
    } else {
        hasChangedDeps = true;
    }
    const currentStack =
        hooks.hasStack() && !hasChangedDeps ? hooks.peekStack() : depsSetter(deps);
    hooks.storeStack(currentStack);
    return hasChangedDeps;
};

export const useEffect = (
    effect: () => void,
    type: "before-render" | "after-render",
    deps: any[]
) => {
    const hooks = context.pointer.hooks;
    const hasChangedDeps = getHasChangedDeps(
        deps,
        (deps) => deps,
        (deps) => deps
    );
    if (hasChangedDeps) {
        if (type === "before-render") {
            effect();
        } else {
            hooks.postActions.push(effect);
        }
    }
};

export const useMemo = <T>(value: () => T, deps: any[]) => {
    interface DepsObject {
        value: T;
        deps: any[];
    }
    const hooks = context.pointer.hooks;
    let nextValue: T = hooks.peekStack()?.value;
    getHasChangedDeps(
        deps,
        (deps: DepsObject) => deps.deps,
        (deps: any[]): DepsObject => {
            nextValue = value();
            return {
                value: nextValue,
                deps: deps,
            };
        }
    );
    return nextValue;
};

export interface TreeContext<T> {
    defaultValue: T;
    id: string;
}

interface ContextHelper {
    createContext<T>(defaultValue: T): TreeContext<T>;
    createContext<T>(): TreeContext<T | undefined>;
}

type ContextType = ContextHelper["createContext"];

export const createContext: ContextType = <T>(defaultValue?: T | undefined) => {
    const context = {
        defaultValue: defaultValue,
        id: getUniqueId(),
    };
    return context;
};

export const useSetContext = <T>(
    treeContext: TreeContext<T>,
    nextState?: T
) => {
    const treeContexts = context.pointer.treeContext;
    treeContexts[treeContext.id] = nextState || treeContext.defaultValue;
};

export const useContext = <T>(treeContext: TreeContext<T>): T => {
    const treeContexts = context.pointer.treeContext;
    return treeContexts[treeContext.id] || treeContext.defaultValue;
};

export const useCallback = <T extends (...args: any[]) => any>(
    value: T,
    deps: any[]
) => useMemo(() => value, deps);

export const useMountEffect = (effect: () => void) =>
    useEffect(effect, "before-render", []);

export const useEachRenderEffect = (
    effect: () => void,
    type: "before-render" | "after-render"
) => useEffect(effect, type, [getUniqueId()]);

export const useUnmountEffect = (effect: () => void) => {
    const hooks = context.pointer.hooks;
    if (!hooks.hasStack()) {
        hooks.unmountActions.push(effect);
    }
    hooks.storeStack("unmount");
};

export const usePortal = (
    queryOrElement: string | HTMLElement,
    rewrite = false
) => {
    const hooks = context.pointer.hooks;
    const normalized =
        typeof queryOrElement === "string"
            ? document.querySelector(queryOrElement)
            : queryOrElement;
    hooks.storeStack({ portal: normalized, rewrite: rewrite });
};

type Stack = {
    key: string;
    component: Function | string;
    children: Record<string, Stack>;
    childrenCount: number;
    toUpdateIndex: number;
    updated: Record<string, true>;
    parent?: Stack;
    hooks: HooksStack;
    props: any;
    rawChildren: JSX.Element[];
    rendered?: RenderedType;
    treeContext: Record<string, any>;
};

const isPortal = (hook: any): hook is { portal: HTMLElement } =>
    Boolean(hook.portal instanceof HTMLElement);

class Context {
    root: Stack = Context.createRoot();
    postUpdateActions: Array<() => void> = [];
    pointer: Stack;

    private static createRoot = (): Stack => {
        return {
            key: "root",
            component: "root",
            props: {},
            rawChildren: [],
            children: {},
            toUpdateIndex: 0,
            childrenCount: 0,
            updated: {},
            hooks: new HooksStack(),
            treeContext: {},
        };
    };

    private createUpdate = (
        stack: () => Stack,
        onRerender?: (stack: Stack) => () => void
    ) => {
        return () => {
            if (onRerender) {
                this.postUpdateActions.push(onRerender(stack()));
                dispatchUpdate();
            }
        };
    };

    private collectUnmountHooks = (child: Stack) => {
        const acc: Array<() => void> = [];
        acc.push(...child.hooks.unmountActions);
        for (const key in child.children) {
            acc.push(...this.collectUnmountHooks(child.children[key]));
        }
        return acc;
    };

    constructor() {
        this.pointer = this.root;
    }

    startComponentStack = <T>(
        component: Function | string,
        props: T | null,
        children: JSX.Element[],
        hasCorrectPointer: boolean,
        key?: string,
        onRerender?: (stack: Stack) => () => void
    ) => {
        if (hasCorrectPointer) {
            const ptr = this.pointer;
            this.pointer.hooks.onRerender = this.createUpdate(() => ptr, onRerender);
            this.pointer.updated = {};
            return;
        }
        const prevIndex = key || this.pointer.toUpdateIndex;
        const previous = this.pointer.children[prevIndex];
        if (previous && previous.component === component) {
            if (!key) {
                this.pointer.toUpdateIndex++;
            }
            this.pointer = previous;
            this.pointer.props = props;
            this.pointer.rawChildren = children;
            this.pointer.updated = {};
            this.pointer.parent!.updated[prevIndex] = true;
        } else {
            const nextKey = key || this.pointer.childrenCount.toString() || "";
            const nextStack: Stack = {
                key: nextKey,
                children: {},
                childrenCount: 0,
                component: component,
                toUpdateIndex: 0,
                props: props,
                rawChildren: children,
                updated: {},
                parent: this.pointer,
                hooks: new HooksStack(this.createUpdate(() => nextStack, onRerender)),
                treeContext: {
                    ...this.pointer.treeContext,
                },
            };
            this.pointer.children[nextStack.key] = nextStack;
            this.pointer.childrenCount++;
            this.pointer = nextStack;
            this.pointer.parent!.updated[nextKey] = true;
        }
    };
    processJSXToHtml = (element: JSX.Element): RenderedType => {
        const executed = typeof element === "function" ? element() : element;
        const portal = this.pointer.hooks.stored.find(isPortal);
        const toRender =
            executed instanceof HTMLElement || executed instanceof DocumentFragment
                ? executed
                : document.createTextNode(executed?.toString() || "");

        if (portal) {
            portal.portal.innerHTML = "";
            portal.portal.appendChild(toRender);
            const placeholder = document.createTextNode("");
            if (!this.pointer.rendered) {
                this.pointer.rendered = placeholder;
            }
            return placeholder;
        }
        if (!this.pointer.rendered) {
            this.pointer.rendered = toRender;
        }
        return toRender;
    };
    endComponentStack = () => {
        for (const key in this.pointer.children) {
            const child = this.pointer.children[key];
            if (!this.pointer.updated[child.key]) {
                this.postUpdateActions.push(...this.collectUnmountHooks(child));
                this.pointer.childrenCount--;
                delete this.pointer.children[key];
            }
        }
        const postActions = this.pointer.hooks.postActions;
        this.postUpdateActions.push(...postActions);
        this.pointer.hooks.reset();
        this.pointer.toUpdateIndex = 0;
        this.pointer = this.pointer.parent!;

        if (postActions.length > 0) {
            dispatchUpdate();
        }
    };
    reset = () => {
        this.root = Context.createRoot();
        this.pointer = this.root;
        this.postUpdateActions = [];
    };
}

let context = new Context();

export const __reset = () => context.reset();
export const __context = context;

const populateFragment = (
    children: (Text | HTMLElement | DocumentFragment)[]
) => {
    const fragment = document.createDocumentFragment();
    for (let i = 0; i < children.length; i++) {
        appendChild(fragment, children[i]);
    }
    return fragment;
};

const executeChildren = (children: JSX.Element[]) => {
    const acc: JSX.ResolvedChildren[] = [];
    const execute = (children: JSX.Element[]) => {
        for (let i = 0; i < children.length; i++) {
            const child = children[i];
            const executed = typeof child === "function" ? child() : child;
            if (Array.isArray(executed)) {
                execute(executed);
            } else {
                acc.push(executed);
            }
        }
    };
    execute(children);
    return acc;
};

const resolveChildren = (htmlTag: HTMLElement, children: JSX.Element[]) => {
    const executed = executeChildren(children);
    const appendChildren = (executed: JSX.ResolvedChildren[]) => {
        for (let i = 0; i < executed.length; i++) {
            const child = executed[i];
            if (Array.isArray(child)) {
                appendChildren(child);
            } else if (child && typeof child === "object") {
                appendChild(htmlTag, child);
            } else {
                appendChild(htmlTag, document.createTextNode(child?.toString() || ""));
            }
        }
    };
    appendChildren(executed);
};

const resolveFragmentChildren = (children: JSX.Element[]) => {
    const executed = executeChildren(children);
    const accumulator: RenderedType[] = [];
    const appendChildren = (executed: JSX.ResolvedChildren[]) => {
        for (let i = 0; i < executed.length; i++) {
            const child = executed[i];
            if (Array.isArray(child)) {
                appendChildren(child);
            } else if (child && typeof child === "object") {
                accumulator.push(child);
            } else {
                accumulator.push(document.createTextNode(child?.toString() || ""));
            }
        }
    };
    appendChildren(executed);
    return accumulator;
};

const createTag = <T>(
    component: string,
    props: T | null,
    children: JSX.Element[]
): HTMLElement => {
    const htmlTag = document.createElement(component);
    for (const key in props || {}) {
        if (key !== "ref" && key !== "key" && key !== "children") {
            if (key.startsWith("on")) {
                htmlTag.addEventListener(key.slice(2), (props as any)[key]);
            } else {
                try {
                    (htmlTag as any)[key] = (props as any)[key];
                } catch {
                    htmlTag.setAttribute(key, (props as any)[key]?.toString() || "");
                }
            }
        }
    }
    context.startComponentStack(
        component,
        props,
        children,
        (props as any)?.key?.toString()
    );
    resolveChildren(htmlTag, children);
    if ((props as any)?.ref) {
        (props as any).ref.current = htmlTag;
    }
    context.endComponentStack();
    return htmlTag;
};

const createFragment = <T>(props: T | null, children: JSX.Element[]) => {
    context.startComponentStack(
        "fragment",
        props,
        children,
        (props as any)?.key?.toString()
    );
    const resolved = resolveFragmentChildren(children);
    const fragment = populateFragment(resolved);
    context.endComponentStack();
    return fragment;
};

const getChildProp = (children: JSX.Element[]) => {
    if (Array.isArray(children) && children.length === 1) {
        const singleChild = children[0];
        if (
            typeof singleChild === "function" &&
            !isMarkedComponent(singleChild)
        ) {
            return singleChild;
        }
    }
    return executeChildren(children);
};

const getCopiedProps = <T>(props: T | null, children: JSX.Element[]) => {
    const copiedProps = Object.assign({}, props || {}) as any as T;
    Object.defineProperty(copiedProps, "children", {
        get() {
            return getChildProp(children);
        },
    });
    return copiedProps;
};

const createComponent = <T>(
    component: (props?: T) => JSX.Element,
    props: T | null,
    children: JSX.Element[],
    hasCorrectPointer = false
): HTMLElement | Text | DocumentFragment => {
    const copiedProps = getCopiedProps(props, children);
    context.startComponentStack(
        component,
        copiedProps,
        children,
        hasCorrectPointer,
        (copiedProps as any).key?.toString(),
        (stack) => () => {
            context.pointer = stack;
            const original = stack.rendered;
            const next = createComponent(
                component,
                getCopiedProps(context.pointer.props, context.pointer.rawChildren),
                context.pointer.rawChildren,
                true
            );
            replaceChild(next, original!);
            stack.rendered = next;
            return;
        }
    );
    const htmlTag = context.processJSXToHtml(component(copiedProps));
    context.endComponentStack();
    return htmlTag;
};

type ParentRendered = RenderedType & {
    __parent?: ParentRendered;
    __children?: ParentRendered[];
};

const appendChild = (parent: ParentRendered, child: ParentRendered) => {
    parent.appendChild(child);
    child.__parent = parent;
    parent.__children ||= [];
    parent.__children!.push(child);
};

const traverseUpForRealParent = (
    element: ParentRendered
): undefined | HTMLElement => {
    if (!element) {
        return undefined;
    }
    if (!(element instanceof DocumentFragment)) {
        return element as HTMLElement;
    }
    return traverseUpForRealParent(element.__parent!);
};

const traverseDownForChildren = (element: ParentRendered): ParentRendered[] => {
    return (
        element.__children?.reduce((acc: ParentRendered[], child) => {
            if (child instanceof DocumentFragment) {
                acc.push(...traverseDownForChildren(child));
            } else {
                acc.push(child);
            }
            return acc;
        }, []) || []
    );
};

const replaceChild = (next: ParentRendered, original: ParentRendered) => {
    const isOriginalFragment = original instanceof DocumentFragment;
    if (!isOriginalFragment) {
        original.parentElement?.replaceChild(next, original);
        next.__parent = original.__parent;
        original.__parent?.__children?.filter((child) =>
            child === original ? next : child
        );
    } else {
        const realParent = traverseUpForRealParent(original);
        const realChildren = traverseDownForChildren(original).filter((child) =>
            realParent?.contains(child)
        );
        if (realChildren.length > 0) {
            realParent?.replaceChild(next, realChildren[0]);
            next.__parent = original.__parent;
            original.__parent?.__children?.filter((child) =>
                child === original ? next : child
            );
            for (let i = 1; i < realChildren.length; i++) {
                realParent?.removeChild(realChildren[i]);
            }
        }
    }
};

const appendChildDeconstruction = (
    item: MaybeArray<
        | HTMLElement
        | DocumentFragment
        | string
        | number
        | boolean
        | null
        | undefined
    >,
    mount: HTMLElement
) => {
    if (Array.isArray(item)) {
        item.forEach((i) => appendChildDeconstruction(i, mount));
    }
    const element = (
        item instanceof HTMLElement || item instanceof DocumentFragment
            ? item
            : document.createTextNode(item?.toString() || "")
    ) as HTMLElement;
    appendChild(mount, element);
};

export const mount = (
    hResult: JSX.Element,
    mountPoint: string | HTMLElement,
    replace: boolean = true
) => {
    const entryPoint =
        typeof mountPoint === "string"
            ? document.querySelector<HTMLElement>(mountPoint)
            : mountPoint;
    if (!entryPoint) {
        throw `Could not find element ${mountPoint}`;
    }
    if (replace) {
        entryPoint.innerHTML = "";
    }
    if (typeof hResult === "function") {
        const exec = hResult();
        appendChildDeconstruction(exec, entryPoint);
    } else if (hResult && typeof hResult === "object") {
        appendChildDeconstruction(hResult as any, entryPoint);
    } else {
        appendChild(entryPoint, document.createTextNode(hResult?.toString() || ""));
    }
    const postUpdate = () => {
        for (let i = 0; i < context.postUpdateActions.length; i++) {
            context.postUpdateActions[i]();
        }
        context.postUpdateActions = [];
    };
    postUpdate();
    let updateValue = 0;
    document.addEventListener("smalljsx-update", () => {
        updateValue += 1;
        const myUpdate = updateValue;
        window.setTimeout(() => {
            if (updateValue > 5000) {
                throw `Too deep update recursion, over 5000 updates occured, fix your app!`;
            }
            if (updateValue === myUpdate) {
                postUpdate();
                updateValue = 0;
            }
        });
    });
};

const isMarkedComponent = (marked?: any) => Boolean(marked?.__marked);

const markAsComponent = <T>(toMark: T & { __marked?: boolean }): T => {
    toMark.__marked = true;
    return toMark;
};

export const h = <T>(
    component: (new () => Fragment) | ((props?: T) => JSX.Element) | string,
    props: T | null,
    ...children: JSX.Element[]
) => {
    return markAsComponent(() => {
        if (typeof component === "string") {
            return createTag(component, props, children);
        }
        if (isFragmentConstructor(component)) {
            return createFragment(props, children);
        }
        return createComponent(component, props, children);
    });
};

if (typeof window !== undefined) {
    (window as any).h = h;
    (window as any).Fragment = Fragment;
}
