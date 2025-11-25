"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_config_spec_1 = require("../../chai-config.spec");
const Program_1 = require("../../Program");
const util_1 = require("../../util");
let rootDir = (0, util_1.standardizePath) `${process.cwd()}/rootDir`;
const sinon_1 = require("sinon");
const ReferencesProvider_1 = require("./ReferencesProvider");
const vscode_uri_1 = require("vscode-uri");
const sinon = (0, sinon_1.createSandbox)();
describe('ReferencesProvider', () => {
    let program;
    beforeEach(() => {
        program = new Program_1.Program({
            rootDir: rootDir
        });
        sinon.restore();
    });
    afterEach(() => {
        program.dispose();
        sinon.restore();
    });
    it('handles unknown file type', () => {
        const result = new ReferencesProvider_1.ReferencesProvider({
            program: program,
            file: undefined,
            position: util_1.util.createPosition(1, 2),
            references: []
        }).process();
        (0, chai_config_spec_1.expect)(result).to.eql([]);
    });
    it('finds references for variables in same function', () => {
        const file = program.setFile('source/main.brs', `
            sub main()
                name = "John"
                print name
                name = name + " Doe"
            end sub
        `);
        (0, chai_config_spec_1.expect)(util_1.util.sortByRange(program.getReferences('source/main.brs', util_1.util.createPosition(3, 25))).map(locationToString)).to.eql([
            (0, util_1.standardizePath) `${file.srcPath}:2:16-2:20`,
            (0, util_1.standardizePath) `${file.srcPath}:3:22-3:26`,
            (0, util_1.standardizePath) `${file.srcPath}:4:16-4:20`,
            (0, util_1.standardizePath) `${file.srcPath}:4:23-4:27`
        ]);
    });
    function locationToString(loc) {
        return `${vscode_uri_1.URI.parse(loc.uri).fsPath}:${loc.range.start.line}:${loc.range.start.character}-${loc.range.end.line}:${loc.range.end.character}`;
    }
});
//# sourceMappingURL=ReferencesProvider.spec.js.map