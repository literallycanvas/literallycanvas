class LC.Tool

  constructor: (@opts) ->

  # text to be shown in a hypothetical tooltip
  title: undefined

  # suffix of the CSS elements that are generated for this class.
  # specficially tool-{suffix} for the button, and tool-options-{suffix} for
  # the options container.
  cssSuffix: undefined

  # function that returns the HTML of the tool button's contents
  buttonContents: -> undefined

  # function that returns the HTML of the tool options
  optionsContents: -> undefined

  # called when the user starts dragging
  begin: (x, y, lc) ->

  # called when the user moves while dragging
  continue: (x, y, lc) ->

  # called when the user finishes dragging
  end: (x, y, lc) ->


class LC.RectangleTool extends LC.Tool

  constructor: (@opts) ->
    @strokeWidth = 5

  title: 'Rectangle'
  cssSuffix: 'rectangle'
  buttonContents: -> "<img src='#{@opts.imageURLPrefix}/rectangle.png'>"

  begin: (x, y, lc) ->
    @currentShape = new LC.Rectangle(x, y, @strokeWidth, lc.primaryColor)

  continue: (x, y, lc) ->
    @currentShape.width = x - @currentShape.x
    @currentShape.height = y - @currentShape.y
    lc.update(@currentShape)

  end: (x, y, lc) ->
    lc.saveShape(@currentShape)
   

class LC.Pencil extends LC.Tool

  constructor: (@opts) ->
    @strokeWidth = 5

  title: "Pencil"
  cssSuffix: "pencil"
  buttonContents: -> "<img src='#{@opts.imageURLPrefix}/pencil.png'>"
  optionsContents: ->
    $el = $("
      <span class='brush-width-min'>1 px</span>
      <input type='range' min='1' max='50' step='1' value='#{@strokeWidth}'>
      <span class='brush-width-max'>50 px</span>
      <span class='brush-width-val'>(5 px)</span>
    ")

    $input = $el.filter('input')
    if $input.size() == 0
      $input = $el.find('input')

    $brushWidthVal = $el.filter('.brush-width-val')
    if $brushWidthVal.size() == 0
      $brushWidthVal = $el.find('.brush-width-val')

    $input.change (e) =>
      @strokeWidth = parseInt($(e.currentTarget).val(), 10)
      $brushWidthVal.html("(#{@strokeWidth} px)")
    return $el

  begin: (x, y, lc) ->
    @color = lc.primaryColor
    @currentShape = @makeShape()
    @currentShape.addPoint(@makePoint(x, y, lc))

  continue: (x, y, lc) ->
    @currentShape.addPoint(@makePoint(x, y, lc))
    lc.update(@currentShape)

  end: (x, y, lc) ->
    lc.saveShape(@currentShape)
    @currentShape = undefined

  makePoint: (x, y, lc) -> new LC.Point(x, y, @strokeWidth, @color)
  makeShape: -> new LC.LinePathShape(this)


class LC.Eraser extends LC.Pencil

  constructor: (@opts) ->
    super
    @strokeWidth = 10

  title: "Eraser"
  cssSuffix: "eraser"
  buttonContents: -> "<img src='#{@opts.imageURLPrefix}/eraser.png'>"

  makePoint: (x, y, lc) -> new LC.Point(x, y, @strokeWidth, '#000')
  makeShape: -> new LC.EraseLinePathShape(this)


class LC.Pan extends LC.Tool

  title: "Pan"
  cssSuffix: "pan"
  buttonContents: -> "<img src='#{@opts.imageURLPrefix}/pan.png'>"

  begin: (x, y, lc) ->
    @start = {x:x, y:y}

  continue: (x, y, lc) ->
    lc.pan @start.x - x, @start.y - y
    lc.repaint()


class LC.EyeDropper extends LC.Tool

  title: "Eyedropper"
  cssSuffix: "eye-dropper"
  buttonContents: -> "<img src='#{@opts.imageURLPrefix}/eyedropper.png'>"

  readColor: (x, y, lc) ->
    newColor = lc.getPixel(x, y)
    if newColor
      lc.primaryColor = newColor
    else
      lc.primaryColor = lc.backgroundColor
    lc.trigger 'colorChange', lc.primaryColor

  begin: (x, y, lc) ->
    @readColor(x, y, lc)

  continue: (x, y, lc) ->
    @readColor(x, y, lc)
