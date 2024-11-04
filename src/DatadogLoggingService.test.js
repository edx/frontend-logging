import { datadogLogs } from '@datadog/browser-logs';

import DatadogLoggingService from './DatadogLoggingService';

jest.mock('@datadog/browser-rum', () => ({
  datadogRum: {
    init: () => jest.fn(),
    setGlobalContextProperty: jest.fn(),
    setUserProperty: jest.fn(),
  },
}));
jest.mock('@datadog/browser-logs', () => ({
  datadogLogs: {
    logger: {
      log: jest.fn(),
      info: jest.fn(),
      error: jest.fn(),
    },
    setGlobalContextProperty: jest.fn(),
    setUserProperty: jest.fn(),
    init: jest.fn(),
  },
}));

let service = null;
const configWithIgnoredErrors = {
  config: {
    IGNORED_ERROR_REGEX: /^Ignore this error|very minor/,
  },
};
const configWithNullIgnoredErrors = {
  config: {
    IGNORED_ERROR_REGEX: null,
  },
};
const configWithEmptyIgnoredErrors = {
  config: {
    IGNORED_ERROR_REGEX: '',
  },
};
const configWithWhitespaceIgnoredErrors = {
  config: {
    IGNORED_ERROR_REGEX: '     ',
  },
};
const configWithMissingIgnoredErrors = {
  config: {},
};

describe('DatadogLoggingService', () => {
  beforeEach(() => {
    service = new DatadogLoggingService(configWithIgnoredErrors);
  });

  describe('logInfo', () => {
    beforeEach(() => {
      datadogLogs.logger.info.mockReset();
    });

    it('calls Datadog client to log message if the client is available', () => {
      const message = 'Test log';
      service.logInfo(message);
      expect(datadogLogs.logger.info).toHaveBeenCalledWith(message, {});
    });

    it('handles plain string message properly with custom attributes', () => {
      const message = 'Test log';
      const attrs = { a: 1, b: 'red', c: 3 };
      service.logInfo(message, attrs);
      expect(datadogLogs.logger.info).toHaveBeenCalledWith(message, attrs);
    });

    it('handles plain string message properly with no custom attributes', () => {
      const message = 'Test log';
      service.logInfo(message);
      expect(datadogLogs.logger.info).toHaveBeenCalledWith(message, {});
    });

    it('handles error object properly with custom attributes', () => {
      const message = 'Test log';
      const attrs = { a: 1, b: 'red', c: 3 };
      const err = { message, customAttributes: attrs };
      service.logInfo(err);
      expect(datadogLogs.logger.info).toHaveBeenCalledWith(message, attrs);
    });

    it('handles error object properly with no custom attributes', () => {
      const message = 'Test log';
      const err = { message };
      service.logInfo(err);
      expect(datadogLogs.logger.info).toHaveBeenCalledWith(message, {});
    });

    it('handles error object properly with custom attributes in object and param', () => {
      const message = 'Test log';
      const attrsObj = { a: 1, b: 'red', c: 3 };
      const attrsParam = { x: 99, y: 'blue', z: 987 };
      const err = { message, customAttributes: attrsObj };
      service.logInfo(err, attrsParam);
      expect(datadogLogs.logger.info).toHaveBeenCalledWith(message, { ...attrsObj, ...attrsParam });
    });
  });

  describe('logError', () => {
    beforeEach(() => {
      datadogLogs.logger.error.mockReset();
    });

    it('calls Datadog client to log error if the client is available', () => {
      const error = new Error('Failed!');
      service.logError(error);
      expect(datadogLogs.logger.error).toHaveBeenCalledWith(error, undefined);
    });

    it('calls Datadog client to log error if the client is available', () => {
      const error = new Error('Failed!');
      service.logError(error);
      expect(datadogLogs.logger.error).toHaveBeenCalledWith(error, undefined);
    });

    it('calls Datadog client to log error and merges in customAttributes from the error', () => {
      const error = new Error('Failed!');
      error.customAttributes = {
        boo: 'yah',
        foo: 'gah',
      };
      service.logError(error, { foo: 'wins', bar: 'baz' });
      expect(datadogLogs.logger.error).toHaveBeenCalledWith(error, { boo: 'yah', foo: 'wins', bar: 'baz' });
    });
  });

  describe('setCustomAttribute', () => {
    beforeEach(() => {
      datadogLogs.setGlobalContextProperty.mockReset();
      datadogLogs.setUserProperty.mockReset();
    });

    it('calls Datadog client with name and value', () => {
      service.setCustomAttribute('foo', 'bar');
      expect(datadogLogs.setGlobalContextProperty).toHaveBeenCalledWith('foo', 'bar');
    });

    it('calls Datadog client with userId', () => {
      service.setCustomAttribute('userId', 123);
      expect(datadogLogs.setUserProperty).toHaveBeenCalledWith('id', 123);
    });
  });

  describe('ignoredErrors', () => {
    beforeEach(() => {
      datadogLogs.logger.info.mockReset();
      datadogLogs.logger.error.mockReset();
    });

    it('calls Datadog client as error objects but ignored and sent as page action', () => {
      const error1 = new Error('Ignore this error!');
      error1.customAttributes = {
        hi: 'hello',
      };
      service.logError(error1);
      expect(datadogLogs.logger.info).toHaveBeenCalledWith(`IGNORED_ERROR: ${error1.message}`, error1.customAttributes);

      const error2 = new Error('very minor');
      service.logError(error2);
      expect(datadogLogs.logger.info).toHaveBeenCalledWith(`IGNORED_ERROR: ${error2.message}`, undefined);
    });

    it('calls Datadog client as error string but ignored and sent as page action', () => {
      const error = 'Ignore this error!';
      service.logError(error);
      expect(datadogLogs.logger.info).toHaveBeenCalledWith(`IGNORED_ERROR: ${error}`, undefined);
    });

    it('calls Datadog client as error object but with null ignored error config', () => {
      service = new DatadogLoggingService(configWithNullIgnoredErrors);
      const error = new Error('Ignore this error!');
      service.logError(error);
      expect(datadogLogs.logger.error).toHaveBeenCalledWith(error, undefined);
    });

    it('calls Datadog client as error object but with empty ignored error config', () => {
      service = new DatadogLoggingService(configWithEmptyIgnoredErrors);
      const error = new Error('Ignore this error!');
      service.logError(error);
      expect(datadogLogs.logger.error).toHaveBeenCalledWith(error, undefined);
    });

    it('calls Datadog client as error object but with whitespace-only ignored error config', () => {
      service = new DatadogLoggingService(configWithWhitespaceIgnoredErrors);
      const error = new Error('Ignore this error!');
      service.logError(error);
      expect(datadogLogs.logger.error).toHaveBeenCalledWith(error, undefined);
    });

    it('calls Datadog client as error object but with missing ignored error config', () => {
      service = new DatadogLoggingService(configWithMissingIgnoredErrors);
      const error = new Error('Ignore this error!');
      service.logError(error);
      expect(datadogLogs.logger.error).toHaveBeenCalledWith(error, undefined);
    });
  });

  describe('getAllowedTracingUrls', () => {
    it('returns an empty array if default allowed tracing urls are not configured', () => {
      expect(service.getAllowedTracingUrls()).toEqual([]);
    });

    it('returns default allowedTracingUrls if DATADOG_HAS_DEFAULT_ALLOWED_TRACING_URLS env var is set', () => {
      process.env.DATADOG_HAS_DEFAULT_ALLOWED_TRACING_URLS = 'true';
      const expectedAllowedTracingUrls = [
        /https:\/\/.*\.edx\.org/, // Matches any subdomain of edx.org
      ];
      expect(service.getAllowedTracingUrls()).toEqual(expectedAllowedTracingUrls);
      delete process.env.DATADOG_HAS_DEFAULT_ALLOWED_TRACING_URLS;
    });
  });
});
