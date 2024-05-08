# frontend-build

[![Build
Status](https://api.travis-ci.com/edx/frontend-build.svg?branch=master)](https://travis-ci.com/edx/frontend-build)
[![Codecov](https://img.shields.io/codecov/c/github/edx/frontend-build)](https://codecov.io/gh/edx/frontend-build)
[![license](https://img.shields.io/npm/l/@openedx/frontend-build.svg)](https://github.com/edx-unsupported/frontend-base/blob/master/LICENSE)

## Purpose

frontend-logging contains a shared interface for logging errors and event to Datadog.

## Usage

To install frontend-logging into your project::

    npm i --save @edx/frontend-logging

### To configure the logging service

In the `env.config.js` file, add the following

    import { DatadogLoggingService } from '@edx/frontend-logging';

    const config = {
      loggingService: DatadogLoggingService,
    };
    
    export default config;

## NewRelicLoggingService

The DatadogLoggingService is a concrete implementation of the logging service interface that sends messages to Datadog that can be seen in Datadog RUM and Datadog browser logs. When in development mode, all messages will instead be sent to the console.

When you use ``logError``, your errors will appear under broswe logs for your Browser application.

You can also add your own custom metrics as an additional argument, or see the code to find other standard custom attributes.
