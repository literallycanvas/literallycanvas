/*
 * decaffeinate suggestions:
 * DS201: Simplify complex destructure assignments
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */

import React from "react";
import { defineOptionsStyle } from "./optionsStyles";
import { _ } from "../core/localization";


const SANS_SERIF_FONTS = [
    ["Arial", 'Arial,"Helvetica Neue",Helvetica,sans-serif'],
    ["Arial Black", '"Arial Black","Arial Bold",Gadget,sans-serif'],
    ["Arial Narrow", '"Arial Narrow",Arial,sans-serif'],
    ["Gill Sans", '"Gill Sans","Gill Sans MT",Calibri,sans-serif'],
    ["Helvetica", '"Helvetica Neue",Helvetica,Arial,sans-serif'],
    ["Impact", 'Impact,Haettenschweiler,"Franklin Gothic Bold",Charcoal,"Helvetica Inserat","Bitstream Vera Sans Bold","Arial Black",sans-serif'],
    ["Tahoma", "Tahoma,Verdana,Segoe,sans-serif"],
    ["Trebuchet MS", '"Trebuchet MS","Lucida Grande","Lucida Sans Unicode","Lucida Sans",Tahoma,sans-serif'],
    ["Verdana", "Verdana,Geneva,sans-serif"],
].map(function(...args) { let name, value; [name, value] = args[0]; return {name: _(name), value} });

const SERIF_FONTS = [
    ["Baskerville", 'Baskerville,"Baskerville Old Face","Hoefler Text",Garamond,"Times New Roman",serif'],
    ["Garamond", 'Garamond,Baskerville,"Baskerville Old Face","Hoefler Text","Times New Roman",serif'],
    ["Georgia", 'Georgia,Times,"Times New Roman",serif'],
    ["Hoefler Text", '"Hoefler Text","Baskerville Old Face",Garamond,"Times New Roman",serif'],
    ["Lucida Bright", '"Lucida Bright",Georgia,serif'],
    ["Palatino", 'Palatino,"Palatino Linotype","Palatino LT STD","Book Antiqua",Georgia,serif'],
    ["Times New Roman", 'TimesNewRoman,"Times New Roman",Times,Baskerville,Georgia,serif'],
].map(function(...args) { let name, value; [name, value] = args[0]; return {name: _(name), value} });

const MONOSPACE_FONTS = [
    ["Consolas/Monaco", 'Consolas,monaco,"Lucida Console",monospace'],
    ["Courier New", '"Courier New",Courier,"Lucida Sans Typewriter","Lucida Typewriter",monospace'],
    ["Lucida Sans Typewriter", '"Lucida Sans Typewriter","Lucida Console",monaco,"Bitstream Vera Sans Mono",monospace'],
].map(function(...args) { let name, value; [name, value] = args[0]; return {name: _(name), value} });

const OTHER_FONTS = [
    ["Copperplate", 'Copperplate,"Copperplate Gothic Light",fantasy'],
    ["Papyrus", "Papyrus,fantasy"],
    ["Script", '"Brush Script MT",cursive'],
].map(function(...args) { let name, value; [name, value] = args[0]; return {name: _(name), value} });

const ALL_FONTS = [
    [_("Sans Serif"), SANS_SERIF_FONTS],
    [_("Serif"), SERIF_FONTS],
    [_("Monospace"), MONOSPACE_FONTS],
    [_("Other"), OTHER_FONTS],
];

const FONT_NAME_TO_VALUE = {};
for (var {name, value} of SANS_SERIF_FONTS) {
    FONT_NAME_TO_VALUE[name] = value;
}
for ({name, value} of SERIF_FONTS) {
    FONT_NAME_TO_VALUE[name] = value;
}
for ({name, value} of MONOSPACE_FONTS) {
    FONT_NAME_TO_VALUE[name] = value;
}
for ({name, value} of OTHER_FONTS) {
    FONT_NAME_TO_VALUE[name] = value;
}


class FontOptions extends React.Component {
    constructor() {
        super();

        this.handleFontFamily = this.handleFontFamily.bind(this);
        this.handleFontSize = this.handleFontSize.bind(this);
        this.handleBold = this.handleBold.bind(this);
        this.handleItalic = this.handleItalic.bind(this);

        this.state = {
            isItalic: false,
            isBold: false,
            fontName: "Helvetica",
            fontSizeIndex: 4,
        };
    }

    getFontSizes() {
        return [9, 10, 12, 14, 18, 24, 36, 48, 64, 72, 96, 144, 288]
    }

    // LC's text tool API is a little funky: it just has a 'font' string you can
    // set.
    updateTool(newState) {
        if (newState == null) { newState = {} }
        for (let k in this.state) {
            if (!(k in newState)) {
                newState[k] = this.state[k];
            }
        }
        const fontSize = this.getFontSizes()[newState.fontSizeIndex];
        const items = [];
        if (newState.isItalic) { items.push("italic") }
        if (newState.isBold) { items.push("bold") }
        items.push(`${fontSize}px`);
        items.push(FONT_NAME_TO_VALUE[newState.fontName]);
        this.props.lc.tool.font = items.join(" ");
        this.props.lc.trigger("setFont", items.join(" "));
    }

    handleFontSize(event) {
        const newState = {fontSizeIndex: event.target.value};
        this.setState(newState);
        this.updateTool(newState);
    }

    handleFontFamily(event) {
        const newState = {
            fontName: event.target.selectedOptions[0].innerHTML,
        };
        this.setState(newState);
        this.updateTool(newState);
    }

    handleItalic(event) {
        const newState = {isItalic: !this.state.isItalic};
        this.setState(newState);
        this.updateTool(newState);
    }

    handleBold(event) {
        const newState = {isBold: !this.state.isBold};
        this.setState(newState);
        this.updateTool(newState);
    }

    componentDidMount() {
        this.updateTool();
    }

    render() {
        const { lc } = this.props;

        return (
            <div className="lc-font-settings">
                <select value={this.state.fontSizeIndex} onChange={this.handleFontSize}>
                    {this.getFontSizes().map(
                        (size, ix) => (
                            <option value={ix} key={ix}>
                                {`${size}px`}
                            </option>
                        )
                    )}
                </select>

                <select value={this.state.fontName} onChange={this.handleFontFamily}>
                    {ALL_FONTS.map(
                        ([label, fonts]) => (
                            <optgroup key={label}>
                                {label}
                                {fonts.map(
                                    (family, ix) => (
                                        <option value={family.name} key={ix}>
                                            {family.name}
                                        </option>
                                    )
                                )}
                            </optgroup>
                        )
                    )}
                </select>

                <span>
                    <label htmlFor="italic"> {_("italic")} </label>
                    <input
                        type="checkbox"
                        id="italic"
                        checked={this.state.isItalic}
                        onChange={this.handleItalic}
                    />
                </span>

                <span>
                    <label htmlFor="bold"> {_("bold")} </label>
                    <input
                        type="checkbox"
                        id="bold"
                        checked={this.state.isBold}
                        onChange={this.handleBold}
                    />
                </span>
            </div>
        );
    }
}


defineOptionsStyle("font", FontOptions);