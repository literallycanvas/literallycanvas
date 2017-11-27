React = require './React-shim'
DOM = require '../reactGUI/ReactDOMFactories-shim'
createReactClass = require '../reactGUI/createReactClass-shim'
createSetStateOnEventMixin = require './createSetStateOnEventMixin'
{classSet} = require '../core/util'

createZoomButtonComponent = (inOrOut) -> createReactClass
  displayName: if inOrOut == 'in' then 'ZoomInButton' else 'ZoomOutButton'

  getState: -> {
    isEnabled: switch
      when inOrOut == 'in' then @props.lc.scale < @props.lc.config.zoomMax
      when inOrOut == 'out' then  @props.lc.scale > @props.lc.config.zoomMin
  }
  getInitialState: -> @getState()
  mixins: [createSetStateOnEventMixin('zoom')]

  render: ->
    {div, img} = DOM
    {lc, imageURLPrefix} = @props
    title = if inOrOut == 'in' then 'Zoom in' else 'Zoom out'

    className = "lc-zoom-#{inOrOut} " + classSet
      'toolbar-button': true
      'thin-button': true
      'disabled': not @state.isEnabled
    onClick = switch
      when !@state.isEnabled then ->
      when inOrOut == 'in' then -> lc.zoom(lc.config.zoomStep)
      when inOrOut == 'out' then -> lc.zoom(-lc.config.zoomStep)
    src = "#{imageURLPrefix}/zoom-#{inOrOut}.png"
    style = {backgroundImage: "url(#{src})"}

    (div {className, onClick, title, style})


ZoomOutButton = React.createFactory createZoomButtonComponent('out')
ZoomInButton = React.createFactory createZoomButtonComponent('in')
ZoomButtons = createReactClass
  displayName: 'ZoomButtons'
  render: ->
    {div} = DOM
    (div {className: 'lc-zoom'}, ZoomOutButton(@props), ZoomInButton(@props))


module.exports = ZoomButtons