"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const testHelpers_spec_1 = require("../../../testHelpers.spec");
const testHelpers_spec_2 = require("../../../testHelpers.spec");
const Program_1 = require("../../../Program");
describe('UnaryExpression', () => {
    let program;
    const testTranspile = (0, testHelpers_spec_1.getTestTranspile)(() => [program, testHelpers_spec_2.rootDir]);
    beforeEach(() => {
        program = new Program_1.Program({
            rootDir: testHelpers_spec_2.rootDir
        });
    });
    it('handles advanced cases', () => {
        const { file } = testTranspile(`
            Sub Main()
                x = 96
                y = 56
                w = 1088
                h = 608
                Offset(-x + 96, -y + 56, -w + 1088, -h + 608)
                print -1000 +1000
                foo = 5
                if not foo = 1
                    print "foo is not 1"
                end if
            End Sub
            Sub Offset(x, y, w, h)
                print x.toStr() + y.toStr() + w.toStr() + h.toStr()
            End Sub
        `, `
            Sub Main()
                x = 96
                y = 56
                w = 1088
                h = 608
                Offset(-x + 96, -y + 56, -w + 1088, -h + 608)
                print -1000 + 1000
                foo = 5
                if not foo = 1
                    print "foo is not 1"
                end if
            End Sub

            Sub Offset(x, y, w, h)
                print x.toStr() + y.toStr() + w.toStr() + h.toStr()
            End Sub
        `);
        (0, testHelpers_spec_1.expectZeroDiagnostics)(file);
    });
});
//# sourceMappingURL=UnaryExpression.spec.js.map