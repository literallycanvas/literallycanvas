React = require './React-shim'

module.exports = createSetStateOnEventMixin = (eventName) ->
  componentDidMount: ->
    @subscriber = @props.lc.on eventName, => @setState @getState()
  componentWillUnmount: ->
    @props.lc.removeEventListener(eventName, @subscriber)
