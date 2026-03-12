import { BrsFile } from './files/BrsFile';
import type { Callable } from './interfaces';
export declare let globalFile: BrsFile;
declare type GlobalCallable = Pick<Callable, 'name' | 'shortDescription' | 'type' | 'file' | 'params' | 'documentation' | 'isDeprecated' | 'nameRange'>;
export declare let globalCallables: GlobalCallable[];
/**
 * A map of all built-in function names. We use this extensively in scope validation
 * so keep a single copy in memory to improve performance
 */
export declare const globalCallableMap: Map<string, Callable>;
export {};
