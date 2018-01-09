strings = {}

localize = (localStrings) ->
  strings = localStrings

_ = (string) ->
  translation = strings[string]
  return translation or string

module.exports = {
  localize: localize,
  _: _
}
