const dispatchUpdate = () => {
    const event = new CustomEvent("smalljsx-update");
    document.dispatchEvent(event);
};

export type Component<T extends object = {}> = (props: T & { children?: never }) => JSX.Element;
export type ParentComponent<T extends object = {}> = (props: T & { children?: JSX.Element }) => JSX.Element;

class Fragment {
    children?: JSX.Element[];
    constructor(children?: JSX.Element[]) {
        this.children = children;
    }
}

const isFragmentConstructor = (
    component: any
): component is new () => Fragment => component === Fragment;

const isFragment = (
    component:
        | string
        | number
        | boolean
        | HTMLElement
        | JSX.Fragment
        | null
        | undefined
): component is JSX.Fragment => component instanceof Fragment;

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
    useState<T>(initialState: T | (() => T)): [T, (value: T | ((prevValue: T) => T)) => void];
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

export const useRef: RefFn = <T>(initialRef?: T | (() => T) | undefined): { current: T | undefined } => {
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

export const createTreeContext = <T>(defaultValue: T): TreeContext<T> => {
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

export const useContext = <T>(treeContext: TreeContext<T>) => {
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
    updated: number;
    parent?: Stack;
    hooks: HooksStack;
    props: any,
    rawChildren: JSX.Element[],
    rendered?: HTMLElement | Text;
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
            updated: 0,
            hooks: new HooksStack(),
            treeContext: {},
        };
    }

    private createUpdate = (stack: () => Stack, onRerender?: (stack: Stack) => () => void) => {
        return () => {
            if (onRerender) {
                this.postUpdateActions.push(onRerender(stack()));
                dispatchUpdate();
            }
        }
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
            this.pointer.updated++;
            return;
        }
        const previous =
            this.pointer.children[key || this.pointer.toUpdateIndex];
        if (previous && previous.component === component) {
            this.pointer.toUpdateIndex++;
            previous.updated++;
            this.pointer = previous;
            this.pointer.props = props;
            this.pointer.rawChildren = children;
        } else {
            const nextStack: Stack = {
                key: key || this.pointer.childrenCount.toString() || "",
                children: {},
                childrenCount: 0,
                component: component,
                toUpdateIndex: 0,
                props: props,
                rawChildren: children,
                updated: 1,
                parent: this.pointer,
                hooks: new HooksStack(this.createUpdate(() => nextStack, onRerender)),
                treeContext: {
                    ...this.pointer.treeContext,
                },
            };
            this.pointer.children[nextStack.key] = nextStack;
            this.pointer.childrenCount++;
            this.pointer = nextStack;
        }
    };
    processJSXToHtml = (element: JSX.Element): Text | HTMLElement => {
        const executed = typeof element === "function" ? element() : element;
        const portal = this.pointer.hooks.stored.find(isPortal);
        const toRender =
            executed instanceof HTMLElement
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
            if (child.updated < this.pointer.updated) {
                this.postUpdateActions.push(...this.collectUnmountHooks(child));
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

const executeChildren = (children: JSX.Element[]) => {
    const acc: JSX.ResolvedChildren[] = [];
    for (let i = 0; i < children.length; i++) {
        const child = children[i];
        const executed = typeof child === "function" ? child() : child;
        if (isFragment(executed)) {
            acc.push(...executeChildren(executed.children || []));
        } else {
            acc.push(executed);
        }
    }
    return acc;
};

const resolveChildren = (htmlTag: HTMLElement, children: JSX.Element[]) => {
    const executed = executeChildren(children);
    const appendChildren = (executed: JSX.ResolvedChildren[]) => {
        for (let i = 0; i < executed.length; i++) {
            const child = executed[i];
            if (Array.isArray(child)) {
                appendChildren(child);
            } else if (child instanceof HTMLElement) {
                htmlTag.appendChild(child);
            } else {
                htmlTag.appendChild(document.createTextNode(child?.toString() || ""));
            }
        }
    };
    appendChildren(executed);
};

const createTag = <T>(
    component: string,
    props: T | null,
    children: JSX.Element[]
): HTMLElement => {
    const htmlTag = document.createElement(component);
    for (const key in props || {}) {
        if (key !== "ref" && key !== "key") {
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
    context.startComponentStack(component, props, children, (props as any)?.key?.toString());
    resolveChildren(htmlTag, children);
    if ((props as any)?.ref) {
        (props as any).ref.current = htmlTag;
    }
    context.endComponentStack();
    return htmlTag;
};

const createComponent = <T>(
    component: (props?: T) => JSX.Element,
    props: T | null,
    children: JSX.Element[],
    hasCorrectPointer = false,
): HTMLElement | Text => {
    const copiedProps = Object.assign({}, props || {}, {
        get children() {
            return executeChildren(children);
        },
    }) as any as T;
    context.startComponentStack(
        component,
        props,
        children,
        hasCorrectPointer,
        (copiedProps as any).key?.toString(),
        (stack) => () => {
            context.pointer = stack;
            const original = stack.rendered;
            const next = createComponent(component, context.pointer.props, context.pointer.rawChildren, true);
            original?.parentElement?.replaceChild(
                next,
                original!
            );
            stack.rendered = next;
            return;
        },
    );
    const htmlTag = context.processJSXToHtml(component(copiedProps));
    context.endComponentStack();
    return htmlTag;
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
        if (isFragment(exec)) {
            resolveChildren(entryPoint, exec.children || []);
        } else {
            entryPoint.appendChild(exec);
        }
    } else {
        if (isFragment(hResult)) {
            resolveChildren(entryPoint, hResult.children || []);
        } else {
            entryPoint.appendChild(
                document.createTextNode(hResult?.toString() || "")
            );
        }
    }
    const postUpdate = () => {
        for (let i = 0; i < context.postUpdateActions.length; i++) {
            context.postUpdateActions[i]();
        }
        context.postUpdateActions = [];
    };
    postUpdate();
    let updateValue = 0;
    const timeoutMs = 20;
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
        }, timeoutMs);
    });
};

export const h = <T>(
    component: (new () => Fragment) | ((props?: T) => JSX.Element) | string,
    props: T | null,
    ...children: JSX.Element[]
) => {
    return () => {
        if (typeof component === "string") {
            return createTag(component, props, children);
        }
        if (isFragmentConstructor(component)) {
            return new Fragment(children);
        }
        return createComponent(component, props, children);
    };
};

if (typeof window !== undefined) {
    (window as any).h = h;
}
