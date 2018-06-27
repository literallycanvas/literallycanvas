import { Tool } from "./base";
import { createShape } from "../core/shapes";


class Pan extends Tool {

    didBecomeActive(lc) {
        const unsubscribeFuncs = [];
        this.unsubscribe = () => {
            return unsubscribeFuncs.map((func) =>
                func());
        };

        unsubscribeFuncs.push(lc.on("lc-pointerdown", ({rawX, rawY}) => {
            this.oldPosition = lc.position;
            return this.pointerStart = {x: rawX, y: rawY};
        }));

        return unsubscribeFuncs.push(lc.on("lc-pointerdrag", ({rawX, rawY}) => {
            // okay, so this is really bad:
            // lc.position is "buggy screen coordinates": correct on non-retina,
            // probably wrong on retina. compensate here; in v0.5 we should put the
            // offset in drawing coordinates.
            const dp = {
                x: (rawX - this.pointerStart.x) * lc.backingScale,
                y: (rawY - this.pointerStart.y) * lc.backingScale
            };
            return lc.setPan(this.oldPosition.x + dp.x, this.oldPosition.y + dp.y);
        })
        );
    }

    willBecomeInactive(lc) {
        return this.unsubscribe();
    }
}

Pan.name = "Pan";
Pan.iconName = "pan";
Pan.usesSimpleAPI = false;


export default Pan;