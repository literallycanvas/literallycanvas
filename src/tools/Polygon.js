/*
 * decaffeinate suggestions:
 * DS101: Remove unnecessary use of Array.from
 * DS102: Remove unnecessary code created because of implicit returns
 * DS206: Consider reworking classes to avoid initClass
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
let Polygon;
import { ToolWithStroke } from './base';
import { createShape } from '../core/shapes';

export default (Polygon = (function() {
  Polygon = class Polygon extends ToolWithStroke {
    static initClass() {
  
      this.prototype.name = 'Polygon';
      this.prototype.iconName = 'polygon';
      this.prototype.usesSimpleAPI = false;
  
      this.prototype.optionsStyle = 'polygon-and-stroke-width';
    }

    didBecomeActive(lc) {
      super.didBecomeActive(lc);
      const polygonUnsubscribeFuncs = [];
      this.polygonUnsubscribe = () => {
        return Array.from(polygonUnsubscribeFuncs).map((func) =>
          func());
      };

      this.points = null;
      this.maybePoint = null;

      const onUp = () => {
        if (this._getWillFinish()) { return this._close(lc); }
        lc.trigger('lc-polygon-started');

        if (this.points) {
          this.points.push(this.maybePoint);
        } else {
          this.points = [this.maybePoint];
        }

        this.maybePoint = {x: this.maybePoint.x, y: this.maybePoint.y};
        lc.setShapesInProgress(this._getShapes(lc));
        return lc.repaintLayer('main');
      };

      const onMove = ({x, y}) => {
        if (this.maybePoint) {
          this.maybePoint.x = x;
          this.maybePoint.y = y;
          lc.setShapesInProgress(this._getShapes(lc));
          return lc.repaintLayer('main');
        }
      };

      const onDown = ({x, y}) => {
        this.maybePoint = {x, y};
        lc.setShapesInProgress(this._getShapes(lc));
        return lc.repaintLayer('main');
      };

      const polygonFinishOpen = () => {
        this.maybePoint = {x: Infinity, y: Infinity};
        return this._close(lc);
      };

      const polygonFinishClosed = () => {
        this.maybePoint = this.points[0];
        return this._close(lc);
      };

      const polygonCancel = () => {
        return this._cancel(lc);
      };

      polygonUnsubscribeFuncs.push(lc.on('drawingChange', () => this._cancel(lc)));
      polygonUnsubscribeFuncs.push(lc.on('lc-pointerdown', onDown));
      polygonUnsubscribeFuncs.push(lc.on('lc-pointerdrag', onMove));
      polygonUnsubscribeFuncs.push(lc.on('lc-pointermove', onMove));
      polygonUnsubscribeFuncs.push(lc.on('lc-pointerup', onUp));

      polygonUnsubscribeFuncs.push(lc.on('lc-polygon-finishopen', polygonFinishOpen));
      polygonUnsubscribeFuncs.push(lc.on('lc-polygon-finishclosed', polygonFinishClosed));
      return polygonUnsubscribeFuncs.push(lc.on('lc-polygon-cancel', polygonCancel));
    }

    willBecomeInactive(lc) {
      super.willBecomeInactive(lc);
      if (this.points || this.maybePoint) { this._cancel(lc); }
      return this.polygonUnsubscribe();
    }

    _getArePointsClose(a, b) {
      return (Math.abs(a.x - b.x) + Math.abs(a.y - b.y)) < 10;
    }

    _getWillClose() {
      if (!this.points || !(this.points.length > 1)) { return false; }
      if (!this.maybePoint) { return false; }
      return this._getArePointsClose(this.points[0], this.maybePoint);
    }

    _getWillFinish() {
      if (!this.points || !(this.points.length > 1)) { return false; }
      if (!this.maybePoint) { return false; }
      return (
        this._getArePointsClose(this.points[0], this.maybePoint) ||
        this._getArePointsClose(this.points[this.points.length - 1], this.maybePoint));
    }

    _cancel(lc) {
      lc.trigger('lc-polygon-stopped');
      this.maybePoint = null;
      this.points = null;
      lc.setShapesInProgress([]);
      return lc.repaintLayer('main');
    }

    _close(lc) {
      lc.trigger('lc-polygon-stopped');
      lc.setShapesInProgress([]);
      if (this.points.length > 2) { lc.saveShape(this._getShape(lc, false)); }
      this.maybePoint = null;
      return this.points = null;
    }

    _getShapes(lc, isInProgress) {
      if (isInProgress == null) { isInProgress = true; }
      const shape = this._getShape(lc, isInProgress);
      if (shape) { return [shape]; } else { return []; }
    }

    _getShape(lc, isInProgress) {
      if (isInProgress == null) { isInProgress = true; }
      let points = [];
      if (this.points) {
        points = points.concat(this.points);
      }
      if ((!isInProgress) && (points.length < 3)) { return null; }
      if (isInProgress && this.maybePoint) {
        points.push(this.maybePoint);
      }
      if (points.length > 1) {
        return createShape('Polygon', {
          isClosed: this._getWillClose(),
          strokeColor: lc.getColor('primary'),
          fillColor: lc.getColor('secondary'),
          strokeWidth: this.strokeWidth,
          points: points.map(xy => createShape('Point', xy))
        });
      } else {
        return null;
      }
    }
  };
  Polygon.initClass();
  return Polygon;
})());
