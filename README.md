# An Alexa skill to interact with Toggl

[![Build Status](https://travis-ci.org/StudioLE/AlexaTogglSkill.svg?branch=master)](https://travis-ci.org/StudioLE/AlexaTogglSkill)

## Install

1.  Zip the contents of the `src` directory and upload to [AWS Lambda](console.aws.amazon.com/lambda/home).
2.  Set the `TOGGL_API_KEY` env variable to your API key.
3.  Create a new Alexa Skill in the [Amazon Developer Console](https://developer.amazon.com/edw/home.html#/skill/create/) using the intent schema and sample utterances from the `speechAssets` directory.

For a more detailed walkthrough, checkout the skill sample
[README.md](https://github.com/alexa/skill-sample-nodejs-fact/blob/master/README.md).

## Usage

Once you've enabled testing on the skill in the developer console it should be immediately available through your Amazon Echo.

The following utterances should now work:
```
Alexa, ask Toggl for current timer
Alexa, ask Toggl how I spent my time today
```

## Roadmap / Future Features

This is very much alpha software at present, it's currently only configured to work with `en-GB` language, but it will only take a couple more lines of code to get it working in `en-US` and then `de-DE`. 

Next step will be adding POST methods so you can start and stop timers.