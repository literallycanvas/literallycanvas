import { Tool } from "./base";
import { createShape } from "../core/shapes";


class Pan extends Tool {

    didBecomeActive(lc) {
        const unsubscribeFuncs = [];
        this.unsubscribe = () => {
            unsubscribeFuncs.map((func) => func());
        };

        unsubscribeFuncs.push(lc.on("lc-pointerdown", ({rawX, rawY}) => {
            this.oldPosition = lc.position;
            this.pointerStart = {x: rawX, y: rawY};
        }));

        unsubscribeFuncs.push(lc.on("lc-pointerdrag", ({rawX, rawY}) => {
            // okay, so this is really bad:
            // lc.position is "buggy screen coordinates": correct on non-retina,
            // probably wrong on retina. compensate here; in v0.5 we should put the
            // offset in drawing coordinates.
            const dp = {
                x: (rawX - this.pointerStart.x) * lc.backingScale,
                y: (rawY - this.pointerStart.y) * lc.backingScale
            };
            lc.setPan(this.oldPosition.x + dp.x, this.oldPosition.y + dp.y);
        })
        );
    }

    willBecomeInactive(lc) {
        this.unsubscribe();
    }
}

Pan.prototype.name = "Pan";
Pan.prototype.iconName = "pan";
Pan.prototype.usesSimpleAPI = false;


export default Pan;