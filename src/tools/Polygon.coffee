{ToolWithStroke} = require './base'
{createShape} = require '../core/shapes'

module.exports = class Pencil extends ToolWithStroke

  name: 'Polygon'
  iconName: 'polygon'
  usesSimpleAPI: false

  didBecomeActive: (lc) ->
    unsubscribeFuncs = []
    @unsubscribe = =>
      for func in unsubscribeFuncs
        func()

    @points = null
    @maybePoint = null

    onUp = =>
      if @_getWillClose()
        @_close(lc)
        return

      if @points
        @points.push(@maybePoint)
      else
        @points = [@maybePoint]

      @maybePoint = {x: @maybePoint.x, y: @maybePoint.y}
      lc.setShapesInProgress(@_getShapes(lc))
      lc.repaintLayer('main')

    onMove = ({x, y}) =>
      if @maybePoint
        @maybePoint.x = x
        @maybePoint.y = y
        lc.setShapesInProgress(@_getShapes(lc))
        lc.repaintLayer('main')

    onDown = ({x, y}) =>
      @maybePoint = {x, y}
      lc.setShapesInProgress(@_getShapes(lc))
      lc.repaintLayer('main')

    unsubscribeFuncs.push lc.on 'pointerdown', onDown
    unsubscribeFuncs.push lc.on 'pointerdrag', onMove
    unsubscribeFuncs.push lc.on 'pointermove', onMove
    unsubscribeFuncs.push lc.on 'pointerup', onUp

  willBecomeInactive: (lc) ->
    @unsubscribe()

  _getWillClose: ->
    return false unless @points and @points.length > 2
    return false unless @maybePoint
    firstPoint = @points[0]
    lastPoint = @points[@points.length - 1]
    for testPoint in [firstPoint, lastPoint]
      mDist = (
        Math.abs(@maybePoint.x - testPoint.x) +
        Math.abs(@maybePoint.y - testPoint.y))
      if mDist < 10
        return true
    return false

  _close: (lc) ->
    @maybePoint = null
    lc.setShapesInProgress([])
    lc.saveShape(@_getShape(lc, false)) if @points.length > 2
    @points = null

  _getShapes: (lc, isInProgress=true) ->
    shape = @_getShape(lc, isInProgress)
    if shape then [shape] else []

  _getShape: (lc, isInProgress=true) ->
    points = []
    if @points
      points = points.concat(@points)
    return null if (not isInProgress) and points.length < 3
    if isInProgress and @maybePoint
      points.push(@maybePoint)
    if points.length > 1
      createShape('Polygon', {
        isClosed: @_getWillClose() or (not isInProgress),
        strokeColor: lc.getColor('primary'),
        fillColor: lc.getColor('secondary'),
        @strokeWidth,
        points: points.map (xy) -> createShape('Point', xy)
      })
    else
      null
