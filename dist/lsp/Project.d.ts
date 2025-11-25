import type { ProjectConfig, ActivateResponse, LspDiagnostic, LspProject } from './LspProject';
import type { Hover, MaybePromise } from '../interfaces';
import type { DocumentSymbol, Position, Range, Location, WorkspaceSymbol } from 'vscode-languageserver-protocol';
import { CompletionList } from 'vscode-languageserver-protocol';
import type { DocumentAction, DocumentActionWithStatus } from './DocumentManager';
import type { SignatureInfoObj } from '../Program';
import type { BsConfig } from '../BsConfig';
import type { Logger } from '../logging';
export declare class Project implements LspProject {
    constructor(options?: {
        logger?: Logger;
    });
    /**
     * Activates this project. Every call to `activate` should completely reset the project, clear all used ram and start from scratch.
     */
    activate(options: ProjectConfig): Promise<ActivateResponse>;
    isStandaloneProject: boolean;
    logger: Logger;
    /**
     * Options used to activate this project
     */
    activateOptions: ProjectConfig;
    get rootDir(): string;
    /**
     * The file patterns from bsconfig.json that were used to find all files for this project
     */
    get filePatterns(): string[];
    /**
     * Gets resolved when the project has finished activating
     */
    private activationDeferred;
    /**
     * Promise that resolves when the project finishes activating
     * @returns a promise that resolves when the project finishes activating
     */
    whenActivated(): Promise<void>;
    private validationCancelToken;
    /**
     * Validate the project. This will trigger a full validation on any scopes that were changed since the last validation,
     * and will also eventually emit a new 'diagnostics' event that includes all diagnostics for the project.
     *
     * This will cancel any currently running validation and then run a new one.
     */
    validate(): Promise<void>;
    /**
     * Cancel any active running validation
     */
    cancelValidate(): void;
    getDiagnostics(): {
        uri: string;
        range: Range;
        severity?: import("vscode-languageserver-types").DiagnosticSeverity;
        code?: string | number;
        codeDescription?: import("vscode-languageserver-types").CodeDescription;
        source?: string;
        message: string;
        tags?: import("vscode-languageserver-types").DiagnosticTag[];
        relatedInformation?: import("vscode-languageserver-types").DiagnosticRelatedInformation[];
        data?: any;
    }[];
    /**
     * Promise that resolves the next time the system is idle. If the system is already idle, it will resolve immediately
     */
    private onIdle;
    /**
     * Add or replace the in-memory contents of the file at the specified path. This is typically called as the user is typing.
     * This will cancel any pending validation cycles and queue a future validation cycle instead.
     */
    applyFileChanges(documentActions: DocumentAction[]): Promise<DocumentActionWithStatus[]>;
    /**
     * Determine if this project will accept the file at the specified path (i.e. does it match a pattern in the project's files array)
     */
    static willAcceptFile(srcPath: string, files: BsConfig['files'], rootDir: string): boolean;
    /**
     * Set new contents for a file. This is safe to call any time. Changes will be queued and flushed at the correct times
     * during the program's lifecycle flow
     * @param srcPath absolute source path of the file
     * @param fileContents the text contents of the file
     * @returns true if this program accepted and added the file. false if the program didn't want the file, or if the contents didn't change
     */
    private setFile;
    /**
     * Remove the in-memory file at the specified path. This is typically called when the user (or file system watcher) triggers a file delete
     * @param srcPath absolute path to the File
     * @returns true if we found and removed at least one file, or false if no files were removed
     */
    private removeFileOrDirectory;
    /**
     * Get the full list of semantic tokens for the given file path
     * @param options options for getting semantic tokens
     * @param options.srcPath absolute path to the source file
     */
    getSemanticTokens(options: {
        srcPath: string;
    }): Promise<import("../interfaces").SemanticToken[]>;
    transpileFile(options: {
        srcPath: string;
    }): Promise<import("../Program").FileTranspileResult>;
    getHover(options: {
        srcPath: string;
        position: Position;
    }): Promise<Hover[]>;
    getDefinition(options: {
        srcPath: string;
        position: Position;
    }): Promise<Location[]>;
    getSignatureHelp(options: {
        srcPath: string;
        position: Position;
    }): Promise<SignatureInfoObj[]>;
    getDocumentSymbol(options: {
        srcPath: string;
    }): Promise<DocumentSymbol[]>;
    getWorkspaceSymbol(): Promise<WorkspaceSymbol[]>;
    getReferences(options: {
        srcPath: string;
        position: Position;
    }): Promise<Location[]>;
    getCodeActions(options: {
        srcPath: string;
        range: Range;
    }): Promise<import("vscode-languageserver-types").CodeAction[]>;
    getCompletions(options: {
        srcPath: string;
        position: Position;
    }): Promise<CompletionList>;
    /**
     * Manages the BrighterScript program. The main interface into the compiler/validator
     */
    private builder;
    /**
     * A unique key to represent this project. The format of this key may change, but it will always be unique to this project and can be used for comparison purposes.
     *
     * For directory-only projects, this is the path to the dir. For bsconfig.json projects, this is the path to the config file (typically bsconfig.json).
     */
    projectKey: string;
    /**
     * The directory for the root of this project (typically where the bsconfig.json or manifest is located)
     */
    projectDir: string;
    /**
     * A unique number for this project, generated during this current language server session. Mostly used so we can identify which project is doing logging
     */
    projectNumber: number;
    /**
     * The path to the workspace where this project resides. A workspace can have multiple projects (by adding a bsconfig.json to each folder).
     * Defaults to `.projectPath` if not set
     */
    workspaceFolder: string;
    /**
     * Path to a bsconfig.json file that will be used for this project
     */
    bsconfigPath?: string;
    /**
     * The contents of the bsconfig.json file. This is used to detect when the bsconfig file has not actually been changed (even if the fs says it did).
     *
     * Only available after `.activate()` has completed.
     * @deprecated do not depend on this property. This will certainly be removed in a future release
     */
    bsconfigFileContents?: string;
    /**
     * Find the path to the bsconfig.json file for this project
     * @returns path to bsconfig.json, or undefined if unable to find it
     */
    private getConfigFilePath;
    on(eventName: 'validate-begin', handler: (data: any) => MaybePromise<void>): any;
    on(eventName: 'validate-end', handler: (data: any) => MaybePromise<void>): any;
    on(eventName: 'critical-failure', handler: (data: {
        message: string;
    }) => MaybePromise<void>): any;
    on(eventName: 'diagnostics', handler: (data: {
        diagnostics: LspDiagnostic[];
    }) => MaybePromise<void>): any;
    on(eventName: 'all', handler: (eventName: string, data: any) => MaybePromise<void>): any;
    private emit;
    private emitter;
    disposables: LspProject['disposables'];
    dispose(): void;
}
