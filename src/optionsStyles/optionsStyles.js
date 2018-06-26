/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
import React from '../reactGUI/React-shim';

const optionsStyles = {};

const defineOptionsStyle = (name, style) => optionsStyles[name] = React.createFactory(style);

export default {optionsStyles, defineOptionsStyle};