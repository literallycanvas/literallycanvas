React = require './React-shim'

module.exports = createSetStateOnEventMixin = (eventName) ->
  componentDidMount: ->
    @unsubscribe = @props.lc.on eventName, => @setState @getState()
  componentWillUnmount: -> @unsubscribe()
