"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fsExtra = require("fs");
const chai_config_spec_1 = require("../chai-config.spec");
const Manifest_1 = require("./Manifest");
const sinon_1 = require("sinon");
const testHelpers_spec_1 = require("../testHelpers.spec");
const sinon = (0, sinon_1.createSandbox)();
describe('manifest support', () => {
    beforeEach(() => {
        sinon.restore();
    });
    afterEach(() => {
        sinon.restore();
    });
    describe('manifest parser', () => {
        it('returns an empty map if manifest not found', async () => {
            sinon.stub(fsExtra, 'readFile').returns(Promise.reject(new Error('File not found')));
            return (0, chai_config_spec_1.expect)(await (0, Manifest_1.getManifest)('/no/manifest/here')).to.eql(new Map());
        });
        it('rejects key-value pairs with no \'=\'', () => {
            (0, testHelpers_spec_1.expectThrows)(() => {
                (0, Manifest_1.parseManifest)('key');
            });
        });
        it('ignores comments', () => {
            return (0, chai_config_spec_1.expect)((0, Manifest_1.parseManifest)('')).to.eql(new Map());
        });
        it('retains whitespace for keys and values', () => {
            (0, chai_config_spec_1.expect)((0, testHelpers_spec_1.mapToObject)((0, Manifest_1.parseManifest)(' leading interum and trailing key spaces = value '))).to.eql({
                ' leading interum and trailing key spaces ': ' value '
            });
        });
        it('does not convert values to primitives', () => {
            (0, chai_config_spec_1.expect)((0, testHelpers_spec_1.mapToObject)((0, Manifest_1.parseManifest)((0, testHelpers_spec_1.trim) `
                        name=bob
                        age=12
                        enabled=true
                        height=1.5
                    `))).to.eql({
                name: 'bob',
                age: '12',
                enabled: 'true',
                height: '1.5'
            });
        });
    });
    describe('bs_const parser', () => {
        function test(manifest, expected) {
            (0, chai_config_spec_1.expect)((0, Manifest_1.getBsConst)((0, Manifest_1.parseManifest)(manifest))).to.eql((0, testHelpers_spec_1.objectToMap)(expected));
        }
        it('returns an empty map if \'bs_const\' isn\'t found', () => {
            test('', new Map());
        });
        it('ignores empty key-value pairs', () => {
            test('bs_const=;;;;', new Map());
        });
        it('rejects key-value pairs with no \'=\'', () => {
            (0, testHelpers_spec_1.expectThrows)(() => test(`bs_const=i-have-no-equal`, {}), `No '=' detected for key i-have-no-equal.  bs_const constants must be of the form 'key=value'.`);
        });
        it('trims whitespace from keys and values', () => {
            let manifest = new Map([['bs_const', '   key   =  true  ']]);
            (0, chai_config_spec_1.expect)((0, Manifest_1.getBsConst)(manifest)).to.eql(new Map([['key', true]]));
        });
        it('rejects non-boolean values', () => {
            const manifest = new Map([['bs_const', 'string=word']]);
            (0, testHelpers_spec_1.expectThrows)(() => {
                (0, Manifest_1.getBsConst)(manifest);
            });
        });
        it('allows case-insensitive booleans', () => {
            let manifest = new Map([['bs_const', 'foo=true;bar=FalSE']]);
            (0, chai_config_spec_1.expect)((0, Manifest_1.getBsConst)(manifest)).to.eql(new Map([
                ['foo', true],
                ['bar', false]
            ]));
        });
    });
});
//# sourceMappingURL=Manifest.spec.js.map