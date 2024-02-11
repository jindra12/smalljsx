import { mount } from ".";
import { Component, ParentComponent } from "./types";

export const Test: Component = () => (
    <h1><div>DIV!</div>H1!<input name="Hello" /></h1>
);

export const Test1: ParentComponent = (props) => (
    <h3><Test />{props.children}</h3>
);

export const Test2: Component = () => (
    <Test1><><div /></></Test1>
);

mount(<Test2 />);