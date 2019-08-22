import NewRelicLoggingService from './NewRelicLoggingService';

import {
  configureLoggingService,
  logAxiosError,
  processAxiosError,
  logInfo,
  logError,
  resetLoggingService,
} from './logging';

jest.mock('./NewRelicLoggingService');

const arg1 = 'argument one';
const arg2 = 'argument two';

describe('configureLoggingService', () => {
  it('fails when loggingService is not supplied', () => {
    expect(configureLoggingService)
      .toThrowError(new Error('The loggingService is required.'));
  });

  it('fails when loggingService has invalid API', () => {
    expect(() => configureLoggingService({}))
      .toThrowError(new Error('The loggingService API must have a logAxiosError function.'));
  });
});

describe('configured logging service', () => {
  beforeEach(() => {
    // uses NewRelicLoggingService as any example of a concrete implementation
    configureLoggingService(NewRelicLoggingService);
  });

  describe('logInfo', () => {
    it('passes call through to NewRelicLoggingService', () => {
      const mockStatic = jest.fn();
      NewRelicLoggingService.logInfo = mockStatic.bind(NewRelicLoggingService);

      logInfo(arg1, arg2);
      expect(mockStatic).toHaveBeenCalledWith(arg1, arg2);
    });
  });

  describe('logError', () => {
    it('passes call through to NewRelicLoggingService', () => {
      const mockStatic = jest.fn();
      NewRelicLoggingService.logError = mockStatic.bind(NewRelicLoggingService);

      logError(arg1, arg2);
      expect(mockStatic).toHaveBeenCalledWith(arg1, arg2);
    });
  });

  describe('logAxiosError', () => {
    it('passes call through to NewRelicLoggingService', () => {
      const mockStatic = jest.fn();
      NewRelicLoggingService.logAxiosError = mockStatic.bind(NewRelicLoggingService);

      logAxiosError(arg1, arg2);
      expect(mockStatic).toHaveBeenCalledWith(arg1, arg2);
    });
  });

  describe('processAxiosError', () => {
    it('passes call through to NewRelicLoggingService', () => {
      const mockStatic = jest.fn();
      NewRelicLoggingService.processAxiosError = mockStatic.bind(NewRelicLoggingService);

      processAxiosError(arg1);
      expect(mockStatic).toHaveBeenCalledWith(arg1);
    });
  });
});

describe('test failures when logging service is not configured', () => {
  beforeAll(() => {
    resetLoggingService();
  });

  describe('logInfo', () => {
    it('throws an error', () => {
      expect(() => logInfo(arg1))
        .toThrowError(new Error('You must first configure the loggingService.'));
    });
  });

  describe('logError', () => {
    it('throws an error', () => {
      expect(() => logError(arg1, arg2))
        .toThrowError(new Error('You must first configure the loggingService.'));
    });
  });

  describe('logAxiosError', () => {
    it('throws an error', () => {
      expect(() => logAxiosError(arg1, arg2))
        .toThrowError(new Error('You must first configure the loggingService.'));
    });
  });
});
