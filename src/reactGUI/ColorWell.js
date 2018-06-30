import React from "react";
import { classSet } from "../core/util";
import { _ } from "../core/localization";


const parseHSLAString = function(s) {
    if (s === "transparent") { return {hue: 0, sat: 0, light: 0, alpha: 0} }
    if ((s != null ? s.substring(0, 4) : undefined) !== "hsla") { return null }

    const firstParen = s.indexOf("(");
    const lastParen = s.indexOf(")");
    const insideParens = s.substring(firstParen + 1, (lastParen - firstParen) + 4);
    const components = insideParens.split(",").map((ss) => ss.trim());

    return {
        hue: parseInt(components[0], 10),
        sat: parseInt(components[1].substring(0, components[1].length - 1), 10),
        light: parseInt(components[2].substring(0, components[2].length - 1), 10),
        alpha: parseFloat(components[3])
    };
};


const getHSLAString = ({hue, sat, light, alpha}) => `hsla(${hue}, ${sat}%, ${light}%, ${alpha})`;
const getHSLString = ({hue, sat, light}) => `hsl(${hue}, ${sat}%, ${light}%)`;


class ColorGrid extends React.PureComponent {
    render() {
        return (
            <div>
                { this.props.rows.map(
                    (row, ix) => (
                        <div className="color-row" key={ix} style={{width: 20 * row.length}}>
                            { row.map(
                                (cellColor, ix2) => {
                                    const {hue, sat, light, alpha} = cellColor;
                                    const colorString = getHSLAString(cellColor);
                                    const colorStringNoAlpha = `hsl(${hue}, ${sat}%, ${light}%)`;
                                    const className = classSet({
                                        "color-cell": true,
                                        "selected": this.props.selectedColor === colorString
                                    });
                                    const update = e => {
                                        this.props.onChange(cellColor, colorString);
                                        e.stopPropagation();
                                        e.preventDefault();
                                    };

                                    return (
                                        <div
                                            className={className}
                                            onTouchStart={update}
                                            onTouchMove={update}
                                            onClick={update}
                                            style={{backgroundColor: colorStringNoAlpha}}
                                            key={ix2}
                                        />
                                    );
                                }
                            )}
                        </div>
                    )
                )}
            </div>
        );
    }
}


class ColorWell extends React.PureComponent {
    constructor() {
        super();

        this.closePicker = this.closePicker.bind(this);
        this.togglePicker = this.togglePicker.bind(this);

        this.state = {
            colorString: null,
            alpha: 1,
            sat: 100,
            isPickerVisible: false,
            hsla: { alpha: 1, sat: 100, hue: 0, light: 50 },
        };
    }

    static getDerivedStateFromProps(props) {
        const colorString = props.lc.colors[props.colorName];

        let hsla = parseHSLAString(colorString);
        if (hsla == null) { hsla = {} }
        if (hsla.alpha == null) { hsla.alpha = 1 }
        if (hsla.sat == null) { hsla.sat = 100 }
        if (hsla.hue == null) { hsla.hue = 0 }
        if (hsla.light == null) { hsla.light = 50 }

        return {
            colorString,
            alpha: hsla.alpha,
            sat: hsla.sat === 0 ? 100 : hsla.sat,
            isPickerVisible: false,
            hsla
        };
    }

    // our color state tracks lc's
    componentDidMount() {
        this.unsubscribe = this.props.lc.on(`${this.props.colorName}ColorChange`, () => {
            const colorString = this.props.lc.colors[this.props.colorName];
            this.setState({colorString});
            this.setHSLAFromColorString(colorString);
        });
    }

    componentWillUnmount() {
        this.unsubscribe();
    }

    setHSLAFromColorString(c) {
        const hsla = parseHSLAString(c);
        if (hsla) {
            this.setState({hsla, alpha: hsla.alpha, sat: hsla.sat});
        } else {
            this.setState({hsla: null, alpha: 1, sat: 100});
        }
    }

    closePicker() {
        this.setState({isPickerVisible: false});
    }

    togglePicker() {
        const isPickerVisible = !this.state.isPickerVisible;
        const shouldResetSat = isPickerVisible && (this.state.sat === 0);
        this.setHSLAFromColorString(this.state.colorString);
        this.setState({isPickerVisible, sat: shouldResetSat ? 100 : this.state.sat});
    }

    setColor(c) {
        this.setState({colorString: c});
        this.setHSLAFromColorString(c);
        this.props.lc.setColor(this.props.colorName, c);
    }

    setAlpha(alpha) {
        this.setState({alpha});
        if (this.state.hsla) {
            const { hsla } = this.state;
            hsla.alpha = alpha;
            this.setState({hsla});
            this.setColor(getHSLAString(hsla));
        }
    }

    setSat(sat) {
        this.setState({sat});
        if (isNaN(sat)) { throw "SAT" }
        if (this.state.hsla) {
            const { hsla } = this.state;
            hsla.sat = sat;
            this.setState({hsla});
            this.setColor(getHSLAString(hsla));
        }
    }

    render() {
        let className = classSet({
            "color-well": true,
            "open": this.state.isPickerVisible ,
        });

        let className2 = classSet({
            "color-well-color-container": true,
            "selected": this.state.isPickerVisible
        });

        return (
            <div className={className} onMouseLeave={this.closePicker} style={{ float: "left", textAlign: "center" }} >
                <label float="left">
                    {this.props.label}
                </label>

                <br />

                <div className={className2} style={{backgroundColor: "white"}} onClick={this.togglePicker} >
                    <div className="color-well-checker color-well-checker-top-left" />
                    <div className="color-well-checker color-well-checker-bottom-right" style={{ left: "50%", top: "50%" }} />
                    <div className="color-well-color" style={{ backgroundColor: this.state.colorString }}> </div>
                </div>

                {this.renderPicker()}
            </div>
        );
    }

    renderLabel(text) {
        return (
            <div className="color-row label" key={text} style={{ lineHeight: "20px", height: 16 }}>
                {text}
            </div>
        );
    }

    renderColor() {
        const checkerboardURL = `${this.props.lc.opts.imageURLPrefix}/checkerboard-8x8.png`;

        return (
            <div
                className="color-row"
                key="color"
                style={{
                    position: "relative",
                    backgroundImage: `url(${checkerboardURL})`,
                    backgroundRepeat: "repeat",
                    height: 24
                }}
            >
                <div
                    style={{
                        position: "absolute",
                        top: 0, right: 0, bottom: 0, left: 0,
                        backgroundColor: this.state.colorString
                    }}
                />
            </div>
        );
    }

    buildColorGrid() {
        const rows = [];

        let row = [];
        for (let i = 0; i <= 100; i += 10) {
            row.push({hue: 0, sat: 0, light: i, alpha: this.state.alpha});
        }
        rows.push(row);

        for (var hue of [0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330]) {
            row = [];
            for (let i = 10; i <= 90; i += 8) {
                row.push({hue, sat: this.state.sat, light: i, alpha: this.state.alpha});
            }
            rows.push(row);
        }

        return rows;
    }

    renderPicker() {
        if (!this.state.isPickerVisible) { return null }

        const rows = this.buildColorGrid();
        const onSelectColor = (hsla, s) => this.setColor(s);

        return (
            <div className="color-picker-popup">
                {this.renderColor()}

                {this.renderLabel(_("alpha"))}
                <input
                    type="range"
                    min={0} max={1} step={0.01}
                    value={this.state.alpha}
                    onChange={ e => this.setAlpha(parseFloat(e.target.value)) }
                />

                {this.renderLabel(_("saturation"))}
                <input
                    type="range"
                    min={0} max={100}
                    value={this.state.sat}
                    onChange={ e => this.setSat(parseInt(e.target.value, 10)) }
                />

                <ColorGrid
                    rows={rows}
                    selectedColor={this.state.colorString}
                    onChange={onSelectColor}
                />
            </div>
        );
    }
}


export default ColorWell;