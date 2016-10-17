{Tool} = require './base'
{createShape} = require '../core/shapes'

module.exports = class SelectShape extends Tool
  name: 'SelectShape'
  usesSimpleAPI: false

  constructor: (lc) ->
    # This is a 'shadow' canvas -- we'll reproduce the shapes here, each shape
    # with a different color that corresponds to their index. That way we'll
    # be able to find which shape to select on the main canvas by pixel color.
    @selectCanvas = document.createElement('canvas')
    @selectCanvas.style['background-color'] = 'transparent'
    @selectCtx = @selectCanvas.getContext('2d')


  _getSelectionShape: (ctx, backgroundColor=null) ->
    createShape('SelectionBox', {shape: @selectedShape, ctx, backgroundColor})


  _setShapesInProgress: (lc) ->
    console.log(@currentShapeState)
    switch @currentShapeState
      when 'selected'
        
        lc.setShapesInProgress([@_getSelectionShape(lc.ctx), @selectedShape])
      when 'editing'
        lc.setShapesInProgress([@_getSelectionShape(lc.ctx, '#fff')])
      else
        lc.setShapesInProgress([@selectedShape])

  _updateInputEl: (lc, withMargin=false) ->
      return unless @inputEl
      br = @selectedShape.getBoundingRect(lc.ctx, true)
      @inputEl.style.font = @selectedShape.font
      @inputEl.style.color = @selectedShape.color
      @inputEl.style.left =
        "#{lc.position.x / lc.backingScale + br.x * lc.scale - 4}px"
      @inputEl.style.top =
        "#{lc.position.y / lc.backingScale + br.y * lc.scale - 4}px"

      if withMargin and not @selectedShape.forcedWidth
        @inputEl.style.width =
          "#{br.width + 10 + @selectedShape.renderer.emDashWidth}px"
      else
        @inputEl.style.width = "#{br.width + 12}px"

      if withMargin
        @inputEl.style.height =
          "#{br.height + 10 + @selectedShape.renderer.metrics.leading}px"
      else
        @inputEl.style.height = "#{br.height + 10}px"

      transformString = "scale(#{lc.scale})"
      @inputEl.style.transform = transformString
      @inputEl.style.webkitTransform= transformString
      @inputEl.style.MozTransform= transformString
      @inputEl.style.msTransform= transformString
      @inputEl.style.OTransform= transformString
 
  _ensureNotEditing: (lc) ->
    console.log("ensure not editing")
    if @currentShapeState == 'editing'
      @_exitEditingState(lc)


  _exitEditingState: (lc) ->
    @currentShapeState = 'selected'
    lc.containerEl.removeChild(@inputEl)
    @inputEl = null

    @_setShapesInProgress(lc)
    lc.repaintLayer('main')

  _clearCurrentShape2: (lc) ->
    @selectedShape = null
    @initialShapeBoundingRect = null
    @currentShapeState = null
    lc.setShapesInProgress([])

    



  _enterEditingState: (lc) ->
      @currentShapeState = 'editing'

      throw "State error" if @inputEl

      @inputEl = document.createElement('textarea')
      @inputEl.className = 'text-tool-input'
      @inputEl.style.position = 'absolute'
      @inputEl.style.transformOrigin = '0px 0px'
      @inputEl.style.backgroundColor = 'transparent'
      @inputEl.style.border = 'none'
      @inputEl.style.outline = 'none'
      @inputEl.style.margin = '0'
      @inputEl.style.padding = '4px'
      @inputEl.style.zIndex = '1000'
      @inputEl.style.overflow = 'hidden'
      @inputEl.style.resize = 'none'

      @inputEl.value = @selectedShape.text

      @inputEl.addEventListener 'mousedown', (e) -> e.stopPropagation()
      @inputEl.addEventListener 'touchstart', (e) -> e.stopPropagation()

      onChange = (e) =>
        @selectedShape.setText(e.target.value)
        @selectedShape.enforceMaxBoundingRect(lc)
        @_setShapesInProgress(lc)
        lc.repaintLayer('main')
        @_updateInputEl(lc)
        e.stopPropagation()

      @inputEl.addEventListener 'keydown', => @_updateInputEl(lc, true)
      @inputEl.addEventListener 'keyup', onChange
      @inputEl.addEventListener 'change', onChange

      @_updateInputEl(lc)

      lc.containerEl.appendChild(@inputEl)
      @inputEl.focus()

      @_setShapesInProgress(lc)

  _setCurrentShape: (lc, shape,x,y) ->
    @selectedShape = shape
    lc.trigger 'shapeSelected', { @selectedShape }
    lc.setShapesInProgress [@selectedShape, createShape('SelectionBox', {
      shape: @selectedShape,
      handleSize: 0
    })]        
    lc.repaintLayer 'main'

    br = @selectedShape.getBoundingRect()
    @dragOffset = {
      x: x - br.x,
      y: y - br.y
    }


  _clearCurrentShape: (lc) ->
    if @selectedShape.hasOwnProperty('text')
      @_ensureNotEditing(lc)
      lc.saveShape(@selectedShape) if @selectedShape.text
      lc.repaintLayer('main')

    @selectedShape = null
    @initialShapeBoundingRect = null
    @currentShapeState = null
    lc.setShapesInProgress([])


  didBecomeActive: (lc) ->
    selectShapeUnsubscribeFuncs = []    
    @_selectShapeUnsubscribe = =>
      for func in selectShapeUnsubscribeFuncs
        func()
    

    onDown = ({ x, y }) =>
      console.log("onDown")
      @didDrag = false

      shapeIndex = @_getPixel(x, y, lc, @selectCtx)

      if @selectedShape?
        console.log(@selectedShape.id)
        console.log(lc.shapes[shapeIndex].id)
        if @selectedShape.id==lc.shapes[shapeIndex].id
          #Same shape enter into text mode if text shape
          
          
        else
          #Switch Shape
          @_clearCurrentShape(lc)
          @_setCurrentShape(lc,lc.shapes[shapeIndex],x,y)

      else
        #New Shape
        @_setCurrentShape(lc,lc.shapes[shapeIndex],x,y)
        

                
      

    onDrag = ({ x, y }) =>
      #console.log("onDrag")
      if @selectedShape?
        @didDrag = true

        @selectedShape.setUpperLeft {
          x: x - @dragOffset.x,
          y: y - @dragOffset.y
        }
        lc.setShapesInProgress [@selectedShape, createShape('SelectionBox', {
          shape: @selectedShape,
          handleSize: 0
        })]
        lc.repaintLayer 'main'

    onUp = ({ x, y }) =>
      console.log("onUp",@currentShapeState)
      if @didDrag
        @didDrag = false
        lc.trigger('shapeMoved', { shape: @selectedShape })
        lc.trigger('drawingChange', {})
        lc.repaintLayer('main')
        @_drawSelectCanvas(lc)
      else
        if @selectedShape.hasOwnProperty('text') && !@currentShapeState
          @currentShapeState='selected'
        else if @selectedShape.hasOwnProperty('text') && @currentShapeState=='selected'
          @_enterEditingState(lc)


    

    selectShapeUnsubscribeFuncs.push lc.on 'lc-pointerdown', onDown
    selectShapeUnsubscribeFuncs.push lc.on 'lc-pointerdrag', onDrag
    selectShapeUnsubscribeFuncs.push lc.on 'lc-pointerup', onUp

    @_drawSelectCanvas(lc)


  willBecomeInactive: (lc) ->
    console.log("willBecomeInactive")
    @_clearCurrentShape(lc)
    @_selectShapeUnsubscribe()
    lc.setShapesInProgress []

  _drawSelectCanvas: (lc) ->
    @selectCanvas.width = lc.canvas.width
    @selectCanvas.height = lc.canvas.height
    @selectCtx.clearRect(0, 0, @selectCanvas.width, @selectCanvas.height)
    shapes = lc.shapes.map (shape, index) =>
      createShape('SelectionBox', {
        shape: shape,
        handleSize: 0,
        backgroundColor: "##{@_intToHex(index)}"
      })
    lc.draw(shapes, @selectCtx)

  _intToHex: (i) ->
    "000000#{i.toString 16}".slice(-6)

  _getPixel: (x, y, lc, ctx) ->
    p = lc.drawingCoordsToClientCoords x, y
    pixel = ctx.getImageData(p.x, p.y, 1, 1).data
    if pixel[3]
      parseInt @_rgbToHex(pixel[0], pixel[1], pixel[2]), 16
    else
      null

  _componentToHex: (c) ->
    hex = c.toString(16);
    "0#{hex}".slice -2

  _rgbToHex: (r, g, b) ->
    "#{@_componentToHex(r)}#{@_componentToHex(g)}#{@_componentToHex(b)}"


