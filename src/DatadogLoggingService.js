import { datadogRum } from '@datadog/browser-rum';
import { datadogLogs } from '@datadog/browser-logs';
import { NewRelicLoggingService } from '@edx/frontend-platform/logging';

const browserLogNameIgnoredError = 'IGNORED_ERROR';

function sendBrowserLog(actionName, message, customAttributes) {
  if (process.env.NODE_ENV === 'development') {
    console.log(actionName, message, customAttributes); // eslint-disable-line
  }
  datadogLogs.logger.info(`${actionName}: ${message}`, customAttributes);
}

function sendError(error, customAttributes) {
  if (process.env.NODE_ENV === 'development') {
    console.error(error, customAttributes); // eslint-disable-line
  }
  // https://docs.datadoghq.com/logs/log_collection/javascript/#error-tracking
  datadogLogs.logger.error(error, customAttributes);
}

class DatadogLoggingService extends NewRelicLoggingService {
  constructor(options) {
    super(options);
    const config = options ? options.config : undefined;
    this.ignoredErrorRegexes = config ? config.IGNORED_ERROR_REGEX : undefined;
    this.initialize();
    this.addRUMFeatureFlags();
  }

  // to read more about the use cases for beforeSend, refer to the documentation:
  // https://docs.datadoghq.com/real_user_monitoring/guide/enrich-and-control-rum-data/?tab=event#event-and-context-structure
  // (e.g., discarding frontend errors matching the optional `IGNORED_ERROR_REGEX` configuration,
  // currently implemented in `logError` below).
  beforeSend() {
    // common/shared logic across all MFEs
    return true;
  }

  getConnectedRUMTracesOptions() {
    const allowedTracingUrls = [];
    try {
      allowedTracingUrls.push(...this.getAllowedTracingUrls());
    } catch (error) {
      sendError(error);
    }
    const connectedRumTracesOptions = {};
    if (allowedTracingUrls.length > 0) {
      Object.assign(connectedRumTracesOptions, {
        allowedTracingUrls,
        traceSampleRate: parseInt(process.env.DATADOG_TRACE_SAMPLE_RATE || 20, 10),
        traceContextInjection: process.env.DATADOG_TRACE_CONTEXT_INJECTION || 'sampled',
      });
    }
    return connectedRumTracesOptions;
  }

  addRUMFeatureFlags() {
    if (!process.env.FEATURE_FLAGS) {
      return;
    }
    try {
      const featureFlagsToEvaluate = JSON.parse(process.env.FEATURE_FLAGS);
      Object.entries(featureFlagsToEvaluate).forEach(([key, value]) => {
        datadogRum.addFeatureFlagEvaluation(key, value);
      });
    } catch (error) {
      sendError(`Failed to send feature flags data for evaluation due to this error: ${error}`, {});
    }
  }

  addVersionMetadata() {
    try {
      // Add React version
      let reactVersion = '--';
      try {
        // eslint-disable-next-line import/no-extraneous-dependencies
        const React = require('react');
        reactVersion = React.version;
      } catch (error) {
        // React not available
      }

      // Add Node version
      const nodeVersion = process.version || '--';

      // Set versions as custom attributes for both RUM and Logs
      this.setCustomAttribute('react.version', reactVersion);
      this.setCustomAttribute('node.version', nodeVersion);
    } catch (error) {
      sendError(`Failed to add version metadata due to this error: ${error}`, {});
    }
  }

  initialize() {
    const requiredDatadogConfig = [
      process.env.DATADOG_APPLICATION_ID,
      process.env.DATADOG_CLIENT_TOKEN,
    ];
    const hasRequiredDatadogConfig = requiredDatadogConfig.every(value => !!value);

    // Do not attempt to initialize Datadog if required config settings are not supplied.
    if (!hasRequiredDatadogConfig) {
      return;
    }

    const datadogVersion = process.env.DATADOG_VERSION || process.env.APP_VERSION || '1.0.0';
    const commonInitOptions = {
      clientToken: process.env.DATADOG_CLIENT_TOKEN,
      site: process.env.DATADOG_SITE || '',
      env: process.env.DATADOG_ENV || '',
      service: process.env.DATADOG_SERVICE || '',
      version: datadogVersion,
      trackSessionAcrossSubdomains: true,
      usePartitionedCrossSiteSessionCookie: true,
    };

    datadogRum.init({
      ...commonInitOptions,
      applicationId: process.env.DATADOG_APPLICATION_ID,
      beforeSend: this.beforeSend,
      sessionSampleRate: parseInt(process.env.DATADOG_SESSION_SAMPLE_RATE || 0, 10),
      sessionReplaySampleRate: parseInt(process.env.DATADOG_SESSION_REPLAY_SAMPLE_RATE || 0, 10),
      trackUserInteractions: true,
      trackResources: true,
      trackLongTasks: true,
      defaultPrivacyLevel: process.env.DATADOG_PRIVACY_LEVEL || 'mask',
      enablePrivacyForActionName: process.env.DATADOG_ENABLE_PRIVACY_FOR_ACTION_NAME || true,
      ...this.getConnectedRUMTracesOptions(),
    });

    datadogLogs.init({
      ...commonInitOptions,
      forwardErrorsToLogs: true,
      sessionSampleRate: parseInt(process.env.DATADOG_LOGS_SESSION_SAMPLE_RATE || 0, 10),
    });

    // Add version metadata for React and Node
    this.addVersionMetadata();
  }

  logInfo(infoStringOrErrorObject, customAttributes = {}) {
    super.logInfo(infoStringOrErrorObject, customAttributes);
    let message = infoStringOrErrorObject;
    let customAttrs = { ...customAttributes };
    if (typeof infoStringOrErrorObject === 'object' && 'message' in infoStringOrErrorObject) {
      const infoCustomAttributes = infoStringOrErrorObject.customAttributes || {};
      customAttrs = { ...infoCustomAttributes, ...customAttributes };
      message = infoStringOrErrorObject.message;
    }
    datadogLogs.logger.info(message, customAttrs);
  }

  /**
   *
   *
   * @param {*} errorStringOrObject
   * @param {*} [customAttributes={}]
   * @memberof DatadogLoggingService
   */
  logError(errorStringOrObject, customAttributes = {}) {
    super.logError(errorStringOrObject, customAttributes);
    const errorCustomAttributes = errorStringOrObject.customAttributes || {};
    let allCustomAttributes = { ...errorCustomAttributes, ...customAttributes };
    if (Object.keys(allCustomAttributes).length === 0) {
      allCustomAttributes = undefined;
    }

    /*
      Separate the errors into ignored errors and other errors.
      Ignored errors are logged as it is.
      Other errors are logged via error API.
    */
    const errorMessage = errorStringOrObject.message || (typeof errorStringOrObject === 'string' ? errorStringOrObject : '');
    if (this.ignoredErrorRegexes && errorMessage.match(this.ignoredErrorRegexes)) {
      /* ignored error */
      sendBrowserLog(browserLogNameIgnoredError, errorMessage, allCustomAttributes);
    } else {
      /*  error! */
      sendError(errorStringOrObject, allCustomAttributes);
    }
  }

  /**
   * Sets a custom attribute that will be included with all subsequent log messages.
   *
   * @param {string} name
   * @param {string|number|null} value
   */
  setCustomAttribute(name, value) {
    super.setCustomAttribute(name, value);
    if (name === 'userId') {
      datadogLogs.setUserProperty('id', value);
      datadogRum.setUserProperty('id', value);
      return;
    }
    datadogLogs.setGlobalContextProperty(name, value);
    datadogRum.setGlobalContextProperty(name, value);
  }

  /**
   * Retrieves Datadog RUM's `allowedTracingUrls` initialization option.
   *
   * If the `DATADOG_HAS_DEFAULT_ALLOWED_TRACING_URLS` environment variable is
   * set, the default allowed tracing urls (i.e., any subdomain of edx.org) will
   * be configured. Otherwise, an empty array will be returned to disable tracing urls.
   *
   * @returns {Array<string | RegExp>} An array representing allowed tracing urls.
   */
  getAllowedTracingUrls() {
    if (process.env.DATADOG_HAS_DEFAULT_ALLOWED_TRACING_URLS) {
      // Return the default allowed tracing urls, if opted in.
      return [
        /^https:\/\/([a-zA-Z0-9-]+\.)+edx\.org(\/|$)/, // Matches any subdomain of edx.org
      ];
    }

    // Otherwise, return an empty array to disable tracing urls.
    return [];
  }
}

export default DatadogLoggingService;
