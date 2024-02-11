export type Component<T extends object = {}> = (props: T) => JSX.Element;
export type ParentComponent<T extends object = {}> = (props: T & { children?: JSX.Element | JSX.Element[] }) => JSX.Element;