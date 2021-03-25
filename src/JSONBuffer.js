const Bitray = require('bitray')

const { Buffer } = require('buffer')

exports.stringify = function stringify (o) {
    if('undefined' == typeof o) return o
  
    if(o && o instanceof Bitray)
      return JSON.stringify(':binary:' + o.toFormat('binary'))
  
    if(o && o instanceof Buffer)
    return JSON.stringify(':binary:' + o.toString('binary'))

    if(o && o.toJSON)
      o =  o.toJSON()
  
    if(o && 'object' === typeof o) {
      var s = ''
      var array = Array.isArray(o)
      s = array ? '[' : '{'
      var first = true
  
      for(var k in o) {
        var ignore = 'function' == typeof o[k] || (!array && 'undefined' === typeof o[k])
        if(Object.hasOwnProperty.call(o, k) && !ignore) {
          if(!first)
            s += ','
          first = false
          if (array) {
            if(o[k] == undefined)
              s += 'null'
            else
              s += stringify(o[k])
          } else if (o[k] !== void(0)) {
            s += stringify(k) + ':' + stringify(o[k])
          }
        }
      }
  
      s += array ? ']' : '}'
  
      return s
    } else if ('string' === typeof o) {
      return JSON.stringify(/^:/.test(o) ? ':' + o : o)
    } else if ('undefined' === typeof o) {
      return 'null';
    } else
      return JSON.stringify(o)
  }
  
  exports.parse = function (s) {
    return JSON.parse(s, function (key, value) {
      if('string' === typeof value) {
        if(/^:binary:/.test(value))
          return Buffer.from(value.substring(8), 'binary')
        else
          return /^:/.test(value) ? value.substring(1) : value 
      }
      return value
    })
  }