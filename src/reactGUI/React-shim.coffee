try
  React = require 'react'
catch
  React = window.React
unless React?
  throw "Can't find React"
module.exports = React
