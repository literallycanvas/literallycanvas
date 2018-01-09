/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS206: Consider reworking classes to avoid initClass
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
let Rectangle;
const {ToolWithStroke} = require('./base');
const {createShape} = require('../core/shapes');


module.exports = (Rectangle = (function() {
  Rectangle = class Rectangle extends ToolWithStroke {
    static initClass() {
  
      this.prototype.name = 'Rectangle';
      this.prototype.iconName = 'rectangle';
    }

    begin(x, y, lc) {
      return this.currentShape = createShape('Rectangle', {
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
  Rectangle.initClass();
  return Rectangle;
})());
