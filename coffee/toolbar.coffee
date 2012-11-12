window.LC = window.LC ? {}

LC.defaultColors = [
  'rgba(255, 0, 0, 0.9)',
  'rgba(255, 128, 0, 0.9)',
  'rgba(255, 255, 0, 0.9)',
  'rgba(128, 255, 0, 0.9)',
  'rgba(0, 255, 0, 0.9)',
  'rgba(0, 255, 128, 0.9)',
  'rgba(0, 128, 255, 0.9)',
  'rgba(0, 0, 255, 0.9)',
  'rgba(128, 0, 255, 0.9)',
  'rgba(255, 0, 128, 0.9)',
  'rgba(0, 0, 0, 0.9)',
  'rgba(255, 255, 255, 0.9)',
]

LC.defaultStrokeColor = 'rgba(0, 0, 0, 0.9)'
LC.defaultFillColor = 'rgba(255, 255, 255, 0.9)'


LC.makeColorPicker = ($el, title, callback) ->
  $el.data('color', 'rgb(0, 0, 0)')
  cp = $el.colorpicker(format: 'rgb').data('colorpicker')
  cp.hide()
  $el.on 'changeColor', (e) ->
    callback(e.color.toRGB())
  $el.click (e) ->
    if cp.picker.is(':visible')
      cp.hide()
    else
      cp.show()
      cp.place()
  return cp


class LC.Toolbar
  constructor: (@lc, @$el) ->
    @initColors()
    @initButtons()
    @initTools()
    @initZoom()

  initColors: ->
    $stroke = @$el.find('.stroke-picker')
    $stroke.css('background-color', LC.defaultStrokeColor)
    cp = LC.makeColorPicker $stroke, 'Foreground color', (c) =>
      val = "rgba(#{c.r}, #{c.g}, #{c.b}, 1)"
      $stroke.css('background-color', val)
      @lc.primaryColor = val
    @lc.$canvas.mousedown ->
      cp.hide()

  initButtons: ->
    @$el.find('.clear-button').tooltip({title: "Clear"}).click (e) =>
      @lc.clear()

    @$el.find('.undo-button').tooltip({title: "Undo"}).click (e) =>
      @lc.undo()

    @$el.find('.redo-button').tooltip({title: "Redo"}).click (e) =>
      @lc.redo()

  initTools: ->
    @$el.find('.tool-pencil').tooltip({title: "Pencil"}).click (e) =>
      @lc.tool = new LC.Pencil()

    @$el.find('.tool-eraser').tooltip({title: "Eraser"}).click (e) =>
      @lc.tool = new LC.Eraser()

    @$el.find('.tool-pan').tooltip({title: "Pan"}).click (e) =>
      @lc.tool = new LC.Pan()

    @$el.find('.tool-eye-dropper').tooltip({title: "Eye Dropper"}).click (e) =>
      @lc.tool = new LC.EyeDropper()

  initZoom: ->
    @$el.find('.zoom-in-button').tooltip({title: "Zoom in"}).click (e) =>
      @lc.zoom(0.2)
      @$el.find('.zoom-display').html(@lc.scale)

    @$el.find('.zoom-out-button').tooltip({title: "Zoom out"}).click (e) =>
      @lc.zoom(-0.2)
      @$el.find('.zoom-display').html(@lc.scale)
