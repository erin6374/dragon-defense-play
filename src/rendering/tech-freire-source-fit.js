// Source-calibrated Tech Freire FBX geometry partition.
// The two flanking masses are DIFFERENT BUILDINGS, not school wings.
// All three share the single source uniform scale and source ground datum.
// Coordinates refer to the original FBX AFTER correcting Z-up to Y-up.
export const SCHOOL_SOURCE={
  frontPlaneZ:44.63,roofY:74.6,groundY:0,
  facadeMinX:-26.86,facadeMaxX:43.81,
  keepMinX:-30.5,keepMaxX:47.0,keepMinZ:-112,keepMaxZ:52.4,
  originalBounds:{min:[-44.859,-15.323,-145.998],max:[78.850,89.288,52.392]},
  reference:'Original FBX measured façade; side masses are independent rowhouses'
};
export const SCHOOL_TARGET={aboveGroundRoofHeight:28.0,streetFrontZ:0.4,centerX:0};
export const ARCHITECTURAL_ZONES={
  leftRowhouse:{minX:-45.2,maxX:-30.5},
  school:{minX:-30.5,maxX:47.0},
  rightRowhouse:{minX:47.0,maxX:79.2}
};
export function fitSchoolFromFacade(source=SCHOOL_SOURCE,target=SCHOOL_TARGET){
 const unitScale=target.aboveGroundRoofHeight/(source.roofY-source.groundY);
 const facadeCenter=(source.facadeMinX+source.facadeMaxX)*.5;
 const worldTranslation={x:target.centerX-unitScale*facadeCenter,y:-source.groundY*unitScale,z:target.streetFrontZ-source.frontPlaneZ*unitScale};
 return {scale:unitScale,translation:worldTranslation,facadeWidth:(source.facadeMaxX-source.facadeMinX)*unitScale,
  aboveGroundHeight:(source.roofY-source.groundY)*unitScale,frontZ:target.streetFrontZ,
  basementBelowStreet:(source.groundY-source.originalBounds.min[1])*unitScale,
  roofHeight:target.aboveGroundRoofHeight,maxSourceDepth:(source.frontPlaneZ-source.keepMinZ)*unitScale,
  aspect:(source.facadeMaxX-source.facadeMinX)/(source.roofY-source.groundY),isUniform:true};
}
// These visible source objects use Revit mass/fixture names rather than
// wall, roof, or door categories. The broad reference volumes Mass 5 and 90
// are excluded because they overlap the actual detail geometry.
const exteriorSourceObjects=/^Mass_(?:2_Mass_2_323677|3_Mass_3_323978|4_Mass_4_324226|93_Mass_93_971579)$|_(?:577139|971789|1545270|1545272|1545274)$/;
// These exported masonry returns occupy the gaps between the side party-wall
// bays. Keep their exact FBX geometry, including the adjoining openings.
const sideMasonry=/_(319636|319768|319855|319942|320026|320638|320784|320869|321343|322923|323025|323346|356207|361315|361796|361964|362038|363387|363517|449495|450412|496180|496314|496450|496592)$/;
export function architecturalMeshEligible(mesh,box){
 const tag=((mesh.name||'')+' '+(mesh.parent?.name||'')).toLowerCase();
 const needed=/wall|floor|slab|roof|window|glaz|panel|curtain|mullion|frame|column|beam|door|stair|railing|cornice|parapet|foundation|glass|ramp|storefront|handrail|rail|structural|lintel|baluster|baseboard|trim|sill|top_rail/.test(tag);
 const nuisance=/desk|chair|furniture|table|locker|outlet|lighting|fixture|sink|toilet|plumbing|sprinkler|diffuser|duct|terminal|receptacle|equipment|casework|cabinet|_led_|student_|mass_5|floorcolumn|exterior_mass/.test(tag);
 if((!needed||nuisance)&&!exteriorSourceObjects.test(mesh.name||'')&&!sideMasonry.test(mesh.name||''))return false;
 if(box.min.y < -18||box.max.y > 90)return false;
 if(box.min.z < -148||box.max.z > 53)return false;
 return true;
}
// A mesh belongs to exactly ONE building.  Choose the zone containing its
// horizontal midpoint, then reject huge cross-building outliers.  This avoids
// triple-rendering a large slab in multiple render layers.
export function classifyArchitecturalMesh(mesh,box){
 if(!architecturalMeshEligible(mesh,box))return null;
 const x=(box.min.x+box.max.x)*.5;
 const width=box.max.x-box.min.x;
 if(width>82)return null;
 if(x>=ARCHITECTURAL_ZONES.leftRowhouse.minX && x<ARCHITECTURAL_ZONES.leftRowhouse.maxX){
  // Rowhouse masses are adjacent to the Broad Street façade, not deep school wings.
  return box.max.z>=-22?'leftRowhouse':null;
 }
 if(x>=ARCHITECTURAL_ZONES.school.minX && x<=ARCHITECTURAL_ZONES.school.maxX){
  if(box.min.z<SCHOOL_SOURCE.keepMinZ||box.max.z>SCHOOL_SOURCE.keepMaxZ)return null;
  return 'school';
 }
 if(x>ARCHITECTURAL_ZONES.rightRowhouse.minX && x<=ARCHITECTURAL_ZONES.rightRowhouse.maxX){
  return box.max.z>=-22?'rightRowhouse':null;
 }
 return null;
}
export function keepArchitecturalMesh(mesh,box){return classifyArchitecturalMesh(mesh,box)==='school';}
