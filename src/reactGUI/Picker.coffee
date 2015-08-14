React = require './React-shim'

ClearButton = require './ClearButton'
UndoRedoButtons = require './UndoRedoButtons'
ZoomButtons = require './ZoomButtons'


Picker = React.createClass
  displayName: 'Picker'
  getInitialState: -> {selectedToolIndex: 0}
  render: ->
    {div} = React.DOM
    {toolButtonComponents, lc, imageURLPrefix} = @props
    (div {className: 'lc-picker-contents'},
      toolButtonComponents.map((component, ix) =>
        (component \
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
      if toolButtonComponents.length % 2 != 0
        (div {className: 'toolbar-button thin-button disabled'})
      UndoRedoButtons({lc, imageURLPrefix}),
      ZoomButtons({lc, imageURLPrefix})
      ClearButton({lc})
    )


module.exports = Picker
