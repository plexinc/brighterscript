import { Logger } from '@rokucommunity/logger';
declare const logger: Logger;
/**
 * Set the logger properties to be used when running in language server mode. It's a function so we can share the logic between LanguageServer and
 * the workerThread projects that don't inherit the same logger instance
 */
export declare function setLspLoggerProps(): void;
export declare const createLogger: {
    (): Logger;
    (prefix: string): Logger;
    (options: Partial<import("@rokucommunity/logger").LoggerOptions>): Logger;
};
export { logger, Logger };
export { LogLevel } from './Logger';
