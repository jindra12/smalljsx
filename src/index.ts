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
): ((context: JSX.Context) => HTMLElement) => {
    return (context) => {
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
};

const createComponent = <T>(
    component: (props?: T) => JSX.Element,
    props: T | null,
    children: JSX.RenderingChildren[]
): ((context: JSX.Context) => HTMLElement) => {
    return (context) => {
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
};

type Stack = {
    key: string;
    component: Function | string;
    children: Record<string, Stack>;
    childrenCount: number;
    updated: number;
    new: boolean;
    parent?: Stack;
};

class Context {
    root: Stack = {
        key: "root",
        component: "root",
        children: {},
        childrenCount: 0,
        updated: 1,
        new: false,
    };
    pointer: Stack;
    constructor() {
        this.pointer = this.root;
    }
    startComponentStack = (component: Function | string, key?: string) => {
        const previous = this.pointer.children[key || this.pointer.childrenCount.toString() || ""];
        if (previous && previous.component === component) {
            
        } else {
            const nextStack: Stack = {
                key: key || this.pointer.childrenCount.toString() || "",
                children: {},
                childrenCount: 0,
                component: component,
                updated: 1,
                new: true,
                parent: this.pointer,
            };
            this.pointer.children[nextStack.key] = nextStack;
            this.pointer.childrenCount++;
            this.pointer = nextStack;
        }
    };
    endComponentStack = () => {

    };
}

export const h = <T>(
    component: (new () => Fragment) | string | ((props?: T) => JSX.Element),
    props: T | null,
    ...children: JSX.RenderingChildren[]
): ((context: JSX.Context) => HTMLElement | Fragment) => {
    return (context: JSX.Context) =>
        typeof component === "string"
            ? createTag(component, props, children)(context)
            : isFragmentConstructor(component)
                ? new Fragment(context, children)
                : createComponent(component, props, children)(context);
};

if (typeof window !== undefined) {
    (window as any).h = h;
    (window as any).Fragment = Fragment;
}
