import React from "react";
import { classSet } from "../core/util";


class StrokeWidthPicker extends React.Component {

    constructor() {
        super();

        this.state = { strokeWidth: 1 };
    }

    static getDerivedStateFromProps(props) {
        return {
            strokeWidth: props.tool.strokeWidth,
        };
    }

    getState() {
        return StrokeWidthPicker.getDerivedStateFromProps(this.props);
    }

    componentDidMount() {
        this.unsubscribe = this.props.lc.on("toolDidUpdateOptions", () => this.setState(this.getState()));
    }

    componentWillUnmount() { this.unsubscribe() }

    render() {
        const { strokeWidths } = this.props.lc.opts;

        return (
            <div>
                {strokeWidths.map((strokeWidth, ix) => {
                    const buttonClassName = classSet({
                        "square-toolbar-button": true,
                        "selected": strokeWidth === this.state.strokeWidth
                    });
                    const buttonSize = 28;
                    return (
                        <div key={strokeWidth}>
                            <div
                                className={buttonClassName}
                                onClick={ () => this.props.lc.trigger("setStrokeWidth", strokeWidth) }
                            >
                                <svg
                                    width={buttonSize-2} height={buttonSize-2}
                                    viewport={`0 0 ${strokeWidth} ${strokeWidth}`}
                                    version="1.1"
                                    xmlns="http://www.w3.org/2000/svg"
                                >
                                    <circle
                                        cx={Math.ceil((buttonSize/2)-1)}
                                        cy={Math.ceil((buttonSize/2)-1)}
                                        r={strokeWidth/2}
                                    />
                                </svg>
                            </div>
                        </div>
                    );
                })}
            </div>
        );
    }
}


export default StrokeWidthPicker;