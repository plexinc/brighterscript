import type { AstNode } from '../parser/AstNode';
export declare class AstEditor {
    private changes;
    /**
     * Indicates whether the editor have changes that were applied
     */
    get hasChanges(): boolean;
    /**
     * Change the value of an object's property
     */
    setProperty<T, K extends keyof T>(obj: T, key: K, newValue: T[K]): void;
    /**
     * Remove a property from an object
     */
    removeProperty<T, K extends keyof T>(obj: T, key: K): void;
    /**
     * Set custom text that will be emitted during transpile instead of the original text.
     */
    overrideTranspileResult(node: AstNode, value: string): void;
    /**
     * Insert an element into an array at the specified index
     */
    addToArray<T extends any[]>(array: T, index: number, newValue: T[0]): void;
    /**
     * Removes elements from an array and, if necessary, inserts new elements in their place, returning the deleted elements.
     * @param array the array to splice
     * @param startIndex The zero-based location in the array from which to start removing elements.
     * @param deleteCount The number of elements to remove.
     * @param items Elements to insert into the array in place of the deleted elements.
     */
    arraySplice<T, TItems extends T = T>(array: T[], startIndex: number, deleteCount: number, ...items: TItems[]): void;
    /**
     * Push one or more values to the end of an array
     */
    arrayPush<T, TItems extends T = T>(array: T[], ...newValues: TItems[]): void;
    /**
     * Pop an item from the end of the array
     */
    arrayPop<T extends any[]>(array: T): any;
    /**
     * Removes the first element from an array and returns that removed element. This method changes the length of the array.
     */
    arrayShift<T extends any[]>(array: T): any;
    /**
     * Adds one or more elements to the beginning of an array and returns the new length of the array.
     */
    arrayUnshift<T extends any[], TItems extends T = T>(array: T, ...items: TItems): void;
    /**
     * Change the value of an item in an array at the specified index
     */
    setArrayValue<T extends any[], K extends keyof T>(array: T, index: number, newValue: T[K]): void;
    /**
     * Remove an element from an array at the specified index
     */
    removeFromArray<T extends any[]>(array: T, index: number): void;
    /**
     * Add a custom edit. Provide custom `apply` and `undo` functions to apply the change and then undo the change
     */
    edit<T>(onApply: (data: Record<string, any>) => T, onUndo: (data: Record<string, any>) => void): T;
    /**
     * Unto all changes.
     */
    undoAll(): void;
}
