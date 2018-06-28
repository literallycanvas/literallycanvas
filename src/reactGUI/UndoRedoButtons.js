import React from "react";
import { classSet } from "../core/util";
import { _ } from "../core/localization";


class UndoRedoButton extends React.Component {

    constructor() {
        super();

        this.state = { isEnabled: false };
    }

    static getDerivedStateFromProps(props) {
        let isEnabled =
            (props.action === "undo")
                ? props.lc.canUndo()
                : props.lc.canRedo();

        return { isEnabled };
    }

    getState() {
        return UndoRedoButton.getDerivedStateFromProps(this.props);
    }

    // We do this a lot, even though it reads as a React no-no.
    // The reason is that '@props.lc' is a monolithic state bucket for
    // Literally Canvas, and does not offer opportunities for encapsulation.
    //
    // However, this component really does read and write only to the 'undo'
    // part of the state bucket, and we have to get react to update somehow, and
    // we don't want the parent to have to worry about this, so it's in @state.

    componentDidMount() {
        this.unsubscribe = this.props.lc.on("drawingChange", () => this.setState(this.getState()));
    }

    componentWillUnmount() { this.unsubscribe() }

    render() {
        const {lc, imageURLPrefix} = this.props;
        const title = this.props.action === "undo" ? "Undo" : "Redo";

        const className = `lc-${this.props.action} ` + classSet({
            "toolbar-button": true,
            "thin-button": true,
            "disabled": !this.state.isEnabled
        });

        const onClick =
            !this.state.isEnabled
                ? (() => {})
                : (this.props.action === "undo")
                    ? (() => lc.undo())
                    : (() => lc.redo());

        const src = `${imageURLPrefix}/${this.props.action}.png`;
        const style = {backgroundImage: `url(${src})`};

        return (
            <div className={className} onClick={onClick} title={_(title)} style={style} />
        );
    }
}


class UndoRedoButtons extends React.Component {
    render() {
        return (
            <div className="lc-undo-redo">
                <UndoRedoButton action="undo" {...this.props} />
                <UndoRedoButton action="redo" {...this.props} />
            </div>
        );
    }
}


export default UndoRedoButtons;