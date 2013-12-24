window.LC = window.LC ? {}


slice = Array.prototype.slice

LC.util =
  last: (array, n = null) ->
    if n
      return slice.call(array, Math.max(array.length - n, 0))
    else
      return array[array.length - 1]
