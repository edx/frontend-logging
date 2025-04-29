# frontend-logging

[![Build
Status](https://api.travis-ci.com/edx/frontend-logging.svg?branch=master)](https://travis-ci.com/edx/frontend-logging)
[![Codecov](https://img.shields.io/codecov/c/github/edx/frontend-logging)](https://codecov.io/gh/edx/frontend-logging)
[![license](https://img.shields.io/npm/l/@edx/frontend-logging.svg)](@edx/frontend-logging)

## Purpose

frontend-logging contains a shared interface for logging errors and events to Datadog.

When you use ``logError``, your errors will appear under browser logs for your Browser application.

You can also add your own custom metrics as an additional argument, or see the code to find other standard custom attributes.

General Logging service interface is defined in [frontend-platform](https://openedx.github.io/frontend-platform/module-Logging.LoggingService.html).

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

There are a number of variables you can set to configure RUM logging in Datadog. In our environment, these are probably set in `edx-internal`, in `frontends/[name of your frontend app]/[env]_config.yml`:

- `DATADOG_APPLICATION_ID`: Provided by Datadog during RUM configuration.
- `DATADOG_CLIENT_TOKEN`: Provided by Datadog during RUM configuration.
- `DATADOG_SITE`: Provided by Datadog during RUM configuration. Probably `datadoghq.com`.
- `DATADOG_SERVICE`: Provided by Datadog during RUM configuration. This will be the name of your frontend.
- `DATADOG_ENV`: Environment for the config. (i.e., `stg`, `prod`, `edge`)
- `DATADOG_SESSION_SAMPLE_RATE`: (**Optional**) How many sessions should we capture RUM data from. This has cost implictions, so if you don't have unique needs, copy the most common setting you see in prior art.
- `DATADOG_SESSION_REPLAY_SAMPLE_RATE`: (**Optional**) How many sessions should we capture for replay. This has cost implictions, so if you don't have unique needs, copy the most common setting you see in prior art.
- `DATADOG_LOGS_SESSION_SAMPLE_RATE`: (**Optional**) How many sessions should we capture logs from. This has cost implictions, so if you don't have unique needs, copy the most common setting you see in prior art.
- `DATADOG_PRIVACY_LEVEL`: (**Optional**) The privacy masking setting used for session replays. Defaults to masking all content. [For legal values, see Datadog's session privacy docs](https://docs.datadoghq.com/real_user_monitoring/session_replay/privacy_options).
- `DATADOG_ENABLE_PRIVACY_FOR_ACTION_NAME`: (**Optional**) Whether all action names should be masked with a placeholder value; used in conjunction with `DATADOG_PRIVACY_LEVEL`.
- `DATADOG_HAS_DEFAULT_ALLOWED_TRACING_URLS`: (**Optional**) Whether to configure Datadog RUM with default allowed tracing urls (i.e., *any* subdomain of edX.org). Note: assumes all services called by consuming frontend application allow the Datadog and trace request headers sent by the RUM SDK. For more granular control, it's recommended to extend the `getAllowedTracingUrls` class method to return a list of desired `allowedTracingUrls`.
- `DATADOG_TRACE_SAMPLE_RATE`: (**Optional**) Percentage of backend traces to keep when using `allowedTracingUrls`. Defaults to 20% to mitigate APM quotas when at least one `allowedTracingUrls` is configured. If no `allowedTracingUrls` exist, falls back to Datadog defaults.
- `DATADOG_TRACE_CONTEXT_INJECTION`: (**Optional**) Either `sampled` or `all`. Defaults `sampled` to prevent the browser SDK from injecting a sampling decision (instead making the decision on the server side based on the tracing library), when at least one `allowedTracingUrls` is configured. If no `allowedTracingUrls` exists, falls back to Datadog defaults.
