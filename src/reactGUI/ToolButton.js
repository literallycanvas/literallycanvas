import React from "react";
import DOM from "react-dom-factories";
import { classSet } from "../core/util";
import { _ } from "../core/localization";


class ToolButton extends React.Component {
    getDefaultProps() {
        return {isSelected: false, lc: null};
    }

    UNSAFE_componentWillMount() {
        if (this.props.isSelected) {
            // prevent race condition with options, tools getting set
            // (I've already forgotten the specifics of this; should reinvestigate
            // and explain here. --steve)
            return this.props.lc.setTool(tool);
        }
    }

    render() {
        const {div, img} = DOM;
        const {imageURLPrefix, isSelected, onSelect, tool} = this.props;

        const className = classSet({
            "lc-pick-tool": true,
            "toolbar-button": true,
            "thin-button": true,
            "selected": isSelected
        });
        const src = `${imageURLPrefix}/${tool.imageName}.png`;
        return (div({
            className,
            style: {"backgroundImage": `url(${src})`},
            onClick() { return onSelect(tool) }, title: _(tool.displayName)}));
    }
}


export default ToolButton;