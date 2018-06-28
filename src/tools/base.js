class Tool {
    constructor() {}

    // called when the user starts dragging
    begin(x, y, lc) {}

    // called when the user moves while dragging
    continue(x, y, lc) {}

    // called when the user finishes dragging
    end(x, y, lc) {}

    didBecomeActive(lc) {}
    willBecomeInactive(lc) {}
}

Tool.prototype.name = null;  // for debugging
Tool.prototype.iconName = null;  // {imageURLPrefix}/{iconName}.png
Tool.prototype.usesSimpleAPI = true;
Tool.prototype.optionsStyle = null;  // kind of options GUI to display


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

ToolWithStroke.prototype.optionsStyle = "stroke-width";


export { Tool, ToolWithStroke };