import type { Location, Position } from 'vscode-languageserver';
import { Scope } from './Scope';
import type { XmlFile } from './files/XmlFile';
import type { BscFile, CallableContainerMap } from './interfaces';
import type { Program } from './Program';
export declare class XmlScope extends Scope {
    xmlFile: XmlFile;
    program: Program;
    constructor(xmlFile: XmlFile, program: Program);
    get dependencyGraphKey(): string;
    /**
     * Get the parent scope of this scope. If we could find the scope for our parentComponent, use that.
     * Otherwise default to global scope
     */
    getParentScope(): Scope;
    protected _validate(callableContainerMap: CallableContainerMap): void;
    private diagnosticValidateInterface;
    private diagnosticMissingAttribute;
    /**
     * Detect when a child has imported a script that an ancestor also imported
     */
    private diagnosticDetectDuplicateAncestorScriptImports;
    getAllFiles(): BscFile[];
    /**
     * Get the list of files referenced by this scope that are actually loaded in the program.
     * This does not account for parent scope.
     */
    getOwnFiles(): BscFile[];
    /**
     * Get the definition (where was this thing first defined) of the symbol under the position
     * @deprecated use `DefinitionProvider.process()`
     */
    getDefinition(file: BscFile, position: Position): Location[];
}
