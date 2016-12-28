'use strict'
var Alexa = require('alexa-sdk')
var moment = require('moment')
var url = require('url')
var _ = require('lodash')
var async = require('async')
var toSentence = require('array-to-sentence')
var toggl = require('./lib/toggl')
// @todo Replace with your app ID (OPTIONAL)
var APP_ID = undefined

exports.lang = {
  'en-GB': {
    'translation': {
      'SKILL_NAME' : 'Toggl',
      'HELP_MESSAGE' : 'You can say toggl, or, you can say exit... What can I help you with?',
      'HELP_REPROMPT' : 'What can I help you with?',
      'STOP_MESSAGE' : 'Goodbye!'
    }
  }
}

exports.handler = function(event, context, callback) {
  var alexa = Alexa.handler(event, context)
  alexa.APP_ID = APP_ID
  // To enable string internationalization (i18n) features, set a resources object.
  alexa.resources = exports.lang
  alexa.registerHandlers(handlers)
  alexa.execute()
}

var handlers = {
  'LaunchRequest': function() {
    this.emit('GetCurrentTimer')
  },
  'CurrentTimerIntent': function() {
    this.emit('GetCurrentTimer')
  },
  'GetCurrentTimer': function () {
    var self = this

    // Make a request to the Toggl API
    toggl.get('time_entries/current', function(err, json) {
      // @todo Better error handling
      if(err) return console.error(err)
      // Create speech output
      var speechOutput = ''
      if( ! json.data) {
        speechOutput = 'No timer running'
      }
      else {
        speechOutput = 'Timer ' + json.data.description + ' started ' + moment(json.data.start).fromNow()
      }
      self.emit(':tellWithCard', speechOutput, self.t('SKILL_NAME'), speechOutput)
    })
  },
  'GetTimersRange': function() {
    var self = this

    var range = {
      start_date: moment().subtract(1, 'days').format(),
      end_date: moment().format()
    }

    var req = url.format({
      query: range,
      pathname: 'time_entries'
    })

    // Make a request to the Toggl API
    toggl.get(req, function(err, json) {
      // @todo Better error handling
      if(err) return console.error(err)

      // Group entried by project id
      var projects = _.groupBy(json, 'pid')

      // Loop through each project
      projects = _.map(projects, function(entries) {
        var total = 0
        var pid
        // Loop through each entry
        _.each(entries, function(entry) {
          pid = entry.pid
          if(entry.stop) {
            // Add the duration to the total
            total += entry.duration
          }
          // Else still running
          else {
            // Figure out the time elapsed since it started
            // Add the duration to the total
            total += moment().unix() + entry.duration
          }
        })
        return {
          pid: pid,
          duration: total
        }
      })
      var speech = []
      async.each(projects, function(project, callback) {
        // Make a request to the Toggl API
        // @todo A get request in a loop... May want to convert to promises instead...
        toggl.get('projects/' + project.pid, function(err, json) {
          if(err) return callback(err)
          speech.push(json.data.name + ' for ' + moment.duration(project.duration, 'seconds').humanize())
          callback()
        })
      }, function(err) {
        // @todo Better error handling
        if(err) return console.error(err)

        // Create speech output
        var speechOutput = 'You have been working on ' + toSentence(speech) + ' in the last 24 hours.'

        self.emit(':tellWithCard', speechOutput, self.t('SKILL_NAME'), speechOutput)
      })
    })
  },
  'AMAZON.HelpIntent': function() {
    var speechOutput = this.t('HELP_MESSAGE')
    var reprompt = this.t('HELP_MESSAGE')
    this.emit(':ask', speechOutput, reprompt)
  },
  'AMAZON.CancelIntent': function() {
    this.emit(':tell', this.t('STOP_MESSAGE'))
  },
  'AMAZON.StopIntent': function() {
    this.emit(':tell', this.t('STOP_MESSAGE'))
  }
}