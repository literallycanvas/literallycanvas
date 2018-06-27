import React from "react";
import { defineOptionsStyle } from "./optionsStyles";


class NoOptions extends React.Component {
    render() { return <div /> }
}


defineOptionsStyle("null", NoOptions);