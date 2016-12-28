'use strict'

var expect = require('chai').expect
var index = require('../index')

var context = require('aws-lambda-mock-context')
var ctx = context()

var intentTestJSON = require('../../testAssets/CurrentTimerIntent')

describe('CurrentTimerIntent', function() {
  var speechResponse = null
  var speechError = null

  before(function(done) {
    var res = index.handler(intentTestJSON, ctx)
    ctx.Promise
      .then(function(resp) {
        speechResponse = resp
        done()
      })
      .catch(function(err) {
        speechError = err
        done()
      })
  })

  describe('response is structurally correct for Alexa Speech Services', function() {
    it('should not have errored',function() {
      expect(speechError).to.be.null
    })

    it('should have a version', function() {
      expect(speechResponse.version).not.to.be.null
    })

    it('should have a speechlet response', function() {
      expect(speechResponse.response).not.to.be.null
    })

    it('should have a spoken response', function() {
      expect(speechResponse.response.outputSpeech).not.to.be.null
    })

    it('should end the alexa session', function() {
      expect(speechResponse.response.shouldEndSession).not.to.be.null
      expect(speechResponse.response.shouldEndSession).to.be.true
    })
  })

  after(function(){
    // console.log('Output: ', speechResponse)
  })
})