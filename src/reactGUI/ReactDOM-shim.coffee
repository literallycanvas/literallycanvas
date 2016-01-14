try
  ReactDOM = require 'react-dom'
catch
  ReactDOM = window.ReactDOM
unless ReactDOM?
  throw "Can't find ReactDOM"
module.exports = ReactDOM