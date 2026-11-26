import {addBroadFinishMaterials,addParkingFinishMaterials} from './mcdonalds-finishes.mjs';
// Review 20: preserve the entire municipal footprint while improving the
// externally visible commercial architecture. Historical store branding is not
// asserted to be the current tenant. Reference evidence is in Review-20.md.
export const COMMERCIAL_REVIEW_VERSION='20.0.0';
export const REVIEWED_COMMERCIAL_IDS=Object.freeze(['1005655','1003022']);

/** Legacy Review-20 API retained only for compatibility. The old red pitched
 * roof was contradicted by the dated 2020 photo; deliberately return no
 * geometry so an old caller cannot resurrect it. The *pale* roof is now
 * generated from the unchanged GIS polygon by redRoofPlan().
 */
export function perimeterMansardSections(_row){return []}
// The 2020 photographed entrance is on the LONG parking-lot elevation, not
// the ~14 m short Broad-facing wall. The GIS polygon is ~33 m deep and ~14 m
// wide. Stretching the photographed facade across row.w was a major visual
// regression. This dedicated planner follows the actual ~31.5 m southern edge
// of the official footprint, with the near/Broad end of the facade to camera
// left and the rear/service end to the camera right.
export function mcdonaldsParkingElevation(row){
 if(String(row?.id)!=='1005655'||!Array.isArray(row.polys))return null;
 const ring=row.polys[0]?.[0]||[];
 const edges=[];
 for(let i=1;i<ring.length;i++){
  const [x1,z1]=ring[i-1],[x2,z2]=ring[i];
  const length=Math.hypot(x2-x1,z2-z1);
  if(length>row.d*.72&&Math.abs(x2-x1)<length*.08&&
     (x1+x2)/2>row.x+row.w*.34){
    // Always start from the near-Broad end (larger z); move rearward.
    const near=z1>=z2?[x1,z1]:[x2,z2],far=z1>=z2?[x2,z2]:[x1,z1];
    const tx=(far[0]-near[0])/length,tz=(far[1]-near[1])/length;
    const nx=-tz,nz=tx; // outward normal faces the south parking apron
    edges.push({near,far,length,tangent:[tx,tz],normal:[nx,nz],
      angle:Math.atan2(-tz,tx)});
  }
 }
 return edges.sort((a,b)=>b.length-a.length)[0]||null;
}
export function mcdonalds2020FacadePlan(row){
 const elevation=mcdonaldsParkingElevation(row);if(!elevation)return null;
 // Approximate ratios read from *dated* November 2020 Google Street View.
 // Window/door counts are not a 2026 claim. Historical storefront layout
 // must not override a more recent, clearly dated front photo.
 const left=.253,entry=.151,vestibule=.157,right=1-left-entry-vestibule;
 return {source:'User-supplied Google Street View — November 2020',
  verifiedAsOf:'2020-11',currentConditionVerified:false,
  elevation:'south-parking-side',elevationEdge:elevation,
  profile:'single-story pale flat roof; glazed west/near-Broad zone; beige central entry tower; narrower east-side glazing; long blank service wall',
  roofSections:[],regions:{left,entry,vestibule,right},
  leftGlazingModules:4,adjacentGlazingModules:2,
  mainDoorCount:1,serviceDoorCount:2,streetSignSide:'near-Broad southwest forecourt',
  notes:'Facade proportions and visible features match the 2020 evidence. Exact 2026 layout and some mullion widths remain unverified.'};
}
export function commercialFrontagePlans(row){
 const id=String(row?.id||'');
 if(id==='1005655'){
   const facade=mcdonalds2020FacadePlan(row);
   if(!facade)throw new Error('McDonald’s GIS south elevation is missing — refusing invented facade placement');
   return {...facade,type:'mcdonalds',
   material:'light flat roof, pale beige wall, brown/beige entry tower; NO red sloped roof',
   windowCount:null,doorCount:3,verified:'photo November 2020, aerial capture date unknown; current 2026 condition unapproved'};
 }
 if(id==='1003022')return {type:'former-rite-aid',material:'light gray stucco + long storefront glazing',
   windowCount:6,doorCount:1,verified:'building type and footprint photo-supported; exact opening positions estimated'};
 return null;
}
/** Separate view of the short, Broad-Street-facing END (not the dated
 * November 2020 long parking-side elevation). User-supplied image received
 * 2026-11-23; original Street View capture date UNKNOWN. Geometry ratios
 * below are photo-guided approximations, not certified measured dimensions.
 */
export function mcdonaldsBroadFacadePlan(row){
 if(String(row?.id)!=='1005655'||!Number.isFinite(row.w)||row.w<10)return null;
 return {
  reference:'Screenshot 2026-11-23 012912.png',
  screenshotReceived:'2026-11-23',streetViewCaptureDate:null,
  elevation:'broad-street-short-west-end',
  panels:[{id:'side-entrance',start:0,end:.22},
          {id:'dark-masonry-tower',start:.22,end:.49},
          {id:'glass-storefront',start:.49,end:1}],
  roof:'flat pale membrane; NO red sloped roof',
  mainFeatures:['left door and canopy','dark raised brick tower','small yellow wall arches',
   'dark high sign fascia with white McDonald’s lettering','large glass storefront',
   'freestanding sign near church (Broad-visible; yaw provisional)','street tree'],
  measured:false,approved:false,
  notes:'Do not infer 2026 capture date from 2026 upload. Separate street elevation from 2020 parking-side image.'
 };
}
/** All dimensions are relative to the unchanged official municipal GIS
 * footprint. This is NOT a photo-textured plane or copied fake facade.
 */
export function renderMcDonaldsBroadFacade(row,{T,box,mesh,scene}){
 const plan=mcdonaldsBroadFacadePlan(row);if(!plan)return null;
 const {x,w,front,h}=row,edge=x-w/2;
 function slab(u,y,width,height,depth,color,offset=.30){
  // Preserve the outward surface; extend thin cladding backward to the
  // shared wall/footing. No floating grout, panes or trim.
  const outer=offset+depth/2,inner=Math.min(offset-depth/2,-.12);
  const obj=box(edge+u*w,y,front+(outer+inner)/2,width*w,height,outer-inner,color);
  // The actual mapped viewer instantiates boxes in batches and its box()
  // intentionally returns undefined. Inspector boxes return Mesh objects.
  if(obj&&typeof obj==='object')obj.name='mcdonalds-broad-'+(plan.panels.find(p=>u>=p.start&&u<=p.end)?.id||'detail');
  return obj;
 }
 const darkBrick=0x67574b,brickMottled=0x756459,gray=0x979b97,
  light=0xd0d3ce,glass=0x4d6d72,frame=0x424749,deep=0x283536;
 // No new footprint extrusion: cladding is attached to the Broad-facing GIS
 // wall. The larger block/roof volumes come from the existing official polygon.
 slab(.5,h/2,.996,h,.19,gray,.13);
 // Side-drive-through entrance/vestibule (left of the image).
 slab(.11,h/2,.22,h,.29,0x919992,.28);
 slab(.12,h-.30,.215,.60,.35,0x6b7573,.54);
 slab(.13,1.55,.145,2.68,.15,deep,.63);
 slab(.13,1.53,.116,2.49,.07,glass,.74);
 slab(.13,2.05,.14,.075,.14,light,.84);
 slab(.13,1.52,.012,2.57,.13,light,.83);
 slab(.181,1.44,.007,.19,.10,light,.85);
 // The reference shows a cantilevered shallow canopy over this entry.
 slab(.115,3.30,.26,.17,.92,0x5a6060,.82);
 // Distinctive shallow louver screen above side entry, visible in supplied
 // undated Broad-end screenshot. Exact louver dimensions are provisional.
 slab(.115,h+.09,.22,.28,.17,0xabb2b0,.31);
 for(let k=0;k<7;k++)slab(.025+k*.030,h+.095,.005,.23,.07,0x545f5e,.48);
 // Raised dark brick-clad feature bay/tower.
 const tw=.27,tc=.355;
 slab(tc,(h+.48)/2,tw,h+.48,.33,darkBrick,.44);
 // Brick-toned horizontal courses are geometry (work without DOM/texture).
 for(let k=1;k<=21;k++){
  const yy=(h+.46)*k/22;
  slab(tc,yy,tw-.01,.021,.06,k%3===0?brickMottled:0x89786a,.656);
 }
 // Staggered short vertical joints break up the previously unrealistic
 // uninterrupted horizontal strips. Physical low-relief geometry is visible
 // in the instanced main map and the independent QA exporter alike.
 for(let course=0;course<18;course++){
  const yy=(course+.50)*(h+.46)/18;
  for(let joint=1;joint<=6;joint++){
   const shift=(course%2 ? .47 : 0);
   const u=tc-tw*.5+tw*(joint+shift)/7;
   if(u<tc+tw*.48)slab(u,yy,.006,(h+.46)/18*.79,.065,0x9a8677,.664);
  }
 }
 // The reference-guided masonry finish is applied once by the shared
 // photo-guided material helper after all structural boxes are placed.
 // Two low-relief arches on the upper brick panel. No new roadside pole here.
 if(T?.TubeGeometry&&T?.CatmullRomCurve3){
  const cy=h-.90;
  for(const side of [-1,1]){
   const coords=[];
   for(let k=0;k<=20;k++){
    const t=k/20;
    coords.push(new T.Vector3(edge+w*(tc+side*.041+(t-.5)*.08),
      cy+.78*Math.sin(Math.PI*t),front+.77));
   }
   const support=coords.map(v=>new T.Vector3(v.x,v.y,front+.66));
   mesh(new T.TubeGeometry(new T.CatmullRomCurve3(support),32,.085,8,false),darkBrick);
   const arch=mesh(new T.TubeGeometry(new T.CatmullRomCurve3(coords),32,.056,8,false),0xeac13d);
   arch.name='mcdonalds-broad-tower-golden-arch';
   arch.userData.bsvFeature='mcdonalds-broad-brick-arches';
  }
 }
 // Upper right fascia and substantial lower storefront glazing. This is not
 // the long pale (2020) wall and must never be constructed from its plan.
 slab(.745,h/2,.51,h,.23,0x8a8d88,.30);
 slab(.745,h-.83,.51,1.66,.29,0x4d5555,.53);
 slab(.755,1.65,.46,2.38,.16,deep,.57);
 // The screenshot shows a solid light door/panel immediately to the
 // right of the brick tower before the broad glazed area. Earlier four-
 // equal-window models erased this identifying break in the facade.
 slab(.568,1.58,.114,2.31,.09,light,.72);
 for(const u of [.545,.585])slab(u,1.65,.027,.80,.06,glass,.80);
 slab(.595,1.32,.007,.14,.055,frame,.86);
 const bays=[.705,.818,.927];
 for(const u of bays)slab(u,1.62,.103,2.21,.075,glass,.69);
 for(const u of [.759,.874])slab(u,1.60,.010,2.30,.105,frame,.78);
 slab(.755,.57,.46,.13,.19,light,.80);
 slab(.755,2.78,.46,.09,.19,light,.81);
 slab(.755,3.04,.46,.075,.19,frame,.75);
 // November 2020 dated oblique Broad-end view (030558) independently corroborates the long pale awning above the street-facing glazing. Back edge overlaps masonry; no change to footprint.
 slab(.755,3.20,.49,.18,.80,0xd5d5cc,.72);
 // Downlights inset into awning underside, not floating below the slab.
 for(const u of [.60,.75,.90])slab(u,3.105,.010,.055,.15,0x757b78,.90);
 // Finish overlays are downstream of boxes, with explicit depth order.
 // They never alter GIS geometry or replace the actual facade openings.
 addBroadFinishMaterials(T,scene,row);
 // Right upper wordmark is sourced from the visible photo; its precise
 // lettering position and size are provisional because a tree obscures it.
 if(scene&&typeof document!=='undefined'&&T?.CanvasTexture){
  const cv=document.createElement('canvas');cv.width=1024;cv.height=180;
  const ctx=cv.getContext('2d');
  if(ctx){ctx.clearRect(0,0,1024,180);ctx.font='bold 112px Arial,sans-serif';
   ctx.fillStyle='#e5e5e2';ctx.textBaseline='middle';ctx.textAlign='center';
   ctx.fillText('McDonald’s',512,94,1010);
   const tex=new T.CanvasTexture(cv);tex.colorSpace=T.SRGBColorSpace;
   const sign=new T.Mesh(new T.PlaneGeometry(w*.46,.66),new T.MeshBasicMaterial({map:tex,transparent:true,side:T.DoubleSide,depthWrite:false}));
   sign.position.set(edge+w*.753,h-.80,front+.71);sign.name='mcdonalds-broad-current-reference-wordmark';
   sign.userData.bsvFeature='mcdonalds-broad-wordmark';scene.add(sign);
  }
 }
 return plan;
}

export function renderCommercialFrontage(row,{T,box,mesh,scene}){
 const plan=commercialFrontagePlans(row);if(!plan)return false;
 const {x,w,front,h}=row;
 if(plan.type==='mcdonalds'){
   const wallPaint=0xeaeae2,stone=0xc8b9a1,stoneJoint=0xb7aa94,
       trim=0xd0d2cd,glass=0x526771,frame=0x575f5e,deep=0x28383e;
   const e=plan.elevationEdge,L=e.length;
   // All broad facade details are attached to the real southern GIS wall,
   // not an invented 30-m long wall along its 14-m Broad Street frontage.
   function at(t,off=0){
     return [e.near[0]+e.tangent[0]*L*t+e.normal[0]*off,
             e.near[1]+e.tangent[1]*L*t+e.normal[1]*off];
   }
   function wall(t,y,width,height,depth,color,off=.18){
     const outer=off+depth/2,inner=Math.min(off-depth/2,-.12);
     const [wx,wz]=at(t,(outer+inner)/2);box(wx,y,wz,width,height,outer-inner,color,e.angle);
   }
   let t=0;const leftEnd=plan.regions.left;
   const entryStart=leftEnd,entryEnd=entryStart+plan.regions.entry;
   const adjacentEnd=entryEnd+plan.regions.vestibule;
   // Broad-facing 14-m end, backed by the user's NEW close-up reference.
   // The street-view capture date is not visible on that image; its filename
   // records the upload date only. DO NOT treat it as a verified 2026 survey.
   // This end has a dark brick/stone tower, side drive-through door and long
   // glass storefront. The dated 2020 image documents a different elevation.
   const broad=renderMcDonaldsBroadFacade(row,{T,box,mesh,scene});
   if(!broad)throw Error('McDonalds dedicated Broad facade missing');
   // Thin base cladding on the parking-facing side of an existing GIS mass;
   // this does not modify the city footprint or expand the structural body.
   wall(.5,h/2,L,h,.15,wallPaint,.13);
   wall(.5,.23,L,.46,.19,0xd0d0ca,.25);
   wall(.5,h-.15,L,.28,.16,0xc5c7c1,.23);
   // Continuous opening to the near-Broad end, with a dark sill, authentic
   // mullion proportions, and a canopy carrying exterior downlights.
   const glassBottom=.63,glassTop=3.38;
   const glassH=glassTop-glassBottom;
   const leftCenter=leftEnd/2;
   wall(leftCenter,(glassTop+glassBottom)/2,L*leftEnd*.91,glassH,.13,deep,.30);
   for(let k=0;k<plan.leftGlazingModules;k++){
     const u=leftEnd*.045+leftEnd*.91*(k+.5)/plan.leftGlazingModules;
     wall(u,(glassTop+glassBottom)/2,L*leftEnd*.91/plan.leftGlazingModules-.10,
      glassH-.14,.08,glass,.41);
   }
   wall(leftCenter,glassTop+.095,L*leftEnd*.99,.17,.48,trim,.49);
   wall(leftCenter,glassBottom-.02,L*leftEnd*.95,.14,.34,frame,.45);
   // Distinct metal-framed glazing with two horizontal transom rails.
   for(const yy of [1.25,2.42])wall(leftCenter,yy,L*leftEnd*.91,.055,.075,frame,.49);
   // The reference shows food posters in the left storefront as of 2020;
   // render neutral poster silhouettes rather than fictional readable menus.
   for(const [u,y,pw,ph,c] of [[.060,1.47,.50,.79,0xb83d35],[.136,1.56,.54,.83,0xe7e0bf]]){
     wall(u,y,pw,ph,.055,c,.515);
   }

   for(let k=0;k<3;k++){
     const u=leftEnd*(k+1)/4;
     wall(u,1.95,.085,2.55,.16,frame,.48);
   }
   // Small canopy and downlights above the storefront.
   wall(leftCenter,3.68,L*leftEnd,.16,.64,0xc1c3bd,.57);
   for(const u of [.075,.18])wall(u,3.57,.12,.055,.13,0x696c6a,.91);
   // Narrow stone-toned entrance tower with the small two-arch emblem.
   const towerCenter=(entryStart+entryEnd)/2,towerWidth=L*plan.regions.entry;
   wall(towerCenter,(h+.58)/2,towerWidth,h+.58,.30,stone,.35);
   for(let k=1;k<=10;k++)wall(towerCenter,k*(h+.58)/11,towerWidth,.026,.04,stoneJoint,.525);
   const doorW=towerWidth*.66;
   wall(towerCenter,1.48,doorW,2.58,.17,deep,.57);
   for(const side of [-1,1]){
     wall(towerCenter+side*(doorW/L)*.246,1.48,doorW*.46,2.42,.08,glass,.70);
   }
   wall(towerCenter,1.48,.08,2.50,.12,frame,.82);
   wall(towerCenter,2.82,doorW*1.14,.14,.28,trim,.83);
   wall(towerCenter,3.14,doorW*1.1,.15,.43,0xf2f2ed,.82);
   // 'Welcome' lettering is on the real entry tower in the dated photo.
   // In the source viewer it is a genuine canvas-textured plane, not a
   // mislabeled facade box. Node/offline geometry tools skip the texture.
   if(scene&&typeof document!=='undefined'&&T?.CanvasTexture){
     const canvas=document.createElement('canvas');canvas.width=512;canvas.height=92;
     const ctx=canvas.getContext('2d');
     if(ctx){
       ctx.clearRect(0,0,512,92);ctx.fillStyle='#f1efe7';
       ctx.font='500 64px Arial,sans-serif';ctx.textAlign='center';
       ctx.fillText('Welcome',256,68,485);
       const texture=new T.CanvasTexture(canvas);texture.colorSpace=T.SRGBColorSpace;
       const plane=new T.Mesh(new T.PlaneGeometry(doorW*.90,.31),
         new T.MeshBasicMaterial({map:texture,transparent:true,side:T.DoubleSide,depthWrite:false}));
       const [ax,az]=at(towerCenter,.95);plane.position.set(ax,3.52,az);plane.rotation.y=e.angle;
       plane.name='mcdonalds-2020-welcome-on-parking-tower';
       scene.add(plane);
     }
   }

   if(T?.TubeGeometry&&T?.CatmullRomCurve3){
     // Two arches, rendered on the southern wall itself (+X-facing).
     for(const side of [-1,1]){
       const points=[];
       for(let j=0;j<=25;j++){
         const f=j/25;
         const u=towerCenter+side*.012+(f-.5)*.016;
         const [ax,az]=at(u,.72);
         points.push(new T.Vector3(ax,h-.74+.77*Math.sin(Math.PI*f),az));
       }
       const support=points.map(v=>new T.Vector3(v.x-e.normal[0]*.13,v.y,v.z-e.normal[1]*.13));
       mesh(new T.TubeGeometry(new T.CatmullRomCurve3(support),36,.11,8,false),stone);
       const logo=mesh(new T.TubeGeometry(new T.CatmullRomCurve3(points),36,.064,8,false),0xe4c350);
       logo.name='mcdonalds-parking-tower-small-arches-2020';
       logo.userData.bsvFeature='mcdonalds-2020-tower-arches';
     }
   }
   // A secondary glass bay immediately east of the central entry.
   const adjacentCenter=(entryEnd+adjacentEnd)/2,adjacentW=L*plan.regions.vestibule;
   wall(adjacentCenter,1.45,adjacentW*.86,2.68,.15,deep,.31);
   for(let k=0;k<plan.adjacentGlazingModules;k++){
     const u=entryEnd+plan.regions.vestibule*(k+.5)/plan.adjacentGlazingModules;
     wall(u,1.45,adjacentW*.86/plan.adjacentGlazingModules-.11,2.52,.08,glass,.41);
   }
   wall(adjacentCenter,2.84,adjacentW*.92,.15,.16,trim,.46);
   // Predominantly blank service wall toward the rear: two pale doors,
   // no invented window grid. Counts are dated 2020 estimates.
   const rightStart=adjacentEnd,rightLen=L*plan.regions.right;
   for(const rt of [.31,.88]){
     const u=rightStart+plan.regions.right*rt;
     wall(u,1.18,.98,2.28,.08,0xc8ccc7,.37);
     wall(u,2.34,1.06,.07,.10,0xa9aaa6,.44);
     wall(u-.014,1.1,.06,.12,.065,0x737c7b,.46);
   }
   wall((rightStart+1)/2,2.83,rightLen*.99,.055,.09,0xb4b4ad,.30);
   // Light vertical panel joints, not extra windows. The 2020 facade has
   // several broad stucco bays on the otherwise blank service side.
   for(const rt of [.12,.35,.57,.78]){
     wall(rightStart+plan.regions.right*rt,h*.65,.038,h*.67,.05,0xc9cbc6,.32);
   }
   // Compact wall-mounted downlights visible in the supplied photograph.
   for(const u of [.22,.55,.77,.96]){
     wall(u,h*.69,.20,.17,.15,0x787f7a,.46);
     wall(u,h*.66,.23,.055,.20,0xd2d3cc,.57);
   }

   addParkingFinishMaterials(T,scene,row,e);
   // Roof plant is a small, provisional set on the existing GIS mass.
   // The roof membrane is generated from the exact polygon elsewhere.
   for(const [bx,bz] of [[x-1.6,front-9.0],[x+2.0,front-17.1]]){
     box(bx,h+.42,bz,1.31,.48,1.48,0xbcbeb9);
     box(bx,h+.71,bz,1.03,.11,1.09,0x8f9893);
   }
   return true;
 }
 // 2131 is a set-back former Rite Aid (later ArchWell), NOT a CVS. The
 // original municipal polygon remains at its true setback from Broad Street.
 // Persist a low roof in the open-front viewer where the generic cutaway
 // otherwise concealed the commercial volume.
 const stone=0xbbbcb8,plaster=0xd8dad7,glass=0x526b75,frame=0x6d7778;
 box(x,h+.04,row.z,w*.985,.17,row.d*.97,0x898d8b);
 box(x,h-.15,front+.16,w*.92,.46,.40,plaster);
 box(x,h-.53,front+.35,w*.86,.18,.28,stone);
 for(let i=0;i<6;i++){
   const px=x+(i-2.5)*w*.137;
   box(px,1.60,front+.26,w*.117,2.38,.13,glass);
   box(px,1.61,front+.34,.07,2.36,.11,frame);
   box(px,2.81,front+.36,w*.118,.09,.10,plaster);
 }
 box(x+w*.13,1.43,front+.52,1.64,2.74,.13,0x3e4c52);
 box(x+w*.13,1.45,front+.63,1.26,2.44,.08,0x91a9ae);
 // Entrance pier and sign band have no fabricated tenant branding.
 box(x,3.73,front+.50,w*.81,.66,.32,plaster);
 return true;
}
