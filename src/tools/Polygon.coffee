{ToolWithStroke} = require './base'
{createShape} = require '../core/shapes'

module.exports = class Polygon extends ToolWithStroke

  name: 'Polygon'
  iconName: 'polygon'
  usesSimpleAPI: false

  didBecomeActive: (lc) ->
    super(lc)
    polygonUnsubscribeFuncs = []
    @polygonUnsubscribe = =>
      for func in polygonUnsubscribeFuncs
        func()

    @points = null
    @maybePoint = null

    onUp = =>
      return @_close(lc) if @_getWillFinish()
      lc.trigger 'lc-polygon-started'

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

    polygonFinishOpen = () =>
      @maybePoint = {x: Infinity, y: Infinity}
      @_close(lc)

    polygonFinishClosed = () =>
      @maybePoint = @points[0]
      @_close(lc)

    polygonCancel = () =>
      @_cancel(lc)

    polygonUnsubscribeFuncs.push lc.on 'drawingChange', => @_cancel(lc)
    polygonUnsubscribeFuncs.push lc.on 'lc-pointerdown', onDown
    polygonUnsubscribeFuncs.push lc.on 'lc-pointerdrag', onMove
    polygonUnsubscribeFuncs.push lc.on 'lc-pointermove', onMove
    polygonUnsubscribeFuncs.push lc.on 'lc-pointerup', onUp

    polygonUnsubscribeFuncs.push lc.on 'lc-polygon-finishopen', polygonFinishOpen
    polygonUnsubscribeFuncs.push lc.on 'lc-polygon-finishclosed', polygonFinishClosed
    polygonUnsubscribeFuncs.push lc.on 'lc-polygon-cancel', polygonCancel

  willBecomeInactive: (lc) ->
    super(lc)
    @_cancel(lc) if @points or @maybePoint
    @polygonUnsubscribe()

  _getArePointsClose: (a, b) ->
    return (Math.abs(a.x - b.x) + Math.abs(a.y - b.y)) < 10

  _getWillClose: ->
    return false unless @points and @points.length > 1
    return false unless @maybePoint
    return @_getArePointsClose(@points[0], @maybePoint)

  _getWillFinish: ->
    return false unless @points and @points.length > 1
    return false unless @maybePoint
    return (
      @_getArePointsClose(@points[0], @maybePoint) ||
      @_getArePointsClose(@points[@points.length - 1], @maybePoint))

  _cancel: (lc) ->
    lc.trigger 'lc-polygon-stopped'
    @maybePoint = null
    @points = null
    lc.setShapesInProgress([])
    lc.repaintLayer('main')

  _close: (lc) ->
    lc.trigger 'lc-polygon-stopped'
    lc.setShapesInProgress([])
    lc.saveShape(@_getShape(lc, false)) if @points.length > 2
    @maybePoint = null
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
        isClosed: @_getWillClose(),
        strokeColor: lc.getColor('primary'),
        fillColor: lc.getColor('secondary'),
        @strokeWidth,
        points: points.map (xy) -> createShape('Point', xy)
      })
    else
      null

  optionsStyle: 'polygon-and-stroke-width'
