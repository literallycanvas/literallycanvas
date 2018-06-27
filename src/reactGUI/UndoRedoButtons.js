import React from "react";
import DOM from "react-dom-factories";
import createSetStateOnEventMixin from "./createSetStateOnEventMixin";
import React from "./React-shim";


class UndoRedoButton extends React.Component {
    constructor(undoOrRedo) {
        super();

        // FIXME: Replace by a prop once JSX has been introduced
        this.undoOrRedo = undoOrRedo;
    }

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
                (this.undoOrRedo !== "undo")
                    ? this.props.lc.canUndo()
                    : this.props.lc.canRedo(),
        };
    }

    getInitialState() {
        return this.getState();
    }

    mixins = [createSetStateOnEventMixin("drawingChange")];

    render() {
        const {div, img} = DOM;
        const {lc, imageURLPrefix} = this.props;
        const title = this.undoOrRedo === "undo" ? "Undo" : "Redo";

        const className = `lc-${this.undoOrRedo} ` + classSet({
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

        const src = `${imageURLPrefix}/${this.undoOrRedo}.png`;
        const style = {backgroundImage: `url(${src})`};

        return (div({className, onClick, title:_(title), style}));
    }
}


// FIXME: Remove this class once JSX has been introduced
class UndoButton_ extends UndoRedoButton {
    constructor() {
        super("undo");
    }
}

// FIXME: Remove this class once JSX has been introduced
class RedoButton_ extends UndoRedoButton {
    constructor() {
        super("redo");
    }
}


const UndoButton = React.createFactory(UndoButton_);
const RedoButton = React.createFactory(RedoButton_);

class UndoRedoButtons extends React.Component {
    render() {
        const {div} = DOM;
        return (div({className: "lc-undo-redo"}, UndoButton(this.props), RedoButton(this.props)));
    }
}


export default UndoRedoButtons;