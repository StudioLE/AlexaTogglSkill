'use strict'

var https = require('https')
var TOGGL_API_KEY = process.env.TOGGL_API_KEY

module.exports = {
  get: function(endpoint, callback) {
    var req = https.get({
      hostname: 'www.toggl.com',
      path: '/api/v8/' + endpoint,
      method: 'GET',
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Authorization': 'Basic ' + new Buffer(TOGGL_API_KEY + ':api_token').toString('base64')
      }   
    }, function(res) {
      var body = ''
      res.on('data', function(chunk) {
        body += chunk
      })
      res.on('end', function() {
        if(res.statusCode == 403) callback(Error('Request error 403 forbidden. Check \'TOGGL_API_KEY\' env is set'))

        var json = JSON.parse(body)
        callback(null, json)
      })
    })
    req.on('error', function(err) {
      callback(err)
    })
    req.end()
  }
}