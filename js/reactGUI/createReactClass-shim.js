var React, createReactClass;

try {
  createReactClass = require('create-react-class');
} catch (error) {
  createReactClass = window.createReactClass;
}

if (createReactClass == null) {
  try {
    React = require('react');
    createReactClass = React.createClass;
  } catch (error) {
    createReactClass = window.React.createClass;
  }
}

if (createReactClass == null) {
  throw "Can't find createReactClass";
}

module.exports = createReactClass;
