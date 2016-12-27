'use strict'
var Alexa = require('alexa-sdk')
var moment = require('moment')
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
  'LaunchRequest': function () {
    this.emit('GetCurrentTimer')
  },
  'CurrentTimerIntent': function () {
    this.emit('GetCurrentTimer')
  },
  'GetCurrentTimer': function () {
    var self = this

    // Make a request to the Toggl API
    toggl.get('time_entries/current', function(err, json) {
      // @todo Better error handling
      if(err) return console.error(err)
      // Create speech output
      var speechOutput = 'Timer ' + json.data.description + ' started ' + moment(json.data.start).fromNow()
      self.emit(':tellWithCard', speechOutput, self.t('SKILL_NAME'), json.data.description)
    })
  },
  'AMAZON.HelpIntent': function () {
    var speechOutput = this.t('HELP_MESSAGE')
    var reprompt = this.t('HELP_MESSAGE')
    this.emit(':ask', speechOutput, reprompt)
  },
  'AMAZON.CancelIntent': function () {
    this.emit(':tell', this.t('STOP_MESSAGE'))
  },
  'AMAZON.StopIntent': function () {
    this.emit(':tell', this.t('STOP_MESSAGE'))
  }
}