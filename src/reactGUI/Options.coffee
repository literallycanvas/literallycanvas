React = require './React-shim'
createSetStateOnEventMixin = require './createSetStateOnEventMixin'
{optionsStyles} = require '../optionsStyles/optionsStyles'


Options = React.createClass
  displayName: 'Options'
  getState: -> {
    style: @props.lc.tool?.optionsStyle
    tool: @props.lc.tool
  }
  getInitialState: -> @getState()
  mixins: [createSetStateOnEventMixin('toolChange')]

  render: ->
    # style can be null; cast it as a string
    style = "" + @state.style
    optionsStyles[style]({
      lc: @props.lc, tool: @state.tool, imageURLPrefix: @props.imageURLPrefix})


module.exports = Options