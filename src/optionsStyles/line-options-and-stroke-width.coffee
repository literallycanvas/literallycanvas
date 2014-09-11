{defineOptionsStyle} = require './optionsStyles'
StrokeWidthPicker = require '../reactGUI/StrokeWidthPicker'
createSetStateOnEventMixin = require '../reactGUI/createSetStateOnEventMixin'

defineOptionsStyle 'line-options-and-stroke-width', React.createClass
  displayName: 'LineOptionsAndStrokeWidth'
  getState: -> {
    strokeWidth: @props.tool.strokeWidth,
    isDashed: @props.tool.isDashed,
    hasEndArrow: @props.tool.hasEndArrow,
  }
  getInitialState: -> @getState()
  mixins: [createSetStateOnEventMixin('toolChange')]

  render: ->
    {div, ul, li, img} = React.DOM
    toggleIsDashed = =>
      @props.tool.isDashed = !@props.tool.isDashed
      @setState @getState()
    togglehasEndArrow = =>
      @props.tool.hasEndArrow = !@props.tool.hasEndArrow
      @setState @getState()

    dashButtonClass = React.addons.classSet
      'basic-button square-button': true
      'selected': @state.isDashed
    arrowButtonClass = React.addons.classSet
      'basic-button square-button': true
      'selected': @state.hasEndArrow

    (div {},
      (ul {className: 'button-row', style: {float: 'left', marginRight: 20}},
        (li {},
          (div {className: dashButtonClass, onClick: toggleIsDashed},
            (img {src: "#{@props.imageURLPrefix}/dashed-line.png"})
          )
        ),
        (li {},
          (div {className: arrowButtonClass, onClick: togglehasEndArrow},
            (img {src: "#{@props.imageURLPrefix}/line-with-arrow.png"})
          )
        )
      ),
      (StrokeWidthPicker {tool: @props.tool, lc: @props.lc})
    )

module.exports = {}