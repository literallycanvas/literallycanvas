class Tool {
    // called when the user starts dragging
    begin(x, y, lc) {}

    // called when the user moves while dragging
    continue(x, y, lc) {}

    // called when the user finishes dragging
    end(x, y, lc) {}

    didBecomeActive(lc) {}
    willBecomeInactive(lc) {}
}

Tool.name = null;  // for debugging
Tool.iconName = null;  // {imageURLPrefix}/{iconName}.png
Tool.usesSimpleAPI = true;
Tool.optionsStyle = null;  // kind of options GUI to display


class ToolWithStroke extends Tool {
    constructor(lc) {
        super();
        this.strokeWidth = lc.opts.defaultStrokeWidth;
    }

    didBecomeActive(lc) {
        const unsubscribeFuncs = [];
        this.unsubscribe = () => {
            return unsubscribeFuncs.map((func) =>
                func());
        };

        return unsubscribeFuncs.push(lc.on("setStrokeWidth", strokeWidth => {
            this.strokeWidth = strokeWidth;
            return lc.trigger("toolDidUpdateOptions");
        })
        );
    }

    willBecomeInactive(lc) {
        return this.unsubscribe();
    }
}

ToolWithStroke.optionsStyle = "stroke-width";


export default { Tool, ToolWithStroke };