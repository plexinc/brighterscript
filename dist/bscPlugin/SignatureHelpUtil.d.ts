import type { Statement } from '../parser/AstNode';
import type { ClassStatement } from '../parser/Statement';
import type { SignatureInfoObj } from '../Program';
import type { CallExpressionInfo } from './CallExpressionInfo';
import type { FileLink } from '../interfaces';
export declare class SignatureHelpUtil {
    getSignatureHelpItems(callExpressionInfo: CallExpressionInfo): SignatureInfoObj[];
    getSignatureHelpForStatement(fileLink: FileLink<Statement>, namespaceName?: string): SignatureInfoObj;
    getClassSignatureHelp(fileLink: FileLink<ClassStatement>): SignatureInfoObj | undefined;
}
