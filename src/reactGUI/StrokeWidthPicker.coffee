React = require './React-shim'
createSetStateOnEventMixin = require '../reactGUI/createSetStateOnEventMixin'
{classSet} = require '../core/util'


module.exports = React.createClass
  displayName: 'StrokeWidthPicker'

  getState: (tool=@props.tool) -> {strokeWidth: tool.strokeWidth}
  getInitialState: -> @getState()
  mixins: [createSetStateOnEventMixin('toolDidUpdateOptions')]

  componentWillReceiveProps: (props) -> @setState @getState(props.tool)

  render: ->
    {ul, li, svg, circle, div} = React.DOM
    strokeWidths = @props.lc.opts.strokeWidths

    (div {},
      strokeWidths.map((strokeWidth, ix) =>
        buttonClassName = classSet
          'square-toolbar-button': true
          'selected': strokeWidth == @state.strokeWidth
        buttonSize = 28
        (div {
            key: strokeWidth
          },
          (div \
            {
              className: buttonClassName,
              onClick: => @props.lc.trigger 'setStrokeWidth', strokeWidth
            },
            (svg \
              {
                width: buttonSize-2
                height: buttonSize-2
                viewPort: "0 0 #{strokeWidth} #{strokeWidth}"
                version: "1.1"
                xmlns: "http://www.w3.org/2000/svg"
              },
              (circle {
                cx: Math.ceil(buttonSize/2-1),
                cy: Math.ceil(buttonSize/2-1),
                r: strokeWidth/2
              })
            )
          )
        )
      )
    )
