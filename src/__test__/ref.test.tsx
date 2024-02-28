// import preview from "jest-preview";
import $ from "jquery";
import { mount, useState, __reset, useRef, useEffect, Ref } from "../index";
import { Component } from "../types";
jest.useFakeTimers();

describe("Can use ref to get rendered layout", () => {
    beforeEach(() => {
        document.body.innerHTML = "<div id='root' />";
    });
    afterEach(() => {
        __reset();
    });
    it("Can use ref to pull HTML elements", () => {
        let refContents: HTMLTableElement | undefined = undefined;
        const TestComponent: Component = () => {
            const tableRef = useRef<HTMLTableElement>();
            useEffect(
                () => {
                    refContents = tableRef.current;
                },
                "after-render",
                []
            );
            return (
                <table ref={tableRef}>
                    <tr>
                        <td>First cell</td>
                    </tr>
                    <tr>
                        <td>Second cell</td>
                    </tr>
                </table>
            );
        };
        mount(<TestComponent />, "#root");
        jest.runAllTimers();
        expect(refContents).toBeTruthy();
        expect(refContents!.parentElement).toBeTruthy();
        expect($(refContents!).find("tr").length).toEqual(2);
    });
    it("Can pull correct HTML state after update", () => {
        let refContents: HTMLTableElement | undefined = undefined;
        const TestComponent: Component = () => {
            const tableRef = useRef<HTMLTableElement>();
            const [state, setState] = useState(1);
            useEffect(
                () => {
                    refContents = tableRef.current;
                },
                "after-render",
                [state]
            );
            return (
                <table ref={tableRef}>
                    <tr>
                        <td>{state}</td>
                    </tr>
                    <tr>
                        <td>
                            <button id="click" onclick={() => setState(state + 1)}>
                                Increment
                            </button>
                        </td>
                    </tr>
                </table>
            );
        };
        mount(<TestComponent />, "#root");
        jest.runAllTimers();
        $("#click")[0].click();
        jest.runAllTimers();
        expect(refContents).toBeTruthy();
        expect(refContents!.parentElement).toBeTruthy();
        expect($(refContents!).find("tr:first-child > td").text()).toEqual("2");
    });
    it("Can pass ref through another component", () => {
        let refContents: HTMLTableElement | undefined = undefined;
        const Table: Component<{
            ref: Ref<HTMLTableElement>;
            state: number;
            setState: (value: number) => void;
        }> = (props) => {
            return (
                <table ref={props.ref}>
                    <tr>
                        <td>{props.state}</td>
                    </tr>
                    <tr>
                        <td>
                            <button
                                id="click"
                                onclick={() => props.setState(props.state + 1)}
                            >
                                Increment
                            </button>
                        </td>
                    </tr>
                </table>
            );
        };
        const TestComponent: Component = () => {
            const tableRef = useRef<HTMLTableElement>();
            const [state, setState] = useState(1);
            useEffect(
                () => {
                    refContents = tableRef.current;
                },
                "after-render",
                [state]
            );
            return <Table ref={tableRef} setState={setState} state={state} />;
        };
        mount(<TestComponent />, "#root");
        jest.runAllTimers();
        $("#click")[0].click();
        jest.runAllTimers();
        expect(refContents).toBeTruthy();
        expect(refContents!.parentElement).toBeTruthy();
        expect($(refContents!).find("tr:first-child > td").text()).toEqual("2");
    });
});
