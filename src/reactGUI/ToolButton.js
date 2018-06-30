import React from "react";
import { classSet } from "../core/util";
import { _ } from "../core/localization";


class ToolButton extends React.Component {
    UNSAFE_componentWillMount() {
        if (this.props.isSelected) {
            // prevent race condition with options, tools getting set
            // (I've already forgotten the specifics of this; should reinvestigate
            // and explain here. --steve)
            this.props.lc.setTool(this.props.tool);
        }
    }

    render() {
        const {imageURLPrefix, isSelected, onSelect, tool} = this.props;

        const className = classSet({
            "lc-pick-tool": true,
            "toolbar-button": true,
            "thin-button": true,
            "selected": isSelected
        });
        const src = `${imageURLPrefix}/${tool.iconName}.png`;
        return (
            <div
                className={className}
                style={{"backgroundImage": `url(${src})`}}
                onClick={ () => { onSelect(tool) } }
                title={_(tool.name)}
            />
        );
    }
}

ToolButton.defaultProps = {
    isSelected: false,
    lc: null,
};


export default ToolButton;