{defineOptionsStyle} = require './optionsStyles'
StrokeWidthPicker = require '../reactGUI/StrokeWidthPicker'
createSetStateOnEventMixin = require '../reactGUI/createSetStateOnEventMixin'

defineOptionsStyle 'line-options-and-stroke-width', React.createClass
  displayName: 'LineOptionsAndStrokeWidth'
  getState: ->
    {strokeWidth: @props.tool.strokeWidth, isDashed: @props.tool.isDashed}
  getInitialState: -> @getState()
  mixins: [createSetStateOnEventMixin('toolChange')]

  render: ->
    {div, input, label, br} = React.DOM
    updateIsDashed = (e) =>
      @props.tool.isDashed = !@props.tool.isDashed
      @setState @getState()
    (div {},
      (div {className: 'quick-ui', style: {float: 'left'}},
        (label {},
          (input {
            type: 'checkbox', onChange: updateIsDashed,
            checked: @state.isDashed
          }),
          "Dashed line"),
      ),
      (StrokeWidthPicker {tool: @props.tool, lc: @props.lc})
    )

module.exports = {}