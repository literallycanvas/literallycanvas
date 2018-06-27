import DOM from "react-dom-factories";
import createReactClass from "create-react-class";
import { defineOptionsStyle } from "./optionsStyles";


defineOptionsStyle("null", createReactClass({
    displayName: "NoOptions",
    render() { return DOM.div() }
})
);


export default {};