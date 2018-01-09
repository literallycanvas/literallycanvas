try
  DOM = require 'react-dom-factories'
catch
  DOM = window.ReactDOMFactories

# can fall back to normal React until 16.0
unless DOM?
  try
    React = require 'react'
    DOM = React.DOM
  catch
    DOM = window.React.DOM

unless DOM?
  throw "Can't find DOM"

module.exports = DOM
