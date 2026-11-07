// Small, non-damaging ground response to the dragon's existing wind cone.
// Values are relative mobility, not literal vehicle mass in kilograms.
// A gust lasts 0.85 s; displacement is capped independently per target.
export function groundWindWeight(vehicle){
 if(vehicle.bike||vehicle.scooter)return 1;
 if(vehicle.bus||vehicle.fireTruck||vehicle.ladder)return .065;
 if(vehicle.garbage)return .10;
 if(vehicle.truck)return .13;
 if(vehicle.ambulance)return .18;
 if(vehicle.van)return .21;
 if(vehicle.police||vehicle.ice)return .23;
 return .30; // sedans, taxis, wagons and crossovers
}

export function groundWindStep(x,y,z,ox,oy,oz,dx,dy,dz,weight,dt){
 if(!(dt>0&&weight>0))return 0;
 const rx=x-ox,ry=y-oy,rz=z-oz;
 const along=rx*dx+ry*dy+rz*dz;
 if(along<=0||along>=48)return 0;
 const across=Math.sqrt(Math.max(0,rx*rx+ry*ry+rz*rz-along*along));
 const radius=7+along*.35;
 if(across>=radius)return 0;
 const focus=(1-.55*along/48)*(1-.55*across/radius);
 return Math.max(0,Math.min(.1,dt))*1.65*weight*focus;
}
