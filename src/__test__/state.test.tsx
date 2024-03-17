// import preview from "jest-preview";
import $ from "jquery";
import { mount, useState, __reset, Component } from "../index";
jest.useFakeTimers();

describe("Should update HTML structures with useState", () => {
    beforeEach(() => {
        document.body.innerHTML = "<div id='root' />";
    });
    afterEach(() => {
        __reset();
    });
    it("Can use state and a button to update div content", () => {
        const TestComponent: Component = () => {
            const [state, setState] = useState(1);
            return (
                <div>
                    State <div className="test">{state}</div>
                    <button
                        id="click"
                        onclick={() => {
                            setState(state + 1);
                        }}
                    >
                        Update!
                    </button>
                </div>
            );
        };
        mount(<TestComponent />, "#root");
        expect($(".test").text()).toBe("1");
        $("#click")[0].click();
        jest.runAllTimers();
        expect($(".test").text()).toBe("2");
        $("#click")[0].click();
        jest.runAllTimers();
        expect($(".test").text()).toBe("3");
        $("#click")[0].click();
        jest.runAllTimers();
        expect($(".test").text()).toBe("4");
        $("#click")[0].click();
        jest.runAllTimers();
        expect($(".test").text()).toBe("5");
    });
    it("Can pass state to child component", () => {
        const Stateful: Component = () => {
            const [state, setState] = useState(1);
            return <Display setState={setState} state={state} />;
        };
        const Display: Component<{
            state: number;
            setState: (value: number) => void;
        }> = (props) => {
            return (
                <div>
                    State <div className="test">{props.state}</div>
                    <button
                        id="click"
                        onclick={() => {
                            props.setState(props.state + 1);
                        }}
                    >
                        Update!
                    </button>
                </div>
            );
        };
        mount(<Stateful />, "#root");
        expect($(".test").text()).toBe("1");
        $("#click")[0].click();
        jest.runAllTimers();
        expect($(".test").text()).toBe("2");
        $("#click")[0].click();
        jest.runAllTimers();
        expect($(".test").text()).toBe("3");
        $("#click")[0].click();
        jest.runAllTimers();
        expect($(".test").text()).toBe("4");
        $("#click")[0].click();
        jest.runAllTimers();
        expect($(".test").text()).toBe("5");
    });
    it("Can handle multiple states", () => {
        const TestComponent: Component = () => {
            const [additive, setAdditive] = useState(1);
            const [multiplicative, setMultiplicative] = useState(1);
            return (
                <div>
                    State{" "}
                    <div className="test">
                        {additive} + {multiplicative}
                    </div>
                    <button
                        id="click"
                        onclick={() => {
                            setAdditive(additive + 1);
                            setMultiplicative(multiplicative * 2);
                        }}
                    >
                        Update!
                    </button>
                </div>
            );
        };
        mount(<TestComponent />, "#root");
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
        $("#click")[0].click();
        jest.runAllTimers();
        expect($(".test").text()).toBe("5 + 16");
    });
    it("Can handle state updates across multiple components", () => {
        const Additive: Component = () => {
            const [additive, setAdditive] = useState(1);
            return <Multiplicative setAdditive={setAdditive} additive={additive} />;
        };
        const Multiplicative: Component<{
            additive: number;
            setAdditive: (value: number) => void;
        }> = (props) => {
            const [multiplicative, setMultiplicative] = useState(1);
            return (
                <div>
                    State{" "}
                    <div className="test">
                        {props.additive} + {multiplicative}
                    </div>
                    <button
                        id="click"
                        onclick={() => {
                            props.setAdditive(props.additive + 1);
                            setMultiplicative(multiplicative * 2);
                        }}
                    >
                        Update!
                    </button>
                </div>
            );
        };
        mount(<Additive />, "#root");
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
        $("#click")[0].click();
        jest.runAllTimers();
        expect($(".test").text()).toBe("5 + 16");
    });
    it("Can handle state updates across multiple components in opposite order", () => {
        const Additive: Component = () => {
            const [additive, setAdditive] = useState(1);
            return <Multiplicative setAdditive={setAdditive} additive={additive} />;
        };
        const Multiplicative: Component<{
            additive: number;
            setAdditive: (value: number) => void;
        }> = (props) => {
            const [multiplicative, setMultiplicative] = useState(1);
            return (
                <div>
                    State{" "}
                    <div className="test">
                        {props.additive} + {multiplicative}
                    </div>
                    <button
                        id="click"
                        onclick={() => {
                            setMultiplicative(multiplicative * 2);
                            props.setAdditive(props.additive + 1);
                        }}
                    >
                        Update!
                    </button>
                </div>
            );
        };
        mount(<Additive />, "#root");
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
        $("#click")[0].click();
        jest.runAllTimers();
        expect($(".test").text()).toBe("5 + 16");
    });
    it("Can handle state updates in components rendering content separately", () => {
        const Additive: Component = () => {
            const [additive, setAdditive] = useState(1);
            return (
                <div className="additive-test">
                    <div>{additive}</div>
                    <button
                        id="additive-click"
                        onclick={() => {
                            setAdditive(additive + 1);
                        }}
                    >
                        Update!
                    </button>
                    <Multiplicative />
                </div>
            );
        };
        const Multiplicative: Component = () => {
            const [multiplicative, setMultiplicative] = useState(1);
            return (
                <div className="multiplicative-test">
                    <div>{multiplicative}</div>
                    <button
                        id="multiplicative-click"
                        onclick={() => {
                            setMultiplicative(multiplicative * 2);
                        }}
                    >
                        Update!
                    </button>
                </div>
            );
        };
        mount(<Additive />, "#root");
        expect($(".additive-test > div:first-child").text()).toBe("1");
        expect($(".multiplicative-test > div:first-child").text()).toBe("1");
        $("#additive-click")[0].click();
        $("#multiplicative-click")[0].click();
        jest.runAllTimers();
        expect($(".additive-test > div:first-child").text()).toBe("2");
        expect($(".multiplicative-test > div:first-child").text()).toBe("2");
        $("#additive-click")[0].click();
        $("#multiplicative-click")[0].click();
        jest.runAllTimers();
        expect($(".additive-test > div:first-child").text()).toBe("3");
        expect($(".multiplicative-test > div:first-child").text()).toBe("4");
        $("#additive-click")[0].click();
        $("#multiplicative-click")[0].click();
        jest.runAllTimers();
        expect($(".additive-test > div:first-child").text()).toBe("4");
        expect($(".multiplicative-test > div:first-child").text()).toBe("8");
        $("#additive-click")[0].click();
        $("#multiplicative-click")[0].click();
        jest.runAllTimers();
    });
    it("Can update through update functions", () => {
        const TestComponent: Component = () => {
            const [state, setState] = useState(() => 1);
            return (
                <div>
                    State <div className="test">{state}</div>
                    <button
                        id="click"
                        onclick={() => {
                            setState(state => state + 1);
                        }}
                    >
                        Update!
                    </button>
                </div>
            );
        };
        mount(<TestComponent />, "#root");
        expect($(".test").text()).toBe("1");
        $("#click")[0].click();
        jest.runAllTimers();
        expect($(".test").text()).toBe("2");
        $("#click")[0].click();
        jest.runAllTimers();
        expect($(".test").text()).toBe("3");
        $("#click")[0].click();
        jest.runAllTimers();
        expect($(".test").text()).toBe("4");
        $("#click")[0].click();
        jest.runAllTimers();
        expect($(".test").text()).toBe("5");
    });
});
