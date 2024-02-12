class Fragment {
    children?: JSX.RenderingChildren[];
    constructor(children?: JSX.RenderingChildren[]) {
        this.children = children;
    }
}

const isFragmentConstructor = (
    component: (new () => Fragment) | string | ((props?: any) => JSX.Element)
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

const executeChildren = (
    children: JSX.RenderingChildren[]
) => {
    const acc: JSX.ResolvedChildren[] = [];
    for (let i = 0; i < children.length; i++) {
        const child = children[i];
        const executed = typeof child === "function" ? child() : child;
        if (isFragment(executed)) {
            const moreChildren = !executed.children
                ? []
                : Array.isArray(executed.children)
                    ? executed.children
                    : [executed.children];
            for (let j = 0; j < moreChildren.length; j++) {
                const subChild = moreChildren[j];
                if (Array.isArray(subChild)) {
                    acc.push(...subChild);
                } else {
                    acc.push(subChild);
                }
            }
        } else {
            acc.push(executed);
        }
    }
    return acc;
};

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
    rerender = false;

    reset = () => {
        if (this.index !== this.stored.length - 1) {
            throw `Conditional calls to hooks not allowed!`;
        }
        this.rerender = false;
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
        this.rerender = rerender;
    };

    hasStack = () => this.index < this.stored.length;

    peekStack = () => this.stored[this.index];
}

export const useState = <T>(
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
                    : currentState;
            hooks.updateStack(index, nextState, true);
        },
    ];
};

export const useRef = <T>(initialRef?: T | (() => T)): { current: T } => {
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
            return currentRef;
        },
        set current(value: T) {
            hooks.updateStack(index, value, false);
        },
    };
};

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

export const useSetContext = <T>(treeContext: TreeContext<T>, nextState?: T) => {
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

type Stack = {
    key: string;
    component: Function | string;
    children: Record<string, Stack>;
    childrenCount: number;
    updated: number;
    new: boolean;
    parent?: Stack;
    hooks: HooksStack;
    treeContext: Record<string, any>;
};

class Context {
    root: Stack = {
        key: "root",
        component: "root",
        children: {},
        childrenCount: 0,
        updated: 1,
        new: false,
        hooks: new HooksStack(),
        treeContext: {},
    };
    pointer: Stack;
    constructor() {
        this.pointer = this.root;
    }
    startComponentStack = (component: Function | string, key?: string) => {
        const previous =
            this.pointer.children[key || this.pointer.childrenCount.toString() || ""];
        if (previous && previous.component === component) {
            previous.updated++;
            this.pointer = previous;
        } else {
            const nextStack: Stack = {
                key: key || this.pointer.childrenCount.toString() || "",
                children: {},
                childrenCount: 0,
                component: component,
                updated: 1,
                new: true,
                parent: this.pointer,
                hooks: new HooksStack(),
                treeContext: {
                    ...this.pointer.treeContext,
                },
            };
            this.pointer.children[nextStack.key] = nextStack;
            this.pointer.childrenCount++;
            this.pointer = nextStack;
        }
    };
    endComponentStack = () => {
        let max = 0;
        for (const key in this.pointer.children) {
            const child = this.pointer.children[key];
            max = Math.max(max, child.updated);
        }
        for (const key in this.pointer.children) {
            const child = this.pointer.children[key];
            if (child.new) {
                child.new = false;
            } else if (child.updated < max) {
                const unmountActions = this.pointer.hooks.unmountActions;
                for (let i = 0; i < unmountActions.length; i++) {
                    unmountActions[i]();
                }
                delete this.pointer.children[key];
            }
        }
        const postActions = this.pointer.hooks.postActions;
        for (let i = 0; i < postActions.length; i++) {
            postActions[i]();
        }
        this.pointer.hooks.reset();
        this.pointer = this.pointer.parent!;
    };
}

let context = new Context();

const resolveChildren = (
    htmlTag: HTMLElement,
    children: JSX.RenderingChildren[],
) => {
    const executed = executeChildren(children);
    for (let i = 0; i < executed.length; i++) {
        const child = executed[i];
        if (child instanceof HTMLElement) {
            htmlTag.appendChild(child);
        } else {
            htmlTag.appendChild(document.createTextNode(child?.toString() || ""));
        }
    }
};

const createTag = <T>(
    component: string,
    props: T | null,
    children: JSX.RenderingChildren[]
): HTMLElement => {
    const htmlTag = document.createElement(component);
    for (const key in props || {}) {
        if (key !== "ref" && key !== "key") {
            if (key.startsWith("on")) {
                htmlTag.addEventListener(key, (props as any)[key]);
            } else {
                try {
                    (htmlTag as any)[key] = (props as any)[key];
                } catch {
                    htmlTag.setAttribute(key, (props as any)[key]?.toString() || "");
                }
            }
        }
    }
    context.startComponentStack(component, (props as any).key?.toString() || "");
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
    children: JSX.RenderingChildren[]
) => {
    const copiedProps = Object.assign({}, props || {}, {
        get children() {
            return executeChildren(children);
        },
    }) as any as T;
    context.startComponentStack(component, (copiedProps as any).key?.toString());
    const htmlTag = component(copiedProps);
    context.endComponentStack();
    return htmlTag;
};

export const mount = (hResult: HTMLElement | Fragment | (() => HTMLElement) | (() => Fragment), mountPoint: string | HTMLElement, replace: boolean = true) => {
    const entryPoint = typeof mountPoint === "string" ? document.querySelector<HTMLElement>(mountPoint) : mountPoint;
    if (!entryPoint) {
        throw `Could not find element ${mountPoint}`;
    }
    if (replace) {
        entryPoint.innerHTML = "";
    }
    if (typeof hResult === "function") {
        const exec = hResult();
        if (exec instanceof Fragment) {
            resolveChildren(entryPoint, exec.children || []);
        } else {
            entryPoint.appendChild(exec);
        }
    } else {
        if (hResult instanceof Fragment) {
            resolveChildren(entryPoint, hResult.children || []);
        } else {
            entryPoint.appendChild(hResult);
        }
    }
};

export const h = <T>(
    component: (new () => Fragment) | string | ((props?: T) => JSX.Element),
    props: T | null,
    ...children: JSX.RenderingChildren[]
): () => HTMLElement | Fragment => {
    return () => typeof component === "string"
        ? createTag(component, props, children)
        : isFragmentConstructor(component)
            ? new Fragment(children)
            : createComponent(component, props, children);
};

if (typeof window !== undefined) {
    (window as any).h = h;
}
