{ToolWithStroke} = require './base'
{createShape} = require '../core/shapes'

module.exports = class Pencil extends ToolWithStroke

  name: 'Pencil'
  iconName: 'pencil'

  eventTimeThreshold: 10

  begin: (x, y, lc) ->
    @color = lc.getColor('primary')
    @currentShape = @makeShape()
    @currentShape.addPoint(@makePoint(x, y, lc))
    @lastEventTime = Date.now()

  continue: (x, y, lc) ->
    timeDiff = Date.now() - @lastEventTime

    if timeDiff > @eventTimeThreshold
      @lastEventTime += timeDiff
      @currentShape.addPoint(@makePoint(x, y, lc))
      lc.drawShapeInProgress(@currentShape)

  end: (x, y, lc) ->
    lc.saveShape(@currentShape)
    @currentShape = undefined

  makePoint: (x, y, lc) ->
    createShape('Point', {x, y, size: @strokeWidth, @color})
  makeShape: -> createShape('LinePath')
