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

  constructor: (@text = 'TEXT', @font = 'bold 18px sans-serif') ->
    @isSelected = false

  setText: (text) ->
    @text = text

  commit: (lc) ->
    @isSelected = false
    lc.saveShape(@currentShape)
    lc.setShapesInProgress([])
    lc.repaintLayer('main')

  _getSelectionShape: -> createShape('SelectionBox', {shape: @currentShape})

  begin:(x, y, lc) ->
    @dragAction = 'none'
    if @isSelected
      selectionShape = @_getSelectionShape()
      selectionBox = selectionShape.getBoundingRect()
      shapeBox = @currentShape.getBoundingRect()
      point = {x, y}
      if getIsPointInBox(point, shapeBox)
        @dragAction = 'move'
        @dragOffset = {
          x: x - selectionBox.x,
          y: y - (selectionBox.y + selectionBox.height)
        }
      if getIsPointInBox(point, selectionShape.getBottomRightHandleRect())
        @dragAction = 'resizeBottomRight'
    else
      @color = lc.getColor('primary')
      @currentShape = createShape('Text', {x, y, @text, @color, @font})
      @dragAction = 'place'
      @isSelected = true

    if @dragAction == 'none'
      @commit(lc)
      return

    if @isSelected
      lc.setShapesInProgress(
        [@currentShape, @_getSelectionShape()])
    else
      lc.setShapesInProgress([@currentShape])

    lc.repaintLayer('main')

  continue:(x, y, lc) ->
    if @dragAction == 'none'
      return

    br = @currentShape.getBoundingRect()
    switch @dragAction
      when 'place'
        @currentShape.x = x
        @currentShape.y = y
      when 'move'
        @currentShape.x = x - @dragOffset.x
        @currentShape.y = y - @dragOffset.y
      when 'resizeBottomRight'
        @currentShape.setSize(x - br.x, y - br.y)

    if @isSelected
      lc.setShapesInProgress(
        [@currentShape, @_getSelectionShape()])
    else
      lc.setShapesInProgress([@currentShape])
    lc.repaintLayer('main')

  end:(x, y, lc) ->
    lc.repaintLayer('main')

  optionsStyle: 'font'
