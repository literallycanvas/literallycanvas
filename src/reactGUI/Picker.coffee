React = require 'React'

ClearButton = require './ClearButton'
ColorWell = require './ColorWell'
toolButtons = require './toolButtons'
UndoRedoButtons = require './UndoRedoButtons'
ZoomButtons = require './ZoomButtons'


ColorPickers = React.createClass
  displayName: 'ColorPickers'
  render: ->
    {lc} = @props
    {div} = React.DOM
    (div {className: 'lc-color-pickers'},
      (ColorWell {lc, colorName: 'background', label: 'background'})
      (ColorWell {lc, colorName: 'primary', label: 'stroke'})
      (ColorWell {lc, colorName: 'secondary', label: 'fill'})
    )


Picker = React.createClass
  displayName: 'Picker'
  getInitialState: -> {selectedToolIndex: 0}
  render: ->
    {div} = React.DOM
    {toolNames, lc, imageURLPrefix} = @props
    (div {className: 'lc-picker-contents'},
      toolNames.map((name, ix) =>
        (toolButtons[name] \
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
      UndoRedoButtons({lc, imageURLPrefix}),
      ZoomButtons({lc})
      ClearButton({lc})
      ColorPickers({lc})
    )


module.exports = Picker