import "React" from "react";
import DOM from "react-dom-factories";
import { defineOptionsStyle } from "./optionsStyles";


class NoOptions extends React.Component {
    render() { return DOM.div() }
}


defineOptionsStyle("null", NoOptions);