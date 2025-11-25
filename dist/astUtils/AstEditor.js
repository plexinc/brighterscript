"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AstEditor = void 0;
class AstEditor {
    constructor() {
        this.changes = [];
    }
    /**
     * Indicates whether the editor have changes that were applied
     */
    get hasChanges() {
        return this.changes.length > 0;
    }
    /**
     * Change the value of an object's property
     */
    setProperty(obj, key, newValue) {
        const change = new EditPropertyChange(obj, key, newValue);
        this.changes.push(change);
        change.apply();
    }
    /**
     * Remove a property from an object
     */
    removeProperty(obj, key) {
        const change = new RemovePropertyChange(obj, key);
        this.changes.push(change);
        change.apply();
    }
    /**
     * Set custom text that will be emitted during transpile instead of the original text.
     */
    overrideTranspileResult(node, value) {
        this.setProperty(node, 'transpile', (state) => {
            return [
                state.sourceNode(node, value)
            ];
        });
    }
    /**
     * Insert an element into an array at the specified index
     */
    addToArray(array, index, newValue) {
        const change = new AddToArrayChange(array, index, newValue);
        this.changes.push(change);
        change.apply();
    }
    /**
     * Removes elements from an array and, if necessary, inserts new elements in their place, returning the deleted elements.
     * @param array the array to splice
     * @param startIndex The zero-based location in the array from which to start removing elements.
     * @param deleteCount The number of elements to remove.
     * @param items Elements to insert into the array in place of the deleted elements.
     */
    arraySplice(array, startIndex, deleteCount, ...items) {
        const change = new ArraySpliceChange(array, startIndex, deleteCount, items);
        this.changes.push(change);
        change.apply();
    }
    /**
     * Push one or more values to the end of an array
     */
    arrayPush(array, ...newValues) {
        const change = new ArrayPushChange(array, newValues);
        this.changes.push(change);
        change.apply();
    }
    /**
     * Pop an item from the end of the array
     */
    arrayPop(array) {
        const result = array[array.length - 1];
        this.removeFromArray(array, array.length - 1);
        return result;
    }
    /**
     * Removes the first element from an array and returns that removed element. This method changes the length of the array.
     */
    arrayShift(array) {
        const result = array[0];
        this.removeFromArray(array, 0);
        return result;
    }
    /**
     * Adds one or more elements to the beginning of an array and returns the new length of the array.
     */
    arrayUnshift(array, ...items) {
        const change = new ArrayUnshiftChange(array, items);
        this.changes.push(change);
        change.apply();
    }
    /**
     * Change the value of an item in an array at the specified index
     */
    setArrayValue(array, index, newValue) {
        this.setProperty(array, index, newValue);
    }
    /**
     * Remove an element from an array at the specified index
     */
    removeFromArray(array, index) {
        const change = new RemoveFromArrayChange(array, index);
        this.changes.push(change);
        change.apply();
    }
    /**
     * Add a custom edit. Provide custom `apply` and `undo` functions to apply the change and then undo the change
     */
    edit(onApply, onUndo) {
        const change = new ManualChange(onApply, onUndo);
        this.changes.push(change);
        return change.apply();
    }
    /**
     * Unto all changes.
     */
    undoAll() {
        for (let i = this.changes.length - 1; i >= 0; i--) {
            this.changes[i].undo();
        }
        this.changes = [];
    }
}
exports.AstEditor = AstEditor;
class EditPropertyChange {
    constructor(obj, propertyName, newValue) {
        this.obj = obj;
        this.propertyName = propertyName;
        this.newValue = newValue;
    }
    apply() {
        this.originalValue = this.obj[this.propertyName];
        this.obj[this.propertyName] = this.newValue;
    }
    undo() {
        this.obj[this.propertyName] = this.originalValue;
    }
}
class RemovePropertyChange {
    constructor(obj, propertyName) {
        this.obj = obj;
        this.propertyName = propertyName;
    }
    apply() {
        this.keyExistedBeforeChange = this.obj.hasOwnProperty(this.propertyName);
        this.originalValue = this.obj[this.propertyName];
        delete this.obj[this.propertyName];
    }
    undo() {
        if (this.keyExistedBeforeChange) {
            this.obj[this.propertyName] = this.originalValue;
        }
    }
}
class AddToArrayChange {
    constructor(array, index, newValue) {
        this.array = array;
        this.index = index;
        this.newValue = newValue;
    }
    apply() {
        this.array.splice(this.index, 0, this.newValue);
    }
    undo() {
        this.array.splice(this.index, 1);
    }
}
/**
 * Remove an item from an array
 */
class RemoveFromArrayChange {
    constructor(array, index) {
        this.array = array;
        this.index = index;
    }
    apply() {
        [this.originalValue] = this.array.splice(this.index, 1);
    }
    undo() {
        this.array.splice(this.index, 0, this.originalValue);
    }
}
class ArrayPushChange {
    constructor(array, newValues) {
        this.array = array;
        this.newValues = newValues;
    }
    apply() {
        this.array.push(...this.newValues);
    }
    undo() {
        this.array.splice(this.array.length - this.newValues.length, this.newValues.length);
    }
}
class ArraySpliceChange {
    constructor(array, startIndex, deleteCount, newValues) {
        this.array = array;
        this.startIndex = startIndex;
        this.deleteCount = deleteCount;
        this.newValues = newValues;
    }
    apply() {
        this.deletedItems = this.array.splice(this.startIndex, this.deleteCount, ...this.newValues);
        return [...this.deletedItems];
    }
    undo() {
        this.array.splice(this.startIndex, this.newValues.length, ...this.deletedItems);
    }
}
class ArrayUnshiftChange {
    constructor(array, newValues) {
        this.array = array;
        this.newValues = newValues;
    }
    apply() {
        this.array.unshift(...this.newValues);
    }
    undo() {
        this.array.splice(0, this.newValues.length);
    }
}
/**
 * A manual change. This will allow the consumer to define custom `apply` and `undo` functions to apply the change and then undo the change
 */
class ManualChange {
    constructor(_apply, _undo) {
        this._apply = _apply;
        this._undo = _undo;
    }
    apply() {
        var _a;
        return (_a = this._apply) === null || _a === void 0 ? void 0 : _a.call(this, this);
    }
    undo() {
        var _a;
        (_a = this._undo) === null || _a === void 0 ? void 0 : _a.call(this, this);
    }
}
//# sourceMappingURL=AstEditor.js.map