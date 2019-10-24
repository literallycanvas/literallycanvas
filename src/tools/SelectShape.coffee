{Tool} = require './base'
{createShape} = require '../core/shapes'

getIsPointInBox = (point, box) ->
  if point.x < box.x then return false
  if point.y < box.y then return false
  if point.x > box.x + box.width then return false
  if point.y > box.y + box.height then return false
  return true


setShapeSize = (shape,width,height) ->
  shape.width=width
  shape.height=height

setShapePosition = (shape,x,y) ->
  shape.x=x
  shape.y=y


module.exports = class SelectShape extends Tool
  name: 'SelectShape'
  iconName:'select'
  usesSimpleAPI: false

  constructor: (lc) ->
    # This is a 'shadow' canvas -- we'll reproduce the shapes here, each shape
    # with a different color that corresponds to their index. That way we'll
    # be able to find which shape to select on the main canvas by pixel color.
    @selectCanvas = document.createElement('canvas')
    @selectCanvas.style['background-color'] = 'transparent'
    @selectCtx = @selectCanvas.getContext('2d')
    @shiftKeyDown=false

  _selectKeyDownListener:(e) =>
    if(e.keyCode==46) #delete
      lc.deleteShape(@selectedShape)
      @_clearCurrentShape(lc)
    else if (e.keyCode==16) #shift
      @shiftKeyDown=true

  _selectKeyUpListener:(e) =>
    if (e.keyCode==16) #shift
      @shiftKeyDown=false

  _getSelectionShape: (ctx, backgroundColor=null) ->
    createShape('SelectionBox', {shape: @selectedShape, ctx, backgroundColor})


  _setShapesInProgress: (lc) ->
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
    if @currentShapeState == 'editing'
      @_exitEditingState(lc)


  _exitEditingState: (lc) ->
    @currentShapeState = 'selected'
    lc.containerEl.removeChild(@inputEl)
    @inputEl = null

    @_setShapesInProgress(lc)
    lc.repaintLayer('main')

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
    @currentShapeState='selected'
    @selectedShapeClickCount=0

    lc.trigger 'shapeSelected', { @selectedShape }

    @_setShapesInProgress(lc)
    lc.repaintLayer 'main'

    br = @selectedShape.getBoundingRect()
    @dragOffset = {
      x: x - br.x,
      y: y - br.y
    }
    document.addEventListener('keydown', @_selectKeyDownListener)
    document.addEventListener('keyup', @_selectKeyUpListener)


  _clearCurrentShape: (lc) ->
    if @selectedShape?
      if @selectedShape.hasOwnProperty('text')
        @_ensureNotEditing(lc)
        lc.updateShape(@selectedShape)

    @selectedShape = null
    @initialShapeBoundingRect = null
    @currentShapeState = null
    lc.setShapesInProgress([])
    lc.repaintLayer('main')
    document.removeEventListener('keydown', @_selectKeyListener)
    document.removeEventListener('keyup', @_selectKeyUpListener)

  _getDragAction: (lc,point)->
    dragAction="none"
    br = @selectedShape.getBoundingRect(lc.ctx)
    selectionShape = @_getSelectionShape(lc.ctx)
    selectionBox = selectionShape.getBoundingRect()
    if getIsPointInBox(point, br)
      dragAction = 'move'
    if getIsPointInBox(point, selectionShape.getBottomRightHandleRect())
      dragAction = 'resizeBottomRight'
    if getIsPointInBox(point, selectionShape.getTopLeftHandleRect())
      dragAction = 'resizeTopLeft'
    if getIsPointInBox(point, selectionShape.getBottomLeftHandleRect())
      dragAction = 'resizeBottomLeft'
    if getIsPointInBox(point, selectionShape.getTopRightHandleRect())
      dragAction = 'resizeTopRight'
    
    return dragAction


  didBecomeActive: (lc) ->
    selectShapeUnsubscribeFuncs = []    
    @_selectShapeUnsubscribe = =>
      for func in selectShapeUnsubscribeFuncs
        func()


  
    

    onDown = ({ x, y }) =>
      @dragAction = 'none'
      @didDrag = false
      noshape=false

      shapeIndex = @_getPixel(x, y, lc, @selectCtx)
      if shapeIndex !=null 
        if @selectedShape?      
          if @selectedShape.id!=lc.shapes[shapeIndex].id
            #Switch Shape
            @_clearCurrentShape(lc)
            @_setCurrentShape(lc,lc.shapes[shapeIndex],x,y)          
        else
          #New Shape
          @_setCurrentShape(lc,lc.shapes[shapeIndex],x,y)

      if @selectedShape?
        if (@currentShapeState == 'selected' or @currentShapeState == 'editing')
          point = {x, y}
          @dragAction=@_getDragAction(lc,point)
          @initialShapeBoundingRect = @selectedShape.getBoundingRect(lc.ctx)
          @dragOffset = {
            x: x - @initialShapeBoundingRect.x,
            y: y - @initialShapeBoundingRect.y
          }

          if @dragAction=='none'
            @_clearCurrentShape(lc)
        

                
      

    onDrag = ({ x, y }) =>
      if @selectedShape?
        @didDrag = true

          
        br = @initialShapeBoundingRect
        brRight = br.x + br.width
        brBottom = br.y + br.height
        switch @dragAction
          when 'place'
            @selectedShape.x = x
            @selectedShape.y = y
            @didDrag = true
          when 'move'
            @selectedShape.x = x - @dragOffset.x
            @selectedShape.y = y - @dragOffset.y
            @didDrag = true
          when 'resizeBottomRight'
            newWidth = x - (@dragOffset.x - @initialShapeBoundingRect.width) - br.x
            if @shiftKeyDown
              newHeight=newWidth
            else
              newHeight=y - (@dragOffset.y - @initialShapeBoundingRect.height) - br.y
            setShapeSize(@selectedShape,newWidth,newHeight)

          when 'resizeTopLeft'
            
            newHeight=brBottom - y + @dragOffset.y
            if @shiftKeyDown
              newWidth=newHeight
            else
              newWidth=brRight - x + @dragOffset.x

            setShapeSize(@selectedShape,newWidth,newHeight)

            newY=y 
            if @shiftKeyDown
              offset = br.y-y

              newX=br.x - offset              
            else
              newX=x
              
            setShapePosition(@selectedShape, newX, newY)

          when 'resizeBottomLeft'
            newWidth=brRight - x + @dragOffset.x
            if @shiftKeyDown
              newHeight=newWidth
            else
              newHeight=y - (@dragOffset.y - @initialShapeBoundingRect.height) - br.y

            setShapeSize(@selectedShape,newWidth,newHeight)

            newX=x - @dragOffset.x
            newY=@selectedShape.y
            setShapePosition(@selectedShape, newX, newY)

          when 'resizeTopRight'

            newHeight=brBottom - y + @dragOffset.y
            
            if @shiftKeyDown
              newWidth=newHeight
            else
              newWidth= x - (@dragOffset.x - @initialShapeBoundingRect.width) - br.x  

            setShapeSize(@selectedShape,newWidth,newHeight)

            newX=@selectedShape.x
            if @shiftKeyDown
              newY= y - @dragOffset.y
            else
              newY=y - @dragOffset.y            
            setShapePosition(@selectedShape, newX, newY)

        @_setShapesInProgress(lc)
        lc.repaintLayer('main')

        ###
          @selectedShape.setUpperLeft {
            x: x - @dragOffset.x,
            y: y - @dragOffset.y
          }

          lc.setShapesInProgress [@selectedShape, createShape('SelectionBox', {
            shape: @selectedShape,
            handleSize: 0
          })]
          lc.repaintLayer 'main'
        ###

    onUp = ({ x, y }) =>
      if @didDrag
        @didDrag = false
        lc.trigger('shapeMoved', { shape: @selectedShape })
        lc.trigger('drawingChange', {})


        @currentShapeState='selected'
        @_setShapesInProgress(lc)
        lc.repaintLayer('main')
        @_drawSelectCanvas(lc)
      else
        @selectedShapeClickCount++
        if @selectedShape?
          if @selectedShape.hasOwnProperty('text') && @currentShapeState=='selected' && @selectedShapeClickCount >= 2
            @_enterEditingState(lc)
            lc.repaintLayer('main')


    

    selectShapeUnsubscribeFuncs.push lc.on 'lc-pointerdown', onDown
    selectShapeUnsubscribeFuncs.push lc.on 'lc-pointerdrag', onDrag
    selectShapeUnsubscribeFuncs.push lc.on 'lc-pointerup', onUp

    @_drawSelectCanvas(lc)


  willBecomeInactive: (lc) ->
    @_clearCurrentShape(lc)
    @_selectShapeUnsubscribe()
    lc.repaintLayer('main')
    #lc.setShapesInProgress []

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


