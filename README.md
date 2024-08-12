# frontend-logging

[![Build
Status](https://api.travis-ci.com/edx/frontend-logging.svg?branch=master)](https://travis-ci.com/edx/frontend-logging)
[![Codecov](https://img.shields.io/codecov/c/github/edx/frontend-logging)](https://codecov.io/gh/edx/frontend-logging)
[![license](https://img.shields.io/npm/l/@edx/frontend-logging.svg)](@edx/frontend-logging)

## Purpose

frontend-logging contains a shared interface for logging errors and events to Datadog.

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

## DatadogLoggingService

The DatadogLoggingService is a concrete implementation of the logging service interface that sends messages to Datadog that can be seen in Datadog RUM and Datadog browser logs. When in development mode, all messages will instead be sent to the console.

When you configure a Datadog logging implementation, you'll set a number of variables used by the DatadogLoggingService. Most (eg. `DATADOG_APPLICATION_ID`, `DATADOG_SESSION_SAMPLE_RATE`) are either supplied to you by Datadog when you set up a RUM application, or are options about how much data we should be saving. Optional variables include:

* `DATADOG_PRIVACY_LEVEL`: If you want a privacy level for saved sessions that is other than the Datadog default of `mask-user-input`, set this variable.

When you use ``logError``, your errors will appear under broswer logs for your Browser application.

You can also add your own custom metrics as an additional argument, or see the code to find other standard custom attributes.

General Logging service interface is defined in [frontend-platform](https://openedx.github.io/frontend-platform/module-Logging.LoggingService.html).