/*
 * decaffeinate suggestions:
 * DS101: Remove unnecessary use of Array.from
 * DS102: Remove unnecessary code created because of implicit returns
 * DS206: Consider reworking classes to avoid initClass
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
let Pan;
const {Tool} = require('./base');
const {createShape} = require('../core/shapes');


module.exports = (Pan = (function() {
  Pan = class Pan extends Tool {
    static initClass() {
  
      this.prototype.name = 'Pan';
      this.prototype.iconName = 'pan';
      this.prototype.usesSimpleAPI = false;
    }

    didBecomeActive(lc) {
      const unsubscribeFuncs = [];
      this.unsubscribe = () => {
        return Array.from(unsubscribeFuncs).map((func) =>
          func());
      };

      unsubscribeFuncs.push(lc.on('lc-pointerdown', ({rawX, rawY}) => {
        this.oldPosition = lc.position;
        return this.pointerStart = {x: rawX, y: rawY};
    }));

      return unsubscribeFuncs.push(lc.on('lc-pointerdrag', ({rawX, rawY}) => {
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
  };
  Pan.initClass();
  return Pan;
})());
