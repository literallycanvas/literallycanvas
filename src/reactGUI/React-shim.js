/*
 * decaffeinate suggestions:
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
let React;
try {
  React = require('react');
} catch (error) {
  ({ React } = window);
}
if (React == null) {
  throw "Can't find React";
}
export default React;
