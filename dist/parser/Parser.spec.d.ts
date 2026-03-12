import { Range } from 'vscode-languageserver';
import type { Statement } from './AstNode';
export declare function rangeToArray(range: Range): number[];
export declare function failStatementType(stat: Statement, type: string): void;
