// TODO: This file was created by bulk-decaffeinate.
// Sanity-check the conversion and remove this comment.
/*
 * decaffeinate suggestions:
 * DS001: Remove Babel/TypeScript constructor workaround
 * DS101: Remove unnecessary use of Array.from
 * DS102: Remove unnecessary code created because of implicit returns
 * DS206: Consider reworking classes to avoid initClass
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
let Text;
const {Tool} = require('./base');
const {createShape} = require('../core/shapes');


const getIsPointInBox = function(point, box) {
  if (point.x < box.x) { return false; }
  if (point.y < box.y) { return false; }
  if (point.x > (box.x + box.width)) { return false; }
  if (point.y > (box.y + box.height)) { return false; }
  return true;
};


module.exports = (Text = (function() {
  Text = class Text extends Tool {
    static initClass() {
  
      this.prototype.name = 'Text';
      this.prototype.iconName = 'text';
  
      this.prototype.optionsStyle = 'font';
    }

    constructor() {
      {
        // Hack: trick Babel/TypeScript into allowing this before super.
        if (false) { super(); }
        let thisFn = (() => { this; }).toString();
        let thisName = thisFn.slice(thisFn.indexOf('{') + 1, thisFn.indexOf(';')).trim();
        eval(`${thisName} = this;`);
      }
      this.text = '';
      this.font = 'bold 18px sans-serif';
      this.currentShape = null;
      this.currentShapeState = null;
      this.initialShapeBoundingRect = null;
      this.dragAction = null;
      this.didDrag = false;
    }

    didBecomeActive(lc) {
      const unsubscribeFuncs = [];
      this.unsubscribe = () => {
        return Array.from(unsubscribeFuncs).map((func) =>
          func());
      };

      const switchAway = () => {
        this._ensureNotEditing(lc);
        this._clearCurrentShape(lc);
        return lc.repaintLayer('main');
      };

      const updateInputEl = () => this._updateInputEl(lc);

      unsubscribeFuncs.push(lc.on('drawingChange', switchAway));
      unsubscribeFuncs.push(lc.on('zoom', updateInputEl));
      unsubscribeFuncs.push(lc.on('imageSizeChange', updateInputEl));
      unsubscribeFuncs.push(lc.on('snapshotLoad', () => {
        this._clearCurrentShape(lc);
        return lc.repaintLayer('main');
      })
      );

      unsubscribeFuncs.push(lc.on('primaryColorChange', newColor => {
        if (!this.currentShape) { return; }
        this.currentShape.color = newColor;
        this._updateInputEl(lc);
        return lc.repaintLayer('main');
      })
      );

      return unsubscribeFuncs.push(lc.on('setFont', font => {
        if (!this.currentShape) { return; }
        this.font = font;
        this.currentShape.setFont(font);
        this._setShapesInProgress(lc);
        this._updateInputEl(lc);
        return lc.repaintLayer('main');
      })
      );
    }

    willBecomeInactive(lc) {
      if (this.currentShape) {
        this._ensureNotEditing(lc);
        this.commit(lc);
      }
      return this.unsubscribe();
    }

    setText(text) {
      return this.text = text;
    }

    _ensureNotEditing(lc) {
      if (this.currentShapeState === 'editing') {
        return this._exitEditingState(lc);
      }
    }

    _clearCurrentShape(lc) {
      this.currentShape = null;
      this.initialShapeBoundingRect = null;
      this.currentShapeState = null;
      return lc.setShapesInProgress([]);
    }

    commit(lc) {
      if (this.currentShape.text) { lc.saveShape(this.currentShape); }
      this._clearCurrentShape(lc);
      return lc.repaintLayer('main');
    }

    _getSelectionShape(ctx, backgroundColor=null) {
      return createShape('SelectionBox', {shape: this.currentShape, ctx, backgroundColor});
    }

    _setShapesInProgress(lc) {
      switch (this.currentShapeState) {
        case 'selected':
          return lc.setShapesInProgress([this._getSelectionShape(lc.ctx), this.currentShape]);
        case 'editing':
          return lc.setShapesInProgress([this._getSelectionShape(lc.ctx, '#fff')]);
        default:
          return lc.setShapesInProgress([this.currentShape]);
      }
    }

    begin(x, y, lc) {
      this.dragAction = 'none';
      this.didDrag = false;

      if ((this.currentShapeState === 'selected') || (this.currentShapeState === 'editing')) {
        const br = this.currentShape.getBoundingRect(lc.ctx);
        const selectionShape = this._getSelectionShape(lc.ctx);
        const selectionBox = selectionShape.getBoundingRect();
        const point = {x, y};
        if (getIsPointInBox(point, br)) {
          this.dragAction = 'move';
        }
        if (getIsPointInBox(point, selectionShape.getBottomRightHandleRect())) {
          this.dragAction = 'resizeBottomRight';
        }
        if (getIsPointInBox(point, selectionShape.getTopLeftHandleRect())) {
          this.dragAction = 'resizeTopLeft';
        }
        if (getIsPointInBox(point, selectionShape.getBottomLeftHandleRect())) {
          this.dragAction = 'resizeBottomLeft';
        }
        if (getIsPointInBox(point, selectionShape.getTopRightHandleRect())) {
          this.dragAction = 'resizeTopRight';
        }

        if ((this.dragAction === 'none') && (this.currentShapeState === 'editing')) {
          this.dragAction = 'stop-editing';
          this._exitEditingState(lc);
        }
      } else {
        this.color = lc.getColor('primary');
        this.currentShape = createShape('Text', {x, y, text: this.text, color: this.color, font: this.font, v: 1});
        this.dragAction = 'place';
        this.currentShapeState = 'selected';
      }

      if (this.dragAction === 'none') {
        this.commit(lc);
        return;
      }

      this.initialShapeBoundingRect = this.currentShape.getBoundingRect(lc.ctx);
      this.dragOffset = {
        x: x - this.initialShapeBoundingRect.x,
        y: y - this.initialShapeBoundingRect.y
      };

      this._setShapesInProgress(lc);
      return lc.repaintLayer('main');
    }

    continue(x, y, lc) {
      if (this.dragAction === 'none') {
        return;
      }

      const br = this.initialShapeBoundingRect;
      const brRight = br.x + br.width;
      const brBottom = br.y + br.height;
      switch (this.dragAction) {
        case 'place':
          this.currentShape.x = x;
          this.currentShape.y = y;
          this.didDrag = true;
          break;
        case 'move':
          this.currentShape.x = x - this.dragOffset.x;
          this.currentShape.y = y - this.dragOffset.y;
          this.didDrag = true;
          break;
        case 'resizeBottomRight':
          this.currentShape.setSize(
            x - (this.dragOffset.x - this.initialShapeBoundingRect.width) - br.x,
            y - (this.dragOffset.y - this.initialShapeBoundingRect.height) - br.y);
          break;
        case 'resizeTopLeft':
          this.currentShape.setSize(
            (brRight - x) + this.dragOffset.x,
            (brBottom - y) + this.dragOffset.y);
          this.currentShape.setPosition(x - this.dragOffset.x, y - this.dragOffset.y);
          break;
        case 'resizeBottomLeft':
          this.currentShape.setSize(
            (brRight - x) + this.dragOffset.x,
            y - (this.dragOffset.y - this.initialShapeBoundingRect.height) - br.y);
          this.currentShape.setPosition(x - this.dragOffset.x, this.currentShape. y);
          break;
        case 'resizeTopRight':
          this.currentShape.setSize(
            x - (this.dragOffset.x - this.initialShapeBoundingRect.width) - br.x,
            (brBottom - y) + this.dragOffset.y);
          this.currentShape.setPosition(this.currentShape.x, y - this.dragOffset.y);
          break;
      }

      this._setShapesInProgress(lc);
      lc.repaintLayer('main');

      return this._updateInputEl(lc);
    }

    end(x, y, lc) {
      if (!this.currentShape) { return; }  // we may have committed at start time

      // use auto height once user lets go of selection corner
      this.currentShape.setSize(this.currentShape.forcedWidth, 0);

      if (this.currentShapeState === 'selected') {
        if ((this.dragAction === 'place') || ((this.dragAction === 'move') && !this.didDrag)) {
          this._enterEditingState(lc);
        }
      }

      this._setShapesInProgress(lc);
      lc.repaintLayer('main');
      return this._updateInputEl(lc);
    }

    _enterEditingState(lc) {
      this.currentShapeState = 'editing';

      if (this.inputEl) { throw "State error"; }

      this.inputEl = document.createElement('textarea');
      this.inputEl.className = 'text-tool-input';
      this.inputEl.style.position = 'absolute';
      this.inputEl.style.transformOrigin = '0px 0px';
      this.inputEl.style.backgroundColor = 'transparent';
      this.inputEl.style.border = 'none';
      this.inputEl.style.outline = 'none';
      this.inputEl.style.margin = '0';
      this.inputEl.style.padding = '4px';
      this.inputEl.style.zIndex = '1000';
      this.inputEl.style.overflow = 'hidden';
      this.inputEl.style.resize = 'none';

      this.inputEl.value = this.currentShape.text;

      this.inputEl.addEventListener('mousedown', e => e.stopPropagation());
      this.inputEl.addEventListener('touchstart', e => e.stopPropagation());

      const onChange = e => {
        this.currentShape.setText(e.target.value);
        this.currentShape.enforceMaxBoundingRect(lc);
        this._setShapesInProgress(lc);
        lc.repaintLayer('main');
        this._updateInputEl(lc);
        return e.stopPropagation();
      };

      this.inputEl.addEventListener('keydown', () => this._updateInputEl(lc, true));
      this.inputEl.addEventListener('keyup', onChange);
      this.inputEl.addEventListener('change', onChange);

      this._updateInputEl(lc);

      lc.containerEl.appendChild(this.inputEl);
      this.inputEl.focus();

      return this._setShapesInProgress(lc);
    }

    _exitEditingState(lc) {
      this.currentShapeState = 'selected';
      lc.containerEl.removeChild(this.inputEl);
      this.inputEl = null;

      this._setShapesInProgress(lc);
      return lc.repaintLayer('main');
    }

    _updateInputEl(lc, withMargin) {
      if (withMargin == null) { withMargin = false; }
      if (!this.inputEl) { return; }
      const br = this.currentShape.getBoundingRect(lc.ctx, true);
      this.inputEl.style.font = this.currentShape.font;
      this.inputEl.style.color = this.currentShape.color;
      this.inputEl.style.left =
        `${((lc.position.x / lc.backingScale) + (br.x * lc.scale)) - 4}px`;
      this.inputEl.style.top =
        `${((lc.position.y / lc.backingScale) + (br.y * lc.scale)) - 4}px`;

      if (withMargin && !this.currentShape.forcedWidth) {
        this.inputEl.style.width =
          `${br.width + 10 + this.currentShape.renderer.emDashWidth}px`;
      } else {
        this.inputEl.style.width = `${br.width + 12}px`;
      }

      if (withMargin) {
        this.inputEl.style.height =
          `${br.height + 10 + this.currentShape.renderer.metrics.leading}px`;
      } else {
        this.inputEl.style.height = `${br.height + 10}px`;
      }

      const transformString = `scale(${lc.scale})`;
      this.inputEl.style.transform = transformString;
      this.inputEl.style.webkitTransform= transformString;
      this.inputEl.style.MozTransform= transformString;
      this.inputEl.style.msTransform= transformString;
      return this.inputEl.style.OTransform= transformString;
    }
  };
  Text.initClass();
  return Text;
})());
