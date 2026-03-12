import { SourceNode } from 'source-map';
import type { Range } from 'vscode-languageserver';
import type { FileReference, TranspileResult } from '../interfaces';
import type { TranspileState } from './TranspileState';
export interface SGToken {
    text: string;
    range?: Range;
}
export interface SGAttribute {
    key: SGToken;
    openQuote?: SGToken;
    value: SGToken;
    closeQuote?: SGToken;
    range?: Range;
}
export declare class SGTag {
    tag: SGToken;
    attributes: SGAttribute[];
    range?: Range;
    constructor(tag: SGToken, attributes?: SGAttribute[], range?: Range);
    get id(): string;
    set id(value: string);
    getAttribute(name: string): SGAttribute | undefined;
    getAttributeValue(name: string): string | undefined;
    setAttribute(name: string, value: string): void;
    transpile(state: TranspileState): SourceNode;
    protected transpileBody(state: TranspileState): (string | SourceNode)[];
    protected transpileAttributes(state: TranspileState, attributes: SGAttribute[]): (string | SourceNode)[];
}
export declare class SGProlog extends SGTag {
    transpile(state: TranspileState): SourceNode;
}
export declare class SGNode extends SGTag {
    children: SGNode[];
    constructor(tag: SGToken, attributes?: SGAttribute[], children?: SGNode[], range?: Range);
    protected transpileBody(state: TranspileState): (string | SourceNode)[];
}
export declare class SGChildren extends SGNode {
    constructor(tag?: SGToken, children?: SGNode[], range?: Range);
}
export declare class SGScript extends SGTag {
    cdata?: SGToken;
    constructor(tag?: SGToken, attributes?: SGAttribute[], cdata?: SGToken, range?: Range);
    get type(): string;
    set type(value: string);
    get uri(): string;
    set uri(value: string);
    protected transpileBody(state: TranspileState): (string | SourceNode)[];
    protected transpileAttributes(state: TranspileState, attributes: SGAttribute[]): (string | SourceNode)[];
}
export declare class SGField extends SGTag {
    constructor(tag?: SGToken, attributes?: SGAttribute[], range?: Range);
    get type(): string;
    set type(value: string);
    get alias(): string;
    set alias(value: string);
    get value(): string;
    set value(value: string);
    get onChange(): string;
    set onChange(value: string);
    get alwaysNotify(): string;
    set alwaysNotify(value: string);
}
export declare const SGFieldTypes: string[];
export declare class SGFunction extends SGTag {
    constructor(tag?: SGToken, attributes?: SGAttribute[], range?: Range);
    get name(): string;
    set name(value: string);
}
export declare class SGInterface extends SGTag {
    fields: SGField[];
    functions: SGFunction[];
    constructor(tag?: SGToken, content?: SGTag[], range?: Range);
    getField(id: string): SGField;
    setField(id: string, type: string, onChange?: string, alwaysNotify?: boolean, alias?: string): void;
    getFunction(name: string): SGFunction;
    setFunction(name: string): void;
    protected transpileBody(state: TranspileState): (string | SourceNode)[];
}
export declare class SGComponent extends SGTag {
    constructor(tag?: SGToken, attributes?: SGAttribute[], content?: SGTag[], range?: Range);
    api: SGInterface;
    scripts: SGScript[];
    children: SGChildren;
    customizations: SGNode[];
    get name(): string;
    set name(value: string);
    get extends(): string;
    set extends(value: string);
    protected transpileBody(state: TranspileState): (string | SourceNode)[];
}
export interface SGReferences {
    name?: SGToken;
    extends?: SGToken;
    scriptTagImports: Pick<FileReference, 'pkgPath' | 'text' | 'filePathRange'>[];
}
export declare class SGAst {
    prolog?: SGProlog;
    root?: SGTag;
    component?: SGComponent;
    constructor(prolog?: SGProlog, root?: SGTag, component?: SGComponent);
    transpile(state: TranspileState): TranspileResult;
}
