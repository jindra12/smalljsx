const dispatchUpdate = () => {
    const event = new CustomEvent("smalljsx-update");
    document.dispatchEvent(event);
};

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
                    : nextValue;
            hooks.updateStack(index, nextState, currentState !== nextState);
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
    new: boolean;
    parent?: Stack;
    hooks: HooksStack;
    rendered?: HTMLElement | Text;
    treeContext: Record<string, any>;
};

const isPortal = (hook: any): hook is { portal: HTMLElement } =>
    Boolean(hook.portal instanceof HTMLElement);

class Context {
    root: Stack = {
        key: "root",
        component: "root",
        children: {},
        toUpdateIndex: 0,
        childrenCount: 0,
        updated: 0,
        new: false,
        hooks: new HooksStack(),
        treeContext: {},
    };
    postUpdateActions: Array<() => void> = [];
    pointer: Stack;
    
    private createUpdate = (stack: () => Stack, onRerender?: (stack: Stack) => () => void) => {
        return () => {
            if (onRerender) {
                this.postUpdateActions.push(onRerender(stack()));
                dispatchUpdate();
            }
        }
    };
    
    constructor() {
        this.pointer = this.root;
    }
    
    startComponentStack = (
        component: Function | string,
        hasCorrectPointer: boolean,
        key?: string,
        onRerender?: (stack: Stack) => () => void
    ) => {
        if (hasCorrectPointer) {
            const ptr = this.pointer;
            this.pointer.hooks.onRerender = this.createUpdate(() => ptr, onRerender);
            return;
        }
        const previous =
            this.pointer.children[key || this.pointer.toUpdateIndex];
        if (previous && previous.component === component) {
            this.pointer.toUpdateIndex++;
            previous.updated++;
            this.pointer = previous;
        } else {
            const nextStack: Stack = {
                key: key || this.pointer.childrenCount.toString() || "",
                children: {},
                childrenCount: 0,
                component: component,
                toUpdateIndex: 0,
                updated: 1,
                new: true,
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
            this.pointer.rendered = document.createTextNode("");
        } else {
            this.pointer.rendered = toRender;
        }
        return this.pointer.rendered!;
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
                const unmountActions = child.hooks.unmountActions;
                this.postUpdateActions.push(...unmountActions);
                delete this.pointer.children[key];
            }
        }
        const postActions = this.pointer.hooks.postActions;
        this.postUpdateActions.push(...postActions);
        this.pointer.hooks.reset();
        Object.values(this.pointer.children).forEach((child) => {
            child.toUpdateIndex = 0;
        });
        this.pointer = this.pointer.parent!;

        if (postActions.length > 0) {
            dispatchUpdate();
        }
    };
    debug = () => {
        let stringTree = "";
        Object.values(this.root.children).map((stack) => {
            if (stack.rendered) {
                stringTree += stack.rendered instanceof HTMLElement ? stack.rendered.outerHTML : stack.rendered.textContent;
            } else {
                stringTree += "unrendered";
            }
        });
        return stringTree;
    };
}

let context = new Context();

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
    context.startComponentStack(component, (props as any)?.key?.toString());
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
        hasCorrectPointer,
        (copiedProps as any).key?.toString(),
        (stack) => () => {
            context.pointer = stack;
            const original = stack.rendered;
            const next = createComponent(component, props, children, true);
            original!.parentElement!.replaceChild(
                next,
                original!
            );
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
