// import preview from "jest-preview";
import $ from "jquery";
import * as Small from "../index";
///@ts-ignore
import "jquery-sendkeys";

jest.useFakeTimers();

const sendKeys = (query: ReturnType<typeof $>, text: string) => {
    (query as any).sendkeys(text);
};

describe("Can use keys", () => {
    beforeEach(() => {
        document.body.innerHTML = "<div id='root' />";
    });
    afterEach(() => {
        Small.__reset();
    });
    it("Will remount component when key prop changes", () => {
        let mounted = 0;
        let unmounted = 0;
        const ToMount: Small.Component = () => {
            Small.useMountEffect(() => {
                mounted++;
            });
            Small.useUnmountEffect(() => {
                unmounted++;
            });
            return null;
        };
        const Parent: Small.Component = () => {
            const [state, setState] = Small.useState(0);
            return (
                <div>
                    <ToMount key={state} />
                    <input
                        type="button"
                        value="Update"
                        onclick={() => setState(state + 1)}
                    />
                </div>
            );
        };
        Small.mount(<Parent />, "#root");
        jest.runAllTimers();
        expect(mounted).toEqual(1);
        $("input[type='button']")[0].click();
        jest.runAllTimers();
        expect(mounted).toEqual(2);
        expect(unmounted).toEqual(2);
    });
    it("Will keep track of array elements when key prop changes", () => {
        const formResult: any = {};
        const Input: Small.Component<{ name: string }> = (props) => {
            const [input, setInput] = Small.useState("");
            return (
                <input
                    type="text"
                    name={props.name}
                    value={input}
                    oninput={(event) =>
                        setInput((event.target as HTMLInputElement).value)
                    }
                />
            );
        };
        const Form: Small.Component = () => {
            const [inputs, setInputs] = Small.useState<
                { name: string; }[]
            >([]);
            const [name, setName] = Small.useState("");
            return (
                <form onsubmit={(event) => {
                    event.preventDefault();
                    $(event.target as HTMLElement).find("input[name]").each((_, element) => {
                        formResult[element.getAttribute("name")!] = (element as HTMLInputElement).value;
                    });
                }}>
                    {inputs.map(i => <Input key={i.name} name={i.name} />)}
                    <input
                        id="name"
                        value={name}
                        oninput={(event) =>
                            setName((event.target as HTMLInputElement).value)
                        }
                    />
                    <button id="add" type="button" onclick={() => {
                        setInputs([...inputs, { name: name }])
                        setName("");
                    }}>Add</button>
                    <button id="remove" type="button" onclick={() => {
                        setInputs(inputs.filter((i) => i.name !== name))
                        setName("");
                    }}>Remove</button>
                    <button id="submit">Submit</button>
                </form>
            );
        };
        Small.mount(<Form />, "#root");
        jest.runAllTimers();
        sendKeys($("#name"), "Alice");
        jest.runAllTimers();
        $("#add")[0].click();
        jest.runAllTimers();
        sendKeys($("#name"), "Bob");
        jest.runAllTimers();
        $("#add")[0].click();
        jest.runAllTimers();
        sendKeys($("#name"), "Johnny");
        jest.runAllTimers();
        $("#add")[0].click();
        jest.runAllTimers();
        sendKeys($("#name"), "Murphy");
        jest.runAllTimers();
        $("#add")[0].click();
        jest.runAllTimers();
        sendKeys($("[name='Alice']"), "A+");
        sendKeys($("[name='Bob']"), "B-");
        sendKeys($("[name='Johnny']"), "A-");
        sendKeys($("[name='Murphy']"), "C+");
        sendKeys($("#name"), "Johnny");
        jest.runAllTimers();
        $("#remove")[0].click();
        jest.runAllTimers();
        sendKeys($("#name"), "Jill");
        jest.runAllTimers();
        $("#add")[0].click();
        jest.runAllTimers();
        sendKeys($("[name='Jill']"), "D");
        jest.runAllTimers();
        $("#submit")[0].click();
        jest.runAllTimers();
        expect(formResult).toEqual({
            Alice: "A+",
            Bob: "B-",
            Murphy: "C+",
            Jill: "D",
        });
    });
});
