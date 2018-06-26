try
  ReactDOM = require 'react-dom'
catch
  ReactDOM = window.ReactDOM

# can fall back to normal React until 0.15
unless ReactDOM?
  try
    ReactDOM = require 'react'
  catch
    ReactDOM = window.React

unless ReactDOM?
  throw "Can't find ReactDOM"
  
module.exports = ReactDOM
