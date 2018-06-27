import React from "../reactGUI/React-shim";

const optionsStyles = {};

const defineOptionsStyle = (name, style) => optionsStyles[name] = React.createFactory(style);

export default {optionsStyles, defineOptionsStyle};