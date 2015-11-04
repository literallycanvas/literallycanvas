{ToolWithStroke} = require './base'
{createShape} = require '../core/shapes'

module.exports = class Polygon extends ToolWithStroke

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
      return @_close(lc) if @_getWillFinish()
      @_ensureFinishButtonsExist(lc) unless @points

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

    unsubscribeFuncs.push lc.on 'drawingChange', => @_cancel(lc)
    unsubscribeFuncs.push lc.on 'lc-pointerdown', onDown
    unsubscribeFuncs.push lc.on 'lc-pointerdrag', onMove
    unsubscribeFuncs.push lc.on 'lc-pointermove', onMove
    unsubscribeFuncs.push lc.on 'lc-pointerup', onUp

  willBecomeInactive: (lc) ->
    @_cancel(lc) if @points or @maybePoint
    @unsubscribe()

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
    @_ensureFinishButtonsDontExist(lc)
    @maybePoint = null
    @points = null
    lc.setShapesInProgress([])
    lc.repaintLayer('main')

  _close: (lc) ->
    @_ensureFinishButtonsDontExist(lc)
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

  _ensureFinishButtonsExist: (lc) ->
    return if @containerEl
    html = "
      <div
        class='square-toolbar-button horz-toolbar'
        id='polygon-finish-closed'>
        <img
          alt='Finish polygon (closed)'
          title='Finish polygon (closed)'
          src='#{lc.opts.imageURLPrefix}/polygon-closed.png'>
      </div>
      <div
        class='square-toolbar-button horz-toolbar'
        id='polygon-finish-open'>
        <img
          alt='Finish polygon (open)'
          title='Finish polygon (open)'
          src='#{lc.opts.imageURLPrefix}/polygon-open.png'>
      </div>
      <div
        class='square-toolbar-button horz-toolbar'
        id='polygon-cancel'>
        <img
          alt='Cancel polygon'
          title='Cancel polygon'
          src='#{lc.opts.imageURLPrefix}/polygon-cancel.png'>
      </div>
    "
    @containerEl = document.createElement('div')
    @containerEl.className = "polygon-toolbar horz-toolbar"
    @containerEl.innerHTML = html
    lc.containerEl.appendChild(@containerEl)

    document.getElementById('polygon-finish-closed')
      .addEventListener 'click', (e) =>
        @maybePoint = @points[0]
        @_close(lc)

    document.getElementById('polygon-finish-open')
      .addEventListener 'click', (e) =>
        @maybePoint = {x: Infinity, y: Infinity}
        @_close(lc)

    document.getElementById('polygon-cancel')
      .addEventListener 'click', (e) =>
        @_cancel(lc)

  _ensureFinishButtonsDontExist: (lc) ->
    return unless @containerEl
    lc.containerEl.removeChild(@containerEl)
    @containerEl = null