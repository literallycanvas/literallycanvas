window.LC = LC or {}
LC.React = LC.React or {}


createToolComponent = ({displayName, getTool, imageName}) ->
  tool = getTool()
  React.createClass
    displayName: displayName,
    componentWillMount: ->
      if @props.isSelected
        # prevent race condition with options, tools getting set
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


LC.React.Mixins =
  UpdateOnDrawingChangeMixin:
    componentDidMount: ->
      @subscriber = => @setState @getState()
      @props.lc.on 'drawingChange', @subscriber
    componentWillUnmount: ->
      @props.lc.removeEventListener('drawingChange', @subscriber)

  UpdateOnToolChangeMixin:
    componentDidMount: ->
      @subscriber = => @setState @getState()
      @props.lc.on 'toolChange', @subscriber
    componentWillUnmount: ->
      @props.lc.removeEventListener('toolChange', @subscriber)


LC.React.Picker = React.createClass
  displayName: 'Picker'
  getInitialState: -> {selectedToolIndex: 0}
  render: ->
    {div} = React.DOM
    {toolNames, lc, imageURLPrefix} = @props
    (div {className: 'lc-picker-contents'},
      toolNames.map((name, ix) =>
        (LC.React.ToolButtons[name] \
          {
            lc, imageURLPrefix,
            key: ix
            isSelected: ix == @state.selectedToolIndex,
            onSelect: (tool) =>
              lc.setTool(tool)
              @setState({selectedToolIndex: ix})
          }
        )
      ),
      if toolNames.length % 2 != 0
        (div {className: 'toolbar-button thin-button disabled'})
      LC.React.UndoRedo({lc, imageURLPrefix}),
      LC.React.ClearButton({lc})
      LC.React.ColorPickers({lc})
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
  mixins: [LC.React.Mixins.UpdateOnDrawingChangeMixin]

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
  mixins: [LC.React.Mixins.UpdateOnDrawingChangeMixin]

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
  mixins: [LC.React.Mixins.UpdateOnDrawingChangeMixin]

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


LC.React.ColorPickers = React.createClass
  displayName: 'ColorPickers'
  render: ->
    {lc} = @props
    {div} = React.DOM
    (div {className: 'lc-color-pickers'},
      (LC.React.ColorWell {lc, colorName: 'background', label: 'background'})
      (LC.React.ColorWell {lc, colorName: 'primary', label: 'stroke'})
      (LC.React.ColorWell {lc, colorName: 'secondary', label: 'fill'})
    )


LC.React.ColorWell = React.createClass
  displayName: 'ColorWell'
  getState: -> {
    color: @props.lc.colors[@props.colorName],
    isPickerVisible: false
  }
  getInitialState: -> @getState()

  openPicker: -> @setState {isPickerVisible: true}
  closePicker: -> @setState {isPickerVisible: false}
  setColor: (c) ->
    @props.lc.setColor(@props.colorName, c)
    @setState @getState()
    @closePicker()

  renderPicker: ->
    return null unless @state.isPickerVisible
    {div} = React.DOM

    rows = [("hsl(0, 0%, #{i}%)" for i in [0..100] by 10)]
    for hue in [0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330]
      rows.push("hsl(#{hue}, 100%, #{i}%)" for i in [10..90] by 8)

    (div {className: 'color-picker-popup'},
      rows.map((row, ix) =>
        (div {className: 'color-row', style: {width: 20 * row.length}},
          row.map((cellColor, ix2) =>
            className = React.addons.classSet
              'color-cell': true
              'selected': @state.color == cellColor
            (div \
              {
                className,
                onClick: => @setColor(cellColor)
                style: {backgroundColor: cellColor}
              }
            )
          )
        )
      )
    )

  render: ->
    {div, label} = React.DOM
    (div \
      {
        className: 'toolbar-button color-well-label'
        onMouseLeave: @closePicker
      },
      (label {style: {display: 'block', clear: 'both'}}, @props.label),
      (div \
        {
          className: React.addons.classSet
            'color-well-container': true
            'selected': @state.isPickerVisible
          onClick: @openPicker
          style: {
            backgroundColor: 'white'
            position: 'relative'
          }
        },
        (div {className: 'color-well-checker'}),
        (div \
          {className: 'color-well-checker', style: {left: '50%', top: '50%'}}),
        (div \
          {
            className: 'color-well-color',
            style: {backgroundColor: @state.color}
          },
          " "
        ),
        @renderPicker()
      )
    )