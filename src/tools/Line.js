/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS205: Consider reworking code to avoid use of IIFEs
 * DS206: Consider reworking classes to avoid initClass
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
let Line;
import { ToolWithStroke } from "./base";
import { createShape } from "../core/shapes";


export default (Line = (function() {
    Line = class Line extends ToolWithStroke {
        static initClass() {
  
            this.prototype.name = "Line";
            this.prototype.iconName = "line";
  
            this.prototype.optionsStyle = "line-options-and-stroke-width";
        }

        begin(x, y, lc) {
            return this.currentShape = createShape("Line", {
                x1: x, y1: y, x2: x, y2: y, strokeWidth: this.strokeWidth,
                dash: (() => { switch (false) {
                case !this.isDashed: return [this.strokeWidth * 2, this.strokeWidth * 4];
                default: return null;
                } })(),
                endCapShapes: this.hasEndArrow ? [null, "arrow"] : null,
                color: lc.getColor("primary")});
        }

        continue(x, y, lc) {
            this.currentShape.x2 = x;
            this.currentShape.y2 = y;
            return lc.drawShapeInProgress(this.currentShape);
        }

        end(x, y, lc) {
            // If start == end, dont save
            const sameX = this.currentShape.x1 === this.currentShape.x2;
            const sameY = this.currentShape.y1 === this.currentShape.y2;
            if (sameX && sameY) {
                return;
            }
            return lc.saveShape(this.currentShape);
        }
    };
    Line.initClass();
    return Line;
})());
