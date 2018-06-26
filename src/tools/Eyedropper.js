/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS206: Consider reworking classes to avoid initClass
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
let Eyedropper;
import { Tool } from "./base";


const getPixel = function(ctx, {x, y}) {
    const pixel = ctx.getImageData(x, y, 1, 1).data;
    if (pixel[3]) { return `rgb(${pixel[0]}, ${pixel[1]}, ${pixel[2]})` } else { return null }
};


export default (Eyedropper = (function() {
    Eyedropper = class Eyedropper extends Tool {
        static initClass() {
  
            this.prototype.name = "Eyedropper";
            this.prototype.iconName = "eyedropper";
            this.prototype.optionsStyle = "stroke-or-fill";
        }

        constructor(lc) {
            super(lc);
            this.strokeOrFill = "stroke";
        }

        readColor(x, y, lc) {
            const offset = lc.getDefaultImageRect();
            const canvas = lc.getImage();
            const newColor = getPixel(
                canvas.getContext("2d"),
                {x: x - offset.x, y: y - offset.y});
            const color = newColor || lc.getColor("background");
            if (this.strokeOrFill === "stroke") {
                return lc.setColor("primary", newColor);
            } else {
                return lc.setColor("secondary", newColor);
            }
        }

        begin(x, y, lc) { return this.readColor(x, y, lc) }
        continue(x, y, lc) { return this.readColor(x, y, lc) }
    };
    Eyedropper.initClass();
    return Eyedropper;
})());
