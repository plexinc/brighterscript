"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ajv_1 = require("ajv");
const fsExtra = require("fs-extra");
describe('bsconfig', () => {
    it('is valid json schema', () => {
        const schema = fsExtra.readJsonSync(`${__dirname}/../bsconfig.schema.json`);
        const ajv = new ajv_1.default({
            strict: true
        });
        //register `deprecationMessage` as a supported keyword
        ajv.addKeyword('deprecationMessage');
        try {
            ajv.compile(schema, true);
        }
        catch (e) {
            e.message = 'bsconfig.schema.json has schema errors: ' + e.message;
            throw e;
        }
    });
});
//# sourceMappingURL=BsConfig.spec.js.map