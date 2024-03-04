// import preview from "jest-preview";
import $ from "jquery";
import * as Small from "../index";
jest.useFakeTimers();

describe("Can use fragments", () => {
    beforeEach(() => {
        document.body.innerHTML = "<div id='root' />";
    });
    afterEach(() => {
        Small.__reset();
    });
    it("Can use simple fragments", () => {
        const Parent: Small.ParentComponent = (props) => {
            return <>{props.children}<div>Not me!</div></>;
        };
        const Component: Small.Component = () => {
            return (
                <Parent>
                    <>Click me!</>
                </Parent>
            );
        };
        Small.mount(<Component />, "#root");
        jest.runAllTimers();
        expect($("#root")[0].outerHTML).toEqual(
            '<div id="root">Click me!<div>Not me!</div></div>'
        );
    });
});
