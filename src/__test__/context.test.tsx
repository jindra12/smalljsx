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
    it("Can use double context", () => {
        interface Context1 {
            state: number;
            setState: (value: number) => void;
        }
        const context1 = Small.createContext<Context1>();
        interface Context2 {
            state: number;
            setState: (value: number) => void;
        }
        const context2 = Small.createContext<Context2>();
        const ContextHolder1: Small.ParentComponent = (props) => {
            const [state, setState] = Small.useState(1);
            Small.useSetContext(context1, {
                setState: setState,
                state: state,
            });
            return (
                <>{props.children}</>
            );
        };
        const ContextHolder2: Small.ParentComponent = (props) => {
            const [state, setState] = Small.useState(1);
            Small.useSetContext(context2, {
                setState: setState,
                state: state,
            });
            return (
                <>{props.children}</>
            );
        };
        const Child: Small.Component = () => {
            const ctx1 = Small.useContext(context1);
            const ctx2 = Small.useContext(context2);
            return (
                <button id="click" onclick={() => {
                    ctx1?.setState(ctx1?.state + 1)
                    ctx2?.setState(ctx2?.state * 2)
                }}>
                    {ctx1?.state} + {ctx2?.state}
                </button>
            );
        };
        const Container = () => (
            <ContextHolder1>
                <ContextHolder2>
                    <Child />
                </ContextHolder2>
            </ContextHolder1>
        );
        Small.mount(<Container />, "#root");
        jest.runAllTimers();
        expect($("#click")[0].innerHTML).toEqual("1 + 1");
        $("#click")[0].click();
        jest.runAllTimers();
        expect($("#click")[0].innerHTML).toEqual("2 + 2");
        $("#click")[0].click();
        jest.runAllTimers();
        expect($("#click")[0].innerHTML).toEqual("3 + 4");
    });
    it("Can use contexts without children", () => {
        interface Context1 {
            state: number;
            setState: (value: number) => void;
        }
        const context1 = Small.createContext<Context1>();
        interface Context2 {
            state: number;
            setState: (value: number) => void;
        }
        const context2 = Small.createContext<Context2>();
        const ContextHolder1: Small.Component = () => {
            const [state, setState] = Small.useState(1);
            Small.useSetContext(context1, {
                setState: setState,
                state: state,
            });
            return (
                <Child />
            );
        };
        const ContextHolder2: Small.ParentComponent = () => {
            const [state, setState] = Small.useState(1);
            Small.useSetContext(context2, {
                setState: setState,
                state: state,
            });
            return (
                <ContextHolder1 />
            );
        };
        const Child: Small.Component = () => {
            const ctx1 = Small.useContext(context1);
            const ctx2 = Small.useContext(context2);
            return (
                <button id="click" onclick={() => {
                    ctx1?.setState(ctx1?.state + 1);
                    ctx2?.setState(ctx2?.state * 2);
                }}>
                    {ctx1?.state} + {ctx2?.state}
                </button>
            );
        };
        Small.mount(<ContextHolder2 />, "#root");
        jest.runAllTimers();
        expect($("#click")[0].innerHTML).toEqual("1 + 1");
        $("#click")[0].click();
        jest.runAllTimers();
        expect($("#click")[0].innerHTML).toEqual("2 + 2");
        $("#click")[0].click();
        jest.runAllTimers();
        expect($("#click")[0].innerHTML).toEqual("3 + 4");
    });
});
