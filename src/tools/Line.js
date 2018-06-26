{ToolWithStroke} = require './base'
{createShape} = require '../core/shapes'


module.exports = class Line extends ToolWithStroke

  name: 'Line'
  iconName: 'line'

  optionsStyle: 'line-options-and-stroke-width'

  begin: (x, y, lc) ->
    @currentShape = createShape('Line', {
      x1: x, y1: y, x2: x, y2: y, @strokeWidth,
      dash: switch
        when @isDashed then [@strokeWidth * 2, @strokeWidth * 4]
        else null
      endCapShapes: if @hasEndArrow then [null, 'arrow'] else null
      color: lc.getColor('primary')})

  continue: (x, y, lc) ->
    @currentShape.x2 = x
    @currentShape.y2 = y
    lc.drawShapeInProgress(@currentShape)

  end: (x, y, lc) ->
    # If start == end, dont save
    sameX = @currentShape.x1 == @currentShape.x2
    sameY = @currentShape.y1 == @currentShape.y2
    if sameX and sameY
      return
    lc.saveShape(@currentShape)
