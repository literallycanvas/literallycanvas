/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
let strings = {};

const localize = localStrings => strings = localStrings;

const _ = function(string) {
  const translation = strings[string];
  return translation || string;
};

export default {
  localize,
  _
};
