class LC.Tool

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

  # should draw whatever shape is in progress and isn't part of the drawing yet
  drawCurrent: (ctx) ->


class LC.Pencil extends LC.Tool

  constructor: ->
    @isDrawing = false
    @strokeWidth = 2

  title: "Pencil"
  cssSuffix: "pencil"
  buttonContents: -> '<i class="icon-pencil"></i>'
  optionsContents: ->
    $el = $("
      <span class='brush-width-min'>1 px</span>
      <input type='range' min='1' max='50' step='1' value='#{@strokeWidth}'>
      <span class='brush-width-max'>50 px</span>
      <span class='brush-width-val'>(5 px)</span>
    ")
    $el.filter('input').change (e) =>
      @strokeWidth = $(e.currentTarget).val()
      $el.filter('.brush-width-val').html("(#{@strokeWidth} px)")
    return $el

  begin: (x, y, lc) ->
    @color = lc.primaryColor
    @currentShape = @makeShape()
    @currentShape.addPoint(x, y)

  continue: (x, y, lc) ->
    @currentShape.addPoint(x, y)
    lc.update(@currentShape)

  end: (x, y, lc) ->
    @currentShape.addPoint(x, y)
    lc.saveShape(@currentShape)
    @currentShape = undefined

  drawCurrent: (ctx) ->
    @currentShape.draw(ctx) if @currentShape

  makePoint: (x, y, lc) -> new LC.Point(x, y, @strokeWidth, @color)
  makeShape: -> new LC.LinePathShape(this)


class LC.Eraser extends LC.Pencil

  constructor: ->
    super
    @strokeWidth = 10

  title: "Eraser"
  cssSuffix: "eraser"
  buttonContents: -> '<i class="icon-edit"></i>'

  makePoint: (x, y, lc) -> new LC.Point(x, y, @strokeWidth, '#000')
  makeShape: -> new LC.EraseLinePathShape(this)


class LC.Pan extends LC.Tool

  title: "Pan"
  cssSuffix: "pan"
  buttonContents: -> '<i class="icon-move"></i>'

  begin: (x, y, lc) ->
    @start = {x:x, y:y}

  continue: (x, y, lc) ->
    lc.pan @start.x - x, @start.y - y
    lc.repaint()


class LC.EyeDropper extends LC.Tool

  title: "Eyedropper"
  cssSuffix: "eye-dropper"
  buttonContents: -> '<i class="icon-eye-open"></i>'

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
