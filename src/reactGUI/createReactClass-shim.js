try
  createReactClass = require 'create-react-class'
catch
  createReactClass = window.createReactClass

# can fall back to normal React until 16.0
unless createReactClass?
  try
    React = require 'react'
    createReactClass = React.createClass
  catch
    createReactClass = window.React.createClass

unless createReactClass?
  throw "Can't find createReactClass"
  
module.exports = createReactClass
