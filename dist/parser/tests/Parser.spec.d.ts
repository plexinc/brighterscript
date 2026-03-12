import type { Token } from '../../lexer/Token';
import { TokenKind } from '../../lexer/TokenKind';
import type { Range } from 'vscode-languageserver';
/**
 * Creates a token with the given `kind` and (optional) `literal` value.
 */
export declare function token(kind: TokenKind, text?: string): Token;
/**
 * Creates an Identifier token with the given `text`.
 */
export declare function identifier(text: string): Token;
/**
 * Test whether a range matches a group of elements with a `range`
 */
export declare function rangeMatch(range: Range, elements: ({
    range: Range;
})[]): boolean;
/** An end-of-file token. */
export declare const EOF: Token;
