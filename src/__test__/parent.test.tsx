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
        expect($("#root")[0].outerHTML).toMatchSnapshot();
    });
    it("Can use children conditionally", () => {

    });
    it("Can use function as children", () => {

    });
    it("Can use state updates correctly", () => {

    });
    it("Can use before render effects correctly", () => {

    });
    it("Can use after effects correctly", () => {

    });
});