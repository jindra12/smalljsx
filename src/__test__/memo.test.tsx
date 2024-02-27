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
});