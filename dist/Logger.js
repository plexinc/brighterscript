"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LogLevel = exports.noop = exports.Logger = void 0;
const chalk_1 = require("chalk");
const moment = require("moment");
const eventemitter3_1 = require("eventemitter3");
const Stopwatch_1 = require("./Stopwatch");
const logger_1 = require("@rokucommunity/logger");
/**
 * @deprecated use the `createLogger` function instead
 */
class Logger {
    constructor(logLevel, prefix) {
        this.prefix = prefix;
        /**
         * A string with whitespace used for indenting all messages
         */
        this.indent = '';
        this._logLevel = logger_1.LogLevelNumeric.log;
        this.logLevel = logLevel !== null && logLevel !== void 0 ? logLevel : logger_1.LogLevelNumeric.log;
    }
    static subscribe(callback) {
        this.emitter.on('log', callback);
        return () => {
            this.emitter.off('log', callback);
        };
    }
    get logLevel() {
        return this._logLevel;
    }
    set logLevel(value) {
        //cast the string version to the numberic version
        if (typeof (value) === 'string') {
            value = logger_1.LogLevelNumeric[value];
        }
        this._logLevel = value !== null && value !== void 0 ? value : logger_1.LogLevelNumeric.log;
    }
    getTimestamp() {
        return '[' + chalk_1.default.grey(moment().format(`hh:mm:ss:SSSS A`)) + ']';
    }
    writeToLog(method, ...args) {
        if (this._logLevel === logger_1.LogLevelNumeric.trace) {
            method = console.trace;
        }
        let finalArgs = [];
        //evaluate any functions to get their values.
        //This allows more complicated values to only be evaluated if this log level is active
        for (let arg of args) {
            if (arg instanceof Function) {
                arg = arg();
            }
            finalArgs.push(arg);
        }
        const allArgs = [
            this.getTimestamp()
        ];
        if (this.prefix) {
            allArgs.push(this.prefix);
        }
        allArgs.push(this.indent);
        method.call(console, ...allArgs, ...finalArgs);
        if (Logger.emitter.listenerCount('log') > 0) {
            Logger.emitter.emit('log', finalArgs.join(' '));
        }
    }
    /**
     * Log an error message to the console
     */
    error(...messages) {
        if (this._logLevel >= logger_1.LogLevelNumeric.error) {
            this.writeToLog(console.error, ...messages);
        }
    }
    /**
     * Log a warning message to the console
     */
    warn(...messages) {
        if (this._logLevel >= logger_1.LogLevelNumeric.warn) {
            this.writeToLog(console.warn, ...messages);
        }
    }
    /**
     * Log a standard log message to the console
     */
    log(...messages) {
        if (this._logLevel >= logger_1.LogLevelNumeric.log) {
            this.writeToLog(console.log, ...messages);
        }
    }
    /**
     * Log an info message to the console
     */
    info(...messages) {
        if (this._logLevel >= logger_1.LogLevelNumeric.info) {
            this.writeToLog(console.info, ...messages);
        }
    }
    /**
     * Log a debug message to the console
     */
    debug(...messages) {
        if (this._logLevel >= logger_1.LogLevelNumeric.debug) {
            this.writeToLog(console.debug, ...messages);
        }
    }
    /**
     * Log a debug message to the console
     */
    trace(...messages) {
        if (this._logLevel >= logger_1.LogLevelNumeric.trace) {
            this.writeToLog(console.trace, ...messages);
        }
    }
    /**
     * Writes to the log (if logLevel matches), and also provides a function that can be called to mark the end of a time.
     * You can override the action if, for example, the operation was cancelled instead of finished.
     */
    timeStart(logLevel, ...messages) {
        //call the log if loglevel is in range
        if (this._logLevel >= logLevel) {
            const stopwatch = new Stopwatch_1.Stopwatch();
            const logLevelString = logger_1.LogLevelNumeric[logLevel];
            //write the initial log
            this[logLevelString](...messages !== null && messages !== void 0 ? messages : []);
            stopwatch.start();
            return (status = 'finished') => {
                stopwatch.stop();
                this[logLevelString](...messages !== null && messages !== void 0 ? messages : [], `${status}. (${chalk_1.default.blue(stopwatch.getDurationText())})`);
            };
        }
        return noop;
    }
    /**
     * Writes to the log (if logLevel matches), and also times how long the action took to occur.
     * `action` is called regardless of logLevel, so this function can be used to nicely wrap
     * pieces of functionality.
     * The action function also includes two parameters called `pause` and `resume`, which can be used to improve timings by focusing only on
     * the actual logic of that action. The third parameter is called `cancel`, and will prevent the log function from being run
     */
    time(logLevel, messages, action) {
        //call the log if loglevel is in range
        if (this._logLevel >= logLevel) {
            const stopwatch = new Stopwatch_1.Stopwatch();
            const logLevelString = logger_1.LogLevelNumeric[logLevel];
            //write the initial log
            this[logLevelString](...messages !== null && messages !== void 0 ? messages : []);
            this.indent += '  ';
            let isCanceled = false;
            stopwatch.start();
            //execute the action
            const result = action(stopwatch.stop.bind(stopwatch), stopwatch.start.bind(stopwatch), () => {
                isCanceled = true;
            });
            //return a function to call when the timer is complete
            const done = () => {
                stopwatch.stop();
                this.indent = this.indent.substring(2);
                if (!isCanceled) {
                    this[logLevelString](...messages !== null && messages !== void 0 ? messages : [], `finished. (${chalk_1.default.blue(stopwatch.getDurationText())})`);
                }
            };
            //if this is a promise, wait for it to resolve and then return the original result
            if (typeof (result === null || result === void 0 ? void 0 : result.then) === 'function') {
                return Promise.resolve(result).then(done).then(() => {
                    return result;
                });
            }
            else {
                //this was not a promise. finish the timer now
                done();
                return result;
            }
        }
        else {
            return action(noop, noop, noop);
        }
    }
}
exports.Logger = Logger;
Logger.emitter = new eventemitter3_1.EventEmitter();
function noop(...args) {
}
exports.noop = noop;
var logger_2 = require("@rokucommunity/logger");
Object.defineProperty(exports, "LogLevel", { enumerable: true, get: function () { return logger_2.LogLevelNumeric; } });
//# sourceMappingURL=Logger.js.map