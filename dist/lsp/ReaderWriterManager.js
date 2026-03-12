"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReaderWriterManager = void 0;
const deferred_1 = require("../deferred");
/**
 * Manages multiple readers and writers, and ensures that no readers are reading while a writer is writing.
 * This is useful when multiple file changes show up but we also got a completions request, so we need to wait
 * until the files have been written and the program is validated before executing the completions request
 */
class ReaderWriterManager {
    /**
     * Register a read action
     */
    read(action) {
        const reader = {
            action: action,
            deferred: new deferred_1.Deferred()
        };
        this.readers.push(reader);
        void this.execute();
        return reader.deferred.promise;
    }
    /**
     * Register a write action
     */
    write(action) {
        const writer = {
            action: action,
            deferred: new deferred_1.Deferred()
        };
        this.writers.push(writer);
        void this.execute();
        return writer.deferred.promise;
    }
    async execute() {
        let item;
        if (this.writers.length > 0) {
            item = this.writers.pop();
        }
        else if (this.readers.length > 0) {
            item = this.readers.pop();
            //there are no more readers or writers, so quit.
        }
        else {
            return;
        }
        //execute the item
        try {
            const result = await Promise.resolve(item.action());
            item.deferred.resolve(result);
        }
        catch (e) {
            item.deferred.reject(e);
        }
        //execute the next action (if there is one)
        void this.execute();
    }
}
exports.ReaderWriterManager = ReaderWriterManager;
//# sourceMappingURL=ReaderWriterManager.js.map