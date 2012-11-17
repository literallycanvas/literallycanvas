class LC.Tool

  createOptions: ->
  title: undefined
  cssSuffix: undefined
  begin: (x, y, lc) ->
  continue: (x, y, lc) ->
  end: (x, y, lc) ->
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
    @$el.html($('<a>Pen tool</a>'))
    @$el.find('a').click (e) ->
      e.preventDefault()
      alert("You clicked me!")

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

  makePoint: (x, y, lc) -> new LC.Point(x, y, @strokeWidth, @color)
  makeShape: -> new LC.LinePathShape(this)


class LC.Eraser extends LC.Pencil

  title: "Eraser"
  cssSuffix: "eraser"

  createOptions: ($el) ->
    @$el = $el
    @$el.html($('<a>Eraser tool</a>'))
    @$el.find('a').click (e) ->
      e.preventDefault()
      alert("You clicked me!")

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
  cssSuffix: "eyedropper"

  begin: (x, y, lc) ->
    lc.primaryColor = lc.getPixel(x, y)
    lc.trigger 'colorChange', lc.primaryColor

  continue: (x, y, lc) ->
    lc.primaryColor = lc.getPixel(x, y)
    lc.trigger 'colorChange', lc.primaryColor
