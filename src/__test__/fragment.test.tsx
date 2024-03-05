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
            return <>{props.children}<div>Not me!</div></>;
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
    it("Can render multiple children on mount", () => {
        Small.mount(<><div>Yes</div><div>No</div></>, "#root");
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
        Small.mount(<><Test1 /><Test2 /></>, "#root");
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
        const Parent: Small.Component<{ children: (state: number) => JSX.Element }> = (props) => {
            const [state, setState] = Small.useState(1);
            return (
                <>
                    {props.children(state)}
                    <button id="click" onclick={() => setState(state + 1)}>Click me</button>
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
            )
        };
        Small.mount(<><Container /></>, "#root");
        jest.runAllTimers();
        $("#click")[0].click();
        jest.runAllTimers();
        expect($(".test")[0].innerHTML).toBe("2");
        expect($(".taste")[0].innerHTML).toBe("2");
    })
});
