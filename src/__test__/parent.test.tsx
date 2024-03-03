// import preview from "jest-preview";
import $ from "jquery";
import * as Small from "../index";
jest.useFakeTimers();

describe("Can use children/parent components and custom children types", () => {
    beforeEach(() => {
        document.body.innerHTML = "<div id='root' />";
    });
    afterEach(() => {
        Small.__reset();
    });
    it("Can use generic children in a component", () => {
        const Parent: Small.ParentComponent = (props) => {
            return <div>{props.children}</div>;
        };
        const Component: Small.Component = () => {
            return (
                <Parent>
                    <button id="click">Click me!</button>
                </Parent>
            );
        };
        Small.mount(<Component />, "#root");
        jest.runAllTimers();
        expect($("#root")[0].outerHTML).toEqual(
            '<div id="root"><div><button id="click">Click me!</button></div></div>'
        );
    });
    it("Can use children conditionally", () => {
        let unmount = false;
        const Parent: Small.ParentComponent = (props) => {
            const [showChildren, setShowChildren] = Small.useState(true);
            return (
                <div>
                    <button id="click" onclick={() => setShowChildren(false)}>
                        Erase children
                    </button>
                    {showChildren ? props.children : null}
                </div>
            );
        };
        const ToUnmount = () => {
            Small.useUnmountEffect(() => {
                unmount = true;
            });
            return <button id="child">Click me!</button>;
        };
        const Component: Small.Component = () => {
            return (
                <Parent>
                    <ToUnmount />
                </Parent>
            );
        };
        Small.mount(<Component />, "#root");
        jest.runAllTimers();
        expect(unmount).toBeFalsy();
        expect($("#child").length).toBe(1);
        $("#click")[0].click();
        jest.runAllTimers();
        expect(unmount).toBeTruthy();
        expect($("#child").length).toBe(0);
    });
    it("Can use function as children", () => {
        const FnAsChildren: Small.Component<{ children: (state: number) => JSX.Element }> = (props) => {
            const [state, setState] = Small.useState(1);
            return <button id="click" onclick={() => setState(state + 1)}>{props.children(state)}</button>;
        };
        const Parent: Small.Component = () => {
            return (
                <FnAsChildren>
                    {(state) => (
                        <div>{state}</div>
                    )}
                </FnAsChildren>
            );
        };
        Small.mount(<Parent />, "#root");
        jest.runAllTimers();
        expect($("#click > div")[0].innerHTML).toEqual("1");
        $("#click")[0].click();
        jest.runAllTimers();
        expect($("#click > div")[0].innerHTML).toEqual("2");
    });
    it("Can use state updates correctly", () => {
        const Parent: Small.ParentComponent = (props) => {
            const [showChildren, setShowChildren] = Small.useState(true);
            return (
                <div>
                    <button id="click" onclick={() => setShowChildren(!showChildren)}>
                        Erase children
                    </button>
                    {showChildren ? props.children : null}
                </div>
            );
        };
        const ToUpdate = () => {
            const [state, setState] = Small.useState(1);
            return <button id="child" onclick={() => setState(state + 1)}>{state}</button>;
        };
        const Component: Small.Component = () => {
            return (
                <Parent>
                    <ToUpdate />
                </Parent>
            );
        };
        Small.mount(<Component />, "#root");
        jest.runAllTimers();
        expect($("#child")[0].innerHTML).toEqual("1");
        $("#child")[0].click();
        jest.runAllTimers();
        expect($("#child")[0].innerHTML).toEqual("2");
        $("#click")[0].click();
        jest.runAllTimers();
        expect($("#child").length).toEqual(0);
        $("#click")[0].click();
        jest.runAllTimers();
        expect($("#child").length).toEqual(1);
        expect($("#child")[0].innerHTML).toEqual("1");
        $("#child")[0].click();
        jest.runAllTimers();
        expect($("#child")[0].innerHTML).toEqual("2");
    });
    it("Can use before render effects correctly", () => {
        let called = 0;
        let beforeRenderContents = "";
        const Parent: Small.ParentComponent = (props) => {
            return <div>{props.children}</div>
        };
        const Stateful: Small.Component = () => {
            const [state, setState] = Small.useState(0);
            const ref = Small.useRef<HTMLButtonElement>();
            Small.useEffect(
                () => {
                    called++;
                    beforeRenderContents = ref.current?.innerHTML || "";
                },
                "before-render",
                [state]
            );
            return (
                <button ref={ref} id="click" onclick={() => setState(state + 1)}>
                    {state}
                </button>
            );
        };
        const TestComponent = () => (
            <Parent>
                <Stateful />
            </Parent>
        );
        Small.mount(<TestComponent />, "#root");
        jest.runAllTimers();
        expect(called).toBe(1);
        $("#click")[0].click();
        jest.runAllTimers();
        expect(called).toBe(2);
        expect(beforeRenderContents).toEqual("0");
    });
    it("Can use before render effects correctly with props in children", () => {
        let called = 0;
        let beforeRenderContents = "";
        const Parent: Small.ParentComponent = (props) => {
            return <div>{props.children}</div>
        };
        const Stateful: Small.Component<{ state: number, setState: (value: number) => void }> = (props) => {
            const ref = Small.useRef<HTMLButtonElement>();
            Small.useEffect(
                () => {
                    called++;
                    beforeRenderContents = ref.current?.innerHTML || "";
                },
                "before-render",
                [props.state]
            );
            return (
                <button ref={ref} id="click" onclick={() => props.setState(props.state + 1)}>
                    {props.state}
                </button>
            );
        };
        const TestComponent = () => {
            const [state, setState] = Small.useState(0);
            return (
                <Parent>
                    <Stateful setState={setState} state={state} />
                </Parent>
            );
        };
        Small.mount(<TestComponent />, "#root");
        jest.runAllTimers();
        expect(called).toBe(1);
        $("#click")[0].click();
        jest.runAllTimers();
        expect(called).toBe(2);
        expect(beforeRenderContents).toEqual("0");
    });
    it("Can use before render effects correctly with function as children", () => {
        let called = 0;
        let beforeRenderContents = "";
        const Parent: Small.Component<{ children: (state: number, setState: (value: number) => void) => JSX.Element }> = (props) => {
            const [state, setState] = Small.useState(0);
            return <div>{props.children(state, setState)}</div>
        };
        const Stateful: Small.Component<{ state: number, setState: (value: number) => void }> = (props) => {
            const ref = Small.useRef<HTMLButtonElement>();
            Small.useEffect(
                () => {
                    called++;
                    beforeRenderContents = ref.current?.innerHTML || "";
                },
                "before-render",
                [props.state]
            );
            return (
                <button ref={ref} id="click" onclick={() => props.setState(props.state + 1)}>
                    {props.state}
                </button>
            );
        };
        const TestComponent = () => {
            return (
                <Parent>
                    {(state, setState) => <Stateful setState={setState} state={state} />}
                </Parent>
            );
        };
        Small.mount(<TestComponent />, "#root");
        jest.runAllTimers();
        expect(called).toBe(1);
        $("#click")[0].click();
        jest.runAllTimers();
        expect(called).toBe(2);
        expect(beforeRenderContents).toEqual("0");
    });
    it("Can use after render effects correctly", () => {
        let called = 0;
        let afterRenderContents = "";
        const Parent: Small.ParentComponent = (props) => {
            return <div>{props.children}</div>
        };
        const Stateful: Small.Component = () => {
            const [state, setState] = Small.useState(0);
            const ref = Small.useRef<HTMLButtonElement>();
            Small.useEffect(
                () => {
                    called++;
                    afterRenderContents = ref.current?.innerHTML || "";
                },
                "after-render",
                [state]
            );
            return (
                <button ref={ref} id="click" onclick={() => setState(state + 1)}>
                    {state}
                </button>
            );
        };
        const TestComponent = () => (
            <Parent>
                <Stateful />
            </Parent>
        );
        Small.mount(<TestComponent />, "#root");
        jest.runAllTimers();
        expect(called).toBe(1);
        $("#click")[0].click();
        jest.runAllTimers();
        expect(called).toBe(2);
        expect(afterRenderContents).toEqual("1");
    });
    it("Can use after render effects correctly with props in children", () => {
        let called = 0;
        let afterRenderContents = "";
        const Parent: Small.ParentComponent = (props) => {
            return <div>{props.children}</div>
        };
        const Stateful: Small.Component<{ state: number, setState: (value: number) => void }> = (props) => {
            const ref = Small.useRef<HTMLButtonElement>();
            Small.useEffect(
                () => {
                    called++;
                    afterRenderContents = ref.current?.innerHTML || "";
                },
                "after-render",
                [props.state]
            );
            return (
                <button ref={ref} id="click" onclick={() => props.setState(props.state + 1)}>
                    {props.state}
                </button>
            );
        };
        const TestComponent = () => {
            const [state, setState] = Small.useState(0);
            return (
                <Parent>
                    <Stateful setState={setState} state={state} />
                </Parent>
            );
        };
        Small.mount(<TestComponent />, "#root");
        jest.runAllTimers();
        expect(called).toBe(1);
        $("#click")[0].click();
        jest.runAllTimers();
        expect(called).toBe(2);
        expect(afterRenderContents).toEqual("1");
    });
    it("Can use after render effects correctly with function as children", () => {
        let called = 0;
        let afterRenderContents = "";
        const Parent: Small.Component<{ children: (state: number, setState: (value: number) => void) => JSX.Element }> = (props) => {
            const [state, setState] = Small.useState(0);
            return <div>{props.children(state, setState)}</div>
        };
        const Stateful: Small.Component<{ state: number, setState: (value: number) => void }> = (props) => {
            const ref = Small.useRef<HTMLButtonElement>();
            Small.useEffect(
                () => {
                    called++;
                    afterRenderContents = ref.current?.innerHTML || "";
                },
                "after-render",
                [props.state]
            );
            return (
                <button ref={ref} id="click" onclick={() => props.setState(props.state + 1)}>
                    {props.state}
                </button>
            );
        };
        const TestComponent = () => {
            return (
                <Parent>
                    {(state, setState) => <Stateful setState={setState} state={state} />}
                </Parent>
            );
        };
        Small.mount(<TestComponent />, "#root");
        jest.runAllTimers();
        expect(called).toBe(1);
        $("#click")[0].click();
        jest.runAllTimers();
        expect(called).toBe(2);
        expect(afterRenderContents).toEqual("1");
    });
});
