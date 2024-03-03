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
    it("Can use state updates correctly", () => { });
    it("Can use before render effects correctly", () => { });
    it("Can use after effects correctly", () => { });
});
