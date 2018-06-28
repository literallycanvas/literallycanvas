import { ToolWithStroke } from "./base";
import { createShape } from "../core/shapes";


class Line extends ToolWithStroke {

    begin(x, y, lc) {
        return this.currentShape = createShape("Line", {
            x1: x, y1: y, x2: x, y2: y, strokeWidth: this.strokeWidth,
            dash: (!this.isDashed) ? [this.strokeWidth * 2, this.strokeWidth * 4] : null,
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
}

Line.prototype.name = "Line";
Line.prototype.iconName = "line";
Line.prototype.optionsStyle = "line-options-and-stroke-width";


export default Line;