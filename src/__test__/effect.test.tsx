import $ from "jquery";
import {
    mount,
    useState,
    __reset,
    useEffect,
    useMountEffect,
    useRef,
    useEachRenderEffect,
    useUnmountEffect,
} from "../index";
import { Component } from "../types";
jest.useFakeTimers();

describe("Can use before/after render effects", () => {
    beforeEach(() => {
        document.body.innerHTML = "<div id='root' />";
    });
    afterEach(() => {
        __reset();
    });
    it("Can use useMountEffect", () => {
        let called = 0;
        const TestComponent: Component = () => {
            const [state, setState] = useState(0);
            useMountEffect(() => {
                called++;
            });
            return (
                <button id="click" onclick={() => setState(state + 1)}>
                    {state}
                </button>
            );
        };
        mount(<TestComponent />, "#root");
        jest.runAllTimers();
        expect(called).toBe(1);
        $("#click")[0].click();
        jest.runAllTimers();
        expect(called).toBe(1);
    });
    it("Can use before render effect", () => {
        let called = 0;
        let beforeRenderContents = "";
        const TestComponent: Component = () => {
            const [state, setState] = useState(0);
            const ref = useRef<HTMLButtonElement>();
            useEffect(
                () => {
                    called++;
                    beforeRenderContents = ref.current?.innerText || "";
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
        mount(<TestComponent />, "#root");
        jest.runAllTimers();
        expect(called).toBe(1);
        $("#click")[0].click();
        jest.runAllTimers();
        expect(called).toBe(2);
        expect(beforeRenderContents).toEqual("0");
    });
    it("Can use after render effect", () => {
        let called = 0;
        let beforeRenderContents = "";
        const TestComponent: Component = () => {
            const [state, setState] = useState(0);
            const ref = useRef<HTMLButtonElement>();
            useEffect(
                () => {
                    called++;
                    beforeRenderContents = ref.current?.innerText || "";
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
        mount(<TestComponent />, "#root");
        jest.runAllTimers();
        expect(called).toBe(1);
        $("#click")[0].click();
        jest.runAllTimers();
        expect(called).toBe(2);
        expect(beforeRenderContents).toEqual("1");
    });
    it("Can use each state update before effect", () => {
        let called = 0;
        let beforeRenderContents = "";
        const TestComponent: Component = () => {
            const [state, setState] = useState(0);
            const ref = useRef<HTMLButtonElement>();
            useEachRenderEffect(() => {
                called++;
                beforeRenderContents = ref.current?.innerText || "";
            }, "before-render");
            return (
                <button ref={ref} id="click" onclick={() => setState(state + 1)}>
                    {state}
                </button>
            );
        };
        mount(<TestComponent />, "#root");
        jest.runAllTimers();
        expect(called).toBe(1);
        $("#click")[0].click();
        jest.runAllTimers();
        expect(called).toBe(2);
        expect(beforeRenderContents).toEqual("0");
    });
    it("Can use each state update after effect", () => {
        let called = 0;
        let beforeRenderContents = "";
        const TestComponent: Component = () => {
            const [state, setState] = useState(0);
            const ref = useRef<HTMLButtonElement>();
            useEachRenderEffect(() => {
                called++;
                beforeRenderContents = ref.current?.innerText || "";
            }, "after-render");
            return (
                <button ref={ref} id="click" onclick={() => setState(state + 1)}>
                    {state}
                </button>
            );
        };
        mount(<TestComponent />, "#root");
        jest.runAllTimers();
        expect(called).toBe(1);
        $("#click")[0].click();
        jest.runAllTimers();
        expect(called).toBe(2);
        expect(beforeRenderContents).toEqual("0");
    });
    it("Can use unmount effect", () => {
        let called = 0;
        let unmountContents = "";
        const Unmountable = (props: { onUnmount: () => void }) => {
            useUnmountEffect(() => {
                props.onUnmount();
                called++;
            });
            return <div>This should not be here</div>;
        };
        const TestComponent = () => {
            const [state, setState] = useState(0);
            const ref = useRef<HTMLDivElement>();
            useEffect(
                () => {
                    if (state < 2) {
                        setState(state + 1);
                    }
                },
                "after-render",
                [state]
            );
            return (
                <div className="test" ref={ref}>
                    {state < 2 ? (
                        <Unmountable
                            onUnmount={() => (unmountContents = ref.current?.innerText || "")}
                        />
                    ) : null}
                    {state}
                </div>
            );
        };
        mount(<TestComponent />, "#root");
        jest.runAllTimers();
        jest.runAllTimers();
        jest.runAllTimers();
        expect(called).toEqual(1);
        expect(unmountContents).toEqual("3");
    });
});
