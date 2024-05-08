# frontend-build

[![Build
Status](https://api.travis-ci.com/edx/frontend-logging.svg?branch=master)](https://travis-ci.com/edx/frontend-logging)
[![Codecov](https://img.shields.io/codecov/c/github/edx/frontend-logging)](https://codecov.io/gh/edx/frontend-logging)
[![license](https://img.shields.io/npm/l/@edx/frontend-logging.svg)](@edx/frontend-logging)

## Purpose

frontend-logging contains a shared interface for logging errors and event to Datadog.

## Usage

To install frontend-logging into your project::

    npm i --save @edx/frontend-logging

### To configure the logging service

In the `env.config.js` file, add the following

    import DatadogLoggingService from '@edx/frontend-logging';

    const config = {
      loggingService: DatadogLoggingService,
    };
    
    export default config;

## NewRelicLoggingService

The DatadogLoggingService is a concrete implementation of the logging service interface that sends messages to Datadog that can be seen in Datadog RUM and Datadog browser logs. When in development mode, all messages will instead be sent to the console.

When you use ``logError``, your errors will appear under broswe logs for your Browser application.

You can also add your own custom metrics as an additional argument, or see the code to find other standard custom attributes.
