"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const DiagnosticCollection_1 = require("./DiagnosticCollection");
const util_1 = require("./util");
const chai_config_spec_1 = require("./chai-config.spec");
const vscode_uri_1 = require("vscode-uri");
const testHelpers_spec_1 = require("./testHelpers.spec");
const path = require("path");
const util_2 = require("./util");
const creators_1 = require("./astUtils/creators");
describe('DiagnosticCollection', () => {
    let collection;
    let projectId;
    beforeEach(() => {
        collection = new DiagnosticCollection_1.DiagnosticCollection();
        projectId = 1;
    });
    function testPatch(options) {
        var _a, _b, _c;
        const patch = collection.getPatch((_a = options.projectId) !== null && _a !== void 0 ? _a : projectId, createDiagnostics((_b = options.diagnosticsByFile) !== null && _b !== void 0 ? _b : {}));
        //convert the patch into our test structure
        const actual = {};
        for (let filePath in patch) {
            filePath = path.resolve(testHelpers_spec_1.rootDir, filePath);
            actual[filePath] = patch[filePath].map(x => x.message);
        }
        //sanitize expected paths
        let expected = {};
        for (let key in (_c = options.expected) !== null && _c !== void 0 ? _c : {}) {
            const srcPath = (0, util_2.standardizePath)(path.resolve(testHelpers_spec_1.rootDir, key));
            expected[srcPath] = options.expected[key];
        }
        (0, chai_config_spec_1.expect)(actual).to.eql(expected);
    }
    it('computes patch for empty diagnostics', () => {
        //start with 1 diagnostic
        testPatch({
            diagnosticsByFile: {
                'source/file1.brs': ['message1']
            },
            expected: {
                'source/file1.brs': ['message1']
            }
        });
    });
    it('computes patch for specific project', () => {
        //should be all diagnostics from project1
        testPatch({
            projectId: 1,
            diagnosticsByFile: {
                'alpha.brs': ['a1', 'a2'],
                'beta.brs': ['b1', 'b2']
            },
            expected: {
                'alpha.brs': ['a1', 'a2'],
                'beta.brs': ['b1', 'b2']
            }
        });
        //set project2 diagnostics that overlap a little with project1
        testPatch({
            projectId: 2,
            diagnosticsByFile: {
                'beta.brs': ['b2', 'b3'],
                'charlie.brs': ['c1', 'c2']
            },
            //the patch should only include new diagnostics
            expected: {
                'beta.brs': ['b1', 'b2', 'b3'],
                'charlie.brs': ['c1', 'c2']
            }
        });
        //set project 1 diagnostics again (same diagnostics)
        testPatch({
            projectId: 1,
            diagnosticsByFile: {
                'alpha.brs': ['a1', 'a2'],
                'beta.brs': ['b1', 'b2']
            },
            //patch should be empty because nothing changed
            expected: {}
        });
    });
    it('does not crash for diagnostics with missing locations', () => {
        const d1 = {
            code: 123,
            range: undefined,
            uri: undefined,
            message: 'I have no location'
        };
        testPatch({
            diagnosticsByFile: {
                'source/file1.brs': [d1]
            },
            expected: {
                'source/file1.brs': ['I have no location']
            }
        });
    });
    it('returns full list of diagnostics on first call, and nothing on second call', () => {
        //first patch should return all
        testPatch({
            diagnosticsByFile: {
                'file1.brs': ['message1', 'message2'],
                'file2.brs': ['message3', 'message4']
            },
            expected: {
                'file1.brs': ['message1', 'message2'],
                'file2.brs': ['message3', 'message4']
            }
        });
        //second patch should return empty (because nothing has changed)
        testPatch({
            diagnosticsByFile: {
                'file1.brs': ['message1', 'message2'],
                'file2.brs': ['message3', 'message4']
            },
            expected: {}
        });
    });
    it('removes diagnostics in patch', () => {
        //first patch should return all
        testPatch({
            diagnosticsByFile: {
                'file1.brs': ['message1', 'message2'],
                'file2.brs': ['message3', 'message4']
            },
            expected: {
                'file1.brs': ['message1', 'message2'],
                'file2.brs': ['message3', 'message4']
            }
        });
        //removing the diagnostics should result in a new patch with those diagnostics removed
        testPatch({
            diagnosticsByFile: {
                'file1.brs': [],
                'file2.brs': ['message3', 'message4']
            },
            expected: {
                'file1.brs': []
            }
        });
    });
    it('adds diagnostics in patch', () => {
        testPatch({
            diagnosticsByFile: {
                'file1.brs': ['message1', 'message2']
            },
            expected: {
                'file1.brs': ['message1', 'message2']
            }
        });
        testPatch({
            diagnosticsByFile: {
                'file1.brs': ['message1', 'message2'],
                'file2.brs': ['message3', 'message4']
            },
            expected: {
                'file2.brs': ['message3', 'message4']
            }
        });
    });
    it('sends full list when file diagnostics have changed', () => {
        testPatch({
            diagnosticsByFile: {
                'file1.brs': ['message1', 'message2']
            },
            expected: {
                'file1.brs': ['message1', 'message2']
            }
        });
        testPatch({
            diagnosticsByFile: {
                'file1.brs': ['message1', 'message2', 'message3', 'message4']
            },
            expected: {
                'file1.brs': ['message1', 'message2', 'message3', 'message4']
            }
        });
    });
    it('handles when diagnostics.projects is already defined and already includes this project', () => {
        testPatch({
            diagnosticsByFile: {
                'file1.brs': [{
                        message: 'message1',
                        range: creators_1.interpolatedRange,
                        uri: undefined,
                        projects: [projectId]
                    }]
            },
            expected: {
                'file1.brs': ['message1']
            }
        });
    });
    describe('getRemovedPatch', () => {
        it('returns empty array for file that was removed', () => {
            collection['previousDiagnosticsByFile'] = {
                [`lib1.brs`]: []
            };
            (0, chai_config_spec_1.expect)(collection['getRemovedPatch']({
                [`lib2.brs`]: []
            })).to.eql({
                [`lib1.brs`]: []
            });
        });
    });
    describe('diagnosticListsAreIdentical', () => {
        it('returns false for different diagnostics in same-sized list', () => {
            (0, chai_config_spec_1.expect)(collection['diagnosticListsAreIdentical']([
                { key: 'one' }
            ], [
                { key: 'two' }
            ])).to.be.false;
        });
    });
    function createDiagnostics(diagnosticsByFile) {
        const newDiagnostics = [];
        for (let [srcPath, diagnostics] of Object.entries(diagnosticsByFile)) {
            srcPath = path.resolve(testHelpers_spec_1.rootDir, srcPath);
            for (const d of diagnostics) {
                let diagnostic = d;
                if (typeof d === 'string') {
                    diagnostic = {
                        uri: undefined,
                        range: util_1.default.createRange(0, 0, 0, 0),
                        //the code doesn't matter as long as the messages are different, so just enforce unique messages for this test files
                        code: 123,
                        message: d
                    };
                }
                diagnostic.uri = vscode_uri_1.URI.file(srcPath).toString();
                newDiagnostics.push(diagnostic);
            }
        }
        return newDiagnostics;
    }
});
//# sourceMappingURL=DiagnosticCollection.spec.js.map