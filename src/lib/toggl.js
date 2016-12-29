'use strict'

var request = require('request')
var TOGGL_API_KEY = process.env.TOGGL_API_KEY

module.exports = {

  request: function(method, endpoint, body) {
    return new Promise(function(resolve, reject){
      request({
        method: method,
        uri: 'https://www.toggl.com/api/v8/' + endpoint,
        json: true,
        headers: {
          'Authorization': 'Basic ' + new Buffer(TOGGL_API_KEY + ':api_token').toString('base64')
        },
        body: body
      }, function(err, res, json) {
        if(err) return reject(err)
        if(res.statusCode == 403) return reject(Error('Request error 403 forbidden. Check \'TOGGL_API_KEY\' env is set'))
        if(res.statusCode != 200) return reject(Error('Request error ' + res.statusCode))

        resolve(json)
      })
    })
  },

  get: function(endpoint) {
    return this.request('GET', endpoint, null)
  },

  put: function(endpoint) {
    return this.request('PUT', endpoint, null)
  },

  post: function(endpoint, body) {
    return this.request('POST', endpoint, body)
  }

}