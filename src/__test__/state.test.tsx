// import preview from "jest-preview";
import $ from "jquery";
import { mount, useState } from "../index";
import { Component } from "../types";
jest.useFakeTimers();

describe("Should update HTML structures with useState", () => {
    beforeEach(() => {
        document.body.innerHTML = "<div id='root' />";
    });
    it("Can use state and a button to update div content", () => {
        const TestComponent: Component = () => {
            const [state, setState] = useState(1);
            return (
                <div>
                    State <div className="test">{state}</div>
                    <button id="click" onclick={() => setState(state + 1)}>Update!</button>
                </div>
            );
        };
        mount(<TestComponent />, "#root");
        expect($(".test").text()).toBe("1");
        $("#click")[0].click();
        jest.runAllTimers();
        expect($(".test").text()).toBe("2");
        $("#click")[0].click();
        $("#click")[0].click();
        $("#click")[0].click();
        expect($(".test").text()).toBe("5");
    });
});