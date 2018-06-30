import actions from "../core/actions";
import { Tool } from "./base";
import { createShape } from "../core/shapes";


class SelectShape extends Tool {
    constructor(lc) {
        super();

        // This is a 'shadow' canvas -- we'll reproduce the shapes here, each shape
        // with a different color that corresponds to their index. That way we'll
        // be able to find which shape to select on the main canvas by pixel color.
        this.selectCanvas = document.createElement("canvas");
        this.selectCanvas.style["background-color"] = "transparent";
        this.selectCtx = this.selectCanvas.getContext("2d");
    }

    didBecomeActive(lc) {
        const selectShapeUnsubscribeFuncs = [];
        this._selectShapeUnsubscribe = () => {
            selectShapeUnsubscribeFuncs.map((func) => func());
        };

        const onDown = ({ x, y }) => {
            this.didDrag = false;

            const shapeIndex = this._getPixel(x, y, lc, this.selectCtx);
            this.selectedShape = lc.shapes[shapeIndex];

            if (this.selectedShape != null) {
                lc.trigger("shapeSelected", { selectedShape: this.selectedShape });
                lc.setShapesInProgress([this.selectedShape, createShape("SelectionBox", {
                    shape: this.selectedShape,
                    handleSize: 0
                })]);
                lc.repaintLayer("main");

                const br = this.selectedShape.getBoundingRect();
                this.dragOffset = {
                    x: x - br.x,
                    y: y - br.y
                };
                this.initialPosition = {
                    x: br.x,
                    y: br.y
                };
            }
        };

        const onDrag = ({ x, y }) => {
            if (this.selectedShape != null) {
                this.didDrag = true;

                this.selectedShape.setUpperLeft({
                    x: x - this.dragOffset.x,
                    y: y - this.dragOffset.y
                });
                lc.setShapesInProgress([this.selectedShape, createShape("SelectionBox", {
                    shape: this.selectedShape,
                    handleSize: 0
                })]);
                lc.repaintLayer("main");
            }
        };

        const onUp = ({ x, y }) => {
            if (this.didDrag) {
                this.didDrag = false;

                // get the current position
                const br = this.selectedShape.getBoundingRect();

                const newPosition = {
                    x: br.x,
                    y: br.y
                };

                // and add a move action
                lc.execute(new actions.MoveAction(lc, this.selectedShape, this.initialPosition, newPosition));

                lc.trigger("shapeMoved", { shape: this.selectedShape });
                lc.trigger("drawingChange", {});
                lc.repaintLayer("main");
                this._drawSelectCanvas(lc);
            }
        };

        selectShapeUnsubscribeFuncs.push(lc.on("lc-pointerdown", onDown));
        selectShapeUnsubscribeFuncs.push(lc.on("lc-pointerdrag", onDrag));
        selectShapeUnsubscribeFuncs.push(lc.on("lc-pointerup", onUp));

        this._drawSelectCanvas(lc);
    }

    willBecomeInactive(lc) {
        this._selectShapeUnsubscribe();
        lc.setShapesInProgress([]);
    }

    _drawSelectCanvas(lc) {
        this.selectCanvas.width = lc.canvas.width;
        this.selectCanvas.height = lc.canvas.height;
        this.selectCtx.clearRect(0, 0, this.selectCanvas.width, this.selectCanvas.height);
        const shapes = lc.shapes.map((shape, index) => {
            return createShape("SelectionBox", {
                shape,
                handleSize: 0,
                backgroundColor: `#${this._intToHex(index)}`
            });
        });
        lc.draw(shapes, this.selectCtx);
    }

    _intToHex(i) {
        return `000000${i.toString(16)}`.slice(-6);
    }

    _getPixel(x, y, lc, ctx) {
        const p = lc.drawingCoordsToClientCoords(x, y);
        const pixel = ctx.getImageData(p.x, p.y, 1, 1).data;
        if (pixel[3]) {
            return parseInt(this._rgbToHex(pixel[0], pixel[1], pixel[2]), 16);
        } else {
            return null;
        }
    }

    _componentToHex(c) {
        const hex = c.toString(16);
        return `0${hex}`.slice(-2);
    }

    _rgbToHex(r, g, b) {
        return `${this._componentToHex(r)}${this._componentToHex(g)}${this._componentToHex(b)}`;
    }
}

SelectShape.prototype.name = "SelectShape";
SelectShape.prototype.usesSimpleAPI = false;


export default SelectShape;