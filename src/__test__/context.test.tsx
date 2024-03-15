// import preview from "jest-preview";
import $ from "jquery";
import * as Small from "../index";

jest.useFakeTimers();

describe("Can use context", () => {
    beforeEach(() => {
        document.body.innerHTML = "<div id='root' />";
    });
    afterEach(() => {
        Small.__reset();
    });
    it("Can use component context", () => {
        interface Context {
            state: number;
            setState: (value: number) => void;
        }
        const context = Small.createContext<Context>();
        const ContextHolder: Small.ParentComponent = (props) => {
            const [state, setState] = Small.useState(0);
            Small.useSetContext(context, {
                setState: setState,
                state: state,
            });
            return (
                <>{props.children}</>
            );
        };
        const Child: Small.Component = () => {
            const ctx = Small.useContext(context);
            return (
                <button id="click" onclick={() => ctx?.setState(ctx?.state + 1)}>
                    {ctx?.state}
                </button>
            );
        };
        const Parent: Small.Component = () => {
            return (
                <ContextHolder>
                    <Child />
                </ContextHolder>
            );
        };
        Small.mount(<Parent />, "#root");
        jest.runAllTimers();
        expect($("#click")[0].innerHTML).toEqual("0");
        $("#click")[0].click();
        jest.runAllTimers();
        expect($("#click")[0].innerHTML).toEqual("1");
        $("#click")[0].click();
        jest.runAllTimers();
        expect($("#click")[0].innerHTML).toEqual("2");
    });
});
