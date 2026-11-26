// Historical-image precedence for urban infill. We assume the photographed
// building is the current model when earlier imagery shows an empty lot.
// Image capture date is NOT the acquisition date of the panorama.
export const POLICY_VERSION='20.0.0';
export function chooseBuiltEvidence(observations=[]){
 const usable=observations.filter(x=>x&&typeof x.date==='string');
 const built=usable.filter(x=>/^(building|building-visible|partial-street-photo)$/.test(x.observation));
 const empty=usable.filter(x=>/^(vacant|vacant-or-construction|construction-or-vacant|unconfirmed-preconstruction)$/.test(x.observation));
 const sort=(a,b)=>a.date.localeCompare(b.date);
 if(built.length){const best=built.sort(sort).at(-1);
  return {decision:'retain-newer-built-structure',source:best.source,imageryDate:best.date,
   olderVacantImages:empty.filter(x=>x.date<best.date).length,
   notes:'Do not erase this building because an older image shows a gap. Independent demolition evidence must be reviewed separately.'};
 }
 return {decision:'retain-existing-GIS-massing-pending-verification',source:null,imageryDate:null,olderVacantImages:empty.length,
   notes:'No sufficiently corroborated newer building photograph; do not fabricate geometry or certify vacancy.'};
}
