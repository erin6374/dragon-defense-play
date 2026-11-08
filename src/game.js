import {createChapterStaging} from './simulation/chapter-staging.js';
import {createFinalSquadron} from './simulation/final-squadron.js';
import {createMilitaryOccupation} from './simulation/military-occupation.js';
import {createCinematicEffects} from './rendering/cinematic-effects.js';
import {impactProfile,shockDamage,CAR_COLORS} from './simulation/impact-profiles.js';
import {updatePedestrianPose} from './simulation/pedestrian-motion.js';
import {chooseMeteorTarget} from './simulation/meteor-target.js';
import {buildRoadVehicle,setRoadVehicleNight,buildHelicopter,buildPerson,animatePerson} from './rendering/realistic-vehicles.js';
import {advanceSpeed,trafficTarget} from './simulation/traffic-dynamics.js';
import {GAME_VERSION,BUILD_ID} from './core/build-info.js';
import {clampWave,waveBudget,hunterSteering} from './core/balance.js';
import {choosePassingLane, laneChangeYaw, laneChangeSpeedCap} from './simulation/lane-safety.js';
import * as THREE from 'three';
import {createStableLightPool,syncHelicopterSearchlight} from './rendering/stable-light-pool.js';
import {createFixedStep} from './core/fixed-step.js';
import {ACTIONS,createInputState} from './input/actions.js';
import {groundWindStep,hitVehicleWithWind,advanceVehicleWind} from './simulation/ground-wind.js';
import {createPauloRig} from './dragon/paulo-rig.js';
import {createPauloPoseDriver} from './dragon/paulo-pose-driver.js';
import {createProfiler} from './rendering/profiler.js';
import {InstancedParticlePool} from './rendering/instanced-particles.js';
import {AdaptiveQuality} from './rendering/adaptive-quality.js';
import {AdaptiveFramebuffer} from './rendering/frame-governor.js';
import {batchSchoolSource} from './rendering/school-source-batch.js';
import {createSchoolSourceDamage} from './rendering/school-source-damage.js';
import {snapshotSchoolMesh,captureSchoolComparison,captureSchoolViews} from './rendering/school-comparison.js';
import {FBXLoader} from 'three/addons/loaders/FBXLoader.js';
import {ArchitecturalVoxels} from './architectural-voxels.js';
import {createCinematicSky,addStreetSurfaceDetail,disasterSkyIntensity} from './rendering/cinematic-environment.js';
import {createPhiladelphiaSkyline} from './rendering/philadelphia-geometry-skyline.js';
import {skylineCameraRayX,skylineParallaxX} from './core/skyline-position.js';
import {batchVehicleVisuals} from './rendering/vehicle-batch.js';
import {createFrameHealth} from './core/frame-health.js';
import {installWebGLResourceAudit} from './core/webgl-resource-audit.js';
import {createDistantMeteorVisual} from './rendering/distant-meteors.js';
import {createPerformanceLab} from './core/performance-lab.js';
import {createCaptureLab} from './core/capture-lab.js';
import {batchStaticBim} from './rendering/static-bim-batch.js';
import {batchStaticStreetProps} from './rendering/static-prop-batch.js';
import {createCityExtensions} from './rendering/city-extensions.js';
import {installSchoolFlankingHouses} from './rendering/school-flanking-houses.js';
import {createBroadStreetReferenceFacades} from './rendering/broad-street-reference.js';
import {schoolFitDimensions} from './rendering/school-fit.js';
import {fitSchoolFromFacade,SCHOOL_SOURCE,SCHOOL_TARGET,classifyArchitecturalMesh} from './rendering/tech-freire-source-fit.js';
import {assessRowhouseSource} from './rendering/rowhouse-source-validation.js';
import {createDestructibleSchool} from './rendering/destructible-school.js';

import {createVisualMaterials,enhanceDragon,enhanceCar,enhanceHelicopter,enhanceEnvironment,createCinematicWeather} from './rendering/cinematic-assets.js';
const mobileVisual=window.matchMedia('(pointer:coarse)').matches;
let visualPreset=mobileVisual?'mobile':'balanced';
const performanceLab=createPerformanceLab({onChange:(key,on)=>applyDiagnosticSystem(key,on)});
window.__DD_PERF=performanceLab; // public diagnostic switches, no private account data
const frameGovernor=new AdaptiveFramebuffer();
let adaptiveResolution=1,adaptiveAdjustments=0;
function evaluateRenderPressure(dt,activeNow){
 if(frameGovernor.sample(dt,activeNow)){
  adaptiveResolution=frameGovernor.scale;
  adaptiveAdjustments=frameGovernor.adjustments;
  applyVisualPreset();
 }
}
function applyVisualPreset(){
 if(typeof renderer==='undefined')return;
 renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,visualPreset==='mobile'?.83:visualPreset==='balanced'?.96:1.12)*adaptiveResolution);
 renderer.shadowMap.enabled=visualPreset==='cinematic'&&performanceLab.isEnabled('shadows');
 renderer.toneMappingExposure=visualPreset==='cinematic'?1.24:visualPreset==='balanced'?1.18:1.12;
}
// All on-screen build stamps use one canonical source; visible in browser captures.
const buildStamp=`v${GAME_VERSION} · ${BUILD_ID}`;
for(const id of ['game-build','hud-version','start-build']){
 const node=document.getElementById(id);if(node)node.textContent=buildStamp;
}
const visualBank=createVisualMaterials(THREE);
const scene=new THREE.Scene();
const chapterStaging=createChapterStaging(scene);scene.background=new THREE.Color(0xa9c8e0);scene.fog=new THREE.FogExp2(0xacc9dc,.00175);
const streetView={x:19,y:23,z:112,targetY:19,targetZ:-6,fov:35};
const camera=new THREE.PerspectiveCamera(streetView.fov,1,1,650),renderer=new THREE.WebGLRenderer({antialias:true,powerPreference:'high-performance',preserveDrawingBuffer:new URLSearchParams(location.search).get('qa')==='1'});
renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,1.25));window.pixelArtMode=false;renderer.shadowMap.enabled=!window.matchMedia('(pointer:coarse)').matches;renderer.shadowMap.type=THREE.PCFSoftShadowMap;renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.18;document.body.prepend(renderer.domElement);applyVisualPreset();const graphicsDropdown=document.getElementById('graphics');if(graphicsDropdown)graphicsDropdown.value=visualPreset;
scene.add(new THREE.HemisphereLight(0xe9f2ff,0x6d6871,1.06));const sun=new THREE.DirectionalLight(0xfff3da,2.20);sun.position.set(-22,36,24);sun.castShadow=true;sun.shadow.mapSize.set(1024,1024);Object.assign(sun.shadow.camera,{left:-55,right:55,top:55,bottom:-55,near:1,far:120});scene.add(sun);
// Cyclic daylight palette: dawn -> afternoon -> dusk -> night -> dawn.
const skySteps=[0xadcde0,0xa5cce8,0x8dbde1,0xe7b29a,0xa36f84,0x253552,0x15243d,0x253957,0xb08da1,0xadcde0];
// Low-draw-call atmospheric sky, with time-of-day gradient and wispy cloud detail.
const cinematicSky=createCinematicSky(THREE,scene);
const cinematicFX=createCinematicEffects(THREE,scene,camera,visualBank);
const finalSquadron=createFinalSquadron(scene);
const DAY_PHASE_WAVES=10;
function dayPhase(w){return (((w-1)%DAY_PHASE_WAVES)+DAY_PHASE_WAVES)%DAY_PHASE_WAVES/DAY_PHASE_WAVES;}
function dayDarkness(w){const p=dayPhase(w);return Math.max(0,Math.min(1,(p-.28)/.32,(.94-p)/.24));}
const ambience=scene.children.find(o=>o.isHemisphereLight);
const skyTarget=new THREE.Color(skySteps[0]);
// Reuse immutable palette colors in the per-frame lighting update; creating
// THREE.Color objects every animation tick adds avoidable garbage collection.
const sunsetSunColor=new THREE.Color(0xffc59a);
const nightSunColor=new THREE.Color(0x8faad9);
const nightAmbientColor=new THREE.Color(0xb5c5dd);
let displayedPhase=0,displayedDarkness=0;
function updateAtmosphere(){const p=dayPhase(wave)*(skySteps.length-1),i=Math.floor(p);skyTarget.setHex(skySteps[Math.min(i,skySteps.length-1)]);if(i<skySteps.length-1)skyTarget.lerp(new THREE.Color(skySteps[i+1]),p-i);}
// Emissive window cards remain dark in daylight; individual rooms light up after dusk.
const nightWindows=[];
const litWindowMaterial=new THREE.MeshBasicMaterial({color:0xffd9a0,transparent:true,opacity:0,depthWrite:false,side:THREE.DoubleSide});
const crackedGlassMaterial=new THREE.LineBasicMaterial({color:0xc5d4e1,transparent:true,opacity:.85});
const windowDamage=[];
function addNightWindow(x,y,z,w,h,seed=0){
 const m=new THREE.Mesh(new THREE.PlaneGeometry(w,h),litWindowMaterial.clone());
 m.position.set(x,y,z);scene.add(m);
 nightWindows.push({mesh:m,seed,enabled:Math.sin(seed*73.7)>-.23,x,y,z,w,h,broken:false});
}
// Front windows of individual Broad Street rowhouses, not a blanket luminous facade.
function installNeighborhoodWindows(){
 for(const win of neighborhood.windowSurfaces){
  // Attach lighting directly to the actual glass geometry, not estimated floor/bay coordinates.
  const seed=win.x*13.2+win.y*5.3;
  const light=new THREE.Mesh(new THREE.PlaneGeometry(win.w*.92,win.h*.9),litWindowMaterial.clone());
  light.position.set(win.x,win.y,win.z+.085);win.mesh.parent.add(light);
  nightWindows.push({mesh:light,seed,enabled:Math.sin(seed*73.7)>-.23,x:win.x,y:win.y,z:win.z+.085,w:win.w*.92,h:win.h*.9,broken:false,surface:win});
 }
}
// The imported school has a glass facade; warm interior light is placed just inside it.
// School glazing is now illuminated on the actual FBX geometry itself.
// Do not create unparented front-facing window cards; those floated in front
// of the original school and stayed visible as the building was damaged.
const schoolWindowLights=[];
const schoolGlazingMaterials=[];
const schoolSignGroup=new THREE.Group();scene.add(schoolSignGroup);
let lightningCooldown=5;
function updateNight(dt){
 const targetPhase=dayPhase(wave);let phaseDelta=targetPhase-displayedPhase;if(phaseDelta<-.5)phaseDelta+=1;if(phaseDelta>.5)phaseDelta-=1;
 const blend=1-Math.exp(-dt*.45);displayedPhase=(displayedPhase+phaseDelta*blend+1)%1;displayedDarkness+=(dayDarkness(wave)-displayedDarkness)*blend;
 const darkness=displayedDarkness;schoolReconstruction?.setNight(darkness);skylineBackdrop.setDamage(Math.max(skylineDamage,schoolDamage>=.999?1:schoolDamage*.6));skylineBackdrop.setTime(displayedPhase,darkness);skylineAirUniforms.day.value=1-darkness;skylineAirUniforms.opacity.value=.15+darkness*.06;scene.background.lerp(skyTarget,Math.min(1,dt*.9));scene.fog.color.copy(scene.background);scene.fog.density=.00175+darkness*.00035;cinematicSky.setPhase(displayedPhase,darkness,dt,disasterSkyIntensity(wave,skylineDamage));neighborhood.setAtmosphere(displayedPhase,darkness);
 // Distant building haze is now handled by the skyline materials and fog;
 // do not allocate an unused color blend in this per-frame path.
 // Architectural texture preserves facade detail while distance haze stays subtle.
 // Skyline geometry and window emissive intensity are updated by skylineBackdrop.setTime().
 // Legacy geometric clouds remain detached from drawing; do not traverse/update
 // their meshes every tick when the shader sky provides all cloud visuals.
 sunDisc.visible=false;moonDisc.visible=false;starGroup.visible=false;clouds.visible=false; // Atmospheric sky shader replaces geometric clouds.
 for(const lamp of lamps)lamp.intensity=darkness*(lamp.color.getHex()===0xb4c7ff?1.35:3.0);
 for(const glow of streetGlows)glow.material.opacity=darkness*.58;
 for(const car of cars)setRoadVehicleNight(car.root,darkness,!car.burning&&!car.destroyed);
 for(const w of nightWindows){const lightAllowed=(!w.surface||w.surface.alive)&&w.enabled&&!w.broken;const opacity=lightAllowed?Math.max(0,(darkness-.3)*.62):0;w.mesh.material.opacity=opacity;w.mesh.visible=opacity>.001;}
 for(const mat of schoolGlazingMaterials)mat.emissiveIntensity=Math.max(0,(darkness-.18))*mat.userData.nightEmission;

 sun.intensity=2.20-darkness*1.25;const sunset=Math.exp(-Math.pow((displayedPhase-.34)*9,2))+Math.exp(-Math.pow((displayedPhase-.84)*9,2));sun.color.setHex(0xfff1db).lerp(sunsetSunColor,Math.min(1,sunset)).lerp(nightSunColor,darkness);
 if(ambience){ambience.intensity=1.18-darkness*.12;ambience.color.setHex(0xe9f2ff).lerp(nightAmbientColor,darkness)}
 lightningCooldown-=dt;
 if(darkness>.55&&lightningCooldown<=0){lightningCooldown=2+Math.random()*6;const b=neighborhood.targetBuildings[Math.floor(Math.random()*neighborhood.targetBuildings.length)];if(b){flashAt(b.x,Math.min(b.h,7+Math.random()*5),b.front,1.1);emitImpact(b.x,Math.min(b.h,8),b.front,18,.22)}}
}
const material=(c,emissive=0)=>new THREE.MeshLambertMaterial({color:c,emissive});const mats={brick:material(0xa96653),brick2:material(0xbd8065),mortar:material(0x705a58),stone:material(0xb6a99b),stone2:material(0x918f89),glass:material(0x4b7897,0x0a1926),glassLit:material(0xe5b67d,0x5b3110),frame:material(0x283b4b),roof:material(0x3d4751),gold:material(0xe6a93d),road:material(0x2b3344),sidewalk:material(0x92918e),grass:material(0x395e4d),tree:material(0x327b5b),trunk:material(0x72523e),purple:material(0x683ba5),purpleLight:material(0x9860cb),purpleDark:material(0x43266d),wing:material(0xe6a63c),fire:new THREE.MeshBasicMaterial({color:0xffac2c}),meteor:material(0x6e605c)};
const cube=new THREE.BoxGeometry(1,1,1),ico=new THREE.IcosahedronGeometry(1,1);const staticGroup=new THREE.Group();scene.add(staticGroup);
function block(parent,x,y,z,w,h,d,m,cast=false){const mesh=new THREE.Mesh(cube,m);mesh.position.set(x,y,z);mesh.scale.set(w,h,d);mesh.castShadow=cast;mesh.receiveShadow=true;parent.add(mesh);return mesh}
function seeded(seed){let s=seed>>>0;return()=>((s=(Math.imul(1664525,s)+1013904223)>>>0)/4294967296)}const rand=seeded(44122);
// Site context: approximate arcade-scale reconstruction of the east side of the
// 2200 block of N Broad Street. X is north (+), Z is west/front (+).
// Street alignment and nearby building dimensions are not survey-verified.
import {buildNeighborhood} from './neighborhood.js';
const neighborhood=buildNeighborhood({THREE,scene,staticGroup,block,material,mats,rand,visualBank});
// The school is drawn by the FBX ONLY when available. No second window/card facade.
const referenceFacades=createBroadStreetReferenceFacades(scene,neighborhood.buildings);
installNeighborhoodWindows();
// Architecture passes remain separate from simulation and collisions.
addStreetSurfaceDetail(THREE,staticGroup);
let cityExtensions={group:null,propsEstimate:0};
try{cityExtensions=createCityExtensions({THREE,root:staticGroup,block,material});}
catch(err){console.error('City scenery could not be initialized. Starting core game without it.',err);window.__DD_OPTIONAL_ERRORS=(window.__DD_OPTIONAL_ERRORS||[]).concat('City scenery: '+String(err));}
const upgradedStreet=enhanceEnvironment(THREE,scene,staticGroup,neighborhood,visualBank);
const streetBatchStats=batchStaticStreetProps(staticGroup);console.info('Static street batching:',streetBatchStats);
const cinematicWeather=createCinematicWeather(THREE,scene,{mobile:mobileVisual});
// Voxel facade with ~0.30 world-unit cells. Individual instances can be hidden after impacts.
const cell=.3,W=28,H=15,D=12,counts={brick:0,brick2:0,stone:0,roof:0,glass:0,glassLit:0,frame:0};const specs=[];
function voxel(x,y,z,type){specs.push({x,y,z,type,alive:true});counts[type]++}
function school(){specs.length=0;for(const k of Object.keys(counts))counts[k]=0;
const nx=Math.round(W/cell),ny=Math.round(H/cell),nz=Math.round(D/cell);
for(let iy=0;iy<ny;iy++)for(let ix=0;ix<nx;ix++)for(let iz=0;iz<nz;iz++){
const front=iz===nz-1,back=iz===0,left=ix===0,right=ix===nx-1,top=iy===ny-1;
if(!(front||back||left||right||top))continue;
const x=(ix+.5)*cell-W/2,y=(iy+.5)*cell,z=(iz+.5)*cell-D/2;
let type='brick';const level=Math.floor(iy/(ny/5));const local=iy%(ny/5);const edge=ix<6||ix>nx-7;
if(top){type='roof'}else if(iy<6||local<4||local>16){type='stone'}else if(front||back){
const bay=ix%24,glassBay=(bay>=4&&bay<=19)&&!edge;
if(glassBay){type=(bay===4||bay===19||local===4||local===16)?'frame':((ix+iy)%17===0?'glassLit':'glass')}
else if(ix%24===0||ix%24===23)type='stone';else type=(ix+iy)%7===0?'brick2':'brick';
}else if(left||right){const bay=iz%20;type=(bay>=4&&bay<=15)?((bay===4||bay===15||local===4||local===16)?'frame':'glass'):'brick'}
voxel(x,y,z,type)}
// Cornice, entrance, pilasters and distinctive vertical glass frontage. Approximate until BIM supplied.
for(let ix=0;ix<nx;ix++)for(let iz=0;iz<nz;iz++){if(ix%2===0&&(iz===0||iz===nz-1))voxel((ix+.5)*cell-W/2,H+.15,(iz+.5)*cell-D/2,'stone')}
for(let iy=0;iy<44;iy++)for(let ix=12;ix<40;ix++)voxel((ix+.5)*cell-W/2,(iy+.5)*cell,D/2+.10,ix===12||ix===39||iy===43?'frame':'glass');
}
let meshes={},indices={},dummy=new THREE.Object3D(),aliveCount=0;const hidden=new THREE.Matrix4().makeScale(0,0,0);
function buildSchool(){for(const m of Object.values(meshes)){scene.remove(m);m.dispose()}meshes={};indices={};school();aliveCount=specs.length;for(const [type,count] of Object.entries(counts)){const inst=new THREE.InstancedMesh(cube,mats[type],count);inst.instanceMatrix.setUsage(THREE.DynamicDrawUsage);inst.castShadow=false;inst.receiveShadow=true;inst.frustumCulled=false;scene.add(inst);meshes[type]=inst;indices[type]=0}
for(const s of specs){const i=indices[s.type]++;s.instance=i;dummy.position.set(s.x,s.y,s.z);dummy.scale.setScalar(cell*.99);dummy.rotation.set(0,0,0);dummy.updateMatrix();meshes[s.type].setMatrixAt(i,dummy.matrix)}for(const m of Object.values(meshes))m.instanceMatrix.needsUpdate=true}
// Component-built architecture replaces the imported rendering shell.
// Imported FBX is the source for surface voxels. The original is retained as a comparison view.
let architecturalModel=null,architecturalReady=false,viewMode='real',voxelReady=false;
let actualSchoolOverlay=null,actualSchoolOverlayReady=false,actualSchoolOverlayStats=null;
const actualRowhouseOverlays={leftRowhouse:null,rightRowhouse:null};
const actualRowhouseStats={leftRowhouse:null,rightRowhouse:null};
let sourceArchitectureVisible=true;
const damageHoles=[];const MAX_HOLES=48;
let schoolRubblePlaced=false;
let schoolDamage=0; // 0 = pristine, 1 = completely leveled; independent of neighboring buildings
let schoolBounds=new THREE.Box3(new THREE.Vector3(-14,0,-7),new THREE.Vector3(14,16,7));
let schoolReconstruction=null; // independently destructible game mesh, calibrated to FBX bounds
let schoolFire=[];const fireGroup=new THREE.Group();scene.add(fireGroup);
// Soft generated fire and smoke billboards replace opaque polygonal flames.
function makeFireTexture(smoke=false){
 const c=document.createElement('canvas');c.width=128;c.height=192;const g=c.getContext('2d');
 for(let n=0;n<12;n++){
  const x=64+Math.sin(n*2.17)*(smoke?16:11),y=166-n*12,rad=(smoke?30:22)*(1-n*.035);
  const grad=g.createRadialGradient(x,y,1,x,y,rad);
  if(smoke){grad.addColorStop(0,'rgba(87,90,95,.30)');grad.addColorStop(.5,'rgba(57,60,65,.25)');grad.addColorStop(1,'rgba(50,54,59,0)');}
  else{grad.addColorStop(0,n<4?'rgba(255,245,158,.91)':'rgba(255,148,38,.75)');grad.addColorStop(.50,'rgba(248,76,22,.47)');grad.addColorStop(1,'rgba(133,24,9,0)');}
  g.fillStyle=grad;g.beginPath();g.ellipse(x,y,rad*.75,rad*1.3,0,0,Math.PI*2);g.fill();
 }
 return new THREE.CanvasTexture(c);
}
const fireSpriteTexture=visualBank.images.flame,smokeSpriteTexture=visualBank.images.smoke;
const flameMats=[0xffffff,0xffe8ae,0xffab69].map(color=>new THREE.SpriteMaterial({map:fireSpriteTexture,color,transparent:true,opacity:.90,depthWrite:false}));
const smokeSpriteMat=new THREE.SpriteMaterial({map:smokeSpriteTexture,color:0x626369,transparent:true,opacity:.33,depthWrite:false});
function ignite(x,y,z){
 if(schoolFire.length>=42)return;
 // Avoid stacking five overlapping sprites at the same impact point.
 for(const f of schoolFire){if(f.root.position.distanceToSquared(new THREE.Vector3(x,y,z))<2.25)return;}
 const root=new THREE.Group();root.position.set(x,y,z);fireGroup.add(root);
 schoolFire.push({root,tongues:[],age:0,suppression:0,size:1.3+Math.random()*.7});
}
function updateFires(dt){for(let i=schoolFire.length-1;i>=0;i--){const f=schoolFire[i];f.age+=dt;f.anchorClock=(f.anchorClock||0)-dt;if(f.anchorClock<=0){f.anchorClock=.3;f.anchorY=neighborhood.city.fireAnchorHeight(f.root.position)}f.root.position.y=THREE.MathUtils.lerp(f.root.position.y,f.anchorY??f.root.position.y,Math.min(1,dt*2));if(f.suppression>=1){fireGroup.remove(f.root);schoolFire.splice(i,1);continue}cinematicFX.fire(f.root.position,f.age,f.size,f.suppression);}}
function clearFires(){for(const f of schoolFire)fireGroup.remove(f.root);schoolFire=[]}
// Five-story school collapse: staged per-floor masonry and slab rubble using one GPU batch.
const schoolFragments=new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1,0),new THREE.MeshStandardMaterial({color:0x8c7770,roughness:1,flatShading:true}),240);
schoolFragments.count=0;schoolFragments.frustumCulled=false;scene.add(schoolFragments);
const schoolChunkMatrix=new THREE.Matrix4(),schoolChunkPos=new THREE.Vector3(),schoolChunkScale=new THREE.Vector3(),schoolChunkQuaternion=new THREE.Quaternion();
function updateSchoolFragments(){
 const stages=Math.min(5,Math.floor(Math.max(0,schoolDamage-.10)/.90*5.99));
 let n=0;const x0=schoolBounds.min.x,x1=schoolBounds.max.x,z0=schoolBounds.min.z,z1=schoolBounds.max.z;
 for(let level=0;level<stages;level++)for(let i=0;i<35;i++){
  const a=Math.sin((i+level*71)*78.233)*43758.54,r=a-Math.floor(a);
  const b=Math.sin((i+level*41)*32.879)*12711.15,t=b-Math.floor(b);
  const w=.17+((i*7+level*3)%9)*.065;
  schoolChunkPos.set(x0+(x1-x0)*r,.1+Math.min(1.2,level*.17)+w*.4,z0+(z1-z0)*t);
  schoolChunkScale.set(w*1.7,w*.68,w*1.2);
  schoolChunkMatrix.compose(schoolChunkPos,schoolChunkQuaternion,schoolChunkScale);
  schoolFragments.setMatrixAt(n++,schoolChunkMatrix);
 }
 schoolFragments.count=n;schoolFragments.instanceMatrix.needsUpdate=true;
}
function syncSchoolVisibility(){
 const visible=performanceLab.isEnabled('schoolModel');
 const useSource=Boolean(actualSchoolOverlayReady&&schoolDamage<1);
 if(actualSchoolOverlay)actualSchoolOverlay.visible=visible&&useSource;
 if(architecturalModel)architecturalModel.visible=false;
 schoolReconstruction?.setDetachedOnly(useSource);
 schoolReconstruction?.setVisible(visible);
 schoolSignGroup.visible=visible&&!actualSchoolOverlayReady&&schoolDamage<.75;
}
function syncStructuralDamage(){
 if(schoolDamage>=1)neighborhood.city.forceDamage(neighborhood.school,1);
 if(schoolDamage>=1)schoolReconstruction?.collapse();
 syncSchoolVisibility();
}

// Permanent, pixel-cost-bounded damage masks. Unlike the old 48-slot FIFO uniform
// list, past impact holes never disappear when additional meteors hit the school.
const sourceDamage=createSchoolSourceDamage();
const SCHOOL_MASK_SIZE=384;
const schoolDamagePlanes={front:document.createElement('canvas'),side:document.createElement('canvas')};
for(const cv of Object.values(schoolDamagePlanes)){
 cv.width=cv.height=SCHOOL_MASK_SIZE;
 cv.getContext('2d').fillStyle='#ffffff';
 cv.getContext('2d').fillRect(0,0,SCHOOL_MASK_SIZE,SCHOOL_MASK_SIZE);
}
const schoolDamageTextures={front:new THREE.CanvasTexture(schoolDamagePlanes.front),side:new THREE.CanvasTexture(schoolDamagePlanes.side)};
for(const tex of Object.values(schoolDamageTextures)){
 tex.colorSpace=THREE.NoColorSpace;tex.minFilter=THREE.LinearFilter;tex.magFilter=THREE.LinearFilter;tex.generateMipmaps=false;
}
function resetSchoolDamageMasks(){
 sourceDamage.reset();
 for(const [key,cv] of Object.entries(schoolDamagePlanes)){
  const c=cv.getContext('2d');c.globalCompositeOperation='source-over';
  c.fillStyle='#ffffff';c.fillRect(0,0,SCHOOL_MASK_SIZE,SCHOOL_MASK_SIZE);
  schoolDamageTextures[key].needsUpdate=true;
 }
}
function stampPermanentDamage(key,u,v,ru,rv){
 const cv=schoolDamagePlanes[key],ctx=cv.getContext('2d');
 const x=THREE.MathUtils.clamp(u,0,1)*SCHOOL_MASK_SIZE;
 const y=(1-THREE.MathUtils.clamp(v,0,1))*SCHOOL_MASK_SIZE;
 const rx=Math.max(3,ru*SCHOOL_MASK_SIZE),ry=Math.max(3,rv*SCHOOL_MASK_SIZE);
 ctx.save();ctx.globalCompositeOperation='multiply';ctx.translate(x,y);ctx.scale(rx,ry);
 // Facade breakage is a jagged breach with directional shear, not a round hole.
 // The polygon clips a soft soot fringe; irregular radii are stable once stamped.
 const vertices=[],count=28,seed=Math.sin(x*.391+y*.177+rx*.127)*9274.123;
 for(let i=0;i<count;i++){
  const a=i*Math.PI*2/count;
  // Asymmetric fractured masonry, not alternating sawtooth spikes.
  const jitter=.72+.14*Math.sin(a*2.0+seed*.06)+.09*Math.cos(a*5.0-seed*.09)+.055*Math.sin(a*9.0+seed*.19);
  const shear=.18*Math.sin(a+seed*.03);
  vertices.push([Math.cos(a)*jitter*(1.1+shear)+.12*Math.sin(a*3.0),Math.sin(a)*jitter*(.83+shear*.3)]);
 }
 ctx.beginPath();vertices.forEach(([px,py],i)=>i?ctx.lineTo(px,py):ctx.moveTo(px,py));ctx.closePath();ctx.clip();
 const grad=ctx.createRadialGradient(-.12,.07,.06,0,0,1.05);
 grad.addColorStop(0,'#010101');grad.addColorStop(.49,'#040404');
 grad.addColorStop(.73,'#262626');grad.addColorStop(.91,'#929292');grad.addColorStop(1,'#e7e7e7');
 ctx.fillStyle=grad;ctx.fillRect(-1.2,-1.2,2.4,2.4);
 ctx.strokeStyle='#171717';ctx.lineWidth=.016;
 for(let k=0;k<5;k++){
  const a=(seed*.017+k*2.29)%(Math.PI*2);
  ctx.beginPath();ctx.moveTo(.40*Math.cos(a),.40*Math.sin(a));
  ctx.lineTo(.87*Math.cos(a+.11),.87*Math.sin(a+.11));ctx.stroke();
 }
 ctx.restore();
 schoolDamageTextures[key].needsUpdate=true;
}
function carveSchool(x,y,z,r,strength=1,type='stone',speed=0){
 neighborhood.city.impact(neighborhood.school,new THREE.Vector3(x,y,z),r,strength);
 // The reconstructed school determines damage from meteor type, velocity and
 // exact 3D impact position, independent of whole-floor visibility cutoffs.
 schoolReconstruction?.impact({x,y,z,radius:r,strength,type,speed});
 sourceDamage.stamp(x,y,z,r);
 const range=schoolBounds.getSize(new THREE.Vector3());
 stampPermanentDamage('front',(x-schoolBounds.min.x)/range.x,(y-schoolBounds.min.y)/range.y,r/range.x,r/range.y);
}
function setRowhouseSourceVisible(role,on){
 const houseName=role==='leftRowhouse'?'united-fund-cream':'north-brownstone';
 const model=actualRowhouseOverlays[role];
 if(!model)return false;
 model.visible=!!on&&sourceArchitectureVisible&&performanceLab.isEnabled('schoolModel');
 // Keep the independent structural simulations for demolition/debris, but
 // hide intact generated façades behind the actual neighboring FBX masses.
 neighborhood.city.setIntactBuildingVisible(houseName,!model.visible);
 referenceFacades.setExternalFacade(houseName,model.visible);
 return model.visible;
}
const schoolQA=new URLSearchParams(location.search).get('qa')==='1';
let sourceComparison=null;
function loadActualSchoolOverlay(){
 const loader=new FBXLoader();
 loader.load('./assets/tech-freire-original.fbx',fbx=>{
  try{
   // One source coordinate frame and ONE uniform scale for all three masses.
   fbx.rotation.x=-Math.PI/2;
   fbx.updateWorldMatrix(true,true);
   const placement=fitSchoolFromFacade();
   const meshRoles=new WeakMap(),roleMeshCounts={school:0,leftRowhouse:0,rightRowhouse:0,excluded:0};
   const bounds=new THREE.Box3();
   fbx.traverse(mesh=>{if(!mesh.isMesh)return;bounds.setFromObject(mesh);
    const role=classifyArchitecturalMesh(mesh,bounds);
    meshRoles.set(mesh,role);
    if(role)roleMeshCounts[role]++;else roleMeshCounts.excluded++;
   });
   const school=new THREE.Group();
   school.scale.setScalar(placement.scale);
   school.position.set(placement.translation.x,placement.translation.y,placement.translation.z);
   fbx.traverse(mesh=>{if(mesh.isMesh&&meshRoles.get(mesh)==='school')school.add(snapshotSchoolMesh(mesh));});
   if(schoolQA){
    const original=new THREE.Group();
    original.scale.copy(school.scale);
    original.position.copy(school.position);
    fbx.traverse(mesh=>{if(mesh.isMesh)original.add(snapshotSchoolMesh(mesh));});
    sourceComparison={original,school};
   }
   const buildRole=role=>{
    const result=batchStaticBim(fbx,{exteriorOnly:false,maxVerticesPerBatch:240000,maxMeshesPerBatch:320,
      meshFilter:mesh=>meshRoles.get(mesh)===role});
    if(!result.used||result.processed===0)return {model:null,stats:{processed:0,batches:0,failed:result.failed}};
    const model=result.model;
    model.name=role==='school'?'ACTUAL-TECH-FREIRE-SCHOOL':role==='leftRowhouse'?'ACTUAL-LEFT-ROWHOUSE':'ACTUAL-RIGHT-ROWHOUSE';
    model.scale.setScalar(placement.scale);
    model.position.set(placement.translation.x,placement.translation.y,placement.translation.z);
    model.updateWorldMatrix(true,true);
    model.traverse(obj=>{if(!obj.isMesh)return;obj.castShadow=false;obj.receiveShadow=true;
     const mats=Array.isArray(obj.material)?obj.material:[obj.material];
     for(const mat of mats){if(!mat)continue;
      if(mat.color&&!mat.userData.originalColor)mat.userData.originalColor=mat.color.clone();
      mat.side=THREE.DoubleSide;
      if('roughness' in mat)mat.roughness=Math.min(.92,(mat.roughness??.7)+.08);
      if('metalness' in mat&&mat.metalness>.28)mat.metalness*=.55;
     }
    });
    const box=new THREE.Box3().setFromObject(model),size=box.getSize(new THREE.Vector3());
    const info={processed:result.processed,batches:result.batches,failed:result.failed,
      modelBounds:{min:box.min.toArray().map(x=>+x.toFixed(2)),max:box.max.toArray().map(x=>+x.toFixed(2)),size:size.toArray().map(x=>+x.toFixed(2))}};
    scene.add(model);
    return {model,stats:info};
   };
   // School first: the central five-storey façade is never based on the
   // combined three-building bounding box.
   if(!school.children.length)throw new Error('Central school geometry not found in source');
   const central=batchSchoolSource(school,material=>{
    sourceDamage.patch(material);
    if(['school-glass','school-interior'].includes(material.name)&&material.emissive){
     material.emissive.setHex(0xffd6a2);
     material.emissiveIntensity=0;
     // Illuminate the retained interior surfaces behind the glazing. Keep the
     // glass itself subdued so the facade does not become a flat glowing panel.
     material.userData.nightEmission=material.name==='school-interior'?.55:.07;
     schoolGlazingMaterials.push(material);
    }
   });
   central.model.name='ACTUAL-TECH-FREIRE-SCHOOL';
   scene.add(central.model);
   const box=new THREE.Box3().setFromObject(central.model,true);
   const size=box.getSize(new THREE.Vector3());
   actualSchoolOverlay=central.model;actualSchoolOverlayReady=true;
   actualSchoolOverlayStats={loaded:true,sourceMeshes:roleMeshCounts.school,batches:central.batches,
    inputTriangles:central.inputTriangles,
    visibleBounds:{min:box.min.toArray(),max:box.max.toArray(),size:size.toArray()},
    calibration:{...placement,source:SCHOOL_SOURCE,target:SCHOOL_TARGET},
    floorCount:5,storyBoundaries:[0,14.5,28.6,43.3,58.4,74.6].map(y=>+(y*placement.scale).toFixed(2)),
    axisCorrectionDeg:-90,originUpAxis:'Z+',worldUpAxis:'Y+',
    fitPolicy:'central school source meshes, uniformly scaled; flanking masses handled separately'};
   // Independent FBX masses preserve the source's original left/right location.
   // Do not hide the generated rowhouse unless the matching batch succeeds.
   for(const role of ['leftRowhouse','rightRowhouse']){
    // The original Revit FBX may contain only a thin slab or no side-building
    // meshes. Never allow such incomplete geometry to hide the intact generated
    // rowhouse (which still supplies the damage and demolition simulation).
    const count=roleMeshCounts[role];
    if(count<8){
     actualRowhouseStats[role]={loaded:false,sourceMeshes:count,processed:0,batches:0,
      fallback:'generated-rowhouse',reason:'insufficient-component-count'};
     continue;
    }
    const built=buildRole(role);
    const assessment=assessRowhouseSource(count,built.stats);
    if(built.model&&!assessment.usable){scene.remove(built.model);}
    const useSource=!!built.model&&assessment.usable;
    actualRowhouseStats[role]={loaded:useSource,sourceMeshes:count,...built.stats,
     assessment,fallback:useSource?null:'generated-rowhouse'};
    if(useSource){actualRowhouseOverlays[role]=built.model;setRowhouseSourceVisible(role,true);}
   }
   actualSchoolOverlayStats.sourcePartition=roleMeshCounts;
   actualSchoolOverlayStats.rowhouses=actualRowhouseStats;
   setMode(viewMode);
   syncStructuralDamage();
   console.info('Tech Freire three-building source partition',actualSchoolOverlayStats);
  }catch(err){status.textContent='FBX CONVERSION FAILED · PROCEDURAL FALLBACK';console.warn('Three-building FBX conversion failed',err);}
 },undefined,err=>{status.textContent='FBX SOURCE FAILED TO LOAD · PROCEDURAL FALLBACK';console.warn('Tech Freire FBX loading failed',err)});
}
// Kept as a compatibility shim for the existing impact and QA call sites.
function syncDamageHoles(){} 
const architecture=new ArchitecturalVoxels(scene,.16);
const status=document.getElementById('model-status'),modeButton=document.getElementById('model-mode');
function setMode(mode){
 viewMode=mode;
 const showSchool=performanceLab.isEnabled('schoolModel');
 const useActual=actualSchoolOverlayReady&&actualSchoolOverlay;
 syncSchoolVisibility();
 for(const role of ['leftRowhouse','rightRowhouse'])if(actualRowhouseOverlays[role])setRowhouseSourceVisible(role,showSchool);
 architecture.group.visible=false;
 for(const m of Object.values(meshes))m.visible=!architecturalReady&&schoolDamage<1&&showSchool&&!useActual;
 modeButton.textContent=mode==='real'?'ARCADE COLORS':'PHOTO COLORS';
 modeButton.disabled=!architecturalReady;
 if(actualSchoolOverlay){
  const adjusted=new Set();
  actualSchoolOverlay.traverse(mesh=>{
   if(!mesh.isMesh)return;
   for(const mat of [mesh.material].flat()){
    if(!mat.color||adjusted.has(mat))continue;
    adjusted.add(mat);
    mat.color.setHex(mat.userData.photoColor);
    if(mode==='arcade'){
     const hsl=mat.color.getHSL({});
     mat.color.setHSL(Math.round(hsl.h*12)/12,Math.min(1,hsl.s*1.25),Math.round(hsl.l*7)/7);
    }
   }
  });
 }
 status.textContent=(actualSchoolOverlayReady?'TECH FREIRE · SOURCE FBX':'TECH FREIRE · RECONSTRUCTED SCHOOL')+
  ' · '+(mode==='real'?'PHOTO COLORS':'ARCADE COLORS');
}
modeButton.onclick=()=>setMode(viewMode==='real'?'arcade':'real');
architecturalModel=neighborhood.schoolGroup;architecturalReady=true;
schoolBounds.set(new THREE.Vector3(-13.5,0,-58.4),new THREE.Vector3(13.5,28.0,.4));
schoolReconstruction=createDestructibleSchool(THREE,scene,schoolBounds);
const signCanvas=document.createElement('canvas');signCanvas.width=1024;signCanvas.height=160;
const signContext=signCanvas.getContext('2d');signContext.fillStyle='#24313b';signContext.fillRect(0,0,1024,160);signContext.textAlign='center';signContext.fillStyle='#f5d6a0';signContext.font='bold 57px sans-serif';signContext.fillText('TECH FREIRE',512,68);signContext.font='27px sans-serif';signContext.fillText('CHARTER SCHOOL',512,117);
const signTexture=new THREE.CanvasTexture(signCanvas);signTexture.colorSpace=THREE.SRGBColorSpace;
const physicalSign=new THREE.Mesh(new THREE.PlaneGeometry(8,1.25),new THREE.MeshStandardMaterial({map:signTexture,roughness:.55,emissive:0xcaa76e,emissiveMap:signTexture,emissiveIntensity:.18}));physicalSign.position.set(0,4.55,.61);schoolSignGroup.add(physicalSign);
// Disable second, independent neighboring house masses: the structural city layout
// already contains the correctly spaced real-block neighbors.
const adjacentTownhouses=null;
setMode('real');
loadActualSchoolOverlay();
// V4.1 creature overhaul: sculpted meshes, smooth forms and articulated membrane wings.
// No texture downloads; this asset ships in source and runs equally on Windows/Android WebGL.
const dragon=new THREE.Group();scene.add(dragon);
const dragonSkin=new THREE.MeshStandardMaterial({color:0x211b25,roughness:.44,metalness:.10});
const dragonHighlights=new THREE.MeshStandardMaterial({color:0x762638,roughness:.39,metalness:.10});
const dragonBelly=new THREE.MeshStandardMaterial({color:0xd2a04a,roughness:.62,metalness:.03});
const hornMat=new THREE.MeshStandardMaterial({color:0xd7b77f,roughness:.55,metalness:.08});
const wingMembrane=new THREE.MeshStandardMaterial({color:0x9441a4,roughness:.55,metalness:.03,side:THREE.DoubleSide,transparent:true,opacity:.92});
const eyeMat=new THREE.MeshStandardMaterial({color:0xffd76c,emissive:0xf08b12,emissiveIntensity:.55,roughness:.18,metalness:.03});
function smoothPart(parent,geom,mat,x,y,z,sx=1,sy=1,sz=1){const m=new THREE.Mesh(geom,mat);m.position.set(x,y,z);m.scale.set(sx,sy,sz);parent.add(m);return m;}
const orb=new THREE.SphereGeometry(1,24,16),spike=new THREE.ConeGeometry(1,1,16);
smoothPart(dragon,orb,dragonSkin,-.25,0,0,1.5,.78,.8); // torso
smoothPart(dragon,orb,dragonBelly,.05,-.23,.08,1.12,.49,.75);
const neck=smoothPart(dragon,orb,dragonHighlights,.94,.64,0,.53,.95,.52);neck.rotation.z=-.35;
smoothPart(dragon,orb,dragonSkin,1.64,1.22,0,.83,.57,.65); // skull
smoothPart(dragon,orb,dragonHighlights,2.28,.97,0,.80,.27,.45); // snout
for(const sign of [-1,1]){
 smoothPart(dragon,orb,eyeMat,2.02,1.38,sign*.52,.13,.12,.08);
 const horn=smoothPart(dragon,spike,hornMat,1.23,1.87,sign*.38,.19,.48,.17);horn.rotation.z=.45;
 for(let i=0;i<3;i++){const toe=smoothPart(dragon,spike,hornMat,-.72+i*.16,-1.06,sign*(.39+i*.12),.095,.20,.11);toe.rotation.z=Math.PI;}
 smoothPart(dragon,orb,dragonSkin,-.76,-.69,sign*.47,.33,.48,.29);
}
for(let i=0;i<8;i++){const x=-1.12+i*.38,y=.83-.08*Math.abs(i-3);const ridge=smoothPart(dragon,spike,hornMat,x,y,0,.14,.28,.25);ridge.rotation.z=.12;}
smoothPart(dragon,orb,dragonHighlights,.72,.28,0,.55,.34,.40);
for(const sign of [-1,1]){const jaw=smoothPart(dragon,orb,dragonBelly,1.98,.82,sign*.18,.30,.12,.23);jaw.rotation.z=.08*sign; const cheek=smoothPart(dragon,orb,dragonHighlights,1.56,1.05,sign*.36,.18,.15,.16); cheek.rotation.z=.18*sign;}
for(let i=0;i<7;i++){const t=i/6;const tail=smoothPart(dragon,orb,i%2?dragonHighlights:dragonSkin,-1.55-i*.45,-.1-i*.14,0,.56*(1-t)+.11,.28*(1-t)+.07,.34*(1-t)+.07);tail.rotation.z=.23;}
const wings=[];
for(const sign of [-1,1]){
 const pivot=new THREE.Group();pivot.position.set(-.3,.48,sign*.48);dragon.add(pivot);
 // Organic triangular fan with scalloped hem, thickness-free for mobile rendering.
 const pts=[[.2,0,0],[-.8,.5,sign*2.2],[-1.7,.36,sign*3.05],[-2.20,-.36,sign*2.35],[-1.6,-.13,sign*1.76],[-.85,-.48,sign*1.15]];
 const coords=[],idx=[];for(const p of pts)coords.push(...p);for(let j=1;j<pts.length-1;j++)idx.push(0,j,j+1);
 const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(coords,3));geo.setIndex(idx);geo.computeVertexNormals();
 pivot.add(new THREE.Mesh(geo,wingMembrane));
 for(const i of [1,2,3,5]){
  const to=new THREE.Vector3(...pts[i]),from=new THREE.Vector3(...pts[0]);const vec=to.clone().sub(from),len=vec.length();
  const bone=new THREE.Mesh(new THREE.CylinderGeometry(.045,.08,len,6),dragonSkin);bone.position.copy(from).addScaledVector(vec,.5);bone.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),vec.normalize());pivot.add(bone);
 }
 wings.push({pivot,sign});
}
dragon.scale.set(1.14,1.14,1.14);
dragon.scale.setScalar(1.20);
let dragonLeavingRoof=false;
function perchDragon(rest=false){
 dragonLeavingRoof=false;
 facing=1;turnTime=0;gasPose=0;dragonGroundImpact=false;recoveryLift=0;windActive=false;gustTime=0;pauloFirePoseUntil=0;
 dragon.position.set(0,schoolBounds.max.y+2.2,schoolBounds.max.z-2.6);
 dragon.rotation.x=rest?0.03:0;dragon.rotation.y=rest?0.16:0.08;dragon.rotation.z=rest?-0.08:-0.03;
 for(const wing of wings)wing.pivot.rotation.z=rest?wing.sign*.34:wing.sign*.18;
 pauloPoseDriver?.reset('idle');
 if(dragonStun<=0)invulnerable=Math.max(invulnerable,.55);
}

const dragonVisuals=enhanceDragon(THREE,dragon,wings);
// The gameplay dragon root remains the single collision/aim/camera/NPC target.
// Switch ONLY its visual child meshes; projectiles, breath, health, physics,
// invulnerability and existing shock arcs continue to use the original root.
const legacyDragonVisuals=dragon.children.map(object=>({object,visible:object.visible}));
let pauloPreviewRig=null,pauloPoseDriver=null,pauloPreviewEnabled=false,pauloFirePoseUntil=0;
const pauloPreviewButton=document.querySelector('#paulo-toggle');
const pauloPreviewAllowed=new URLSearchParams(location.search).get('paulo')==='1'||
  new URLSearchParams(location.search).get('qa')==='1';
if(pauloPreviewButton)pauloPreviewButton.hidden=!pauloPreviewAllowed;
function setPauloPreview(enabled){
 if(!pauloPreviewAllowed)return false;
 if(!!enabled===pauloPreviewEnabled)return pauloPreviewEnabled;
 if(enabled){
  let candidate=null;
  try{
   candidate=createPauloRig(THREE); // no lab-only attack particles
   // Compare at the same gameplay-camera distance as the old dragon.
   // 0.50 made Paulo look miniature in browser QA #42446279065; .68
   // restores readable head/wing detail without scaling the collision root.
   candidate.root.scale.setScalar(.68);
   candidate.root.position.set(-.30,-.10,0);
   dragon.add(candidate.root);
   const driver=createPauloPoseDriver(candidate,{initialState:'hover'});
   pauloPreviewRig=candidate;pauloPoseDriver=driver;
   for(const item of legacyDragonVisuals)item.object.visible=false;
   pauloPreviewEnabled=true;
  }catch(error){
   candidate?.dispose();
   for(const item of legacyDragonVisuals)item.object.visible=item.visible;
   console.error('Paulo preview could not initialize; original dragon remains active.',error);
   pauloPreviewRig=null;pauloPoseDriver=null;pauloPreviewEnabled=false;
   return false;
  }
 }else{
  const old=pauloPreviewRig;
  pauloPreviewRig=null;pauloPoseDriver=null;pauloPreviewEnabled=false;
  old?.dispose();
  for(const item of legacyDragonVisuals)item.object.visible=item.visible;
 }
 if(pauloPreviewButton){
  pauloPreviewButton.textContent=pauloPreviewEnabled?'🐉 Original Dragon':'🐉 Try Paulo';
  pauloPreviewButton.setAttribute('aria-pressed',String(pauloPreviewEnabled));
 }
 return pauloPreviewEnabled;
}
pauloPreviewButton?.addEventListener('click',()=>setPauloPreview(!pauloPreviewEnabled));
if(pauloPreviewAllowed)window.__DD_PAULO_PREVIEW={
 setEnabled:setPauloPreview,
 snapshot:()=>({
  enabled:pauloPreviewEnabled,
  rigMounted:!!pauloPreviewRig&&pauloPreviewRig.root.parent===dragon,
  legacyVisible:legacyDragonVisuals.every(item=>item.object.visible===item.visible),
  legacyHidden:legacyDragonVisuals.every(item=>!item.object.visible),
  visualCount:legacyDragonVisuals.length,
  visualScale:pauloPreviewRig?.root.scale.x??null,
  pose:pauloPoseDriver?.snapshot()??null,
  position:dragon.position.toArray(),
  scale:dragon.scale.toArray()
 })
};
dragon.position.set(0,2,15);
// Synthesized, license-free arcade audio. Initialized on first user gesture.
let audio=null,muted=false;
const soundButton=document.getElementById('sound-toggle');
function refreshSoundButton(){soundButton.textContent=muted?'🔇 Sound Off':'🔊 Sound On';soundButton.setAttribute('aria-pressed',String(!muted));}
soundButton.addEventListener('click',async()=>{muted=!muted;refreshSoundButton();if(!muted){try{audio??=new (window.AudioContext||window.webkitAudioContext)();await audio.resume();sound('bonus')}catch(err){console.warn('Audio unavailable',err)}}});
refreshSoundButton();
function sound(kind){if(muted)return;try{
 audio??=new (window.AudioContext||window.webkitAudioContext)();if(audio.state==='suspended')audio.resume();
 const now=audio.currentTime,osc=audio.createOscillator(),gain=audio.createGain();osc.connect(gain);gain.connect(audio.destination);
 const presets={shoot:[640,180,.14,'square',.085],impact:[140,38,.42,'sawtooth',.14],intercept:[880,280,.25,'triangle',.11],bonus:[540,1100,.3,'sine',.11],siren:[520,780,.32,'sine',.04],car:[190,110,.23,'sawtooth',.07],fire:[65,32,.24,'triangle',.035],helicopter:[105,82,.35,'sawtooth',.045],crash:[110,24,.7,'sawtooth',.2],gas:[280,52,.5,'sawtooth',.075],warning:[900,580,.18,'square',.05]};
 const [f0,f1,t,wave,vol]=presets[kind]||presets.impact;osc.type=wave;osc.frequency.setValueAtTime(f0,now);osc.frequency.exponentialRampToValueAtTime(f1,now+t);gain.gain.setValueAtTime(.0001,now);gain.gain.exponentialRampToValueAtTime(vol,now+.015);gain.gain.exponentialRampToValueAtTime(.0001,now+t);osc.start(now);osc.stop(now+t+.02);
 }catch(e){console.warn('Audio unavailable',e)}}
// Two non-shadow emergency spill lights, deliberately capped for gameplay performance.
const responseSpillLights=[new THREE.PointLight(0xff323a,0,17,2),new THREE.PointLight(0x297dff,0,17,2)];
for(const light of responseSpillLights)scene.add(light);
function updateEmergencyLighting(){
 const eligible=cars.filter(c=>c.emergency&&!c.destroyed&&!c.frozen&&c.root.visible).sort((a,b)=>Math.abs(a.root.position.x-dragon.position.x)-Math.abs(b.root.position.x-dragon.position.x));
 for(let i=0;i<responseSpillLights.length;i++){
  const lamp=responseSpillLights[i],target=eligible[i];
  if(!target){lamp.intensity=0;continue;}
  lamp.position.set(target.root.position.x,2.8,target.root.position.z);
  lamp.intensity=(.28+displayedDarkness*.85)*(Math.sin(elapsed*13+i*Math.PI)>0?3.1:.25);
 }
}
const cars=[];let carTimer=0;const nextLaneByDirection={east:0,west:0};const craters=[];let streetStop=0;const waterDropletGeometry=new THREE.SphereGeometry(.10,5,4);
const waterMat=new THREE.MeshBasicMaterial({color:0x71caff,transparent:true,opacity:.8});
const headlampMat=new THREE.MeshBasicMaterial({color:0xfff2c5});
const redLamp=new THREE.MeshBasicMaterial({color:0xff3434});
const blueLamp=new THREE.MeshBasicMaterial({color:0x448bff});
const lamps=[];
function cityLighting(){
 for(const x of [-72,-58,-44,-30,-16,-2,12,26,40,54,68]){
  block(staticGroup,x,3.5,13,.12,7,.12,material(0x45484e));
  block(staticGroup,x,7,13,1.1,.14,.15,material(0x45484e));
  block(staticGroup,x+.5,6.95,13,.25,.1,.25,new THREE.MeshBasicMaterial({color:0xffd9a0}));
  if([-58,-16,26,68].includes(x)){const light=new THREE.PointLight(0xffd7a3,0,24,2);light.position.set(x+.5,6.9,13);scene.add(light);lamps.push(light);}
 }
 {const spill=new THREE.PointLight(0xb4c7ff,0,30,2);spill.position.set(0,5,8);scene.add(spill);lamps.push(spill);}
}
cityLighting();
// Baked-looking light pools on pavement: translucent, non-shadow-casting and
// depth-safe. Unlike more point lights, these do not increase shader light count.
const streetGlowGeometry=new THREE.PlaneGeometry(1,1);
const streetGlowCanvas=document.createElement('canvas');streetGlowCanvas.width=64;streetGlowCanvas.height=64;
const streetGlowCtx=streetGlowCanvas.getContext('2d');
const roadHalo=streetGlowCtx.createRadialGradient(32,32,2,32,32,31);
roadHalo.addColorStop(0,'rgba(255,245,213,.48)');roadHalo.addColorStop(.38,'rgba(255,221,161,.18)');roadHalo.addColorStop(1,'rgba(255,216,156,0)');
streetGlowCtx.fillStyle=roadHalo;streetGlowCtx.fillRect(0,0,64,64);
const streetGlowTexture=new THREE.CanvasTexture(streetGlowCanvas);
const streetGlows=[];
for(const x of [-72,-58,-44,-30,-16,-2,12,26,40,54,68]){
 const glow=new THREE.Mesh(streetGlowGeometry,new THREE.MeshBasicMaterial({map:streetGlowTexture,transparent:true,opacity:0,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-1,side:THREE.DoubleSide}));
 glow.rotation.x=-Math.PI/2;glow.position.set(x+.5,-.345,17.5);glow.scale.set(15,11,1);scene.add(glow);streetGlows.push(glow);
}
const celestial=new THREE.Group();scene.add(celestial);
const sunDisc=new THREE.Mesh(new THREE.SphereGeometry(3.5,18,12),new THREE.MeshBasicMaterial({color:0xffe2a1}));sunDisc.position.set(-70,67,-110);celestial.add(sunDisc);
const moonDisc=new THREE.Mesh(new THREE.SphereGeometry(2.2,18,12),new THREE.MeshBasicMaterial({color:0xc9d9ef}));moonDisc.position.set(68,65,-105);celestial.add(moonDisc);
// The sky shader already draws stars and clouds. Remove the 192 obsolete
// near-camera sky meshes instead of hiding them and reusing GPU resources.
const starGroup=new THREE.Group();celestial.add(starGroup);
const clouds=new THREE.Group();celestial.add(clouds);
const skyline=new THREE.Group();skyline.name='Philadelphia skyline';staticGroup.add(skyline);
 // Keep the distant towers behind the neighborhood and let perspective set their apparent scale.
 skyline.position.set(0,-15,-349);skyline.scale.set(1.72,1.03,1.15);
 const skylineFires=[];let skylineDamage=0;
 const skylineBackdrop=createPhiladelphiaSkyline(skyline);
 const landmarkCenter=new THREE.Box3().setFromObject(skylineBackdrop.group).getCenter(new THREE.Vector3()).x;
 skylineBackdrop.group.position.x-=landmarkCenter/skyline.scale.x;
 const skylineAnchor=skylineCameraRayX({cameraX:streetView.x,cameraZ:streetView.z,targetX:0,targetZ:streetView.targetZ,skylineZ:skyline.position.z});
 skyline.position.x=skylineAnchor;
const skylineAirUniforms={opacity:{value:.26},day:{value:1}};
const skylineAir=new THREE.Mesh(new THREE.PlaneGeometry(330,140),new THREE.ShaderMaterial({transparent:true,depthWrite:false,depthTest:true,side:THREE.DoubleSide,uniforms:skylineAirUniforms,vertexShader:'varying vec2 vUv; void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',fragmentShader:'varying vec2 vUv;uniform float opacity;uniform float day;void main(){vec3 daylight=vec3(.66,.78,.88),night=vec3(.13,.20,.30);vec3 col=mix(night,daylight,day);float a=opacity*pow(max(0.,1.-vUv.y),1.5)*smoothstep(.0,.08,vUv.y);gl_FragColor=vec4(col,a);}' }));
skylineAir.position.set(0,47,12);skylineAir.name='atmospheric-depth-veil';skyline.add(skylineAir);
// Distant facade lights are integrated into building materials.
// Distant fires remain inexpensive: shared low-poly geometry and materials.
// Generated alpha flame atlas. Soft, irregular shapes replace obvious orange cone geometry.
const flameCanvas=document.createElement('canvas');flameCanvas.width=128;flameCanvas.height=192;
const fctx=flameCanvas.getContext('2d');
for(let i=0;i<10;i++){
 const cx=64+Math.sin(i*4.3)*12, cy=168-i*13;
 const radius=26-i*1.5;
 const flameGradient=fctx.createRadialGradient(cx,cy,0,cx,cy,radius);
 flameGradient.addColorStop(0,i<3?'rgba(255,244,148,.85)':'rgba(255,130,38,.60)');
 flameGradient.addColorStop(.5,'rgba(252,82,14,.38)');
 flameGradient.addColorStop(1,'rgba(160,25,7,0)');
 fctx.fillStyle=flameGradient;fctx.beginPath();fctx.ellipse(cx,cy,radius*.68,radius*1.15,0,0,Math.PI*2);fctx.fill();
}
const flameTexture=visualBank.images.flame;
const skylineFlameMat=new THREE.SpriteMaterial({map:flameTexture,color:0xffb278,transparent:true,opacity:.85,depthWrite:false});
// Volumetric-looking, irregular alpha cloud sprites rather than opaque geometric spheres.
const smokeCanvas=document.createElement('canvas');smokeCanvas.width=128;smokeCanvas.height=128;
const smokeCtx=smokeCanvas.getContext('2d'),smokeImage=smokeCtx.createImageData(128,128);
for(let yy=0;yy<128;yy++)for(let xx=0;xx<128;xx++){
 const dx=(xx-63.5)/63.5,dy=(yy-63.5)/63.5,r=Math.hypot(dx,dy),a=Math.atan2(dy,dx);
 const edge=r+.105*Math.sin(a*7+Math.cos(a*4)*2)+.065*Math.sin(a*13);
 const grain=(Math.sin(xx*.29+yy*.18)*Math.sin(yy*.27-xx*.16)+1)*.5;
 const opacity=Math.max(0,Math.min(1,(1.03-edge)*3.5))*Math.min(1,Math.max(0,(1.05-r)*4));
 const v=Math.floor(178+grain*44),i=(yy*128+xx)*4;
 smokeImage.data[i]=v;smokeImage.data[i+1]=v;smokeImage.data[i+2]=v;smokeImage.data[i+3]=Math.round(255*opacity*.78);
}
smokeCtx.putImageData(smokeImage,0,0);
const smokeTexture=visualBank.images.smoke;
const skylineSmokeMat=new THREE.SpriteMaterial({map:smokeTexture,color:0x393d43,transparent:true,opacity:.31,depthWrite:false});
function smokePuff(x,y,z,scale=3){const mat=skylineSmokeMat.clone(),sprite=new THREE.Sprite(mat);sprite.position.set(x,y,z);sprite.scale.set(scale,scale*1.13,1);return sprite;}
function updateSkylineDamage(dt){
 if(!performanceLab.isEnabled('skyline'))return;
 const neighborhoodDamage=neighborhood.targetBuildings.reduce((sum,b)=>sum+(b.damage||0),0)/Math.max(1,neighborhood.targetBuildings.length);
 const severity=Math.max(neighborhoodDamage,schoolDamage*.78);
 skylineDamage=Math.max(skylineDamage,severity);
 skylineBackdrop.setDamage(skylineDamage);
 if(performanceLab.isEnabled('fires')&&skylineDamage>.08&&skylineFires.length<Math.min(7,Math.floor(skylineDamage*10)+1)&&Math.random()<dt*.8){
  const x=(Math.random()-.5)*150,y=10+Math.random()*34;
  const fire=new THREE.Sprite(skylineFlameMat.clone());
  const puffs=Array.from({length:5},(_,i)=>smokePuff(x+(Math.random()-.5)*2,y+2+i*1.25,3-i*.25,2.4+i*.8));
  fire.position.set(x,y,3);skyline.add(fire,...puffs);skylineFires.push({fire,puffs,phase:Math.random()*7});
 }
 for(const f of skylineFires){
  f.fire.scale.set(2.5+.37*Math.sin(elapsed*5+f.phase),4.2+.60*Math.sin(elapsed*7+f.phase),1);
  f.puffs.forEach((p,i)=>{const flow=(elapsed*(.38+i*.055)+i*.22+f.phase*.08)%5;
   p.position.y=f.fire.position.y+1.2+i*1.1+flow*.5;
   p.position.x=f.fire.position.x+Math.sin(elapsed*.45+i*1.3+f.phase)*(1+i*.35);
   const width=2.3+i*.85+flow*.34;p.scale.set(width,width*1.2,1);
   p.material.opacity=.42*(1-flow/6);p.material.color.setHex(i>1?0x555a61:0x34383e);
  });
 }
}
// Restrained, camera-relative silhouette framing, inspired by layered depth in Hollow Knight.
// Keep the center and dragon flight corridor unobstructed; avoid large floating roof blocks.
// The prior opaque "foreground rooftop" silhouettes were suspended in front

// Four-lane traffic; red lights hold civilian vehicles, responders bypass signals.
let trafficLightRed=false;
const trafficSignals=[];const trafficGreen=new THREE.MeshBasicMaterial({color:0x22ed62}),trafficRed=new THREE.MeshBasicMaterial({color:0xf34135}),trafficOff=new THREE.MeshBasicMaterial({color:0x222a30});
for(const x of [-60.1,-45.9,45.9,60.1])for(const z of [12.5,35.7]){
 const pole=block(scene,x,3.2,z,.23,6.4,.23,material(0x34383c));
 const housing=block(scene,x,6.2,z,.75,1.65,.75,material(0x191c22));
 const red=new THREE.Mesh(new THREE.SphereGeometry(.23,8,6),trafficOff),green=new THREE.Mesh(new THREE.SphereGeometry(.23,8,6),trafficGreen);
 red.position.set(x,6.55,z+.42);green.position.set(x,5.95,z+.42);scene.add(red,green);trafficSignals.push({red,green});
}
function updateSignals(){trafficLightRed=(elapsed%18)>11;for(const s of trafficSignals){s.red.material=trafficLightRed?trafficRed:trafficOff;s.green.material=trafficLightRed?trafficOff:trafficGreen;}}
const vehiclePool=new Map();
const vehiclePoolStats={created:0,reused:0,recycled:0,explodedRemoved:0,originalMeshes:0,bakedBatches:0,drawCallsSaved:0,bakeFailures:0};
const vehicleMaterials=new Map();
function vehicleMaterial(hex){if(!vehicleMaterials.has(hex))vehicleMaterials.set(hex,material(hex));return vehicleMaterials.get(hex);}
function spawnCar(){if(cars.length>(schoolFire.length&&!cars.some(c=>c.fireTruck)?15:12))return;
 const severeDamage=hp<55||schoolFire.length>=3||neighborhood.targetBuildings.filter(b=>b.damage>.35).length>=5;
 const fireUrgency=schoolFire.length>0&&!cars.some(c=>c.fireTruck)&&Math.random()<.72;
 const emergency=fireUrgency||Math.random()<(severeDamage?.83:(wave>=5?Math.min(.74,.19+(wave-4)*.065):.055)),ambulance=!fireUrgency&&emergency&&(crowd.some(p=>p.down>0)||severeDamage)&&Math.random()<(severeDamage?.40:.30),police=!fireUrgency&&emergency&&!ambulance&&(wave>=6&&wave<=10?Math.random()<.85:Math.random()<.47),bike=!emergency&&Math.random()<.15,scooter=bike&&Math.random()<.55,bus=!emergency&&!bike&&Math.random()<.12,truck=!emergency&&!bus&&!bike&&Math.random()<.23,garbage=truck&&Math.random()<.31,van=!emergency&&!bus&&!truck&&!bike&&Math.random()<.24,taxi=!emergency&&!bike&&!bus&&!truck&&!van&&Math.random()<.17,dir=Math.random()<.5?1:-1;
 const bodyHex=emergency?(ambulance?0xf7f5ed:police?0xf1f1e8:0xc52c2b):(garbage?0x447b58:taxi?0xf4c747:CAR_COLORS[Math.floor(Math.random()*CAR_COLORS.length)]);
 const fireTruck=emergency&&!police&&!ambulance,ladder=fireTruck&&Math.random()<.5;
 const bodyStyle=['sedan','wagon','crossover'][Math.floor(Math.random()*3)];
 const poolKey=[bodyStyle,ladder,bike,scooter,bus,truck,garbage,van,police,ambulance,emergency,bodyHex].join('/');
 const available=vehiclePool.get(poolKey);
 const reused=available?.pop();
 const root=reused?.root||new THREE.Group();scene.add(root);if(root.userData.fireCrew)root.userData.fireCrew.visible=false;
 if(reused)vehiclePoolStats.reused++;else vehiclePoolStats.created++;
 // Fixed, alternating lane assignments: two separate lanes in each direction.
 const laneKey=dir>0?'east':'west';
 const laneIndex=(nextLaneByDirection[laneKey]++)%2;
 const rearStreet=!emergency&&Math.random()<.16;
 const laneZ=rearStreet?-37:dir>0?[17,20][laneIndex]:[27,30][laneIndex];
 root.position.set(dir>0?-88:88,-.36,laneZ);root.rotation.set(0,dir<0?Math.PI:0,0);root.scale.setScalar(rearStreet?.84:1);
 if(ambulance){const injured=crowd.find(p=>p.down>0);if(injured)root.position.x=THREE.MathUtils.clamp(injured.g.position.x-dir*11,-75,75);}
 const body=vehicleMaterial(bodyHex);
 const length=bike?2.55:ladder?8.8:bus?8:emergency&&!police?7.2:garbage?7.6:truck?6.5:van?4.9:3.7;
 let beacon=null;
 if(!reused){
 const built=buildRoadVehicle(THREE,root,{style:bodyStyle,length,bodyHex,bike,scooter,bus,truck,garbage,van,police,ambulance,emergency,fireTruck,ladder,taxi});
 beacon=built.beacon;
  for(const pivot of root.userData.frontSteer||[])batchVehicleVisuals(THREE,pivot);
  const baked=batchVehicleVisuals(THREE,root,{exclude:[beacon,root.userData.headlightBeam,...(root.userData.brakes||[])]});
  vehiclePoolStats.originalMeshes+=baked.sourceMeshes;
  vehiclePoolStats.bakedBatches+=baked.batches;
  vehiclePoolStats.drawCallsSaved+=baked.drawCallsSaved;
  vehiclePoolStats.bakeFailures+=baked.failed;
  root.userData.vehicleBeacon=beacon;
 }
 beacon=root.userData.vehicleBeacon||null;
 const turnAt=!emergency&&!rearStreet&&Math.random()<.23?(dir>0?[-53,53][Math.floor(Math.random()*2)]:[53,-53][Math.floor(Math.random()*2)]):null;
 const laneChangeAt=!emergency&&!rearStreet&&Math.random()<.27?(-37+Math.random()*74):null;
 cars.push({rearStreet,turnAt,turning:false,turnPath:null,laneChangeAt,laneChanged:false,originalLane:laneZ,root,poolKey,ice:police&&wave>=6&&wave<=10,dir,ambulance,length,bodyStyle,ladder,desiredSpeed:emergency?(severeDamage?16:wave>=7?13:10):bike?10:bus?6:garbage?5:6+Math.random()*6,driverPhase:Math.random()*6,fireTruck:emergency&&!police&&!ambulance,garbage,bike,scooter,speed:emergency?(wave>=7?12:9):bike?8+Math.random()*4:bus?5:garbage?4.6:6+Math.random()*4,emergency,police,beacon,hostile:emergency&&!ambulance&&wave>=7,laneZ,stun:0,life:90,blink:0,attackTimer:1.8,serviceStop:false,serviceSeconds:0,serviceDeparture:0,serviceProgress:0,serviceTarget:null,hoseTime:0});
}
function recycleCar(car){if(!car||car.recycled)return;car.recycled=true;scene.remove(car.root);if(car.frozen)return;
 let list=vehiclePool.get(car.poolKey);if(!list){list=[];vehiclePool.set(car.poolKey,list);}if(list.length>=4)return;
 list.push({root:car.root});vehiclePoolStats.recycled++;
}
const burningVehicles=[];
function explodeCar(car){if(car.destroyed||car.burning)return;
 car.burning=2.25;car.speed=0;car.hostile=false;car.serviceStop=true;
 const pos=car.root.position.clone();const driver=buildPerson(THREE,2.4);driver.position.set(pos.x,pos.y+.35,pos.z);scene.add(driver);
 const escapeDir=car.dir>0?-1:1;burningVehicles.push({car,driver,escapeDir,smokeTimer:0,life:2.25});
 emitImpact(pos.x,1.1,pos.z,28,.4);message('VEHICLE HIT — DRIVER EVACUATING');
}
function updateBurningVehicles(dt){for(let i=burningVehicles.length-1;i>=0;i--){const b=burningVehicles[i];b.life-=dt;b.smokeTimer-=dt;
 if(b.driver){b.driver.position.z+=b.escapeDir*dt*6;b.driver.position.x+=dt*2.8*b.car.dir;b.driver.rotation.z=Math.sin(elapsed*22)*.22;}
 if(b.smokeTimer<=0){b.smokeTimer=.12;const p=b.car.root.position;const smoke=smokePuff(p.x+(Math.random()-.5)*1.8,2+Math.random()*1.2,p.z,1.5+Math.random());scene.add(smoke);skyBursts.push({m:smoke,life:1.8,initialLife:1.8,smoke:true});}
 if(b.life<=0){const p=b.car.root.position;emitImpact(p.x,1.1,p.z,125,1.2);blast(p.x,1.2,p.z,3.3);ignite(p.x,1,p.z);sound('car');b.car.destroyed=true;b.car.burning=0;vehiclePoolStats.explodedRemoved++;if(b.driver)scene.remove(b.driver);burningVehicles.splice(i,1);}
}}
function vehicleYawTowards(car,desired,dt){
 const diff=Math.atan2(Math.sin(desired-car.root.rotation.y),Math.cos(desired-car.root.rotation.y));
 const maxRate=car.speed>1?1.15:1.6;car.root.rotation.y+=THREE.MathUtils.clamp(diff,-dt*maxRate,dt*maxRate);
 // Steer toward the projected path tangent. Angle is clamped like a road axle.
 car.steerAngle=THREE.MathUtils.clamp(diff*1.5,-.48,.48);
}
function animateVehicleSteering(car,dt){
 const turn=car.steerAngle||0;
 car.steerVisual=THREE.MathUtils.lerp(car.steerVisual||0,turn,Math.min(1,dt*5));
 for(const pivot of car.root.userData.frontSteer||[])pivot.rotation.y=car.steerVisual;
}
function curvedIntersectionPath(car){
 const x=car.root.position.x,y=car.root.position.y,z=car.root.position.z;
 const endZ=z>23?51:7,sign=Math.sign(endZ-z)||1,span=Math.abs(endZ-z);
 const endX=car.turnAt+car.dir*5;
 // Cubic approach: initial tangent faces down the road, the exit tangent
 // faces across it. Sampled once when the car enters the intersection.
 const p0=new THREE.Vector3(x,y,z),p1=new THREE.Vector3(x+car.dir*6,y,z);
 const p2=new THREE.Vector3(endX,y,endZ-sign*8),p3=new THREE.Vector3(endX,y,endZ);
 const curve=new THREE.CubicBezierCurve3(p0,p1,p2,p3);
 return Array.from({length:20},(_,i)=>curve.getPoint((i+1)/20));
}
function updateVehicleRoute(car,dt){if(car.burning)return true;
 if(car.turnPath?.length){const target=car.turnPath[0],delta=target.clone().sub(car.root.position);const distance=delta.length();if(distance<.75){car.turnPath.shift();if(!car.turnPath.length){car.life=Math.min(car.life,5);return true;}}else{vehicleYawTowards(car,Math.atan2(-delta.z,delta.x),dt);car.root.position.addScaledVector(delta,Math.min(distance,dt*car.speed)/distance);}return true;}
 if(car.turnAt!==null&&!car.turning&&(car.turnAt-car.root.position.x)*car.dir<1.6&&(car.turnAt-car.root.position.x)*car.dir> -2){car.turning=true;car.turnPath=curvedIntersectionPath(car);return true;}
 if(car.laneChangeAt!==null&&!car.laneChanged&&(car.laneChangeAt-car.root.position.x)*car.dir<1){car.laneChanged=true;const safe=choosePassingLane(car,cars,craters,{allowWithoutLeader:true});if(safe!==null)car.laneZ=safe;}
 return false;
}

// Roadside parked cars: impacted separately, and restored on game restart.
const parkedCars=[];
const parkedMaterials=[0x596d79,0x9aaca7,0x444750,0xa69b90,0x963c36].map(vehicleMaterial);
for(const [i,x,z] of [[0,-43,14.5],[1,-10,14.5],[2,26,14.5],[3,-31,34.2],[4,34,34.2],[0,70,34.2]]){
 const root=new THREE.Group();root.position.set(x,-.35,z);if(z>30)root.rotation.y=Math.PI;scene.add(root);
 buildRoadVehicle(THREE,root,{length:3.9,bodyHex:parkedMaterials[i].color.getHex()});
 batchVehicleVisuals(THREE,root);parkedCars.push({root,destroyed:false,originalPos:new THREE.Vector3(x,-.35,z)});
}
function strikeParkedCars(x,z,radius=6){for(const c of parkedCars){if(c.destroyed||Math.abs(c.root.position.x-x)>radius||Math.abs(c.root.position.z-z)>radius)continue;
 c.destroyed=true;c.root.visible=false;
 if(!c.wreck){
  const wreck=c.root.clone(true);scene.add(wreck);wreck.position.copy(c.root.position);wreck.scale.y=.58;
  wreck.rotation.y=c.root.rotation.y;wreck.rotation.z=.045;
  wreck.traverse(o=>{if(o.isMesh){o.material=o.material.clone();o.material.color?.multiplyScalar(.24);if(o.material.emissive)o.material.emissive.setHex(0);o.material.roughness=.97}});
  c.wreck=wreck;
 }else c.wreck.visible=true;
 emitImpact(c.root.position.x,1.1,c.root.position.z,88,.9);
 blast(c.root.position.x,1.2,c.root.position.z,3.2);ignite(c.root.position.x,1.0,c.root.position.z);sound('car');
}}
function resetParkedCars(){for(const c of parkedCars){c.destroyed=false;c.root.visible=true;if(c.wreck)c.wreck.visible=false;}}
const firefighterCoat=vehicleMaterial(0xb3a33b),firefighterHelmet=vehicleMaterial(0xeac73c),firefighterVisor=vehicleMaterial(0x31383c);
function ensureFireCrew(c){
 if(c.root.userData.fireCrew)return c.root.userData.fireCrew;
 const crew=new THREE.Group();crew.visible=false;c.root.add(crew);
 for(const x of [-1.0,1.1]){
  const worker=buildPerson(THREE,3);worker.position.set(x,0,2);crew.add(worker);
  const helmet=new THREE.Mesh(new THREE.SphereGeometry(.16,18,12),firefighterHelmet);helmet.scale.y=.65;helmet.position.y=1.52;worker.add(helmet);

 }
 c.root.userData.fireCrew=crew;return crew;
}
function fireTruckService(c,dt){
 if(!c.fireTruck||c.frozen)return;
 // Firefighters drive to the nearest currently burning location, including
 // the school, nearby rowhouses, and parked vehicle fires. Only stop briefly
 // in the correct travel lane; never teleport the truck to the fire.
 if(c.serviceDeparture>0){c.serviceDeparture-=dt;c.serviceStop=c.serviceDeparture>0;if(c.root.userData.fireCrew)c.root.userData.fireCrew.visible=c.serviceStop;return;}
 if(!c.serviceTarget||!schoolFire.includes(c.serviceTarget)){
  c.serviceTarget=schoolFire.reduce((best,f)=>{
   if(f.root.position.z>=-20&&(Math.abs(f.root.position.x-c.root.position.x)>48||(f.root.position.x-c.root.position.x)*c.dir< -4))return best;
   return !best||Math.abs(f.root.position.x-c.root.position.x)<Math.abs(best.root.position.x-c.root.position.x)?f:best;
  },null);
  c.serviceProgress=0;
 }
 if(!c.serviceTarget){
  const home=c.originalLane||c.laneZ;
  if(Math.abs(c.root.position.z-home)>.3){
   if(!c.returning){const turn=c.root.position.x>0?53:-53;c.route=[new THREE.Vector3(turn,c.root.position.y,c.root.position.z),new THREE.Vector3(turn,c.root.position.y,home)];c.returning=true;}
   const goal=c.route[0],delta=goal.clone().sub(c.root.position),distance=delta.length();
   if(distance<.3)c.route.shift();else{c.root.position.addScaledVector(delta,Math.min(distance,dt*6.5)/distance);vehicleYawTowards(c,Math.atan2(-delta.z,delta.x),dt);}
   c.routing=true;c.serviceStop=true;c.speed=6.5;
   if(c.route.length)return;c.root.position.z=home;c.laneZ=home;c.root.rotation.y=c.dir<0?Math.PI:0;
  }
  c.laneZ=home;c.root.position.z=home;c.root.rotation.y=c.dir<0?Math.PI:0;c.returning=false;c.routing=false;c.route=null;c.serviceStop=false;if(c.root.userData.fireCrew)c.root.userData.fireCrew.visible=false;return;
 }
 c.returning=false;
 const pos=c.serviceTarget.root.position;
 if(pos.z>=-20&&c.laneZ===-37&&!c.route?.length){const turn=c.root.position.x>0?53:-53;c.route=[new THREE.Vector3(turn,c.root.position.y,-37),new THREE.Vector3(turn,c.root.position.y,c.originalLane||17)];c.routeLane=c.originalLane||17;}
 if(pos.z< -20&&c.root.position.z> -32&&!c.route?.length){c.routeLane=-37;const turn=c.dir>0?53:-53;c.route=[new THREE.Vector3(turn,c.root.position.y,c.root.position.z),new THREE.Vector3(turn,c.root.position.y,-37),new THREE.Vector3(pos.x,c.root.position.y,-37)];c.originalLane=c.laneZ;}
 if(c.route?.length){const goal=c.route[0],delta=goal.clone().sub(c.root.position),distance=delta.length();if(distance<.3)c.route.shift();else{const step=Math.min(distance,dt*6.5);c.root.position.addScaledVector(delta,step/distance);vehicleYawTowards(c,Math.atan2(-delta.z,delta.x),dt);c.speed=6.5}c.routing=!!c.route.length;c.serviceStop=true;if(c.routing)return;c.laneZ=c.routeLane;c.dir=pos.x>c.root.position.x?1:-1;c.root.rotation.y=c.dir<0?Math.PI:0;}
 const near=Math.abs(c.root.position.x-pos.x)<5.5;
 if(!near){if(c.laneZ===-37){c.dir=pos.x>c.root.position.x?1:-1;c.root.rotation.y=c.dir<0?Math.PI:0;}c.serviceStop=false;if(c.root.userData.fireCrew)c.root.userData.fireCrew.visible=false;return;}
 c.serviceStop=true;ensureFireCrew(c).visible=true;c.serviceProgress+=dt;c.hoseTime-=dt;
 const dragonNear=c.hostile&&dragon.position.y<10&&Math.abs(dragon.position.x-c.root.position.x)<13&&Math.abs(dragon.position.z-c.root.position.z)<26;
 const target=dragonNear?dragon.position:pos;
 const source=c.root.localToWorld(new THREE.Vector3(c.ladder?2:1.28,c.ladder?3.8:1.45,1.1));
 cinematicFX.water(source,target,c.ladder?.16:.12);
 if(!dragonNear)c.serviceTarget.suppression+=dt*(c.ladder?.42:.58);
 else if(source.distanceTo(dragon.position)<22)waterDisable=Math.max(waterDisable,.3);
 // Water suppresses fire at a fixed rate. Wait at least four seconds then
 // remain another two seconds at the stop before pulling out.
 if(!dragonNear&&c.serviceProgress>=4.0){
  if(c.serviceTarget&&schoolFire.includes(c.serviceTarget)){
   fireGroup.remove(c.serviceTarget.root);
   schoolFire.splice(schoolFire.indexOf(c.serviceTarget),1);
  }
  c.serviceTarget=null;c.serviceProgress=0;c.serviceDeparture=2.1;
 }
}
function updateCars(dt){carTimer-=dt;if(carTimer<=0){spawnCar();carTimer=schoolFire.length&&!cars.some(c=>c.fireTruck)?1.2:(wave>=5?.8:1.5)+Math.random()*(wave>=5?1.1:2.6);if(hp<55||schoolFire.length>3)carTimer*=.65;}
 for(let i=cars.length-1;i>=0;i--){const c=cars[i];if(c.destroyed){recycleCar(c);cars.splice(i,1);continue;}if(c.burning)continue;if(c.ambulance){for(let pi=crowd.length-1;pi>=0;pi--){const p=crowd[pi];if(p.down>0&&Math.abs(p.g.position.x-c.root.position.x)<4&&Math.abs(p.g.position.z-c.root.position.z)<20){scene.remove(p.g);crowd.splice(pi,1);score+=40;message('AMBULANCE RESCUE +40');break;}}}c.stun=Math.max(0,c.stun-dt);if(c.fireTruck)fireTruckService(c,dt);if(c.stun===0&&!c.frozen&&!c.routing){
  const obstruction=craters.find(q=>Math.abs(q.x-c.root.position.x)<q.radius+5&&Math.abs(q.z-c.root.position.z)<5);
  const targetSpeed=Math.min(trafficTarget(c,cars,crowd,trafficLightRed,streetStop>0,elapsed),laneChangeSpeedCap(c));
  const oldSpeed=c.speed;c.speed=advanceSpeed(c.speed,targetSpeed,dt,c.emergency?2.8:1.8,5.8);
  c.braking=c.speed<oldSpeed-.015||c.speed<.25;
  for(const lamp of c.root.userData.brakes||[])lamp.material=c.braking?c.root.userData.tailBright:c.root.userData.tailDim;
  if(!c.emergency&&!c.rearStreet&&!c.turnPath?.length&&!c.routing&&c.stun===0&&!(c.windSettle>0)&&!chapterSettlement.active){
   const passing=choosePassingLane(c,cars,craters);
   if(passing!==null&&elapsed>=(c.overtakeUntil||0)){
     c.laneZ=passing;c.overtakeUntil=elapsed+6;c.laneChangeTime=0;
   }
  }
if(!updateVehicleRoute(c,dt))c.root.position.x+=c.dir*c.speed*dt;
  if(c.root.userData.ladder)c.root.userData.ladder.rotation.z=THREE.MathUtils.lerp(c.root.userData.ladder.rotation.z,c.serviceStop?.35:0,Math.min(1,dt*.8));
  if(streetStop<=0&&obstruction&&obstruction.life>0){const laneZ=c.laneZ;c.root.position.z=THREE.MathUtils.lerp(c.root.position.z,laneZ+(c.dir>0?2:-2),Math.min(1,dt*1.2));}
  else if(!c.turnPath?.length){const laneZ=c.laneZ;const error=laneZ-c.root.position.z;const lateralStep=Math.min(1,dt*(c.windRecovery>0?.05:c.windSettle>0?.48:1.65));c.root.position.z+=error*lateralStep;vehicleYawTowards(c,(c.dir<0?Math.PI:0)+laneChangeYaw(error,c.dir,c.speed),dt);c.laneChangeTime=(c.laneChangeTime||0)+dt;}
 }if(!c.frozen)c.life-=dt;c.blink+=dt;if(c.beacon)c.beacon.material=(Math.floor(c.blink*7)%2)?redLamp:blueLamp;
  if(c.hostile&&c.police&&!c.frozen&&c.stun===0&&c.speed<.5&&Math.abs(c.root.position.x)<25){
   c.attackTimer-=dt;if(c.attackTimer<=0){c.attackTimer=c.police?2.8:1.6;
    const fireTarget=!c.police&&schoolFire.length?schoolFire[Math.floor(Math.random()*schoolFire.length)]:null;
    const isDragonTarget=c.root.position.distanceTo(dragon.position)<24;
    if(isDragonTarget||fireTarget){
     const origin=c.root.position.clone().add(new THREE.Vector3(0,1.3,0));
     const hoseTarget=(!c.police&&!isDragonTarget&&fireTarget)?fireTarget.root.getWorldPosition(new THREE.Vector3()):dragon.position.clone();
     const projectile=new THREE.Mesh(new THREE.SphereGeometry(c.police?.16:.26,7,5),new THREE.MeshBasicMaterial({color:c.police?0xffdf73:0x68cfff,transparent:true,opacity:.9}));
     projectile.position.copy(origin);scene.add(projectile);
     shots.push({mesh:projectile,vel:hoseTarget.clone().sub(origin).normalize().multiplyScalar(c.police?17:13),target:hoseTarget.clone(),life:2.4,hostile:isDragonTarget,water:!c.police,fireTarget:fireTarget&&!isDragonTarget?fireTarget:null});
     if(!c.police)for(let k=1;k<8;k++){const droplet=new THREE.Mesh(waterDropletGeometry,waterMat);droplet.position.copy(origin).add(new THREE.Vector3((Math.random()-.5)*.3,.1,0));scene.add(droplet);const aimDir=hoseTarget.clone().sub(origin).normalize();shots.push({mesh:droplet,vel:aimDir.multiplyScalar(12+k*.8).add(new THREE.Vector3((Math.random()-.5)*1.4,(Math.random()-.5)*1.4,0)),target:hoseTarget.clone(),life:2.1,hostile:isDragonTarget,water:true,fireTarget:fireTarget&&!isDragonTarget?fireTarget:null});}

    }
   }
  }
  animateVehicleSteering(c,dt);
  if(c.emergency&&!c.frozen&&c.stun===0&&c.blink>2.4){sound('siren');c.blink=0;}
  if(!c.frozen&&(Math.abs(c.root.position.x)>104||(c.life<=0&&Math.abs(c.root.position.x)>80))){recycleCar(c);cars.splice(i,1)}
 }
}
// Dynamic arcade city activity. Stylized, not real-world simulation.
const helicopters=[],crowd=[],gasClouds=[];let ambulanceTimer=10;let helicopterTimer=8,crowdTimer=0,gasCooldown=0,dragonLives=3,invulnerable=0,waterDisable=0;
const heliBody=material(0xe3c23d),heliGlass=material(0x32485c),rotorMat=material(0x252b33),greenGas=new THREE.MeshBasicMaterial({color:0x6cdb4b,transparent:true,opacity:.4,depthWrite:false});
const helicopterLightPool=createStableLightPool(scene,3,()=>new THREE.SpotLight(0xe8f4ff,0,30,Math.PI/6,.6,1.5));
const helicopterModels=new Map();
function spawnHelicopter(forcedVariant=null){if(wave<5||helicopters.length>=3)return;
 // Only one ICE pursuer can deploy an electrical stream at a time.
 if(wave>=6&&wave<=10&&helicopters.some(h=>h.role==='ice'&&!h.crashing))return;
 const variant=forcedVariant??(wave>=6&&wave<=10?1:schoolFire.length&&!helicopters.some(h=>h.firefighting)&&Math.random()<.18?2:Math.floor(Math.random()*2));
 const cached=helicopterModels.get(variant)?.pop(),root=cached?.root||new THREE.Group();scene.add(root);root.rotation.set(0,0,0);root.visible=true;const dir=Math.random()<.5?1:-1;root.position.set(dir>0?-83:83,17+Math.random()*10,7-Math.random()*13);
 const {rotor,tail,beacon,firefighting}=cached||buildHelicopter(THREE,root,variant);
 root.scale.setScalar(variant===2?1.05:.9);root.rotation.y=dir<0?Math.PI:0;
 const searchlight=helicopterLightPool.acquire();
 syncHelicopterSearchlight(root,searchlight);

 helicopters.push({disorientTime:0,contactTime:0,iceCooldown:2.0,electric:null,role:wave>=6&&wave<=10&&!firefighting?'ice':firefighting?'fire':variant===1?'police':'news',loiterTime:14+Math.random()*10,variant,firefighting,waterClock:0,beacon,searchlight,root,dir,rotor,tail,speed:5+Math.random()*3,heading:dir>0?0:Math.PI,evasion:0,life:52,crashing:false,v:0,attackTimer:1.5,gasHit:false});
}
function crashHelicopter(h,gas=false){if(h.crashing)return;if(h.electric)h.electric.visible=false;h.contactTime=0;h.crashing=true;h.gasHit=gas;h.v=0;
 if(gas){h.gooResources=[];h.root.traverse(o=>{if(o.isMesh&&o.material?.color){o.material=o.material.clone();h.gooResources.push(o.material);o.material.color.setHex(0x69d64b);o.material.roughness=.18;}});for(let k=0;k<14;k++){const goo=new THREE.Mesh(new THREE.SphereGeometry(.18,8,6),new THREE.MeshStandardMaterial({color:0x74a92e,roughness:.16}));goo.position.set((Math.random()-.5)*3,(Math.random()-.5),Math.random()<.5?-.8:.8);goo.scale.set(1,.5+Math.random()*2,.4);h.gooResources.push(goo.geometry,goo.material);h.root.add(goo)}}
 emitImpact(h.root.position.x,h.root.position.y,h.root.position.z,85,.8);sound('crash');}
// Preview 13: a sustained three-dimensional electric arc, not a moving bullet.
// One reusable line mesh and one reusable bright core per ICE helicopter; no per-frame allocations of graphics objects.
const electricCoreGeometry=new THREE.CylinderGeometry(.085,.085,1,7),electricCoreMaterial=new THREE.MeshBasicMaterial({color:0xa8efff,transparent:true,opacity:.68,depthWrite:false});
const electricArcMaterial=new THREE.LineBasicMaterial({color:0x55cbff,transparent:true,opacity:.95,depthWrite:false});
const electricFrom=new THREE.Vector3(),electricTo=new THREE.Vector3(),electricMid=new THREE.Vector3();
function disposeHelicopterElectric(h){if(!h.electric)return;scene.remove(h.electric);h.electric.children[0].geometry.dispose();h.electric=null;}
const iceWarning=document.createElement('div');iceWarning.id='ice-contact-warning';
iceWarning.style.cssText='position:fixed;left:50%;top:19%;transform:translateX(-50%);z-index:30;display:none;pointer-events:none;background:#082234dd;color:#baf6ff;border:1px solid #80dcff;border-radius:7px;padding:7px 13px;text-align:center;font:800 14px system-ui;box-shadow:0 0 20px #30bbff44';
iceWarning.innerHTML='⚡ ICE ELECTRICAL CONTACT — ESCAPE!<div style="margin-top:5px;background:#123745;height:6px;width:210px;border-radius:4px"><div id="ice-contact-fill" style="width:0;height:100%;background:#78e2ff"></div></div>';
document.body.appendChild(iceWarning);
const iceContactFill=iceWarning.querySelector('#ice-contact-fill');
function updateIceStream(h,dt){
 if(h.role!=='ice')return;
 const distance=h.root.position.distanceTo(dragon.position);
 h.iceCooldown=Math.max(0,(h.iceCooldown||0)-dt);
 // A shortened 17-unit reach, delayed reacquisition and uninterrupted 3-second escape window.
 const attacking=!chapterSettlement.active&&!h.crashing&&h.disorientTime<=0&&h.iceCooldown<=0&&active&&!paused&&dragonStun<=0&&wave>=6&&wave<=10&&distance<17;

 if(!h.electric){
  const group=new THREE.Group();const positions=new Float32Array(12*2*3);
  const geometry=new THREE.BufferGeometry();const attribute=new THREE.BufferAttribute(positions,3);attribute.setUsage(THREE.DynamicDrawUsage);geometry.setAttribute('position',attribute);
  const arcs=new THREE.LineSegments(geometry,electricArcMaterial);arcs.frustumCulled=false;group.add(arcs);
  const core=new THREE.Mesh(electricCoreGeometry,electricCoreMaterial);group.add(core);scene.add(group);h.electric=group;
 }
 h.electric.visible=attacking;
 if(!attacking){if(h.contactTime>.04)h.iceCooldown=Math.max(h.iceCooldown,1.3);h.contactTime=0;iceWarning.style.display='none';return;}
 electricFrom.copy(h.root.position).add(new THREE.Vector3(0,-.75,1));electricTo.copy(dragon.position).add(new THREE.Vector3(0,.5,0));
 const diff=electricTo.clone().sub(electricFrom),len=diff.length(),segments=12;
 const arr=h.electric.children[0].geometry.attributes.position.array;
 for(let i=0;i<segments;i++){
  const a=i/segments,b=(i+1)/segments;
  for(const [idx,t] of [[0,a],[1,b]]){
   const nearEnd=Math.sin(t*Math.PI),jitter=nearEnd*.62;
   const off=Math.sin(elapsed*34+i*5+idx*2+h.root.position.x)*jitter;
   const k=Math.cos(elapsed*41+i*3+idx*4)*jitter;
   const n=i*6+idx*3;
   arr[n]=electricFrom.x+diff.x*t;
   arr[n+1]=electricFrom.y+diff.y*t+off;
   arr[n+2]=electricFrom.z+diff.z*t+k;
  }
 }
 h.electric.children[0].geometry.attributes.position.needsUpdate=true;
 const core=h.electric.children[1];core.position.copy(electricFrom).addScaledVector(diff,.5);core.scale.set(1,len,1);core.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),diff.normalize());
 // Contact must exceed two full seconds; moving out of reach interrupts the timer.
 h.contactTime+=dt;iceWarning.style.display='block';iceContactFill.style.width=Math.min(100,h.contactTime/3*100)+'%';
 if(h.contactTime>=3){h.contactTime=0;h.iceCooldown=6;stunDragon('THREE-SECOND ICE ELECTRICAL SHOCK');h.electric.visible=false;iceWarning.style.display='none';}
}
function spawnCrowd(){if(crowd.length>=42)return;for(let i=0;i<4;i++){
 const g=buildPerson(THREE,Math.floor(Math.random()*12));scene.add(g);const jaywalker=Math.random()<.13,crossing=i<3||jaywalker,fromFar=Math.random()<.5;
 const x=crossing&&!jaywalker?(Math.random()<.5?-53:53):(Math.random()-.5)*84,z=crossing?(fromFar?36:11):10.3;
 g.position.set(x,0,z);g.rotation.y=crossing?(fromFar?Math.PI:0):Math.PI/2;
 crowd.push({g,dx:crossing?0:Math.random()<.5?-1:1,dz:crossing?(fromFar?-1:1):0,crossing,jaywalker,phase:Math.random()*6,walkSpeed:1.7+Math.random()*.8,life:50+Math.random()*15,down:0,vy:0});
}}
function freezeResponder(c){if(c.frozen||!c.emergency)return false;c.frozen=true;c.stun=999;c.speed=0;c.root.traverse(o=>{if(o.isMesh){o.material=o.material.clone();o.material.color?.setHex(0x60e642);}});score+=65;return true;}
function gasAttack(){if(dragonStun>0||!active||paused||gasCooldown>0)return;gasCooldown=1.15;gasPose=.65;
 const rear=dragon.position.clone().add(new THREE.Vector3(-facing*1.2,-.35,0));
 // Large gas plume drifts outward, then descends and settles near street level.
 for(let j=0;j<38;j++){
  const m=new THREE.Sprite(new THREE.SpriteMaterial({map:visualBank.images.smoke,color:0x73cf5d,transparent:true,opacity:.42,depthWrite:false}));
  m.scale.setScalar(1.1+Math.random()*.7);m.position.copy(rear).add(new THREE.Vector3((Math.random()-.5)*1.7,(Math.random()-.5)*1.7,(Math.random()-.5)*2));scene.add(m);
  gasClouds.push({mesh:m,life:10+Math.random()*4,v:new THREE.Vector3(-facing*(5+Math.random()*5),-3-Math.random()*3,(Math.random()-.5)*3),age:0});
 }
 sound('gas');message('GAS RELEASED — CLOUD DESCENDING');updateHud();
}
// Campaign Preview 3: chapter-two incapacitation is temporary, not a life loss.
let dragonStun=0, iceGroundHits=0, blockCharge=0, blockShield=0, blockScene=0;
const iceBoltMaterial=new THREE.MeshBasicMaterial({color:0x69d9ff});
const shockArcs=[];const shockMat=new THREE.MeshLambertMaterial({color:0x87eaff,emissive:0x39aaff,emissiveIntensity:1.15,transparent:true,opacity:.9,depthWrite:false});
for(let k=0;k<9;k++){const arc=new THREE.Mesh(new THREE.BoxGeometry(.08,.08,.7),shockMat);dragon.add(arc);arc.visible=false;shockArcs.push(arc);}
let recoveryLift=0,gasPose=0,dragonGroundImpact=false;

function stunDragon(reason){
 if(dragonStun>0||invulnerable>0||!active)return;
 dragonStun=5;iceGroundHits=0;invulnerable=7;recoveryLift=0;dragonGroundImpact=false;
 emitImpact(dragon.position.x,dragon.position.y,dragon.position.z,55,.7);
 sound('warning');message(reason+' — PAULO RECOVERS IN 5 SECONDS');
}
function iceHit(reason,helicopter=false){
 if(wave<6||wave>10){hurtDragon(reason);return;}
 if(dragonStun>0||invulnerable>0)return;
 if(helicopter){stunDragon('ELECTRICAL SHOCK');return;}
 iceGroundHits++;
 invulnerable=.75;
 message('ICE PROJECTILE '+iceGroundHits+'/3 — DODGE!');
 if(iceGroundHits>=3)stunDragon('ICE GROUND ATTACK');
}
function hurtDragon(reason){if(dragonStun>0||blockShield>0||invulnerable>0||!active)return;dragonLives--;invulnerable=2.2;emitImpact(dragon.position.x,dragon.position.y,dragon.position.z,90,.6);sound('crash');message(reason+' · DRAGON LIVES '+dragonLives);if(dragonLives<=0)gameOver();}
function activateBlock(){
 if(!active||paused||blockCharge<100||blockScene>0)return;
 blockCharge=0;blockScene=10;blockShield=10;schoolShieldUntil=Math.max(schoolShieldUntil,elapsed+10);
 if(wave<=5){
  hp=Math.min(100,hp+20); // Structural repair animation is deferred; do not silently reset all damage.
  message('CALL THE BLOCK — FIREFIGHTERS AND REPAIR CREWS!');
 }else if(wave<=10){
  for(const h of helicopters)if(h.role==='ice')crashHelicopter(h,true);
  for(const c of cars)if(c.ice){c.stun=10;c.frozen=true;c.speed=0;}
  message('CALL THE BLOCK — NEIGHBORS DRIVE ICE AWAY!');
 }else{militaryOccupation.suppress(10);message('CALL THE BLOCK — NEIGHBORHOOD PROTECTION!');}
 updateBlockButton();updateHud();
}
function updateBlockButton(){const b=document.getElementById('call-block');if(!b)return;b.disabled=blockCharge<100||!active||paused;b.textContent=blockScene>0?'🛡 BLOCK RESPONDING':`📣 CALL THE BLOCK ${Math.floor(blockCharge)}%`;}
document.getElementById('call-block')?.addEventListener('click',activateBlock);

// Chapter 3 uses independently managed military units; no changes to civilian vehicle pools.
const militaryOccupation=createMilitaryOccupation({scene,dragon,getWave:()=>wave,
 onDragonHit:reason=>hurtDragon(reason),
 onMeteorHit:meteor=>removeMilitaryInterceptedMeteor(meteor),
 onBlast:(x,y,z,r)=>blast(x,y,z,r),onMessage:message,
 getCollateralStructures:()=>[neighborhood.school,...neighborhood.targetBuildings.filter(b=>!b.background)],
 onCollateral:impact=>damage(impact.x,impact.z,impact.y,{size:impact.type==='structure'?1.45:1.2,kind:'flaming'})});
const dangerZones=[];
function warnCrowd(x,z,r=13){dangerZones.push({x,z,r,ttl:4});if(dangerZones.length>12)dangerZones.shift();
 for(const p of crowd){const d=Math.hypot(p.g.position.x-x,p.g.position.z-z);if(d<r&&p.down<=0){p.down=3+Math.random()*4;p.vy=d<r*.5?4+Math.random()*5:0;p.dx=p.g.position.x<x?-1:1;}}
}
// Distant atmospheric streaks, behind the local meteor collision plane.
const distantStreaks=[];let distantTimer=3;
let backgroundDamageTimer=2.5;
// One soft, desaturated atmospheric sprite per meteor. No black geometric scribbles.
const distantVisual=createDistantMeteorVisual(THREE);
function escalateBackgroundNeighborhood(dt){
 const fronts=neighborhood.targetBuildings.filter(b=>!b.background);
 const backs=neighborhood.targetBuildings.filter(b=>b.background&&b.damage<.98);
 if(!backs.length||!fronts.length)return;
 const avgFrontDamage=fronts.reduce((a,b)=>a+b.damage,0)/fronts.length;
 if(avgFrontDamage<.12)return;
 backgroundDamageTimer-=dt;
 const cadence=THREE.MathUtils.lerp(2.8,.35,THREE.MathUtils.clamp((avgFrontDamage-.12)/.7,0,1));
 if(backgroundDamageTimer>0)return;
 backgroundDamageTimer=cadence+Math.random()*.55;
 const target=backs[Math.floor(Math.random()*backs.length)];
 const hitX=target.x+(Math.random()-.5)*target.w*.65;
 const hitY=Math.min(target.h-.4,1.4+Math.random()*Math.max(1,target.h-2.4));
 const hitZ=target.front-(Math.random()*.2);
 neighborhood.impact(hitX,hitY,hitZ,4.4+Math.random()*2.6,()=>{},.28+avgFrontDamage*.34);
 if(Math.random()<.75)cinematicSkyExplosion(hitX*.72,7+Math.random()*10,-155);
}

function updateDistantMeteors(dt){
 const chapter=currentChapter();
 const chapterIndex=CAMPAIGN_CHAPTERS.indexOf(chapter);
 const nextChapterStart=CAMPAIGN_CHAPTERS[chapterIndex+1]?.start||16;
 const waveSpan=Math.max(1,nextChapterStart-chapter.start);
 const waveProgress=THREE.MathUtils.clamp((wave-chapter.start)/waveSpan,0,1);
 const chapterRamp=wave===15?1.85:(.65+waveProgress*1.55);
 skylineEventTimer-=dt;
 if(skylineEventTimer<=0){skylineEventTimer=Math.max(.35,(2.65-wave*.06)/chapterRamp)+Math.random()*.85;
  const targetX=(Math.random()-.5)*128;
  const targetY=18+Math.random()*18+(chapterRamp-1)*3;
  cinematicSkyExplosion(targetX,targetY,-155);
  if(Math.random()<.35+.38*waveProgress)cinematicSkyExplosion(targetX+(Math.random()-.5)*24,targetY+4+Math.random()*8,-155);
 }
 distantTimer-=dt;
 const streakCap=Math.min(58,Math.round(18+wave*2+waveProgress*18+(wave===15?8:0)));
 if(distantTimer<=0&&distantStreaks.length<streakCap){
  distantTimer=Math.max(.06,(.78/(1+wave*.18))/chapterRamp)+Math.random()*.18;
  const sprite=new THREE.Sprite(distantVisual.material);
  const x=(Math.random()-.5)*220,y=56+Math.random()*44;
  sprite.position.set(x,y,15);const size=2.1+Math.random()*1.4;
  sprite.scale.set(size,7.5+Math.random()*5.5,1);skyline.add(sprite);
  distantStreaks.push({sprite,life:5.2,v:16+Math.random()*14+waveProgress*5,impact:Math.random()<(.58+waveProgress*.25),waveProgress});
 }
 for(let i=distantStreaks.length-1;i>=0;i--){const s=distantStreaks[i];s.life-=dt;s.sprite.position.x+=dt*s.v*.18;s.sprite.position.y-=dt*s.v;
  if(s.sprite.position.y<36&&s.impact){const pos=s.sprite.position;
   // Strikes snap to an actual distant landmark facade (and apply limited
   // cosmetic tower damage), rather than exploding in the empty skyline.
   skyline.updateWorldMatrix(true,false);
   const impact=skylineBackdrop.strikeNearest(pos.x)||skyline.localToWorld(pos.clone());
   cinematicSkyExplosion(impact.x,impact.y,impact.z);
   if(Math.random()<.22+s.waveProgress*.28)cinematicSkyExplosion(impact.x+(Math.random()-.5)*11,impact.y+2,impact.z);
   s.impact=false;s.life=0;
  }
  if(s.life<=0){skyline.remove(s.sprite);distantStreaks.splice(i,1);}
 }
}
const skyBurstGeometry=new THREE.PlaneGeometry(1,1);
const skyBurstMat=new THREE.MeshBasicMaterial({map:visualBank.images.flash,color:0xffc18e,transparent:true,opacity:.8,depthWrite:false,side:THREE.DoubleSide,blending:THREE.AdditiveBlending});
const skyBursts=[];let skylineEventTimer=3;
function cinematicSkyExplosion(x,y,z){if(skyBursts.length>=40)return;
 if(Math.random()<.13&&skyBursts.length<25){ // Occasional distant mushroom plume: rising column and broad crown.
  for(let j=0;j<7;j++){const smoke=smokePuff(x,y+j*1.8,z,j<3?2.5:4.3);smoke.material.color.setHex(j<3?0xff9951:0x45474d);smoke.position.set(x+(Math.random()-.5)*2,y+j*1.8,z);smoke.scale.set(j<3?2.5+j*.8:4+(j-3)*1.4,j<3?3+j:5+(j-3)*1.6,1);scene.add(smoke);skyBursts.push({m:smoke,life:2.5,initialLife:2.5,smoke:true});}
 }
 const m=new THREE.Mesh(skyBurstGeometry,skyBurstMat.clone());m.position.set(x,y,z);scene.add(m);skyBursts.push({m,life:.8,initialLife:.8});if(skyBursts.length>40){const b=skyBursts.shift();scene.remove(b.m);b.m.material.dispose();}}
function updateSkyBursts(dt){for(let i=skyBursts.length-1;i>=0;i--){const b=skyBursts[i];b.life-=dt;if(b.smoke){b.m.position.y+=dt*1.5;
 const proximity=b.m.position.distanceTo(dragon.position);
 if(proximity<15){const strength=(1-proximity/15)*dt*(3+Math.abs(Math.sin(elapsed*9))*5);
  b.m.position.x+=(b.m.position.x-dragon.position.x>=0?1:-1)*strength;
  b.m.position.z+=(b.m.position.z-dragon.position.z>=0?1:-1)*strength*.4;
 }
 // Local smoke from vehicle fires and background explosions bends away
 // from the blast and briefly disperses. Reuse existing puff sprites.
 if(windActive){
  const rx=b.m.position.x-gustOrigin.x,ry=b.m.position.y-gustOrigin.y,rz=b.m.position.z-gustOrigin.z;
  const along=rx*gustDirection.x+ry*gustDirection.y+rz*gustDirection.z;
  const across=Math.sqrt(Math.max(0,rx*rx+ry*ry+rz*rz-along*along));
  if(along>0&&along<48&&across<8+along*.35){
   const strength=(1-across/(8+along*.35))*Math.max(0,1-along/65);
   b.m.position.addScaledVector(gustDirection,dt*9*strength);
   b.windThin=Math.min(.60,(b.windThin||0)+dt*.8*strength);
  }
 }
 b.m.scale.multiplyScalar(1+dt*.18);
 b.m.material.opacity=Math.max(0,b.life/b.initialLife)*.58*(1-(b.windThin||0));}else{b.m.scale.setScalar(1+(1-b.life/.8)*5);b.m.material.opacity=Math.max(0,b.life/.8)*.75;}if(b.life<=0){scene.remove(b.m);if(!b.m.isSprite&&b.m.geometry!==skyBurstGeometry)b.m.geometry?.dispose();b.m.material.dispose();skyBursts.splice(i,1)}}}
function addCrater(x,z,radius=3){
 const mesh=new THREE.Mesh(new THREE.RingGeometry(radius*.55,radius,20),new THREE.MeshBasicMaterial({color:0x23180e,side:THREE.DoubleSide,depthWrite:false}));
 mesh.rotation.x=-Math.PI/2;mesh.position.set(x,.11,z);scene.add(mesh);
 const inner=new THREE.Mesh(new THREE.CircleGeometry(radius*.56,20),new THREE.MeshBasicMaterial({color:0x0d0c0c,side:THREE.DoubleSide}));inner.rotation.x=-Math.PI/2;inner.position.set(x,.105,z);scene.add(inner);
 craters.push({x,z,radius,mesh,inner,life:120});streetStop=Math.max(streetStop,20);
 if(craters.length>7){const c=craters.shift();scene.remove(c.mesh,c.inner);c.mesh.geometry.dispose();c.inner.geometry.dispose();}
}
function updateCraters(dt){streetStop=Math.max(0,streetStop-dt);for(let i=craters.length-1;i>=0;i--){const c=craters[i];c.life-=dt;if(c.life<=0){scene.remove(c.mesh,c.inner);c.mesh.geometry.dispose();c.inner.geometry.dispose();craters.splice(i,1)}}}
function updateWorld(dt){
 militaryOccupation.update(dt,meteors,shots);updateCraters(dt);if(performanceLab.isEnabled('backgroundMeteors'))updateSkyBursts(dt);updateSignals();updateSkylineDamage(dt);
 if(performanceLab.isEnabled('backgroundMeteors')){updateDistantMeteors(dt);escalateBackgroundNeighborhood(dt);}
 for(let i=dangerZones.length-1;i>=0;i--)if((dangerZones[i].ttl-=dt)<=0)dangerZones.splice(i,1);
 const previousStun=dragonStun;invulnerable=Math.max(0,invulnerable-dt);dragonStun=Math.max(0,dragonStun-dt);if(previousStun>0&&dragonStun===0){recoveryLift=2.5;dragonGroundImpact=false;message('PAULO GETS UP, FLAPS HIS WINGS AND TAKES FLIGHT');}blockShield=Math.max(0,blockShield-dt);blockScene=Math.max(0,blockScene-dt);if(dragonStun>0){
 const beforeY=dragon.position.y;dragon.position.y=THREE.MathUtils.lerp(beforeY,1.3,Math.min(1,dt*3.4));
 dragon.rotation.z=Math.sin(elapsed*35)*.14;
 if(!dragonGroundImpact&&dragon.position.y<1.65){dragonGroundImpact=true;shake=Math.max(shake,.35);emitImpact(dragon.position.x,.7,dragon.position.z,20,.3);sound('impact');}
}else dragon.rotation.z=THREE.MathUtils.lerp(dragon.rotation.z,0,Math.min(1,dt*5));waterDisable=Math.max(0,waterDisable-dt);gasCooldown=Math.max(0,gasCooldown-dt);dragon.visible=dragonStun>0||invulnerable<=0||Math.floor(elapsed*11)%2===0;
 updateBurningVehicles(dt);if(performanceLab.isEnabled('helicopters'))helicopterTimer-=dt;if(performanceLab.isEnabled('helicopters')&&wave>=5&&helicopterTimer<=0){spawnHelicopter();helicopterTimer=6+Math.random()*7;}
 for(let i=helicopters.length-1;performanceLab.isEnabled('helicopters')&&i>=0;i--){const h=helicopters[i];h.life-=dt;h.rotor.rotation.y+=dt*28;h.tail.rotation.z+=dt*22;if(!h.crashing){
   // Cockpit forward visibility is deliberately limited: ~64-degree field of view.
   const forward=new THREE.Vector3(Math.cos(h.heading),0,-Math.sin(h.heading));let nearest=null,nearestT=Infinity;
   for(const meteor of meteors){if(meteor.grounded||!meteor.mesh)continue;const delta=meteor.mesh.position.clone().sub(h.root.position);const dist=delta.length();if(dist>24||dist<.001||forward.dot(delta.clone().normalize())<.85)continue;
    const velocity=meteor.vel||new THREE.Vector3(0,-4,0),relative=velocity.clone().addScaledVector(forward,-h.speed);const closing=-delta.dot(relative)/Math.max(.01,relative.lengthSq());
    if(closing>=0&&closing<3.5&&delta.clone().addScaledVector(relative,closing).length()<5&&closing<nearestT){nearest=meteor;nearestT=closing;}}
   h.evasion=Math.max(0,h.evasion-dt);if(nearest&&h.evasion<.1){h.evasion=1.2;h.dodgeSide=(nearest.mesh.position.x>h.root.position.x?-1:1);}
   if(h.evasion>0){h.root.position.x+=h.dodgeSide*dt*h.speed*1.4;h.root.position.y+=dt*3.8;}
   const wantedHeading=h.evasion>0?(h.dodgeSide>0?0:Math.PI):h.dir>0?0:Math.PI;
   const turn=Math.atan2(Math.sin(wantedHeading-h.heading),Math.cos(wantedHeading-h.heading));h.heading+=THREE.MathUtils.clamp(turn,-dt*2.2,dt*2.2);
   h.root.rotation.y=h.heading;const desiredBank=THREE.MathUtils.clamp(-turn*.19+(h.evasion>0?h.dodgeSide*.34:0),-.42,.42);
   h.root.rotation.z=THREE.MathUtils.lerp(h.root.rotation.z,desiredBank,Math.min(1,dt*2.4));
  }
  h.beacon.visible=Math.sin(elapsed*9+h.root.position.x)>.15;
  h.searchlight.intensity=wave>=5?Math.min(2.2,Math.max(0,(wave-3)*.55)):0;
  if(h.crashing){h.v-=9.81*dt;h.root.position.y+=h.v*dt;h.root.rotation.z+=dt*(.7+Math.min(2.1,Math.abs(h.v)*.09));h.root.rotation.y+=dt*.85;
   if(h.root.position.y<1){emitImpact(h.root.position.x,1,h.root.position.z,140,1.2);sound('impact');neighborhood.impact(h.root.position.x,5,h.root.position.z,4,p=>debrisPiece(p,'brick'));h.life=0;if(h.gasHit){for(let j=0;j<7;j++){const m=new THREE.Sprite(new THREE.SpriteMaterial({map:visualBank.images.smoke,color:0x6ab85b,transparent:true,opacity:.45,depthWrite:false}));m.scale.set(2.1,2.4,1);m.position.copy(h.root.position).add(new THREE.Vector3((Math.random()-.5)*3,Math.random()*2,(Math.random()-.5)*2));scene.add(m);gasClouds.push({mesh:m,life:8,v:new THREE.Vector3(0,0,0),age:0});}}}}
  else {h.disorientTime=Math.max(0,h.disorientTime-dt);
   if(h.disorientTime>0){
    // Tumble, lose altitude briefly, then increasingly regain level flight as timer expires.
    const strength=Math.min(1,h.disorientTime/1.2);
    h.root.position.x+=dt*(h.dir*h.speed*.34+Math.sin(elapsed*7+h.variant)*3.8*strength);
    h.root.position.y+=dt*(-1.0*strength+Math.sin(elapsed*11+h.variant)*2.6*strength);
    h.root.position.y=Math.max(4,h.root.position.y);
    h.heading+=dt*(2.2*strength+.1);
    h.root.rotation.y=h.heading;
    h.root.rotation.z=THREE.MathUtils.lerp(h.root.rotation.z,Math.sin(elapsed*13+h.variant)*.92*strength,Math.min(1,dt*6));
    h.root.rotation.x=Math.sin(elapsed*10+h.variant)*.40*strength;
   } else {h.root.rotation.x=THREE.MathUtils.lerp(h.root.rotation.x,0,Math.min(1,dt*4));h.loiterTime-=dt;if((h.role==='police'||h.role==='ice')&&h.loiterTime>0){const targetX=dragon.position.x-h.dir*8;h.root.position.x+=THREE.MathUtils.clamp(targetX-h.root.position.x,-h.speed*(h.role==='ice'?.75:1.6)*dt,h.speed*(h.role==='ice'?.75:1.6)*dt);h.root.position.y=THREE.MathUtils.lerp(h.root.position.y,dragon.position.y+9,Math.min(1,dt*(h.role==='ice'?.23:.5)));h.root.position.z=THREE.MathUtils.lerp(h.root.position.z,dragon.position.z-9,Math.min(1,dt*(h.role==='ice'?.28:.6)));}
   else if(h.role==='news'&&h.loiterTime>0&&Math.abs(h.root.position.x)<55){const event=schoolFire[0]?.root.position||new THREE.Vector3(0,8,0);h.root.position.x+=THREE.MathUtils.clamp(event.x-h.root.position.x,-h.speed*dt,h.speed*dt);h.root.position.y=THREE.MathUtils.lerp(h.root.position.y,Math.max(22,event.y+12),dt*.3);}
   else if(!h.firefighting||!schoolFire.length)h.root.position.x+=h.dir*h.speed*dt;h.root.position.y+=Math.sin(elapsed*2+i)*dt*.45;
   if(h.firefighting&&schoolFire.length){const f=schoolFire.reduce((a,b)=>Math.abs(a.root.position.x-h.root.position.x)<Math.abs(b.root.position.x-h.root.position.x)?a:b);
    h.root.position.x=THREE.MathUtils.lerp(h.root.position.x,f.root.position.x,Math.min(1,dt*.7));h.root.position.z=THREE.MathUtils.lerp(h.root.position.z,f.root.position.z,Math.min(1,dt*.7));
    h.root.position.y=THREE.MathUtils.lerp(h.root.position.y,Math.max(16,f.root.position.y+10),Math.min(1,dt*.5));if(Math.abs(h.root.position.x-f.root.position.x)<5){const source=h.root.position.clone().add(new THREE.Vector3(0,-1,0));cinematicFX.water(source,f.root.position,.3);f.suppression+=dt*.48;}

   }
   // ICE streams are persistent beams, while police use discrete projectiles.
   if(wave>8&&h.role==='police'&&h.disorientTime<=0){h.attackTimer-=dt;if(h.attackTimer<=0&&Math.abs(h.root.position.x-dragon.position.x)<26){h.attackTimer=1.3+Math.random();const m=new THREE.Mesh(sharedShotGeometry,mats.fire);m.position.copy(h.root.position);scene.add(m);shots.push({mesh:m,vel:dragon.position.clone().sub(m.position).normalize().multiplyScalar(23),target:dragon.position.clone(),life:2.5,hostile:true});}}
   }
   updateIceStream(h,dt);
   if(h.root.position.distanceTo(dragon.position)<2.7)hurtDragon('HELICOPTER COLLISION');
   for(const m of meteors)if(!m.grounded&&m.mesh?.position.distanceTo(h.root.position)<Math.max(2.2,(m.size||1)*.8+1.5))crashHelicopter(h);
   for(const b of blasts)if(h.root.position.distanceTo(b.mesh.position)<b.r+1.5) {crashHelicopter(h);score=Math.max(0,score-250);message('HELICOPTER HIT! -250');}
  }
  syncHelicopterSearchlight(h.root,h.searchlight);
  if(h.life<=0||Math.abs(h.root.position.x)>90){if(!h.crashing&&h.life>0){score+=150;message('HELICOPTER ESCORT +150');sound('bonus');updateHud();}disposeHelicopterElectric(h);scene.remove(h.root);for(const resource of h.gooResources||[])resource.dispose();if(!h.gasHit){const pool=helicopterModels.get(h.variant)||[];if(pool.length<3)pool.push(h);helicopterModels.set(h.variant,pool)}helicopterLightPool.release(h.searchlight);helicopters.splice(i,1)}
 }
 if(performanceLab.isEnabled('pedestrians'))crowdTimer-=dt;if(performanceLab.isEnabled('pedestrians')&&crowdTimer<=0){spawnCrowd();crowdTimer=4.4;}
 for(let i=crowd.length-1;performanceLab.isEnabled('pedestrians')&&i>=0;i--){const p=crowd[i];const previousX=p.g.position.x,previousZ=p.g.position.z;p.life-=dt;const threat=dangerZones.find(d=>Math.abs(p.g.position.x-d.x)<d.r&&Math.abs(p.g.position.z-d.z)<d.r);
  if(threat){p.dx=p.g.position.x<threat.x?-1:1;p.life=Math.max(p.life,3)}
  if(p.down>0){p.down-=dt;p.vy-=14*dt;p.g.position.y=Math.max(0,p.g.position.y+p.vy*dt);if(p.g.position.y===0)p.vy=0;p.g.rotation.z=THREE.MathUtils.lerp(p.g.rotation.z,p.dx*1.25,Math.min(1,dt*7));}
  else{if(p.crossing){if(trafficLightRed||p.jaywalker||p.g.position.z>13&&p.g.position.z<35)p.g.position.z+=p.dz*dt*(threat?5:p.walkSpeed);if(p.g.position.z>40||p.g.position.z<9)p.life=0;}else p.g.position.x+=p.dx*dt*(threat?8:2+Math.sin(elapsed+p.phase));const distance=updatePedestrianPose(p,previousX,previousZ,dt);p.walkCycle=(p.walkCycle||0)+distance*4;animatePerson(p.g,p.walkCycle,distance>.0001);p.g.rotation.z=THREE.MathUtils.lerp(p.g.rotation.z,0,Math.min(1,dt*8));}
  if(p.life<=0||Math.abs(p.g.position.x)>85){scene.remove(p.g);crowd.splice(i,1)} }
 for(let i=gasClouds.length-1;i>=0;i--){const c=gasClouds[i];c.life-=dt;c.age+=dt;
  c.v.y-=dt*9.5;c.v.x*=Math.max(0,1-dt*.2);c.mesh.position.addScaledVector(c.v,dt);
  if(c.mesh.position.y<.9){c.mesh.position.y=.9;c.v.y=0;c.v.x*=Math.max(0,1-dt*2);}
  c.mesh.material.opacity=Math.max(0,Math.min(.46,c.life*.12));c.mesh.scale.multiplyScalar(1+dt*.14);
  for(const f of schoolFire)if(f.root.position.distanceTo(c.mesh.position)<4.8)f.suppression=Math.min(1,f.suppression+dt*.32);
  for(const h of helicopters)if(performanceLab.isEnabled('helicopters')&&!h.crashing&&h.root.position.distanceTo(c.mesh.position)<3.8)crashHelicopter(h,true);
  for(const car of cars)if(performanceLab.isEnabled('traffic')&&car.emergency&&!car.frozen&&car.life>0&&Math.abs(car.root.position.x-c.mesh.position.x)<5.6&&Math.abs(car.root.position.z-c.mesh.position.z)<6.2&&c.mesh.position.y<7.2)freezeResponder(car);
  if(c.life<=0){scene.remove(c.mesh);if(!c.mesh.isSprite)c.mesh.geometry?.dispose();c.mesh.material.dispose();gasClouds.splice(i,1)}
 }
 for(const c of cars){if(!performanceLab.isEnabled('traffic'))break;if(c.hostile&&c.police&&!c.frozen&&c.stun<=0&&Math.abs(c.root.position.x-dragon.position.x)<16&&Math.abs(c.root.position.z-dragon.position.z)<18&&Math.random()<dt*.28){
  const m=new THREE.Mesh(new THREE.SphereGeometry(.16,6,4),mats.fire);m.position.copy(c.root.position).add(new THREE.Vector3(0,1.3,0));scene.add(m);
  shots.push({mesh:m,vel:dragon.position.clone().sub(m.position).normalize().multiplyScalar(19),target:dragon.position.clone(),life:1.8,hostile:true,iceGround:c.ice});sound('warning');}
  if(dragon.position.y<2.3&&Math.abs(c.root.position.x-dragon.position.x)<2.7&&Math.abs(c.root.position.z-dragon.position.z)<2.3)hurtDragon('TRAFFIC COLLISION');
 }
}
// Game logic
let interceptionStreak=0,rapidFireUntil=0,schoolShieldUntil=0;
const sessionStats={start:0,shots:0,intercepts:0,militaryInterceptions:0,hunters:0,damage:0,highestWave:1,deaths:0,powerups:0,frames:0,frameTimeTotal:0};
const waveStats=[];
// Rolling frame-time samples for actual playtest comparisons; samples are bounded.
const playtestFrameMs=[];let peakDrawCalls=0;const stallEvents=[];
function playtestPercentile(p){if(!playtestFrameMs.length)return null;const sorted=[...playtestFrameMs].sort((a,b)=>a-b);return +(sorted[Math.min(sorted.length-1,Math.floor((sorted.length-1)*p))]).toFixed(1);}
function telemetrySnapshot(){return {version:GAME_VERSION,build:BUILD_ID,difficulty:document.getElementById('difficulty')?.value||'normal',graphics:visualPreset,durationSeconds:Math.round(elapsed),wave,score,schoolHealth:hp,dragonLives,...sessionStats,accuracy:sessionStats.shots?+(sessionStats.intercepts/sessionStats.shots).toFixed(3):0,waves:waveStats,performance:{bimBatch:window.__DD_BIM_BATCH||null,averageFPS:sessionStats.frameTimeTotal?+(sessionStats.frames/sessionStats.frameTimeTotal).toFixed(1):null,p95FrameMs:playtestPercentile(.95),p99FrameMs:playtestPercentile(.99),peakDrawCalls,sampleCount:playtestFrameMs.length,
  staticStreetBatch:streetBatchStats,cityExtensionProps:cityExtensions.propsEstimate,parkedCars:parkedCars.length,neighborhoodBatches:neighborhood.batchStats,skyline:skylineBackdrop.getStats(),vehiclePool:vehiclePoolStats,meteorAssets:rockStats,blastPool:blastStats,
  adaptiveResolution:+adaptiveResolution.toFixed(2),adaptiveAdjustments,maxRenderFPS,
  performanceLab:performanceLab.export(),captureLab: {history:captureLab.history()},frameHealth:frameHealth.summary(),
  simulationCpuMs:percentiles(detailedTimings.sim),renderSubmissionCpuMs:percentiles(detailedTimings.render),
  stalls:stallEvents.slice(-45),
  warning:'renderSubmissionCpuMs is CPU submission time, not a GPU timestamp. Large RAF gaps may arise outside instrumented game code; see frameHealth.'}};}
function exportTelemetry(){const blob=new Blob([JSON.stringify(telemetrySnapshot(),null,2)],{type:'application/json'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='dragon-defense-session-'+Date.now()+'.json';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000)}
document.getElementById('export-stats')?.addEventListener('click',exportTelemetry);
function updatePowerHud(){const e=document.getElementById('power-status');if(!e)return;const rapid=Math.max(0,rapidFireUntil-elapsed),shield=Math.max(0,schoolShieldUntil-elapsed);e.textContent=`INTERCEPT ${interceptionStreak}/5  |  RAPID ${rapid.toFixed(1)}s  |  SHIELD ${shield.toFixed(1)}s`;}
const hunterWarnings=[];
function warnHunter(){const el=document.getElementById('hunter-warning');if(el){el.textContent='⚠ FLAMING METEOR INBOUND — DODGE OR INTERCEPT';el.style.opacity='1';setTimeout(()=>{el.style.opacity='0'},1800)}}

let score=0,hp=100,wave=1,active=false,paused=false,spawnTimer=0,remaining=0,between=0,stormTimer=0,elapsed=0,shake=0,cooldown=0;
const effects=new THREE.Group();scene.add(effects);
const effectObjects=[];
const sharedTrailGeometry=new THREE.IcosahedronGeometry(1,0);
const sharedSmokeMaterial=new THREE.MeshBasicMaterial({color:0x55565b,transparent:true,opacity:.45,depthWrite:false});
const sharedEmberMaterial=new THREE.MeshBasicMaterial({color:0xffa329});
function crackWindows(x,y,z,r){
 let count=0;
 for(const w of nightWindows){if(w.broken||(w.surface&&!w.surface.alive)||Math.abs(w.x-x)>r||Math.abs(w.y-y)>r||Math.abs(w.z-z)>r+5)continue;
  w.broken=true;w.mesh.visible=false;count++;
  // Glass fragments are temporary impact particles; no persistent floating crack geometry.
  if(count<=8)emitImpact(w.x,w.y,w.z,9,.22);
 }
 return count;
}
// GPU instancing: one draw call per particle material, not per particle.
const impactPalette=[0xff4b20,0xffa52a,0xffef8b,0x544d4d,0xc7a88a,0xffffff];
const fxPlane=new THREE.PlaneGeometry(1,1);
const glassShardGeometry=new THREE.BufferGeometry();glassShardGeometry.setAttribute('position',new THREE.Float32BufferAttribute([-.8,-.3,0,.9,-.1,0,-.2,1,0],3));glassShardGeometry.computeVertexNormals();
const impactPools=impactPalette.map((color,index)=>new InstancedParticlePool({THREE,parent:effects,geometry:index===5?glassShardGeometry:fxPlane,material:new THREE.MeshBasicMaterial({color,map:index===5?null:index===3?visualBank.images.smoke:index===4?visualBank.images.dust:visualBank.images.flash,transparent:true,opacity:index===3?.52:.88,depthWrite:false,side:THREE.DoubleSide,blending:index<3?THREE.AdditiveBlending:THREE.NormalBlending}),capacity:105}));
const trailSmokePool=new InstancedParticlePool({THREE,parent:effects,geometry:fxPlane,material:new THREE.MeshBasicMaterial({map:visualBank.images.smoke,color:0x4e525c,transparent:true,opacity:.53,depthWrite:false,side:THREE.DoubleSide}),capacity:110});
const trailEmberPool=new InstancedParticlePool({THREE,parent:effects,geometry:fxPlane,material:new THREE.MeshBasicMaterial({map:visualBank.images.flame,color:0xffbe62,transparent:true,opacity:.90,depthWrite:false,side:THREE.DoubleSide,blending:THREE.AdditiveBlending}),capacity:110});
const quality=new AdaptiveQuality();
const impactParticles=[];const trailParticles=[];
function emitImpact(x,y,z,count=170,power=1){
 if(!performanceLab.isEnabled('particles'))return;
 const budget=quality.particleBudget(Math.min(count,35),impactParticles.length,210);
 for(let i=0;i<budget;i++){
  const smoke=i%4===0,idx=smoke?3:i%impactPools.length;
  const angle=Math.random()*Math.PI*2,b=(Math.random()-.22)*Math.PI;
  const speed=(smoke?2.5:9+Math.random()*14)*power;
  impactParticles.push({pool:idx,position:new THREE.Vector3(x+(Math.random()-.5)*1.3,y+(Math.random()-.5)*1.3,z+(Math.random()-.5)*1.3),velocity:new THREE.Vector3(Math.cos(angle)*Math.cos(b)*speed,Math.sin(b)*speed+3,Math.sin(angle)*Math.cos(b)*speed),scale:(smoke?.47:.13)*(.5+Math.random()*1.4)*power,life:smoke?1.6:.64,ttl:smoke?1.6:.64,smoke});
 }
 if(effectObjects.length>14)return;
 const surface=y<2.5;
 const ring=surface?new THREE.Mesh(new THREE.RingGeometry(.84,.96,28),new THREE.MeshBasicMaterial({color:0xffd59a,transparent:true,opacity:.34,side:THREE.DoubleSide,depthWrite:false})):
  new THREE.Mesh(new THREE.PlaneGeometry(1,1),new THREE.MeshBasicMaterial({map:visualBank.images.flash,color:0xffd695,transparent:true,opacity:.8,depthWrite:false,side:THREE.DoubleSide,blending:THREE.AdditiveBlending}));
 ring.position.set(x,y,z);if(surface)ring.rotation.x=-Math.PI/2;effects.add(ring);effectObjects.push({mesh:ring,ring:surface,life:.26,ttl:.26});
}
function emitTrail(position,smoky){
 if(!performanceLab.isEnabled('particles'))return;
 if(trailParticles.length>=180)return;
 trailParticles.push({position:position.clone(),velocity:new THREE.Vector3(0,1,0),scale:smoky?.28:.21,life:.5,ttl:.5,smoky});
}
function updateEffects(dt){
 for(let i=effectObjects.length-1;i>=0;i--){const e=effectObjects[i];e.life-=dt;
  const r=1+(1-e.life/e.ttl)*8;e.mesh.scale.setScalar(r);e.mesh.material.opacity=Math.max(0,e.life/e.ttl)*.8;
  if(e.life<=0){effects.remove(e.mesh);e.mesh.geometry.dispose();e.mesh.material.dispose();effectObjects.splice(i,1)}
 }
 for(const pool of impactPools)pool.begin();trailSmokePool.begin();trailEmberPool.begin();
 for(let i=impactParticles.length-1;i>=0;i--){const e=impactParticles[i];e.life-=dt;
  if(e.life<=0){impactParticles.splice(i,1);continue;}
  e.velocity.y-=(e.smoke?-.45:17)*dt;e.position.addScaledVector(e.velocity,dt);
  e.scale*=e.smoke?1+dt*.5:Math.max(.01,1-dt*.3);
  impactPools[e.pool].add(e.position,e.scale);
 }
 for(let i=trailParticles.length-1;i>=0;i--){const e=trailParticles[i];e.life-=dt;
  if(e.life<=0){trailParticles.splice(i,1);continue;}
  e.position.addScaledVector(e.velocity,dt);
  (e.smoky?trailSmokePool:trailEmberPool).add(e.position,e.scale*Math.max(.05,e.life/e.ttl));
 }
 for(const pool of impactPools)pool.end();trailSmokePool.end();trailEmberPool.end();
}
const meteors=[],shots=[],blasts=[],debris=[];
const radarCanvas=document.createElement('canvas');radarCanvas.id='incoming-radar';radarCanvas.width=160;radarCanvas.height=130;radarCanvas.style.cssText='position:fixed;right:14px;bottom:14px;width:160px;height:130px;z-index:22;pointer-events:none;border:1px solid #6ac6c6;background:#031e2ac9;border-radius:8px';document.body.appendChild(radarCanvas);const radarCtx=radarCanvas.getContext('2d');let radarTick=0;
function updateMeteorRadar(dt){radarTick-=dt;if(radarTick>0)return;radarTick=.1;const c=radarCtx;c.clearRect(0,0,160,130);c.strokeStyle='#3b777a';c.lineWidth=1;c.beginPath();c.arc(80,68,53,0,Math.PI*2);c.stroke();c.beginPath();c.arc(80,68,27,0,Math.PI*2);c.stroke();c.beginPath();c.moveTo(27,68);c.lineTo(133,68);c.moveTo(80,15);c.lineTo(80,121);c.stroke();c.fillStyle='#9be8f0';c.font='bold 10px sans-serif';c.fillText('INCOMING RADAR',7,12);c.fillStyle='#4ff5b3';c.fillRect(77,65,6,6);for(const m of meteors){if(m.grounded)continue;const x=80+THREE.MathUtils.clamp((m.mesh.position.x-dragon.position.x)*.75,-51,51),y=68-THREE.MathUtils.clamp((m.mesh.position.y-dragon.position.y)*.75,-51,51);c.fillStyle=m.burning?'#ff7a32':'#ffcf56';c.beginPath();c.arc(x,y,m.boss?4:2.7,0,Math.PI*2);c.fill();}}
let bossSpawned=false,bossDefeated=false;let dragonMeteorTimer=8;const input=createInputState();
const difficulty=()=>({easy:.38,normal:1,hard:1.55}[document.getElementById('difficulty')?.value]||1);
const easyMode=()=>document.getElementById('difficulty')?.value==='easy';
let facing=1,turnTime=0;const explosionLights=[];let pointer=new THREE.Vector3(0,17,0);const ray=new THREE.Raycaster(),plane=new THREE.Plane(new THREE.Vector3(0,0,1),0);
// Pointer events can arrive many times per frame. Reuse raycast scratch values.
const aimNdc=new THREE.Vector2(),aimIntersection=new THREE.Vector3();
function aim(e){const r=renderer.domElement.getBoundingClientRect();aimNdc.set((e.clientX-r.left)/r.width*2-1,-((e.clientY-r.top)/r.height*2-1));ray.setFromCamera(aimNdc,camera);if(ray.ray.intersectPlane(plane,aimIntersection))pointer.set(THREE.MathUtils.clamp(aimIntersection.x,-94,94),THREE.MathUtils.clamp(aimIntersection.y,2,64),0)}
// Pointermove already includes touch drags; a second touch-specific handler
// previously performed the same raycast twice for each touch move.
renderer.domElement.addEventListener('pointermove',aim);
// Mobile aiming is independent of the movement and action controls.
renderer.domElement.addEventListener('pointerdown',e=>{if(e.pointerType==='touch'){aim(e);e.preventDefault();}}, {passive:false});
let fireHealthAccumulator=0;let holdStart=0;let windActive=false;let windCharge=1;let windCooldown=0;let gustTime=0;let gustId=0;let gustRoadNotified=false;let gustMissileNotified=false;let gustOrigin=new THREE.Vector3(),gustDirection=new THREE.Vector3(1,0,0);
// Stylized animated wind particles: translucent layered eddies, not solid tubes.
const windVisual=new THREE.Group();scene.add(windVisual);
const windMaterial=new THREE.SpriteMaterial({map:visualBank.images.smoke,color:0xc4f2ff,transparent:true,opacity:.19,depthWrite:false,blending:THREE.NormalBlending});
const windParticles=[];
for(let i=0;i<105;i++){
 const sprite=new THREE.Sprite(windMaterial.clone());windVisual.add(sprite);
 const seed=i/105,phase=i*2.399963229728653;
 windParticles.push({sprite,seed,phase,spread:Math.sqrt(seed)*(0.65+Math.random()*.4)});
}
windVisual.visible=false;
// Lightweight gust-driven street debris: two draw batches, shared textures,
// no new mesh or material allocations when the dragon breathes.
const windDustPool=new InstancedParticlePool({THREE,parent:scene,
 geometry:new THREE.PlaneGeometry(1,1),
 material:new THREE.MeshBasicMaterial({map:visualBank.images.dust,color:0xc1b5a2,
  transparent:true,opacity:.36,depthWrite:false,side:THREE.DoubleSide}),
 capacity:44});
const windLitterPool=new InstancedParticlePool({THREE,parent:scene,
 geometry:new THREE.BoxGeometry(.25,.08,.15),
 material:new THREE.MeshBasicMaterial({color:0x9e988d}),
 capacity:16});
const windDebrisPoint=new THREE.Vector3();
function clearWindDebris(){windDustPool.clear();windLitterPool.clear();}
const breathMeter=document.createElement('div');breathMeter.id='wind-meter';breathMeter.style.cssText='position:fixed;left:14px;bottom:102px;z-index:12;color:#e5faff;background:#09202cbf;border:1px solid #8cd8e6;border-radius:8px;padding:6px 10px;font:700 12px system-ui;pointer-events:none;min-width:170px';
breathMeter.innerHTML='<div id="breath-label">WIND READY</div><div style="height:9px;background:#163946;border-radius:7px;overflow:hidden;margin-top:5px"><div id="breath-fill" style="height:100%;width:100%;background:linear-gradient(90deg,#5cbed6,#d4f8ff);transition:width .08s linear"></div></div>';
document.body.appendChild(breathMeter);
const breathLabel=breathMeter.querySelector('#breath-label'),breathFill=breathMeter.querySelector('#breath-fill');
function updateBreathMeter(){const inhale=holdStart?Math.min(1,(performance.now()-holdStart)/850):0;
 const fraction=windCooldown>0?Math.max(0,1-windCooldown/4):holdStart?inhale:1;
 breathFill.style.width=Math.round(fraction*100)+'%';
 breathLabel.textContent=gustTime>0?'WIND GUST!':windCooldown>0?'BREATH RECHARGE '+Math.round(fraction*100)+'%':holdStart?'INHALING '+Math.round(inhale*100)+'%':'WIND READY — HOLD / RELEASE';
}
function gustCooldownReset(){windCooldown=4;gustId++;}
function releaseWind(){if(!holdStart)return;const held=(performance.now()-holdStart)/1000;holdStart=0;if(held<.27){shoot();return;}if(held<.7||windCooldown>0||dragonStun>0||!active||paused){message(windCooldown>0?'WIND RECHARGING':'HOLD LONGER TO INHALE');return;}
 gustOrigin.copy(dragon.position);gustDirection.copy(pointer).sub(gustOrigin).normalize();if(gustDirection.lengthSq()<.1)gustDirection.set(facing,0,0);gustTime=.85;gustCooldownReset();gustRoadNotified=false;gustMissileNotified=false;windActive=true;sound('bonus');message('PAULO UNLEASHES A GALE!');}
renderer.domElement.addEventListener('contextmenu',e=>e.preventDefault());
renderer.domElement.addEventListener('pointerdown',e=>{if(e.pointerType==='touch')return;aim(e);if(e.button===2){e.preventDefault();gasAttack();return;}if(e.button!==0)return;holdStart=performance.now()});
window.addEventListener('pointerup',()=>releaseWind());window.addEventListener('keydown',e=>{const action=input.keyDown(e.code);if(action)e.preventDefault();if(e.repeat)return;if(action===ACTIONS.FIRE)shoot();if(action===ACTIONS.PAUSE)togglePause();if(action===ACTIONS.GAS)gasAttack();if(action===ACTIONS.DEBUG)profiler.toggle();});window.addEventListener('keyup',e=>{input.keyUp(e.code);if(e.code==='Space')holdStart=0;});window.addEventListener('blur',()=>input.clear());
// Mobile / touchscreen controls: independent pointers can move, aim and fire together.
const mobileControls=document.getElementById('mobile-controls');
if(mobileControls){
 const bindHold=(button,action)=>{
  const release=e=>{input.pressed.delete(action);if(action===ACTIONS.FIRE)releaseWind();try{button.releasePointerCapture(e.pointerId)}catch(_){}};
  button.addEventListener('pointerdown',e=>{e.preventDefault();button.setPointerCapture(e.pointerId);input.pressed.add(action);if(action===ACTIONS.FIRE){holdStart=performance.now();}});
  button.addEventListener('pointerup',release);button.addEventListener('pointercancel',release);
  button.addEventListener('lostpointercapture',()=>{input.pressed.delete(action);if(action===ACTIONS.FIRE)holdStart=0;});
 };
 for(const [id,action] of [['mobile-left',ACTIONS.LEFT],['mobile-right',ACTIONS.RIGHT],['mobile-up',ACTIONS.UP],['mobile-down',ACTIONS.DOWN],['mobile-fire',ACTIONS.FIRE]])bindHold(document.getElementById(id),action);
 const gas=document.getElementById('mobile-gas');
 gas.addEventListener('pointerdown',e=>{e.preventDefault();gasAttack();});
 document.addEventListener('visibilitychange',()=>{if(document.hidden){input.clear();holdStart=0;}});
}

const sharedShotGeometry=new THREE.IcosahedronGeometry(.34,1);
function updateDragonWind(dt){
 windCooldown=Math.max(0,windCooldown-dt);gustTime=Math.max(0,gustTime-dt);windActive=gustTime>0;windVisual.visible=windActive;updateBreathMeter();
 cinematicFX.setWind(gustOrigin,gustDirection,windActive?Math.min(1,gustTime/.55):0);
 if(!windActive){clearWindDebris();for(const c of cars)advanceVehicleWind(c,dt);}
 // While inhaling, Paulo visibly swells and leans back; gust is emitted on release.
 const inhaling=holdStart&&windCooldown<=0?Math.min(1,(performance.now()-holdStart)/850):0;
 dragon.scale.y=THREE.MathUtils.lerp(dragon.scale.y,1+inhaling*.22,Math.min(1,dt*8));
 if(!windActive)return;
 const origin=gustOrigin,direction=gustDirection,progress=1-gustTime/.85;
 windVisual.position.copy(origin);windVisual.rotation.z=Math.atan2(direction.y,direction.x);windVisual.scale.set(1,1,1);
 for(const particle of windParticles){const t=(particle.seed+progress*.75)%1;
  const spread=1.2+t*12.5,swirl=Math.sin(t*17+particle.phase+elapsed*9)*.65;
  particle.sprite.position.set(1+t*48,Math.cos(particle.phase)*spread*particle.spread+swirl,Math.sin(particle.phase)*spread*.55);
  const radius=(.55+t*2.4)*(0.75+particle.spread*.45);particle.sprite.scale.set(radius*2.2,radius,1);
  particle.sprite.material.opacity=(.07+.17*Math.sin(Math.PI*t)) * Math.min(1,gustTime*5);
 }
 const rocketsDeflected=militaryOccupation.deflectWind(origin,direction,dt);
 if(rocketsDeflected.affected&&!gustMissileNotified){gustMissileNotified=true;message('PAULO DEFLECTS MILITARY ROCKETS!');}
 for(const m of meteors){if(m.grounded||!m.mesh)continue;const delta=m.mesh.position.clone().sub(origin),along=delta.dot(direction),across=delta.clone().addScaledVector(direction,-along).length();if(along>0&&along<43&&across<5+along*.35){m.vel.addScaledVector(direction,dt*32/(1+(m.size||1)*.16));m.vel.y+=dt*8;}}
 for(const h of helicopters){if(h.crashing||!h.root)continue;const delta=h.root.position.clone().sub(origin),along=delta.dot(direction),across=delta.clone().addScaledVector(direction,-along).length();if(along>0&&along<48&&across<7+along*.35){h.root.position.addScaledVector(direction,dt*29);h.root.position.y+=dt*5;if(h.disorientTime<=0){h.disorientTime=5;h.contactTime=0;message('HELICOPTER CAUGHT IN WIND — LOSING CONTROL!');}h.evasion=Math.max(h.evasion,1);h.dodgeSide=direction.x>0?1:-1;}}
 // Ground targets receive a much gentler, mass-dependent push. Project
 // the gust onto street level so a dragon flying above the rooftops can still
 // move nearby traffic and pedestrians. Preserve their route/AI controllers.
 let windX=direction.x,windZ=direction.z;
 const groundLen=Math.hypot(windX,windZ);
 if(groundLen<.15){windX=facing;windZ=0;}
 else {windX/=groundLen;windZ/=groundLen;}
 // A short impulse and sustained inertial skid; vehicle AI eases lane recovery.
 let vehiclesHit=0;
 for(const c of cars){
  if(!c.root?.visible||!hitVehicleWithWind(c,gustId,origin.x,origin.z,windX,windZ))continue;
  vehiclesHit++;
  const tireDust=smokePuff(c.root.position.x,.7,c.root.position.z,1.2);
  scene.add(tireDust);skyBursts.push({m:tireDust,life:.8,initialLife:.8,smoke:true});
 }
 for(const c of cars)advanceVehicleWind(c,dt);
 if(vehiclesHit&&!gustRoadNotified){gustRoadNotified=true;message('DRAGON GALE — TRAFFIC SKIDDING!');}
 for(const p of crowd){
  if(p.down>0||!p.g?.visible)continue;
  const step=groundWindStep(p.g.position.x,1,p.g.position.z,origin.x,1,origin.z,windX,0,windZ,1.2,dt);
  if(step<=0)continue;
  if(p.windGustId!==gustId){p.windGustId=gustId;p.windTravel=0;}
  const move=Math.min(step,Math.max(0,1.3-p.windTravel));
  p.windTravel+=move;
  p.g.position.x+=windX*move;
  p.g.position.z+=windZ*move*.4;
  p.g.rotation.z+=windX*move*.18;
 }
 // Low, windblown road dust and a few light scraps. Two instanced batches
 // follow the projected gust, never affecting collisions or health.
 const gustAge=1-gustTime/.85;
 const airFade=Math.max(0,Math.sin(gustAge*Math.PI));
 windDustPool.begin();windLitterPool.begin();
 for(let i=0;i<38;i++){
  const seed=i/38,phase=i*2.39996323;
  const travel=(4+seed*35+gustAge*13)%45;
  const side=Math.sin(phase)*(.6+travel*.14);
  windDebrisPoint.set(origin.x+windX*travel-windZ*side,
   .25+Math.abs(Math.sin(phase+gustAge*10))*.6,
   origin.z+windZ*travel+windX*side);
  windDustPool.add(windDebrisPoint,Math.max(.02,(.5+seed*1.7)*airFade));
  if(i%3===0){
   windDebrisPoint.y=.14+Math.abs(Math.sin(gustAge*9+phase))*.4;
   windLitterPool.add(windDebrisPoint,Math.max(.015,(.4+seed*.75)*airFade));
  }
 }
 windDustPool.end();windLitterPool.end();
 for(const fire of schoolFire){const delta=fire.root.position.clone().sub(origin),along=delta.dot(direction);if(along>0&&along<43&&delta.clone().addScaledVector(direction,-along).length()<8+along*.17)fire.suppression=Math.min(1,fire.suppression+dt*1.7);}
}
function shoot(){if(dragonStun>0||!active||paused||cooldown>0||waterDisable>0){if(waterDisable>0)message('WATER SOAKED — FIRE BREATH DISABLED');return;}cooldown=elapsed<rapidFireUntil?.045:(easyMode()?.12:.19);sessionStats.shots++;pauloFirePoseUntil=elapsed+.26;sound('fire');const start=dragon.position.clone().add(new THREE.Vector3(facing*2.6,1.2,0)),target=pointer.clone(),dir=target.clone().sub(start).normalize();const mesh=new THREE.Mesh(sharedShotGeometry,mats.fire);mesh.position.copy(start);scene.add(mesh);shots.push({mesh,vel:dir.multiplyScalar(35),target,life:3.8})}
// Engine-independent gameplay timers; rendered shield is intentionally cosmetic.
const shieldMesh=new THREE.Mesh(new THREE.SphereGeometry(1,32,18,0,Math.PI*2,0,Math.PI/2),new THREE.MeshBasicMaterial({color:0x65d9ff,transparent:true,opacity:.19,side:THREE.DoubleSide,depthWrite:false}));
shieldMesh.visible=false;scene.add(shieldMesh);
function activateShield(){schoolShieldUntil=elapsed+9;message('FLAMING METEOR INTERCEPTED — SCHOOL SHIELD 9s');sound('bonus');}
// Enemy air defenses can hit meteors, but Paulo alone earns player interception
// streaks, shields and rapid-fire. Avoid the false player-credit accounting.
function removeMilitaryInterceptedMeteor(m){
 const index=meteors.indexOf(m);
 if(index<0)return false;
 sessionStats.militaryInterceptions++;
 remove(meteors,index);
 return true;
}
function registerIntercept(m){sessionStats.intercepts++;interceptionStreak++;if(m.dragonHunter){sessionStats.hunters++;activateShield();}if(interceptionStreak>=5){sessionStats.powerups++;interceptionStreak=0;rapidFireUntil=elapsed+4;message('5 INTERCEPTIONS — MACHINE-GUN FLAME 4s');sound('bonus');}}
function updateShield(){const on=active&&elapsed<schoolShieldUntil;shieldMesh.visible=on;if(!on||!schoolBounds)return;const center=new THREE.Vector3();schoolBounds.getCenter(center);const size=new THREE.Vector3();schoolBounds.getSize(size);shieldMesh.position.set(center.x,Math.min(1,schoolBounds.min.y),center.z);shieldMesh.scale.set(Math.max(10,size.x*.72),Math.max(15,size.y*1.3),Math.max(11,size.z*.72));shieldMesh.material.opacity=.14+.045*Math.sin(elapsed*6);}
function groundFireball(x,y,z,size=1){if(y<6)warnCrowd(x,z,Math.max(8,6+size*2));shake=Math.max(shake,Math.min(1.8,.2+size*.5));blast(x,y,z,Math.min(16,Math.max(1.2,size*4.2)));emitImpact(x,y,z,Math.min(160,Math.round(25+size*35)),Math.max(.25,size*.7));}
const hunterGeometry=new THREE.IcosahedronGeometry(.8,1);
const hunterMaterial=new THREE.MeshBasicMaterial({color:0xff6d22});
function spawnDragonMeteor(){
 if(wave<=3||!active)return;
 const mesh=new THREE.Mesh(hunterGeometry,hunterMaterial);
 mesh.position.set(dragon.position.x+(Math.random()<.5?-48:48),55+Math.random()*10,dragon.position.z);scene.add(mesh);
 const v=dragon.position.clone().sub(mesh.position).normalize().multiplyScalar(25+wave*2);warnHunter();
 meteors.push({mesh,target:dragon.position.clone(),vel:v,trail:0,hp:2,size:.8,damage:1,burning:true,dragonHunter:true,ttl:12,steerUntil:1.35});
}
// v4.7: GPU-resident meteor geometry/material cache. The v4.4 asset overhaul
// allocated/disposed detailed icosahedrons, normals, normal-map programs, and
// unique PBR materials on *every* meteor and fragment. Reusing these assets
// prevents recurring GPU buffer upload / shader compilation stalls in dense waves.
const rockGeometryVariants=[],rockMaterialVariants=[];
const rockStats={geometryVariants:12,materialVariants:6,meshCreations:0,uniqueGeometryAllocations:0};
for(let variant=0;variant<rockStats.geometryVariants;variant++){
 const geo=new THREE.IcosahedronGeometry(1,2),pos=geo.attributes.position;
 const deform=new Map(),rng=seeded(207711+variant*93);
 for(let i=0;i<pos.count;i++){
  const x=pos.getX(i),y=pos.getY(i),z=pos.getZ(i),key=`${x.toFixed(4)}:${y.toFixed(4)}:${z.toFixed(4)}`;
  if(!deform.has(key))deform.set(key,.76+rng()*.45);
  const d=deform.get(key);pos.setXYZ(i,x*d,y*d,z*d);
 }
 geo.computeVertexNormals();rockGeometryVariants.push(geo);rockStats.uniqueGeometryAllocations++;
}
for(let i=0;i<rockStats.materialVariants;i++){
 const c=new THREE.Color().setHSL(.055+i*.006,.24,.31+i*.016);
 const mat=new THREE.MeshStandardMaterial({map:visualBank.meteor.map,normalMap:visualBank.meteor.normalMap,
  roughnessMap:visualBank.meteor.roughnessMap,color:c,emissive:i===5?0x1b0704:0x0b0603,
  roughness:.94,metalness:.035,flatShading:false});
 rockMaterialVariants.push(mat);
}
const moltenMaterial=rockMaterialVariants[5].clone();moltenMaterial.emissive.setHex(0xff3b05);moltenMaterial.emissiveIntensity=2.5;
moltenMaterial.onBeforeCompile=shader=>{shader.vertexShader='varying vec3 rockPoint;\n'+shader.vertexShader;shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nrockPoint=position;');shader.fragmentShader='varying vec3 rockPoint;\n'+shader.fragmentShader;shader.fragmentShader=shader.fragmentShader.replace('#include <emissivemap_fragment>',`#include <emissivemap_fragment>
 float veins=abs(sin(rockPoint.x*3.5+sin(rockPoint.y*4.)*.8)*sin(rockPoint.z*4.5+rockPoint.y*2.7));float lava=1.-smoothstep(.035,.13,veins);totalEmissiveRadiance*=lava;diffuseColor.rgb=mix(diffuseColor.rgb,vec3(.22,.035,.006),lava*.6);`)};
function createPlayableRock(size=1,variant=-1){
 const gi=Math.floor(Math.random()*rockGeometryVariants.length);
 const mi=variant<0?Math.floor(Math.random()*5):Math.max(0,Math.min(5,variant));
 const mesh=new THREE.Mesh(rockGeometryVariants[gi],rockMaterialVariants[mi]);
 mesh.userData.sharedRockAsset=true;rockStats.meshCreations++;
 mesh.scale.set(size*(.87+Math.random()*.25),size*(.88+Math.random()*.24),size*(.87+Math.random()*.28));
 mesh.rotation.set(Math.random()*3,Math.random()*3,Math.random()*3);
 return mesh;
}
function spawnMeteor(){
 const target=chooseMeteorTarget(neighborhood.targetBuildings,schoolBounds.max.z,Math.random);
 const size=wave===1?.62:(Math.random()<.19?2.0+Math.random()*.8:Math.random()<.43?1.2+Math.random()*.4:.52+Math.random()*.45);
 const x=THREE.MathUtils.clamp(target.x+(Math.random()-.5)*15,-45,45);
 // Rock fragments and intact meteors use identical irregular rotating geometry.
 const roll=Math.random(),kind=roll<.12?'iron':roll<.31?'molten':roll<.60?'flaming':'stone';
 const mesh=createPlayableRock(size);if(kind==='molten')mesh.material=moltenMaterial;
 mesh.position.set(x,65+Math.random()*12,target.z-3);scene.add(mesh);
 const velocity=new THREE.Vector3(target.x-x,target.y-mesh.position.y,target.z-mesh.position.z).normalize().multiplyScalar((6+wave*.65+Math.random()*2)*difficulty()/(.78+size*.36));
 meteors.push({kind,largeSplitter:size>1.8&&Math.random()<.65,burning:kind==='flaming'||kind==='molten',mesh,target:new THREE.Vector3(target.x,target.y,target.z),vel:velocity,trail:0,hp:wave===1?1:Math.max(1,Math.ceil(size*(easyMode()?.62:1.45))),size,damage:size>1.8?2:size>1.1?1.5:1});
}
function spawnFragmentMeteor(x,y,z,size=1.2,vx=0,vy=-3,vz=0){
 const mesh=createPlayableRock(size);
 mesh.position.set(x,y,z);scene.add(mesh);
 const vel=new THREE.Vector3(vx,vy,vz);
 meteors.push({mesh,target:new THREE.Vector3(x+vx*3,.5,z+vz*3),vel,trail:0,hp:Math.max(2,Math.ceil(size*2.5)),size,kind:'iron',damage:Math.max(.15,size*.6),fragment:true,burning:false,generation:0,fragmentGrace:.28,fragmentAge:0,ttl:22,hitBlasts:new Set(blasts)});
}
// Fragmentation is a true split into independently moving, independently targetable rocks.
// The generation cap prevents an exponential number of active meteors.
function fragmentMeteor(m){
 const generation=m.generation||0;
 if((m.boss||m.largeSplitter||m.fragment)&&m.size>.52&&generation<3){
  const count=m.boss?6:m.largeSplitter?4:Math.min(3,2+Math.floor(Math.random()*2));
  for(let k=0;k<count;k++){
   const size=m.size*(m.boss?.37:.43)*(0.88+Math.random()*.20);
   if(size<.26)continue;
   const theta=Math.PI*2*k/count+(Math.random()-.5)*.13;
   // Split is intentionally slow enough to follow individual rocks with the eye.
   const speed=(m.boss?1.35:1.05)+Math.random()*.75;
   const vx=Math.cos(theta)*speed;
   const vz=Math.sin(theta)*speed*.35;
   const vy=-.5+Math.sin(theta)*.95+Math.random()*.65;
   spawnFragmentMeteor(m.mesh.position.x+Math.cos(theta)*m.size*.74,
    m.mesh.position.y+Math.sin(theta)*m.size*.52,m.mesh.position.z+Math.sin(theta)*m.size*.19,size,vx,vy,vz);
   meteors[meteors.length-1].generation=generation+1;
  }
 }
 // Tiny rocky fragments rain downward, visually separate from the dangerous pieces.
 emitMeteorShrapnel(m.mesh.position,m.size);
 if(m.boss){bossDefeated=true;message('GIANT METEOR SHATTERED — INTERCEPT THE FLYING CHUNKS!');}
}
function emitMeteorShrapnel(pos,size){
 // Preview 17: mixed orange embers, golden flame, masonry and smoke.
 // All fragments reuse the existing instanced materials and particle budgets.
 if(!performanceLab.isEnabled('particles'))return;
 const n=Math.min(38,Math.max(12,Math.round(size*8)));
 for(let k=0;k<n&&impactParticles.length<210;k++){
  const a=Math.random()*Math.PI*2,s=3+Math.random()*9;
  const isEmber=k%4!==0;
  impactParticles.push({pool:isEmber?k%3:4,position:pos.clone().add(new THREE.Vector3((Math.random()-.5)*size,(Math.random()-.5)*size,0)),
   velocity:new THREE.Vector3(Math.cos(a)*s*.65,2+Math.random()*6,Math.sin(a)*s*.5),
   scale:.07+Math.random()*.20,life:1+Math.random()*.8,ttl:1.8,smoke:false,shrapnel:true});
 }
}
function spawnFinalBoss(){if(bossSpawned)return;bossSpawned=true;remaining=0;finalSquadron.start();
 const mesh=createPlayableRock(8,5);mesh.position.set(0,76,0);scene.add(mesh);
 meteors.push({mesh,target:new THREE.Vector3(0,1,0),vel:new THREE.Vector3(0,-2.8,0),trail:0,hp:65,size:8,damage:12,boss:true,burning:true});
 message('FINAL WAVE — SHATTER THE GIANT METEOR!');
}
function winGame(){active=false;finalSquadron.clear();if(new URLSearchParams(location.search).get('benchmark')!=='1')exportTelemetry();document.getElementById('overlay').style.display='grid';document.getElementById('panel').innerHTML=`<h1>🏆 PHILADELPHIA SAVED!</h1><p>Paulo has defeated the final meteor. Score: ${score.toLocaleString()}</p><p>The president denies responsibility. The block is calling for justice.</p><button id="ending-block">📣 CALL THE BLOCK — ACCOUNTABILITY</button><button id="ending-wait">DO NOT CALL — ESCAPE ENDING</button>`;document.getElementById('ending-block').onclick=()=>showFinalEnding(true);document.getElementById('ending-wait').onclick=()=>showFinalEnding(false);}
function showFinalEnding(accountability){
 const panel=document.getElementById('panel');
 panel.innerHTML=accountability?`<h1>📣 THE BLOCK ANSWERS!</h1><p>Neighbors and police arrive at the White House. The president is arrested and brought before a court, where he is convicted. Paulo flies toward a golden Philadelphia sunset.</p><h2>THE END — ACCOUNTABILITY</h2><button id="again">PLAY AGAIN</button>`:`<h1>THE ESCAPE</h1><p>Supporters spirit the president away. He retires overseas in luxury, while Paulo returns to protect Philadelphia.</p><h2>THE END — ESCAPE</h2><button id="again">PLAY AGAIN</button>`;
 const link=document.createElement('a');link.href='./campaign/chapters3-4.html';link.target='_blank';link.rel='noopener';link.textContent='▶ VIEW ANIMATED FINALE';link.style.cssText='display:inline-block;padding:12px;color:#ffce75';panel.appendChild(link);
 document.getElementById('again').onclick=reset;
}
const MAX_DYNAMIC_LIGHTS=5;
const explosionLightPool=createStableLightPool(scene,MAX_DYNAMIC_LIGHTS,()=>new THREE.PointLight(0xffa44d,0,20,2));
function updateExplosionLights(dt){for(let i=explosionLights.length-1;i>=0;i--){const e=explosionLights[i];e.life-=dt;e.light.intensity=Math.max(0,e.light.intensity*(1-dt*4));if(e.life<=0){explosionLightPool.release(e.light);explosionLights.splice(i,1)}}}
function flashAt(x,y,z,power=1){if(explosionLights.length>=MAX_DYNAMIC_LIGHTS)return;const light=explosionLightPool.acquire();if(!light)return;light.intensity=Math.min(30,12*power);light.distance=Math.min(38,20*power);light.position.set(x,y,z);explosionLights.push({light,life:.48});}
function remove(arr,i){const o=arr[i];scene.remove(o.mesh);if(o.mesh.userData.sharedRockAsset){arr.splice(i,1);return;}
 if(arr===blasts){if(blastMeshPool.length<110)blastMeshPool.push(o.mesh);else{o.mesh.material.dispose();}arr.splice(i,1);return;}if(arr===shots){for(const child of [...o.mesh.children]){o.mesh.remove(child);child.geometry?.dispose();if(child.material!==iceBoltMaterial)child.material?.dispose();}}if(arr===blasts||arr===meteors){if(o.mesh.geometry!==hunterGeometry&&o.mesh.geometry!==waterDropletGeometry&&o.mesh.geometry!==sharedShotGeometry)o.mesh.geometry.dispose();if(o.mesh.material!==hunterMaterial&&o.mesh.material!==mats.fire&&o.mesh.material!==waterMat&&o.mesh.material!==iceBoltMaterial)o.mesh.material.dispose()}else if(arr===shots){if(o.mesh.geometry!==hunterGeometry&&o.mesh.geometry!==waterDropletGeometry&&o.mesh.geometry!==sharedShotGeometry)o.mesh.geometry.dispose();if(o.mesh.material!==hunterMaterial&&o.mesh.material!==mats.fire&&o.mesh.material!==waterMat&&o.mesh.material!==iceBoltMaterial)o.mesh.material.dispose()}arr.splice(i,1)}const sharedBlastGeometry=new THREE.PlaneGeometry(1,1);
const blastMeshPool=[];const blastStats={created:0,reused:0};
function blast(x,y,z,max=4){cinematicFX.shock(new THREE.Vector3(x,y,z),max);let mesh=blastMeshPool.pop();if(!mesh){
 mesh=new THREE.Mesh(sharedBlastGeometry,new THREE.MeshBasicMaterial({map:visualBank.images.flash,color:0xffa94e,transparent:true,opacity:.86,depthWrite:false,side:THREE.DoubleSide,blending:THREE.AdditiveBlending}));blastStats.created++;
 }else blastStats.reused++;
 mesh.position.set(x,y,z);mesh.scale.setScalar(1);mesh.material.opacity=.86;scene.add(mesh);
 blasts.push({mesh,r:0,max,age:0});flashAt(x,y,z,max/4);
}
// Small fragments predominate. Occasional larger chunks are reserved for silhouette and drama.
const settledRubble=[];const MAX_RUBBLE=125;
const rubblePool=new InstancedParticlePool({THREE,parent:scene,geometry:cube,material:mats.stone,capacity:MAX_RUBBLE});
function refreshRubble(){rubblePool.begin();for(const r of settledRubble)rubblePool.add(r.position,r.scale,r.rotation);rubblePool.end();}
function debrisPiece(pos,type){if(debris.length>125)return;const mesh=new THREE.Mesh(type==='glass'?glassShardGeometry:cube,mats[type]||mats.stone);mesh.position.copy(pos);const large=Math.random()<.045;mesh.scale.setScalar(cell*(large?.52+Math.random()*.32:.07+Math.random()*.15));scene.add(mesh);debris.push({mesh,v:new THREE.Vector3((Math.random()-.5)*8,Math.random()*10,(Math.random()-.5)*7),life:1.5+Math.random()*1.2,bounces:0,rubble:!large&&Math.random()<.62,trail:false})}
function preserveRubble(d){if(settledRubble.length>=MAX_RUBBLE)settledRubble.shift();
 const scale=d.mesh.scale.x;settledRubble.push({position:new THREE.Vector3(d.mesh.position.x,Math.max(.045,scale*.5),d.mesh.position.z),scale,rotation:Math.random()*Math.PI});
 scene.remove(d.mesh);refreshRubble();}

function damage(x,z,y=7,meteor=null){const profile=meteor?impactProfile(meteor.size,meteor.kind):impactProfile(1.8);
 warnCrowd(x,z,18);crackWindows(x,y,z,profile.radius);
 const targetX=THREE.MathUtils.clamp(x,-90,90);
 const targetY=THREE.MathUtils.clamp(y,.3,40);
 const targetBuilding=neighborhood.targetBuildings.find(b=>Math.abs(b.x-targetX)<b.w/2+1.0&&Math.abs(b.z-z)<b.d*.5+1);
 const neighbor=!!targetBuilding;
 const roadStrike=z>13&&z<36&&y<3;
 if(roadStrike){strikeParkedCars(targetX,z,profile.radius);shake=Math.max(shake,Math.min(1.2,profile.strength));emitImpact(targetX,1,z,Math.round(30+profile.strength*35),profile.strength);blast(targetX,1,z,profile.shockRadius);flashAt(targetX,2,z,2);if(Math.random()<profile.fire)ignite(targetX,1,z);
  for(const c of cars)if(performanceLab.isEnabled('traffic')&&c.life>0&&Math.abs(c.root.position.x-targetX)<6&&Math.abs(c.root.position.z-z)<5)explodeCar(c);
  sound('impact');return;
 }
 const hitZ=z;
 if(!neighbor&&architecturalReady&&(Math.abs(targetX)>neighborhood.school.w/2+1||Math.abs(z-neighborhood.school.z)>neighborhood.school.d/2+1)){emitImpact(targetX,targetY,z,35,profile.strength);return;}
 let lost=0;
 if(neighbor){
  for(const p of crowd)if(Math.abs(p.g.position.x-targetX)<25)p.dx=p.g.position.x<targetX?-1:1;
  lost=neighborhood.impact(targetX,targetY,hitZ,profile.radius,p=>debrisPiece(p,'brick'),profile.strength);if(targetBuilding&&!targetBuilding.roofBreached)neighborhood.roofBreach(targetX,targetY,z,profile.radius*.65);neighborhood.aftershock(targetX,targetY,hitZ,profile.shockRadius,p=>debrisPiece(p,'brick'));if(lost>0){emitMeteorShrapnel(new THREE.Vector3(targetX,targetY,hitZ),Math.min(4,lost*.3+1.2));for(let j=0;performanceLab.isEnabled('particles')&&j<Math.min(14,lost*3)&&impactParticles.length<210;j++)impactParticles.push({pool:5,position:new THREE.Vector3(targetX+(Math.random()-.5)*2,targetY+(Math.random()-.5)*1.4,hitZ+.3),velocity:new THREE.Vector3((Math.random()-.5)*7,2+Math.random()*5,(Math.random()-.5)*5),scale:.04+Math.random()*.12,life:.7+Math.random()*.5,ttl:1.2,smoke:false});}flashAt(targetX,targetY,hitZ,2.0);
  emitImpact(targetX,targetY,hitZ,155,1.32);
  if(lost>0&&Math.random()<profile.fire){ignite(targetX,targetY,hitZ);if(Math.random()<.75)ignite(targetX+(Math.random()-.5)*3,Math.max(1,targetY-1.2),hitZ-.20);
   if(Math.random()<.45)ignite(targetX+(Math.random()-.5)*4,Math.min(14,targetY+1.8),hitZ-.35);
  }
  if(lost>0)score=Math.max(0,score-30);
 }else if(architecturalReady){
  const r=profile.radius;
  carveSchool(targetX,targetY,hitZ,r,profile.strength,meteor?.kind||'stone',meteor?.vel?.length?.()||0);
  if(voxelReady){
   lost=architecture.impact(new THREE.Vector3(targetX,targetY,hitZ),r,
     (pos,type)=>debrisPiece(pos,type===2?'glass':type===3?'roof':type===4?'stone':'brick'));
  }
  emitImpact(targetX,targetY,hitZ,180,1.3);
  // Damage accumulates against the actual school. When the gauge reaches 0%,
  // the architectural building is fully removed, not just cosmetically scarred.
  const previousDamage=schoolDamage;
  schoolDamage=Math.min(1,schoolDamage+.025*profile.strength);
  // Small masonry chips and glass descend from the exact impact point, rather
  // than unrelated random locations around the roof. Reuse instanced VFX pools.
  if(performanceLab.isEnabled('particles')){
   for(let k=0;k<26&&impactParticles.length<210;k++){
    const a=Math.random()*Math.PI*2,sp=1.6+Math.random()*5.2;
    impactParticles.push({pool:k%5===0?5:4,
     position:new THREE.Vector3(targetX+(Math.random()-.5)*r*.7,targetY+(Math.random()-.5)*r*.7,hitZ+.08),
     velocity:new THREE.Vector3(Math.cos(a)*sp,Math.sin(a)*2.8+Math.random()*1.6,(Math.random()-.5)*3.5),
     scale:.07+Math.random()*.15,life:.65+Math.random()*.8,ttl:1.4,smoke:false});
   }
  }
  // Falling structural fragments emitted along the newly removed top band.
  if(schoolBounds&&schoolDamage>previousDamage){
   const top=targetY;
   for(let i=0;i<22;i++){
    const px=THREE.MathUtils.clamp(targetX+(Math.random()-.5)*7,schoolBounds.min.x,schoolBounds.max.x);
    const pz=THREE.MathUtils.clamp(hitZ+(Math.random()-.5)*2.2,schoolBounds.min.z,schoolBounds.max.z);
    debrisPiece(new THREE.Vector3(px,Math.max(1,top+Math.random()*1.5),pz),Math.random()<.24?'glass':'brick');
   }
  }
  syncStructuralDamage();
  if(schoolDamage>.03&&schoolDamage<1&&Math.random()<profile.fire){
   ignite(targetX,targetY,hitZ);
   if(Math.random()<.85)ignite(targetX+(Math.random()-.5)*4,Math.max(1,targetY-1),hitZ-.4);
   if(schoolDamage>.36&&Math.random()<.70)ignite(targetX+(Math.random()-.5)*6,Math.max(1,targetY+2),hitZ-1);
  }
 }else{
  // Procedural fallback before the original FBX has loaded.
  for(const item of specs){
   if(!item.alive)continue;
   if((item.x-targetX)**2+(item.y-targetY)**2+(item.z-5)**2<7){
    item.alive=false;meshes[item.type].setMatrixAt(item.instance,hidden);lost++;
   }
  }
  for(const mesh of Object.values(meshes))mesh.instanceMatrix.needsUpdate=true;
 }
 // Health represents the school's surviving structure; neighboring impacts
 // do not magically destroy the school. No wave-based health regeneration.
 hp=Math.max(0,Math.round((1-schoolDamage)*100));
 sound('impact');shake=Math.min(1.5,profile.strength);blast(targetX,targetY,hitZ,profile.shockRadius);emitImpact(targetX,targetY,hitZ,Math.round(35+profile.strength*40),profile.strength);
 updateHud();if(hp<=0)gameOver();
}
// v5.0 Preview 2: chapter progression is deliberately isolated from combat systems.
const CAMPAIGN_CHAPTERS=[
 {start:1,title:'THE METEOR MISTAKE',cinematic:'./campaign/chapter1.html'},
 {start:6,title:'THE DRAGON HUNT',cinematic:'./campaign/chapter2.html'},
 {start:11,title:'OPERATION DRAGON STRIKE',cinematic:'./campaign/chapters3-4.html'},
 {start:15,title:'THE LAST METEOR',cinematic:'./campaign/chapters3-4.html'}
];
function currentChapter(){return [...CAMPAIGN_CHAPTERS].reverse().find(c=>wave>=c.start)||CAMPAIGN_CHAPTERS[0]}
// Integrated, skippable motion comics: never leave the game page or advance the wave twice.
let cinematicTimeout=null,cinematicActive=false;
let chapterSettlement={active:false,phase:'idle',timer:0,nextWave:null,fromChapter:null};
let postCutsceneWave=null,skipChapterIntroCinematic=false;
const chapterFade=document.createElement('div');chapterFade.id='chapter-fade';
chapterFade.style.cssText='position:fixed;inset:0;z-index:175;pointer-events:none;background:#050b16;opacity:0;transition:opacity 2.2s ease;display:grid;place-items:center;color:#f6dfbb;font:800 24px system-ui;text-align:center;text-shadow:0 2px 10px #000';
chapterFade.innerHTML='<div>THE STORM HAS PASSED<br><small style="font-size:15px;letter-spacing:.08em">THE BLOCK REBUILDS</small></div>';
document.body.appendChild(chapterFade);
function setChapterFade(on){chapterFade.style.opacity=on?'1':'0';}


function closeChapterTransition(){
 const player=document.getElementById('cinematic-player');
 if(cinematicTimeout){clearTimeout(cinematicTimeout);cinematicTimeout=null;}
 cinematicActive=false;player.classList.remove('visible');
 document.getElementById('cinematic-frame').src='about:blank';
 player.hidden=true;document.getElementById('campaign-transition').hidden=true;
 paused=false;document.getElementById('pause').textContent='Pause';
 if(postCutsceneWave!==null){
  const next=postCutsceneWave;postCutsceneWave=null;
  resetChapterTrafficAndCrowd();
  applyResidualChapterDamage();
  wave=next;updateHud();
  chapterStaging.beginNextChapter(wave<=5?1:wave<=10?2:wave<=14?3:4);
  chapterFade.innerHTML=`<div>A NEW CHAPTER BEGINS<br><small style="font-size:15px;letter-spacing:.08em">CREWS PACK UP · THE STREET RESETS</small></div>`;
  setChapterFade(true);
  chapterSettlement={active:true,phase:'departure',timer:5.5,nextWave:next,fromChapter:null,firesCleared:true};
  message('REPAIRS WIND DOWN — CREWS PACK UP AND DEPART');
 }
}
function playChapterCinematic(chapter){
 const player=document.getElementById('cinematic-player');
 cinematicActive=true;paused=true;
 document.getElementById('campaign-transition').hidden=true;
 document.getElementById('cinematic-chapter').textContent='CHAPTER '+(CAMPAIGN_CHAPTERS.indexOf(chapter)+1)+' · '+chapter.title;
 player.hidden=false;
 document.getElementById('cinematic-frame').src=chapter.cinematic+'?embedded=1';
 requestAnimationFrame(()=>player.classList.add('visible'));
 // Slides run eight seconds each. Final combined chapter gets a longer maximum.
 const duration=chapter.start>=11?76000:chapter.start===6?49000:49000;
 cinematicTimeout=setTimeout(closeChapterTransition,duration);
}
function showChapterTransition(){
 if(new URLSearchParams(location.search).get('benchmark')==='1'||new URLSearchParams(location.search).get('devlab')==='1')return;
 const chapter=currentChapter();paused=true;
 playChapterCinematic(chapter);
}
document.getElementById('cinematic-skip')?.addEventListener('click',closeChapterTransition);
window.addEventListener('message',e=>{if(e.origin===location.origin&&e.data?.type==='dragon-cinematic-complete'&&cinematicActive)closeChapterTransition();});
document.addEventListener('keydown',e=>{if(cinematicActive&&e.key==='Escape'){e.preventDefault();closeChapterTransition();}});
document.getElementById('campaign-continue')?.addEventListener('click',closeChapterTransition);
function resetChapterTrafficAndCrowd(){for(const h of helicopters){disposeHelicopterElectric(h);scene.remove(h.root);}helicopters.length=0;helicopterLightPool.reset();for(const c of cars)recycleCar(c);cars.length=0;for(const p of crowd)scene.remove(p.g);crowd.length=0;carTimer=.2;crowdTimer=1.5;helicopterTimer=7;}
function applyResidualChapterDamage(){
 // Rebuild the block only AFTER the cinematic. Leave a few visibly damaged facades.
 clearFires(); neighborhood.restore();
 for(const b of [...neighborhood.targetBuildings].filter(b=>!b.school).slice(3,6))
  neighborhood.city.forceDamage?.(b,.07+Math.random()*.045);
 schoolDamage=0;hp=100;schoolRubblePlaced=false;settledRubble.length=0;rubblePool.clear();
 for(const c of craters){scene.remove(c.mesh,c.inner);c.mesh.geometry.dispose();c.inner.geometry.dispose();}craters.length=0;streetStop=0;
 for(const b of burningVehicles){if(b.driver)scene.remove(b.driver);}burningVehicles.length=0;
 resetSchoolDamageMasks();schoolFragments.count=0;schoolFragments.instanceMatrix.needsUpdate=true;
 syncStructuralDamage();syncDamageHoles();updateHud();
}
function beginChapterSettlement(){
 if(chapterSettlement.active)return;
 chapterSettlement={active:true,phase:'calm',timer:6.5,nextWave:wave+1,fromChapter:wave,firesCleared:false};
 stormTimer=10000;remaining=0;between=0;
 for(let i=meteors.length-1;i>=0;i--)remove(meteors,i);
 for(let i=shots.length-1;i>=0;i--)remove(shots,i);
 perchDragon(true);
 message('THE SKY CLEARS — A MOMENT OF CALM');
}
function updateChapterSettlement(dt){
 if(!chapterSettlement.active)return false;
 perchDragon(true);
 if(chapterSettlement.phase==='cleanup'&&!chapterSettlement.firesCleared&&chapterSettlement.timer<8.4){clearFires();chapterSettlement.firesCleared=true;}
 chapterSettlement.timer-=dt;
 if(chapterSettlement.timer>0)return true;
 if(chapterSettlement.phase==='calm'){
  resetChapterTrafficAndCrowd();
  chapterStaging.setSettlement(wave<=5?1:wave<=10?2:3);
  chapterSettlement.phase='cleanup';chapterSettlement.timer=12.5;chapterSettlement.firesCleared=false;
  message('CONSTRUCTION CREWS ARRIVE TO CLEAR THE RUBBLE');
 }else if(chapterSettlement.phase==='cleanup'){
  chapterSettlement.phase='fade';chapterSettlement.timer=2.6;
  chapterFade.innerHTML=`<div>THE STORM HAS PASSED<br><small style="font-size:15px;letter-spacing:.08em">THE BLOCK REBUILDS</small></div>`;
  setChapterFade(true);
 }else if(chapterSettlement.phase==='fade'){
  const next=chapterSettlement.nextWave;
  chapterSettlement={active:false,phase:'idle',timer:0,nextWave:null,fromChapter:null,firesCleared:false};
  postCutsceneWave=next;
  // End-of-chapter cinematic plays before any world repairs or next-wave spawning.
  if(QUERY_PARAMS.get('benchmark')==='1'){
    postCutsceneWave=null;resetChapterTrafficAndCrowd();applyResidualChapterDamage();
    wave=next;chapterStaging.beginNextChapter(wave<=5?1:wave<=10?2:wave<=14?3:4);
    chapterFade.innerHTML=`<div>A NEW CHAPTER BEGINS<br><small style="font-size:15px;letter-spacing:.08em">CREWS PACK UP · THE STREET RESETS</small></div>`;
    chapterSettlement={active:true,phase:'departure',timer:5.5,nextWave:next,fromChapter:null,firesCleared:true};
  }else{
    const chapter=CAMPAIGN_CHAPTERS.find(c=>c.start===next);
    if(chapter)playChapterCinematic(chapter);
    else closeChapterTransition();
  }
 }else if(chapterSettlement.phase==='departure'){
  chapterSettlement={active:false,phase:'idle',timer:0,nextWave:null,fromChapter:null,firesCleared:false};
  skipChapterIntroCinematic=true;newWave();skipChapterIntroCinematic=false;
  setChapterFade(false);
  message('THE BLOCK RETURNS TO LIFE — A NEW CHAPTER');
 }
 return true;
}
function updateHud(){document.getElementById('score').textContent=score.toLocaleString();document.getElementById('wave').textContent=wave;const chapterLabel=document.getElementById('campaign-chapter-label');if(chapterLabel)chapterLabel.textContent='CH '+(CAMPAIGN_CHAPTERS.indexOf(currentChapter())+1)+' · '+currentChapter().title;document.getElementById('hp').textContent=hp+'%';document.getElementById('healthbar').style.width=hp+'%';const blockHealth=Math.round((1-neighborhood.targetBuildings.reduce((a,b)=>a+b.damage,0)/Math.max(1,neighborhood.targetBuildings.length))*100);document.getElementById('blockhp').textContent=blockHealth+'%';document.getElementById('blockbar').style.width=blockHealth+'%';neighborhood.setDistantHealth?.(blockHealth);document.getElementById('lives').textContent=dragonLives;document.getElementById('school-wire').style.opacity=Math.max(.15,hp/100);document.getElementById('block-wire').style.opacity=Math.max(.15,blockHealth/100)}
let toastTimer=0;function message(t){document.getElementById('toast').textContent=t;toastTimer=1.8}function newWave(){const chapterIndex=(wave<=5?1:wave<=10?2:wave<=14?3:4);if(chapterStaging.mode==='leaving'){}else chapterStaging.setChapter(chapterIndex);if(CAMPAIGN_CHAPTERS.some(c=>c.start===wave)&&wave>1)resetChapterTrafficAndCrowd();
 perchDragon(false);
 // Frozen emergency responders remain until this wave ends.
 for(let i=cars.length-1;i>=0;i--)if(cars[i].frozen){recycleCar(cars[i]);cars.splice(i,1)}
 updateAtmosphere();sessionStats.highestWave=Math.max(sessionStats.highestWave,wave);waveStats.push({wave,startedAt:Math.round(elapsed),scoreAtStart:score});if(wave>1){const saved=neighborhood.targetBuildings.filter(b=>b.damage<.05).length;
  const bonus=saved*75;score+=bonus;message('BLOCK SAVED BONUS +'+bonus.toLocaleString());sound('bonus');updateHud();}
 stormTimer=0;remaining=wave>=15?0:waveBudget(wave,document.getElementById('difficulty')?.value).regular; if(wave===15)spawnFinalBoss(); spawnTimer=easyMode()?2:.7;if(wave===1)message('WAVE '+wave); if(!skipChapterIntroCinematic&&CAMPAIGN_CHAPTERS.some(c=>c.start===wave))showChapterTransition();if(wave===6)message('ICE PURSUIT — AVOID ELECTRICAL BEAMS');if(wave===11)message('MILITARY OCCUPATION — DODGE OR INTERCEPT MISSILES');if(wave===6||wave===11||wave===15)message('A NEW CHAPTER BEGINS — THE STREET RESETS, BUT SCARS REMAIN.');
}
function reset(){schoolReconstruction?.reset();finalSquadron.clear();militaryOccupation.reset();cinematicFX.reset();frameHealth.reset();playtestFrameMs.length=0;peakDrawCalls=0;stallEvents.length=0;detailedTimings.sim.length=0;detailedTimings.render.length=0;frameGovernor.reset();adaptiveResolution=1;adaptiveAdjustments=0;applyVisualPreset();nextLaneByDirection.east=0;nextLaneByDirection.west=0;resetParkedCars();settledRubble.length=0;rubblePool.clear();skylineEventTimer=3;for(const h of helicopters){disposeHelicopterElectric(h);scene.remove(h.root);for(const resource of h.gooResources||[])resource.dispose();if(!h.gasHit){const pool=helicopterModels.get(h.variant)||[];if(pool.length<3)pool.push(h);helicopterModels.set(h.variant,pool)}}helicopters.length=0;helicopterLightPool.reset();for(const p of crowd)scene.remove(p.g);crowd.length=0;for(const g of gasClouds){scene.remove(g.mesh);if(!g.mesh.isSprite)g.mesh.geometry?.dispose();g.mesh.material.dispose()}gasClouds.length=0;
 for(const b of skyBursts){scene.remove(b.m);if(!b.m.isSprite&&b.m.geometry!==skyBurstGeometry)b.m.geometry?.dispose();b.m.material.dispose()}skyBursts.length=0;for(const m of distantStreaks)skyline.remove(m.sprite);distantStreaks.length=0;dangerZones.length=0;
 for(const crack of windowDamage){scene.remove(crack);crack.geometry.dispose()}windowDamage.length=0;for(const w of nightWindows){w.broken=false;w.mesh.visible=true;}helicopterTimer=7;crowdTimer=0;dragonLives=3;invulnerable=0;dragonStun=0;iceGroundHits=0;blockCharge=0;blockShield=0;blockScene=0;gasCooldown=0;waterDisable=0;windCooldown=0;gustTime=0;holdStart=0;windActive=false;gustRoadNotified=false;gustMissileNotified=false;windVisual.visible=false;clearWindDebris();cinematicFX.setWind(null,null,0);chapterSettlement={active:false,phase:'idle',timer:0,nextWave:null,fromChapter:null};postCutsceneWave=null;skipChapterIntroCinematic=false;setChapterFade(false);iceWarning.style.display='none';chapterStaging.setChapter(0);for(const b of burningVehicles){if(b.driver)scene.remove(b.driver)}burningVehicles.length=0;facing=1;turnTime=0;recoveryLift=0;dragonGroundImpact=false;gasPose=0;dragon.scale.set(1,1,1);explosionLightPool.reset();explosionLights.length=0;for(const c of cars)recycleCar(c);cars.length=0;carTimer=0;damageHoles.length=0;resetSchoolDamageMasks();schoolDamage=0;schoolFragments.count=0;schoolFragments.instanceMatrix.needsUpdate=true;clearFires();syncDamageHoles();neighborhood.restore();
 if(architecturalModel){architecturalModel.visible=false;syncStructuralDamage()}if(voxelReady)architecture.restore();for(const e of effectObjects){effects.remove(e.mesh);e.mesh.geometry.dispose();e.mesh.material.dispose()}effectObjects.length=0;impactParticles.length=0;trailParticles.length=0;for(const pool of impactPools)pool.clear();trailSmokePool.clear();trailEmberPool.clear();quality.reset();for(const arr of [meteors,shots,blasts,debris]){while(arr.length)remove(arr,arr.length-1)}if(!architecturalReady)buildSchool();setMode(viewMode);score=0;hp=100;fireHealthAccumulator=0;wave=Math.min(15,clampWave(document.getElementById('start-wave')?.value));bossSpawned=false;bossDefeated=false;skylineDamage=0;schoolRubblePlaced=false;schoolDamage=0;damageHoles.length=0;syncDamageHoles();syncStructuralDamage();skylineBackdrop.reset();for(const f of skylineFires){skyline.remove(f.fire,...f.puffs);f.fire.material.dispose();for(const p of f.puffs)p.material.dispose();}skylineFires.length=0;Object.assign(sessionStats,{start:Date.now(),shots:0,intercepts:0,militaryInterceptions:0,hunters:0,damage:0,highestWave:wave,deaths:0,powerups:0,frames:0,frameTimeTotal:0});waveStats.length=0;dragonMeteorTimer=7;interceptionStreak=0;rapidFireUntil=0;schoolShieldUntil=0;shieldMesh.visible=false;streetStop=0;for(const c of craters){scene.remove(c.mesh,c.inner);c.mesh.geometry.dispose();c.inner.geometry.dispose()}craters.length=0;updateAtmosphere();elapsed=0;cooldown=0;between=0;paused=false;active=true;perchDragon(false);cameraScrollX=0;skyline.position.x=skylineAnchor;celestial.position.x=0;if(actualSchoolOverlay)syncStructuralDamage();document.getElementById('overlay').style.display='none';document.getElementById('campaign-transition').hidden=true;if(cinematicActive)closeChapterTransition();document.getElementById('pause').textContent='Pause';updateHud();newWave();for(const [k,on] of Object.entries(performanceLab.states()))applyDiagnosticSystem(k,on);}
function gameOver(){if(hp<=0&&schoolDamage<1){schoolDamage=1;syncStructuralDamage();}active=false;if(new URLSearchParams(location.search).get('benchmark')!=='1')exportTelemetry();document.getElementById('overlay').style.display='grid';document.getElementById('panel').innerHTML=`<h1>GAME OVER</h1><p>School defense score: <strong>${score.toLocaleString()}</strong><br>Reached wave ${wave}</p><button id="again">PLAY AGAIN</button><button id="settings-again">SETTINGS</button>`;document.getElementById('settings-again').onclick=()=>{document.getElementById('overlay').style.display='grid';showSettings();};document.getElementById('again').onclick=reset}
function togglePause(){if(!active)return;paused=!paused;document.getElementById('pause').textContent=paused?'Resume':'Pause';message(paused?'PAUSED':'RESUMED')}
// Live, reversible performance-isolation switches. Render-only toggles do not
// remove game entities; simulation toggles pause the named subsystem for A/B tests.
function applyDiagnosticSystem(key,on){
 if(key==='skyline'){skylineBackdrop.group.visible=on;skylineAir.visible=on;for(const f of skylineFires){f.fire.visible=on&&performanceLab.isEnabled('fires');for(const p of f.puffs)p.visible=on&&performanceLab.isEnabled('fires');}}
 if(key==='backgroundBuildings')neighborhood.setDecorativeVisible(on);
 if(key==='traffic')for(const c of parkedCars)c.root.visible=on&&!c.destroyed;
 if(key==='schoolModel'){
  const useActual=actualSchoolOverlayReady&&actualSchoolOverlay;
  syncSchoolVisibility();
  if(!architecturalReady)for(const m of Object.values(meshes))m.visible=on&&schoolDamage<1&&!useActual;
 }
 if(key==='traffic')for(const c of cars)c.root.visible=on;
 if(key==='pedestrians')for(const p of crowd)p.g.visible=on;
 if(key==='helicopters')for(const h of helicopters){h.root.visible=on;h.searchlight.intensity=on&&wave>=5?Math.min(2.2,Math.max(0,(wave-3)*.55)):0;}
 if(key==='backgroundMeteors'){
  for(const s of distantStreaks)s.sprite.visible=on;
  for(const b of skyBursts)b.m.visible=on;
 }
 if(key==='particles'){effects.visible=on;neighborhood.setParticlesEnabled(on);cinematicFX.setVisible(on);}
 if(key==='fires'){
  fireGroup.visible=on;
  for(const f of skylineFires){f.fire.visible=on&&performanceLab.isEnabled('skyline');for(const p of f.puffs)p.visible=on&&performanceLab.isEnabled('skyline');}
 }
 if(key==='weather'&&!on)cinematicWeather.rain.visible=false;
 if(key==='shadows')applyVisualPreset();
 if(key==='rubble'){
  schoolFragments.visible=on;
  neighborhood.setRubbleVisible(on);
  rubblePool.mesh.visible=on;
 }
}
function showSettings(){document.getElementById('panel').innerHTML=`<h1>⚙ GAME SETTINGS</h1><div id="settings-build">${buildStamp}</div><p>Choose your starting wave and difficulty.</p><label>START AT WAVE <input id="start-wave" type="number" min="1" max="15" value="${Math.min(15,wave)}" style="width:80px;padding:8px"></label><br><br><label>DIFFICULTY <select id="difficulty"><option value="easy">Easy</option><option value="normal" selected>Normal</option><option value="hard">Hard</option></select></label><br><br><label>GRAPHICS <select id="graphics"><option value="cinematic">Cinematic — higher detail/shadows</option><option value="balanced">Balanced — less GPU work</option><option value="mobile">Mobile — battery/performance</option></select></label><br><br><button id="start">START GAME</button>`;
 const visualSelect=document.getElementById('graphics');visualSelect.value=visualPreset;
 visualSelect.addEventListener('change',()=>{visualPreset=visualSelect.value;applyVisualPreset();});
 document.getElementById('start').onclick=safelyStart;}
function safelyStart(){
 try{reset();}
 catch(err){
  console.error('Dragon Defense startup/reset failed:',err);
  const msg=err?.stack||String(err);
  window.__DD_START_ERROR=msg;
  const panel=document.getElementById('panel');
  const overlay=document.getElementById('overlay');
  if(overlay)overlay.style.display='grid';
  if(panel){
   let box=document.getElementById('dd-start-error');
   if(!box){box=document.createElement('pre');box.id='dd-start-error';box.style.cssText='white-space:pre-wrap;text-align:left;max-height:240px;overflow:auto;background:#471e29;color:#ffe4df;padding:10px;font:12px monospace';panel.appendChild(box);}
   box.textContent='STARTUP ERROR — please include this text when reporting the issue:\n'+msg;
  }
 }
}
window.__DD_BOOT_OK=true;
const QUERY_PARAMS=new URLSearchParams(location.search);
const DEVLAB_MODE=QUERY_PARAMS.get('devlab')==='1'||QUERY_PARAMS.get('qa')==='1';
document.getElementById('graphics')?.addEventListener('change',e=>{visualPreset=e.target.value;applyVisualPreset();});
document.getElementById('settings-btn').onclick=()=>{active=false;document.getElementById('overlay').style.display='grid';showSettings();};
document.getElementById('gas-btn').onclick=gasAttack;document.getElementById('start').onclick=safelyStart;document.getElementById('restart').onclick=safelyStart;document.getElementById('pause').onclick=togglePause;
const shotScratchPrevious=new THREE.Vector3(),shotScratchPath=new THREE.Vector3(),shotScratchClosest=new THREE.Vector3(),shotScratchDelta=new THREE.Vector3();
function update(dt){if(!paused){schoolReconstruction?.update(dt);chapterStaging.update(dt,elapsed);cinematicFX.begin(dt);neighborhood.update(dt);referenceFacades.update();for(const role of ['leftRowhouse','rightRowhouse']){const group=actualRowhouseOverlays[role];if(group){const name=role==='leftRowhouse'?'united-fund-cream':'north-brownstone';const house=neighborhood.buildings.find(b=>b.name===name);const show=!!house&&house.damage<.98&&performanceLab.isEnabled('schoolModel');if(group.visible!==show)setRowhouseSourceVisible(role,show);}}if(active&&neighborhood.school.damage>schoolDamage){schoolDamage=neighborhood.school.damage;hp=Math.min(hp,Math.round((1-schoolDamage)*100));syncStructuralDamage();updateHud();if(hp<=0)gameOver()}updateNight(dt);if(performanceLab.isEnabled('weather'))cinematicWeather.update(dt,wave,dayDarkness(wave));if(performanceLab.isEnabled('particles'))updateEffects(dt);if(performanceLab.isEnabled('fires'))updateFires(dt);if(active&&performanceLab.isEnabled('traffic'))updateCars(dt);updateEmergencyLighting()}if(!active||paused)return;elapsed+=dt;if(updateChapterSettlement(dt))return;if(schoolFire.length){const severity=Math.min(1,schoolFire.reduce((sum,f)=>sum+Math.max(0,1-f.suppression),0)/3);fireHealthAccumulator+=dt*(1+severity*.75)*severity;if(fireHealthAccumulator>=1){const damage=Math.floor(fireHealthAccumulator);fireHealthAccumulator-=damage;hp=Math.max(0,hp-damage);updateHud();if(hp<=0){gameOver();return;}}}blockCharge=Math.min(100,blockCharge+dt*(wave<=5?1.9:wave<=10?2.5:1.5));updateBlockButton();updatePowerHud();updateShield();updateWorld(dt);
 if(elapsed<rapidFireUntil&&cooldown<=0&&input.isDown(ACTIONS.FIRE))shoot();updateDragonWind(dt);updateMeteorRadar(dt);
 // Mouse right button, F key or the GAS HUD button activate gas; prolonged fire never does.

 dragonMeteorTimer-=dt;if(wave>3&&wave<15&&dragonMeteorTimer<=0){spawnDragonMeteor();dragonMeteorTimer=waveBudget(wave,document.getElementById('difficulty')?.value).hunterMinInterval+Math.random()*3;}
 cooldown=Math.max(0,cooldown-dt);const move=dragonStun>0?0:Number(input.isDown(ACTIONS.RIGHT))-Number(input.isDown(ACTIONS.LEFT));const rise=dragonStun>0?0:Number(input.isDown(ACTIONS.UP))-Number(input.isDown(ACTIONS.DOWN));
if(move||rise||dragonStun>0)dragonLeavingRoof=true;
if(dragonLeavingRoof)dragon.position.z=THREE.MathUtils.lerp(dragon.position.z,15,Math.min(1,dt*9));
dragon.position.x=THREE.MathUtils.clamp(dragon.position.x+move*17*dt,-91,91);
if(move&&move!==facing){facing=move;turnTime=.22;}turnTime=Math.max(0,turnTime-dt);
dragon.scale.x=THREE.MathUtils.lerp(dragon.scale.x,facing,Math.min(1,dt*17));dragon.rotation.z=dragonStun>0?Math.sin(elapsed*35)*.14:turnTime>0?Math.sin((.22-turnTime)*28)*.28:Math.sin(elapsed*4)*.035;dragon.position.y=THREE.MathUtils.clamp(dragon.position.y+rise*16*dt,dragonStun>0?1.3:1.7,44);dragon.children.forEach((part,i)=>{if(i<3)part.rotation.z=Math.sin(elapsed*6+i)*.04;});dragon.rotation.y=Math.sin(elapsed*2)*.09;
gasPose=Math.max(0,gasPose-dt);recoveryLift=Math.max(0,recoveryLift-dt);
const turning=turnTime>0?Math.sin(Math.PI*(turnTime/.22)) :0;
const shocked=dragonStun>0||helicopters.some(h=>h.role==='ice'&&h.contactTime>.01);
dragon.rotation.x=shocked?Math.sin(elapsed*24)*.24:turning*.34+(gasPose>0?-.22:0)+(gustTime>0?.15:0);
dragon.rotation.y+=turning*.5*facing;
dragon.rotation.z+=shocked?Math.sin(elapsed*17)*.23:0;
if(recoveryLift>0&&dragonStun<=0){
 const recoverProgress=1-recoveryLift/2.5;
 // Brief crouch/stand, then sustained wing beats and lift-off.
 const risePhase=Math.max(0,(recoverProgress-.30)/.70);
 dragon.position.y=Math.max(dragon.position.y,1.7+risePhase*4.3);
 dragon.rotation.x+=recoverProgress<.30?-.27*(1-recoverProgress/.30):.12*(1-risePhase);
 dragon.scale.y=1-Math.sin(Math.min(1,recoverProgress/.28)*Math.PI)*.12;
}else dragon.scale.y=THREE.MathUtils.lerp(dragon.scale.y,1,Math.min(1,dt*8));
for(let k=0;k<shockArcs.length;k++){const arc=shockArcs[k];arc.visible=shocked&&(Math.sin(elapsed*33+k*4)>-.25);if(arc.visible){const a=k*2.4+elapsed*14;arc.position.set(Math.cos(a)*1.4,Math.sin(a)*1.2,Math.sin(a*2)*.65);arc.rotation.set(a,a*.6,a*1.7);}}
for(const w of wings)w.pivot.rotation.x=w.sign*(Math.sin(elapsed*(recoveryLift>0?20:9))*.37+(shocked?Math.sin(elapsed*25)*.35:0)+turning*.3+(gasPose>0?-.22:0));
// Paulo is a visual-only child of the original simulation root. This
// driver reads the same game signals; it never fires or moves projectiles.
pauloPoseDriver?.update(dt,{
 stunned:dragonStun>0,recovering:recoveryLift>0,windGust:gustTime>0,
 gasAttack:gasPose>0,windCharging:holdStart>0&&windCooldown<=0,
 fireAttack:elapsed<pauloFirePoseUntil,
 turning:turnTime>0,moving:move!==0,rising:rise!==0,
 perched:!dragonLeavingRoof,horizontal:move,facing
});
updateExplosionLights(dt);
if(wave===15)finalSquadron.update(dt,dragon,()=>hurtDragon('FIGHTER MISSILE'));
// A persistent, bounded meteor shower continues even after the scheduled wave budget.
 // Near chapter ends (5, 10, 14) the storm accelerates without preventing progression.
 stormTimer-=dt;
 const chapterEnd=(wave===5||wave===10||wave===14);
 const ambientInterval=(chapterEnd?3.4:5.5)/Math.max(.7,difficulty());
 if(!chapterSettlement.active&&wave<15&&stormTimer<=0&&meteors.length<(easyMode()?9:13)){
  spawnMeteor();stormTimer=ambientInterval*(.75+Math.random()*.5);
 }
 if(remaining>0&&wave<15){spawnTimer-=dt;if(spawnTimer<=0){spawnMeteor();remaining--;spawnTimer=Math.max(easyMode()?1.35:.48,(easyMode()?2.5:1.3)-wave*(easyMode()?.025:.045))*(.7+Math.random()*.5)/difficulty()}}else if(wave<15||meteors.length===0){between+=dt;const chapterBreak=(wave===5||wave===10||wave===14); if(chapterBreak&&between>2.6){beginChapterSettlement();} else if(!chapterBreak&&between>(wave<15?7:4.5)){if(wave>=15){winGame();}else{wave++;between=0;updateHud();newWave();}}}
const shotPrevious=shotScratchPrevious;const path=shotScratchPath;const closest=shotScratchClosest;
for(let i=shots.length-1;i>=0;i--){const s=shots[i];shotPrevious.copy(s.mesh.position);s.mesh.position.addScaledVector(s.vel,dt);s.life-=dt;if(wave===15&&!s.hostile&&finalSquadron.intercept(s.mesh.position,1.7,pos=>groundFireball(pos.x,pos.y,pos.z,1.4))){s.life=0;score+=75;}
 if(!s.hostile&&!s.fireTarget){for(let mi=meteors.length-1;mi>=0;mi--){const m=meteors[mi];path.copy(s.mesh.position).sub(shotPrevious);const denom=Math.max(.00001,path.lengthSq());const t=THREE.MathUtils.clamp(shotScratchDelta.copy(m.mesh.position).sub(shotPrevious).dot(path)/denom,0,1);closest.copy(shotPrevious).addScaledVector(path,t);
 if(closest.distanceTo(m.mesh.position)<m.size*1.1+.95){m.hp-=easyMode()?99:Math.max(2,4.5-m.size);emitImpact(m.mesh.position.x,m.mesh.position.y,m.mesh.position.z,30,.4);emitMeteorShrapnel(m.mesh.position,Math.min(3,m.size));if(m.hp<=0){fragmentMeteor(m);registerIntercept(m);score+=100+wave*10;sound('intercept');if(!m.boss&&!m.largeSplitter&&!m.fragment)blast(m.mesh.position.x,m.mesh.position.y,m.mesh.position.z,2.2*m.size);remove(meteors,mi);updateHud()}s.life=0;break}
 }}if(s.mesh.position.distanceTo(s.target)<1.2||s.life<=0){if(s.fireTarget&&schoolFire.includes(s.fireTarget)&&s.mesh.position.distanceTo(s.target)<1.2){s.fireTarget.suppression+=.045;if(s.fireTarget.suppression>=1){fireGroup.remove(s.fireTarget.root);schoolFire.splice(schoolFire.indexOf(s.fireTarget),1);}}
 if(s.hostile){if(s.mesh.position.distanceTo(dragon.position)<3.2){if(s.water){waterDisable=3.3;message('FIRE HOSE! BREATH DISABLED FOR 3 SECONDS');}else if(s.iceHelicopter)iceHit('ICE ELECTRICAL BEAM',true);else if(s.iceGround)iceHit('ICE GROUND PROJECTILE');else hurtDragon('POLICE FIRE');}}else if(!s.fireTarget){blast(s.mesh.position.x,s.mesh.position.y,s.mesh.position.z);emitImpact(s.mesh.position.x,s.mesh.position.y,s.mesh.position.z,42,.45);}remove(shots,i)}}
for(let i=meteors.length-1;i>=0;i--){const m=meteors[i];if(m.fragmentGrace>0)m.fragmentGrace=Math.max(0,m.fragmentGrace-dt);if(m.grounded){m.ttl-=dt;m.mesh.rotation.y+=dt*.25;if(m.ttl<=0)remove(meteors,i);continue;}
 if(m.fragment){m.fragmentAge+=dt;m.ttl-=dt;m.vel.y-=1.25*dt;
  m.vel.x*=Math.max(.0,1-.10*dt);m.vel.z*=Math.max(.0,1-.10*dt);
  if(m.ttl<=0){remove(meteors,i);continue;}}
 if(m.dragonHunter){
   // A flaming meteor tracks the dragon horizontally but must finish its fall even if dodged.
   const remainingHeight=Math.max(0,m.mesh.position.y-.65);
   m.vel.y=-Math.max(16,22+wave*.75);
   m.steerUntil-=dt;if(hunterSteering(m.steerUntil))m.vel.x=THREE.MathUtils.clamp((dragon.position.x-m.mesh.position.x)*.9,-14,14);
   m.target.set(m.mesh.position.x+m.vel.x*remainingHeight/Math.abs(m.vel.y),.65,dragon.position.z);
  }
  if(m.dragonHunter){m.ttl-=dt;if(m.ttl<=0){remove(meteors,i);continue;}}// Swept meteor/helicopter collision: prevents fast meteors passing through a rotorcraft between frames.
  const meteorStart=shotScratchPrevious.copy(m.mesh.position);
  m.mesh.position.addScaledVector(m.vel,dt);
  if(performanceLab.isEnabled('helicopters')){
   const travel=shotScratchPath.copy(m.mesh.position).sub(meteorStart);
   const travelSq=Math.max(1e-8,travel.lengthSq());
   for(const h of helicopters){
    if(h.crashing||!h.root.visible)continue;
    const t=THREE.MathUtils.clamp(shotScratchDelta.copy(h.root.position).sub(meteorStart).dot(travel)/travelSq,0,1);
    const closestPoint=shotScratchClosest.copy(meteorStart).addScaledVector(travel,t);
    if(closestPoint.distanceToSquared(h.root.position)<Math.pow(Math.max(2.5,(m.size||1)*.8+1.7),2)){
     crashHelicopter(h);
     emitMeteorShrapnel(h.root.position,Math.min(3,m.size||1));
     message('METEOR STRUCK HELICOPTER!');
     break;
    }
   }
  }
  m.mesh.rotation.x+=dt*2;m.mesh.rotation.y+=dt*1.5;if(m.burning)cinematicFX.fire(m.mesh.position,elapsed,m.size*.6,0);m.trail-=dt;if(m.trail<=0){m.trail=.11;if(quality.allowTrail(trailParticles.length)){emitTrail(m.mesh.position,!m.burning||Math.random()<.73)}}if(m.dragonHunter&&m.mesh.position.distanceTo(dragon.position)<2.6){hurtDragon('FLAMING METEOR');groundFireball(m.mesh.position.x,m.mesh.position.y,m.mesh.position.z,1.2);remove(meteors,i);continue;}
 if((m.dragonHunter&&m.mesh.position.y<=.8)||(!m.dragonHunter&&(m.mesh.position.distanceTo(m.target)<Math.max(.8,m.size*.65)||m.mesh.position.y<=.7))){if(m.dragonHunter){groundFireball(m.target.x,Math.max(.6,m.target.y),m.target.z,1.5);remove(meteors,i);continue;}if(m.target.y<2&&m.target.z>13&&m.target.z<35)addCrater(m.target.x,m.target.z,2.2+m.size);
 if(elapsed<schoolShieldUntil&&m.target.z<14&&Math.abs(m.target.x)<30){groundFireball(m.target.x,m.target.y,m.target.z,m.size);remove(meteors,i);continue;}
 if(m.boss){neighborhood.levelAll(p=>debrisPiece(p,'brick'));schoolDamage=1;syncStructuralDamage();hp=0;groundFireball(m.target.x,m.target.y,m.target.z,12);updateHud();gameOver();remove(meteors,i);break;}
 groundFireball(m.target.x,m.target.y,m.target.z,m.size);cinematicFX.burst(m.target,Math.max(.4,m.size));if(impactProfile(m.size,m.kind).penetrates&&m.target.z<13){const internal=m.target.clone().add(new THREE.Vector3(0,-1.2,-1.7));cinematicFX.burst(internal,Math.max(.4,m.size*.8));neighborhood.city.impact(neighborhood.city.buildings.find(b=>Math.abs(b.x-internal.x)<b.w/2&&Math.abs(b.z-internal.z)<b.d/2),internal,impactProfile(m.size,m.kind).radius,.45);}if(m.burning){const count=m.kind==='flaming'?5:3;for(let k=0;k<count;k++)ignite(m.target.x+(Math.random()-.5)*m.size*4,Math.max(.4,m.target.y),m.target.z+(Math.random()-.5)*2);}
 const roofImpact=neighborhood.roofBreach(m.target.x,m.target.y,m.target.z,impactProfile(m.size,m.kind).radius*.65);
 if(roofImpact){emitMeteorShrapnel(m.target,Math.min(5,m.size*2));
  for(let k=0;k<3;k++)ignite(m.target.x+(Math.random()-.5)*3,Math.max(1,m.target.y-2.2),m.target.z+(Math.random()-.5)*2);
  neighborhood.aftershock(m.target.x,m.target.y,m.target.z,impactProfile(m.size,m.kind).shockRadius,p=>debrisPiece(p,'roof'));
 }
 damage(m.target.x,m.target.z,m.target.y,m);if(m.size>1.5){blast(m.target.x,m.target.y,m.target.z,5*m.size);neighborhood.impact(m.target.x,m.target.y,m.target.z,3*m.size,p=>debrisPiece(p,'brick'));}
 strikeParkedCars(m.target.x,m.target.z,5.5);for(const c of cars)if(performanceLab.isEnabled('traffic')&&Math.abs(c.root.position.x-m.target.x)<4&&Math.abs(c.root.position.z-m.target.z)<7&&m.target.y<5)explodeCar(c);
 if(m.target.y<2){m.grounded=true;m.ttl=9;m.vel.set(0,0,0);m.mesh.position.copy(m.target);m.mesh.position.y=.7;m.mesh.scale.multiplyScalar(.75);m.hp=Math.max(1,m.hp);}
 else remove(meteors,i);if(!active)break;continue}for(const b of blasts){if(m.fragmentGrace>0||b.age>.64)continue;const dist=m.mesh.position.distanceTo(b.mesh.position),reach=b.r+m.size*.85+(easyMode()?2.2:.8);
 if(dist>=reach)continue;
 const centrality=Math.max(0,1-dist/Math.max(.1,reach));
 if(!m.hitBlasts)m.hitBlasts=new Set();if(m.hitBlasts.has(b))continue;m.hitBlasts.add(b);
 // Central fireball kills small meteors instantly; fringe hits chip larger rocks.
 const force=shockDamage(dist,reach,easyMode());m.hp-=force;
 m.mesh.scale.multiplyScalar(Math.max(.75,1-force*.035));
 emitImpact(m.mesh.position.x,m.mesh.position.y,m.mesh.position.z,Math.round(15+centrality*38),.3);emitMeteorShrapnel(m.mesh.position,Math.min(2,m.size));
 if(m.hp<=0){fragmentMeteor(m);registerIntercept(m);score+=Math.round((100+wave*10)*m.damage);sound('intercept');updateHud();if(!m.boss&&!m.largeSplitter&&!m.fragment)blast(m.mesh.position.x,m.mesh.position.y,m.mesh.position.z,1.7*m.size);emitImpact(m.mesh.position.x,m.mesh.position.y,m.mesh.position.z,80*m.size,.7);remove(meteors,i);}break;
 }}
for(let i=blasts.length-1;i>=0;i--){const b=blasts[i];b.age+=dt;b.r=Math.min(b.max,b.age*10);b.mesh.scale.setScalar(b.r);b.mesh.material.opacity=Math.max(0,.42*(1-b.age/.78));if(b.age>.78)remove(blasts,i)}for(let i=debris.length-1;i>=0;i--){const d=debris[i];d.life-=dt;d.v.y-=10.8*dt;d.mesh.position.addScaledVector(d.v,dt);d.mesh.rotation.x+=dt*3;if(d.mesh.position.y<.05){d.mesh.position.y=.05;if(d.v.y<-.4&&d.bounces<3){d.v.y=-d.v.y*.33;d.v.x*=.72;d.v.z*=.72;d.bounces++;}else{d.v.y=0;d.v.x*=Math.max(0,1-dt*5);d.v.z*=Math.max(0,1-dt*5);}}if(d.life<=0){if(d.rubble&&!d.trail){preserveRubble(d);debris.splice(i,1)}else remove(debris,i)}}if(toastTimer>0&&(toastTimer-=dt)<=0)document.getElementById('toast').textContent=''}
const clock=new THREE.Clock();let lastW=0,lastH=0;let cameraScrollX=0;let hostMetricTime=0;let hostMetricFrames=0;
let maxRenderFPS=Number(new URLSearchParams(location.search).get('fps')||localStorage.getItem('ddFPSCap')||'45');let previousRenderAt=-99999;
const detailedTimings={sim:[],render:[]};
function percentiles(arr){if(!arr.length)return {p50:0,p95:0,p99:0,max:0};const v=[...arr].sort((a,b)=>a-b);return {p50:+v[Math.floor(v.length*.5)].toFixed(1),p95:+v[Math.floor(v.length*.95)].toFixed(1),p99:+v[Math.floor(v.length*.99)].toFixed(1),max:+v[v.length-1].toFixed(1)};}
function recordCpuTimings(sim,render){for(const [key,n] of [['sim',sim],['render',render]]){const a=detailedTimings[key];a.push(Math.min(20000,n));if(a.length>1500)a.shift();}}

// Captures are explicitly opt-in; screenshot copies just the finished WebGL frame,
// and video records the existing canvas without a second renderer pass.
const captureLab=createCaptureLab({canvas:renderer.domElement,maxVideoSeconds:25,
 getMetadata:()=>({version:GAME_VERSION,build:BUILD_ID,wave,score,schoolHealth:hp,
  graphics:visualPreset,drawCalls:renderer.info.render.calls,
  triangles:renderer.info.render.triangles,active,paused,
  enabledSystems:performanceLab.states(),latestBenchmark:performanceLab.captures().at(-1)?.summary||null,
  recentStalls:stallEvents.slice(-8),bimBatch:window.__DD_BIM_BATCH||null,frameHealth:frameHealth?.summary?.()||null}),
 onStatus:(msg)=>{const el=document.querySelector('[data-capture-status]');if(el)el.textContent=msg;}
});
window.__DD_CAPTURE={screenshot:()=>captureLab.requestScreenshot('manual'),start:()=>captureLab.startRecording(),stop:()=>captureLab.stopRecording(),recording:()=>captureLab.isRecording(),history:()=>captureLab.history()};
const frameHealth=createFrameHealth({isRecording:()=>captureLab.isRecording()});
window.__DD_FRAME_HEALTH={summary:()=>frameHealth.summary()};
const fixedStep=createFixedStep({step:1/60,maxSteps:3,maxFrame:.1});
const profiler=createProfiler({renderer,scene,metrics:()=>({meteors:meteors.length,shots:shots.length,debris:debris.length,cars:cars.length,effects:effectObjects.length+impactParticles.length+trailParticles.length,quality:quality.level,disabledSystems:Object.values(performanceLab.states()).filter(on=>!on).length,gas:typeof gasClouds!=='undefined'?gasClouds.length:'n/a'})});
// Independent graphics-loop heartbeat for benchmark diagnosis; never infers a frame from a timer.
// A stalled requestAnimationFrame and a blocked WebGL context are reported distinctly.
const gpuResourceAudit=new URLSearchParams(location.search).get('benchmark')==='1'?installWebGLResourceAudit(renderer.getContext()):null;
const diagnosticFrames={ticks:0,rendered:0,lastTickUTC:0,lastRenderUTC:0,contextLost:false,
                       contextEvents:[],rendererBlocks100:0,maxRendererBlockMs:0,lastRendererBlockUTC:0};
if(new URLSearchParams(location.search).get('benchmark')==='1'){
 window.__DD_FRAME_SIGNAL=diagnosticFrames;
 renderer.domElement.addEventListener('webglcontextlost',e=>{
  diagnosticFrames.contextLost=true;
  diagnosticFrames.contextEvents.push({at:Date.now(),type:'lost'});
 });
 renderer.domElement.addEventListener('webglcontextrestored',()=>{
  diagnosticFrames.contextLost=false;
  diagnosticFrames.contextEvents.push({at:Date.now(),type:'restored'});
 });
}
function animate(){requestAnimationFrame(animate);diagnosticFrames.ticks++;diagnosticFrames.lastTickUTC=Date.now();const present=performance.now();
 if(maxRenderFPS>0&&present-previousRenderAt<1000/maxRenderFPS-1.0)return;
 previousRenderAt=present;const dt=clock.getDelta();if(dt>.25&&active&&!paused){quality.sample(Math.min(dt,.2));}hostMetricTime+=dt;hostMetricFrames++;quality.sample(dt);evaluateRenderPressure(maxRenderFPS>0?dt*Math.min(1,maxRenderFPS/60):dt,active&&!paused);
 sessionStats.frames++;sessionStats.frameTimeTotal+=dt;const simStart=performance.now();const step=fixedStep.advance(dt,update);const simMs=performance.now()-simStart;
 const w=innerWidth,h=innerHeight;
 const resized=w!==lastW||h!==lastH;
 if(resized){
  renderer.setSize(w,h,false);
  renderer.domElement.style.width=w+'px';renderer.domElement.style.height=h+'px';
  camera.aspect=w/h;
  lastW=w;lastH=h;
 }
 const jitter=shake>0?(Math.random()-.5)*shake:0;
 shake=Math.max(0,shake-Math.min(dt,.1));
 const follow=Math.max(0,dragon.position.y-25)*.62;
 const deadZone=35*Math.min(1,camera.aspect/(16/9));
 cameraScrollX=dragon.position.x-THREE.MathUtils.clamp(dragon.position.x,-deadZone,deadZone);
 skylineBackdrop.update(elapsed,displayedDarkness,dt);
 skyline.position.x=skylineParallaxX(skylineAnchor,cameraScrollX,.62);
 neighborhood.foreground.position.x=-cameraScrollX*.035;
 camera.position.set(streetView.x+cameraScrollX+jitter,streetView.y+follow,streetView.z);
 camera.lookAt(cameraScrollX,streetView.targetY+follow,streetView.targetZ);
 const targetZoom=wave===15?.86:1;
 const nextZoom=THREE.MathUtils.lerp(camera.zoom,targetZoom,Math.min(1,dt*1.8));
 if(resized||Math.abs(nextZoom-camera.zoom)>.0001){camera.zoom=nextZoom;camera.updateProjectionMatrix();}
 const renderStartUTC=Date.now();const renderStart=performance.now();cinematicFX.flush();renderer.render(scene,camera);const renderMs=performance.now()-renderStart;const renderEndUTC=Date.now();if(renderMs>=100){diagnosticFrames.rendererBlocks100++;diagnosticFrames.maxRendererBlockMs=Math.max(diagnosticFrames.maxRendererBlockMs,renderMs);diagnosticFrames.lastRendererBlockUTC=renderEndUTC;}window.__DD_LAST_RENDER_UTC=renderEndUTC;diagnosticFrames.rendered++;diagnosticFrames.lastRenderUTC=window.__DD_LAST_RENDER_UTC;captureLab.afterRender();recordCpuTimings(simMs,renderMs);
 if(hostMetricTime>=1){
  window.__DD_GAME_METRICS={wave,fps:Math.round(hostMetricFrames/hostMetricTime*10)/10,drawCalls:renderer.info.render.calls,
   frameMs:+(dt*1000).toFixed(1),recording:captureLab.isRecording(),stallCount:frameHealth.summary().totalLongFrames};
  hostMetricTime=0;hostMetricFrames=0;
 }
 if(active&&!paused)frameHealth.observe({frameMs:dt*1000,simMs,renderMs,drawCalls:renderer.info.render.calls,triangles:renderer.info.render.triangles,wave});
 if(active&&!paused)performanceLab.record({dt,simMs,renderMs,drawCalls:renderer.info.render.calls});
 if(active&&dt>.07&&stallEvents.length<100){stallEvents.push({wave,atSeconds:Math.round(elapsed),frameMs:Math.round(dt*1000),simulationCpuMs:+simMs.toFixed(1),renderSubmissionCpuMs:+renderMs.toFixed(1),drawCalls:renderer.info.render.calls,triangles:renderer.info.render.triangles,meteors:meteors.length,cars:cars.length,activeDebris:debris.length,renderScale:+adaptiveResolution.toFixed(2)});}

 if(active&&sessionStats.frames%4===0){playtestFrameMs.push(Math.min(250,dt*1000));if(playtestFrameMs.length>1500)playtestFrameMs.shift();peakDrawCalls=Math.max(peakDrawCalls,renderer.info.render.calls);}
 profiler.record({dt,simMs,renderMs,stepCount:step.steps,droppedSteps:step.dropped});
 if(window.__DD_BENCHMARK)window.__DD_BENCHMARK.frame(dt,simMs,renderMs,renderer.info.render.calls,renderer.info.render.triangles,renderStartUTC,renderEndUTC);
}animate();

// Fullscreen is a user-gesture operation; the browser must grant it.
document.getElementById('fullscreen-btn').addEventListener('click',async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else await document.documentElement.requestFullscreen();}catch(e){message('FULLSCREEN UNAVAILABLE');}});
document.addEventListener('fullscreenchange',()=>{document.getElementById('fullscreen-btn').textContent=document.fullscreenElement?'⛶ Exit Fullscreen':'⛶ Fullscreen';});


// QA bridge is enabled only on ?qa=1. It exposes actual game entities and uses
// production functions; no mock gameplay or alternate renderer is involved.
if(new URLSearchParams(location.search).get('qa')==='1'){
 const qaLog=[];let qaSequence=0;
 const snap=()=>({version:GAME_VERSION,build:BUILD_ID,active,paused,wave,score,hp,
  dragon:{x:dragon.position.x,y:dragon.position.y,z:dragon.position.z,lives:dragonLives},
  aim:{x:pointer.x,y:pointer.y,z:pointer.z},
  chapterTransition:{...chapterSettlement,postCutsceneWave,stagingMode:chapterStaging.mode,fadeOpacity:chapterFade.style.opacity},
  camera:{x:camera.position.x,scroll:cameraScrollX,skylineOffset:skyline.position.x-skylineAnchor,perspective:camera.isPerspectiveCamera,foregroundOffset:neighborhood.foreground.position.x,streetOrigins:neighborhood.streetOrigins()},
  schoolReconstruction:schoolReconstruction?.stats()||null,
  sourceSchool:{visible:Boolean(actualSchoolOverlay?.visible),strikes:sourceDamage.strikes()},
  realBlockReferences:{facadeCount:referenceFacades.referenceBuildings,drawObjects:referenceFacades.drawObjects,facades:referenceFacades.snapshots()},
  renderVisibility:{schoolEnabled:performanceLab.isEnabled('schoolModel'),schoolVisible:Boolean(architecturalModel?.visible || actualSchoolOverlay?.visible || (!architecturalReady&&Object.values(meshes).some(m=>m.visible))),actualSchoolOverlayReady,fbxRowhouses:{left:!!actualRowhouseOverlays.leftRowhouse?.visible,right:!!actualRowhouseOverlays.rightRowhouse?.visible},schoolModelCalibration:actualSchoolOverlayStats?.calibration||null,skylineEnabled:performanceLab.isEnabled('skyline'),skylineVisible:skylineBackdrop.group.visible,backgroundEnabled:performanceLab.isEnabled('backgroundBuildings'),particlesEnabled:performanceLab.isEnabled('particles'),fireEnabled:performanceLab.isEnabled('fires'),renderFPSCap:maxRenderFPS,preset:visualPreset,pixelRatio:renderer.getPixelRatio(),shadows:renderer.shadowMap.enabled},
  atmosphere:{phase:displayedPhase,darkness:displayedDarkness},structure:neighborhood.city.stats(),
  vehicleLighting:cars.filter(c=>c.root.userData.headlightBeam).map(c=>({visible:c.root.userData.headlightBeam.visible,strength:c.root.userData.headlightBeam.material.uniforms.strength.value,emissive:c.root.userData.headlightMaterial.emissiveIntensity})),
  neighborhood:{damaged:neighborhood.targetBuildings.filter(b=>b.damage>.001).length,damageSum:+neighborhood.targetBuildings.reduce((sum,b)=>sum+b.damage,0).toFixed(3),targets:neighborhood.targetBuildings.filter(b=>!b.background).slice(0,12).map(b=>({name:b.name,x:b.x,y:Math.min(b.h-2,7),front:b.front,w:b.w,damage:+b.damage.toFixed(3)}))},
  schoolDamage:+schoolDamage.toFixed(3),scene:{meshes:renderer.info.memory.geometries,textures:renderer.info.memory.textures,drawCalls:renderer.info.render.calls,triangles:renderer.info.render.triangles,renderScale:adaptiveResolution},
  lighting:{explosionSlots:explosionLightPool.lights.length,activeExplosions:explosionLightPool.activeCount,helicopterSlots:helicopterLightPool.lights.length,activeHelicopters:helicopterLightPool.activeCount},
  finalSquadron:finalSquadron.stats(),counts:{meteors:meteors.length,fragmentMeteors:meteors.filter(m=>m.fragment).length,bossMeteors:meteors.filter(m=>m.boss).length,shots:shots.length,blasts:blasts.length,debris:debris.length,cars:cars.length,helicopters:helicopters.length,skylineFires:skylineFires.length},
  meteors:meteors.slice(0,40).map(m=>({x:m.mesh.position.x,y:m.mesh.position.y,z:m.mesh.position.z,size:m.size,hp:m.hp,fragment:!!m.fragment,boss:!!m.boss,generation:m.generation||0,grace:m.fragmentGrace||0})),
  lastErrors:qaLog.slice(-15),elapsed,frameTimes:{frames:sessionStats.frames,seconds:sessionStats.frameTimeTotal}});
 const run=(name,fn)=>{let result;try{result=fn();qaLog.push({seq:++qaSequence,name,ok:true});return {ok:true,result};}catch(err){qaLog.push({seq:++qaSequence,name,ok:false,error:String(err)});return {ok:false,error:String(err)};}};
 // A dedicated geometry-based skyline camera for visual QA. Normal gameplay
 // camera, coordinates and renderer remain unchanged after the next RAF.
 const qaSkylineCamera=new THREE.OrthographicCamera(-145,145,81.5625,-81.5625,.1,650);
 // A close camera captures Paulo at real gameplay scale and lighting.
 // Rendering here is diagnostic only; the next game frame restores its camera.
 const qaDragonCamera=new THREE.PerspectiveCamera(42,16/9,.1,250);
 window.__DD_QA={snap,log:()=>qaLog.slice(),run,
  captureDragonDetail:()=>run('captureDragonDetail',()=>{
   const width=renderer.domElement.width,height=renderer.domElement.height;
   qaDragonCamera.aspect=width/Math.max(1,height);
   qaDragonCamera.position.set(dragon.position.x+9,dragon.position.y+5,dragon.position.z+14);
   qaDragonCamera.lookAt(dragon.position.x,dragon.position.y+.4,dragon.position.z);
   qaDragonCamera.updateProjectionMatrix();
   // Damage invulnerability can blink the creature at the instant of capture.
   // Force a visible reference frame, then restore the game-controlled flag.
   const wasVisible=dragon.visible;
   let png;
   try{
    dragon.visible=true;
    renderer.render(scene,qaDragonCamera);
    png=renderer.domElement.toDataURL('image/png');
   }finally{dragon.visible=wasVisible;}
   return {png,
    model:pauloPreviewEnabled?'paulo':'legacy',
    dragon:dragon.position.toArray(),
    camera:qaDragonCamera.position.toArray(),
    pose:pauloPoseDriver?.snapshot().pose??null};
  }),
  captureSkyline:(detail=false)=>run('captureSkyline',()=>{
   const centerX=skyline.position.x;
   // Wide shows the skyline in its city context; close places the diagnostic
   // camera between near residential blocks and the skyline to reveal debris
   // that those blocks otherwise obscure. Neither modifies the gameplay view.
   qaSkylineCamera.position.set(centerX,detail?51:62,skyline.position.z+(detail?35:165));
   qaSkylineCamera.lookAt(centerX,detail?30:39,skyline.position.z);
   qaSkylineCamera.updateProjectionMatrix();
   renderer.render(scene,qaSkylineCamera);
   return {png:renderer.domElement.toDataURL('image/png'),detail,
    camera:{x:qaSkylineCamera.position.x,y:qaSkylineCamera.position.y,z:qaSkylineCamera.position.z},
    skyline:{x:skyline.position.x,y:skyline.position.y,z:skyline.position.z}};
  }),
  sampleSkylineEmissive:()=>run('sampleSkylineEmissive',()=>{
   // Read-only appearance probe for the skyline's existing electrical
   // flicker. Restore the live animation time even if a sample fails.
   const tower=skylineBackdrop.towers.find(t=>t.def.id==='comcast-technology');
   if(!tower)throw Error('Expected landmark missing');
   const samples=[];
   try{
    for(const seconds of [0,.12,.24,.36,.48,.60,.72,.84,.96]){
     skylineBackdrop.update(seconds,displayedDarkness,0);
     samples.push({seconds,emissive:tower.facade.emissiveIntensity});
    }
   }finally{skylineBackdrop.update(elapsed,displayedDarkness,0);}
   return {landmark:tower.def.id,collapse:tower.collapse,samples};
  }),
  sampleDistantHelicopters:()=>run('sampleDistantHelicopters',()=>{
   // Advance only the cosmetic skyline animation to sample long sessions.
   // Restore the live frame even if a helicopter is unexpectedly missing.
   const samples=[];
   try{
    for(const seconds of [0,300,600,1200]){
     skylineBackdrop.update(seconds,displayedDarkness,0);
     samples.push({seconds,helicopters:[0,1,2].map(i=>{
      const h=skylineBackdrop.group.getObjectByName('distant-helicopter-'+i);
      if(!h)throw Error('Distant helicopter missing: '+i);
      return {index:i,x:h.position.x,y:h.position.y};
     })});
    }
   }finally{skylineBackdrop.update(elapsed,displayedDarkness,0);}
   return samples;
  }),
  stageSkylineStrike:()=>run('stageSkylineStrike',()=>{
   const index=skylineBackdrop.towers.findIndex(t=>t.def.id==='comcast-technology');
   if(index<0)throw Error('Expected landmark missing');
   const t=skylineBackdrop.towers[index],before=t.strikeDamage;
   // Once the first impact has established its local contact coordinates,
   // capture the next hit's expected world position before damage transforms.
   const expectedPreDamageWorld=before>0?t.group.localToWorld(t.impactLocal.clone()).toArray():null;
   const hit=skylineBackdrop.strikeNearest(t.group.position.x);
   const postDamageImpactWorld=t.group.localToWorld(t.impactLocal.clone()).toArray();
   // Snapshot before the animation tick: the next strike must not inherit
   // the previous flash's expanded radius.
   const flashScaleImmediately=t.impactSprite.scale.x;
   const smokeVisibleImmediately=t.smokeSprite.visible;
   skylineBackdrop.setDamage(skylineDamage);
   skylineBackdrop.update(elapsed,displayedDarkness,1/60);
   return {landmark:t.def.id,worldPosition:hit?.toArray(),beforeDamage:before,
    expectedPreDamageWorld,postDamageImpactWorld,
    smokeVisibleImmediately,afterDamage:t.strikeDamage,flashVisible:t.impactSprite.visible,
    flashParentStable:t.impactSprite.parent===skylineBackdrop.group,
    flashWorldPosition:t.impactSprite.getWorldPosition(new THREE.Vector3()).toArray(),
    flashOpacity:t.impactSprite.material.opacity,flashAge:t.impactAge,
    flashScaleImmediately,
    smokeVisible:t.smokeSprite.visible,smokeOpacity:t.smokeSprite.material.opacity,
    smokeParentStable:t.smokeSprite.parent===skylineBackdrop.group,
    smokeWorldScale:t.smokeSprite.getWorldScale(new THREE.Vector3()).toArray(),
    scorchVisible:t.scorchSprite.visible,scorchOpacity:t.scorchSprite.material.opacity};
  }),
  stageSkylineCollapse:()=>run('stageSkylineCollapse',()=>{
   // Capture the smoke's world position on both sides of the same synchronous
   // collapse event. No animation step occurs between these snapshots, so
   // any displacement would mean smoke inherited the tower transform.
   const t=skylineBackdrop.towers.find(t=>t.def.id==='comcast-technology');
   if(!t)throw Error('Expected landmark missing');
   const smokeWorldBefore=t.smokeSprite.getWorldPosition(new THREE.Vector3()).toArray();
   const flashWorldBefore=t.impactSprite.getWorldPosition(new THREE.Vector3()).toArray();
   skylineBackdrop.setDamage(1);
   const smokeWorldAfter=t.smokeSprite.getWorldPosition(new THREE.Vector3()).toArray();
   const flashWorldAfter=t.impactSprite.getWorldPosition(new THREE.Vector3()).toArray();
   return {landmark:t.def.id,collapse:t.collapse,ruinVisible:t.ruin.visible,
    smokeWorldBefore,smokeWorldAfter,flashWorldBefore,flashWorldAfter,
    flashParentStable:t.impactSprite.parent===skylineBackdrop.group,
    rubbleDetached:t.ruin.parent===skylineBackdrop.group,
    rubbleGroundY:t.ruin.position.y,slabs:t.slabs.length,
    fallActive:t.fallActive,fallElapsed:t.fallElapsed,
    smokeVisible:t.smokeSprite.visible,
    smokeParentStable:t.smokeSprite.parent===skylineBackdrop.group,
    smokeWorldScale:t.smokeSprite.getWorldScale(new THREE.Vector3()).toArray(),
    towerScaleY:t.group.scale.y,slabY:t.slabs.map(s=>s.position.y),
    slabReleaseY:t.slabs.map(s=>s.userData.fallStartY),
    slabGroundY:t.slabs.map(s=>s.userData.groundY),
    slabMaterialGroups:t.slabs.map(s=>s.geometry.groups.length),
    slabFaceMaterialCounts:t.slabs.map(s=>s.material.length),
    slabIndexCounts:t.slabs.map(s=>s.geometry.groups.reduce((sum,g)=>sum+g.count,0))};
  }),
  skylineFallState:()=>run('skylineFallState',()=>{
   const t=skylineBackdrop.towers.find(t=>t.def.id==='comcast-technology');
   if(!t)throw Error('Expected landmark missing');
   return {fallActive:t.fallActive,fallElapsed:t.fallElapsed,ruinVisible:t.ruin.visible,
    strikeDamage:t.strikeDamage,collapse:t.collapse,towerScaleY:t.group.scale.y,
    impactVisible:t.impactSprite.visible,smokeVisible:t.smokeSprite.visible,
    smokeWorldPosition:t.smokeSprite.getWorldPosition(new THREE.Vector3()).toArray(),
    scorchVisible:t.scorchSprite.visible,
    slabY:t.slabs.map(s=>s.position.y),groundY:t.slabs.map(s=>s.userData.groundY)};
  }),
  advanceSkylineFall:(seconds=4)=>run('advanceSkylineFall',()=>{
   if(!Number.isFinite(seconds)||seconds<0||seconds>6)throw Error('Invalid skyline QA step');
   const frames=Math.ceil(seconds*20);
   for(let i=0;i<frames;i++)skylineBackdrop.update(elapsed+i*.05,displayedDarkness,.05);
   const t=skylineBackdrop.towers.find(t=>t.def.id==='comcast-technology');
   return {fallElapsed:t.fallElapsed,slabY:t.slabs.map(s=>s.position.y),
    groundY:t.slabs.map(s=>s.userData.groundY)};
  }),
  stageGroundWind:()=>run('stageGroundWind',()=>{
   // Exercise actual wind logic using temporary targets; preserve game state.
   const before={gustTime,windCooldown,windActive,origin:gustOrigin.clone(),
    direction:gustDirection.clone()};
   const makeCar=(extra={})=>({root:new THREE.Group(),...extra});
   const bike=makeCar({bike:true}),bus=makeCar({bus:true});
   const pedestrian={g:new THREE.Group(),down:0};
   bike.root.position.set(12,0,20);bus.root.position.set(12,0,20);
   pedestrian.g.position.set(12,0,20);
   cars.push(bike,bus);crowd.push(pedestrian);
   try{
    gustId++;gustTime=.85;windCooldown=4;windActive=true;
    gustOrigin.set(0,24,20);gustDirection.set(1,0,0);
    updateDragonWind(.08);
    // Real smoke-puff simulation, isolated from any ongoing background events.
    const existingPuffs=skyBursts.splice(0);
    const testSmoke={m:{position:new THREE.Vector3(12,24,20),
     scale:new THREE.Vector3(1,1,1),material:{opacity:.58}},
     smoke:true,life:2,initialLife:2};
    skyBursts.push(testSmoke);
    let smokeResult;
    try{
     updateSkyBursts(.08);
     smokeResult={x:testSmoke.m.position.x,opacity:testSmoke.m.material.opacity};
    }finally{
     skyBursts.length=0;skyBursts.push(...existingPuffs);
    }
    return {bikeX:bike.root.position.x,busX:bus.root.position.x,
     personX:pedestrian.g.position.x,dustInstances:windDustPool.mesh.count,
     litterInstances:windLitterPool.mesh.count,
     smokeWindStrength:cinematicFX.stats().windStrength,
     puffX:smokeResult.x,puffOpacity:smokeResult.opacity};
   }finally{
    cars.splice(cars.indexOf(bike),1);cars.splice(cars.indexOf(bus),1);
    crowd.splice(crowd.indexOf(pedestrian),1);
    gustTime=before.gustTime;windCooldown=before.windCooldown;
    windActive=before.windActive;gustOrigin.copy(before.origin);
    gustDirection.copy(before.direction);
    windVisual.visible=windActive;
    clearWindDebris();
    cinematicFX.setWind(null,null,0);
   }
  }),
  stageTrafficLighting:()=>run('stageTrafficLighting',()=>{
   for(let i=0;i<8&&!cars.some(c=>c.root.userData.headlightBeam);i++)spawnCar();
   const car=cars.find(c=>c.root.userData.headlightBeam);
   if(!car)throw new Error('No road vehicle available');
   car.root.position.set(0,-.36,20);car.root.rotation.y=0;car.speed=0;car.desiredSpeed=0;
   setRoadVehicleNight(car.root,0);const day=car.root.userData.headlightBeam.visible;
   setRoadVehicleNight(car.root,.85);
   return {dayVisible:day,nightVisible:car.root.userData.headlightBeam.visible,strength:car.root.userData.headlightBeam.material.uniforms.strength.value};
  }),
  schoolComparison:()=>run('schoolComparison',()=>{
   if(!sourceComparison)throw Error('Source FBX comparison is not ready');
   const gameSchool=actualSchoolOverlay.clone();
   gameSchool.visible=true;
   return captureSchoolComparison(renderer,sourceComparison.original,sourceComparison.school,gameSchool);
  }),
  schoolExterior:()=>run('schoolExterior',()=>{
   const {scale,translation}=fitSchoolFromFacade();
   const ray=new THREE.Raycaster();
   // Sample four former gaps and the retained opening at the rear stairs.
   return [[-1,7.2,-29.3],[-1,7.2,-48.3],[1,6.5,-67.8],[1,44.8,-28.4],[1,20,-91]].map(([side,y,z])=>{
    ray.set(new THREE.Vector3((side===1?45:-28)*scale+translation.x,y*scale,z*scale+translation.z),
     new THREE.Vector3(-side,0,0));
    ray.far=3*scale;
    return ray.intersectObject(actualSchoolOverlay,true)[0]?.object.material.name??null;
   });
  }),
  schoolDamageView:()=>run('schoolDamageView',()=>{
   const model=new THREE.Group();
   if(actualSchoolOverlay.visible)model.add(actualSchoolOverlay.clone());
   for(const batch of schoolReconstruction.group)if(batch.visible&&batch.count)model.add(batch.clone());
   return captureSchoolViews(renderer,[['damage',model]],['front','corner','right-side']);
  }),
  // QA-only deterministic motion advance for offline video testing.
  // Runs the real simulation, not a synthetic animation or a second renderer.
  // A separate RAF step is still required to draw the resulting state.
  motionStep:(seconds=0.125)=>run('motionStep',()=>{
   if(!Number.isFinite(seconds)||seconds<=0||seconds>0.25)throw Error('Motion QA step must be in (0, 0.25] seconds');
   const count=Math.round(seconds*60);
   const before=snap();
   for(let i=0;i<count;i++)update(1/60);
   const after=snap();
   return {advancedSeconds:count/60,from:{wave:before.wave,dragon:before.dragon,score:before.score},
    to:{wave:after.wave,dragon:after.dragon,score:after.score},
    simulationTime:elapsed,active,paused};
  }),

  labStageMilitaryInterception:()=>run('labStageMilitaryInterception',()=>{
   if(!active)reset();if(cinematicActive)closeChapterTransition();paused=false;wave=11;
   const state=()=>({score,playerIntercepts:sessionStats.intercepts,streak:interceptionStreak,
    powerups:sessionStats.powerups,military:sessionStats.militaryInterceptions,
    rapidFireUntil,schoolShieldUntil,meteors:meteors.length});
   const before=state();
   spawnMeteor();const meteor=meteors.at(-1);
   if(!meteor)throw Error('QA failed to create a real meteor');
   meteor.dragonHunter=true; // Government interception must never trigger player shield.
   const handled=removeMilitaryInterceptedMeteor(meteor);
   return {before,after:state(),handled,removed:!meteors.includes(meteor)};
  }),
  labStageMilitaryWind:()=>run('labStageMilitaryWind',()=>{
   if(!active)reset();if(cinematicActive)closeChapterTransition();paused=false;
   wave=11;dragon.position.set(-3,13,15);facing=1;militaryOccupation.reset();
   militaryOccupation.stageWindRocket(new THREE.Vector3(12,13,15));
   const before=militaryOccupation.windRocketStates();
   gustOrigin.copy(dragon.position);gustDirection.set(1,0,0);gustTime=.85;windCooldown=4;windActive=true;gustMissileNotified=false;
   updateDragonWind(.05);
   return {before,after:militaryOccupation.windRocketStates(),snapshot:snap()};
  }),
  labStageMilitarySearchlights:()=>run('labStageMilitarySearchlights',()=>{
   if(!active)reset();if(cinematicActive)closeChapterTransition();paused=false;
   wave=11;dragon.position.set(0,18,15);militaryOccupation.reset();
   // No missiles are fired during this 1.5s visual-only staged aim test.
   for(let i=0;i<90;i++)militaryOccupation.update(1/60,[],[]);
   return {states:militaryOccupation.searchlightStates(),counts:militaryOccupation.counts(),snapshot:snap()};
  }),
  labStageWind:()=>run('labStageWind',()=>{if(!active)reset();if(cinematicActive)closeChapterTransition();paused=false;wave=6;dragon.position.set(-3,13,15);facing=1;helicopterTimer=600;spawnHelicopter(1);const h=helicopters.at(-1);if(!h)throw Error('Unable to spawn test helicopter');h.root.position.set(9,13,15);h.disorientTime=0;gustOrigin.copy(dragon.position);gustDirection.set(1,0,0);gustTime=.85;windCooldown=4;windActive=true;return {description:'Production dragon wind will strike a helicopter and induce 5s disorientation',snapshot:snap()};}),
  labStageIce:()=>run('labStageIce',()=>{if(!active)reset();if(cinematicActive)closeChapterTransition();paused=false;wave=6;dragon.position.set(0,13,15);helicopterTimer=600;spawnHelicopter(1);const h=helicopters.at(-1);if(!h)throw Error('Unable to spawn ICE helicopter');h.root.position.set(10,13,15);h.role='ice';h.disorientTime=0;h.iceCooldown=0;h.contactTime=0;return {description:'Continuous 17-unit beam; uninterrupted 3s contact required',snapshot:snap()};}),
  labStageDragonFall:()=>run('labStageDragonFall',()=>{if(!active)reset();if(cinematicActive)closeChapterTransition();paused=false;dragon.position.set(0,26,15);stunDragon('QA ELECTRICAL FALL');return {description:'Production stun, falling, impact and takeoff sequences',snapshot:snap()};}),
  labGasAttack:()=>run('labGasAttack',()=>{if(!active)reset();if(cinematicActive)closeChapterTransition();paused=false;gasCooldown=0;dragon.position.set(0,13,15);facing=1;gasAttack();return {description:'Real dragon gas cloud and collision rules',cloudCount:gasClouds.length,snapshot:snap()};}),
  labCrowd:()=>run('labCrowd',()=>{if(!active)reset();if(cinematicActive)closeChapterTransition();paused=false;for(let n=0;n<4;n++)spawnCrowd();return {description:'Production pedestrian animations and crowd movement',snapshot:snap()};}),
  advanceFlashLights:(dt=.6)=>run('advanceFlashLights',()=>{updateExplosionLights(Math.max(0,Math.min(1,dt)));return snap()}),
  flashAt:(x=0,y=6,z=10)=>run('flashAt',()=>{flashAt(x,y,z,1);return snap()}),
  setWave:(n)=>run('setWave',()=>{wave=clampWave(n);updateAtmosphere();updateHud();return snap()}),
  beginSettlement:()=>run('beginSettlement',()=>{wave=5;remaining=0;beginChapterSettlement();return snap()}),
  steeringPose:(x=0)=>run('steeringPose',()=>{const c=cars[0];if(!c)return {noCars:true};c.steerAngle=x;animateVehicleSteering(c,.2);return {steerVisual:c.steerVisual,frontWheelCount:c.root.userData.frontSteer?.length||0};}),
  laneSafety:()=>run('laneSafety',()=>({cars:cars.slice(0,10).map(c=>({x:+c.root.position.x.toFixed(2),z:+c.root.position.z.toFixed(2),laneZ:c.laneZ,passing:choosePassingLane(c,cars,craters),steer:c.steerVisual||0})),streetGlowCount:streetGlows.length})),
  advanceSettlement:(seconds=4)=>run('advanceSettlement',()=>{for(let t=0;t<seconds;t+=1/30){chapterStaging.update(1/30,elapsed);updateChapterSettlement(1/30);}return snap()}),
  closeCinematic:()=>run('closeCinematic',()=>{closeChapterTransition();return snap()}),
  advanceAtmosphere:(dt=1)=>run('advanceAtmosphere',()=>{for(let t=0;t<dt;t+=1/60)updateNight(1/60);return snap()}),
  qaSettleAtmosphere:()=>run('qaSettleAtmosphere',()=>{
   // QA-only: jump to the exact established wave day/night state so staged
   // captures don't misleadingly show daytime while frames are intentionally frozen.
   updateAtmosphere();
   displayedPhase=dayPhase(wave);
   displayedDarkness=dayDarkness(wave);
   scene.background.copy(skyTarget);
   updateNight(0);
   return {wave,phase:displayedPhase,darkness:displayedDarkness,expectedDarkness:dayDarkness(wave)};
  }),
  simulationDetails:()=>({cars:cars.map(c=>({x:c.root.position.x,z:c.root.position.z,routing:!!c.routing,serviceProgress:c.serviceProgress,speed:c.speed,braking:c.braking,ladder:!!c.ladder,fireTruck:c.fireTruck})),pedestrians:crowd.map(p=>({x:p.g.position.x,z:p.g.position.z,crossing:p.crossing,jaywalker:p.jaywalker,heading:p.g.rotation.y})),helicopters:helicopters.map(h=>({variant:h.root.userData.aircraftVariant,role:h.role,firefighting:h.firefighting,x:h.root.position.x,y:h.root.position.y,z:h.root.position.z,crashing:h.crashing,gasHit:h.gasHit,loiterTime:h.loiterTime,disorientTime:+(h.disorientTime||0).toFixed(2),electricContactTime:+(h.contactTime||0).toFixed(2),electricVisible:!!h.electric?.visible})),fires:schoolFire.length,burning:schoolFire.map(f=>({x:f.root.position.x,y:f.root.position.y,z:f.root.position.z,suppression:f.suppression}))}),
  advanceStructures:(dt=1)=>run('advanceStructures',()=>{for(let t=0;t<dt;t+=1/60)neighborhood.update(1/60);return snap()}),
  spawnHelicopter:(variant=null)=>run('spawnHelicopter',()=>{spawnHelicopter(variant);return snap()}),
  stageFirefighter:()=>run('stageFirefighter',()=>{ignite(0,3,3);spawnHelicopter(2);const h=helicopters[helicopters.length-1];h.root.position.set(0,16,3);return snap()}),
  start:(at=1)=>run('start',()=>{const field=document.getElementById('start-wave');if(!field)showSettings();document.getElementById('start-wave').value=Math.max(1,Math.min(15,at));reset();return snap()}),
  move:(x,y=10)=>run('move',()=>{dragon.position.set(THREE.MathUtils.clamp(x,-91,91),THREE.MathUtils.clamp(y,2,44),15);return snap()}),
  spawnMeteor:()=>run('spawnMeteor',()=>{spawnMeteor();return snap()}),
  cinematicStage:(mode)=>run('cinematicStage',()=>{remaining=0;between=-600;helicopterTimer=600;
   if(mode==='fire'){for(const x of [-22,0,27])ignite(x,5,.5);}
   if(mode==='gas'){dragon.position.set(0,13,15);facing=1;ignite(-2,12,15);spawnHelicopter(1);helicopters.at(-1).root.position.set(-3,13,15);gasCooldown=0;gasAttack();}
   if(mode==='loiter'){spawnHelicopter(0);helicopters.at(-1).root.position.set(0,26,0);spawnHelicopter(1);helicopters.at(-1).root.position.set(0,18,9);}
   if(mode==='background'){ignite(43,6,-39.75);for(let n=0;n<60&&!cars.some(c=>c.fireTruck);n++)spawnCar();const c=cars.find(c=>c.fireTruck);if(!c)throw Error('No engine');c.root.position.set(53,-.36,17);c.dir=1;c.laneZ=17;c.hostile=false;c.life=200;}
   if(mode==='meteors'){for(const [i,kind] of ['stone','iron','molten','flaming'].entries()){spawnMeteor();const m=meteors.at(-1);m.kind=kind;m.burning=kind==='molten'||kind==='flaming';m.mesh.material=kind==='molten'?moltenMaterial:rockMaterialVariants[i];m.mesh.position.set(-24+i*16,30,12);m.vel.set(0,0,0);}}
   return snap();}),
  stageSchoolMeteor:()=>run('stageSchoolMeteor',()=>{
   spawnMeteor();
   const meteor=meteors.at(-1);
   meteor.kind='iron';meteor.burning=false;meteor.size=3.4;
   meteor.target.set(0,11,.35);
   meteor.mesh.position.copy(meteor.target).add(new THREE.Vector3(0,2.8,0));
   meteor.vel.set(0,-22,0);
   return snap();
  }),
  impactProfileAt:(x,y,z,size,kind)=>run('impactProfileAt',()=>{damage(x,z,y,{size,kind});cinematicFX.burst(new THREE.Vector3(x,y,z),size);return snap()}),
  spawnBoss:()=>run('spawnBoss',()=>{spawnFinalBoss();return snap()}),
  stageBossForVisualQA:()=>run('stageBossForVisualQA',()=>{
   let boss=meteors.find(m=>m.boss);
   if(!boss){spawnFinalBoss();boss=meteors.find(m=>m.boss);}
   if(!boss)throw Error('Boss creation failed');
   // Only available with ?qa=1: stage a real boss entity in view for a
   // reproducible screenshot; not an assertion that it spawned there normally.
   boss.mesh.position.set(0,36,9);
   return {stagedForScreenshot:true,x:boss.mesh.position.x,y:boss.mesh.position.y,
    bossCount:meteors.filter(m=>m.boss).length};
  }),
  // Directly call the real game fragmentation routine. This isolates its mechanics,
  // but does not prove that an actual dragon projectile reached the target.
  fragmentOne:()=>run('fragmentOne',()=>{let m=meteors.find(m=>m.boss||m.largeSplitter||m.fragment);if(!m){spawnFragmentMeteor(0,25,10,2.4);m=meteors[meteors.length-1];}const before=meteors.length;fragmentMeteor(m);const ix=meteors.indexOf(m);if(ix>=0)remove(meteors,ix);return {before,after:meteors.length,fragments:meteors.filter(t=>t.fragment).length,entities:meteors.filter(t=>t.fragment).map(t=>({size:t.size,x:t.mesh.position.x,y:t.mesh.position.y,grace:t.fragmentGrace}))}}),
  hitSchool:(amount=25)=>run('hitSchool',()=>{hp=Math.max(0,hp-Math.max(0,amount));schoolDamage=(100-hp)/100;neighborhood.city.forceDamage(neighborhood.school,schoolDamage);syncStructuralDamage();updateHud();if(hp===0)gameOver();return snap()}),
  actualSchoolGeometry:()=>run('actualSchoolGeometry',()=>({loaded:actualSchoolOverlayReady,details:actualSchoolOverlayStats,bounds:actualSchoolOverlay?(()=>{const b=new THREE.Box3().setFromObject(actualSchoolOverlay),v=b.getSize(new THREE.Vector3());return {min:b.min.toArray(),max:b.max.toArray(),size:v.toArray()};})():null,showingOldShell:architecturalModel?.children.filter(o=>o.name==='physical-components'&&o.visible).length||0,sourceFacadeCalibration:actualSchoolOverlayStats?.calibration||null,independentSourceRowhouses:actualRowhouseStats,schoolGlassCards:schoolWindowLights.length,attachedGlazingMaterials:schoolGlazingMaterials.length,decorativeSchoolFacade:referenceFacades.snapshots().some(e=>e.building==='tech-freire-school')})),
  inspectThreeBuildingSource:()=>run('inspectThreeBuildingSource',()=>({central:actualSchoolOverlayStats,flanking:actualRowhouseStats,activeSourceGroups:{left:!!actualRowhouseOverlays.leftRowhouse?.visible,right:!!actualRowhouseOverlays.rightRowhouse?.visible},duplicateGenerated:{left:!!neighborhood.buildings.find(b=>b.name==='united-fund-cream')?.hideIntactGeometry,right:!!neighborhood.buildings.find(b=>b.name==='north-brownstone')?.hideIntactGeometry}})),
  focusActualSchool:()=>run('focusActualSchool',()=>{if(!active)reset();if(cinematicActive)closeChapterTransition();paused=false;setMode('real');performanceLab.set('schoolModel',true);dragon.position.set(0,12,15);return {description:'Original school meshes aligned with the production school footprint',overlayReady:actualSchoolOverlayReady,overlayStats:actualSchoolOverlayStats,snapshot:snap()};}),
  actualSchoolImpact:()=>run('actualSchoolImpact',()=>{if(!active)reset();if(cinematicActive)closeChapterTransition();paused=false;setMode('real');performanceLab.set('schoolModel',true);damage(0,.45,11,{size:2.9,kind:'flaming'});return {description:'Production school impact against the real-model-aligned school scene',overlayReady:actualSchoolOverlayReady,overlayStats:actualSchoolOverlayStats,snapshot:snap()};}),
  sceneMetrics:()=>run('sceneMetrics',snap),
  screenshotMark:(label)=>run('screenshotMark',()=>({label,time:elapsed,frame:sessionStats.frames})),
  impactAt:(x=0,z=.4,y=10)=>run('impactAt',()=>{damage(x,z,y);return snap()}),
  impactNeighborhood:(name='north-brick')=>run('impactNeighborhood',()=>{const b=neighborhood.targetBuildings.find(t=>t.name===name&&!t.background);if(!b)throw Error('Missing target '+name);damage(b.x,b.front,Math.min(b.h-2,7));return snap()}),
  igniteAt:(x=0,y=3,z=8)=>run('igniteAt',()=>{ignite(x,y,z);return snap()}),
  damageMaskPixels:()=>run('damageMaskPixels',()=>({front:schoolDamagePlanes.front.getContext('2d').getImageData(0,0,SCHOOL_MASK_SIZE,SCHOOL_MASK_SIZE).data.length,side:schoolDamagePlanes.side.getContext('2d').getImageData(0,0,SCHOOL_MASK_SIZE,SCHOOL_MASK_SIZE).data.length,schoolDamage})),
  errors:qaLog,
 };
 window.dispatchEvent(new Event('dragon-defense-qa-ready'));
 console.info('[Dragon Defense QA] bridge ready',GAME_VERSION,BUILD_ID);
}

// Independent Performance Lab: use while the game is active; no restart required.
(function initPerformanceLabUI(){
 const fpsLimit=document.getElementById('dd-fps-limit');if(fpsLimit){fpsLimit.value=String(maxRenderFPS);fpsLimit.addEventListener('change',()=>{maxRenderFPS=Number(fpsLimit.value);localStorage.setItem('ddFPSCap',String(maxRenderFPS));});}
 const open=document.getElementById('performance-lab-btn'),panel=document.getElementById('performance-lab-panel');
 if(!open||!panel)return;
 if(!DEVLAB_MODE){open.hidden=true;panel.hidden=true;}
 const checks=panel.querySelector('[data-lab-switches]');
 for(const sys of performanceLab.systems){
  const label=document.createElement('label');label.className='perf-lab-switch';
  const box=document.createElement('input');box.type='checkbox';box.checked=true;box.dataset.key=sys.key;
  box.addEventListener('change',()=>performanceLab.set(sys.key,box.checked));
  const detail=document.createElement('span');detail.textContent=sys.label;
  const hint=document.createElement('small');hint.textContent=sys.kind==='simulation'?'PAUSES GAME SYSTEM':'VISUAL ONLY';
  label.title=sys.hint;label.append(box,detail,hint);checks.append(label);
 }
 const status=panel.querySelector('[data-lab-status]');
 function refresh(){for(const el of checks.querySelectorAll('input'))el.checked=performanceLab.isEnabled(el.dataset.key);
  const captures=performanceLab.captures(),latest=captures.at(-1);const progress=performanceLab.progress();
  if(progress){status.textContent=`Sampling ${progress.label}: ${progress.elapsed.toFixed(1)} / ${progress.target}s … Keep playing.`;}
  else if(latest){const s=latest.summary;let msg=`${latest.label}: ${s.fps} FPS · p99 ${s.p99FrameMs}ms · ${s.meanDrawCalls} calls · ${s.stalls100ms} severe stalls`;
       const health=frameHealth.summary();if(health.totalLongFrames)msg+=` | observed long frames: ${health.totalLongFrames} (see exported frameHealth)`;
   if(captures.length>1){const old=captures.at(-2).summary;msg+=` | vs previous: ${(s.fps-old.fps)>=0?'+':''}${(s.fps-old.fps).toFixed(1)} FPS`;}
   status.textContent=msg;
  }else status.textContent='Take an 8s baseline, turn off one system, then take another 8s sample.';
 }
 performanceLab.subscribe(refresh);
 open.addEventListener('click',()=>{panel.hidden=!panel.hidden;open.setAttribute('aria-expanded',String(!panel.hidden));refresh();});
 panel.querySelector('[data-lab-close]').addEventListener('click',()=>{panel.hidden=true;open.setAttribute('aria-expanded','false');});
 panel.querySelector('[data-lab-reset]').addEventListener('click',()=>performanceLab.restore());
 panel.querySelector('[data-lab-sample]').addEventListener('click',()=>{
  if(!active||paused){status.textContent='Resume/start the game before collecting a sample.';return;}
  if(performanceLab.progress()){status.textContent='Sampling is already running.';return;}
  const name=performanceLab.captures().length?'A/B '+(performanceLab.captures().length+1):'Baseline';
  performanceLab.begin(name,8,{wave,graphics:visualPreset,meteors:meteors.length,cars:cars.length,build:BUILD_ID});refresh();
 });
 const videoButton=panel.querySelector('[data-lab-video]');
 panel.querySelector('[data-lab-shot]').addEventListener('click',()=>captureLab.requestScreenshot(`wave-${wave}`));
 videoButton?.addEventListener('click',()=>{
  if(captureLab.isRecording()){captureLab.stopRecording();videoButton.textContent='⏺ Record 25s WebM';return;}
  if(captureLab.startRecording()){
   videoButton.textContent='⏹ Stop recording';
   if(active&&!paused&&!performanceLab.progress()){
    performanceLab.begin('25s visual recording',25,{wave,graphics:visualPreset,build:BUILD_ID,capture:'webm'});
   }
  }
 });
 panel.querySelector('[data-lab-export]').addEventListener('click',()=>{
  const data={gameVersion:GAME_VERSION,build:BUILD_ID,session:telemetrySnapshot(),lab:performanceLab.export(),captureFiles:captureLab.history()};
  const a=document.createElement('a'),url=URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:'application/json'}));
  a.href=url;a.download='dragon-defense-performance-lab-'+Date.now()+'.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
 });
 window.__DD_PERF_UI={
  open:()=>{panel.hidden=false;open.setAttribute('aria-expanded','true');refresh();return {open:true};},
  close:()=>{panel.hidden=true;open.setAttribute('aria-expanded','false');return {open:false};},
  toggle:()=>{panel.hidden=!panel.hidden;open.setAttribute('aria-expanded',String(!panel.hidden));refresh();return {open:!panel.hidden};},
  sample:(label='Developer Lab sample',seconds=8)=>{if(!active||paused)throw Error('Start or resume the game first');if(performanceLab.progress())throw Error('Sampling already in progress');performanceLab.begin(label,seconds,{wave,graphics:visualPreset,meteors:meteors.length,cars:cars.length,build:BUILD_ID});refresh();return performanceLab.progress();},
  reset:()=>{performanceLab.restore();refresh();return performanceLab.states();},
  exportReport:()=>{panel.querySelector('[data-lab-export]').click();return {ok:true};},
  screenshot:(name=`wave-${wave}`)=>{captureLab.requestScreenshot(name);return {ok:true};},
  recordToggle:()=>{if(captureLab.isRecording()){captureLab.stopRecording();return {recording:false};}const ok=captureLab.startRecording();if(ok&&active&&!paused&&!performanceLab.progress())performanceLab.begin('25s visual recording',25,{wave,graphics:visualPreset,build:BUILD_ID,capture:'webm'});return {recording:Boolean(ok)};},
  systemCSV:()=>{const a=document.createElement('a');a.href='./__system_csv';a.download='system-performance.csv';document.body.append(a);a.click();a.remove();return {ok:true};},
  state:()=>({panelHidden:panel.hidden,recording:captureLab.isRecording(),captures:performanceLab.captures().length,progress:performanceLab.progress(),states:performanceLab.states()})
 };
 setInterval(()=>{if(!panel.hidden){if(performanceLab.progress())refresh();if(videoButton)videoButton.textContent=captureLab.isRecording()?'⏹ Stop recording':'⏺ Record 25s WebM';}},350);
 refresh();
})();


// v4.12: deterministic, low-impact frame sampling for local automated benchmark.
// Never enabled in normal gameplay; raw timings are exported in the local QA ZIP.
if(new URLSearchParams(location.search).get('benchmark')==='1'&&window.__DD_QA){
 let phase=null;
 const percentile=(arr,p)=>{if(!arr.length)return null;const a=[...arr].sort((x,y)=>x-y);return Math.round(a[Math.min(a.length-1,Math.floor((a.length-1)*p))]*100)/100;};
 const start=(label)=>{phase={label,startUTC:Date.now(),startPerf:performance.now(),samples:[],droppedSampleCount:0,lastFocused:document.hasFocus(),priorRenderMs:null,rendererBlocks:[],resourceAtStart:gpuResourceAudit?.snapshot()||null};return {label,startUTC:phase.startUTC};};
 const stop=()=>{if(!phase)return null;const v=phase;phase=null;
  const frames=v.samples,ms=frames.map(e=>e.frameMs),sim=frames.map(e=>e.simMs),render=frames.map(e=>e.renderMs);
  return {label:v.label,startUTC:v.startUTC,endUTC:Date.now(),durationSec:+((performance.now()-v.startPerf)/1000).toFixed(2),
   frames:frames.length,fps:+(frames.length/Math.max(.001,(performance.now()-v.startPerf)/1000)).toFixed(2),
   p50FrameMs:percentile(ms,.5),p95FrameMs:percentile(ms,.95),p99FrameMs:percentile(ms,.99),maxFrameMs:ms.length?Math.max(...ms):null,
   stalls50:ms.filter(x=>x>50).length,stalls100:ms.filter(x=>x>100).length,stalls500:ms.filter(x=>x>500).length,
   focusedStalls100:frames.filter(x=>x.frameMs>100&&x.focused&&x.previouslyFocused&&x.visibility==='visible').length,
   backgroundOrTransitionStalls100:frames.filter(x=>x.frameMs>100&&(!x.focused||!x.previouslyFocused||x.visibility!=='visible')).length,
   focusedStalls1000:frames.filter(x=>x.frameMs>1000&&x.focused&&x.previouslyFocused&&x.visibility==='visible').length,
   maxRendererSubmitMs:render.length?Math.max(...render):null,
   rendererBlocks100:render.filter(x=>x>100).length,
   precedingRendererLinkedStalls100:frames.filter(x=>x.frameMs>100&&x.precedingRenderMs>=100).length,
   precedingRendererLinkedStalls1000:frames.filter(x=>x.frameMs>1000&&x.precedingRenderMs>=900).length,
   resourceAudit:gpuResourceAudit?.snapshot()||null,resourceAuditAtStart:v.resourceAtStart,
   rendererBlockEvents:v.rendererBlocks,
   classificationCaveat:'Focus is sampled at the preceding and current render, not throughout the RAF gap. Render submission is CPU wall-clock, not GPU execution.',
   meanSimulationMs:sim.length?+(sim.reduce((a,b)=>a+b,0)/sim.length).toFixed(2):null,
   meanRenderMs:render.length?+(render.reduce((a,b)=>a+b,0)/render.length).toFixed(2):null,
   maxDrawCalls:frames.length?Math.max(...frames.map(x=>x.drawCalls)):null,droppedSamples:v.droppedSampleCount,
   samples:frames,scene:window.__DD_QA.snap(),testSettings:window.__DD_BENCHMARK.state()};};
 window.__DD_BENCHMARK={start,stop,
  frame:(dt,sim,render,drawCalls,triangles,renderStartUTC,renderEndUTC)=>{if(!phase)return;if(phase.samples.length>=50000){phase.droppedSampleCount++;return;}
   const focused=document.hasFocus(),frameMs=+(dt*1000).toFixed(2);
   // dt measures elapsed time since the PRECEDING animation frame. A long render()
   // on that preceding frame must be correlated with THIS frame gap, not this render call.
   const previous=phase.priorRenderMs;
   const linked=previous!==null&&previous>=100&&frameMs>=100;
   phase.samples.push({utc:renderEndUTC,renderStartUTC,renderEndUTC,frameMs,simMs:+sim.toFixed(2),renderMs:+render.toFixed(2),
    precedingRenderMs:previous===null?'':+previous.toFixed(2),precedingRendererLinked:linked,
    drawCalls,triangles,focused,previouslyFocused:phase.lastFocused,
    visibility:document.visibilityState,contextLost:diagnosticFrames.contextLost});
   if(render>=100&&phase.rendererBlocks.length<128)phase.rendererBlocks.push({renderStartUTC,renderEndUTC,renderMs:+render.toFixed(2),
     allocationEvents:gpuResourceAudit?.snapshot(renderStartUTC-500)?.recent||[]});
   phase.priorRenderMs=render;phase.lastFocused=focused;},
  probe:()=>({utc:Date.now(),visibility:document.visibilityState,focused:document.hasFocus(),
   rafTicks:diagnosticFrames.ticks,renderedFrames:diagnosticFrames.rendered,
   lastTickUTC:diagnosticFrames.lastTickUTC,lastRenderUTC:diagnosticFrames.lastRenderUTC,
   lastRenderAgeMs:diagnosticFrames.lastRenderUTC?Date.now()-diagnosticFrames.lastRenderUTC:null,
   contextLost:diagnosticFrames.contextLost,contextEvents:diagnosticFrames.contextEvents.slice(-12),
   gameActive:active,gamePaused:paused,phase:phase?.label||null,phaseSamples:phase?.samples.length||0,
   rendererCalls:renderer.info.render.calls,gameVersion:GAME_VERSION,rendererBlocks100:diagnosticFrames.rendererBlocks100,
   maxRendererBlockMs:diagnosticFrames.maxRendererBlockMs,lastRendererBlockUTC:diagnosticFrames.lastRendererBlockUTC,
   resourceAudit:gpuResourceAudit?.snapshot()||null}),
  reseed:(n=20261102)=>{window.__DD_BENCH_RESEED?.(n);return n},
  setCap:(n=0)=>{maxRenderFPS=Math.max(0,Math.min(240,Number(n)||0));previousRenderAt=-99999;return {fpsCap:maxRenderFPS,vsyncStillApplies:true}},
  state:()=>({fpsCap:maxRenderFPS,preset:visualPreset,pixelRatio:renderer.getPixelRatio(),shadowMap:renderer.shadowMap.enabled,enabled:performanceLab.states(),recording:Boolean(window.__DD_BENCHMARK._recorder)}),
  async videoStart(name){
   if(this._recorder)throw Error('Recording already active');
   const stream=renderer.domElement.captureStream(10);
   const mime=['video/webm;codecs=vp8','video/webm'].find(t=>window.MediaRecorder?.isTypeSupported(t));
   if(!mime){stream.getTracks().forEach(t=>t.stop());throw Error('WebM MediaRecorder unavailable');}
   const recorder=new MediaRecorder(stream,{mimeType:mime,videoBitsPerSecond:900000});let chunks=[];
   recorder.ondataavailable=e=>{if(e.data?.size)chunks.push(e.data);};
   this._recorder={recorder,stream,name,chunks};recorder.start(1000);return {name,mime};
  },
  async videoStop(){const current=this._recorder;if(!current)throw Error('No recording');
   return await new Promise(resolve=>{
    let done=false;const finish=(v)=>{if(done)return;done=true;current.stream.getTracks().forEach(t=>t.stop());this._recorder=null;resolve(v);};
    const timeout=setTimeout(()=>finish({ok:false,error:'Recorder stop timed out'}),12000);
    current.recorder.onstop=async()=>{clearTimeout(timeout);try{
     const blob=new Blob(current.chunks,{type:current.recorder.mimeType});
     if(blob.size<64){finish({ok:false,error:'No usable encoded frames; the graphics loop may be stalled',bytes:blob.size,name:current.name});return;}
     const res=await fetch('/__qa_upload?name='+encodeURIComponent(current.name),{method:'POST',headers:{'Content-Type':'video/webm'},body:blob});
     finish({ok:res.ok,status:res.status,bytes:blob.size,name:current.name});
    }catch(e){finish({ok:false,error:String(e),name:current.name});}};
    try{current.recorder.stop();}catch(e){clearTimeout(timeout);finish({ok:false,error:String(e)});}
   });
  }



 };
 // A separate periodic heartbeat bridges the game and Windows sampler even when
 // the Performance Lab panel is closed. While the browser freezes, heartbeat
 // delivery stops and the host CSV's telemetry-age column keeps increasing.
 let benchmarkHeartbeats=0;
 setInterval(()=>{
  const q=window.__DD_QA?.snap(),m=window.__DD_GAME_METRICS||{};
  if(!q)return;
  const body={wave:q.wave,fps:m.fps??null,drawCalls:q.scene?.drawCalls??null,
   frameMs:m.frameMs??null,recording:Boolean(window.__DD_BENCHMARK?._recorder),
   stallCount:frameHealth.summary().totalLongFrames,
   phase:phase?.label||'between-phases',active:q.active,
   gameFrameCount:q.frameTimes?.frames??0,lastGameFrameUTC:window.__DD_LAST_RENDER_UTC??null,
   heartbeatIndex:++benchmarkHeartbeats};
  fetch('./__game_telemetry',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body),cache:'no-store'})
   .catch(()=>{}); // host log remains independent if browser/server stops
 },1000);
}
