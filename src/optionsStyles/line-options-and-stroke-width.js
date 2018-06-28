import React from "react";
import { defineOptionsStyle } from "./optionsStyles";
import StrokeWidthPicker from "../reactGUI/StrokeWidthPicker";
import { classSet } from "../core/util";


class LineOptionsAndStrokeWidth extends React.Component {

    constructor() {
        super();

        this.state = { strokeWidth: 0, isDashed: false, hasEndArrow: true, };
    }

    static getDerivedStateFromProps(props) {
        let tool = props.tool;
        return {
            strokeWidth: tool.strokeWidth,
            isDashed: tool.isDashed,
            hasEndArrow: tool.hasEndArrow,
        };
    }

    getState() {
        return LineOptionsAndStrokeWidth.getDerivedStateFromProps(this.props);
    }

    componentDidMount() {
        this.unsubscribe = this.props.lc.on("toolChange", () => this.setState(this.getState()));
    }

    componentWillUnmount() { this.unsubscribe() }

    render() {
        const toggleIsDashed = () => {
            this.props.tool.isDashed = !this.props.tool.isDashed;
            return this.setState(this.getState());
        };
        const togglehasEndArrow = () => {
            this.props.tool.hasEndArrow = !this.props.tool.hasEndArrow;
            return this.setState(this.getState());
        };

        const dashButtonClass = classSet({
            "square-toolbar-button": true,
            "selected": this.state.isDashed
        });
        const arrowButtonClass = classSet({
            "square-toolbar-button": true,
            "selected": this.state.hasEndArrow
        });
        const style = {float: "left", margin: 1};

        return (
            <div>
                <div className={dashButtonClass} onClick={toggleIsDashed} style={style}>
                    <img src={`${this.props.imageURLPrefix}/dashed-line.png`} />
                </div>

                <div className={arrowButtonClass} onClick={togglehasEndArrow} style={style}>
                    <img src={`${this.props.imageURLPrefix}/line-with-arrow.png`} />
                </div>

                <StrokeWidthPicker tool={this.props.tool} lc={this.props.lc} />
            </div>
        );
    }
}


defineOptionsStyle("line-options-and-stroke-width", LineOptionsAndStrokeWidth);