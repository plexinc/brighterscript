"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LogLevel = exports.Logger = exports.logger = exports.createLogger = exports.setLspLoggerProps = void 0;
const logger_1 = require("@rokucommunity/logger");
const logger_2 = require("@rokucommunity/logger");
Object.defineProperty(exports, "Logger", { enumerable: true, get: function () { return logger_2.Logger; } });
const logger = logger_1.default.createLogger();
exports.logger = logger;
//force log levels to be same width
logger.consistentLogLevelWidth = true;
logger.printLogLevel = false;
logger.timestampFormat = 'hh:mm:ss:SSS aa';
logger.logLevel = 'log';
logger.prefix = '';
/**
 * Set the logger properties to be used when running in language server mode. It's a function so we can share the logic between LanguageServer and
 * the workerThread projects that don't inherit the same logger instance
 */
function setLspLoggerProps() {
    //disable logger color when running the LSP (i.e. anytime we create a LanguageServer instance)
    logger.enableColor = false;
    //include the logLevel text in all log messages when running in LSP mode
    logger.printLogLevel = true;
}
exports.setLspLoggerProps = setLspLoggerProps;
exports.createLogger = logger.createLogger.bind(logger);
var Logger_1 = require("./Logger");
Object.defineProperty(exports, "LogLevel", { enumerable: true, get: function () { return Logger_1.LogLevel; } });
//# sourceMappingURL=logging.js.map