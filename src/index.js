'use strict'
require('dotenv').config()
var Alexa = require('alexa-sdk')
var moment = require('moment')
var humanizeDuration = require('humanize-duration')
var url = require('url')
var _ = require('lodash')
var async = require('async')
var toSentence = require('array-to-sentence')
var toggl = require('./lib/toggl')
var APP_ID = process.env.APP_ID

exports.lang = {
  'en-GB': {
    'translation': {
      'SKILL_NAME': 'Toggl',
      'HELP_MESSAGE': 'You can say toggl, or, you can say exit... What can I help you with?',
      'HELP_REPROMPT': 'What can I help you with?',
      'STOP_MESSAGE': 'Goodbye!',
      'NO_TIMER': 'No timer running'
    }
  }
}

// moment().calender() only show day, not time
moment.updateLocale('en', {
  calendar: {
    sameDay: '[Today]',
    nextDay: '[Tomorrow]',
    nextWeek: 'dddd',
    lastDay: '[Yesterday]',
    lastWeek: '[Last] dddd',
    sameElse: 'DD/MM/YYYY'
  }
})

var humanise = function(duration) {
  return humanizeDuration(duration * 1000, {
    delimiter: ' ', largest: 2
  })
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
  'NoTimer': function() {
    var speechOutput = 'No timer running'
    this.emit(':tellWithCard', speechOutput, this.t('SKILL_NAME'), speechOutput)
  },
  'Error': function(err) {
      console.error(err)
      this.emit(':tellWithCard', 'There was an error', this.t('SKILL_NAME'), 'There was an error')
  },
  'GetCurrentTimer': function () {
    var self = this
    var duration

    // Get the current time entry from the API
    toggl.get('time_entries/current')
    .then(function(json) {
      // If there is no timer running then emit NoTimer intent
      if( ! json.data) {
        self.emit('NoTimer')
        return Promise.reject()
      }

      // Convert the duration to a readable string
      duration = humanise(moment().unix() + json.data.duration)

      // If the pid is undefined then just say so
      if(json.data.pid === undefined) {
        return Promise.resolve({
          data: {
            name: 'undefined'
          }
        })
      }
      // Else get the project name from the API and return its promise
      else {
        return toggl.get('projects/' + json.data.pid)
      }
    })
    .then(function(json) {
      var speechOutput = duration + ' on ' + json.data.name
      self.emit(':tellWithCard', speechOutput, self.t('SKILL_NAME'), speechOutput)
    })
    .catch(function(err) {
      console.error(err)
      self.emit('Error')
    })
  },
  'GetTimersRange': function(intent, session, response) {
    var self = this

    // Date could be any of the following:
    // https://developer.amazon.com/public/solutions/alexa/alexa-skills-kit/docs/built-in-intent-ref/slot-type-reference#date
    var date = this.event.request.intent.slots.Date.value

    var range = {
      start_date: moment(date).format(),
      end_date: moment(date).add(1, 'days').format()
    }

    var req = url.format({
      query: range,
      pathname: 'time_entries'
    })

    // Make a request to the Toggl API
    toggl.get(req)
    .then(function(json) {

      // Group entries by project id
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
          // Else entry is still running
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

      return new Promise(function(resolve, reject) {
        // Loop through each project
        async.each(projects, function(project, callback) {
          if(project.pid === undefined){
            speech.push(humanise(project.duration) + ' on undefined')
            return callback()
          }

          // Get the project name from the API
          // @todo A get request in a loop... May want to find a better method...
          toggl.get('projects/' + project.pid)
          .then(function(json) {
            speech.push(humanise(project.duration) + ' on ' + json.data.name)
            callback()
          })
          .catch(function(err) {
            return callback(err)
          })
        }, function(err) {
          if(err) return reject(err)
          return resolve(speech)
        })
      })
    })
    .then(function(speech) {
      var speechOutput = moment(date).calendar() + ', you spent ' + toSentence(speech)
      self.emit(':tellWithCard', speechOutput, self.t('SKILL_NAME'), speechOutput)
    })
    .catch(function(err) {
      console.error(err)
      self.emit('Error')
    })
  },
  'StopCurrentTimer': function () {
    var self = this

    // Make a request to the Toggl API
    toggl.get('time_entries/current')
    .then(function(json) {
      // If there is no timer running then emit NoTimer intent
      if( ! json.data) {
        self.emit('NoTimer')
        return Promise.reject()
      }
      // Else stop the timer with the API and return its promise
      return toggl.put('time_entries/' + json.data.id + '/stop')
    })
    .then(function(json) {
      // @todo For consistency, should we include the project name rather than the description?
      var speechOutput = json.data.description + ' was stopped after ' + humanise(json.data.duration)
      self.emit(':tellWithCard', speechOutput, self.t('SKILL_NAME'), speechOutput)
    })
    .catch(function(err) {
      console.error(err)
      self.emit('Error')
    })
  },
  'StartTimer': function () {
    var self = this

    // Make a request to the Toggl API
    toggl.post('time_entries/start', {
      time_entry: {
        description: 'Initiated with Alexa Skill',
        created_with: 'Alexa'
      }
    })
    .then(function(json) {
      // If there is no timer running then there must have been an error
      if( ! json.data) {
        return Promise.reject()
      }
      var speechOutput = 'Timer started'
      self.emit(':tellWithCard', speechOutput, self.t('SKILL_NAME'), speechOutput)
    })
    .catch(function(err) {
      console.error(err)
      self.emit('Error')
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