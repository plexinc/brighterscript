"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const PathFilterer_1 = require("./PathFilterer");
const testHelpers_spec_1 = require("../testHelpers.spec");
const chai_1 = require("chai");
const util_1 = require("../util");
const sinon_1 = require("sinon");
const sinon = (0, sinon_1.createSandbox)();
describe('PathFilterer', () => {
    let filterer;
    beforeEach(() => {
        filterer = new PathFilterer_1.PathFilterer();
        sinon.restore();
    });
    afterEach(() => {
        sinon.restore();
    });
    it('allows all files through when no filters exist', () => {
        (0, chai_1.expect)(filterer.filter([
            (0, util_1.standardizePath) `${testHelpers_spec_1.rootDir}/a.brs`,
            (0, util_1.standardizePath) `${testHelpers_spec_1.rootDir}/a/b/c/d.xml`,
            (0, util_1.standardizePath) `${testHelpers_spec_1.rootDir}/e.txt`
        ])).to.eql([
            (0, util_1.standardizePath) `${testHelpers_spec_1.rootDir}/a.brs`,
            (0, util_1.standardizePath) `${testHelpers_spec_1.rootDir}/a/b/c/d.xml`,
            (0, util_1.standardizePath) `${testHelpers_spec_1.rootDir}/e.txt`
        ]);
    });
    it('supports standalone workspace style', () => {
        const filterer = new PathFilterer_1.PathCollection({
            rootDir: (0, util_1.standardizePath) `${testHelpers_spec_1.cwd}/src/lsp/standalone-project-1`,
            globs: [(0, util_1.standardizePath) `${testHelpers_spec_1.cwd}/.tmp/rootDir/source/main.bs`]
        });
        (0, chai_1.expect)(filterer.isMatch(`${testHelpers_spec_1.cwd}/.tmp/rootDir/source/main.bs`)).to.be.true;
    });
    it('filters files', () => {
        filterer.registerExcludeList(testHelpers_spec_1.rootDir, ['**/*.brs']);
        (0, chai_1.expect)(filterer.filter([
            (0, util_1.standardizePath) `${testHelpers_spec_1.rootDir}/a.brs`,
            (0, util_1.standardizePath) `${testHelpers_spec_1.rootDir}/b.txt`,
            (0, util_1.standardizePath) `${testHelpers_spec_1.rootDir}/c.brs`
        ])).to.eql([
            (0, util_1.standardizePath) `${testHelpers_spec_1.rootDir}/b.txt`
        ]);
    });
    it('filters files but re-includes them if part of an include list', () => {
        filterer.registerExcludeList(testHelpers_spec_1.rootDir, ['**/*.brs']);
        filterer.registerIncludeList(testHelpers_spec_1.rootDir, ['**/a*.brs']);
        (0, chai_1.expect)(filterer.filter([
            (0, util_1.standardizePath) `${testHelpers_spec_1.rootDir}/a.brs`,
            (0, util_1.standardizePath) `${testHelpers_spec_1.rootDir}/b.txt`,
            (0, util_1.standardizePath) `${testHelpers_spec_1.rootDir}/c.brs`
        ])).to.eql([
            (0, util_1.standardizePath) `${testHelpers_spec_1.rootDir}/a.brs`,
            (0, util_1.standardizePath) `${testHelpers_spec_1.rootDir}/b.txt`
        ]);
    });
    it('supports removing lists', () => {
        const removeExclude = filterer.registerExcludeList(testHelpers_spec_1.rootDir, ['**/*.brs']);
        const removeInclude = filterer.registerIncludeList(testHelpers_spec_1.rootDir, ['**/a*.brs']);
        (0, chai_1.expect)(filterer.filter([
            (0, util_1.standardizePath) `${testHelpers_spec_1.rootDir}/a.brs`,
            (0, util_1.standardizePath) `${testHelpers_spec_1.rootDir}/b.txt`,
            (0, util_1.standardizePath) `${testHelpers_spec_1.rootDir}/c.brs`
        ])).to.eql([
            (0, util_1.standardizePath) `${testHelpers_spec_1.rootDir}/a.brs`,
            (0, util_1.standardizePath) `${testHelpers_spec_1.rootDir}/b.txt`
        ]);
        removeInclude();
        (0, chai_1.expect)(filterer.filter([
            (0, util_1.standardizePath) `${testHelpers_spec_1.rootDir}/a.brs`,
            (0, util_1.standardizePath) `${testHelpers_spec_1.rootDir}/b.txt`,
            (0, util_1.standardizePath) `${testHelpers_spec_1.rootDir}/c.brs`
        ])).to.eql([
            (0, util_1.standardizePath) `${testHelpers_spec_1.rootDir}/b.txt`
        ]);
        removeExclude();
        (0, chai_1.expect)(filterer.filter([
            (0, util_1.standardizePath) `${testHelpers_spec_1.rootDir}/a.brs`,
            (0, util_1.standardizePath) `${testHelpers_spec_1.rootDir}/b.txt`,
            (0, util_1.standardizePath) `${testHelpers_spec_1.rootDir}/c.brs`
        ])).to.eql([
            (0, util_1.standardizePath) `${testHelpers_spec_1.rootDir}/a.brs`,
            (0, util_1.standardizePath) `${testHelpers_spec_1.rootDir}/b.txt`,
            (0, util_1.standardizePath) `${testHelpers_spec_1.rootDir}/c.brs`
        ]);
    });
    it('clear removes all exclude and include lists', () => {
        filterer.registerExcludeList(testHelpers_spec_1.rootDir, ['**/components/**/*.brs']);
        (0, chai_1.expect)(filterer.filter([
            (0, util_1.standardizePath) `${testHelpers_spec_1.rootDir}/components/a.brs`,
            (0, util_1.standardizePath) `${testHelpers_spec_1.rootDir}/components/b.brs`,
            (0, util_1.standardizePath) `${testHelpers_spec_1.rootDir}/components/c.brs`
        ])).to.eql([]);
        filterer.clear();
        (0, chai_1.expect)(filterer.filter([
            (0, util_1.standardizePath) `${testHelpers_spec_1.rootDir}/components/a.brs`,
            (0, util_1.standardizePath) `${testHelpers_spec_1.rootDir}/components/b.brs`,
            (0, util_1.standardizePath) `${testHelpers_spec_1.rootDir}/components/c.brs`
        ])).to.eql([
            (0, util_1.standardizePath) `${testHelpers_spec_1.rootDir}/components/a.brs`,
            (0, util_1.standardizePath) `${testHelpers_spec_1.rootDir}/components/b.brs`,
            (0, util_1.standardizePath) `${testHelpers_spec_1.rootDir}/components/c.brs`
        ]);
    });
    it('works with null exclude list', () => {
        filterer.registerExcludeList(testHelpers_spec_1.rootDir, null);
        (0, chai_1.expect)(filterer.filter([
            (0, util_1.standardizePath) `${testHelpers_spec_1.rootDir}/components/a.brs`,
            (0, util_1.standardizePath) `${testHelpers_spec_1.rootDir}/components/b.brs`,
            (0, util_1.standardizePath) `${testHelpers_spec_1.rootDir}/components/c.brs`
        ])).to.eql([
            (0, util_1.standardizePath) `${testHelpers_spec_1.rootDir}/components/a.brs`,
            (0, util_1.standardizePath) `${testHelpers_spec_1.rootDir}/components/b.brs`,
            (0, util_1.standardizePath) `${testHelpers_spec_1.rootDir}/components/c.brs`
        ]);
    });
    it('works with null include list', () => {
        filterer.registerExcludeList(testHelpers_spec_1.rootDir, ['**/*']);
        filterer.registerIncludeList(testHelpers_spec_1.rootDir, null);
        (0, chai_1.expect)(filterer.filter([
            (0, util_1.standardizePath) `${testHelpers_spec_1.rootDir}/components/a.brs`,
            (0, util_1.standardizePath) `${testHelpers_spec_1.rootDir}/components/b.brs`,
            (0, util_1.standardizePath) `${testHelpers_spec_1.rootDir}/components/c.brs`
        ])).to.eql([]);
    });
    describe('registerExcludeMatcher', () => {
        it('calls the callback function on every path', () => {
            const spy = sinon.spy();
            filterer.registerExcludeMatcher(spy);
            filterer.filter([
                (0, util_1.standardizePath) `${testHelpers_spec_1.rootDir}/a.brs`,
                (0, util_1.standardizePath) `${testHelpers_spec_1.rootDir}/b.txt`,
                (0, util_1.standardizePath) `${testHelpers_spec_1.rootDir}/c.brs`
            ]);
            (0, chai_1.expect)(spy.getCalls().map(x => (0, util_1.standardizePath) `${x.args[0]}`)).to.eql([
                (0, util_1.standardizePath) `${testHelpers_spec_1.rootDir}/a.brs`,
                (0, util_1.standardizePath) `${testHelpers_spec_1.rootDir}/b.txt`,
                (0, util_1.standardizePath) `${testHelpers_spec_1.rootDir}/c.brs`
            ]);
        });
    });
});
describe('PathCollection', () => {
    function doTest(globs, filePath, expected) {
        const collection = new PathFilterer_1.PathCollection({
            rootDir: testHelpers_spec_1.rootDir,
            globs: globs
        });
        (0, chai_1.expect)(collection.isMatch(filePath)).to.equal(expected);
    }
    it('includes a file that matches a single pattern', () => {
        doTest([
            '**/*.brs'
        ], (0, util_1.standardizePath) `${testHelpers_spec_1.rootDir}/alpha.brs`, true);
    });
    it('includes a file that matches the 2nd pattern', () => {
        doTest([
            '**/*beta*.brs',
            '**/*alpha*.brs'
        ], (0, util_1.standardizePath) `${testHelpers_spec_1.rootDir}/alpha.brs`, true);
    });
    it('includes a file that is included then excluded then included again', () => {
        doTest([
            '**/*.brs',
            '!**/a*.brs',
            '**/alpha.brs'
        ], (0, util_1.standardizePath) `${testHelpers_spec_1.rootDir}/alpha.brs`, true);
    });
    it('excludes a file that does not match the pattern', () => {
        doTest([
            '**/beta.brs'
        ], (0, util_1.standardizePath) `${testHelpers_spec_1.rootDir}/alpha.brs`, false);
    });
    it('excludes a file that matches first pattern but is excluded from the second pattern', () => {
        doTest([
            '**/*.brs',
            '!**/alpha.brs'
        ], (0, util_1.standardizePath) `${testHelpers_spec_1.rootDir}/alpha.brs`, false);
    });
});
//# sourceMappingURL=PathFilterer.spec.js.map