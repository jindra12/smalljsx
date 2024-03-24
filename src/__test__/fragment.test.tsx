// import preview from "jest-preview";
import $ from "jquery";
import * as Small from "../index";
jest.useFakeTimers();

describe("Can use fragments", () => {
    beforeEach(() => {
        document.body.innerHTML = "<div id='root' />";
    });
    afterEach(() => {
        Small.__reset();
    });
    it("Can use simple fragments", () => {
        const Parent: Small.ParentComponent = (props) => {
            return (
                <>
                    {props.children}
                    <div>Not me!</div>
                </>
            );
        };
        const Component: Small.Component = () => {
            return (
                <Parent>
                    <>Click me!</>
                </Parent>
            );
        };
        Small.mount(<Component />, "#root");
        jest.runAllTimers();
        expect($("#root")[0].outerHTML).toEqual(
            '<div id="root">Click me!<div>Not me!</div></div>'
        );
    });
    it("Won't cause conflicts between child and parent re-renders", () => {
        const Parent: Small.ParentComponent = (props) => {
            const [state, setState] = Small.useState(0);
            return (
                <>
                    {props.children}
                    <div>Not me!</div>
                    <button id="click" onclick={() => setState(state + 1)}>{state}</button>
                </>
            );
        };
        const Component: Small.Component = () => {
            return (
                <Parent>
                    <div>Click me!</div>
                </Parent>
            );
        };
        Small.mount(<Component />, "#root");
        jest.runAllTimers();
        expect($("#root")[0].outerHTML).toEqual(
            '<div id=\"root\"><div>Click me!</div><div>Not me!</div><button id=\"click\">0</button></div>'
        );
        $("#click")[0].click();
        jest.runAllTimers();
        expect($("#root")[0].outerHTML).toEqual(
            '<div id=\"root\"><div>Click me!</div><div>Not me!</div><button id=\"click\">1</button></div>'
        );
    });
    it("Can render multiple children on mount", () => {
        Small.mount(
            <>
                <div>Yes</div>
                <div>No</div>
            </>,
            "#root"
        );
        jest.runAllTimers();
        expect($("#root")[0].outerHTML).toEqual(
            '<div id="root"><div>Yes</div><div>No</div></div>'
        );
    });
    it("Can work with fragments when state updates", () => {
        const Test1 = () => {
            const [state, setState] = Small.useState(1);
            return (
                <button id="click" onclick={() => setState(state + 1)}>
                    {state}
                </button>
            );
        };
        const Test2 = () => {
            const [state, setState] = Small.useState(1);
            return (
                <button id="clack" onclick={() => setState(state * 2)}>
                    {state}
                </button>
            );
        };
        Small.mount(
            <>
                <Test1 />
                <Test2 />
            </>,
            "#root"
        );
        jest.runAllTimers();
        $("#click")[0].click();
        jest.runAllTimers();
        expect($("#click")[0].innerHTML).toBe("2");
        expect($("#clack")[0].innerHTML).toBe("1");
        $("#click")[0].click();
        jest.runAllTimers();
        $("#clack")[0].click();
        jest.runAllTimers();
        $("#clack")[0].click();
        jest.runAllTimers();
        expect($("#click")[0].innerHTML).toBe("3");
        expect($("#clack")[0].innerHTML).toBe("4");
    });
    it("Can work with function as children", () => {
        const Parent: Small.Component<{
            children: (state: number) => JSX.Element;
        }> = (props) => {
            const [state, setState] = Small.useState(1);
            return (
                <>
                    {props.children(state)}
                    <button id="click" onclick={() => setState(state + 1)}>
                        Click me
                    </button>
                </>
            );
        };
        const Container = () => {
            return (
                <Parent>
                    {(state) => (
                        <>
                            <div className="test">{state}</div>
                            <div className="taste">{state}</div>
                        </>
                    )}
                </Parent>
            );
        };
        Small.mount(
            <>
                <Container />
            </>,
            "#root"
        );
        jest.runAllTimers();
        $("#click")[0].click();
        jest.runAllTimers();
        expect($(".test")[0].innerHTML).toBe("2");
        expect($(".taste")[0].innerHTML).toBe("2");
    });
    it("Can work with fragments conditionally", () => {
        const OddFrag: Small.Component<{ state: number; setState: () => void }> = (
            props
        ) => (
            <div>
                <>
                    <p>{props.state}</p>
                    <div>{props.state}</div>
                    <button id="click" onclick={props.setState}>
                        Update
                    </button>
                </>
            </div>
        );
        const EvenFrag: Small.Component<{ state: number; setState: () => void }> = (
            props
        ) => (
            <>
                <div>
                    <>{props.state}</>
                    <>{props.state}</>
                    <button id="click" onclick={props.setState}>
                        Update
                    </button>
                </div>
            </>
        );
        const Switcher: Small.Component = () => {
            const [state, setState] = Small.useState(0);
            return state % 2 ? (
                <OddFrag state={state} setState={() => setState(state + 1)} />
            ) : (
                <EvenFrag state={state} setState={() => setState(state + 1)} />
            );
        };
        Small.mount(
            <Switcher />,
            "#root"
        );
        jest.runAllTimers();
        expect($("#root")[0].outerHTML).toMatchSnapshot();
        $("#click")[0].click();
        jest.runAllTimers();
        expect($("#root")[0].outerHTML).toMatchSnapshot();
        $("#click")[0].click();
        jest.runAllTimers();
        expect($("#root")[0].outerHTML).toMatchSnapshot();
        $("#click")[0].click();
        jest.runAllTimers();
        expect($("#root")[0].outerHTML).toMatchSnapshot();
        $("#click")[0].click();
    });
});
