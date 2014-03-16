window.LC = LC or {}
LC.React = LC.React or {}


createToolComponent = ({displayName, getTool, imageName}) ->
  tool = getTool()
  React.createClass
    displayName: displayName,
    componentWillMount: ->
      if @props.isSelected and not @props.lc.tool
        @props.lc.setTool(tool)
    render: ->
      {div, img} = React.DOM
      {imageURLPrefix, isSelected, onSelect} = @props

      className = React.addons.classSet
        'lc-pick-tool': true
        'toolbar-button': true
        'thin-button': true
        'selected': isSelected
      (div {className, onClick: -> onSelect(tool)},
        (img \
          {
            className: 'lc-tool-icon',
            src: "#{imageURLPrefix}/#{imageName}.png"
          }
        )
      )


LC.React.ToolButtons =

  Pencil: createToolComponent
    displayName: 'Pencil'
    imageName: 'pencil'
    getTool: -> new LC.Pencil()

  Eraser: createToolComponent
    displayName: 'Eraser'
    imageName: 'eraser'
    getTool: -> new LC.Eraser()

  Line: createToolComponent
    displayName: 'Line'
    imageName: 'line'
    getTool: -> new LC.LineTool()

  Rectangle: createToolComponent
    displayName: 'Rectangle'
    imageName: 'rectangle'
    getTool: -> new LC.RectangleTool()

  Text: createToolComponent
    displayName: 'Text'
    imageName: 'text'
    getTool: -> new LC.TextTool()

  Pan: createToolComponent
    displayName: 'Pan'
    imageName: 'pan'
    getTool: -> new LC.Pan()

  Eyedropper: createToolComponent
    displayName: 'Eyedropper'
    imageName: 'eyedropper'
    getTool: -> new LC.EyeDropper()


LC.React.Picker = React.createClass
  displayName: 'Picker'
  getInitialState: -> {selectedToolIndex: 0}
  render: ->
    {div} = React.DOM
    {toolButtons, lc, root, imageURLPrefix} = @props
    (div {className: 'lc-picker-contents'},
      toolButtons.map((ToolButton, ix) =>
        (ToolButton \
          {
            lc, root, imageURLPrefix,
            key: ix
            isSelected: ix == @state.selectedToolIndex,
            onSelect: (tool) =>
              lc.setTool(tool)
              @setState({selectedToolIndex: ix})
          }
        )
      ),
      if toolButtons.length % 2 != 0
        (div {className: 'toolbar-button thin-button disabled'})
      LC.React.UndoRedo({lc, imageURLPrefix}),
      LC.React.ClearButton({lc})
    )


LC.React.UndoRedo = React.createClass
  displayName: 'UndoRedo'
  render: ->
    {div} = React.DOM
    {lc} = @props
    (div {className: 'lc-undo-redo'},
      LC.React.UndoButton({lc}),
      LC.React.RedoButton({lc})
    )


LC.React.UndoButton = React.createClass
  displayName: 'UndoButton'

  # We do this a lot, even though it reads as a React no-no.
  # The reason is that '@props.lc' is a monolithic state bucket for
  # Literally Canvas, and does not offer opportunities for encapsulation.
  #
  # However, this component really does read and write only to the 'undo'
  # part of the state bucket, and we have to get react to update somehow, and
  # we don't want the parent to have to worry about this, so it's in @state.
  getState: -> {isEnabled: @props.lc.canUndo()}
  getInitialState: -> @getState()

  componentDidMount: ->
    @subscriber = => @setState @getState()
    @props.lc.on 'drawingChange', @subscriber
  componentWillUnmount: ->
    @props.lc.removeEventListener('drawingChange', @subscriber)

  render: ->
    {div} = React.DOM
    {lc} = @props

    className = React.addons.classSet
      'lc-undo': true
      'toolbar-button': true
      'thin-button': true
      'disabled': not @state.isEnabled
    onClick = if lc.canUndo() then (=> lc.undo()) else ->

    (div {
      className, onClick,
      dangerouslySetInnerHTML: {__html: "&larr;"}})


LC.React.RedoButton = React.createClass
  displayName: 'RedoButton'
  getState: -> {isEnabled: @props.lc.canRedo()}
  getInitialState: -> @getState()
  componentDidMount: ->
    @subscriber = => @setState @getState()
    @props.lc.on 'drawingChange', @subscriber
  componentWillUnmount: ->
    @props.lc.removeEventListener('drawingChange', @subscriber)

  render: ->
    {div} = React.DOM
    {lc} = @props

    className = React.addons.classSet
      'lc-redo': true
      'toolbar-button': true
      'thin-button': true
      'disabled': not @state.isEnabled
    onClick = if lc.canRedo() then (=> lc.redo()) else ->

    (div {
      className, onClick,
      dangerouslySetInnerHTML: {__html: "&rarr;"}})


LC.React.ClearButton = React.createClass
  displayName: 'ClearButton'
  getState: -> {isEnabled: @props.lc.canUndo()}
  getInitialState: -> @getState()
  componentDidMount: ->
    @subscriber = => @setState @getState()
    @props.lc.on 'drawingChange', @subscriber
  componentWillUnmount: ->
    @props.lc.removeEventListener('drawingChange', @subscriber)

  render: ->
    {div} = React.DOM
    {lc} = @props

    className = React.addons.classSet
      'lc-clear': true
      'toolbar-button': true
      'fat-button': true
      'disabled': not @state.isEnabled
    onClick = if lc.canUndo() then (=> lc.clear()) else ->

    (div {className, onClick}, 'Clear')


LC.React.Options = React.createClass
  displayName: 'Options'
  getState: -> {
    style: @props.lc.tool?.optionsStyle
    tool: @props.lc.tool
  }
  getInitialState: -> @getState()
  componentDidMount: ->
    @subscriber = => @setState @getState()
    @props.lc.on 'toolChange', @subscriber
  componentWillUnmount: ->
    @props.lc.removeEventListener('toolChange', @subscriber)

  render: ->
    # style can be null; cast it as a string
    style = "" + @state.style
    LC.React.OptionsStyles[style]({lc: @props.lc, tool: @state.tool})


LC.React.OptionsStyles =
  'font': React.createClass
    displayName: 'FontOptions'
    render: -> React.DOM.div({}, "FONT STYLES")

  'stroke-width': React.createClass
    displayName: 'StrokeWidths'
    getState: -> {strokeWidth: @props.lc.tool?.strokeWidth}
    getInitialState: -> @getState()
    render: ->
      {ul, li, svg, circle} = React.DOM
      strokeWidths = [1, 2, 5, 10, 20, 40]
      buttonSize = Math.max(strokeWidths...)

      getItem = (strokeWidth) =>

      (ul {className: 'lc-stroke-widths'},
        strokeWidths.map((strokeWidth, ix) =>
          className = React.addons.classSet
            'lc-stroke-width': true
            'selected': strokeWidth == @state.strokeWidth
          (li \
            {
              className,
              key: strokeWidth,
              onClick: =>
                @props.tool.strokeWidth = strokeWidth
                @setState @getState()
            },
            (svg \
              {
                width: buttonSize
                height: buttonSize
                viewPort: "0 0 #{buttonSize} #{buttonSize}"
                version: "1.1"
                xmlns: "http://www.w3.org/2000/svg"
              },
              (circle {cx: buttonSize/2, cy: buttonSize/2, r: strokeWidth/2})
            )
          )
        )
      )

  'null': React.createClass
    displayName: 'NoOptions'
    render: -> React.DOM.div()
