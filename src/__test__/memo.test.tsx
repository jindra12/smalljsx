import $ from "jquery";
import { mount,  __reset, useMemo, useState } from "../index";
import { Component } from "../types";
jest.useFakeTimers();

describe("Should cache and update information with useMemo", () => {
    beforeEach(() => {
        document.body.innerHTML = "<div id='root' />";
    });
    afterEach(() => {
        __reset();
    });
    it("Can remember a memo and not update without dependencies", () => {
        let called = 0;
        const callCounter = () => called++;
        const TestComponent: Component = () => {
            const [state, setState] = useState(1);
            const value = useMemo(() => {
                callCounter();
                return 1;
            }, []);
            return (
                <div>
                    <div className="test">{value}</div>
                    <button id="click" onclick={() => setState(state + 1)}>Update state</button>
                </div>
            );
        };
        mount(<TestComponent />, "#root");
        expect($(".test").text()).toBe("1");
        $("#click")[0].click();
        jest.runAllTimers();
        $("#click")[0].click();
        jest.runAllTimers();
        expect(called).toEqual(1);
    });
    it("Can update memo based on state change", () => {
        let called = 0;
        const callCounter = () => called++;
        const TestComponent: Component = () => {
            const [state, setState] = useState(1);
            const multiple = useMemo(() => {
                callCounter();
                return state * 2;
            }, [state]);
            return (
                <div>
                    <div className="test">{multiple}</div>
                    <button id="click" onclick={() => setState(state + 1)}>Update state</button>
                </div>
            );
        };
        mount(<TestComponent />, "#root");
        expect($(".test").text()).toBe("2");
        $("#click")[0].click();
        jest.runAllTimers();
        expect($(".test").text()).toBe("4");
        $("#click")[0].click();
        jest.runAllTimers();
        expect($(".test").text()).toBe("6");
        expect(called).toEqual(3);
    });
    it("Can update memo based on props change", () => {
        let called = 0;
        const callCounter = () => called++;
        const Addition: Component = () => {
            const [state, setState] = useState(1);
            return (
                <div>
                    <Multiplication state={state} />
                    <button id="click" onclick={() => setState(state + 1)}>Update state</button>
                </div>
            );
        };
        const Multiplication: Component<{ state: number }> = (props) => {
            const multiple = useMemo(() => {
                callCounter();
                return props.state * 2;
            }, [props.state]);
            return (
                <div className="test">{multiple}</div>
            );
        };
        mount(<Addition />, "#root");
        expect($(".test").text()).toBe("2");
        $("#click")[0].click();
        jest.runAllTimers();
        expect($(".test").text()).toBe("4");
        $("#click")[0].click();
        jest.runAllTimers();
        expect($(".test").text()).toBe("6");
        expect(called).toEqual(3);
    });
    it("Can update memo based on multiple dependencies", () => {
        let called = 0;
        const callCounter = () => called++;
        const Addition: Component = () => {
            const [addition, setAddition] = useState(1);
            const [multiplication, setMultiplication] = useState(1);
            return (
                <div>
                    <MemoDisplay addition={addition} multiplication={multiplication} />
                    <button id="click" onclick={() => {
                        setAddition(addition + 1);
                        setMultiplication(multiplication * 2);
                    }}>Update state</button>
                </div>
            );
        };
        const MemoDisplay: Component<{ addition: number, multiplication: number }> = (props) => {
            const multiple = useMemo(() => {
                callCounter();
                return `${props.addition} + ${props.multiplication}`;
            }, [props.addition, props.multiplication]);
            return (
                <div className="test">{multiple}</div>
            );
        };
        mount(<Addition />, "#root");
        expect($(".test").text()).toBe("1 + 1");
        $("#click")[0].click();
        jest.runAllTimers();
        expect($(".test").text()).toBe("2 + 2");
        $("#click")[0].click();
        jest.runAllTimers();
        expect($(".test").text()).toBe("3 + 4");
        $("#click")[0].click();
        jest.runAllTimers();
        expect($(".test").text()).toBe("4 + 8");
        expect(called).toEqual(4);
    });
    it("Can update memo based on multiple component", () => {
        let called = 0;
        const callCounter = () => called++;
        const Addition: Component = () => {
            const [addition, setAddition] = useState(1);
            return (
                <Multiplication addition={addition} setAddition={setAddition} />
            );
        };
        const Multiplication: Component<{ addition: number, setAddition: (value: number) => void }> = (props) => {
            const [multiplication, setMultiplication] = useState(1);
            return (
                <div>
                    <MemoDisplay addition={props.addition} multiplication={multiplication} />
                    <button id="click" onclick={() => {
                        props.setAddition(props.addition + 1);
                        setMultiplication(multiplication * 2);
                    }}>Update state</button>
                </div>
            );
        };
        const MemoDisplay: Component<{ addition: number, multiplication: number }> = (props) => {
            const multiple = useMemo(() => {
                callCounter();
                return `${props.addition} + ${props.multiplication}`;
            }, [props.addition, props.multiplication]);
            return (
                <div className="test">{multiple}</div>
            );
        };
        mount(<Addition />, "#root");
        expect($(".test").text()).toBe("1 + 1");
        $("#click")[0].click();
        jest.runAllTimers();
        expect($(".test").text()).toBe("2 + 2");
        $("#click")[0].click();
        jest.runAllTimers();
        expect($(".test").text()).toBe("3 + 4");
        $("#click")[0].click();
        jest.runAllTimers();
        expect($(".test").text()).toBe("4 + 8");
        expect(called).toEqual(4);
    });
});