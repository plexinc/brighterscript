"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getBsConst = exports.parseManifest = exports.getManifest = void 0;
const fsExtra = require("fs-extra");
const path = require("path");
/**
 * Attempts to read a `manifest` file, parsing its contents into a map of string to JavaScript
 * number, string, or boolean.
 * @param rootDir the root directory in which a `manifest` file is expected
 * @returns a Promise that resolves to a map of string to JavaScript number, string, or boolean,
 *          representing the manifest file's contents
 */
async function getManifest(rootDir) {
    let manifestPath = path.join(rootDir, 'manifest');
    let contents;
    try {
        contents = await fsExtra.readFile(manifestPath, 'utf-8');
    }
    catch (err) {
        return new Map();
    }
    return parseManifest(contents);
}
exports.getManifest = getManifest;
/**
 * Attempts to parse a `manifest` file's contents into a map of string to JavaScript
 * number, string, or boolean.
 * @param contents the text contents of a manifest file.
 * @returns a Promise that resolves to a map of string to JavaScript number, string, or boolean,
 *          representing the manifest file's contents
 */
function parseManifest(contents) {
    const lines = contents.split(/\r?\n/g);
    const result = new Map();
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        // skip empty lines and comments
        if (line.trim() === '' || line.trim().startsWith('#')) {
            continue;
        }
        let equalIndex = line.indexOf('=');
        if (equalIndex === -1) {
            throw new Error(`[manifest:${i + 1}] No '=' detected.  Manifest attributes must be of the form 'key=value'.`);
        }
        const key = line.slice(0, equalIndex);
        const value = line.slice(equalIndex + 1);
        result.set(key, value);
    }
    return result;
}
exports.parseManifest = parseManifest;
/**
 * Parses a 'manifest' file's `bs_const` property into a map of key to boolean value.
 * @param manifest the internal representation of the 'manifest' file to extract `bs_const` from
 * @returns a map of key to boolean value representing the `bs_const` attribute, or an empty map if
 *          no `bs_const` attribute is found.
 */
function getBsConst(manifest, toLowerKeys = true) {
    if (!manifest.has('bs_const')) {
        return new Map();
    }
    let bsConstString = manifest.get('bs_const');
    if (typeof bsConstString !== 'string') {
        throw new Error('Invalid bs_const right-hand side.  bs_const must be a string of \';\'-separated \'key=value\' pairs');
    }
    let keyValuePairs = bsConstString
        // for each key-value pair
        .split(';')
        // ignore empty key-value pairs
        .filter(keyValuePair => !!keyValuePair)
        // separate keys and values
        .map(keyValuePair => {
        let equals = keyValuePair.indexOf('=');
        if (equals === -1) {
            throw new Error(`No '=' detected for key ${keyValuePair}.  bs_const constants must be of the form 'key=value'.`);
        }
        return [keyValuePair.slice(0, equals), keyValuePair.slice(equals + 1)];
    })
        // remove leading/trailing whitespace from keys and values, and force everything to lower case
        .map(([key, value]) => [toLowerKeys ? key.trim().toLowerCase() : key.trim(), value.trim().toLowerCase()])
        // convert value to boolean or throw
        .map(([key, value]) => {
        if (value.toLowerCase() === 'true') {
            return [key, true];
        }
        if (value.toLowerCase() === 'false') {
            return [key, false];
        }
        throw new Error(`Invalid value for bs_const key '${key}'.  Values must be either 'true' or 'false'.`);
    });
    return new Map(keyValuePairs);
}
exports.getBsConst = getBsConst;
//# sourceMappingURL=Manifest.js.map