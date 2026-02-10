/**
 * =============================================================================
 * Logger Utility Tests — ZYNC Desktop Application
 * =============================================================================
 *
 * Unit tests for the logger utility module. These tests verify that:
 *
 * 1. Log messages are properly formatted with timestamps and module tags
 * 2. Log levels are correctly filtered based on the current level setting
 * 3. Scoped loggers correctly tag all messages with their module name
 * 4. The default logger instance works as expected
 *
 * @module electron/tests/unit/utils/logger.test
 * @author ZYNC Team
 * @version 1.0.0
 * @license MIT
 * =============================================================================
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  LogLevel,
  setLogLevel,
  createLogger,
  logger,
} from '../../../utils/logger';
import { captureConsole, type ConsoleSpy } from '../../helpers';

// =============================================================================
// Test Suite: Logger Utility
// =============================================================================

describe('Logger Utility', () => {
  /**
   * Console spy for capturing log output.
   */
  let consoleSpy: ConsoleSpy;

  /**
   * Set up before each test.
   */
  beforeEach(() => {
    // Reset log level to DEBUG for each test
    setLogLevel(LogLevel.DEBUG);
    
    // Capture console output
    consoleSpy = captureConsole();
  });

  /**
   * Clean up after each test.
   */
  afterEach(() => {
    // Restore original console methods
    consoleSpy.restore();
  });

  // ===========================================================================
  // Test Group: Log Level Enum
  // ===========================================================================

  describe('LogLevel Enum', () => {
    it('should have correct numeric values for log levels', () => {
      expect(LogLevel.DEBUG).toBe(0);
      expect(LogLevel.INFO).toBe(1);
      expect(LogLevel.WARN).toBe(2);
      expect(LogLevel.ERROR).toBe(3);
      expect(LogLevel.SILENT).toBe(4);
    });

    it('should have log levels in ascending order of severity', () => {
      expect(LogLevel.DEBUG).toBeLessThan(LogLevel.INFO);
      expect(LogLevel.INFO).toBeLessThan(LogLevel.WARN);
      expect(LogLevel.WARN).toBeLessThan(LogLevel.ERROR);
      expect(LogLevel.ERROR).toBeLessThan(LogLevel.SILENT);
    });
  });

  // ===========================================================================
  // Test Group: setLogLevel Function
  // ===========================================================================

  describe('setLogLevel()', () => {
    it('should set log level to DEBUG', () => {
      setLogLevel(LogLevel.DEBUG);
      const log = createLogger('Test');
      
      log.debug('debug message');
      log.info('info message');
      log.warn('warn message');
      log.error('error message');
      
      // All messages should be logged at DEBUG level
      expect(consoleSpy.log.length).toBe(1);
      expect(consoleSpy.info.length).toBe(1);
      expect(consoleSpy.warn.length).toBe(1);
      expect(consoleSpy.error.length).toBe(1);
    });

    it('should set log level to INFO', () => {
      setLogLevel(LogLevel.INFO);
      const log = createLogger('Test');
      
      log.debug('debug message');
      log.info('info message');
      log.warn('warn message');
      log.error('error message');
      
      // DEBUG should be filtered out
      expect(consoleSpy.log.length).toBe(0);
      expect(consoleSpy.info.length).toBe(1);
      expect(consoleSpy.warn.length).toBe(1);
      expect(consoleSpy.error.length).toBe(1);
    });

    it('should set log level to WARN', () => {
      setLogLevel(LogLevel.WARN);
      const log = createLogger('Test');
      
      log.debug('debug message');
      log.info('info message');
      log.warn('warn message');
      log.error('error message');
      
      // DEBUG and INFO should be filtered out
      expect(consoleSpy.log.length).toBe(0);
      expect(consoleSpy.info.length).toBe(0);
      expect(consoleSpy.warn.length).toBe(1);
      expect(consoleSpy.error.length).toBe(1);
    });

    it('should set log level to ERROR', () => {
      setLogLevel(LogLevel.ERROR);
      const log = createLogger('Test');
      
      log.debug('debug message');
      log.info('info message');
      log.warn('warn message');
      log.error('error message');
      
      // Only ERROR should be logged
      expect(consoleSpy.log.length).toBe(0);
      expect(consoleSpy.info.length).toBe(0);
      expect(consoleSpy.warn.length).toBe(0);
      expect(consoleSpy.error.length).toBe(1);
    });

    it('should set log level to SILENT', () => {
      setLogLevel(LogLevel.SILENT);
      const log = createLogger('Test');
      
      log.debug('debug message');
      log.info('info message');
      log.warn('warn message');
      log.error('error message');
      
      // Nothing should be logged
      expect(consoleSpy.log.length).toBe(0);
      expect(consoleSpy.info.length).toBe(0);
      expect(consoleSpy.warn.length).toBe(0);
      expect(consoleSpy.error.length).toBe(0);
    });

    it('should be persistent across multiple logger instances', () => {
      setLogLevel(LogLevel.ERROR);
      
      const log1 = createLogger('Module1');
      const log2 = createLogger('Module2');
      
      log1.info('info from module 1');
      log2.info('info from module 2');
      log1.error('error from module 1');
      log2.error('error from module 2');
      
      // Only errors should be logged
      expect(consoleSpy.info.length).toBe(0);
      expect(consoleSpy.error.length).toBe(2);
    });
  });

  // ===========================================================================
  // Test Group: createLogger Function
  // ===========================================================================

  describe('createLogger()', () => {
    describe('Logger Creation', () => {
      it('should create a logger with the specified module name', () => {
        const log = createLogger('TestModule');
        log.info('test message');
        
        expect(consoleSpy.hasInfo('[TestModule]')).toBe(true);
      });

      it('should create multiple loggers with different module names', () => {
        const log1 = createLogger('Module1');
        const log2 = createLogger('Module2');
        const log3 = createLogger('Module3');
        
        log1.info('message 1');
        log2.info('message 2');
        log3.info('message 3');
        
        expect(consoleSpy.hasInfo('[Module1]')).toBe(true);
        expect(consoleSpy.hasInfo('[Module2]')).toBe(true);
        expect(consoleSpy.hasInfo('[Module3]')).toBe(true);
      });

      it('should handle empty module name', () => {
        const log = createLogger('');
        log.info('test message');
        
        expect(consoleSpy.hasInfo('[]')).toBe(true);
      });

      it('should handle module names with special characters', () => {
        const log = createLogger('Test-Module_v1.0');
        log.info('test message');
        
        expect(consoleSpy.hasInfo('[Test-Module_v1.0]')).toBe(true);
      });
    });

    describe('Log Methods', () => {
      let log: ReturnType<typeof createLogger>;

      beforeEach(() => {
        log = createLogger('Test');
      });

      it('should have debug method', () => {
        expect(typeof log.debug).toBe('function');
      });

      it('should have info method', () => {
        expect(typeof log.info).toBe('function');
      });

      it('should have warn method', () => {
        expect(typeof log.warn).toBe('function');
      });

      it('should have error method', () => {
        expect(typeof log.error).toBe('function');
      });
    });

    describe('debug()', () => {
      let log: ReturnType<typeof createLogger>;

      beforeEach(() => {
        log = createLogger('Test');
      });

      it('should log debug messages to console.log', () => {
        log.debug('debug message');
        
        expect(consoleSpy.log.length).toBe(1);
        expect(consoleSpy.hasLog('[DEBUG]')).toBe(true);
        expect(consoleSpy.hasLog('[Test]')).toBe(true);
        expect(consoleSpy.hasLog('debug message')).toBe(true);
      });

      it('should include timestamp in debug messages', () => {
        log.debug('timed message');
        
        // Check for ISO timestamp format (e.g., 2024-01-15T12:30:45.123Z)
        const message = consoleSpy.log[0];
        expect(message).toMatch(/\[\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z\]/);
      });

      it('should support additional arguments', () => {
        const obj = { key: 'value' };
        log.debug('message with object', obj);
        
        expect(consoleSpy.log.length).toBe(1);
      });

      it('should be filtered when log level is higher than DEBUG', () => {
        setLogLevel(LogLevel.INFO);
        log.debug('filtered message');
        
        expect(consoleSpy.log.length).toBe(0);
      });
    });

    describe('info()', () => {
      let log: ReturnType<typeof createLogger>;

      beforeEach(() => {
        log = createLogger('Test');
      });

      it('should log info messages to console.info', () => {
        log.info('info message');
        
        expect(consoleSpy.info.length).toBe(1);
        expect(consoleSpy.hasInfo('[INFO]')).toBe(true);
        expect(consoleSpy.hasInfo('[Test]')).toBe(true);
        expect(consoleSpy.hasInfo('info message')).toBe(true);
      });

      it('should include timestamp in info messages', () => {
        log.info('timed message');
        
        const message = consoleSpy.info[0];
        expect(message).toMatch(/\[\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z\]/);
      });

      it('should support additional arguments', () => {
        log.info('message with args', 1, 2, 3);
        
        expect(consoleSpy.info.length).toBe(1);
      });

      it('should be filtered when log level is higher than INFO', () => {
        setLogLevel(LogLevel.WARN);
        log.info('filtered message');
        
        expect(consoleSpy.info.length).toBe(0);
      });
    });

    describe('warn()', () => {
      let log: ReturnType<typeof createLogger>;

      beforeEach(() => {
        log = createLogger('Test');
      });

      it('should log warn messages to console.warn', () => {
        log.warn('warn message');
        
        expect(consoleSpy.warn.length).toBe(1);
        expect(consoleSpy.hasWarn('[WARN]')).toBe(true);
        expect(consoleSpy.hasWarn('[Test]')).toBe(true);
        expect(consoleSpy.hasWarn('warn message')).toBe(true);
      });

      it('should include timestamp in warn messages', () => {
        log.warn('timed message');
        
        const message = consoleSpy.warn[0];
        expect(message).toMatch(/\[\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z\]/);
      });

      it('should support additional arguments', () => {
        const error = new Error('test error');
        log.warn('warning with error', error);
        
        expect(consoleSpy.warn.length).toBe(1);
      });

      it('should be filtered when log level is higher than WARN', () => {
        setLogLevel(LogLevel.ERROR);
        log.warn('filtered message');
        
        expect(consoleSpy.warn.length).toBe(0);
      });
    });

    describe('error()', () => {
      let log: ReturnType<typeof createLogger>;

      beforeEach(() => {
        log = createLogger('Test');
      });

      it('should log error messages to console.error', () => {
        log.error('error message');
        
        expect(consoleSpy.error.length).toBe(1);
        expect(consoleSpy.hasError('[ERROR]')).toBe(true);
        expect(consoleSpy.hasError('[Test]')).toBe(true);
        expect(consoleSpy.hasError('error message')).toBe(true);
      });

      it('should include timestamp in error messages', () => {
        log.error('timed message');
        
        const message = consoleSpy.error[0];
        expect(message).toMatch(/\[\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z\]/);
      });

      it('should support additional arguments including Error objects', () => {
        const error = new Error('test error');
        log.error('error occurred', error);
        
        expect(consoleSpy.error.length).toBe(1);
      });

      it('should not be filtered even at ERROR level', () => {
        setLogLevel(LogLevel.ERROR);
        log.error('visible message');
        
        expect(consoleSpy.error.length).toBe(1);
      });

      it('should be filtered only at SILENT level', () => {
        setLogLevel(LogLevel.SILENT);
        log.error('filtered message');
        
        expect(consoleSpy.error.length).toBe(0);
      });
    });
  });

  // ===========================================================================
  // Test Group: Default Logger Instance
  // ===========================================================================

  describe('Default Logger Instance', () => {
    it('should export a default logger instance', () => {
      expect(logger).toBeDefined();
      expect(typeof logger.debug).toBe('function');
      expect(typeof logger.info).toBe('function');
      expect(typeof logger.warn).toBe('function');
      expect(typeof logger.error).toBe('function');
    });

    it('should use "App" as the default module name', () => {
      logger.info('default logger message');
      
      expect(consoleSpy.hasInfo('[App]')).toBe(true);
    });

    it('should respect global log level setting', () => {
      setLogLevel(LogLevel.ERROR);
      
      logger.info('filtered info');
      logger.error('visible error');
      
      expect(consoleSpy.info.length).toBe(0);
      expect(consoleSpy.error.length).toBe(1);
    });
  });

  // ===========================================================================
  // Test Group: Message Formatting
  // ===========================================================================

  describe('Message Formatting', () => {
    let log: ReturnType<typeof createLogger>;

    beforeEach(() => {
      log = createLogger('Format');
    });

    it('should format messages with [timestamp] [level] [module] message pattern', () => {
      log.info('test message');
      
      const message = consoleSpy.info[0];
      
      // Expected format: [2024-01-15T12:30:45.123Z] [INFO] [Format] test message
      const pattern = /^\[\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z\] \[INFO\] \[Format\] test message$/;
      expect(message).toMatch(pattern);
    });

    it('should preserve original message content', () => {
      const originalMessage = 'This is a test message with special chars: @#$%^&*()';
      log.info(originalMessage);
      
      expect(consoleSpy.hasInfo(originalMessage)).toBe(true);
    });

    it('should handle multiline messages', () => {
      const multilineMessage = 'Line 1\nLine 2\nLine 3';
      log.info(multilineMessage);
      
      expect(consoleSpy.hasInfo('Line 1\nLine 2\nLine 3')).toBe(true);
    });

    it('should handle empty messages', () => {
      log.info('');
      
      expect(consoleSpy.info.length).toBe(1);
    });

    it('should handle messages with Unicode characters', () => {
      const unicodeMessage = 'Hello 世界 🌍 مرحبا';
      log.info(unicodeMessage);
      
      expect(consoleSpy.hasInfo(unicodeMessage)).toBe(true);
    });
  });

  // ===========================================================================
  // Test Group: Edge Cases
  // ===========================================================================

  describe('Edge Cases', () => {
    it('should handle rapid sequential logging', () => {
      const log = createLogger('Rapid');
      
      for (let i = 0; i < 100; i++) {
        log.info(`Message ${i}`);
      }
      
      expect(consoleSpy.info.length).toBe(100);
    });

    it('should handle concurrent loggers logging simultaneously', () => {
      const loggers = Array.from({ length: 10 }, (_, i) =>
        createLogger(`Module${i}`),
      );
      
      loggers.forEach((log, i) => {
        log.info(`Message from module ${i}`);
      });
      
      expect(consoleSpy.info.length).toBe(10);
      
      for (let i = 0; i < 10; i++) {
        expect(consoleSpy.hasInfo(`[Module${i}]`)).toBe(true);
        expect(consoleSpy.hasInfo(`Message from module ${i}`)).toBe(true);
      }
    });

    it('should handle changing log levels during logging', () => {
      const log = createLogger('Dynamic');
      
      setLogLevel(LogLevel.DEBUG);
      log.debug('debug visible');
      
      setLogLevel(LogLevel.ERROR);
      log.debug('debug hidden');
      log.error('error visible');
      
      setLogLevel(LogLevel.DEBUG);
      log.debug('debug visible again');
      
      expect(consoleSpy.log.length).toBe(2); // Two debug messages
      expect(consoleSpy.error.length).toBe(1);
    });

    it('should handle null and undefined in additional arguments', () => {
      const log = createLogger('NullUndef');
      
      log.info('message with null', null);
      log.info('message with undefined', undefined);
      
      expect(consoleSpy.info.length).toBe(2);
    });

    it('should handle circular references in additional arguments', () => {
      const log = createLogger('Circular');
      
      interface CircularObject {
        name: string;
        self?: CircularObject;
      }
      
      const circular: CircularObject = { name: 'circular' };
      circular.self = circular;
      
      // This should not throw
      expect(() => {
        log.info('circular object', circular);
      }).not.toThrow();
    });

    it('should handle very long messages', () => {
      const log = createLogger('Long');
      const longMessage = 'x'.repeat(10000);
      
      log.info(longMessage);
      
      expect(consoleSpy.hasInfo(longMessage)).toBe(true);
    });

    it('should handle very long module names', () => {
      const longModuleName = 'M'.repeat(1000);
      const log = createLogger(longModuleName);
      
      log.info('test');
      
      expect(consoleSpy.hasInfo(`[${longModuleName}]`)).toBe(true);
    });
  });

  // ===========================================================================
  // Test Group: Type Safety
  // ===========================================================================

  describe('Type Safety', () => {
    it('should accept string log level values', () => {
      // These should compile without errors
      setLogLevel(LogLevel.DEBUG);
      setLogLevel(LogLevel.INFO);
      setLogLevel(LogLevel.WARN);
      setLogLevel(LogLevel.ERROR);
      setLogLevel(LogLevel.SILENT);
    });

    it('should accept any types as additional arguments', () => {
      const log = createLogger('Types');
      
      // All of these should work without type errors
      log.info('string', 'hello');
      log.info('number', 42);
      log.info('boolean', true);
      log.info('object', { key: 'value' });
      log.info('array', [1, 2, 3]);
      log.info('null', null);
      log.info('undefined', undefined);
      log.info('function', () => {});
      log.info('symbol', Symbol('test'));
      log.info('bigint', BigInt(9007199254740991));
      
      expect(consoleSpy.info.length).toBe(10);
    });
  });
});

// =============================================================================
// Test Utilities for Logger Tests
// =============================================================================

/**
 * Helper function to extract the timestamp from a log message.
 *
 * @param message - The full log message
 * @returns The extracted timestamp string, or null if not found
 */
function extractTimestamp(message: string): string | null {
  const match = message.match(/\[(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z)\]/);
  return match ? match[1] : null;
}

/**
 * Helper function to extract the log level from a message.
 *
 * @param message - The full log message
 * @returns The extracted log level string, or null if not found
 */
function extractLogLevel(message: string): string | null {
  const match = message.match(/\[(DEBUG|INFO|WARN|ERROR)\]/);
  return match ? match[1] : null;
}

/**
 * Helper function to extract the module name from a message.
 *
 * @param message - The full log message
 * @returns The extracted module name, or null if not found
 */
function extractModuleName(message: string): string | null {
  // Matches the last bracketed section before the message content
  const match = message.match(/\[\d{4}-\d{2}-\d{2}T.+?\] \[\w+\] \[(.+?)\]/);
  return match ? match[1] : null;
}
