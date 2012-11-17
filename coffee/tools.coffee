class LC.Tool

  createOptions: ->
  title: undefined
  cssSuffix: undefined
  begin: (x, y, lc) ->
  continue: (x, y, lc) ->
  end: (x, y, lc) ->
  drawCurrent: (ctx) ->
  createToolbar: (el) ->
  removeToolbar: (el) ->


class LC.Pencil extends LC.Tool

  constructor: ->
    @isDrawing = false
    @strokeWidth = 5

  title: "Pencil"
  cssSuffix: "pencil"

  createOptions: ($el) ->
    @$el = $el
    @$el.html($('
      <span class="brush-width-min">1 px</span>
      <input type="range" min="1" max="50" step="1" value="5">
      <span class="brush-width-max">50 px</span>
      <span class="brush-width-val">(5 px)</span>
    '))
    brushWidthVal = @$el.find('.brush-width-val')
    @$el.find('input').change (e) =>
      @strokeWidth = e.currentTarget.valueAsNumber
      brushWidthVal.html("(#{@strokeWidth} px)")

  begin: (x, y, lc) ->
    @color = lc.primaryColor
    @currentShape = @makeShape()
    @currentShape.addPoint(x, y)

  continue: (x, y, lc) ->
    @currentShape.addPoint(x, y)
    lc.repaint(@currentShape)

  end: (x, y, lc) ->
    @currentShape.addPoint(x, y)
    lc.saveShape(@currentShape)
    @currentShape = undefined

  drawCurrent: (ctx) ->
    @currentShape.draw(ctx) if @currentShape

  makePoint: (x, y, lc) -> new LC.Point(x, y, @strokeWidth, @color)
  makeShape: -> new LC.LinePathShape(this)


class LC.Eraser extends LC.Pencil

  title: "Eraser"
  cssSuffix: "eraser"

  makePoint: (x, y, lc) -> new LC.Point(x, y, @strokeWidth, '#000')
  makeShape: -> new LC.EraseLinePathShape(this)


class LC.Pan extends LC.Tool

  title: "Pan"
  cssSuffix: "pan"

  begin: (x, y, lc) ->
    @start = {x:x, y:y}

  continue: (x, y, lc) ->
    lc.pan @start.x - x, @start.y - y
    lc.repaint()


class LC.EyeDropper extends LC.Tool

  title: "Eyedropper"
  cssSuffix: "eye-dropper"

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
