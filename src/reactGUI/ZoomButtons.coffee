React = require './React-shim'
createSetStateOnEventMixin = require './createSetStateOnEventMixin'

createZoomButtonComponent = (inOrOut) -> React.createClass
  displayName: if inOrOut == 'in' then 'ZoomInButton' else 'ZoomOutButton'

  getState: -> {
    isEnabled: switch
      when inOrOut == 'in' then @props.lc.scale < 4.0
      when inOrOut == 'out' then  @props.lc.scale > 0.6
  }
  getInitialState: -> @getState()
  mixins: [createSetStateOnEventMixin('zoom')]

  render: ->
    {div, img} = React.DOM
    {lc, imageURLPrefix} = @props
    title = if inOrOut == 'in' then 'Zoom in' else 'Zoom out'

    className = "lc-zoom-#{inOrOut} " + React.addons.classSet
      'toolbar-button': true
      'thin-button': true
      'disabled': not @state.isEnabled
    onClick = switch
      when !@state.isEnabled then ->
      when inOrOut == 'in' then -> lc.zoom(0.2)
      when inOrOut == 'out' then -> lc.zoom(-0.2)

    (div {className, onClick, title},
      (img {src: "#{imageURLPrefix}/zoom-#{inOrOut}.png"})
    )


ZoomOutButton = createZoomButtonComponent('out')
ZoomInButton = createZoomButtonComponent('in')
ZoomButtons = React.createClass
  displayName: 'ZoomButtons'
  render: ->
    {div} = React.DOM
    (div {className: 'lc-zoom'}, ZoomOutButton(@props), ZoomInButton(@props))


module.exports = ZoomButtons