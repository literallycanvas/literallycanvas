{Tool} = require './base'
{createShape} = require '../core/shapes'


getIsPointInBox = (point, box) ->
  if point.x < box.x then return false
  if point.y < box.y then return false
  if point.x > box.x + box.width then return false
  if point.y > box.y + box.height then return false
  return true


module.exports = class Text extends Tool

  name: 'Text'
  iconName: 'text'

  constructor: (@text = 'TÉXTq', @font = 'bold 18px sans-serif') ->
    @currentShapeState = null
    @initialShapeBoundingRect = null

  setText: (text) ->
    @text = text

  commit: (lc) ->
    @initialShapeBoundingRect = null
    @currentShapeState = null
    lc.saveShape(@currentShape)
    lc.setShapesInProgress([])
    lc.repaintLayer('main')

  _getSelectionShape: -> createShape('SelectionBox', {shape: @currentShape})

  begin:(x, y, lc) ->
    @dragAction = 'none'

    if @currentShapeState == 'selected'
      br = @currentShape.getBoundingRect()
      selectionShape = @_getSelectionShape()
      selectionBox = selectionShape.getBoundingRect()
      point = {x, y}
      if getIsPointInBox(point, br)
        @dragAction = 'move'
      if getIsPointInBox(point, selectionShape.getBottomRightHandleRect())
        @dragAction = 'resizeBottomRight'
      if getIsPointInBox(point, selectionShape.getTopLeftHandleRect())
        @dragAction = 'resizeTopLeft'
      if getIsPointInBox(point, selectionShape.getBottomLeftHandleRect())
        @dragAction = 'resizeBottomLeft'
      if getIsPointInBox(point, selectionShape.getTopRightHandleRect())
        @dragAction = 'resizeTopRight'
    else
      @color = lc.getColor('primary')
      @currentShape = createShape('Text', {x, y, @text, @color, @font, v: 1})
      @dragAction = 'place'
      @currentShapeState = 'selected'

    if @dragAction == 'none'
      @commit(lc)
      return

    @initialShapeBoundingRect = @currentShape.getBoundingRect()
    @dragOffset = {
      x: x - @initialShapeBoundingRect.x,
      y: y - @initialShapeBoundingRect.y
    }

    if @currentShapeState == 'selected'
      lc.setShapesInProgress(
        [@currentShape, @_getSelectionShape()])
    else
      lc.setShapesInProgress([@currentShape])

    lc.repaintLayer('main')

  continue:(x, y, lc) ->
    if @dragAction == 'none'
      return

    br = @initialShapeBoundingRect
    brRight = br.x + br.width
    brBottom = br.y + br.height
    switch @dragAction
      when 'place'
        @currentShape.x = x
        @currentShape.y = y
      when 'move'
        @currentShape.x = x - @dragOffset.x
        @currentShape.y = y - @dragOffset.y
      when 'resizeBottomRight'
        @currentShape.setSize(
          x - (@dragOffset.x - @initialShapeBoundingRect.width) - br.x,
          y - (@dragOffset.y - @initialShapeBoundingRect.height) - br.y)
      when 'resizeTopLeft'
        @currentShape.setSize(
          brRight - x + @dragOffset.x,
          brBottom - y + @dragOffset.y)
        @currentShape.setPosition(x - @dragOffset.x, y - @dragOffset.y)
      when 'resizeBottomLeft'
        @currentShape.setSize(
          brRight - x + @dragOffset.x,
          y - (@dragOffset.y - @initialShapeBoundingRect.height) - br.y)
        @currentShape.setPosition(x - @dragOffset.x, @currentShape. y)
      when 'resizeTopRight'
        @currentShape.setSize(
          x - (@dragOffset.x - @initialShapeBoundingRect.width) - br.x,
          brBottom - y + @dragOffset.y)
        @currentShape.setPosition(@currentShape.x, y - @dragOffset.y)

    if @currentShapeState == 'selected'
      lc.setShapesInProgress(
        [@currentShape, @_getSelectionShape()])
    else
      lc.setShapesInProgress([@currentShape])
    lc.repaintLayer('main')

  end:(x, y, lc) ->
    lc.repaintLayer('main')

  optionsStyle: 'font'
