window.LC = LC or {}
LC.React = LC.React or {}


LC.React.init = (root, lc, toolButtons, imageURLPrefix) ->
  canvasElement = null
  for child in root.children
    if child.tagName.toLocaleLowerCase() == 'canvas'
      canvasElement = child

  unless canvasElement
    canvasElement = document.createElement('canvas')
    root.appendChild(canvasElement)

  pickerElement = document.createElement('div')
  pickerElement.className = 'lc-picker'
  root.insertBefore(pickerElement, canvasElement)

  optionsElement = document.createElement('div')
  optionsElement.className = 'lc-options'
  root.appendChild(optionsElement)

  React.renderComponent(
    Picker({lc, root, toolButtons, imageURLPrefix}),
    pickerElement);
  React.renderComponent(Options({lc, root}), optionsElement);


Picker = React.createClass
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
      UndoRedo({lc, root, imageURLPrefix})
    )


UndoRedo = React.createClass
  displayName: 'UndoRedo'
  render: ->
    {div} = React.DOM
    {lc} = @props
    (div {className: 'lc-undo-redo'}, UndoButton({lc}), RedoButton({lc}))


UndoButton = React.createClass
  displayName: 'UndoButton'
  getInitialState: -> {isEnabled: @props.lc.canUndo()}
  componentDidMount: ->
    @subscriber = => @setState {isEnabled: @props.lc.canUndo()}
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


RedoButton = React.createClass
  displayName: 'RedoButton'
  getInitialState: -> {isEnabled: @props.lc.canRedo()}
  componentDidMount: ->
    @subscriber = => @setState {isEnabled: @props.lc.canRedo()}
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


Options = React.createClass
  displayName: 'Options'
  render: ->
    {div} = React.DOM
    (div())
