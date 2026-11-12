import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {GAME_VERSION,BUILD_ID} from '../src/core/build-info.js';
const expected=JSON.parse(await readFile(new URL('../build-info.json',import.meta.url),'utf8'));
assert.equal(GAME_VERSION,expected.version,'runtime version must match packaged metadata');
assert.equal(BUILD_ID,expected.build,'runtime build must match packaged metadata');
console.log(`Build labels agree: ${GAME_VERSION} / ${BUILD_ID}`);
