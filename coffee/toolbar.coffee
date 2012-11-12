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
  picker = $("<div class='color-picker'></div>")
  $picker = $(picker)

  _.each LC.defaultColors, (c) =>
    $sq = $("<div class='color-square'>&nbsp;</div>")
    $sq.css('background-color', c)
    $picker.append($sq)

  $el.popover
    trigger: 'manual'
    html: true
    title: title
    content: $picker

  $el.click ->
    $el.popover('show')
    $el.siblings('.popover').find('.color-square').each (_, c) ->
      $c = $(c)
      $c.click ->
        $el.popover('hide')
        callback($c.css('background-color'))

  return $picker


class LC.Toolbar
  constructor: (@lc, @$el) ->
    @initColors()
    @initButtons()
    @initTools()
    @initZoom()

  initColors: ->
    $stroke = @$el.find('.stroke-picker')
    $stroke.css('background-color', LC.defaultStrokeColor)
    LC.makeColorPicker $stroke, 'Foreground color', (c) =>
      $stroke.css('background-color', c)
      $stroke.popover('hide')
      @lc.primaryColor = c

    $fill = @$el.find('.fill-picker')
    $fill.css('background-color', LC.defaultFillColor)
    LC.makeColorPicker $fill, 'Background color', (c) =>
      $fill.css('background-color', c)
      $fill.popover('hide')
      @lc.secondaryColor = c

    @lc.on 'colorChange', (color) ->
      $stroke.css('background-color', color)

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
