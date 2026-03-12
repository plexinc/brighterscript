/**
 * A cache that will call the factory to create the item if it doesn't exist
 */
export declare class Cache<TKey = any, TValue = any> extends Map<TKey, TValue> {
    /**
     * Get value from the cache if it exists,
     * otherwise call the factory function to create the value, add it to the cache, and return it.
     */
    getOrAdd<R extends TValue = TValue>(key: TKey, factory: (key: TKey) => R): R;
    /**
     * Get the item with the specified key.
     */
    get<R extends TValue = TValue>(key: TKey): R;
}
