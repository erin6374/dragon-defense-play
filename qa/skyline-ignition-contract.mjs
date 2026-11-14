// RC51: skyline fire ignition must follow actual meteor contacts; not art or FPS approval.
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const game=readFileSync(new URL('../src/game.js',import.meta.url),'utf8');
const skyline=readFileSync(new URL('../src/rendering/philadelphia-geometry-skyline.js',import.meta.url),'utf8');
assert.ok(game.includes('skylineBackdrop.strikeNearest('),'meteor strike must contact skyline facade');
assert.ok(skyline.includes('function strikeNearest('),'meteor-linked skyline strike entry missing');
assert.ok(skyline.includes('tower.impactLocal.copy(hit.point)'),'impact and fire must share facade contact');
assert.ok(game.includes('skylineBackdrop.setDamage(skylineDamage)'),'retain atmospheric skyline damage');
assert.ok(!game.includes('skylineFires.push('),'legacy random fire spawning returned');
assert.ok(!game.includes('const skylineFlameMat='),'legacy random fire material returned');
assert.ok(!game.includes('smokeCanvas='),'unused procedural smoke startup canvas returned');
assert.ok(game.includes('skylineFires:skylineBackdrop.towers.filter(t=>skylineBackdrop.fireState(t).active).length'),'QA fire count must use meteor-linked sites');
console.log('RC51 meteor-contact skyline ignition source contract PASS');
