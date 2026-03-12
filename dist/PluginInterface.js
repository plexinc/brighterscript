"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const logging_1 = require("./logging");
class PluginInterface {
    constructor(plugins, options) {
        var _a;
        this.plugins = plugins;
        (_a = this.plugins) !== null && _a !== void 0 ? _a : (this.plugins = []);
        if ((options === null || options === void 0 ? void 0 : options.constructor.name) === 'Logger') {
            this.logger = options;
        }
        else {
            this.logger = options === null || options === void 0 ? void 0 : options.logger;
            this.suppressErrors = (options === null || options === void 0 ? void 0 : options.suppressErrors) === false ? false : true;
        }
        if (!this.logger) {
            this.logger = (0, logging_1.createLogger)();
        }
    }
    /**
     * Call `event` on plugins
     */
    emit(event, ...args) {
        for (let plugin of this.plugins) {
            if (plugin[event]) {
                try {
                    this.logger.time(logging_1.LogLevel.debug, [plugin.name, event], () => {
                        plugin[event](...args);
                    });
                }
                catch (err) {
                    this.logger.error(`Error when calling plugin ${plugin.name}.${event}:`, err);
                    if (!this.suppressErrors) {
                        throw err;
                    }
                }
            }
        }
    }
    /**
     * Add a plugin to the beginning of the list of plugins
     */
    addFirst(plugin) {
        if (!this.has(plugin)) {
            this.plugins.unshift(plugin);
        }
        return plugin;
    }
    /**
     * Add a plugin to the end of the list of plugins
     */
    add(plugin) {
        if (!this.has(plugin)) {
            this.plugins.push(plugin);
        }
        return plugin;
    }
    has(plugin) {
        return this.plugins.includes(plugin);
    }
    remove(plugin) {
        if (this.has(plugin)) {
            this.plugins.splice(this.plugins.indexOf(plugin));
        }
        return plugin;
    }
    /**
     * Remove all plugins
     */
    clear() {
        this.plugins = [];
    }
}
exports.default = PluginInterface;
//# sourceMappingURL=PluginInterface.js.map