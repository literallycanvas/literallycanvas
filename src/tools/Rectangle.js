import { ToolWithStroke } from "./base";
import { createShape } from "../core/shapes";


class Rectangle extends ToolWithStroke {
    begin(x, y, lc) {
        return this.currentShape = createShape("Rectangle", {
            x, y, strokeWidth: this.strokeWidth,
            strokeColor: lc.getColor("primary"),
            fillColor: lc.getColor("secondary")});
    }

    continue(x, y, lc) {
        this.currentShape.width = x - this.currentShape.x;
        this.currentShape.height = y - this.currentShape.y;
        return lc.drawShapeInProgress(this.currentShape);
    }

    end(x, y, lc) {
        // If there is no height or width, dont save
        if ((this.currentShape.height === 0) || (this.currentShape.width === 0)) {
            return;
        }
        return lc.saveShape(this.currentShape);
    }
}

Rectangle.prototype.name = "Rectangle";
Rectangle.prototype.iconName = "rectangle";


export default Rectangle;