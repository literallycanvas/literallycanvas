React = require './React-shim'

ClearButton = React.createFactory require './ClearButton'
UndoRedoButtons = React.createFactory require './UndoRedoButtons'
ZoomButtons = React.createFactory require './ZoomButtons'

{_} = require '../core/localization'
ColorWell = React.createFactory require './ColorWell'

ColorPickers = React.createFactory React.createClass
  displayName: 'ColorPickers'
  render: ->
    {lc} = @props
    {div} = React.DOM
    (div {className: 'lc-color-pickers'},
      (ColorWell {lc, colorName: 'primary', label: _('stroke')})
      (ColorWell {lc, colorName: 'secondary', label: _('fill')}),
      (ColorWell {lc, colorName: 'background', label: _('bg')})
    )


Picker = React.createClass
  displayName: 'Picker'
  getInitialState: -> {selectedToolIndex: 0}
  renderBody: ->
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
      (div style: {
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
        },
        ColorPickers({lc: @props.lc})
        UndoRedoButtons({lc, imageURLPrefix})
        ZoomButtons({lc, imageURLPrefix})
        ClearButton({lc})
      )
    )
  render: ->
    {div} = React.DOM
    (div {className: 'lc-picker'},
      this.renderBody()
    )


module.exports = Picker
