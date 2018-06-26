/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS206: Consider reworking classes to avoid initClass
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
let Pencil;
import { ToolWithStroke } from "./base";
import { createShape } from "../core/shapes";

export default (Pencil = (function() {
    Pencil = class Pencil extends ToolWithStroke {
        static initClass() {
  
            this.prototype.name = "Pencil";
            this.prototype.iconName = "pencil";
  
            this.prototype.eventTimeThreshold = 10;
        }

        begin(x, y, lc) {
            this.color = lc.getColor("primary");
            this.currentShape = this.makeShape();
            this.currentShape.addPoint(this.makePoint(x, y, lc));
            return this.lastEventTime = Date.now();
        }

        continue(x, y, lc) {
            const timeDiff = Date.now() - this.lastEventTime;

            if (timeDiff > this.eventTimeThreshold) {
                this.lastEventTime += timeDiff;
                this.currentShape.addPoint(this.makePoint(x, y, lc));
                return lc.drawShapeInProgress(this.currentShape);
            }
        }

        end(x, y, lc) {
            lc.saveShape(this.currentShape);
            return this.currentShape = undefined;
        }

        makePoint(x, y, lc) {
            return createShape("Point", {x, y, size: this.strokeWidth, color: this.color});
        }
        makeShape() { return createShape("LinePath") }
    };
    Pencil.initClass();
    return Pencil;
})());
