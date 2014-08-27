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
    {div, ul, li, img} = React.DOM
    toggleIsDashed = =>
      @props.tool.isDashed = !@props.tool.isDashed
      @setState @getState()
    dashButtonClass = React.addons.classSet
      'basic-button square-button': true
      'selected': @state.isDashed
    (div {},
      (ul {className: 'button-row', style: {float: 'left', marginRight: 20}},
        (li {},
          (div {className: dashButtonClass, onClick: toggleIsDashed},
            (img {src: "#{@props.imageURLPrefix}/dashed-line.png"})
          )
        )
      ),
      (StrokeWidthPicker {tool: @props.tool, lc: @props.lc})
    )

module.exports = {}