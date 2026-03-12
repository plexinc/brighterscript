import type { Diagnostic, Range } from 'vscode-languageserver';
import { SGAst } from './SGTypes';
import type { SGReferences } from './SGTypes';
export default class SGParser {
    /**
     * The AST of the XML document, not including the inline scripts
     */
    ast: SGAst;
    tokens: IToken[];
    /**
     * The list of diagnostics found during the parse process
     */
    diagnostics: Diagnostic[];
    private pkgPath;
    private _references;
    /**
     * These are initially extracted during parse-time, but will also be dynamically regenerated if need be.
     *
     * If a plugin modifies the AST, then the plugin should call SGAst#invalidateReferences() to force this object to refresh
     */
    get references(): SGReferences;
    /**
     * Invalidates (clears) the references collection. This should be called anytime the AST has been manipulated.
     */
    invalidateReferences(): void;
    /**
     * Walk the AST to extract references to useful bits of information
     */
    private findReferences;
    parse(pkgPath: string, fileContents: string): void;
}
interface IToken {
    image: string;
    startOffset: number;
    startLine?: number;
    startColumn?: number;
    endOffset?: number;
    endLine?: number;
    endColumn?: number;
}
export declare function rangeFromTokenValue(token: IToken): Range;
export {};
