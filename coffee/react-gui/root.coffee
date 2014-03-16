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
      toolButtons.map (ToolButton, ix) =>
        (ToolButton \
          {
            lc, root, imageURLPrefix,
            isSelected: ix == @state.selectedToolIndex,
            onSelect: (tool) =>
              lc.setTool(tool)
              @setState({selectedToolIndex: ix})
          }
        )
    )


Options = React.createClass
  displayName: 'Options'
  render: ->
    {div} = React.DOM
    (div())
