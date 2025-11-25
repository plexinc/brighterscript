import type { Range } from 'vscode-languageserver';
import type { BscFile, BsDiagnostic, CommentFlag, DiagnosticCode } from './interfaces';
export declare class CommentFlagProcessor {
    /**
     * The file this processor applies to
     */
    file: BscFile;
    /**
     * An array of strings containing the types of text that a comment starts with. (i.e. `REM`, `'`, `<!--`)
     */
    commentStarters: string[];
    /**
     * Valid diagnostic codes. Codes NOT in this list will be flagged
     */
    diagnosticCodes: DiagnosticCode[];
    /**
     * Diagnostic codes to never filter (these codes will always be flagged)
     */
    ignoreDiagnosticCodes: DiagnosticCode[];
    constructor(
    /**
     * The file this processor applies to
     */
    file: BscFile, 
    /**
     * An array of strings containing the types of text that a comment starts with. (i.e. `REM`, `'`, `<!--`)
     */
    commentStarters?: string[], 
    /**
     * Valid diagnostic codes. Codes NOT in this list will be flagged
     */
    diagnosticCodes?: DiagnosticCode[], 
    /**
     * Diagnostic codes to never filter (these codes will always be flagged)
     */
    ignoreDiagnosticCodes?: DiagnosticCode[]);
    /**
     * List of comment flags generated during processing
     */
    commentFlags: CommentFlag[];
    /**
     * List of diagnostics generated during processing
     */
    diagnostics: BsDiagnostic[];
    /**
     * A list of all codes EXCEPT the ones in `ignoreDiagnosticCodes`
     */
    allCodesExceptIgnores: DiagnosticCode[];
    tryAdd(text: string, range: Range): void;
    /**
     * Small tokenizer for bs:disable comments
     */
    private tokenize;
    /**
     * Given a string, extract each item split by whitespace
     * @param text the text to tokenize
     */
    private tokenizeByWhitespace;
}
