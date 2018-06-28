import React from "react";
import { defineOptionsStyle } from "./optionsStyles";
import { _ } from "../core/localization";


class StrokeOrFillPicker extends React.Component {
    constructor() {
        super();

        this.onChange = this.onChange.bind(this);

        this.state = {
            strokeOrFill: "stroke"
        };
    }

    componentDidMount() {
        this.unsubscribe = this.props.lc.on("toolChange", () => this.setState({ strokeOrFill: "stroke" }));
    }

    componentWillUnmount() { this.unsubscribe() }

    onChange(e) {
        if (e.target.id == "stroke-or-fill-stroke") {
            this.props.lc.tool.strokeOrFill = "stroke";
        } else {
            this.props.lc.tool.strokeOrFill = "fill";
        }
        this.setState(this.getState());
    }

    render() {
        const lc = this.props.lc;

        return <form>
            <span> {_("Color to change:")} </span>
            <span>
                <input type="radio" name="stroke-or-fill" value="stroke"
                    id="stroke-or-fill-stroke" onChange={this.onChange}
                    checked={lc.tool.strokeOrFill == "stroke"} />
                <label htmlFor="stroke-or-fill-stroke" className="label"> {_("stroke")}</label>
            </span>
            <span>
                <input type="radio" name="stroke-or-fill" value="fill"
                    id="stroke-or-fill-fill" onChange={this.onChange}
                    checked={lc.tool.strokeOrFill == "fill"} />
                <label htmlFor="stroke-or-fill-fill" className="label"> {_("fill")}</label>
            </span>
        </form>;
    }
}


defineOptionsStyle("stroke-or-fill", StrokeOrFillPicker);