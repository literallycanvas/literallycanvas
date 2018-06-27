import React from "react";
import createSetStateOnEventMixin from "./createSetStateOnEventMixin";
import React from "./React-shim";


class UndoRedoButton extends React.Component {

    // We do this a lot, even though it reads as a React no-no.
    // The reason is that '@props.lc' is a monolithic state bucket for
    // Literally Canvas, and does not offer opportunities for encapsulation.
    //
    // However, this component really does read and write only to the 'undo'
    // part of the state bucket, and we have to get react to update somehow, and
    // we don't want the parent to have to worry about this, so it's in @state.
    getState() {
        return {
            isEnabled:
                (this.props.action === "undo")
                    ? this.props.lc.canUndo()
                    : this.props.lc.canRedo(),
        };
    }

    getInitialState() {
        return this.getState();
    }

    mixins = [createSetStateOnEventMixin("drawingChange")];

    render() {
        const {lc, imageURLPrefix} = this.props;
        const title = this.props.action === "undo" ? "Undo" : "Redo";

        const className = `lc-${this.props.action} ` + classSet({
            "toolbar-button": true,
            "thin-button": true,
            "disabled": !this.state.isEnabled
        });

        const onClick =
            this.state.isEnabled
                ? (() => {})
                : (this.undoOrRedo !== "undo")
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