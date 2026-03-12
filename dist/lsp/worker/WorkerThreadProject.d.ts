import type { LspDiagnostic, ActivateResponse, ProjectConfig } from '../LspProject';
import { type LspProject } from '../LspProject';
import { WorkerPool } from './WorkerPool';
import type { Hover, MaybePromise, SemanticToken } from '../../interfaces';
import type { DocumentAction, DocumentActionWithStatus } from '../DocumentManager';
import type { FileTranspileResult, SignatureInfoObj } from '../../Program';
import type { Position, Range, Location, DocumentSymbol, WorkspaceSymbol, CodeAction, CompletionList } from 'vscode-languageserver-protocol';
import type { Logger } from '../../logging';
export declare const workerPool: WorkerPool;
export declare class WorkerThreadProject implements LspProject {
    constructor(options?: {
        logger?: Logger;
    });
    activate(options: ProjectConfig): Promise<ActivateResponse>;
    logger: Logger;
    isStandaloneProject: boolean;
    private activationDeferred;
    /**
     * Options used to activate this project
     */
    activateOptions: ProjectConfig;
    /**
     * The root directory of the project
     */
    rootDir: string;
    /**
     * The file patterns from bsconfig.json that were used to find all files for this project
     */
    filePatterns: string[];
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
     * The worker thread where the actual project will execute
     */
    private worker;
    /**
     * Path to the project. For directory-only projects, this is the path to the dir. For bsconfig.json projects, this is the path to the config.
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
     * Promise that resolves when the project finishes activating
     * @returns a promise that resolves when the project finishes activating
     */
    whenActivated(): Promise<void>;
    /**
     * Validate the project. This will trigger a full validation on any scopes that were changed since the last validation,
     * and will also eventually emit a new 'diagnostics' event that includes all diagnostics for the project
     */
    validate(): Promise<void>;
    /**
     * Cancel any active validation that's running
     */
    cancelValidate(): Promise<void>;
    getDiagnostics(): Promise<LspDiagnostic[]>;
    /**
     * Apply a series of file changes to the project. This is safe to call any time. Changes will be queued and flushed at the correct times
     * during the program's lifecycle flow
     */
    applyFileChanges(documentActions: DocumentAction[]): Promise<DocumentActionWithStatus[]>;
    /**
     * Send a request with the standard structure
     * @param name the name of the request
     * @param data the array of data to send
     * @returns the response from the request
     */
    private sendStandardRequest;
    /**
     * Get the full list of semantic tokens for the given file path
     */
    getSemanticTokens(options: {
        srcPath: string;
    }): Promise<SemanticToken[]>;
    transpileFile(options: {
        srcPath: string;
    }): Promise<FileTranspileResult>;
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
    }): Promise<CodeAction[]>;
    getCompletions(options: {
        srcPath: string;
        position: Position;
    }): Promise<CompletionList>;
    /**
     * Handles request/response/update messages from the worker thread
     */
    private messageHandler;
    private processRequest;
    private processUpdate;
    on(eventName: 'critical-failure', handler: (data: {
        message: string;
    }) => void): any;
    on(eventName: 'diagnostics', handler: (data: {
        diagnostics: LspDiagnostic[];
    }) => MaybePromise<void>): any;
    on(eventName: 'all', handler: (eventName: string, data: any) => MaybePromise<void>): any;
    private emit;
    private emitter;
    disposables: LspProject['disposables'];
    dispose(): void;
}
