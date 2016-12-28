'use strict'

var request = require('request')
var TOGGL_API_KEY = process.env.TOGGL_API_KEY

module.exports = {

  request: function(method, endpoint, body, callback) {
    return request({
      method: method,
      uri: 'https://www.toggl.com/api/v8/' + endpoint,
      json: true,
      headers: {
        'Authorization': 'Basic ' + new Buffer(TOGGL_API_KEY + ':api_token').toString('base64')
      },
      body: body
    }, function(err, res, json) {
      if(err) return callback(err)
      if(res.statusCode == 403) return callback(Error('Request error 403 forbidden. Check \'TOGGL_API_KEY\' env is set'))
      if(res.statusCode != 200) return callback(Error('Request error ' + res.statusCode))

      callback(null, json)
    })
  },

  get: function(endpoint, callback) {
    return this.request('GET', endpoint, null, callback)
  },

  put: function(endpoint, callback) {
    return this.request('PUT', endpoint, null, callback)
  },

  post: function(endpoint, body, callback) {
    return this.request('POST', endpoint, body, callback)
  }

}