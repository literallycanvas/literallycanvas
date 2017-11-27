DOM = require '../reactGUI/ReactDOMFactories-shim'
createReactClass = require '../reactGUI/createReactClass-shim'
createSetStateOnEventMixin = require './createSetStateOnEventMixin'
{optionsStyles} = require '../optionsStyles/optionsStyles'


Options = createReactClass
  displayName: 'Options'
  getState: -> {
    style: @props.lc.tool?.optionsStyle
    tool: @props.lc.tool
  }
  getInitialState: -> @getState()
  mixins: [createSetStateOnEventMixin('toolChange')]

  renderBody: ->
    # style can be null; cast it as a string
    style = "" + @state.style
    optionsStyles[style] && optionsStyles[style]({
      lc: @props.lc, tool: @state.tool, imageURLPrefix: @props.imageURLPrefix})

  render: ->
    {div} = DOM
    (div {className: 'lc-options horz-toolbar'},
      this.renderBody()
    )

module.exports = Options
