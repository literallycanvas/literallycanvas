// TODO: This file was created by bulk-decaffeinate.
// Sanity-check the conversion and remove this comment.
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS206: Consider reworking classes to avoid initClass
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
let Ellipse;
const {ToolWithStroke} = require('./base');
const {createShape} = require('../core/shapes');


// this is pretty similar to the Rectangle tool. maybe consolidate somehow.
module.exports = (Ellipse = (function() {
  Ellipse = class Ellipse extends ToolWithStroke {
    static initClass() {
  
      this.prototype.name = 'Ellipse';
      this.prototype.iconName = 'ellipse';
    }

    begin(x, y, lc) {
      return this.currentShape = createShape('Ellipse', {
        x, y, strokeWidth: this.strokeWidth,
        strokeColor: lc.getColor('primary'),
        fillColor: lc.getColor('secondary')});
    }

    continue(x, y, lc) {
      this.currentShape.width = x - this.currentShape.x;
      this.currentShape.height = y - this.currentShape.y;
      return lc.drawShapeInProgress(this.currentShape);
    }

    end(x, y, lc) {
      return lc.saveShape(this.currentShape);
    }
  };
  Ellipse.initClass();
  return Ellipse;
})());
