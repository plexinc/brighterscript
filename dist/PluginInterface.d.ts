import type { Plugin } from './interfaces';
import type { Logger } from './logging';
export declare type PluginEventArgs<T> = {
    [K in keyof Required<T> as Required<T>[K] extends (...args: any[]) => any ? K : never]: Required<T>[K] extends (...args: any[]) => any ? Parameters<Required<T>[K]> : never;
};
export default class PluginInterface<T extends Plugin = Plugin> {
    private plugins?;
    constructor();
    /**
     * @deprecated use the `options` parameter pattern instead
     */
    constructor(plugins?: Plugin[], logger?: Logger);
    constructor(plugins?: Plugin[], options?: {
        logger?: Logger;
        suppressErrors?: boolean;
    });
    private logger;
    /**
     * Should plugin errors cause the program to fail, or should they be caught and simply logged
     */
    private suppressErrors;
    /**
     * Call `event` on plugins
     */
    emit<K extends keyof PluginEventArgs<T> & string>(event: K, ...args: PluginEventArgs<T>[K]): void;
    /**
     * Add a plugin to the beginning of the list of plugins
     */
    addFirst<T extends Plugin = Plugin>(plugin: T): T;
    /**
     * Add a plugin to the end of the list of plugins
     */
    add<T extends Plugin = Plugin>(plugin: T): T;
    has(plugin: Plugin): boolean;
    remove<T extends Plugin = Plugin>(plugin: T): T;
    /**
     * Remove all plugins
     */
    clear(): void;
}
