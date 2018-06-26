/*
 * decaffeinate suggestions:
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
let createReactClass;
try {
  createReactClass = require('create-react-class');
} catch (error) {
  ({ createReactClass } = window);
}

// can fall back to normal React until 16.0
if (createReactClass == null) {
  let React;
  try {
    React = require('react');
    createReactClass = React.createClass;
  } catch (error1) {
    createReactClass = window.React.createClass;
  }
}

if (createReactClass == null) {
  throw "Can't find createReactClass";
}
  
export default createReactClass;
