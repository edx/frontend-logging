import { datadogRum } from '@datadog/browser-rum';
import { datadogLogs } from '@datadog/browser-logs';

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

class DatadogLoggingService {
  constructor(options) {
    const config = options ? options.config : undefined;
    this.ignoredErrorRegexes = config ? config.IGNORED_ERROR_REGEX : undefined;
    this.initialize();
  }

  // to read more about the use cases for beforeSend, refer to the documentation:
  // https://docs.datadoghq.com/real_user_monitoring/guide/enrich-and-control-rum-data/?tab=event#event-and-context-structure
  // (e.g., discarding frontend errors matching the optional `IGNORED_ERROR_REGEX` configuration,
  // currently implemented in `logError` below).
  beforeSend() {
    // common/shared logic across all MFEs
    return true;
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
    datadogRum.init({
      applicationId: process.env.DATADOG_APPLICATION_ID,
      beforeSend: this.beforeSend,
      clientToken: process.env.DATADOG_CLIENT_TOKEN,
      site: process.env.DATADOG_SITE || '',
      service: process.env.DATADOG_SERVICE || '',
      env: process.env.DATADOG_ENV || '',
      version: datadogVersion,
      sessionSampleRate: parseInt(process.env.DATADOG_SESSION_SAMPLE_RATE || 0, 10),
      sessionReplaySampleRate: parseInt(process.env.DATADOG_SESSION_REPLAY_SAMPLE_RATE || 0, 10),
      trackUserInteractions: true,
      trackResources: true,
      trackLongTasks: true,
      defaultPrivacyLevel: 'mask-user-input',
    });
    datadogLogs.init({
      clientToken: process.env.DATADOG_CLIENT_TOKEN,
      site: process.env.DATADOG_SITE || '',
      env: process.env.DATADOG_ENV || '',
      forwardErrorsToLogs: true,
      sessionSampleRate: parseInt(process.env.DATADOG_LOGS_SESSION_SAMPLE_RATE || 0, 10),
      service: process.env.DATADOG_SERVICE || '',
      version: datadogVersion,
    });
  }

  logInfo(infoStringOrErrorObject, customAttributes = {}) {
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
    if (name === 'userId') {
      datadogLogs.setUserProperty('id', value);
      datadogRum.setUserProperty('id', value);
      return;
    }
    datadogLogs.setGlobalContextProperty(name, value);
    datadogRum.setGlobalContextProperty(name, value);
  }
}

export default DatadogLoggingService;
