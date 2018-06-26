/*
 * decaffeinate suggestions:
 * DS001: Remove Babel/TypeScript constructor workaround
 * DS101: Remove unnecessary use of Array.from
 * DS102: Remove unnecessary code created because of implicit returns
 * DS206: Consider reworking classes to avoid initClass
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
let Tool, ToolWithStroke;
const tools = {};

tools.Tool = (Tool = (function() {
    Tool = class Tool {
        static initClass() {
  
            // for debugging
            this.prototype.name = null;
  
            // {imageURLPrefix}/{iconName}.png
            this.prototype.iconName = null;
  
            this.prototype.usesSimpleAPI = true;
  
            // kind of options GUI to display
            this.prototype.optionsStyle = null;
        }

        // called when the user starts dragging
        begin(x, y, lc) {}

        // called when the user moves while dragging
        continue(x, y, lc) {}

        // called when the user finishes dragging
        end(x, y, lc) {}

        didBecomeActive(lc) {}
        willBecomeInactive(lc) {}
    };
    Tool.initClass();
    return Tool;
})());


tools.ToolWithStroke = (ToolWithStroke = (function() {
    ToolWithStroke = class ToolWithStroke extends Tool {
        static initClass() {
            this.prototype.optionsStyle = "stroke-width";
        }

        constructor(lc) { {       // Hack: trick Babel/TypeScript into allowing this before super.
            if (false) { super() }       let thisFn = (() => { return this }).toString();       let thisName = thisFn.slice(thisFn.indexOf("return") + 6 + 1, thisFn.indexOf(";")).trim();       eval(`${thisName} = this;`);     }     this.strokeWidth = lc.opts.defaultStrokeWidth; }

        didBecomeActive(lc) {
            const unsubscribeFuncs = [];
            this.unsubscribe = () => {
                return Array.from(unsubscribeFuncs).map((func) =>
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
    };
    ToolWithStroke.initClass();
    return ToolWithStroke;
})());

export default tools;
