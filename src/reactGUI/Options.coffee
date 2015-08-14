React = require './React-shim'
createSetStateOnEventMixin = require './createSetStateOnEventMixin'
{optionsStyles} = require '../optionsStyles/optionsStyles'
ColorWell = require './ColorWell'

{_} = require '../core/localization'

ColorPickers = React.createClass
  displayName: 'ColorPickers'
  render: ->
    {lc} = @props
    {div} = React.DOM
    (div {
        className: 'lc-color-pickers',
        style: {
          float: 'left', marginRight: '0.5em'
        }
      },
      (ColorWell {lc, colorName: 'background', label: _('bg')})
      (ColorWell {lc, colorName: 'primary', label: _('stroke')})
      (ColorWell {lc, colorName: 'secondary', label: _('fill')}),
    )


Options = React.createClass
  displayName: 'Options'
  getState: -> {
    style: @props.lc.tool?.optionsStyle
    tool: @props.lc.tool
  }
  getInitialState: -> @getState()
  mixins: [createSetStateOnEventMixin('toolChange')]

  render: ->
    {div} = React.DOM
    # style can be null; cast it as a string
    style = "" + @state.style
    (div {}, 
      ColorPickers({lc: @props.lc})
      optionsStyles[style]({
        lc: @props.lc, tool: @state.tool, imageURLPrefix: @props.imageURLPrefix})
    )


module.exports = Options