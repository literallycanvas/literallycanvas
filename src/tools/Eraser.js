import Pencil from "./Pencil";
import { createShape } from "../core/shapes";


class Eraser extends Pencil {
    makePoint(x, y, lc) {
        return createShape("Point", {x, y, size: this.strokeWidth, color: "#000"});
    }
    makeShape() { return createShape("ErasedLinePath") }
}

Eraser.prototype.name = "Eraser";
Eraser.prototype.iconName = "eraser";


export default Eraser;