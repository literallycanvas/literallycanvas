import React from "react";

const optionsStyles = {};

const defineOptionsStyle = (name, style) => optionsStyles[name] = React.createFactory(style);

export default {optionsStyles, defineOptionsStyle};