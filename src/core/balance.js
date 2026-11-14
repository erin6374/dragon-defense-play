/** Deterministic, engine-independent wave pacing. Unity migration reference. */
export function clampWave(value){const n=Number(value);return Number.isFinite(n)?Math.max(1,Math.min(50,Math.floor(n))):1;}
export function waveBudget(wave, difficulty='normal'){
 const w=clampWave(wave),easy=difficulty==='easy',hard=difficulty==='hard';
 const regular=(easy?4:hard?22:7)+Math.round(Math.min(48,w*(easy?1.5:hard?3.8:2.5)));
 const spawnBase=Math.max(easy?1.35:hard?.24:.48,(easy?2.5:hard?.70:1.3)-w*(easy?.025:hard?.055:.045));
 const hunterMinInterval=Math.max(hard?2.1:2.8,(hard?7:9)-w*.38);
 return {regular:Math.round(regular*(hard?1.35:1)),spawnBase,hunterMinInterval,breakSeconds:4.5,rapidFireEvery:5,rapidFireSeconds:4,shieldSeconds:9};
}
export function hunterSteering(remaining){return Math.max(0,remaining)>0;}
