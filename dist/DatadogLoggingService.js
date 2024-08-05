"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;
var _browserRum = require("@datadog/browser-rum");
var _browserLogs = require("@datadog/browser-logs");
function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
function ownKeys(e, r) { var t = Object.keys(e); if (Object.getOwnPropertySymbols) { var o = Object.getOwnPropertySymbols(e); r && (o = o.filter(function (r) { return Object.getOwnPropertyDescriptor(e, r).enumerable; })), t.push.apply(t, o); } return t; }
function _objectSpread(e) { for (var r = 1; r < arguments.length; r++) { var t = null != arguments[r] ? arguments[r] : {}; r % 2 ? ownKeys(Object(t), !0).forEach(function (r) { _defineProperty(e, r, t[r]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(t)) : ownKeys(Object(t)).forEach(function (r) { Object.defineProperty(e, r, Object.getOwnPropertyDescriptor(t, r)); }); } return e; }
function _defineProperty(obj, key, value) { key = _toPropertyKey(key); if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }
function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }
function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, _toPropertyKey(descriptor.key), descriptor); } }
function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); Object.defineProperty(Constructor, "prototype", { writable: false }); return Constructor; }
function _toPropertyKey(t) { var i = _toPrimitive(t, "string"); return "symbol" == _typeof(i) ? i : i + ""; }
function _toPrimitive(t, r) { if ("object" != _typeof(t) || !t) return t; var e = t[Symbol.toPrimitive]; if (void 0 !== e) { var i = e.call(t, r || "default"); if ("object" != _typeof(i)) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === r ? String : Number)(t); }
var browserLogNameIgnoredError = 'IGNORED_ERROR';
function sendBrowserLog(actionName, message, customAttributes) {
  if (process.env.NODE_ENV === 'development') {
    console.log(actionName, message, customAttributes); // eslint-disable-line
  }
  _browserLogs.datadogLogs.logger.info("".concat(actionName, ": ").concat(message), customAttributes);
}
function sendError(error, customAttributes) {
  if (process.env.NODE_ENV === 'development') {
    console.error(error, customAttributes); // eslint-disable-line
  }
  // https://docs.datadoghq.com/logs/log_collection/javascript/#error-tracking
  _browserLogs.datadogLogs.logger.error(error, customAttributes);
}
var DatadogLoggingService = /*#__PURE__*/function () {
  function DatadogLoggingService(options) {
    _classCallCheck(this, DatadogLoggingService);
    var config = options ? options.config : undefined;
    this.ignoredErrorRegexes = config ? config.IGNORED_ERROR_REGEX : undefined;
    this.initialize();
  }

  // to read more about the use cases for beforeSend, refer to the documentation:
  // https://docs.datadoghq.com/real_user_monitoring/guide/enrich-and-control-rum-data/?tab=event#event-and-context-structure
  // (e.g., discarding frontend errors matching the optional `IGNORED_ERROR_REGEX` configuration,
  // currently implemented in `logError` below).
  return _createClass(DatadogLoggingService, [{
    key: "beforeSend",
    value: function beforeSend() {
      // common/shared logic across all MFEs
      return true;
    }
  }, {
    key: "initialize",
    value: function initialize() {
      var requiredDatadogConfig = [process.env.DATADOG_APPLICATION_ID, process.env.DATADOG_CLIENT_TOKEN];
      var hasRequiredDatadogConfig = requiredDatadogConfig.every(function (value) {
        return !!value;
      });

      // Do not attempt to initialize Datadog if required config settings are not supplied.
      if (!hasRequiredDatadogConfig) {
        return;
      }
      var datadogVersion = process.env.DATADOG_VERSION || process.env.APP_VERSION || '1.0.0';
      _browserRum.datadogRum.init({
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
        defaultPrivacyLevel: 'mask-user-input'
      });
      _browserLogs.datadogLogs.init({
        clientToken: process.env.DATADOG_CLIENT_TOKEN,
        site: process.env.DATADOG_SITE || '',
        env: process.env.DATADOG_ENV || '',
        forwardErrorsToLogs: true,
        sessionSampleRate: parseInt(process.env.DATADOG_LOGS_SESSION_SAMPLE_RATE || 0, 10),
        service: process.env.DATADOG_SERVICE || '',
        version: datadogVersion
      });
    }
  }, {
    key: "logInfo",
    value: function logInfo(infoStringOrErrorObject) {
      var customAttributes = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
      var message = infoStringOrErrorObject;
      var customAttrs = _objectSpread({}, customAttributes);
      if (_typeof(infoStringOrErrorObject) === 'object' && 'message' in infoStringOrErrorObject) {
        var infoCustomAttributes = infoStringOrErrorObject.customAttributes || {};
        customAttrs = _objectSpread(_objectSpread({}, infoCustomAttributes), customAttributes);
        message = infoStringOrErrorObject.message;
      }
      _browserLogs.datadogLogs.logger.info(message, customAttrs);
    }

    /**
     *
     *
     * @param {*} errorStringOrObject
     * @param {*} [customAttributes={}]
     * @memberof DatadogLoggingService
     */
  }, {
    key: "logError",
    value: function logError(errorStringOrObject) {
      var customAttributes = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
      var errorCustomAttributes = errorStringOrObject.customAttributes || {};
      var allCustomAttributes = _objectSpread(_objectSpread({}, errorCustomAttributes), customAttributes);
      if (Object.keys(allCustomAttributes).length === 0) {
        allCustomAttributes = undefined;
      }

      /*
          Separate the errors into ignored errors and other errors.
          Ignored errors are logged as it is.
          Other errors are logged via error API.
      */
      var errorMessage = errorStringOrObject.message || (typeof errorStringOrObject === 'string' ? errorStringOrObject : '');
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
  }, {
    key: "setCustomAttribute",
    value: function setCustomAttribute(name, value) {
      if (name === 'userId') {
        _browserLogs.datadogLogs.setUserProperty('id', value);
        _browserRum.datadogRum.setUserProperty('id', value);
        return;
      }
      _browserLogs.datadogLogs.setGlobalContextProperty(name, value);
      _browserRum.datadogRum.setGlobalContextProperty(name, value);
    }
  }]);
}();
var _default = exports["default"] = DatadogLoggingService;
//# sourceMappingURL=DatadogLoggingService.js.map