// Engine-independent bounded fixed-step scheduler. Avoids unbounded catch-up spirals.
export function createFixedStep({step=1/60,maxSteps=3,maxFrame=0.1}={}) {
 let accumulator=0, dropped=0;
 return { advance(delta,update) {
  accumulator+=Math.max(0,Math.min(delta,maxFrame));let steps=0;
  while(accumulator>=step&&steps<maxSteps){update(step);accumulator-=step;steps++;}
  if(accumulator>=step){dropped+=Math.floor(accumulator/step);accumulator%=step;}
  return {steps,alpha:accumulator/step,dropped};
 }, reset(){accumulator=0;dropped=0;} };
}
