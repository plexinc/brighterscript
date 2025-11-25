import type { SGChildren, SGComponent, SGField, SGFunction, SGInterface, SGNode, SGScript, SGTag } from '../parser/SGTypes';
export declare function isSGComponent(tag: SGTag): tag is SGComponent;
export declare function isSGInterface(tag: SGTag): tag is SGInterface;
export declare function isSGScript(tag: SGTag): tag is SGScript;
export declare function isSGChildren(tag: SGTag): tag is SGChildren;
export declare function isSGField(tag: SGTag): tag is SGField;
export declare function isSGFunction(tag: SGTag): tag is SGFunction;
export declare function isSGNode(tag: SGTag): tag is SGNode;
export declare function isSGCustomization(tag: SGTag): tag is SGNode;
