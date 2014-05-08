try
  React = require 'React/addons'
catch
  React = window.React
unless React?.addons?
  throw "Can't find React (you need the version with addons)"
module.exports = React