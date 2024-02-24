// import preview from "jest-preview";
import $ from "jquery";
import { mount } from "../index";

describe("Should show basic HTML structures correctly", () => {
    beforeEach(() => {
        document.body.innerHTML = "<div id='root' />";
    });
    it("Renders a div with ID", () => {
        mount(<div id="one" />, "#root");
        expect($("#one").length).toBe(1);
    });
    it("Renders a div with name, class and content", () => {
        mount(<div className="one">I can't believe this is not React!</div>, "#root");
        expect($(".one").text()).toBe("I can't believe this is not React!");
    });
});