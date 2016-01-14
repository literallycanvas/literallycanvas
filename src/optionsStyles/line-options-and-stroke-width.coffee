React = require '../reactGUI/React-shim'
{defineOptionsStyle} = require './optionsStyles'
StrokeWidthPicker = React.createFactory require '../reactGUI/StrokeWidthPicker'
createSetStateOnEventMixin = require '../reactGUI/createSetStateOnEventMixin'
{classSet} = require '../core/util'

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

    dashButtonClass = classSet
      'square-toolbar-button': true
      'selected': @state.isDashed
    arrowButtonClass = classSet
      'square-toolbar-button': true
      'selected': @state.hasEndArrow
    style = {float: 'left', margin: 1}

    (div {},
      (div {className: dashButtonClass, onClick: toggleIsDashed, style},
        (img {src: "#{@props.imageURLPrefix}/dashed-line.png"})
      ),
      (div {className: arrowButtonClass, onClick: togglehasEndArrow, style},
        (img {src: "#{@props.imageURLPrefix}/line-with-arrow.png"})
      ),
      (StrokeWidthPicker {tool: @props.tool, lc: @props.lc})
    )

module.exports = {}