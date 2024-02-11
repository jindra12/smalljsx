class Fragment {
    children?: JSX.RenderingChildren[];
    context?: JSX.Context;
    constructor(context?: JSX.Context, children?: JSX.RenderingChildren[]) {
        this.children = children;
        this.context = context;
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
    children: JSX.RenderingChildren[],
    context: JSX.Context
) => {
    const acc: JSX.ResolvedChildren[] = [];
    for (let i = 0; i < children.length; i++) {
        const child = children[i];
        const executed = typeof child === "function" ? child(context) : child;
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

class HooksStack {
    stored: any[] = [];
    index = 0;

    reset = () => {
        if (this.index !== this.stored.length - 1) {
            throw `Conditional calls to hooks not allowed!`;
        }
        this.index = 0;
    }

    storeStack = (initialState: any) => {
        if (this.index < this.stored.length) {
            this.stored[this.index] = initialState;
        } else {
            this.stored.push(initialState);
        }
        this.index++;
    };

    updateStack = (index: number, state: any) => {
        this.stored[index] = state;
    };

    hasStack = () => this.index < this.stored.length;

    peekStack = () => this.stored[this.index];
}

export const useState = <T>(initialState?: T | (() => T)): [T, (value: T | ((prevValue: T) => T)) => void] => {
    const hooks = context.pointer.hooks;
    const index = hooks.index;
    const currentState = hooks.hasStack() ? hooks.peekStack() : (typeof initialState === "function" ? (initialState as Function)() : initialState);
    hooks.storeStack(currentState);
    return [currentState, (nextValue) => {
        const nextState = typeof nextValue === "function" ? (nextValue as any)(currentState) : currentState;
        hooks.updateStack(index, nextState);
    }];
};

export const useRef = <T>(initialRef?: T | (() => T)): { current: T } => {
    const hooks = context.pointer.hooks;
    const index = hooks.index;
    const currentRef = hooks.hasStack() ? hooks.peekStack() : (typeof initialRef === "function" ? (initialRef as Function)() : initialRef);
    hooks.storeStack(currentRef);
    return {
        get current() {
            return currentRef;
        },
        set current(value: T) {
            hooks.updateStack(index, value);
        },
    };
};

export const useEffect = (effect: () => void, type: "mount" | "unmount" | "before-render" | "after-render", deps: any[]) => {
    
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
    };
    pointer: Stack;
    constructor() {
        this.pointer = this.root;
    }
    startComponentStack = (component: Function | string, key?: string) => {
        const previous = this.pointer.children[key || this.pointer.childrenCount.toString() || ""];
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
                delete this.pointer.children[key];
            }
        }
        this.pointer.hooks.reset();
        this.pointer = this.pointer.parent!;
    };
}

interface WindowExtended extends Window {
    mount?: Record<string, Context>;
    h?: typeof h;
}

let context = new Context();

const resolveChildren = (
    htmlTag: HTMLElement,
    children: JSX.RenderingChildren[],
    context: JSX.Context
) => {
    const executed = executeChildren(children, context);
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
    context.startComponentStack(
        component,
        (props as any).key?.toString() || ""
    );
    resolveChildren(htmlTag, children, context);
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
            return executeChildren(children, context);
        },
    }) as any as T;
    context.startComponentStack(
        component,
        (copiedProps as any).key?.toString()
    );
    const htmlTag = component(copiedProps);
    context.endComponentStack();
    return htmlTag;
};

export const mount = (hResult: HTMLElement) => {
    (hResult as any as (context: JSX.Context) => HTMLElement)(context);
};

export const h = <T>(
    component: (new () => Fragment) | string | ((props?: T) => JSX.Element),
    props: T | null,
    ...children: JSX.RenderingChildren[]
): HTMLElement | Fragment => {
    return typeof component === "string"
        ? createTag(component, props, children)
        : isFragmentConstructor(component)
            ? new Fragment(context, children)
            : createComponent(component, props, children);
};

if (typeof window !== undefined) {
    (window as WindowExtended).h = h;
    (window as WindowExtended).mount = {};
}
