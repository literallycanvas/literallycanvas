/*
 * decaffeinate suggestions:
 * DS101: Remove unnecessary use of Array.from
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
// maybe add checks to these in the future to make sure you never double-undo or
// double-redo
class ClearAction {

  constructor(lc, oldShapes, newShapes) {
    this.lc = lc;
    this.oldShapes = oldShapes;
    this.newShapes = newShapes;
  }

  do() {
    this.lc.shapes = this.newShapes;
    return this.lc.repaintLayer('main');
  }

  undo() {
    this.lc.shapes = this.oldShapes;
    return this.lc.repaintLayer('main');
  }
}


class MoveAction {

  constructor(lc, selectedShape, previousPosition, newPosition) {
    this.lc = lc;
    this.selectedShape = selectedShape;
    this.previousPosition = previousPosition;
    this.newPosition = newPosition;
  }

  do() {
    this.selectedShape.setUpperLeft({
      x: this.newPosition.x,
      y: this.newPosition.y
    });
    return this.lc.repaintLayer('main');
  }

  undo() {
    this.selectedShape.setUpperLeft({
      x: this.previousPosition.x,
      y: this.previousPosition.y
    });
    return this.lc.repaintLayer('main');
  }
}


class AddShapeAction {

  constructor(lc, shape, previousShapeId=null) {
    this.lc = lc;
    this.shape = shape;
    this.previousShapeId = previousShapeId;
  }

  do() {
    // common case: just add it to the end
    if (!this.lc.shapes.length ||
        (this.lc.shapes[this.lc.shapes.length-1].id === this.previousShapeId) ||
        (this.previousShapeId === null)) {
      this.lc.shapes.push(this.shape);
    // uncommon case: insert it somewhere
    } else {
      const newShapes = [];
      let found = false;
      for (let shape of Array.from(this.lc.shapes)) {
        newShapes.push(shape);
        if (shape.id === this.previousShapeId) {
          newShapes.push(this.shape);
          found = true;
        }
      }
      if (!found) {
        // given ID doesn't exist, just shove it on top
        newShapes.push(this.shape);
      }
      this.lc.shapes = newShapes;
    }
    return this.lc.repaintLayer('main');
  }

  undo() {
    // common case: it's the most recent shape
    if (this.lc.shapes[this.lc.shapes.length-1].id === this.shape.id) {
      this.lc.shapes.pop();
    // uncommon case: it's in the array somewhere
    } else {
      const newShapes = [];
      for (let shape of Array.from(this.lc.shapes)) {
        if (shape.id !== this.shape.id) { newShapes.push(shape); }
      }
      lc.shapes = newShapes;
    }
    return this.lc.repaintLayer('main');
  }
}


export default {ClearAction, MoveAction, AddShapeAction};
