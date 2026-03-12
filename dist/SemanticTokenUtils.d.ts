import type { SemanticTokensLegend } from 'vscode-languageserver-protocol/node';
import { SemanticTokenModifiers } from 'vscode-languageserver-protocol/node';
import type { SemanticToken } from './interfaces';
export declare const semanticTokensLegend: SemanticTokensLegend;
/**
 * The LSP has a very specific format for semantic tokens, so this encodes our internal representation into the LSP format.
 * Currently all tokens must be single-line
 * See for more info: https://microsoft.github.io/language-server-protocol/specifications/specification-current/#textDocument_semanticTokens
 */
export declare function encodeSemanticTokens(tokens: SemanticToken[]): number[];
/**
 * Convert an array of strings into a binary bitflag integer, where each non-zero bit indiciates the index of the modifier from `semanticTokensLegend.tokenModifiers`
 */
export declare function getModifierBitFlags(modifiers: SemanticTokenModifiers[]): number;
