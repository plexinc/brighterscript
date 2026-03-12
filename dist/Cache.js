"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Cache = void 0;
/**
 * A cache that will call the factory to create the item if it doesn't exist
 */
class Cache extends Map {
    /**
     * Get value from the cache if it exists,
     * otherwise call the factory function to create the value, add it to the cache, and return it.
     */
    getOrAdd(key, factory) {
        if (!this.has(key)) {
            const value = factory(key);
            this.set(key, value);
            return value;
        }
        else {
            return this.get(key);
        }
    }
    /**
     * Get the item with the specified key.
     */
    get(key) {
        return super.get(key);
    }
}
exports.Cache = Cache;
//# sourceMappingURL=Cache.js.map