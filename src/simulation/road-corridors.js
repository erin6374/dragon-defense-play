import { JUNCTIONS,curbAt,BROAD_EXTENTS } from '../../broad-street/broad-street-grid-data.mjs';
import { VIEWER_TO_GAME_X,VIEWER_TO_GAME_Z } from './viewer-parcels.js';

export const CROSS_STREETS=JUNCTIONS.map(({name,x,half})=>({name,x:x+VIEWER_TO_GAME_X,roadHalfWidth:half}));
export const CROSS_STREET_X=CROSS_STREETS.map(street=>street.x);
export const BROAD_LANES=[10,13.5,19,23];
export const BROAD_CENTER=16.25;
export const BROAD_X=BROAD_EXTENTS.map(x=>x+VIEWER_TO_GAME_X);

export function isBroadRoad(x,z){
 if(x<BROAD_X[0]||x>BROAD_X[1])return false;
 const [min,max]=curbAt(x-VIEWER_TO_GAME_X);
 return z>=min+VIEWER_TO_GAME_Z&&z<=max+VIEWER_TO_GAME_Z;
}

export function occupiesCrossStreet(x,buildingWidth=0,clearance=4.5){
 return roadClearance(x,buildingWidth)<clearance;
}

export function roadClearance(x,buildingWidth=0){
 return Math.min(...CROSS_STREETS.map(street=>Math.abs(x-street.x)-street.roadHalfWidth-buildingWidth*.5));
}
