"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_config_spec_1 = require("./chai-config.spec");
const DiagnosticFilterer_1 = require("./DiagnosticFilterer");
const util_1 = require("./util");
const sinon_1 = require("sinon");
const sinon = (0, sinon_1.createSandbox)();
let rootDir = (0, util_1.standardizePath) `${process.cwd()}/rootDir`;
describe('DiagnosticFilterer', () => {
    let filterer;
    let options = {
        rootDir: rootDir,
        diagnosticFilters: [
            //ignore these codes globally
            { codes: [1, 2, 3, 'X4'] },
            //ignore all codes from lib
            { src: 'lib/**/*.brs' },
            //ignore all codes from `packages` with absolute path
            { src: `${rootDir}/packages/**/*.brs` },
            //ignore specific codes for main.brs
            { src: 'source/main.brs', codes: [4] }
        ]
    };
    afterEach(() => {
        sinon.restore();
    });
    beforeEach(() => {
        filterer = new DiagnosticFilterer_1.DiagnosticFilterer();
    });
    describe('filter', () => {
        it('removes duplicates', () => {
            let diagnostic = getDiagnostic(100, `${rootDir}/source/common.brs`);
            (0, chai_config_spec_1.expect)(filterer.filter(options, [diagnostic, diagnostic])).to.eql([diagnostic]);
        });
        it('uses global code filter', () => {
            (0, chai_config_spec_1.expect)(filterer.filter(options, [
                getDiagnostic(1, `${rootDir}/source/common.brs`),
                getDiagnostic(2, `${rootDir}/source/common.brs`),
                getDiagnostic(4, `${rootDir}/source/common.brs`),
                getDiagnostic('X4', `${rootDir}/source/common.brs`)
            ]).map(x => x.code)).to.eql([4]);
        });
        it('works with relative src globs', () => {
            (0, chai_config_spec_1.expect)(filterer.filter(options, [
                getDiagnostic(10, `${rootDir}/source/common.brs`),
                getDiagnostic(11, `${rootDir}/lib/a.brs`),
                getDiagnostic(12, `${rootDir}/lib/a/b/b.brs`),
                getDiagnostic(13, `${rootDir}/lib/a/b/c/c.brs`) //remove
            ]).map(x => x.code)).to.eql([10]);
        });
        it('works with absolute src globs', () => {
            (0, chai_config_spec_1.expect)(filterer.filter(options, [
                getDiagnostic(10, `${rootDir}/source/common.brs`),
                getDiagnostic(11, `${rootDir}/packages/a.brs`),
                getDiagnostic(12, `${rootDir}/packages/a/b/b.brs`),
                getDiagnostic(13, `${rootDir}/packages/a/b/c/c.brs`),
                getDiagnostic('X14', `${rootDir}/packages/a/b/c/c.brs`) //remove
            ]).map(x => x.code)).to.eql([10]);
        });
        it('works with single file src glob', () => {
            (0, chai_config_spec_1.expect)(filterer.filter(options, [
                getDiagnostic(4, `${rootDir}/source/main.brs`),
                getDiagnostic(11, `${rootDir}/common/a.brs`),
                getDiagnostic(12, `${rootDir}/common/a/b/b.brs`),
                getDiagnostic(13, `${rootDir}/common/a/b/c/c.brs`),
                getDiagnostic('X14', `${rootDir}/common/a/b/c/c.brs`) //keep
            ]).map(x => x.code)).to.eql([11, 12, 13, 'X14']);
        });
        describe('with negative globs', () => {
            let optionsWithNegatives = {
                rootDir: rootDir,
                diagnosticFilters: [
                    //ignore these codes globally
                    { codes: [1, 2] },
                    3,
                    4,
                    //ignore all codes from lib
                    { src: 'lib/**/*.brs' },
                    //un-ignore specific errors from lib/special
                    { src: '!lib/special/**/*.brs', codes: [1, 2, 3] },
                    //re-ignore errors from one extra special file
                    { src: 'lib/special/all-reignored.brs' },
                    //un-ignore all codes from third special file
                    { src: '!lib/special/all-unignored.brs' },
                    //un-ignore code 5 globally
                    { src: '!*/**/*', codes: [5] },
                    //re-ignore code 10 globally, overriding previous unignores
                    { codes: [10] }
                ]
            };
            it('should unignore specific error codes for specific files', () => {
                (0, chai_config_spec_1.expect)(filterer.filter(optionsWithNegatives, [
                    getDiagnostic(1, `${rootDir}/lib/special/a.brs`),
                    getDiagnostic(3, `${rootDir}/lib/special/a.brs`),
                    getDiagnostic(7, `${rootDir}/lib/special/a.brs`) //remove
                ]).map(x => x.code)).to.eql([1, 3]);
            });
            it('should unignore all codes from specific file', () => {
                (0, chai_config_spec_1.expect)(filterer.filter(optionsWithNegatives, [
                    getDiagnostic(1, `${rootDir}/lib/special/all-unignored.brs`),
                    getDiagnostic(2, `${rootDir}/lib/special/all-unignored.brs`),
                    getDiagnostic(3, `${rootDir}/lib/special/all-unignored.brs`),
                    getDiagnostic(4, `${rootDir}/lib/special/all-unignored.brs`) //keep
                ]).map(x => x.code)).to.eql([1, 2, 3, 4]);
            });
            it('should re-ignore errors', () => {
                (0, chai_config_spec_1.expect)(filterer.filter(optionsWithNegatives, [
                    getDiagnostic(1, `${rootDir}/lib/special/all-reignored.brs`),
                    getDiagnostic(10, `${rootDir}/lib/special/a.brs`) //remove
                ]).map(x => x.code)).to.eql([]);
            });
            it('should unignore errors globally by using "*/**/*" glob', () => {
                (0, chai_config_spec_1.expect)(filterer.filter(optionsWithNegatives, [
                    getDiagnostic(5, `${rootDir}/lib/a/b/c.brs`) //keep
                ]).map(x => x.code)).to.eql([5]);
            });
        });
    });
    describe('standardizeDiagnosticFilters', () => {
        it('handles null and falsey diagnostic filters', () => {
            (0, chai_config_spec_1.expect)(filterer.getDiagnosticFilters({
                diagnosticFilters: [null, undefined, false, true]
            })).to.eql([]);
        });
        it('handles a completely empty diagnostic filter', () => {
            (0, chai_config_spec_1.expect)(filterer.getDiagnosticFilters({
                diagnosticFilters: [{}]
            })).to.eql([]);
        });
        it('handles number diagnostic filters', () => {
            (0, chai_config_spec_1.expect)(filterer.getDiagnosticFilters({
                diagnosticFilters: [1, 2, 3]
            })).to.eql([
                { codes: [1], isNegative: false },
                { codes: [2], isNegative: false },
                { codes: [3], isNegative: false }
            ]);
        });
        it('handles standard diagnostic filters', () => {
            (0, chai_config_spec_1.expect)(filterer.getDiagnosticFilters({
                diagnosticFilters: [{ src: 'file.brs', codes: [1, 2, 'X3'] }]
            })).to.eql([{ src: 'file.brs', codes: [1, 2, 'X3'], isNegative: false }]);
        });
        it('handles string-only diagnostic filter object', () => {
            (0, chai_config_spec_1.expect)(filterer.getDiagnosticFilters({
                diagnosticFilters: [{ src: 'file.brs' }]
            })).to.eql([{ src: 'file.brs', isNegative: false }]);
        });
        it('handles code-only diagnostic filter object', () => {
            (0, chai_config_spec_1.expect)(filterer.getDiagnosticFilters({
                diagnosticFilters: [{ codes: [1, 2, 'X3'] }]
            })).to.eql([
                { codes: [1, 2, 'X3'], isNegative: false }
            ]);
        });
        it('handles string diagnostic filter', () => {
            (0, chai_config_spec_1.expect)(filterer.getDiagnosticFilters({
                diagnosticFilters: ['file.brs']
            })).to.eql([{ src: 'file.brs', isNegative: false }]);
        });
        it('converts ignoreErrorCodes to diagnosticFilters', () => {
            (0, chai_config_spec_1.expect)(filterer.getDiagnosticFilters({
                ignoreErrorCodes: [1, 2, 'X3']
            })).to.eql([
                { codes: [1, 2, 'X3'], isNegative: false }
            ]);
        });
        it('handles negative globs in bare strings', () => {
            (0, chai_config_spec_1.expect)(filterer.getDiagnosticFilters({
                diagnosticFilters: ['!file.brs']
            })).to.eql([
                { src: 'file.brs', isNegative: true }
            ]);
        });
        it('handles negative globs in objects', () => {
            (0, chai_config_spec_1.expect)(filterer.getDiagnosticFilters({
                diagnosticFilters: [
                    {
                        src: '!file.brs'
                    }
                ]
            })).to.eql([
                { src: 'file.brs', isNegative: true }
            ]);
        });
        it('handles negative globs with codes', () => {
            (0, chai_config_spec_1.expect)(filterer.getDiagnosticFilters({
                diagnosticFilters: [
                    {
                        src: '!file.brs',
                        codes: [1, 2, 3]
                    }
                ]
            })).to.eql([
                { src: 'file.brs', codes: [1, 2, 3], isNegative: true }
            ]);
        });
    });
    it('only filters by file once per unique file (case-insensitive)', () => {
        const stub = sinon.stub(filterer, 'filterFile').returns(null);
        filterer.filter(options, [
            getDiagnostic(1, (0, util_1.standardizePath) `${rootDir}/source/common1.brs`),
            getDiagnostic(2, (0, util_1.standardizePath) `${rootDir}/source/Common1.brs`),
            getDiagnostic(3, (0, util_1.standardizePath) `${rootDir}/source/common2.brs`),
            getDiagnostic(4, (0, util_1.standardizePath) `${rootDir}/source/Common2.brs`)
        ]);
        (0, chai_config_spec_1.expect)(stub.callCount).to.eql(2);
        (0, chai_config_spec_1.expect)(stub.getCalls().map(x => x.args[1])).to.eql([
            (0, util_1.standardizePath) `${rootDir.toLowerCase()}/source/common1.brs`,
            (0, util_1.standardizePath) `${rootDir.toLowerCase()}/source/common2.brs`
        ]);
    });
});
function getDiagnostic(code, srcPath) {
    return {
        file: {
            srcPath: (0, util_1.standardizePath) `${srcPath}`
        },
        code: code
    };
}
//# sourceMappingURL=DiagnosticFilterer.spec.js.map