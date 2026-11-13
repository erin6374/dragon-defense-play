import fs from 'node:fs';
import assert from 'node:assert/strict';
// Explicit diagnostic: a passing canvas-only atlas test does not establish
// that the atlas is reachable from the live game scene.
const game=fs.readFileSync(new URL('../src/game.js',import.meta.url),'utf8');
const flanking=fs.readFileSync(new URL('../src/rendering/school-flanking-houses.js',import.meta.url),'utf8');
const atlas=fs.readFileSync(new URL('../src/rendering/facade-atlas.js',import.meta.url),'utf8');
const uncomment=s=>s.replace(/\/\*[\s\S]*?\*\//g,'').replace(/(^|\s)\/\/[^\n]*/g,'$1');
const code=uncomment(game);
const imported=/import\s*\{\s*installSchoolFlankingHouses\s*\}\s*from\s*['"]\.\/rendering\/school-flanking-houses\.js['"]/.test(code);
const calls=(code.match(/\binstallSchoolFlankingHouses\s*\(/g)||[]).length;
const atlasUsed=/\bcreateFacadeAtlas\s*\(/.test(uncomment(flanking));
assert.match(atlas,/export\s+function\s+createFacadeAtlas\s*\(/);
assert.ok(imported&&atlasUsed,'Facade atlas reference chain changed; re-review reachability');
const active=calls>0;
console.log(JSON.stringify({facadeAtlasImportedThroughFlanking:imported,flankingCallsFromGame:calls,active,artAcceptance:active?'visual-review-required':'no-live-facade-atlas-rendering'},null,2));
if(process.argv.includes('--require-active'))assert.ok(active,'Facade atlas is not invoked by the live game; canvas contract PASS does not prove rendered changes');
