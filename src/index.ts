const executeChildren = (children: RenderingChildren[]) => {
    const acc: ResolvedChildren[] = [];
    for (let i = 0; i < children.length; i++) {
        const child = children[i];
        acc.push(typeof child === "function" ? child() : child);
    }
    return acc;
};

const resolveChildren = (
    htmlTag: HTMLElement,
    children: RenderingChildren[]
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
    children: RenderingChildren[]
): (() => HTMLElement) => {
    return () => {
        const htmlTag = document.createElement(component);
        for (const key in props || {}) {
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
        resolveChildren(htmlTag, children);
        return htmlTag;
    };
};

const createComponent = <T>(
    component: (props?: T) => JSX.Element,
    props: T | null,
    children: RenderingChildren[]
): (() => HTMLElement) => {
    return () => {
        const copiedProps = Object.assign({}, props || {}, {
            children: executeChildren(children),
        }) as T;
        const htmlTag = component(copiedProps);
        return htmlTag;
    };
};

export const h = <T>(
    component: string | ((props?: T) => JSX.Element),
    props: T | null,
    ...children: RenderingChildren[]
): (() => HTMLElement) => {
    return typeof component === "string"
        ? createTag(component, props, children)
        : createComponent(component, props, children);
};
