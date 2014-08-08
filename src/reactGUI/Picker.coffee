React = require './React-shim'

ClearButton = require './ClearButton'
ColorWell = require './ColorWell'
UndoRedoButtons = require './UndoRedoButtons'
ZoomButtons = require './ZoomButtons'

{_} = require '../core/localization'

ColorPickers = React.createClass
  displayName: 'ColorPickers'
  render: ->
    {lc} = @props
    {div} = React.DOM
    (div {className: 'lc-color-pickers'},
      (ColorWell {lc, colorName: 'background', label: _('background')})
      (ColorWell {lc, colorName: 'primary', label: _('stroke')})
      (ColorWell {lc, colorName: 'secondary', label: _('fill')})
    )


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
      ColorPickers({lc})
    )


module.exports = Picker
