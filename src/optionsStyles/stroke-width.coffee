createSetStateOnEventMixin = require '../reactGUI/createSetStateOnEventMixin'
{defineOptionsStyle} = require './optionsStyles'


defineOptionsStyle 'stroke-width', React.createClass
  displayName: 'StrokeWidths'
  getState: -> {strokeWidth: @props.lc.tool?.strokeWidth}
  getInitialState: -> @getState()
  mixins: [createSetStateOnEventMixin('toolChange')]

  render: ->
    {ul, li, svg, circle} = React.DOM
    strokeWidths = [1, 2, 5, 10, 20, 40]
    buttonSize = Math.max(strokeWidths...)

    getItem = (strokeWidth) =>

    (ul {className: 'lc-stroke-widths'},
      strokeWidths.map((strokeWidth, ix) =>
        className = React.addons.classSet
          'lc-stroke-width': true
          'selected': strokeWidth == @state.strokeWidth
        (li \
          {
            className,
            key: strokeWidth,
            onClick: =>
              @props.tool.strokeWidth = strokeWidth
              @setState @getState()
          },
          (svg \
            {
              width: buttonSize
              height: buttonSize
              viewPort: "0 0 #{buttonSize} #{buttonSize}"
              version: "1.1"
              xmlns: "http://www.w3.org/2000/svg"
            },
            (circle {cx: buttonSize/2, cy: buttonSize/2, r: strokeWidth/2})
          )
        )
      )
    )


module.exports = {}