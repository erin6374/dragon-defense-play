import {createSoundEngine} from './audio/sound-engine.js';
import {renderPixelRatio} from './rendering/render-budget.js';
import {createChapterStaging} from './simulation/chapter-staging.js';
import {createFinalSquadron} from './simulation/final-squadron.js';
import {createMilitaryOccupation} from './simulation/military-occupation.js';
import {createCinematicEffects} from './rendering/cinematic-effects.js';
import {impactProfile,openingMoltenHeat,structuralImpactProfile,shockDamage,CAR_COLORS} from './simulation/impact-profiles.js';
import {updatePedestrianPose} from './simulation/pedestrian-motion.js';
import {DEFENSE_REAR_Z,projectDefensePoint} from './simulation/defense-zone.js';
import {chooseMeteorTarget} from './simulation/meteor-target.js';
import {fireballMeteorDamage,meteorSplitPlan,openingMeteorWave,getWave1SpawnConfig,MAX_PLAYABLE_METEORS} from './simulation/fireball-balance.js';
import {selectMeteorWarning} from './simulation/meteor-warning.js';
import {occupiesCrossStreet,CROSS_STREET_X,CROSS_STREETS,BROAD_LANES,BROAD_CENTER,isBroadRoad} from './simulation/road-corridors.js';
import {loadViewerGrid,containsParcel} from './simulation/viewer-parcels.js';
import {traceMeteorCollision} from './simulation/meteor-collision.js';
import {buildRoadVehicle,setRoadVehicleNight,buildHelicopter,buildPerson,animatePerson,captureVehicleResources,releaseVehicleResources} from './rendering/realistic-vehicles.js';
import {advanceSpeed,trafficTarget} from './simulation/traffic-dynamics.js';
import {forcedVehicleRole,planResponderRoute,hoseReach} from './simulation/responder-routing.js';
import {GAME_VERSION,BUILD_ID} from './core/build-info.js';
window.__DD_BUILD_INFO = { version: GAME_VERSION, build: BUILD_ID };
import {clampWave,waveBudget,hunterSteering} from './core/balance.js';
import {choosePassingLane, laneChangeYaw, laneChangeSpeedCap} from './simulation/lane-safety.js';
import * as THREE from 'three';
import {createStableLightPool,syncHelicopterSearchlight} from './rendering/stable-light-pool.js?v=rc169';
console.info('Tech Freire Dragon Defense '+GAME_VERSION);
console.log('%c Broad Street Subway Chasm & Progressive Gravity Collapse Loaded ', 'background: #223344; color: #ffcc44; font-size: 12px; padding: 2px 6px;');
import {createFixedStep} from './core/fixed-step.js';
import {ACTIONS,createInputState} from './input/actions.js';
import {hitVehicleWithWind,advanceVehicleWind,hitPedestrianWithWind,advancePedestrianWind} from './simulation/ground-wind.js';
import {createPauloRig} from './dragon/paulo-rig.js';
import {createPauloPoseDriver} from './dragon/paulo-pose-driver.js';
import {createProfiler} from './rendering/profiler.js';
import {InstancedParticlePool} from './rendering/instanced-particles.js';
import {AdaptiveQuality} from './rendering/adaptive-quality.js';
import {AdaptiveFramebuffer} from './rendering/frame-governor.js';
import {loadSchoolPlayMesh} from './rendering/school-play-mesh.js';
import {batchSchoolSource} from './rendering/school-source-batch.js';
import {createSchoolSourceDamage} from './rendering/school-source-damage.js';
import {snapshotSchoolMesh,captureSchoolComparison,captureSchoolViews} from './rendering/school-comparison.js';
import {FBXLoader} from 'three/addons/loaders/FBXLoader.js';
import {ArchitecturalVoxels} from './architectural-voxels.js';
import {createCinematicLighting} from './rendering/cinematic-lighting.js';
import {createPowerGrid} from './rendering/power-grid.js';
import {createBuildingElectricalShorts} from './rendering/building-electrical-shorts.js';
import {createOrbitalTheater} from './rendering/orbital-theater.js';
import {createCinematicSky,disasterSkyIntensity} from './rendering/cinematic-environment.js';
import {createPhiladelphiaSkyline} from './rendering/philadelphia-geometry-skyline.js';
import {skylineCameraRayX,skylineParallaxX} from './core/skyline-position.js';
import {batchVehicleVisuals} from './rendering/vehicle-batch.js';
import {createFrameHealth} from './core/frame-health.js';
import {installWebGLResourceAudit} from './core/webgl-resource-audit.js';
import {createDistantMeteorVisual} from './rendering/distant-meteors.js';
import {createForegroundMeteors} from './rendering/foreground-meteors.js';
import {createTrainingMissions} from './simulation/training-missions.js';
import {createEvacuationChapter} from './simulation/evacuation-chapter.js';
import {createPerformanceLab} from './core/performance-lab.js';
import {createCaptureLab} from './core/capture-lab.js';
import {batchStaticBim} from './rendering/static-bim-batch.js';
import {createCrowdRenderer} from './rendering/crowd-renderer.js';
import {batchStaticStreetProps} from './rendering/static-prop-batch.js';
import {installSchoolFlankingHouses} from './rendering/school-flanking-houses.js';
import {batchOpaqueRelief} from './rendering/viewer-building-fit.js';
import {createViewerCityModels} from './rendering/viewer-city-models.js';
import {BuildingAssetRegistry} from './rendering/building-registry.js';
import {createStreetWaterRunoff} from './rendering/street-water-runoff.js';
import {schoolFitDimensions} from './rendering/school-fit.js';
import {fitSchoolFromFacade,SCHOOL_SOURCE,SCHOOL_TARGET,classifyArchitecturalMesh,schoolSourceCategory} from './rendering/tech-freire-source-fit.js';
import {assessRowhouseSource} from './rendering/rowhouse-source-validation.js';
import {createDestructibleSchool} from './rendering/destructible-school.js';
import {createSchoolComponentIndex,sourceComponentMaterial} from './simulation/school-source-impact.js';
import {createHeavedAsphaltRim,createVolumetricImpactBowl,createPulsatingThermalFissures,createFeatheredRadialSootDecal} from './rendering/procedural-crater.js';

import {createVisualMaterials,enhanceDragon,enhanceCar,enhanceHelicopter,createCinematicWeather} from './rendering/cinematic-assets.js';
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
 renderer.setPixelRatio(renderPixelRatio(innerWidth,innerHeight,window.devicePixelRatio||1,visualPreset,adaptiveResolution));
 renderer.shadowMap.enabled=visualPreset==='cinematic'&&performanceLab.isEnabled('shadows');
 renderer.toneMappingExposure=visualPreset==='cinematic'?1.18:visualPreset==='balanced'?1.12:1.06;
}
// All on-screen build stamps use one canonical source; visible in browser captures.
const buildStamp=`v${GAME_VERSION} · ${BUILD_ID}`;
for(const id of ['game-build','hud-version','start-build']){
 const node=document.getElementById(id);if(node)node.textContent=buildStamp;
}
const visualBank=createVisualMaterials(THREE);
const scene=new THREE.Scene();
const chapterStaging=createChapterStaging(scene);scene.background=new THREE.Color(0xa9c8e0);scene.fog=new THREE.FogExp2(0xacc9dc,.00175);
const streetView={x:19,y:34,z:114,targetY:24,targetZ:-8,fov:52};
const skyScreenHeight=2*streetView.z*Math.tan(THREE.MathUtils.degToRad(streetView.fov*.5));
const flightCeiling=44+skyScreenHeight*3;
function skyCameraLift(altitude){
 const original=Math.max(0,Math.min(44,altitude)-25)*.62;
 return original+Math.max(0,altitude-44);
}
function meteorEntryHeight(z,size,minimum=330){
 // All meteors spawn from the orbital satellite and mega-meteor layer (Y = 325..365)
 // at the very top of the world map, plummeting through the stratosphere into view.
 const base=Math.max(minimum,325+Math.random()*35);
 return base+(size||1)*2.0;
}
const camera=new THREE.PerspectiveCamera(streetView.fov,1,1,1600),renderer=new THREE.WebGLRenderer({antialias:true,powerPreference:'high-performance',preserveDrawingBuffer:new URLSearchParams(location.search).get('qa')==='1'});
renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,1.25));window.pixelArtMode=false;renderer.shadowMap.enabled=!window.matchMedia('(pointer:coarse)').matches;renderer.shadowMap.type=THREE.PCFSoftShadowMap;renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.18;document.body.prepend(renderer.domElement);applyVisualPreset();const graphicsDropdown=document.getElementById('graphics');if(graphicsDropdown)graphicsDropdown.value=visualPreset;
scene.add(new THREE.HemisphereLight(0xe9f2ff,0x6d6871,1.06));const sun=new THREE.DirectionalLight(0xfff3da,2.20);sun.position.set(-22,36,24);sun.castShadow=true;sun.shadow.mapSize.set(1024,1024);sun.shadow.normalBias=.025;sun.shadow.bias=-.0002;Object.assign(sun.shadow.camera,{left:-140,right:140,top:75,bottom:-55,near:1,far:160});scene.add(sun);
const moonLight=new THREE.DirectionalLight(0xa5c6f5,0);moonLight.position.set(45,62,28);scene.add(moonLight);
const dragonFireLight=new THREE.PointLight(0xff8a24,0,48,1.8);dragonFireLight.name='dragon-fire-light';scene.add(dragonFireLight);
// Cyclic daylight palette: dawn -> afternoon -> dusk -> night -> dawn.
const skySteps=[0xadcde0,0xa5cce8,0x8dbde1,0xf2a278,0x985878,0x242244,0x14182e,0x222845,0xa86e88,0xadcde0];
// Low-draw-call atmospheric sky, with time-of-day gradient and wispy cloud detail.
const cinematicSky=createCinematicSky(THREE,scene);
const cinematicLighting=createCinematicLighting(renderer,scene,'cinematic');
const cinematicFX=createCinematicEffects(THREE,scene,camera,visualBank);
window.__DD_CINEMATIC_FX=cinematicFX;
const finalSquadron=createFinalSquadron(scene);
const powerGrid=createPowerGrid(THREE,scene);
const buildingElectricalShorts=createBuildingElectricalShorts(THREE,scene);
const ironMeteorMaterial=new THREE.MeshStandardMaterial({
 color:0x474c52,
 roughness:0.28,
 metalness:0.88,
 envMapIntensity:1.8
});
const foregroundMeteors=createForegroundMeteors(THREE,scene);
let wave1SpawnIndex=0;
let playTrainingMode=false,busterRamCollided=false;
function setCitySceneVisible(visible){
 if(typeof staticGroup!=='undefined'&&staticGroup)staticGroup.visible=visible;
 if(typeof actualSchoolOverlay!=='undefined'&&actualSchoolOverlay)actualSchoolOverlay.visible=visible;
 if(typeof actualRowhouseOverlays!=='undefined'){
  if(actualRowhouseOverlays.leftRowhouse)actualRowhouseOverlays.leftRowhouse.visible=visible;
  if(actualRowhouseOverlays.rightRowhouse)actualRowhouseOverlays.rightRowhouse.visible=visible;
 }
 if(typeof architecturalModel!=='undefined'&&architecturalModel)architecturalModel.visible=visible;
 if(typeof cars!=='undefined'){for(const c of cars){if(c.root)c.root.visible=visible;}}
 if(typeof craters!=='undefined'){for(const cr of craters){if(cr.mesh)cr.mesh.visible=visible;if(cr.inner)cr.inner.visible=visible;}}
 if(visible){
  if(typeof updateAtmosphere==='function')updateAtmosphere();
  if(typeof syncSchoolVisibility==='function')syncSchoolVisibility();
 }
}

function startChapterOneCombat(){
 trainingMissions?.reset();
 playTrainingMode=false;
 skipChapterIntroCinematic=true;
 paused=false;
 active=true;
 for(const arr of [meteors,shots,blasts,debris]){while(arr.length)remove(arr,arr.length-1);}
 wave1SpawnIndex=0;
 message('🚨 CHAPTER 1: THE INITIAL METEOR STORM — DEFEND TECH FREIRE SCHOOL!');
 sound('siren');
 sound('dragonRoar',{variant:'challenge'});
 remaining=openingMeteorWave(1)?.count??8;
 spawnMeteor(Math.random,openingMeteorWave(1));
 remaining--;
 spawnTimer=4.5;
 stormTimer=0;
 updateHud();
}

const targetReticleMat=new THREE.MeshBasicMaterial({color:0xffdf00,side:THREE.DoubleSide,transparent:true,opacity:0.85,depthWrite:false});
const targetReticleGeo=new THREE.RingGeometry(2.6,3.1,24);

const trainingMissions=createTrainingMissions({
 scene,
 THREE,
 message:(m)=>message(m),
 sound:(k,o)=>sound(k,o),
 flashAt:(x,y,z,s)=>flashAt(x,y,z,s),
 emitImpact:(x,y,z,c,s)=>emitImpact(x,y,z,c,s),
 cinematicFX,
 spawnTargetMeteor:(opts)=>{
  const size=opts.size||2.8;
  const mesh=createPlayableRock(size);
  mesh.material=fizzingFireMaterial;
  const reticle=new THREE.Mesh(targetReticleGeo,targetReticleMat);
  reticle.name='target-reticle';
  mesh.add(reticle);
  mesh.position.set(opts.x||0,opts.y||26,opts.z||15);
  scene.add(mesh);
  const m={kind:'stone',mesh,target:new THREE.Vector3(opts.x||0,0.5,opts.z||15),vel:new THREE.Vector3(opts.vx||0,opts.vy||0,0),trail:0,hp:1,size,damage:0,isBusterTarget:!!opts.isBusterTarget,isTrainingTarget:true};
  meteors.push(m);
  return m;
 },
 onComplete:()=>{
  startChapterOneCombat();
 },
 setCitySceneVisible:(visible)=>{
  setCitySceneVisible(visible);
 }
});
let secondaryEscortTimer=0;busterRamCollided=false;
const evacuationChapter=createEvacuationChapter({
 scene,
 message:(m)=>message(m),
 sound:(k,o)=>sound(k,o),
 ignite:(x,y,z)=>ignite(x,y,z),
 flashAt:(x,y,z,s)=>flashAt(x,y,z,s),
 emitImpact:(x,y,z,c,s)=>emitImpact(x,y,z,c,s),
 onChopperEscaped:(runNum,isSec)=>{
  score+=500;
  sessionStats.intercepts+=2;
  updateHud();
 },
 onChopperCrashed:(runNum,isSec)=>{
  score=Math.max(0,score-300);
  updateHud();
 },
 onComplete:()=>{
  schoolShieldUntil=0;
  shieldMesh.visible=false;
  between=1.0;
 },
 spawnEscortThreat:(targetX,targetY,targetZ)=>{
  if(!active||paused||meteors.length>=MAX_PLAYABLE_METEORS)return;
  const size=2.2+Math.random()*1.4;
  const mesh=createPlayableRock(size);
  mesh.material=moltenMaterial;
  const startX=targetX+(Math.random()-0.5)*6;
  const startY=Math.min(130,targetY+38+Math.random()*15);
  const startZ=targetZ;
  mesh.position.set(startX,startY,startZ);
  scene.add(mesh);
  const speed=11.5+Math.random()*3.5;
  const vel=new THREE.Vector3(targetX-startX,targetY-startY,targetZ-startZ).normalize().multiplyScalar(speed);
  meteors.push({kind:'molten',isPowerup:null,opening:false,burning:true,mesh,target:new THREE.Vector3(targetX,targetY,targetZ),vel,trail:0,hp:Math.max(2,Math.ceil(size*1.2)),size,damage:1.5,baseScale:mesh.scale.clone(),hitFlash:0});
 }
});
const satWarning=document.createElement('div');satWarning.id='sat-contact-warning';
satWarning.style.cssText='position:fixed;left:50%;top:24%;transform:translateX(-50%);z-index:30;display:none;pointer-events:none;background:#081c30dd;color:#a5f3fc;border:1px solid #38bdf8;border-radius:7px;padding:7px 14px;text-align:center;font:800 14px system-ui;box-shadow:0 0 22px #0284c766';
satWarning.innerHTML='⚡ SATELLITE DEFENSE GRID — ELECTRICAL CONTACT!<div style="margin-top:5px;background:#0d263b;height:6px;width:230px;border-radius:4px"><div id="sat-contact-fill" style="width:0;height:100%;background:#38bdf8"></div></div>';
document.body.appendChild(satWarning);
const satContactFill=satWarning.querySelector('#sat-contact-fill');
const orbitalTheater=createOrbitalTheater(scene,camera,visualBank,(x,y,z,p)=>flashAt(x,y,z,p),(k)=>sound(k),(m)=>message(m),(x,y,z,c,s)=>emitImpact(x,y,z,c,s),cinematicFX,(progress)=>{
 if(satWarning){satWarning.style.display='block';satContactFill.style.width=Math.min(100,progress*100)+'%';}
},()=>{
 if(satWarning)satWarning.style.display='none';
});
if(orbitalTheater?.group)orbitalTheater.group.visible=false;
const DAY_PHASE_WAVES=10;
function dayPhase(w){
 if(w>=11&&w<=15)return 0.55; // Chapter 3 starts at dramatic night
 return (((w-1)%DAY_PHASE_WAVES)+DAY_PHASE_WAVES)%DAY_PHASE_WAVES/DAY_PHASE_WAVES;
}
function dayDarkness(w){
 if(w>=11&&w<=15)return 0.88; // Full night darkness for Chapter 3 military occupation
 const p=dayPhase(w);
 return Math.max(0,Math.min(1,(p-.28)/.32,(.94-p)/.24));
}
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
function addStorefrontSpiderwebCrack(){
 if(windowDamage.some(m=>m.name==='spiderweb-fracture'))return;
 const cx=7.6,cy=2.3,cz=0.52,radius=1.35;
 const points=[];
 const spokes=14,rings=4;
 for(let s=0;s<spokes;s++){
  const angle=(s/spokes)*Math.PI*2+(Math.sin(s*5)*0.12);
  const r=radius*(0.75+Math.sin(s*7)*0.25);
  points.push(new THREE.Vector3(cx,cy,cz));
  points.push(new THREE.Vector3(cx+Math.cos(angle)*r,cy+Math.sin(angle)*r,cz));
 }
 for(let ring=1;ring<=rings;ring++){
  const r=(ring/rings)*radius;
  for(let s=0;s<spokes;s++){
   const a1=(s/spokes)*Math.PI*2+(Math.sin(s*5)*0.12);
   const a2=((s+1)/spokes)*Math.PI*2+(Math.sin((s+1)*5)*0.12);
   points.push(new THREE.Vector3(cx+Math.cos(a1)*r,cy+Math.sin(a1)*r,cz));
   points.push(new THREE.Vector3(cx+Math.cos(a2)*r,cy+Math.sin(a2)*r,cz));
  }
 }
 const geo=new THREE.BufferGeometry().setFromPoints(points);
 const crack=new THREE.LineSegments(geo,crackedGlassMaterial);
 crack.name='spiderweb-fracture';
 scene.add(crack);
 windowDamage.push(crack);
}
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
 const darkness=displayedDarkness;cinematicLighting.update(dt,darkness);schoolReconstruction?.setNight(darkness);northBroadModels?.setNight?.(darkness);skylineBackdrop.setDamage(Math.max(skylineDamage,schoolDamage>=.999?1:schoolDamage*.6));skylineBackdrop.setTime(displayedPhase,darkness);skylineAirUniforms.day.value=1-darkness;skylineAirUniforms.opacity.value=.08+darkness*.05;scene.background.lerp(skyTarget,Math.min(1,dt*.9));scene.fog.color.copy(scene.background);scene.fog.density=.00105+darkness*.00020;cinematicSky.setPhase(displayedPhase,darkness,dt,disasterSkyIntensity(wave,skylineDamage),dragon.position.y);neighborhood.setAtmosphere(displayedPhase,darkness);
 // Distant building haze is now handled by the skyline materials and fog;
 // do not allocate an unused color blend in this per-frame path.
 // Architectural texture preserves facade detail while distance haze stays subtle.
 // Skyline geometry and window emissive intensity are updated by skylineBackdrop.setTime().
 // Legacy geometric clouds remain detached from drawing; do not traverse/update
 // their meshes every tick when the shader sky provides all cloud visuals.
 sunDisc.visible=false;moonDisc.visible=false;starGroup.visible=false;clouds.visible=false; // Atmospheric sky shader renders textured moon and sun disc.
 const brownout=powerGrid?powerGrid.getBrownoutFactor():1;
 for(const lamp of lamps)lamp.intensity=darkness*(lamp.color.getHex()===0xb4c7ff?1.35:3.0)*brownout;
 for(const glow of streetGlows)glow.material.opacity=darkness*.58*brownout;
 for(const car of cars)setRoadVehicleNight(car.root,darkness*brownout,!car.burning&&!car.destroyed);
 for(const w of nightWindows){const lightAllowed=(!w.surface||w.surface.alive)&&w.enabled&&!w.broken;const opacity=lightAllowed?Math.max(0,(darkness-.3)*.62)*brownout:0;w.mesh.material.opacity=opacity;w.mesh.visible=opacity>.001;}
 for(const mat of schoolGlazingMaterials)mat.emissiveIntensity=Math.max(0,(darkness-.18))*mat.userData.nightEmission*brownout;

 northBroadModels?.update?.(dt, darkness, brownout);
 streetWaterRunoff?.update?.(dt, craters.some(c=>c.geyserGroup));

 const titanX=orbitalTheater?.titanMesh?.position?.x??999;
 const titanDistToSun=Math.abs(titanX-(-22));
 const eclipseDim=Math.max(0,1.0-Math.min(1.0,Math.max(0,(titanDistToSun-18)/110)))*0.22;
 sun.intensity=Math.max(.20,(2.35-darkness*2.1)*(1.0-eclipseDim));moonLight.intensity=darkness*1.65;const sunset=Math.exp(-Math.pow((displayedPhase-.34)*9,2))+Math.exp(-Math.pow((displayedPhase-.84)*9,2));sun.color.setHex(0xfff1db).lerp(sunsetSunColor,Math.min(1,sunset)).lerp(nightSunColor,darkness);
 if(ambience){ambience.intensity=1.32-darkness*.42;ambience.color.setHex(0xfff8ee).lerp(nightAmbientColor,darkness)}
 lightningCooldown-=dt;
 if(darkness>.55&&lightningCooldown<=0){lightningCooldown=2+Math.random()*6;const b=neighborhood.targetBuildings[Math.floor(Math.random()*neighborhood.targetBuildings.length)];if(b){flashAt(b.x,Math.min(b.h,7+Math.random()*5),b.front,1.1);emitImpact(b.x,Math.min(b.h,8),b.front,18,.22)}}
}
const material=(c,emissive=0,roughness=0.92,metalness=0)=>new THREE.MeshStandardMaterial({color:c,emissive,roughness,metalness,envMapIntensity:0.0});const mats={wood:material(0x5a3d28,0,0.75,0.05),furniture:material(0x2d4868,0,0.65,0.1),metal:material(0x4a5460,0,0.45,0.75),concrete:material(0x8a8a86,0,0.95,0),brick:material(0xa96653),brick2:material(0xbd8065),mortar:material(0x705a58),stone:material(0xb6a99b),stone2:material(0x918f89),glass:new THREE.MeshPhysicalMaterial({color:0x5e8ca0,roughness:0.06,metalness:0.32,clearcoat:1.0,clearcoatRoughness:0.06,envMapIntensity:3.2,transparent:true,opacity:0.82,depthWrite:false,side:THREE.DoubleSide}),glassLit:new THREE.MeshStandardMaterial({color:0xe5b67d,emissive:0x5b3110,roughness:0.18,metalness:0.15}),frame:material(0x283b4b,0,0.52,0.45),roof:new THREE.MeshStandardMaterial({color:0x2e343c,roughness:0.98,metalness:0,envMapIntensity:0.0}),gold:material(0xe6a93d,0,0.35,0.6),road:material(0x2b3344,0,0.90,0),sidewalk:material(0x92918e,0,0.92,0),grass:material(0x395e4d,0,0.95,0),tree:material(0x327b5b,0,0.95,0),trunk:material(0x72523e,0,0.92,0),purple:material(0x683ba5,0,0.45,0.2),purpleLight:material(0x9860cb,0,0.45,0.2),purpleDark:material(0x43266d,0,0.45,0.2),wing:material(0xe6a63c,0,0.45,0.1),fire:new THREE.MeshBasicMaterial({color:0xfff0aa,transparent:true,opacity:0.98,blending:THREE.AdditiveBlending,depthWrite:false}),blueFire:new THREE.MeshBasicMaterial({color:0x99e8ff,transparent:true,opacity:0.98,blending:THREE.AdditiveBlending,depthWrite:false}),greenFire:new THREE.MeshBasicMaterial({color:0xaaffbb,transparent:true,opacity:0.98,blending:THREE.AdditiveBlending,depthWrite:false}),steamyFire:new THREE.MeshBasicMaterial({color:0xd5eaff,transparent:true,opacity:0.8}),meteor:material(0x6e605c,0,0.94,0.035)};
const cube=new THREE.BoxGeometry(1,1,1),ico=new THREE.IcosahedronGeometry(1,1);const staticGroup=new THREE.Group();scene.add(staticGroup);
function block(parent,x,y,z,w,h,d,m,cast=false){const mesh=new THREE.Mesh(cube,m);mesh.position.set(x,y,z);mesh.scale.set(w,h,d);mesh.castShadow=cast;mesh.receiveShadow=true;parent.add(mesh);return mesh}
function seeded(seed){let s=seed>>>0;return()=>((s=(Math.imul(1664525,s)+1013904223)>>>0)/4294967296)}const rand=seeded(44122);
// Site context: approximate arcade-scale reconstruction of the east side of the
// 2200 block of N Broad Street. X is north (+), Z is west/front (+).
// Street alignment and nearby building dimensions are not survey-verified.
import {buildNeighborhood} from './neighborhood.js';
const viewerGrid=await loadViewerGrid();
const neighborhood=buildNeighborhood({scene,staticGroup,block,material,visualBank,grid:viewerGrid});
// The school is drawn by the FBX ONLY when available. No second window/card facade.
const northBroadModels=createViewerCityModels(scene,neighborhood.city);
const referenceFacades={referenceBuildings:northBroadModels.entries.length,drawObjects:0,snapshots:()=>[]};
window.__DD_NORTH_BROAD=northBroadModels;
const buildingRegistry=new BuildingAssetRegistry(scene,northBroadModels,neighborhood.city);
window.__DD_BUILDING_REGISTRY=buildingRegistry;
function damageOrCollapseNorthBroad(bldg, damage, collapse = false) {
  if (!northBroadModels || !bldg) return;
  const idOrName = bldg.id || bldg.name;
  if (!idOrName) return;
  if (collapse || damage >= 1.0) {
    northBroadModels.collapseBuilding(idOrName);
  } else {
    northBroadModels.damageBuilding(idOrName, damage);
  }
}
const streetWaterRunoff=createStreetWaterRunoff(scene);
window.__DD_STREET_RUNOFF=streetWaterRunoff;
installNeighborhoodWindows();
// Architecture passes remain separate from simulation and collisions.
const cityExtensions={propsEstimate:0};
const upgradedStreet={windTrees:[]};
const streetBatchStats={mappedBuildings:northBroadModels.entries.length};
const updateWindPlanting=neighborhood.updateWindPlanting;
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
  const x=64+Math.sin(n*2.17)*(smoke?12:9),y=148-n*10.5,rad=(smoke?22:18)*(1-n*.038);
  const grad=g.createRadialGradient(x,y,1,x,y,rad);
  if(smoke){grad.addColorStop(0,'rgba(87,90,95,.30)');grad.addColorStop(.55,'rgba(57,60,65,.22)');grad.addColorStop(1,'rgba(50,54,59,0)');}
  else{grad.addColorStop(0,n<4?'rgba(255,245,158,.91)':'rgba(255,148,38,.75)');grad.addColorStop(.50,'rgba(248,76,22,.47)');grad.addColorStop(1,'rgba(133,24,9,0)');}
  g.fillStyle=grad;g.beginPath();g.ellipse(x,y,rad*.75,rad*1.15,0,0,Math.PI*2);g.fill();
 }
 return new THREE.CanvasTexture(c);
}
const fireSpriteTexture=visualBank.images.flame,smokeSpriteTexture=visualBank.images.smoke;
const flameMats=[0xffffff,0xfff6e8,0xffe2be].map(color=>new THREE.SpriteMaterial({map:fireSpriteTexture,color,transparent:true,opacity:.91,depthWrite:false,blending:THREE.NormalBlending}));
const smokeSpriteMat=new THREE.SpriteMaterial({map:smokeSpriteTexture,color:0x626369,transparent:true,opacity:.33,depthWrite:false});
function ignite(x,y,z){
 if(schoolFire.length>=64)return;
 const point=new THREE.Vector3(x,y,z);
 for(const f of schoolFire){if(f.root.position.distanceToSquared(point)<2.25)return;}
 const root=new THREE.Group();root.position.set(x,y,z);fireGroup.add(root);
 const initialSize=.35+Math.random()*.25;
 schoolFire.push({root,tongues:[],age:0,suppression:0,initialSize,size:initialSize,spreadTimer:0,burnTimer:0});
}
let lastConflagrationAlert=-999.0;
function updateFires(dt){
 for(let i=0;i<schoolFire.length;i++){
  const f1=schoolFire[i];
  for(let j=schoolFire.length-1;j>i;j--){
   const f2=schoolFire[j];
   if(f1.root.position.distanceToSquared(f2.root.position)<18.0){
    f1.size=Math.min(5.5,f1.size+f2.size*0.45);
    f1.initialSize=Math.min(4.8,f1.initialSize+f2.initialSize*0.35);
    f1.suppression=Math.max(0,(f1.suppression+f2.suppression)*0.5-0.08);
    fireGroup.remove(f2.root);
    schoolFire.splice(j,1);
   }
  }
 }

 let unsuppressedSchoolFiresCount=0;
 for(let i=schoolFire.length-1;i>=0;i--){
  const f=schoolFire[i];f.age+=dt;
  f.size=Math.min(5.2,f.initialSize+f.age*.12);
  f.anchorClock=(f.anchorClock||0)-dt;
  if(f.anchorClock<=0){f.anchorClock=.3;f.anchorY=neighborhood.city.fireAnchorHeight(f.root.position)}

  // Multi-fire convective thermal updraft & firestorm convection wind
  const clusterFires=schoolFire.filter(other=>other!==f&&other.root.position.distanceTo(f.root.position)<28);
  if(clusterFires.length>=2){
   if(Math.hypot(dragon.position.x-f.root.position.x,dragon.position.z-f.root.position.z)<16&&dragon.position.y>f.root.position.y+2&&dragon.position.y<f.root.position.y+48){
    dragonVelY=Math.min(24.0,dragonVelY+dt*16.0*(1+clusterFires.length*0.35));
   }
   if(Math.random()<dt*1.2*clusterFires.length){
    cinematicFX.sparks(f.root.position.clone().add(new THREE.Vector3(0,f.size*1.2,0)),Math.round(4+clusterFires.length*2),0.9);
   }
  }
  f.root.position.y=THREE.MathUtils.lerp(f.root.position.y,f.anchorY??f.root.position.y,Math.min(1,dt*2));

  // Identify building beneath or around fire
  const bldg=neighborhood.activeAt(f.root.position.x,f.root.position.z);
  const onSchoolStructure=Math.abs(f.root.position.x)<=13.5&&f.root.position.z>=-58.4&&f.root.position.z<=0.4&&f.root.position.y>=1.2;

  // Electrical short sparking on damaged building framework
  if(bldg&&bldg.damage>0.10&&Math.random()<dt*2.2){
   const spX=bldg.x+(Math.random()-.5)*bldg.w*0.85;
   const spY=Math.min(bldg.h*0.88,1.5+Math.random()*(bldg.h-2.0));
   const spZ=bldg.z+(Math.random()-.5)*bldg.d*0.8;
   cinematicFX.sparks(new THREE.Vector3(spX,spY,spZ),Math.round(6+Math.random()*8),1.2);
   if(Math.random()<0.45)sound('electric',{x:spX});
  }
  if(onSchoolStructure&&schoolDamage>0.10&&Math.random()<dt*2.5){
   const spX=(Math.random()-.5)*24;
   const spY=2.0+Math.random()*12.0;
   const spZ=-45+Math.random()*42;
   cinematicFX.sparks(new THREE.Vector3(spX,spY,spZ),Math.round(8+Math.random()*10),1.3);
   if(Math.random()<0.50)sound('electric',{x:spX});
  }

  // Realistic intra-building & neighborhood fire spread
  // Firestorm acceleration: clustered fires spread faster via thermal updraft radiation
  const spreadRateMultiplier=1.0+Math.min(4,clusterFires.length)*.12;
  f.spreadTimer=(f.spreadTimer||0)+dt*spreadRateMultiplier;
  const spreadInterval=f.suppression<.15?3:5;
  if(f.spreadTimer>spreadInterval&&schoolFire.length<64&&f.suppression<.45){
   f.spreadTimer=0;
   if(bldg){
    const bFires=schoolFire.filter(sf=>Math.abs(sf.root.position.x-bldg.x)<bldg.w*.5+1.5&&Math.abs(sf.root.position.z-bldg.z)<bldg.d*.5+1.5).length;
    if(bFires<6){
     // Spread vertically to higher floors or horizontally to adjacent rooms
     const climbY=Math.min(bldg.h-0.8,f.root.position.y+2.6+Math.random()*1.4);
     const spreadX=bldg.x+(Math.random()-.5)*bldg.w*.8;
     const spreadZ=bldg.z+(Math.random()-.5)*bldg.d*.8;
     ignite(spreadX,climbY,spreadZ);
    }else if(f.age>=15&&bldg.fireDamage>.18){
     // Spread to adjacent building if current building is heavily ablaze
     const nearB=neighborhood.targetBuildings.find(b=>b!==bldg&&!b.school&&(b.damage||0)<.95&&Math.abs(b.x-f.root.position.x)<28&&Math.abs(b.z-f.root.position.z)<26&&!schoolFire.some(sf=>Math.abs(sf.root.position.x-b.x)<3.5));
     if(nearB)ignite(nearB.x+(Math.random()-.5)*nearB.w*.5,Math.max(2,nearB.h*.82),nearB.front-1.2);
     // Rowhouse party-wall thermal conduction across shared brick walls
     const partyWallNeighbor=neighborhood.targetBuildings.find(b=>b!==bldg&&!b.school&&(b.damage||0)<0.95&&Math.abs(b.x-bldg.x)<14.5&&Math.abs(b.z-bldg.z)<12.0);
     if(partyWallNeighbor&&Math.random()<0.75){
      ignite(partyWallNeighbor.x+(Math.random()-0.5)*partyWallNeighbor.w*0.5,Math.max(2,f.root.position.y),partyWallNeighbor.front-1.0);
     }
    }
    // High-altitude firestorm convective thermal updraft blows embers across North Broad Street
    if(f.age>=15&&clusterFires.length>=3&&f.root.position.y>4.5&&Math.random()<dt*.37){
     const acrossX=f.root.position.x<0?(18+Math.random()*16):(-18-Math.random()*16);
     const acrossZ=f.root.position.z+(Math.random()-0.5)*14;
     const acrossBldg=neighborhood.targetBuildings.find(b=>!b.school&&(b.damage||0)<0.95&&Math.abs(b.x-acrossX)<b.w*0.6&&Math.abs(b.z-acrossZ)<b.d*0.6);
     if(acrossBldg){
      ignite(acrossBldg.x+(Math.random()-0.5)*acrossBldg.w*0.5,Math.min(acrossBldg.h*0.85,6.0),acrossBldg.front-1.0);
      cinematicFX.sparks(f.root.position.clone().add(new THREE.Vector3(0,1.5,0)),12,1.8);
     }
    }
   }else if(onSchoolStructure){
    const sFires=schoolFire.filter(sf=>Math.abs(sf.root.position.x)<=14&&sf.root.position.z>=-58.4&&sf.root.position.z<=0.4).length;
    if(sFires<10){
     const climbY=Math.min(15.0,f.root.position.y+2.8+Math.random()*1.5);
     const spreadX=(Math.random()-.5)*22;
     const spreadZ=-48+Math.random()*42;
     ignite(spreadX,climbY,spreadZ);
    }
   }else if(f.age>=15){
    // Spread along street / ground
    const nearB=neighborhood.targetBuildings.find(b=>!b.school&&(b.damage||0)<.95&&Math.abs(b.x-f.root.position.x)<25&&Math.abs(b.z-f.root.position.z)<22&&!schoolFire.some(sf=>Math.abs(sf.root.position.x-b.x)<3.5));
    if(nearB)ignite(nearB.x+(Math.random()-.5)*nearB.w*.5,Math.max(2,nearB.h*.82),nearB.front-1.2);
   }
  }

  // Sustained untended burning gradually consumes structural framework
  f.burnTimer=(f.burnTimer||0)+dt;
  if(f.burnTimer>=0.70){
   f.burnTimer=0;
   const unsuppressed=Math.max(0,1-f.suppression);
   if(bldg&&elapsed>=(bldg.nextFireDamageAt||0)){
    bldg.nextFireDamageAt=elapsed+.7;
    const bFires=schoolFire.filter(sf=>containsParcel(bldg,sf.root.position.x,sf.root.position.z)).length;
    const burnRate=(.012+Math.min(bFires,6)*.007)*unsuppressed;
    bldg.fireDamage=(bldg.fireDamage||0)+burnRate;
    bldg.damage=Math.max(bldg.damage||0,bldg.fireDamage);
    // Periodically weaken and detach localized structural parts
    if(Math.random()<0.38){
     northBroadModels.impactBuilding(bldg.id,f.root.position,2.8,0.24);
     debrisPiece(f.root.position.clone().add(new THREE.Vector3((Math.random()-.5)*1.6,-0.5,(Math.random()-.5)*1.6)),Math.random()<0.3?'glass':'brick',f.root.position);
    }
    // RC167: Radiative heat transfer between adjacent burning buildings within 12m radius
    if(bldg&&(bldg.fireDamage>0.25||bldg.damage>0.35)){
     const radiantRadius=12.0;
     for(const otherB of neighborhood.targetBuildings){
      if(otherB===bldg||otherB.school||(otherB.damage||0)>=0.95)continue;
      const dx=otherB.x-bldg.x, dz=otherB.z-bldg.z;
      const distSq=dx*dx+dz*dz;
      if(distSq<radiantRadius*radiantRadius){
       const dist=Math.max(2.0,Math.sqrt(distSq));
       const radiantFlux=(1.0-dist/radiantRadius)*(bldg.fireDamage||0.35)*dt*0.09;
       otherB.radiantHeat=(otherB.radiantHeat||0)+radiantFlux;
       if(otherB.radiantHeat>=0.28&&schoolFire.length<64){
        otherB.radiantHeat=0;
        const roofY=Math.max(2.0,otherB.h*0.85);
        const corniceX=otherB.x+(Math.random()-0.5)*otherB.w*0.6;
        const corniceZ=otherB.front-0.8;
        ignite(corniceX,roofY,corniceZ);
        cinematicFX.sparks(new THREE.Vector3(corniceX,roofY,corniceZ),8,1.2);
       }
      }
     }
    }

    // Catastrophic collapse from untended fire & neighborhood fire cascade
    if(!bldg.fireCollapsed&&(bldg.fireDamage>=0.70||bldg.damage>=0.96)){
     bldg.fireCollapsed=true;
     damageOrCollapseNorthBroad(bldg, 1.0, true);
     cinematicFX.demolitionDustWave(
      new THREE.Vector3(bldg.x-bldg.w*.45,.3,bldg.front),
      new THREE.Vector3(bldg.x+bldg.w*.45,.3,bldg.front),
      2.4,
      {brick:true}
     );
     sound('collapse',{x:bldg.x});
     message(`🔥 UNTENDED FIRE CONSUMED ${bldg.name||'BUILDING'}! FULL COLLAPSE`);
     const activeBurningCount=neighborhood.targetBuildings.filter(b=>schoolFire.some(sf=>Math.abs(sf.root.position.x-b.x)<b.w*0.6&&Math.abs(sf.root.position.z-b.z)<b.d*0.6)).length;
     if(activeBurningCount>=3&&(elapsed-(lastConflagrationAlert||0))>28.0){
      lastConflagrationAlert=elapsed;
      sound('radioDispatch');
      message('🚨 4TH ALARM CONFLAGRATION: Fires spreading across North Broad Street blocks!');
     }
     shake=Math.max(shake,0.60);
     // Cascading neighborhood conflagration: collapse throws fiery embers to surrounding buildings
     for(const nb of neighborhood.targetBuildings){
      if(nb!==bldg&&!nb.school&&(nb.damage||0)<0.90&&Math.abs(nb.x-bldg.x)<32&&Math.abs(nb.z-bldg.z)<28){
       ignite(nb.x+(Math.random()-.5)*nb.w*.6,Math.max(2,nb.h*.75),nb.front-1.2);
      }
     }
     for(const sf of schoolFire){
      if(Math.abs(sf.root.position.x-bldg.x)<bldg.w*.6&&Math.abs(sf.root.position.z-bldg.z)<bldg.d*.6){
       sf.anchorY=0.4;
      }
     }
    }
   }else if(onSchoolStructure){
    if(f.suppression<0.25){
     unsuppressedSchoolFiresCount++;
     f.unattendedBurnTime=(f.unattendedBurnTime||0)+dt;
     if(f.unattendedBurnTime>16.0&&!f.causedPancake){
      f.causedPancake=true;
      const punchY=Math.max(2.2,f.root.position.y-1.4);
      schoolReconstruction?.punchBorehole?.({
       x:f.root.position.x,
       y:punchY,
       z:f.root.position.z,
       radius:2.6,
       isHeavyIron:false,
       isMassive:false
      });
      cinematicFX.demolitionDustWave(
       f.root.position,
       f.root.position.clone().add(new THREE.Vector3(0,0,3.2)),
       1.8
      );
      sound('buildingCollapse',{volume:0.42,pitch:1.18});
      message('🔥 UNTENDED FIRE BURNED THROUGH FLOOR — CEILING PANCAKE COLLAPSE!');
     }
    }else{
     f.unattendedBurnTime=Math.max(0,(f.unattendedBurnTime||0)-dt*2.5);
    }
   }
  }

  // Dragon firefighting: wind gust or close swoop puts out fires for bonus points!
  const dDist=dragon.position.distanceTo(f.root.position);
  const isSwooping=(Math.hypot(dragonVelX,dragonVelY)>4.5)||diveEnergy>0.1||Math.abs(flightRoll)>0.18;
  if(dragonEnabled&&dDist<22){
   const wingProximity=Math.max(0,1-dDist/22);
   const wingPower=(isSwooping?1.75:1.0)*wingProximity;
   f.suppression+=dt*0.85*wingPower;
   f.spreadTimer=Math.max(0,(f.spreadTimer||0)-dt*2.2*wingPower);
   f.dragonExtinguished=true;
  }
  if(windActive){
   const rx=f.root.position.x-gustOrigin.x,ry=f.root.position.y-gustOrigin.y,rz=f.root.position.z-gustOrigin.z;
   const along=rx*gustDirection.x+ry*gustDirection.y+rz*gustDirection.z;
   const across=Math.sqrt(Math.max(0,rx*rx+ry*ry+rz*rz-along*along));
   if(along>0&&along<58&&across<12+along*.42){
    f.suppression+=dt*2.8;
    f.spreadTimer=0;
    f.dragonExtinguished=true;
   }
  }

  if(f.suppression>=1){
   if(f.dragonExtinguished){score+=250;blockCharge=Math.min(100,blockCharge+8);updateBlockButton();sound('bonus');message('FIRE EXTINGUISHED! +250 (COMMUNITY +8%)');}
   fireGroup.remove(f.root);schoolFire.splice(i,1);continue;
  }
  const fireSoot=bldg?Math.min(1.0,(bldg.fireDamage||0)*1.6+(bldg.damage||0)*0.5):(onSchoolStructure?Math.min(1.0,schoolDamage*1.5):(f.age>6.0?0.65:0.20));
  cinematicFX.fire(f.root.position,f.age,f.size,f.suppression,'structure',fireSoot);
 }
 if(unsuppressedSchoolFiresCount>0){
  const burnRate=Math.min(0.0075,unsuppressedSchoolFiresCount*0.0012)*dt;
  schoolDamage=Math.min(1,schoolDamage+burnRate);
  hp=schoolDamage>=1?0:Math.max(1,Math.round((1-schoolDamage)*100));
  syncStructuralDamage();
  updateHud();
  if(hp===0)gameOver();
 }
}
function clearFires(){for(const f of schoolFire)fireGroup.remove(f.root);schoolFire=[]}
// Five-story school collapse: staged per-floor masonry and slab rubble using one GPU batch.
const schoolFragments=new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1,0),new THREE.MeshStandardMaterial({color:0x8c7770,roughness:1,flatShading:true}),240);
schoolFragments.count=0;schoolFragments.frustumCulled=false;scene.add(schoolFragments);
const schoolChunkMatrix=new THREE.Matrix4(),schoolChunkPos=new THREE.Vector3(),schoolChunkScale=new THREE.Vector3(),schoolChunkQuaternion=new THREE.Quaternion();
let previousSchoolFragmentStages=-1;
function updateSchoolFragments(){
 const stages=Math.min(6,Math.floor(schoolDamage*5.99));
 if(stages===previousSchoolFragmentStages&&schoolFragments.count===stages*35)return;
 previousSchoolFragmentStages=stages;
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
 const useSource=Boolean(actualSchoolOverlayReady);
 if(actualSchoolOverlay)actualSchoolOverlay.visible=visible&&useSource;
 if(architecturalModel)architecturalModel.visible=false;
 schoolReconstruction?.setOverlayMode(useSource);
 schoolReconstruction?.setVisible(visible);
 schoolSignGroup.visible=visible&&schoolDamage<.75;
}
function syncStructuralDamage(){
 neighborhood.city.forceDamage(neighborhood.school,schoolDamage);
 sourceDamage.setDestruction(schoolDamage);
 schoolReconstruction?.syncDestruction?.(schoolDamage);
 updateSchoolFragments();
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
// One health budget per meteor, independent of the visual crater energy.
function schoolMeteorBudget(size=1.8){
 const n=Number.isFinite(size)?size:1.8;
 if(n<1.35)return 0;
 return .05+.10*Math.min(1,Math.max(0,(n-2.0)/1.6));
}
function penetrationDamageStep(budget,remaining,startY,stopY,previousY,currentY){
 const distance=Math.max(0,startY-stopY);
 const descent=Math.max(0,Math.min(previousY,startY)-Math.max(currentY,stopY));
 return Math.min(Math.max(0,remaining),distance>0?budget*descent/distance:0);
}
let schoolComponentIndex=null;
function emitSourceSchoolDebris(point,radius){
 if(!schoolComponentIndex)return;
 for(const component of schoolComponentIndex.query(point,radius,3)){
  const pos=new THREE.Vector3(component.point.x,component.point.y,component.point.z);
  for(let i=0;i<3;i++){
   const shard=pos.clone().add(new THREE.Vector3((Math.random()-.5)*.4,(Math.random()-.5)*.4,(Math.random()-.5)*.4));
   debrisPiece(shard,component.material,point);
  }
 }
}
function carveSchool(x,y,z,r,strength=1,type='stone',speed=0){
 // Local physical carving only: never mutate the school health gauge.
 const impactRadius=Math.min(Math.max(.1,r),4.5);
 const impactStrength=Math.min(Math.max(0,strength),.9);
 neighborhood.city.impact(neighborhood.school,new THREE.Vector3(x,y,z),impactRadius,impactStrength);
 schoolReconstruction?.impact({x,y,z,radius:impactRadius,strength:impactStrength,type,speed});
 sourceDamage.stamp(x,y,z,impactRadius);
 if(actualSchoolOverlayReady&&schoolComponentIndex)emitSourceSchoolDebris(new THREE.Vector3(x,y,z),impactRadius);
 const range=schoolBounds.getSize(new THREE.Vector3());
 stampPermanentDamage('front',(x-schoolBounds.min.x)/range.x,(y-schoolBounds.min.y)/range.y,impactRadius/range.x,impactRadius/range.y);
}
function setRowhouseSourceVisible(role,on){
 // Flanking Revit FBX masses are deprecated and replaced by authentic North Broad models.
 return false;
}
const schoolQA=new URLSearchParams(location.search).get('qa')==='1';
let sourceComparison=null;
function prepareSchoolMaterial(material){
    sourceDamage.patch(material);
    if(['school-glass','school-interior'].includes(material.name)&&material.emissive){
     material.emissive.setHex(0xffd6a2);
     material.emissiveIntensity=0;
     // Illuminate the retained interior surfaces behind the glazing. Keep the
     // glass itself subdued so the facade does not become a flat glowing panel.
     material.userData.nightEmission=material.name==='school-interior'?.55:.07;
     schoolGlazingMaterials.push(material);
    }
}
async function loadPlaySchoolOverlay(){
 try{
  const {model,info}=await loadSchoolPlayMesh(prepareSchoolMaterial);
  model.name='ACTUAL-TECH-FREIRE-SCHOOL';
  model.matrixAutoUpdate=false;
  model.updateMatrix();
  scene.add(model);
  const box=new THREE.Box3().setFromObject(model);
  schoolComponentIndex=createSchoolComponentIndex(info.components);
  actualSchoolOverlay=model;
  actualSchoolOverlayReady=true;
  actualSchoolOverlayStats={
   loaded:true,sourceMeshes:info.roles.school,batches:model.children.length,
   inputTriangles:info.originalTriangles,outputTriangles:info.triangles,
   sourceInteriorAudit:{attachedGeometrySource:'FBX-derived play mesh',damagePhysicsSource:'approximate proxy',
    sourceSHA256:info.sourceSha256,renderSimplification:info.byCategory,componentIndex:schoolComponentIndex.stats()},
   visibleBounds:{min:box.min.toArray(),max:box.max.toArray(),size:box.getSize(new THREE.Vector3()).toArray()},
   calibration:{...info.fit,source:SCHOOL_SOURCE,target:SCHOOL_TARGET},sourcePartition:info.roles
  };
  setMode(viewMode);
  syncStructuralDamage();
  console.info('Tech Freire play mesh',info.triangles+' triangles');
 }catch(error){
  status.textContent='SCHOOL PLAY MESH FAILED TO LOAD · PROCEDURAL FALLBACK';
  console.warn('School play mesh loading failed',error);
 }
}
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
   const sourceInteriorAudit={retained:{},excluded:{},sourceVerificationRequired:true};
   const sourceComponents=[];
   const fittedPoint=p=>({x:p.x*placement.scale+placement.translation.x,y:p.y*placement.scale+placement.translation.y,z:p.z*placement.scale+placement.translation.z});
   fbx.traverse(mesh=>{if(!mesh.isMesh)return;bounds.setFromObject(mesh);
    const role=classifyArchitecturalMesh(mesh,bounds);
    meshRoles.set(mesh,role);
    if(role==='school'){
     const category=schoolSourceCategory(mesh);
     sourceComponents.push({category,material:sourceComponentMaterial(category,mesh.name||''),min:fittedPoint(bounds.min),max:fittedPoint(bounds.max)});
    }
    if(role)roleMeshCounts[role]++;else roleMeshCounts.excluded++;
    if(role==='school'||!role&&bounds.min.x>=SCHOOL_SOURCE.keepMinX&&bounds.max.x<=SCHOOL_SOURCE.keepMaxX&&bounds.min.z>=SCHOOL_SOURCE.keepMinZ&&bounds.max.z<=SCHOOL_SOURCE.keepMaxZ){
     const category=schoolSourceCategory(mesh),bucket=role==='school'?sourceInteriorAudit.retained:sourceInteriorAudit.excluded;
     const entry=bucket[category]??={meshes:0,triangles:0};
     entry.meshes++;entry.triangles+=(mesh.geometry?.index?.count??mesh.geometry?.attributes?.position?.count??0)/3;
    }
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
      mat.side=(mat.transparent||(mat.name&&mat.name.includes('glass')))?THREE.DoubleSide:THREE.FrontSide;
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
   const central=batchSchoolSource(school,prepareSchoolMaterial);
   central.model.name='ACTUAL-TECH-FREIRE-SCHOOL';
   central.model.matrixAutoUpdate=false;
   central.model.updateMatrix();
   scene.add(central.model);
   const box=new THREE.Box3().setFromObject(central.model,true);
   const size=box.getSize(new THREE.Vector3());
   schoolComponentIndex=createSchoolComponentIndex(sourceComponents);
   actualSchoolOverlay=central.model;actualSchoolOverlayReady=true;
   actualSchoolOverlayStats={loaded:true,sourceMeshes:roleMeshCounts.school,batches:central.batches,
    inputTriangles:central.inputTriangles,outputTriangles:central.outputTriangles,
    sourceInteriorAudit:{...sourceInteriorAudit,batchedSurfaces:central.bySurface,attachedGeometrySource:'original FBX',damagePhysicsSource:'approximate proxy',spatialRegions:central.spatialRegions,largestBatchVertices:central.largestBatchVertices,triangleCountPreserved:central.inputTriangles===central.outputTriangles,componentIndex:schoolComponentIndex.stats()},
    visibleBounds:{min:box.min.toArray(),max:box.max.toArray(),size:size.toArray()},
    calibration:{...placement,source:SCHOOL_SOURCE,target:SCHOOL_TARGET},
    floorCount:5,storyBoundaries:[0,14.5,28.6,43.3,58.4,74.6].map(y=>+(y*placement.scale).toFixed(2)),
    axisCorrectionDeg:-90,originUpAxis:'Z+',worldUpAxis:'Y+',
    fitPolicy:'central school source meshes, uniformly scaled; flanking masses handled separately'};
   // Flanking Revit FBX masses are replaced by authentic North Broad model pack.
   // Preserve Tech Freire school in place; do not build or render flanking FBX masses.
   for(const role of ['leftRowhouse','rightRowhouse']){
    actualRowhouseStats[role]={loaded:false,sourceMeshes:roleMeshCounts[role],processed:0,batches:0,
     fallback:'north-broad-model-pack',reason:'replaced-by-photogrammetric-models'};
    actualRowhouseOverlays[role]=null;
   }
   actualSchoolOverlayStats.sourcePartition=roleMeshCounts;
   actualSchoolOverlayStats.rowhouses=actualRowhouseStats;
   setMode(viewMode);
   syncStructuralDamage();
   console.info('Tech Freire three-building source partition',actualSchoolOverlayStats);cinematicLighting?.update?.(0,0);
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
schoolReconstruction.setEffectsHooks?.({
 onGlassShatter:(x,y,z)=>{
  sound('glass',{x,volume:0.62});
  cinematicFX.sparks(new THREE.Vector3(x,y,z),10,0.85);
  const shardCount=Math.floor(Math.random()*6)+8;
  for(let s=0;s<shardCount;s++){
   const sPos=new THREE.Vector3(
    x+(Math.random()-0.5)*1.8,
    y+(Math.random()-0.5)*1.2,
    z+0.12+Math.random()*0.35
   );
   const sOrigin=new THREE.Vector3(x,y,z-1.2);
   debrisPiece(sPos,'glass',sOrigin);
  }
 },
 onColumnBuckle:(x,y,z)=>{
  if(Math.random()<0.45){
   sound('buildingCollapse',{x});
   cinematicFX.dustBurst(new THREE.Vector3(x,y,z),1.4);
   shake=Math.max(shake,0.40);
  }
 },
 onFloorPancake:(x,y,z)=>{
  sound('crash',{x});
  cinematicFX.demolitionDustWave(new THREE.Vector3(x-3.2,0.4,z),new THREE.Vector3(x+3.2,0.4,z),1.8);
  // RC169: Air overpressure dust blown horizontally out through window openings on floor impact
  if(cinematicFX && cinematicFX.dustBurst){
   cinematicFX.dustBurst(new THREE.Vector3(x, Math.max(0.8, y), z + 3.8), 1.3);
   cinematicFX.dustBurst(new THREE.Vector3(x, Math.max(0.8, y), z - 3.8), 1.3);
   cinematicFX.dustBurst(new THREE.Vector3(x - 5.5, Math.max(0.8, y), z), 1.3);
   cinematicFX.dustBurst(new THREE.Vector3(x + 5.5, Math.max(0.8, y), z), 1.3);
  }
  buildingElectricalShorts.triggerArc(new THREE.Vector3(x,y+0.6,z),new THREE.Vector3(x+(Math.random()-0.5)*3.2,Math.max(0.4,y-1.8),z+(Math.random()-0.5)*3.2),1.6,cinematicFX,sound);
  shake=Math.max(shake,0.55);
 },
 onFurnitureImpact:(x,y,z,zone,impactVy=3.0)=>{
  // RC167: Classroom furniture impact fracture and debris splintering
  sound('crash',{x,volume:0.35,pitch:1.35});
  cinematicFX.dustBurst(new THREE.Vector3(x,y,z),0.55);
  const chipCount=Math.min(8,Math.floor(3+impactVy*0.75));
  for(let s=0;s<chipCount;s++){
   const cPos=new THREE.Vector3(
    x+(Math.random()-0.5)*0.8,
    y+0.15+Math.random()*0.35,
    z+(Math.random()-0.5)*0.8
   );
   const cOrigin=new THREE.Vector3(x,y-0.1,z);
   const matType=zone==='lab-monitor'?'metal':(Math.random()<0.55?'wood':'furniture');
   debrisPiece(cPos,matType,cOrigin);
  }
 },
 onStructuralCreak:(x,y,z)=>{
  if(Math.random()<0.45){
   sound('buildingCollapse',{x,volume:0.38,pitch:1.25});
  }
 },
 onElectricalShort:(x,y,z,power=1.0)=>{
  sound('electricSpark',{x,volume:Math.min(1.0,0.45+power*0.35)});
  buildingElectricalShorts.triggerArc(
   new THREE.Vector3(x,y,z),
   new THREE.Vector3(x+(Math.random()-0.5)*2.4,Math.max(0.2,y-0.8-Math.random()*1.4),z+(Math.random()-0.5)*2.4),
   power,
   cinematicFX,
   sound
  );
  cinematicFX.sparks(new THREE.Vector3(x,y,z),Math.floor(12*power),1.2);
 }
});
const signCanvas=document.createElement('canvas');signCanvas.width=1024;signCanvas.height=256;
const signContext=signCanvas.getContext('2d');signContext.fillStyle='#1c252d';signContext.fillRect(0,0,1024,256);signContext.lineWidth=8;signContext.strokeStyle='#b89248';signContext.strokeRect(6,6,1012,244);signContext.textAlign='center';signContext.fillStyle='#ffea9f';signContext.shadowColor='#e5a83b';signContext.shadowBlur=12;signContext.font='bold 92px sans-serif';signContext.fillText('TECH FREIRE',512,105);signContext.font='bold 48px sans-serif';signContext.fillText('CHARTER SCHOOL',512,195);
const signTexture=new THREE.CanvasTexture(signCanvas);signTexture.colorSpace=THREE.SRGBColorSpace;
const physicalSign=new THREE.Mesh(new THREE.PlaneGeometry(7.6,1.4),new THREE.MeshStandardMaterial({map:signTexture,roughness:.35,metalness:.2,emissive:0xe8be6e,emissiveMap:signTexture,emissiveIntensity:.85}));physicalSign.position.set(0,4.25,2.32);schoolSignGroup.add(physicalSign);const canopyRoof=new THREE.Mesh(new THREE.BoxGeometry(8.8,.22,2.6),new THREE.MeshStandardMaterial({color:0x232b32,roughness:.4,metalness:.45}));canopyRoof.position.set(0,3.42,1.35);schoolSignGroup.add(canopyRoof);const canopySoffit=new THREE.Mesh(new THREE.PlaneGeometry(8.4,2.3),new THREE.MeshBasicMaterial({color:0xffecb8,side:THREE.DoubleSide}));canopySoffit.rotation.x=Math.PI/2;canopySoffit.position.set(0,3.30,1.35);schoolSignGroup.add(canopySoffit);for(const cx of [-4.0,4.0]){const col=new THREE.Mesh(new THREE.CylinderGeometry(.09,.09,3.4,12),new THREE.MeshStandardMaterial({color:0x7d909a,roughness:.3,metalness:.65}));col.position.set(cx,1.70,2.45);schoolSignGroup.add(col);}const glassVestibule=new THREE.Mesh(new THREE.BoxGeometry(8.0,3.3,.08),new THREE.MeshStandardMaterial({color:0x426575,roughness:.1,metalness:.2,transparent:true,opacity:.52,depthWrite:false}));glassVestibule.position.set(0,1.65,.65);schoolSignGroup.add(glassVestibule);
// Disable second, independent neighboring house masses: the structural city layout
// already contains the correctly spaced real-block neighbors.
const adjacentTownhouses=null;
setMode('real');
// Only an explicit source comparison loads the heavyweight Revit export here.
if(schoolQA&&new URLSearchParams(location.search).get('schoolSource')==='full')loadActualSchoolOverlay();
else loadPlaySchoolOverlay();
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
// Legacy mouth socket follows the original visual snout's world transform.
const legacyMouthAnchor=new THREE.Object3D();legacyMouthAnchor.position.set(2.98,.94,0);dragon.add(legacyMouthAnchor);
let dragonLeavingRoof=false,flightPitch=0,dragonVelX=0,dragonVelY=0,flightRoll=0,flightYaw=0,diveEnergy=0,restBlend=1.0,isBoosting=false,lastIntenseRoarElapsed=0,rearUpBlend=0.0,introZoomProgress=1.0,waveClearZoomBlend=0.0;
const DRAGON_BOUND_X=380;
function perchDragon(rest=false){
 dragonLeavingRoof=false;
 dragonVelX=0;dragonVelY=0;flightRoll=0;flightYaw=0;diveEnergy=0;
 facing=1;turnTime=0;gasPose=0;dragonGroundImpact=false;recoveryLift=0;windActive=false;gustTime=0;pauloFirePoseUntil=0;flightPitch=0;
 dragon.position.set(0,schoolBounds.max.y+2.4,schoolBounds.max.z-1.8);
 dragon.rotation.x=-0.12;dragon.rotation.y=1.52;dragon.rotation.z=0.22;
 for(const wing of wings){wing.pivot.rotation.z=wing.sign*.55;wing.pivot.rotation.x=-wing.sign*.20;}
 pauloPoseDriver?.reset('idle');
 if(dragonStun<=0)invulnerable=Math.max(invulnerable,.55);
}

const dragonVisuals=enhanceDragon(THREE,dragon,wings);
// The gameplay dragon root remains the single collision/aim/camera/NPC target.
// Switch ONLY its visual child meshes; projectiles, breath, health, physics,
// invulnerability and existing shock arcs continue to use the original root.
const legacyDragonVisuals=dragon.children.map(object=>({object,visible:object.visible}));
let pauloPreviewRig=null,pauloPoseDriver=null,pauloPreviewEnabled=false,pauloFirePoseUntil=0;
// Use the active visual model's animated mouth, never a stale world emitter.
const breathMouthScratch=new THREE.Vector3(),breathXAxis=new THREE.Vector3(1,0,0);
function getBreathMouthWorld(out=breathMouthScratch){
 const socket=pauloPreviewEnabled&&pauloPreviewRig?.mouthAnchor?pauloPreviewRig.mouthAnchor:legacyMouthAnchor;
 return socket.getWorldPosition(out);
}
const pauloPreviewButton=document.querySelector('#paulo-toggle');
// Public, visual-only comparison: the original dragon stays the default and
// remains available as fallback. The new option is our procedural Paulo rig,
// NOT the separately licensed European Dragon FBX (asset not yet integrated).
if(pauloPreviewButton){pauloPreviewButton.hidden=true;pauloPreviewButton.style.display='none';}
function setPauloPreview(enabled){
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
  pauloPreviewButton.textContent=pauloPreviewEnabled?'🐉 Model: Paulo Preview':'🐉 Model: Original';
  pauloPreviewButton.setAttribute('aria-pressed',String(pauloPreviewEnabled));
 }
 return pauloPreviewEnabled;
}
pauloPreviewButton?.addEventListener('click',()=>setPauloPreview(!pauloPreviewEnabled));
try{setPauloPreview(true);}catch(e){console.warn('Paulo initial rig load deferred',e);}
if(new URLSearchParams(location.search).get('qa')==='1')window.__DD_PAULO_PREVIEW={
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
dragon.position.set(0,schoolBounds.max.y+2.4,schoolBounds.max.z-1.8);dragon.rotation.set(-0.12,1.52,0.22);
// High-fidelity synthesized audio engine with noise buffers, FM, and sub-bass celestial rumble.
const soundEngine=createSoundEngine();
let audio=null,muted=false;
const soundButton=document.getElementById('sound-toggle');
function refreshAudioButtons(){
 const isM=soundEngine.isMuted();
 const isMusicM=soundEngine.isMusicMuted();
 const isSfxM=soundEngine.isSfxMuted();
 if(soundButton){
  soundButton.textContent=isM?'🔇 Sound Off':'🔊 Sound On';
  soundButton.setAttribute('aria-pressed',String(!isM));
 }
 const modalMaster=document.getElementById('dd-audio-master-btn');
 if(modalMaster){
  modalMaster.textContent=isM?'🔇 Audio: OFF':'🔊 Audio: ON';
  modalMaster.classList.toggle('active',!isM);
 }
 const modalMusic=document.getElementById('dd-audio-music-btn');
 if(modalMusic){
  modalMusic.textContent=isMusicM?'🔇 Music: OFF':'🎵 Music: ON';
  modalMusic.classList.toggle('active',!isMusicM);
 }
 const modalSfx=document.getElementById('dd-audio-sfx-btn');
 if(modalSfx){
  modalSfx.textContent=isSfxM?'🔇 SFX: OFF':'💥 Sound Effects: ON';
  modalSfx.classList.toggle('active',!isSfxM);
 }
 const tbMusic=document.getElementById('dd-tb-music');
 if(tbMusic){
  tbMusic.textContent=isMusicM?'🎵 Music: OFF':'🎵 Music: ON';
  tbMusic.classList.toggle('active',!isMusicM);
 }
 const tbSfx=document.getElementById('dd-tb-sfx');
 if(tbSfx){
  tbSfx.textContent=isSfxM?'🔊 SFX: OFF':'🔊 SFX: ON';
  tbSfx.classList.toggle('active',!isSfxM);
 }
 const btmMusic=document.getElementById('music-toggle-bottom');
 if(btmMusic){
  btmMusic.textContent=isMusicM?'🎵 Music: OFF':'🎵 Music: ON';
  btmMusic.classList.toggle('active',!isMusicM);
 }
 const btmSfx=document.getElementById('sfx-toggle-bottom');
 if(btmSfx){
  btmSfx.textContent=isSfxM?'🔊 SFX: OFF':'🔊 SFX: ON';
  btmSfx.classList.toggle('active',!isSfxM);
 }
}
function refreshSoundButton(){refreshAudioButtons();}
soundButton.addEventListener('click',async()=>{
 const nextMuted=!soundEngine.isMuted();
 soundEngine.setMuted(nextMuted);
 muted=nextMuted;
 refreshAudioButtons();
 if(!nextMuted){
  soundEngine.init();
  sound('bonus');
 }
});
refreshAudioButtons();
window.addEventListener('pointerdown',()=>soundEngine.init(),{once:true});
window.addEventListener('keydown',()=>soundEngine.init(),{once:true});
function sound(kind,opt){soundEngine.sound(kind,opt);}

window.__DD_AUDIO={
 isMuted:()=>soundEngine.isMuted(),
 setMuted:(val)=>{soundEngine.setMuted(val);muted=soundEngine.isMuted();refreshAudioButtons();},
 isMusicMuted:()=>soundEngine.isMusicMuted(),
 setMusicMuted:(val)=>{soundEngine.setMusicMuted(val);refreshAudioButtons();},
 isSfxMuted:()=>soundEngine.isSfxMuted(),
 setSfxMuted:(val)=>{soundEngine.setSfxMuted(val);refreshAudioButtons();}
};
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
let electricalShortsCount=0;
function updateBuildingElectricalShorts(dt){
 if(!performanceLab.isEnabled('particles'))return;
 const damagedBldgs=neighborhood.targetBuildings?.filter(b=>!b.school&&(b.damage||0)>=0.18)||[];
 for(const bldg of damagedBldgs){
  if(Math.random()<dt*3.2*Math.min(1.0,bldg.damage)){
   const spX=bldg.x+(Math.random()-0.5)*bldg.w*0.82;
   const spY=Math.max(1.2,Math.random()*bldg.h*0.82);
   const spZ=bldg.z+(Math.random()-0.5)*bldg.d*0.82;
   cinematicFX.sparks(new THREE.Vector3(spX,spY,spZ),Math.round(8+Math.random()*12),1.4);
   flashAt(spX,spY,spZ,0.85);
   electricalShortsCount++;
   if(Math.random()<0.28)sound('electric',{x:spX});
  }
 }
 if(northBroadModels&&northBroadModels.entries){
  for(const entry of northBroadModels.entries){
   if((entry.damage||0)>=0.15&&Math.random()<dt*3.2*Math.min(1.0,entry.damage)){
    const spX=entry.anchor?.x||(entry.box?(entry.box.min.x+entry.box.max.x)*0.5:0);
    const spY=Math.max(1.5,Math.random()*9.0);
    const spZ=entry.anchor?.z||(entry.box?(entry.box.min.z+entry.box.max.z)*0.5:0);
    cinematicFX.sparks(new THREE.Vector3(spX,spY,spZ),Math.round(8+Math.random()*12),1.4);
    flashAt(spX,spY,spZ,0.85);
    electricalShortsCount++;
    if(Math.random()<0.28)sound('electric',{x:spX});
   }
  }
 }
 if(schoolDamage>=0.15&&Math.random()<dt*3.8*Math.min(1.0,schoolDamage)){
  const spX=(Math.random()-0.5)*24.0;
  const spY=1.5+Math.random()*13.0;
  const spZ=-46.0+Math.random()*44.0;
  cinematicFX.sparks(new THREE.Vector3(spX,spY,spZ),Math.round(10+Math.random()*14),1.6);
  flashAt(spX,spY,spZ,1.1);
  electricalShortsCount++;
  if(Math.random()<0.32)sound('electric',{x:spX});
 }
}
const cars=[];let carTimer=0;const nextLaneByDirection={east:0,west:0};const craters=[];let lastRadioDispatchTime=-999;let streetStop=0;const waterDropletGeometry=new THREE.SphereGeometry(.10,5,4);
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
 // Deliberately fictionalized landmark alignment: keep the skyline visible,
 // but entirely behind the expanded North Philadelphia rowhouse horizon.
 skyline.position.set(0,-18,-1020);skyline.scale.set(4.35,2.80,1.15);
 const skylineFires=[];let skylineDamage=0;
 const skylineBackdrop=createPhiladelphiaSkyline(skyline,{flameTexture:visualBank.images.flame,smokeAtlas:visualBank.images.smoke});
 const landmarkCenter=new THREE.Box3().setFromObject(skylineBackdrop.group).getCenter(new THREE.Vector3()).x;
 skylineBackdrop.group.position.x-=landmarkCenter/skyline.scale.x;
 const skylineAnchor=skylineCameraRayX({cameraX:streetView.x,cameraZ:streetView.z,targetX:0,targetZ:streetView.targetZ,skylineZ:skyline.position.z});
 skyline.position.x=skylineAnchor;
const skylineAirUniforms={opacity:{value:.10},day:{value:1}};
const skylineAir=new THREE.Mesh(new THREE.PlaneGeometry(960,200),new THREE.ShaderMaterial({transparent:true,depthWrite:false,depthTest:true,side:THREE.DoubleSide,uniforms:skylineAirUniforms,vertexShader:'varying vec2 vUv; void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',fragmentShader:'varying vec2 vUv;uniform float opacity;uniform float day;void main(){vec3 midday=vec3(.66,.78,.88),sunset=vec3(.94,.68,.52),night=vec3(.13,.20,.30);vec3 daylight=mix(midday,sunset,clamp((1.-abs(day-.45)*3.2),0.,1.));vec3 col=mix(night,daylight,day);float a=opacity*pow(max(0.,1.-vUv.y),1.5)*smoothstep(.0,.08,vUv.y);gl_FragColor=vec4(col,a);}' }));
skylineAir.position.set(0,56,12);skylineAir.name='atmospheric-depth-veil';skyline.add(skylineAir);
// Distant facade lights are integrated into building materials.
// Distant fires remain inexpensive: shared low-poly geometry and materials.
// The entire game now shares a time-animated, turbulence-driven flame field.
const flameTexture=visualBank.images.flame;
const skylineFlameMat=new THREE.SpriteMaterial({map:flameTexture,color:0xffffff,transparent:true,opacity:.89,depthWrite:false,blending:THREE.NormalBlending});
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
 // Spontaneous unbatched fires removed: Skyscraper fires only start from direct hits by flaming meteors.
 for(const f of skylineFires){
  f.fire.scale.set(2.5+.37*Math.sin(elapsed*5+f.phase),4.2+.60*Math.sin(elapsed*7+f.phase),1);
  f.puffs.forEach((p,i)=>{
   const flow=(elapsed*(.32+i*.04)+i*.18+f.phase*.08)%8;
   const progress=flow/8;
   p.position.y=f.fire.position.y+1.2+i*1.8+Math.pow(flow,1.38)*4.5;
   p.position.x=f.fire.position.x+Math.sin(elapsed*.35+i*1.1+f.phase)*(1.5+i*.55+flow*.6);
   const width=2.4+i*.95+Math.pow(flow,1.15)*1.2;
   p.scale.set(width,width*1.25,1);
   const altFade=Math.max(0.04,Math.pow(1.0-progress,1.3));
   p.material.opacity=Math.sin(Math.pow(progress,0.6)*Math.PI)*.45*altFade;
   p.material.color.setHex(i>1?0x555a61:0x34383e);
  });
 }
}
// Restrained, camera-relative silhouette framing, inspired by layered depth in Hollow Knight.
// Keep the center and dragon flight corridor unobstructed; avoid large floating roof blocks.
// The prior opaque "foreground rooftop" silhouettes were suspended in front

// Four-lane traffic; red lights hold civilian vehicles, responders bypass signals.
let trafficLightRed=false;
const trafficSignals=[];const trafficGreen=new THREE.MeshBasicMaterial({color:0x22ed62}),trafficRed=new THREE.MeshBasicMaterial({color:0xf34135}),trafficOff=new THREE.MeshBasicMaterial({color:0x222a30});
const CROSS_STREET_CONFIG=CROSS_STREETS;
const streetSignBladeMaterial=(text)=>{
 const canvas=document.createElement('canvas');canvas.width=384;canvas.height=96;
 const ctx=canvas.getContext('2d');
 ctx.fillStyle='#014828';ctx.fillRect(0,0,384,96);
 ctx.strokeStyle='#ffffff';ctx.lineWidth=4;ctx.strokeRect(5,5,374,86);
 ctx.fillStyle='#ffffff';ctx.font='bold 38px "Franklin Gothic Medium", Arial, sans-serif';
 ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(text,192,49);
 const tex=new THREE.CanvasTexture(canvas);tex.colorSpace=THREE.SRGBColorSpace;
 return new THREE.MeshBasicMaterial({map:tex,side:THREE.DoubleSide});
};
const broadSignMat=streetSignBladeMaterial('N BROAD ST');
for(const street of CROSS_STREET_CONFIG){
 const streetSignMat=streetSignBladeMaterial(street.name);
 for(const sx of [-street.roadHalfWidth-1.5,street.roadHalfWidth+1.5]){
  const px=street.x+sx;
  for(const z of [4,29]){
   const pole=block(scene,px,3.2,z,.23,6.4,.23,material(0x34383c));
   const housing=block(scene,px,6.2,z,.75,1.65,.75,material(0x191c22));
   const red=new THREE.Mesh(new THREE.SphereGeometry(.23,8,6),trafficOff),green=new THREE.Mesh(new THREE.SphereGeometry(.23,8,6),trafficGreen);
   red.position.set(px,6.55,z+.42);green.position.set(px,5.95,z+.42);scene.add(red,green);trafficSignals.push({red,green});
   if(z===4){
    const crossBlade=new THREE.Mesh(new THREE.PlaneGeometry(2.3,.58),streetSignMat);
    crossBlade.position.set(px,5.35,z+.18);scene.add(crossBlade);
    const broadBlade=new THREE.Mesh(new THREE.PlaneGeometry(2.1,.58),broadSignMat);
    broadBlade.position.set(px+(sx<0?.18:-.18),5.75,z);
    broadBlade.rotation.y=Math.PI/2;scene.add(broadBlade);
   }
  }
 }
}
function updateSignals(){trafficLightRed=(elapsed%18)>11;for(const s of trafficSignals){s.red.material=trafficLightRed?trafficRed:trafficOff;s.green.material=trafficLightRed?trafficOff:trafficGreen;}}
const policeBlockadeGroup=new THREE.Group();policeBlockadeGroup.name='police-intersections-blockade';policeBlockadeGroup.visible=false;scene.add(policeBlockadeGroup);
const policeBlockades=[];
for(const crossX of CROSS_STREET_X){
 for(const z of [11.5, 36.5]){
  const cruiser=new THREE.Group();cruiser.position.set(crossX+(crossX>0?3.2:-3.2),-.36,z);
  cruiser.rotation.y=(crossX>0?-1:1)*0.55;
  const {beacon,brakes}=buildRoadVehicle(THREE,cruiser,{length:4.2,bodyHex:0xf1f1e8,police:true,emergency:true});
  batchVehicleVisuals(THREE,cruiser,{exclude:[beacon,cruiser.userData.headlightBeam,...(brakes||[])]});
  policeBlockadeGroup.add(cruiser);
  const barrier=new THREE.Group();barrier.position.set(crossX,0,z+(z>20?3.2:-3.2));
  block(barrier,0,.65,0,3.2,.2,.25,material(0xe85d22));
  block(barrier,0,.65,0,.6,.21,.26,material(0xffffff));
  block(barrier,-1.2,.32,0,.15,.65,.8,material(0x282c30));
  block(barrier,1.2,.32,0,.15,.65,.8,material(0x282c30));
  const amberBeacon=new THREE.Mesh(new THREE.SphereGeometry(.22,6,4),new THREE.MeshBasicMaterial({color:0xffaa22}));
  amberBeacon.position.set(0,.85,0);barrier.add(amberBeacon);
  policeBlockadeGroup.add(barrier);
  policeBlockades.push({cruiser,beacon,amberBeacon});
 }
}
try{batchStaticStreetProps(policeBlockadeGroup);}catch(e){}
function updatePoliceBlockades(dt){
 const activeBlockade=(wave>=6||hp<75);
 policeBlockadeGroup.visible=activeBlockade;
 if(!activeBlockade)return;
 for(const b of policeBlockades){
  if(b.beacon)b.beacon.material=(Math.floor(elapsed*8)%2)?redLamp:blueLamp;
  if(b.amberBeacon)b.amberBeacon.visible=(Math.floor(elapsed*4)%2)===0;
 }
}
function spawnBikerCompanion(leadX,leadZ,dir,offsetX,offsetZ,speed){
 const root=new THREE.Group();scene.add(root);
 root.position.set(leadX+dir*offsetX,-.36,leadZ+offsetZ);
 root.rotation.set(0,dir<0?Math.PI:0,0);
 const jacketHex=[0x22262a,0x354d68,0x7d2822][Math.floor(Math.random()*3)];
 buildRoadVehicle(THREE,root,{length:2.55,bodyHex:jacketHex,bike:true});
 captureVehicleResources(THREE,root);batchVehicleVisuals(THREE,root);captureVehicleResources(THREE,root);
 cars.push({crossStreet:false,crossDir:0,rearStreet:false,turnAt:null,turning:false,turnPath:null,
  laneChangeAt:null,laneChanged:false,originalLane:leadZ+offsetZ,root,poolKey:'bike-companion',
  ice:false,dir,ambulance:false,length:2.55,bodyStyle:'sedan',ladder:false,
  desiredSpeed:speed,driverPhase:Math.random()*6,bus:false,truck:false,van:false,
  fireTruck:false,garbage:false,bike:true,scooter:false,speed,
  emergency:false,police:false,beacon:null,hostile:false,laneZ:leadZ+offsetZ,
  stun:0,life:90,blink:0,attackTimer:1.8,serviceStop:false,serviceSeconds:0,
  serviceDeparture:0,serviceProgress:0,serviceTarget:null,hoseTime:0});
}
const vehiclePool=new Map();
const vehiclePoolStats={created:0,reused:0,recycled:0,explodedRemoved:0,originalMeshes:0,bakedBatches:0,drawCallsSaved:0,bakeFailures:0};
const vehicleMaterials=new Map();
function vehicleMaterial(hex){if(!vehicleMaterials.has(hex))vehicleMaterials.set(hex,material(hex));return vehicleMaterials.get(hex);}
function spawnCar(forcedX=null,forcedLaneZ=null,forcedDir=null,forcedType=null){
 const chapter=wave<=5?1:wave<=10?2:wave<=14?3:4;
 const carCap=chapter<=2?18:(chapter===3?16:14);
 if(cars.length>=carCap&&forcedX===null)return;
 const severeDamage=hp<55||schoolFire.length>=3||neighborhood.targetBuildings.filter(b=>b.damage>.35).length>=5;
 const activeFireTrucks=cars.filter(c=>c.fireTruck).length;
 const wave12FireBoost=(wave<=2&&activeFireTrucks<4);
 const fireTruckNeeded=(wave<=2&&activeFireTrucks<4)||(activeFireTrucks<Math.min(5,Math.max(2,schoolFire.length+1)));
 const fireUrgency=fireTruckNeeded||(schoolFire.length>0&&activeFireTrucks<Math.min(6,schoolFire.length+2));
 const role=forcedVehicleRole(forcedType);
 const military=!role&&chapter===3&&!fireUrgency&&Math.random()<.65;
 const emergency=role?role!=='bus':wave12FireBoost||fireTruckNeeded||(!military&&(fireUrgency||Math.random()<(severeDamage?.83:(chapter===2?Math.min(.82,.38+(wave-5)*.08):(chapter===1?.04:.15)))));
 const ambulance=role?role==='ambulance':!military&&!fireUrgency&&emergency&&(crowd.some(p=>p.down>0)||severeDamage)&&Math.random()<(severeDamage?.40:.30);
 const police=role?role==='police':!military&&!fireUrgency&&!wave12FireBoost&&emergency&&!ambulance&&(chapter===2?Math.random()<.88:Math.random()<.47);
 const bike=!role&&!military&&!emergency&&Math.random()<.18,scooter=bike&&Math.random()<.55,bus=role?role==='bus':!military&&!emergency&&!bike&&Math.random()<.12,truck=!role&&((military&&Math.random()<.65)||(!emergency&&!bus&&!bike&&Math.random()<.23)),garbage=!military&&truck&&Math.random()<.31,van=!role&&((military&&!truck)||(!emergency&&!bus&&!truck&&!bike&&Math.random()<.24)),taxi=!role&&!military&&!emergency&&!bike&&!bus&&!truck&&!van&&Math.random()<.17,dir=forcedDir??(Math.random()<.5?1:-1);
 const bodyHex=bus?0x1a4574:(military?[0x424e37,0x4d5940,0x353d2d,0x5a634e,0x3a4231][Math.floor(Math.random()*5)]:(emergency?(ambulance?0xf7f5ed:police?0xf1f1e8:0xc52c2b):(garbage?0x447b58:taxi?0xf4c747:CAR_COLORS[Math.floor(Math.random()*CAR_COLORS.length)])));
 const fireTruck=emergency&&!police&&!ambulance,ladder=fireTruck&&Math.random()<.5;
 const bodyStyle=military?'wagon':['sedan','wagon','crossover'][Math.floor(Math.random()*3)];
 const poolKey=[bodyStyle,ladder,bike,scooter,bus,truck,garbage,van,police,ambulance,emergency,military,fireTruck,taxi,bodyHex].join('/');
 const available=vehiclePool.get(poolKey);
 const reused=available?.pop();
 const root=reused?.root||new THREE.Group();scene.add(root);if(root.userData.fireCrew)root.userData.fireCrew.visible=false;
 if(reused)vehiclePoolStats.reused++;else vehiclePoolStats.created++;
 const laneKey=dir>0?'east':'west';
 const laneIndex=(nextLaneByDirection[laneKey]++)%2;
 let rearStreet=false,midgroundStreet=false,backgroundStreet=false,crossStreet=false,crossDir=0;
 let laneZ=dir>0?BROAD_LANES[laneIndex]:BROAD_LANES[laneIndex+2];
 if(forcedLaneZ!==null&&(dir>0?BROAD_LANES.slice(0,2):BROAD_LANES.slice(2)).includes(forcedLaneZ))laneZ=forcedLaneZ;
 if(!emergency&&forcedLaneZ===null&&Math.random()<.1){
  crossStreet=true;
  crossDir=Math.random()<.5?1:-1;
  laneZ=crossDir>0?-2:34;
 }
 const streetScale=backgroundStreet?.52:(midgroundStreet?.66:(rearStreet?.82:1.0));
 const spawnDist=260+Math.random()*40;
 if(crossStreet){
  const crossX=forcedX??CROSS_STREET_X[Math.floor(Math.random()*CROSS_STREET_X.length)];
  root.position.set(crossX,-.36,laneZ);
  root.rotation.set(0,crossDir<0?-Math.PI/2:Math.PI/2,0);
 }else{
  root.position.set(forcedX??(dir>0?-spawnDist:spawnDist),-.36,laneZ);
  root.rotation.set(0,dir<0?Math.PI:0,0);
 }
 root.scale.setScalar(streetScale);
 if(ambulance&&forcedX===null){const injured=crowd.find(p=>p.down>0);if(injured)root.position.x=THREE.MathUtils.clamp(injured.g.position.x-dir*11,-75,75);}
 const body=vehicleMaterial(bodyHex);
 const length=bike?2.55:ladder?8.8:bus?8:emergency&&!police?7.2:garbage?7.6:truck?6.5:van?4.9:3.7;
 let beacon=null;
 if(!reused){
 const built=buildRoadVehicle(THREE,root,{style:bodyStyle,length,bodyHex,bike,scooter,bus,truck,garbage,van,police,ambulance,emergency,fireTruck,ladder,taxi});
 beacon=built.beacon;
  captureVehicleResources(THREE,root);
  for(const pivot of root.userData.frontSteer||[])batchVehicleVisuals(THREE,pivot);
  const baked=batchVehicleVisuals(THREE,root,{exclude:[beacon,root.userData.headlightBeam,...(root.userData.brakes||[])]});
  vehiclePoolStats.originalMeshes+=baked.sourceMeshes;
  vehiclePoolStats.bakedBatches+=baked.batches;
  vehiclePoolStats.drawCallsSaved+=baked.drawCallsSaved;
  vehiclePoolStats.bakeFailures+=baked.failed;
  root.userData.vehicleBeacon=beacon;
  captureVehicleResources(THREE,root);
 }
 beacon=root.userData.vehicleBeacon||null;
 const isCorridor=!emergency&&!rearStreet&&!midgroundStreet&&!backgroundStreet&&!crossStreet;
 const turnAt=isCorridor&&Math.random()<.25?CROSS_STREET_X[Math.floor(Math.random()*CROSS_STREET_X.length)]:null;
 const laneChangeAt=!emergency&&!rearStreet&&!crossStreet&&Math.random()<.27?(-37+Math.random()*74):null;
 cars.push({crossStreet,crossDir,rearStreet,midgroundStreet,backgroundStreet,turnAt,turning:false,turnPath:null,laneChangeAt,laneChanged:false,originalLane:laneZ,root,poolKey,ice:police&&wave>=6&&wave<=10,military,dir,ambulance,length,bodyStyle,ladder,desiredSpeed:military?(8+Math.random()*3):emergency?(severeDamage?16:wave>=7?13:10):bike?10:bus?6:garbage?5:6+Math.random()*6,driverPhase:Math.random()*6,bus,truck,van,fireTruck,garbage,bike,scooter,speed:military?(7+Math.random()*3):emergency?(wave>=7?12:9):bike?8+Math.random()*4:bus?5:garbage?4.6:6+Math.random()*4,emergency,police,beacon,hostile:emergency&&!ambulance&&wave>=7,laneZ,stun:0,life:90,blink:0,attackTimer:1.8,serviceStop:false,serviceSeconds:0,serviceDeparture:0,serviceProgress:0,serviceTarget:null,hoseTime:0});
 if(bike&&!scooter&&wave<=10&&cars.length<carCap-2&&Math.random()<.68&&forcedX===null){
  const posX=dir>0?-spawnDist:spawnDist;
  const companionSpeed=11+Math.random()*4;
  spawnBikerCompanion(posX,laneZ,dir,-4.2,1.15,companionSpeed);
  spawnBikerCompanion(posX,laneZ,dir,-8.4,-1.15,companionSpeed);
 }
 return cars.at(-1);
}
function recycleCar(car){if(!car||car.recycled)return;car.recycled=true;scene.remove(car.root);
 if(car.frozenMaterials){for(const [mesh,original] of car.frozenMaterials){mesh.material.dispose?.();mesh.material=original;}car.frozenMaterials.clear();}
 car.frozen=false;
 let list=vehiclePool.get(car.poolKey);
 const total=Array.from(vehiclePool.values()).reduce((n,p)=>n+p.length,0);
 if((list?.length??0)>=4||total>=48){releaseVehicleResources(car.root);return;}
 if(!list){list=[];vehiclePool.set(car.poolKey,list);}
 list.push({root:car.root});vehiclePoolStats.recycled++;
}
const burningVehicles=[];
function explodeCar(car){if(car.destroyed||car.burning)return;
 car.burning=2.25;car.speed=0;car.hostile=false;car.serviceStop=true;
 const pos=car.root.position.clone();const driver=buildPerson(THREE,2.4);driver.position.set(pos.x,pos.y+.35,pos.z);scene.add(driver);
 const escapeDir=car.dir>0?-1:1;burningVehicles.push({car,driver,escapeDir,smokeTimer:0,life:2.25});
 emitImpact(pos.x,1.1,pos.z,28,.4);panicCrowdAt(pos.x,pos.z,28);message('VEHICLE HIT — DRIVER EVACUATING');
}
function updateBurningVehicles(dt){for(let i=burningVehicles.length-1;i>=0;i--){const b=burningVehicles[i];b.life-=dt;b.smokeTimer-=dt;
 if(b.driver){b.driver.position.z+=b.escapeDir*dt*6;b.driver.position.x+=dt*2.8*b.car.dir;b.driver.rotation.z=Math.sin(elapsed*22)*.22;}
 if(b.smokeTimer<=0){b.smokeTimer=.12;const p=b.car.root.position;const smoke=smokePuff(p.x+(Math.random()-.5)*1.8,2+Math.random()*1.2,p.z,1.5+Math.random());scene.add(smoke);skyBursts.push({m:smoke,life:1.8,initialLife:1.8,smoke:true});}
 if(b.life<=0){const p=b.car.root.position;emitImpact(p.x,1.1,p.z,125,1.2);blast(p.x,1.2,p.z,3.3);ignite(p.x,1,p.z);sound('car');b.car.destroyed=true;b.car.burning=0;vehiclePoolStats.explodedRemoved++;if(b.driver)scene.remove(b.driver);burningVehicles.splice(i,1);}
}
 for(let wi=crashedWrecks.length-1;wi>=0;wi--){
  const w=crashedWrecks[wi];w.life-=dt;w.smokeTimer-=dt;
  if(w.smokeTimer<=0){w.smokeTimer=.55;const sp=w.root.position;skyBursts.push({m:smokePuff(sp.x+(Math.random()-.5)*.8,sp.y+.6,sp.z+(Math.random()-.5)*.8,1.2),life:1.6,initialLife:1.6,smoke:true});}
  if(w.life<=0){scene.remove(w.root);crashedWrecks.splice(wi,1);}
 }
}
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
 const endZ=z>BROAD_CENTER?34:-2,sign=Math.sign(endZ-z)||1;
 const endX=car.turnAt+car.dir*5;
 // Cubic approach: initial tangent faces down the road, the exit tangent
 // faces across it. Sampled once when the car enters the intersection.
 const p0=new THREE.Vector3(x,y,z),p1=new THREE.Vector3(x+car.dir*6,y,z);
 const p2=new THREE.Vector3(endX,y,endZ-sign*8),p3=new THREE.Vector3(endX,y,endZ);
 const curve=new THREE.CubicBezierCurve3(p0,p1,p2,p3);
 return Array.from({length:20},(_,i)=>curve.getPoint((i+1)/20));
}
function updateVehicleRoute(car,dt){if(car.burning)return true;
 if(car.crossStreet){
  car.root.position.z+=car.crossDir*dt*car.speed;
  car.root.rotation.y=car.crossDir<0?-Math.PI/2:Math.PI/2;
  if(car.crossDir<0?car.root.position.z<-2:car.root.position.z>34){recycleCar(car);car.life=0;}
  return true;
 }
 if(car.turnPath?.length){const target=car.turnPath[0],delta=target.clone().sub(car.root.position);const distance=delta.length();if(distance<.75){car.turnPath.shift();if(!car.turnPath.length){car.crossStreet=true;car.turning=false;car.turnPath=null;car.turnAt=null;car.crossDir=car.root.position.z>BROAD_CENTER?1:-1;car.speed=Math.max(car.speed,6.0);car.root.rotation.y=car.crossDir<0?-Math.PI/2:Math.PI/2;return true;}}else{vehicleYawTowards(car,Math.atan2(-delta.z,delta.x),dt);car.root.position.addScaledVector(delta,Math.min(distance,dt*car.speed)/distance);}return true;}
 if(car.turnAt!==null&&!car.turning&&(car.turnAt-car.root.position.x)*car.dir<1.6&&(car.turnAt-car.root.position.x)*car.dir> -2){
  if((wave>=6||hp<75)&&!car.emergency&&!car.police){car.turnAt=null;return false;}
  car.turning=true;car.turnPath=curvedIntersectionPath(car);return true;
 }
 if(car.laneChangeAt!==null&&!car.laneChanged&&(car.laneChangeAt-car.root.position.x)*car.dir<1){car.laneChanged=true;const safe=choosePassingLane(car,cars,craters,{allowWithoutLeader:true});if(safe!==null)car.laneZ=safe;}
 return false;
}

// Roadside parked cars: impacted separately, and restored on game restart.
const parkedCars=[];
const parkedMaterials=[0x596d79,0x9aaca7,0x444750,0xa69b90,0x963c36].map(vehicleMaterial);
for(const [i,x,z] of [[0,-43,7.3],[1,-10,7.3],[2,26,7.3],[3,-31,25.8],[4,34,25.8],[0,70,25.8]]){
 const root=new THREE.Group();root.position.set(x,-.35,z);if(z>BROAD_CENTER)root.rotation.y=Math.PI;scene.add(root);
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
// Advance a routed truck along mapped road segments without teleporting or
// entering a damaged road cavity. Returning uses the same visited waypoints.
function followResponderRoute(c,dt){
 const goal=c.serviceRoute?.[0];
 if(!goal)return false;
 const p=c.root.position,dx=goal.x-p.x,dz=goal.z-p.z,distance=Math.hypot(dx,dz);
 if(distance<.15){p.x=goal.x;p.z=goal.z;c.serviceRoute.shift();if(!c.serviceReturning)c.serviceTrail.push(goal);return !!c.serviceRoute.length;}
 const step=Math.min(distance,dt*6.5),nx=p.x+dx*step/distance,nz=p.z+dz*step/distance;
 if(craters.some(q=>!q.waterOnly&&q.life>0&&Math.hypot(nx-q.x,nz-q.z)<q.radius+1.8)){c.speed=0;return true;}
 p.x=nx;p.z=nz;vehicleYawTowards(c,Math.atan2(-dz,dx),dt);c.speed=6.5;
 return true;
}
function fireTruckService(c,dt){
 if(!c.fireTruck||c.frozen||c.stun>0||c.exiting)return;
 const p=c.root.position;
 if(c.serviceDeparture>0){c.serviceDeparture-=dt;c.serviceStop=true;c.speed=0;return;}
 if(c.serviceTarget&&!schoolFire.includes(c.serviceTarget)){
  c.serviceTarget=null;c.servicePlan=null;
 }
 if(!c.serviceTarget&&c.serviceTrail?.length&&!c.serviceReturning){
  c.serviceReturning=true;c.serviceRoute=[...c.serviceTrail].reverse();
 }
 if(c.serviceReturning){
  c.routing=true;c.serviceStop=true;
  if(followResponderRoute(c,dt))return;
  c.serviceReturning=false;c.serviceTrail=[];c.serviceRoute=null;c.routing=false;c.serviceStop=false;
  c.root.rotation.y=c.dir<0?Math.PI:0;c.laneZ=c.originalLane;return;
 }
 if(!c.serviceTarget){
  let best=null;
  c.servicePlanDelay=Math.max(0,(c.servicePlanDelay??0)-dt);
  if(c.servicePlanDelay===0){
   c.servicePlanDelay=.5;
  for(const f of schoolFire){
   if(cars.some(other=>other!==c&&!other.destroyed&&!other.frozen&&other.fireTruck&&other.serviceTarget===f))continue;
   const plan=planResponderRoute(p,c.dir,c.originalLane,f.root.position,c.ladder?38:30);
   if(plan&&(!best||plan.cost<best.plan.cost))best={f,plan};
  }
  }
  c.serviceTarget=best?.f??null;c.servicePlan=best?.plan??null;c.serviceProgress=0;
 }
 if(!c.serviceTarget){
  c.serviceStop=false;c.routing=false;c.serviceEntryX=null;
  if(c.root.userData.fireCrew)c.root.userData.fireCrew.visible=false;
  if((wave===15||blockShield>0)&&Math.abs(p.x)<70){
   const monitorSource=c.root.localToWorld(new THREE.Vector3(c.ladder?2:1.28,c.ladder?3.8:1.45,1.1));
   cinematicFX.water(monitorSource,new THREE.Vector3(p.x+c.dir*16,6+Math.sin(elapsed*2)*2,-4),c.ladder?.16:.12);
  }
  return;
 }
 const pos=c.serviceTarget.root.position,plan=c.servicePlan;
 c.serviceEntryX=plan.entryX;
 if(!c.serviceTrail?.length&&!c.serviceRoute){
  const ahead=(plan.entryX-p.x)*c.dir;
  if(ahead>3){c.serviceStop=false;c.routing=false;if(c.root.userData.fireCrew)c.root.userData.fireCrew.visible=false;return;}
  if(ahead<-4){c.serviceTarget=null;c.servicePlan=null;c.serviceEntryX=null;c.serviceStop=false;c.routing=false;return;}
  if(plan.waypoints.length){
   c.serviceTrail=[{x:p.x,z:p.z}];c.serviceRoute=plan.waypoints.slice();
  }
 }
 if(c.serviceRoute?.length){c.routing=true;c.serviceStop=true;if(followResponderRoute(c,dt))return;}
 if(!hoseReach(p,pos,c.ladder?38:30)){
  c.serviceTarget=null;c.servicePlan=null;c.serviceEntryX=null;c.serviceStop=false;return;
 }
 c.routing=!!c.serviceTrail?.length;c.speed=0;
 c.serviceStop=true;ensureFireCrew(c).visible=true;c.serviceProgress+=dt;c.hoseTime-=dt;
 const dragonNear=c.hostile&&dragon.position.y<10&&Math.abs(dragon.position.x-c.root.position.x)<13&&Math.abs(dragon.position.z-c.root.position.z)<26;
 const target=dragonNear?dragon.position:pos;
 const source=c.root.localToWorld(new THREE.Vector3(c.ladder?2:1.28,c.ladder?3.8:1.45,1.1));
 cinematicFX.water(source,target,c.ladder?.16:.12);
 if(!dragonNear){
  c.serviceTarget.suppression+=dt*(c.ladder?1.45:1.75);
  c.steamAudioTimer=(c.steamAudioTimer||0)-dt;
  if(c.steamAudioTimer<=0){
   c.steamAudioTimer=0.40+Math.random()*0.15;
   sound('steam',{x:pos.x});
  }
  if(performanceLab.isEnabled('particles')&&Math.random()<0.75){
   trailSmokePool.add(new THREE.Vector3(pos.x+(Math.random()-.5)*1.6,pos.y+0.8+Math.random()*1.8,pos.z+(Math.random()-.5)*0.8),0.38);
  }
 }else if(source.distanceTo(dragon.position)<22){if(waterDisable<=0)message('WATER SPRAY — BREATH STEAMING / 50% DAMAGE');waterDisable=Math.max(waterDisable,.8);}
 if(!dragonNear&&(c.serviceProgress>=1.8||(c.serviceTarget&&c.serviceTarget.suppression>=1.0))){
  if(c.serviceTarget&&schoolFire.includes(c.serviceTarget)){
   sound('steam',{x:pos.x});
   for(let sp=0;sp<6;sp++){
    trailSmokePool.add(new THREE.Vector3(pos.x+(Math.random()-.5)*2.5,pos.y+1.5+Math.random()*2,pos.z+(Math.random()-.5)*1.5),0.55);
   }
   fireGroup.remove(c.serviceTarget.root);
   schoolFire.splice(schoolFire.indexOf(c.serviceTarget),1);
   score+=50;
   message('🚒 PHILLY FIREFIGHTERS SUPPRESSED BUILDING FIRE! +50 PTS');
   sound('bonus');
  }
  // Replan only after returning to the Broad Street lane.
  c.serviceTarget=null;c.servicePlan=null;c.serviceEntryX=null;c.serviceProgress=0;c.serviceDeparture=.5;
  if(c.root.userData.fireCrew)c.root.userData.fireCrew.visible=false;
 }
}
function updateCars(dt){if(!trafficActive)return;carTimer-=dt;if(carTimer<=0){spawnCar();const chapter=wave<=5?1:wave<=10?2:wave<=14?3:4;const activeFireTrucks=cars.filter(c=>c.fireTruck).length;carTimer=schoolFire.length&&activeFireTrucks<Math.min(5,schoolFire.length)?0.5:(chapter<=2?0.20+Math.random()*0.24:0.55+Math.random()*0.75);if(hp<55||schoolFire.length>3)carTimer*=.65;}
 for(let i=cars.length-1;i>=0;i--){const c=cars[i];if(c.destroyed){recycleCar(c);cars.splice(i,1);continue;}if(c.burning)continue;
  if(c.exiting){c.root.position.x+=c.dir*Math.max(c.speed,22)*dt;if(Math.abs(c.root.position.x)>280){recycleCar(c);cars.splice(i,1);continue;}}
  if(c.ambulance){for(let pi=crowd.length-1;pi>=0;pi--){const p=crowd[pi];if(p.down>0&&Math.abs(p.g.position.x-c.root.position.x)<4&&Math.abs(p.g.position.z-c.root.position.z)<20){scene.remove(p.g);crowd.splice(pi,1);score+=40;message('AMBULANCE RESCUE +40');break;}}}c.stun=Math.max(0,c.stun-dt);if(c.fireTruck)fireTruckService(c,dt);if(c.stun===0&&!c.frozen&&!c.routing&&!c.exiting){
  const obstruction=craters.find(q=>!q.waterOnly&&q.life>0&&Math.abs(q.x-c.root.position.x)<q.radius+18&&Math.abs(q.z-c.root.position.z)<q.radius+2.8&&((q.x-c.root.position.x)*c.dir)>-1.5);
   if(obstruction&&!c.crossStreet&&!c.turnPath?.length&&!c.rearStreet){
    c.hazardLights=true;
    c.evadingCrater=true;
    if(!c.hasSkidded){
     c.hasSkidded=true;
     sound('skid',{volume:0.32,pitch:1.15});
     c.speed=Math.max(1.8,c.speed*0.52);
    }
    // No free lateral steering across opposing lanes. The gap-checked
    // lane planner below chooses the only allowed detour.
    c.overtakeUntil=elapsed+5.0;
   }else if(c.evadingCrater&&!c.crossStreet&&!c.turnPath?.length&&!c.rearStreet){
    c.evadingCrater=false;
    c.hasSkidded=false;
    c.laneZ=c.dir>0?BROAD_LANES[1]:BROAD_LANES[2];
    c.hazardLights=false;
   }
  if(obstruction&&!c.crossStreet&&!c.turnPath?.length&&!c.rearStreet){
   c.hazardLights=true;
   if(!c.rearStreet&&!c.emergency){
    const detour=choosePassingLane(c,cars,craters,{allowWithoutLeader:true});
    if(detour!==null){
     c.laneZ=detour;c.overtakeUntil=elapsed+4.5;
    }
   }
  }
  if(!c.crossStreet&&!c.turnPath?.length&&Math.abs(c.root.position.z-c.laneZ)>0.05){
   const latError=c.laneZ-c.root.position.z;
   const steerRate=obstruction?4.2:2.4;
   c.root.position.z+=Math.sign(latError)*Math.min(Math.abs(latError),dt*steerRate);
   c.steerAngle=(c.steerAngle||0)+Math.sign(latError)*0.14;
  }
  const closeCrater=craters.find(q=>!q.waterOnly&&q.life>0&&Math.abs(q.x-c.root.position.x)<q.radius+8&&Math.abs(q.z-c.root.position.z)<q.radius+1.5&&((q.x-c.root.position.x)*c.dir)>-0.5);
  const blockedAhead=closeCrater&&Math.abs(c.root.position.z-closeCrater.z)<closeCrater.radius+0.8;
  const isBlockadeStop=(wave>=6)&&!c.emergency&&!c.crossStreet&&!c.rearStreet&&CROSS_STREET_X.some(cx=>Math.abs(c.root.position.x-cx)<13);
  const targetSpeed=Math.min(trafficTarget(c,cars,crowd,trafficLightRed||isBlockadeStop,blockedAhead||isBlockadeStop,elapsed),laneChangeSpeedCap(c));
  const oldSpeed=c.speed;c.speed=advanceSpeed(c.speed,targetSpeed,dt,c.emergency?2.8:1.8,5.8);
  c.braking=c.speed<oldSpeed-.015||c.speed<.25;
  const hazardOn=c.hazardLights&&(Math.sin(elapsed*16.0)>0);
  for(const lamp of c.root.userData.brakes||[])lamp.material=(c.braking||hazardOn)?c.root.userData.tailBright:c.root.userData.tailDim;
  // A fully obstructed road stops traffic rather than making unsafe U-turns.
  if(!c.emergency&&!c.rearStreet&&!c.turnPath?.length&&!c.routing&&c.stun===0&&!(c.windSettle>0)&&!chapterSettlement.active&&!obstruction){
   const passing=choosePassingLane(c,cars,craters);
   if(passing!==null&&elapsed>=(c.overtakeUntil||0)){
     c.laneZ=passing;c.overtakeUntil=elapsed+6;c.laneChangeTime=0;
   }
  }
// Steer around other vehicles to prevent clipping:
   for(let j=cars.length-1;j>=0;j--){
    if(j===i)continue;
    const other=cars[j];if(other.burning||other.destroyed)continue;
    const ahead=(other.root.position.x-c.root.position.x)*c.dir;
    const latDiff=c.root.position.z-other.root.position.z;
    const absLat=Math.abs(latDiff);
    if(ahead>0&&ahead<7.5&&absLat<2.4){
     c.speed=Math.min(c.speed,Math.max(0,other.speed*0.88-(7.5-ahead)*0.35));
     c.braking=true;
     if(ahead<5.0&&other.speed<1.2&&!c.rearStreet&&!c.emergency){
      const passing=choosePassingLane(c,cars,craters);
      if(passing!==null)c.laneZ=passing;
     }
    }
    if(!c.crossStreet&&!c.turnPath?.length&&Math.abs(c.root.position.x-other.root.position.x)<4.6&&absLat<2.3){
     const steerNudge=latDiff>=0?1.2:-1.2;
     c.root.position.z+=steerNudge*dt*2.5;
     c.steerAngle=(c.steerAngle||0)+steerNudge*0.12;
     if(ahead>-2.5&&ahead<2.5){
      c.bumpRoll=(Math.random()-.5)*.18;
      c.bumpImpulse=Math.max(c.bumpImpulse||0,.5);
     }
    }
   }
   if(!c.crossStreet&&!c.turnPath?.length){
    if(c.laneZ>-20){const lanes=c.dir>0?BROAD_LANES.slice(0,2):BROAD_LANES.slice(2);c.root.position.z=THREE.MathUtils.clamp(c.root.position.z,lanes[0]-.6,lanes[1]+.6);}
    else if(c.laneZ===-37){c.root.position.z=THREE.MathUtils.clamp(c.root.position.z,-39.0,-35.0);}
    else if(c.laneZ===-88){c.root.position.z=THREE.MathUtils.clamp(c.root.position.z,-90.0,-86.0);}
    else if(c.laneZ===-112){c.root.position.z=THREE.MathUtils.clamp(c.root.position.z,-114.0,-110.0);}
   }
if(!updateVehicleRoute(c,dt))c.root.position.x+=c.dir*c.speed*dt*(c.windRecovery>0?.18:1);
  if(c.root.userData.ladder)c.root.userData.ladder.rotation.z=THREE.MathUtils.lerp(c.root.userData.ladder.rotation.z,c.serviceStop?.35:0,Math.min(1,dt*.8));
  if(!c.turnPath?.length&&!c.crossStreet){const laneZ=c.laneZ;const error=laneZ-c.root.position.z;const lateralStep=Math.min(1,dt*(c.windRecovery>0?.05:c.windSettle>0?.48:1.65));c.root.position.z+=error*lateralStep;vehicleYawTowards(c,(c.dir<0?Math.PI:0)+laneChangeYaw(error,c.dir,c.speed),dt);c.laneChangeTime=(c.laneChangeTime||0)+dt;}
  // RC158: Vehicle tire water spray splash when driving through wet asphalt/puddle zones
  if(c.speed>1.5&&c.stun===0){
   for(const cr of craters){
    if(cr.geyserGroup&&Math.hypot(c.root.position.x-cr.x,c.root.position.z-cr.z)<cr.radius*1.45){
     if(Math.random()<dt*18.0){
      _craterV1.set(c.root.position.x-c.dir*1.2,0.15,c.root.position.z+(Math.random()-0.5)*1.2);
      _craterV2.set(-c.dir*0.4+Math.random()*0.2,0.85,(Math.random()-0.5)*1.4).normalize();
      cinematicFX.waterSpray?.(_craterV1,_craterV2,dt,{rate:2,power:0.65});
      streetWaterRunoff?.triggerRipple?.(c.root.position.x,c.root.position.z,0.45);
     }
     break;
    }
   }
  }
 }if(!c.frozen)c.life-=dt;c.blink+=dt;if(c.beacon)c.beacon.material=(Math.floor(c.blink*7)%2)?redLamp:blueLamp;
  if(c.hostile&&c.police&&!c.frozen&&c.stun===0&&c.speed<.5&&Math.abs(c.root.position.x)<25){
   c.attackTimer-=dt;if(c.attackTimer<=0){c.attackTimer=c.police?2.8:1.6;
    const fireTarget=!c.police&&schoolFire.length?schoolFire[Math.floor(Math.random()*schoolFire.length)]:null;
    const isDragonTarget=c.root.position.distanceTo(dragon.position)<24;
    if(isDragonTarget||fireTarget){
     const origin=c.root.position.clone().add(new THREE.Vector3(0,1.3,0));
     const hoseTarget=(!c.police&&!isDragonTarget&&fireTarget)?fireTarget.root.getWorldPosition(new THREE.Vector3()):dragon.position.clone();
     if(c.police){
      const projectile=new THREE.Mesh(new THREE.SphereGeometry(0.16,7,5),new THREE.MeshBasicMaterial({color:0xffdf73,transparent:true,opacity:.9}));
      projectile.position.copy(origin);scene.add(projectile);
      shots.push({mesh:projectile,vel:hoseTarget.clone().sub(origin).normalize().multiplyScalar(17),target:hoseTarget.clone(),life:2.4,hostile:isDragonTarget,water:false});
     }else{
      // RC165: Fast, white, translucent particle water stream (zero dynamic sphere meshes)
      cinematicFX.water(origin,hoseTarget,0.18);
      const waterDummy=new THREE.Object3D();
      waterDummy.position.copy(origin);
      const aimDir=hoseTarget.clone().sub(origin).normalize();
      shots.push({mesh:waterDummy,vel:aimDir.multiplyScalar(26),target:hoseTarget.clone(),life:1.6,hostile:isDragonTarget,water:true,fireTarget:fireTarget&&!isDragonTarget?fireTarget:null});
     }

    }
   }
  }
  animateVehicleSteering(c,dt);
  if(c.emergency&&!c.frozen&&c.stun===0&&c.blink>2.4){
   const relX=c.root.position.x-cameraScrollX;
   const movingTowards=(relX*c.dir)<0;
   const doppler=movingTowards?1.12:0.88;
   sound('siren',{x:c.root.position.x,doppler});
   c.blink=0;
  }
  if(c.recycled){cars.splice(i,1);continue;}
  if(c.life<=0&&!c.turning&&!c.turnPath?.length&&!c.emergency){
   const exitCross=CROSS_STREET_X.find(x=>Math.abs(c.root.position.x-x)<22);
   if(exitCross!==undefined)c.turnAt=exitCross;
  }
  if(!c.frozen&&((Math.abs(c.root.position.x)>280&&!c.routing&&!c.serviceTarget)||(c.crossStreet&&(c.crossDir<0?c.root.position.z<-135:c.root.position.z>135))||(c.turning&&c.turnPath?.length===0&&Math.abs(c.root.position.z)>120))){recycleCar(c);cars.splice(i,1);}
 }
}
// Dynamic arcade city activity. Stylized, not real-world simulation.
const crowdRenderer=createCrowdRenderer(THREE,scene);
// QA can compare the same crowd with per-component draws.
const useCrowdBatch=!(schoolQA&&new URLSearchParams(location.search).get('crowdRender')==='individual');
const helicopters=[],crowd=[],gasClouds=[];let ambulanceTimer=10;let helicopterTimer=8,crowdTimer=0,gasCooldown=0,dragonLives=3,invulnerable=0,waterDisable=0;
const heliBody=material(0xe3c23d),heliGlass=material(0x32485c),rotorMat=material(0x252b33),greenGas=new THREE.MeshBasicMaterial({color:0x6cdb4b,transparent:true,opacity:.4,depthWrite:false});
const helicopterLightPool=createStableLightPool(scene,3,()=>new THREE.SpotLight(0xe8f4ff,0,55,Math.PI/5,.75,1.5));
const helicopterModels=new Map();
const heliTargetScratch=new THREE.Vector3(),heliMountScratch=new THREE.Vector3(),heliAimScratch=new THREE.Vector3(),heliLocalTargetScratch=new THREE.Vector3(),heliLocalAimScratch=new THREE.Vector3(),heliMountOffset=new THREE.Vector3(1.35,-.62,0),heliUpVector=new THREE.Vector3(0,-1,0),heliForwardScratch=new THREE.Vector3();
function spawnHelicopter(forcedVariant=null){if(helicopters.length>=3)return;
 // Only one ICE pursuer can deploy an electrical stream at a time.
 if(wave>=6&&wave<=10&&helicopters.some(h=>h.role==='ice'&&!h.crashing))return;
 const variant=forcedVariant??(
  (helicopters.filter(h=>h.firefighting&&!h.crashing).length<2&&(schoolFire.length>0||wave<=3||Math.random()<0.45))?2:
  (wave>=6&&wave<=10?(schoolFire.length&&Math.random()<.5?2:1):
  (schoolFire.length&&!helicopters.some(h=>h.firefighting)?2:Math.floor(Math.random()*3)))
 );
 const cached=helicopterModels.get(variant)?.pop(),root=cached?.root||new THREE.Group();scene.add(root);root.rotation.set(0,0,0);root.visible=true;
 if(root.userData.searchlightGimbal)root.userData.searchlightGimbal.quaternion.identity();
 if(root.userData.searchlightCone)root.userData.searchlightCone.visible=false;
 const dir=Math.random()<.5?1:-1;root.position.set(dir>0?-83:83,17+Math.random()*10,7-Math.random()*13);
 const {rotor,tail,beacon,firefighting}=cached||buildHelicopter(THREE,root,variant);
 if(!cached)captureVehicleResources(THREE,root);
 root.scale.setScalar(variant===2?1.05:.9);root.rotation.order='YXZ';root.rotation.y=dir<0?Math.PI:0;
 const searchlight=helicopterLightPool.acquire();
 syncHelicopterSearchlight(root,searchlight);
 const searchlightPool=new THREE.Mesh(new THREE.CircleGeometry(3.6,16),new THREE.MeshBasicMaterial({color:0xdcf2ff,transparent:true,opacity:.32,depthWrite:false,side:THREE.DoubleSide,blending:THREE.AdditiveBlending}));
 searchlightPool.rotation.x=-Math.PI/2;searchlightPool.visible=false;scene.add(searchlightPool);

 helicopters.push({disorientTime:0,contactTime:0,iceCooldown:2.0,electric:null,role:wave>=6&&wave<=10&&!firefighting?'ice':firefighting?'fire':variant===1?'police':'news',loiterTime:14+Math.random()*10,variant,firefighting,waterClock:0,beacon,searchlight,searchlightPool,root,dir,rotor,tail,speed:5+Math.random()*3,heading:dir>0?0:Math.PI,vel:new THREE.Vector3(),pitch:0,roll:0,bumpTime:0,bumpRoll:0,bumpPitch:0,bldgBumpCooldown:0,dragonBumpCooldown:0,evasion:0,life:52,crashing:false,v:0,attackTimer:1.5,gasHit:false});
}
function crashHelicopter(h,gas=false){if(h.crashing)return;if(h.electric)h.electric.visible=false;h.contactTime=0;h.crashing=true;h.gasHit=gas;h.v=0;
 if(gas){h.gooResources=[];h.root.traverse(o=>{if(o.isMesh&&o.material?.color){o.material=o.material.clone();h.gooResources.push(o.material);o.material.color.setHex(0x69d64b);o.material.roughness=.18;}});for(let k=0;k<14;k++){const goo=new THREE.Mesh(new THREE.SphereGeometry(.18,8,6),new THREE.MeshStandardMaterial({color:0x74a92e,roughness:.16}));goo.position.set((Math.random()-.5)*3,(Math.random()-.5),Math.random()<.5?-.8:.8);goo.scale.set(1,.5+Math.random()*2,.4);h.gooResources.push(goo.geometry,goo.material);h.root.add(goo)}}
 emitImpact(h.root.position.x,h.root.position.y,h.root.position.z,85,.8);sound('crash');}
// Preview 13: a sustained three-dimensional electric arc, not a moving bullet.
// One reusable line mesh and one reusable bright core per ICE helicopter; no per-frame allocations of graphics objects.
const electricCoreGeometry=new THREE.CylinderGeometry(.085,.085,1,7),electricCoreMaterial=new THREE.MeshBasicMaterial({color:0xa8efff,transparent:true,opacity:.68,depthWrite:false});
const electricArcMaterial=new THREE.LineBasicMaterial({color:0x55cbff,transparent:true,opacity:.95,depthWrite:false});
const electricFrom=new THREE.Vector3(),electricTo=new THREE.Vector3(),electricMid=new THREE.Vector3();
function retireHelicopter(h,allowReuse=true){
 if(h.retired)return;
 h.retired=true;
 disposeHelicopterElectric(h);scene.remove(h.root);
 for(const resource of new Set(h.gooResources||[]))resource.dispose();
 h.gooResources=[];
 helicopterLightPool.release(h.searchlight);
 h.searchlight=null;
 if(allowReuse&&!h.gasHit&&!h.crashing&&!h.crashed){
  const pool=helicopterModels.get(h.variant)||[];
  if(pool.length<3){pool.push(h);helicopterModels.set(h.variant,pool);return;}
 }
 releaseVehicleResources(h.root);
}
function disposeHelicopterElectric(h){
 if(h.searchlightPool){scene.remove(h.searchlightPool);h.searchlightPool.geometry.dispose();h.searchlightPool.material.dispose();h.searchlightPool=null;}
 if(!h.electric)return;scene.remove(h.electric);h.electric.children[0].geometry.dispose();h.electric=null;
}
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
function spawnCrowd(forcedX=null,forcedZ=null){
 const chapter=wave<=5?1:wave<=10?2:wave<=14?3:4;
 const crowdCap=chapter===1?64:chapter===2?56:48;
 if(crowd.length>=crowdCap&&forcedX===null)return;
 const count=forcedX!==null?1:Math.min(4,crowdCap-crowd.length);
 for(let i=0;i<count;i++){
  const g=buildPerson(THREE,Math.floor(Math.random()*12));
  if(useCrowdBatch)crowdRenderer.register(g);
  scene.add(g);
  const jaywalker=forcedX===null&&Math.random()<.18,crossing=forcedX===null?(i<2||jaywalker):CROSS_STREET_X.some(cx=>Math.abs(cx-forcedX)<.5),fromFar=forcedZ!==null?forcedZ>BROAD_CENTER:Math.random()<.5;
  const isRear=forcedZ!==null&&forcedZ<-20;
  let x,z;
  if(forcedX!==null&&forcedZ!==null){
   x=forcedX;z=forcedZ;
  }else if(isRear){
   x=(Math.random()-.5)*130;z=Math.random()<.5?-34:-40;
  }else if(crossing&&!jaywalker){
   x=CROSS_STREET_X[Math.floor(Math.random()*CROSS_STREET_X.length)];z=fromFar?29:4;
  }else{
   x=(Math.random()-.5)*150;z=Math.random()<.55?4:29;
  }
  g.position.set(x,0,z);
  g.rotation.y=isRear?(Math.random()<.5?0:Math.PI):crossing?(fromFar?Math.PI:0):Math.PI/2;
  crowd.push({g,dx:crossing?0:(Math.random()<.5?-1:1),dz:crossing?(fromFar?-1:1):0,crossing,jaywalker,isRear,phase:Math.random()*6,walkSpeed:1.7+Math.random()*.8,life:60+Math.random()*25,down:0,vy:0,panic:0,panicDir:Math.random()<.5?-1:1});
 }
}
function panicCrowdAt(x,z,radius=35){
 warnCrowd(x,z,radius);
 for(const p of crowd){
  const distSq=(p.g.position.x-x)**2+(p.g.position.z-z)**2;
  if(distSq<radius*radius){
   p.panic=Math.max(p.panic||0,4.5+Math.random()*2.5);
   p.panicDir=p.g.position.x<x?-1:1;
   p.walkSpeed=6.5+Math.random()*3.2;
   p.life=Math.max(p.life,8);
   if(distSq<100&&p.down<=0&&Math.random()<.65){
    p.down=1.4;p.vy=4.2;
   }
  }
 }
}
function seedChapterTrafficAndCrowd(chapterNum){
 const carTarget=chapterNum===1?18:chapterNum===2?16:chapterNum===3?14:12;
 if(chapterNum===2){if(!cars.some(c=>c.bus))spawnCar(45,BROAD_LANES[1],1,'bus');if(!cars.some(c=>c.police))spawnCar(22,BROAD_LANES[0],1,'police');}
 for(let n=cars.length;n<carTarget;n++){
  const dir=Math.random()<.5?1:-1;
  const isRear=Math.random()<.24;
  const isCross=!isRear&&Math.random()<.16;
  const laneZ=dir>0?(Math.random()<.5?BROAD_LANES[0]:BROAD_LANES[1]):(Math.random()<.5?BROAD_LANES[2]:BROAD_LANES[3]);
  const posX=isCross?CROSS_STREET_X[Math.floor(Math.random()*CROSS_STREET_X.length)]:(Math.random()-.5)*220;
  spawnCar(posX,laneZ,dir);
 }
 const crowdTarget=chapterNum===1?38:chapterNum===2?32:chapterNum===3?28:36;
 while(crowd.length<crowdTarget){
  const isCross=Math.random()<.25;
  const z=Math.random()<.55?4:29;
  const x=isCross?CROSS_STREET_X[Math.floor(Math.random()*CROSS_STREET_X.length)]:(Math.random()-.5)*150;
  spawnCrowd(x,z);
 }
}
function freezeResponder(c){if(c.frozen||(!c.emergency&&!c.trainingCop))return false;c.frozen=true;c.stun=999;c.speed=0;c.frozenMaterials=new Map();c.root.traverse(o=>{if(o.isMesh&&o.material&&!Array.isArray(o.material)){c.frozenMaterials.set(o,o.material);o.material=o.material.clone();o.material.color?.setHex(0x60e642);}});score+=65;return true;}
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
 dragonStun=1.8;iceGroundHits=0;invulnerable=3.5;recoveryLift=0;dragonGroundImpact=false;
 emitImpact(dragon.position.x,dragon.position.y,dragon.position.z,55,.7);
 sound('warning');message(reason+' — ELECTRICAL SHOCK! TAP KEYS TO BREAK FREE');
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
function hurtDragon(reason){if(dragonStun>0||invulnerable>0||!active)return;if(blockShield>0||elapsed<purpleRamUntil){purpleShieldImpact=1.0;sound('satShield');flashAt(dragon.position.x,dragon.position.y+0.65,dragon.position.z,2.5);return;}dragonLives--;invulnerable=2.2;emitImpact(dragon.position.x,dragon.position.y,dragon.position.z,90,.6);sound('crash');message(reason+' · DRAGON LIVES '+dragonLives);if(dragonLives<=0)gameOver();}
function activateBlock(){
 if(rallyRecoveryOpen()){
  if(!rallyShieldQueued&&blockCharge>=25){
   blockCharge-=25;
   rallyShieldQueued=true;
   updateBlockButton();
  }
  return;
 }
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
function rallyRecoveryOpen(){
 return rallyRecoveryChoice&&active&&!paused&&remaining===0&&between>0&&wave<15&&
  !isChapterEnd(wave)&&!meteors.some(m=>!m.grounded);
}
function updateBlockButton(){
 const b=document.getElementById('call-block');
 if(!b)return;
 if(rallyRecoveryOpen()){
  b.disabled=rallyShieldQueued||blockCharge<25;
  b.textContent=rallyShieldQueued?'SHIELD QUEUED':`BUY SHIELD 25% · ${Math.floor(blockCharge)}%`;
  b.title='Spend 25 support for nine seconds of school protection at the next wave';
  return;
 }
 if(rallyRecoveryChoice)b.title='Chapter-specific neighborhood intervention';
 b.disabled=blockCharge<100||!active||paused;
 b.textContent=blockScene>0?'🛡 BLOCK RESPONDING':`📣 CALL THE BLOCK ${Math.floor(blockCharge)}%`;
}
document.getElementById('call-block')?.addEventListener('click',activateBlock);

// Chapter 3 uses independently managed military units; no changes to civilian vehicle pools.
const militaryOccupation=createMilitaryOccupation({scene,dragon,getWave:()=>wave,
 onDragonHit:reason=>hurtDragon(reason),
 onMeteorHit:meteor=>removeMilitaryInterceptedMeteor(meteor),
 onBlast:(x,y,z,r)=>blast(x,y,z,r),onMessage:message,
 getCollateralStructures:()=>[neighborhood.school,...neighborhood.targetBuildings],
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
distantVisual.material.color.setHex(0xffffff);
const flamingDistantMeteorMaterial=distantVisual.material.clone();
flamingDistantMeteorMaterial.color.setHex(0xffbb77);
function neighborhoodHealth(){
 const buildings=neighborhood.targetBuildings;
 return Math.round((1-buildings.reduce((sum,b)=>sum+b.damage,0)/Math.max(1,buildings.length))*100);
}
let shownBlockHealth;
function updateNeighborhoodGauge(health=neighborhoodHealth()){
 if(health===shownBlockHealth)return;
 shownBlockHealth=health;
 document.getElementById('blockhp').textContent=health+'%';
 document.getElementById('blockbar').style.width=health+'%';
 document.getElementById('block-wire').style.opacity=Math.max(.15,health/100);
 neighborhood.setDistantHealth(health);
}
function escalateBackgroundNeighborhood(dt,random=Math.random){
 if(freeFlightMode)return;
 const fronts=neighborhood.targetBuildings.filter(b=>!b.background);
 const frontDamage=fronts.reduce((sum,b)=>sum+b.damage,0)/Math.max(1,fronts.length);
 const health=neighborhoodHealth();
 updateNeighborhoodGauge(health);
 const blockDamage=1-health/100;
 backgroundDamageTimer-=dt;
 if(backgroundDamageTimer>0)return;
 // Rapid continuous background meteor strikes crashing into background rowhouses!
 backgroundDamageTimer=6+random()*4;
 const district=neighborhood.longRange;
 const backs=neighborhood.targetBuildings.filter(b=>b.background&&b.damage<1);
 const count=1;
 for(let i=0;i<count&&distantStreaks.length<65;i++){
  const near=backs.length&&random()<0.75?backs[Math.floor(random()*backs.length)]:null;
  const visible=true;
  const sampleZ=near?near.z:(-35-random()*120);
  const far=near?null:district.targetAt(cameraScrollX+(random()-.5)*140,sampleZ);
  if(!near&&!far)continue;
  const point=near?new THREE.Vector3(near.x,near.h*.65,near.z):
   district.root.localToWorld(new THREE.Vector3(far.x,far.y,far.z));
  const sprite=new THREE.Sprite(distantVisual.material);
  sprite.position.copy(point).add(new THREE.Vector3(-25,95,0));
  sprite.scale.set(3.2,14,1);
  scene.add(sprite);
  distantStreaks.push({sprite,life:1.4,landing:{point,near,far,strength:0.45+blockDamage*0.55}});
 }
}

function updateDistantMeteors(dt){
 const chapter=currentChapter();
 const chapterIndex=CAMPAIGN_CHAPTERS.indexOf(chapter);
 const nextChapterStart=CAMPAIGN_CHAPTERS[chapterIndex+1]?.start||16;
 const waveSpan=Math.max(1,nextChapterStart-chapter.start);
 const waveProgress=THREE.MathUtils.clamp((wave-chapter.start)/waveSpan,0,1);
 // Distant disaster intensity follows the player's actual neighborhood damage
 // as well as chapter progression; capped to preserve foreground readability.
 const foregroundBuildings=neighborhood.targetBuildings.filter(b=>!b.background);
 const damageFraction=foregroundBuildings.length
  ?foregroundBuildings.reduce((sum,b)=>sum+THREE.MathUtils.clamp(b.damage,0,1),0)/foregroundBuildings.length:0;
 const health=neighborhoodHealth();
 const skylineCrisis=health<20?2:health<50?1:0;
 const chapterRamp=(wave===15?1.85:(.65+waveProgress*1.55))*(1+damageFraction*1.15)*(1+skylineCrisis*.45);
 skylineEventTimer-=dt;
 if(skylineEventTimer<=0){skylineEventTimer=Math.max(.35,(2.65-wave*.06)/chapterRamp)+Math.random()*.85;
  // No timer-only explosions: every background blast follows a visible impact.
 }
 distantTimer-=dt;
 const streakCap=Math.min(58,Math.round(18+wave*2+waveProgress*18+(wave===15?8:0)));
 if(distantTimer<=0&&distantStreaks.length<streakCap){
  distantTimer=Math.max(.06,(.78/(1+wave*.18))/chapterRamp)+Math.random()*.18;
  // Flaming meteors ONLY streak across the background when neighborhood health is <= 75%
  const allowFlaming=health<=75;
  const flaming=allowFlaming&&Math.random()<(health<20?.91:health<50?.67:.42);
  const sprite=new THREE.Sprite(flaming?flamingDistantMeteorMaterial:distantVisual.material);
  const x=(Math.random()-.5)*220,y=56+Math.random()*44;
  sprite.position.set(x,y,15);const size=2.1+Math.random()*1.4;
  sprite.scale.set(size,7.5+Math.random()*5.5,1);skyline.add(sprite);
  const target=skylineBackdrop.targetPoint(x);
  const travel=2.0+Math.random()*.8;
  const from=sprite.position.clone();
  const to=target?skyline.worldToLocal(target.clone()):new THREE.Vector3(x+20,-10,15);
  distantStreaks.push({sprite,life:travel,travel,from,to,targetX:x,v:(16+Math.random()*14+waveProgress*5)*(flaming?skylineCrisis===2?2.6:1.9:1),impact:flaming||Math.random()<(.58+waveProgress*.25),flaming,waveProgress});
 }
 for(let i=distantStreaks.length-1;i>=0;i--){const s=distantStreaks[i];s.life-=dt;
  if(s.landing){
   const {point,near,far,strength}=s.landing;
   const remaining=Math.max(0,s.life)/1.8;
   s.sprite.position.copy(point);
   s.sprite.position.x-=20*remaining;s.sprite.position.y+=70*remaining;
   if(s.life<=0&&!freeFlightMode){
    if(near){
     northBroadModels.impactBuilding(near.id,point,5.5,strength);
     updateHud();
    }else neighborhood.longRange.strikeTarget(far.id,strength);
    const spectacle=backgroundImpactEffects(neighborhoodHealth());
    if(Math.random()<spectacle.fireChance)cinematicSkyExplosion(point.x,point.y,point.z,spectacle);
   }
  }else{
   const progress=1-Math.max(0,s.life)/s.travel;
   s.sprite.position.lerpVectors(s.from,s.to,progress);
   if(s.life<=0&&s.impact){
    const pos=s.sprite.position;
    skyline.updateWorldMatrix(true,false);
    const impact=skylineBackdrop.strikeNearest(s.targetX,1-health/100,s.flaming)||skyline.localToWorld(pos.clone());
    const baseEffects=backgroundImpactEffects(health);
    const towerEffects={...baseEffects,scale:baseEffects.scale*(s.flaming?skylineCrisis===2?2.2:1.55:0.8),fireChance:s.flaming?baseEffects.fireChance:0,mushroomChance:s.flaming?baseEffects.mushroomChance:0};
    cinematicSkyExplosion(impact.x,impact.y,impact.z,towerEffects);
    // Direct hit from flaming meteor below 20% health creates secondary burst
    if(s.flaming&&skylineCrisis===2)cinematicSkyExplosion(impact.x+(Math.random()-.5)*3,impact.y-13,impact.z,towerEffects);
    else if(s.flaming&&Math.random()<.22+s.waveProgress*.28)cinematicSkyExplosion(impact.x+(Math.random()-.5)*11,impact.y+2,impact.z,towerEffects);
    s.life=0;
   }
  }
  if(s.life<=0){s.sprite.removeFromParent();distantStreaks.splice(i,1);}
 }
}
const skyBurstGeometry=new THREE.PlaneGeometry(1,1);
const skyBurstMat=new THREE.MeshBasicMaterial({map:visualBank.images.flash,color:0xffc18e,transparent:true,opacity:.8,depthWrite:false,side:THREE.DoubleSide,blending:THREE.AdditiveBlending});
const skyBursts=[];let skylineEventTimer=3;
const skyBurstPool=[];
const skySmokePool=[];
function acquireSkyBurst(x,y,z,scale){
 let b=skyBurstPool.pop();
 if(!b){
  const m=new THREE.Mesh(skyBurstGeometry,skyBurstMat.clone());
  b={m,smoke:false};
 }
 b.m.position.set(x,y,z);
 b.m.scale.setScalar(scale);
 b.m.visible=true;
 b.m.material.opacity=.75;
 b.life=.8;b.initialLife=.8;b.scale=scale;
 scene.add(b.m);
 return b;
}
function acquireSkySmoke(x,y,z,scale,colorHex){
 let b=skySmokePool.pop();
 if(!b){
  const mat=skylineSmokeMat.clone();
  const m=new THREE.Sprite(mat);
  b={m,smoke:true};
 }
 b.m.position.set(x,y,z);
 b.m.scale.set(scale,scale*1.13,1);
 b.m.material.color.setHex(colorHex);
 b.m.material.opacity=.58;
 b.m.visible=true;
 b.life=7.5;b.initialLife=7.5;b.windThin=0;
 scene.add(b.m);
 return b;
}
function releaseSkyObject(b){
 scene.remove(b.m);
 b.m.visible=false;
 const pool=b.smoke?skySmokePool:skyBurstPool;
 const cap=b.smoke?64:32;
 if(pool.length<cap)pool.push(b);
 else b.m.material?.dispose();
}
function backgroundImpactEffects(health){
 const damage=1-THREE.MathUtils.clamp(health/100,0,1);
 return {fireChance:.38+.57*damage,mushroomChance:.04+.46*damage,scale:.8+1.9*damage};
}
function cinematicSkyExplosion(x,y,z,effects=backgroundImpactEffects(neighborhoodHealth())){
 if(skyBursts.length>=48)return;
 if(Math.random()<effects.mushroomChance&&skyBursts.length<36){
  for(let j=0;j<5;j++){
   const sx=x+(Math.random()-.5)*2.5,sy=y+j*3.6*effects.scale;
   const sw=(j<1?3.2:4.6+(j-1)*1.6)*effects.scale;
   const color=j<1?0xff9951:0x36383d;
   skyBursts.push(acquireSkySmoke(sx,sy,z,sw,color));
  }
 }
 skyBursts.push(acquireSkyBurst(x,y,z,effects.scale));
 if(skyBursts.length>48){
  const b=skyBursts.shift();
  releaseSkyObject(b);
 }
}
function updateSkyBursts(dt){
 for(let i=skyBursts.length-1;i>=0;i--){
  const b=skyBursts[i];
  b.life-=dt;
  if(b.smoke){
   b.m.position.y+=dt*9.5;
   const proximity=b.m.position.distanceTo(dragon.position);
   if(proximity<16){
    const strength=(1-proximity/16)*dt*(3.5+Math.abs(Math.sin(elapsed*9))*5.5);
    b.m.position.x+=(b.m.position.x-dragon.position.x>=0?1:-1)*strength;
    b.m.position.z+=(b.m.position.z-dragon.position.z>=0?1:-1)*strength*.4;
   }
   if(windActive){
    const rx=b.m.position.x-gustOrigin.x,ry=b.m.position.y-gustOrigin.y,rz=b.m.position.z-gustOrigin.z;
    const along=rx*gustDirection.x+ry*gustDirection.y+rz*gustDirection.z;
    const across=Math.sqrt(Math.max(0,rx*rx+ry*ry+rz*rz-along*along));
    if(along>0&&along<52&&across<10+along*.38){
     const strength=(1-across/(10+along*.38))*Math.max(0,1-along/70);
     b.m.position.addScaledVector(gustDirection,dt*10*strength);
     b.windThin=Math.min(.65,(b.windThin||0)+dt*.9*strength);
    }
   }
   b.m.scale.multiplyScalar(1+dt*.14);
   const altDissipate=Math.max(0.04,Math.pow(Math.max(0,1.0-(b.m.position.y-10)/75),1.4));
   b.m.material.opacity=Math.max(0,b.life/b.initialLife)*.48*altDissipate*(1-(b.windThin||0));
  }else{
   b.m.scale.setScalar(b.scale*(1+(1-b.life/.8)*5));
   b.m.material.opacity=Math.max(0,b.life/.8)*.75;
  }
  if(b.life<=0){
   releaseSkyObject(b);
   skyBursts.splice(i,1);
  }
 }
}
function disposeCrater(c){
 if(!c)return;
 if(c.mesh){scene.remove(c.mesh);c.mesh.geometry?.dispose();c.mesh.material?.dispose();}
 if(c.inner){scene.remove(c.inner);c.inner.geometry?.dispose();c.inner.material?.dispose();}
 if(c.ember&&!c.thermalGroup){scene.remove(c.ember);c.ember.geometry?.dispose();c.ember.material?.dispose();}
 if(c.rimMesh){scene.remove(c.rimMesh);c.rimMesh.traverse?.(o=>{o.geometry?.dispose();o.material?.dispose();});}
 if(c.bowlMesh){scene.remove(c.bowlMesh);c.bowlMesh.traverse?.(o=>{o.geometry?.dispose();o.material?.dispose();});}
 if(c.sootDecal){scene.remove(c.sootDecal);c.sootDecal.geometry?.dispose();c.sootDecal.material?.dispose();}
 if(c.thermalGroup){scene.remove(c.thermalGroup);c.thermalGroup.traverse(o=>{o.geometry?.dispose();o.material?.dispose();});}
 if(c.subwayGroup){
  for(const light of c.subwayGroup.userData.lights||[])explosionLightPool.release(light);
  scene.remove(c.subwayGroup);
  c.subwayGroup.traverse(o=>{o.geometry?.dispose();o.material?.dispose();});
 }
 if(c.geyserGroup){
  scene.remove(c.geyserGroup);
  c.geyserGroup.traverse(o=>{o.geometry?.dispose();o.material?.dispose();});
 }
}
const _craterV1=new THREE.Vector3(),_craterV2=new THREE.Vector3(),_craterV3=new THREE.Vector3();
function addCrater(x,z,radius=3,opts={}){
 // Broad Street corridor includes roadway, curbs, sidewalks, and flanking lanes (z: -10 to 52)
 const isBroadStreetCorridor=isBroadRoad(x,z);
 const mSzVal=opts.size||(radius*0.75);
 const isExtinction=opts.isExtinction||mSzVal>=13.0;
 const isTitanic=opts.isTitanic||mSzVal>=9.0;
 const isColossal=opts.isMassive||mSzVal>=4.5||radius>=4.0;
 const isTitanicOrExtinction=isExtinction||isTitanic;
 const isSubwayBreach=!opts.waterOnly&&isBroadStreetCorridor&&(isTitanicOrExtinction||isColossal||opts.isSubway||radius>=2.8);
 const hasWater=!!opts.waterOnly||isSubwayBreach||(isBroadStreetCorridor&&radius>=3.2);
 // Reuse overlapping road cavities and cap detailed subway scenes before allocating meshes.
 const existing=craters.find(c=>c.isSubway===isSubwayBreach&&!!c.waterOnly===!!opts.waterOnly&&!!c.geyserGroup===hasWater&&Math.hypot(c.x-x,c.z-z)<Math.min(c.radius,radius)*.65&&c.radius>=radius*.9);
 if(existing){existing.life=existing.initialLife;return existing;}
 if(isSubwayBreach&&craters.filter(c=>c.isSubway).length>=2){
  const index=craters.findIndex(c=>c.isSubway);
  disposeCrater(craters.splice(index,1)[0]);
 }

 let mesh=null,inner=null,ember=null,rimMesh=null,subwayGroup=null,bowlMesh=null,sootDecal=null,thermalCore=null;

 if(isSubwayBreach){
  // 3D BROAD STREET SUBWAY CHASM & CAVERN
  // Road deck is completely punched through into the SEPTA Broad Street line!
  // NO opaque inner disc covering the hole!
  const apertureW=isExtinction?Math.max(26.0,radius*2.6):isTitanic?Math.max(18.0,radius*2.2):isColossal?Math.max(12.0,radius*1.95):Math.max(5.8,radius*1.85);
  const apertureD=isExtinction?Math.max(18.0,radius*2.2):isTitanic?Math.max(14.0,radius*1.85):isColossal?Math.max(8.5,radius*1.65):Math.max(4.6,radius*1.55);

  // 3D Procedural Jagged Heaved-Asphalt Crest (subway breach)
  rimMesh=createHeavedAsphaltRim(radius,true);
  rimMesh.position.set(x,0,z);
  scene.add(rimMesh);
  sootDecal=createFeatheredRadialSootDecal(radius*(isTitanicOrExtinction?1.45:1.1));
  sootDecal.position.set(x,0.03,z);
  scene.add(sootDecal);

  // Subterranean Subway Cavern
  subwayGroup=new THREE.Group();
  subwayGroup.name='subway-cavern-group';
  subwayGroup.position.set(x,0,z);
  const W=isExtinction?Math.max(28.0,radius*3.6):isTitanic?Math.max(22.0,radius*3.2):Math.max(12.0,radius*2.6);
  const D=isExtinction?Math.max(18.0,radius*2.8):isTitanic?Math.max(15.0,radius*2.5):Math.max(9.5,radius*2.2);
  const H=isExtinction?7.2:isTitanic?6.4:5.4;

  // Materials
  const ballastMat=new THREE.MeshStandardMaterial({color:0x1e1b18,roughness:0.98,metalness:0.02});
  const subwayTileMat=new THREE.MeshStandardMaterial({color:0xedebe6,roughness:0.38,metalness:0.04}); // Historic white ceramic subway tiles
  const septaGreenMat=new THREE.MeshStandardMaterial({color:0x1b5832,roughness:0.45,metalness:0.05}); // Authentic SEPTA green accent stripe
  const steelMat=new THREE.MeshStandardMaterial({color:0x5e6670,roughness:0.35,metalness:0.85}); // Polished steel rails & I-beams
  const tieMat=new THREE.MeshStandardMaterial({color:0x271f18,roughness:0.92,metalness:0}); // Creosote wooden ties
  const slabMat=new THREE.MeshStandardMaterial({color:0x2b2826,roughness:0.92,metalness:0.04}); // Broken reinforced concrete road deck
  const rebarMat=new THREE.MeshStandardMaterial({color:0x594c42,roughness:0.65,metalness:0.75}); // Exposed twisted steel rebar
  const thirdRailMat=new THREE.MeshStandardMaterial({color:0xdf6d1f,roughness:0.35,metalness:0.85,emissive:0xff6611,emissiveIntensity:0.75}); // 600V DC third rail
  for(const m of [ballastMat,subwayTileMat,septaGreenMat,steelMat,tieMat,slabMat,rebarMat,thirdRailMat])m.fog=false;

  // Cavern Ballast Floor
  const floor=new THREE.Mesh(new THREE.BoxGeometry(W*1.15,0.45,D*1.15),ballastMat);
  floor.position.set(0,-H-0.22,0);subwayGroup.add(floor);

  // Flooded subterranean track sump pool
  const subwayWaterMat=new THREE.MeshStandardMaterial({color:0x0f2330,roughness:0.15,metalness:0.82,transparent:true,opacity:0.82});
  const waterPool=new THREE.Mesh(new THREE.BoxGeometry(W*0.95,0.20,D*0.90),subwayWaterMat);
  waterPool.position.set(0,-H+0.14,0);
  subwayGroup.userData.floodBaseY=-H;
  waterPool.name='subway-flooded-water';
  subwayGroup.add(waterPool);

  // Cavern Subway Walls with White Tile and SEPTA Green Trim
  for(const dir of [-1, 1]){
   // South / North subway tunnel walls along Broad Street
   const wallTile=new THREE.Mesh(new THREE.BoxGeometry(W*1.1,H*0.82,0.35),subwayTileMat);
   wallTile.position.set(0,-H*0.5+H*0.09,dir*D*0.5);subwayGroup.add(wallTile);

   const septaBand=new THREE.Mesh(new THREE.BoxGeometry(W*1.1,0.48,0.38),septaGreenMat);
   septaBand.position.set(0,-0.65,dir*D*0.5);subwayGroup.add(septaBand);

   // End bulkheads (East/West)
   const endWall=new THREE.Mesh(new THREE.BoxGeometry(0.35,H,D*1.1),ballastMat);
   endWall.position.set(dir*W*0.5,-H*0.5,0);subwayGroup.add(endWall);
  }

  // Dual Steel Tracks (Northbound & Southbound Broad Street Line)
  for(const trackZ of [-D*0.25, D*0.25]){
   // 2 Steel rails per track
   for(const rz of [-0.75, 0.75]){
    const rail=new THREE.Mesh(new THREE.BoxGeometry(W*1.1,0.18,0.09),steelMat);
    rail.position.set(0,-H+0.18,trackZ+rz);subwayGroup.add(rail);
   }
   // Creosote cross-ties spaced every 0.65m
   const tieSteps=Math.max(6,Math.floor(W/0.65));
   for(let k=0;k<=tieSteps;k++){
    const tx=-W*0.52+(k+0.5)*(W*1.04/tieSteps);
    const tie=new THREE.Mesh(new THREE.BoxGeometry(0.24,0.12,2.05),tieMat);
    tie.position.set(tx,-H+0.06,trackZ);subwayGroup.add(tie);
   }
   // Orange 600V Third Rail with ceramic insulators
   const thirdRail=new THREE.Mesh(new THREE.BoxGeometry(W*1.05,0.14,0.12),thirdRailMat);
   thirdRail.position.set(0,-H+0.25,trackZ+1.18);subwayGroup.add(thirdRail);
   for(let ins=-W*0.45;ins<=W*0.45;ins+=3.2){
    const insulator=new THREE.Mesh(new THREE.CylinderGeometry(0.06,0.08,0.22,8),new THREE.MeshStandardMaterial({color:0xeeeade,roughness:0.25}));
    insulator.position.set(ins,-H+0.11,trackZ+1.18);subwayGroup.add(insulator);
   }
  }

  // Steel I-Beam Support Columns along the centerline between tracks
  for(const colX of [-W*0.30, 0, W*0.30]){
   const col=new THREE.Mesh(new THREE.BoxGeometry(0.36,H,0.36),steelMat);
   col.position.set(colX,-H*0.5,0);subwayGroup.add(col);
   const flange=new THREE.Mesh(new THREE.BoxGeometry(0.72,0.18,0.72),steelMat);
   flange.position.set(colX,-0.10,0);subwayGroup.add(flange);
  }

  // Drooping fractured asphalt road deck slabs hanging down into tunnel
  const slabW=new THREE.Mesh(new THREE.BoxGeometry(W*0.32,0.24,D*0.55),slabMat);
  slabW.position.set(-apertureW*0.42,-1.3,0);slabW.rotation.z=-0.52;subwayGroup.add(slabW);
  const slabE=new THREE.Mesh(new THREE.BoxGeometry(W*0.32,0.24,D*0.55),slabMat);
  slabE.position.set(apertureW*0.42,-1.3,0);slabE.rotation.z=0.52;subwayGroup.add(slabE);
  const slabN=new THREE.Mesh(new THREE.BoxGeometry(apertureW*0.65,0.24,D*0.28),slabMat);
  slabN.position.set(0,-1.2,-apertureD*0.42);slabN.rotation.x=0.45;subwayGroup.add(slabN);
  const slabS=new THREE.Mesh(new THREE.BoxGeometry(apertureW*0.65,0.24,D*0.28),slabMat);
  slabS.position.set(0,-1.2,apertureD*0.42);slabS.rotation.x=-0.45;subwayGroup.add(slabS);

  // RC166: Subterranean gutter waterfall cascade sheets pouring into subway tunnel
  const waterfallMat=new THREE.MeshStandardMaterial({
    color:0xd4effc,roughness:0.12,metalness:0.35,transparent:true,opacity:0.72,depthWrite:false
  });
  const fallN=new THREE.Mesh(new THREE.PlaneGeometry(apertureW*0.55,H*0.85),waterfallMat);
  fallN.name='subway-waterfall-north';
  fallN.position.set(0,-H*0.45,-apertureD*0.46);
  subwayGroup.add(fallN);

  const fallS=new THREE.Mesh(new THREE.PlaneGeometry(apertureW*0.55,H*0.85),waterfallMat);
  fallS.name='subway-waterfall-south';
  fallS.position.set(0,-H*0.45,apertureD*0.46);
  fallS.rotation.y=Math.PI;
  subwayGroup.add(fallS);

  // Exposed rebar rods dangling into void
  for(let r=0;r<8;r++){
   const rebar=new THREE.Mesh(new THREE.CylinderGeometry(0.02,0.02,1.2+Math.random()*0.8,6),rebarMat);
   const ra=(r/8)*Math.PI*2;
   rebar.position.set(Math.cos(ra)*apertureW*0.38,-1.1+Math.sin(r)*0.3,Math.sin(ra)*apertureD*0.38);
   rebar.rotation.set(Math.random()*0.4,Math.random()*2,Math.random()*0.4);
   subwayGroup.add(rebar);
  }

  // Fixed scene-level slots keep existing material programs valid when a crater opens.
  const tunnelLight=explosionLightPool.acquire();
  if(tunnelLight){
   tunnelLight.color.setHex(0xffba55);
   tunnelLight.position.set(x,-H*.40,z);
   tunnelLight.intensity=4.8;
  }
  const railLight=explosionLightPool.acquire();
  if(railLight){
   railLight.color.setHex(0x44ddff);
   railLight.position.set(x,-H+1.2,z);
  }
  subwayGroup.userData.lights=[tunnelLight,railLight].filter(Boolean);

  // Subterranean Station Platform Mezzanine (North edge of cavern at z = D*0.38)
  const platformGroup=new THREE.Group();
  platformGroup.name='subway-station-mezzanine';
  const platW=W*0.98, platD=2.4, platH=1.15;
  const platY=-H+platH*0.5, platZ=D*0.38;

  const platMat=new THREE.MeshStandardMaterial({color:0x94a3b8,roughness:0.88,metalness:0.05});
  const platformMesh=new THREE.Mesh(new THREE.BoxGeometry(platW,platH,platD),platMat);
  platformMesh.position.set(0,platY,platZ);
  platformGroup.add(platformMesh);

  // Yellow tactile warning edge strip (ADA compliant 4" bumpy yellow safety edge)
  const tactileMat=new THREE.MeshStandardMaterial({color:0xf59e0b,roughness:0.55,metalness:0.1,emissive:0x92400e,emissiveIntensity:0.25});
  const tactileStrip=new THREE.Mesh(new THREE.BoxGeometry(platW,0.04,0.28),tactileMat);
  tactileStrip.name='station-yellow-tactile-strip';
  tactileStrip.position.set(0,-H+platH+0.02,platZ-platD*0.5+0.14);
  platformGroup.add(tactileStrip);

  // Bank of stainless steel fare turnstiles
  const turnstileMat=new THREE.MeshStandardMaterial({color:0xd1d5db,roughness:0.28,metalness:0.92});
  const turnstileArmMat=new THREE.MeshStandardMaterial({color:0x9ca3af,roughness:0.22,metalness:0.95});
  const turnstileCount=Math.max(2,Math.floor(platW/3.2));
  for(let t=0;t<turnstileCount;t++){
   const tx=-platW*0.35+(t+0.5)*(platW*0.70/turnstileCount);
   const turnGroup=new THREE.Group();
   turnGroup.name='station-turnstile';
   const stanchion=new THREE.Mesh(new THREE.BoxGeometry(0.32,0.95,0.75),turnstileMat);
   stanchion.position.set(tx,-H+platH+0.48,platZ+0.45);
   turnGroup.add(stanchion);
   for(let a=0;a<3;a++){
    const arm=new THREE.Mesh(new THREE.CylinderGeometry(0.025,0.025,0.62,8),turnstileArmMat);
    arm.rotation.z=Math.PI/2+(a*Math.PI*2/3);
    arm.position.set(tx+0.22,-H+platH+0.65,platZ+0.45);
    turnGroup.add(arm);
   }
   platformGroup.add(turnGroup);
  }

  // Fallen illuminated SEPTA station entrance sign tilted against tunnel wall
  const signGroup=new THREE.Group();
  signGroup.name='fallen-septa-station-sign';
  const signMat=new THREE.MeshStandardMaterial({color:0x0f2c59,roughness:0.32,emissive:0x07162c,emissiveIntensity:0.5});
  const signBack=new THREE.Mesh(new THREE.BoxGeometry(3.6,0.75,0.10),signMat);
  signGroup.add(signBack);
  const stripeMat=new THREE.MeshStandardMaterial({color:0xf59e0b,roughness:0.4,emissive:0xd97706,emissiveIntensity:0.6});
  const accentStripe=new THREE.Mesh(new THREE.BoxGeometry(3.5,0.08,0.12),stripeMat);
  accentStripe.position.set(0,-0.26,0.02);
  signGroup.add(accentStripe);
  const logoBadge=new THREE.Mesh(new THREE.BoxGeometry(0.55,0.45,0.14),new THREE.MeshStandardMaterial({color:0xd9381e,roughness:0.4}));
  logoBadge.position.set(-1.4,0.05,0.02);
  signGroup.add(logoBadge);
  signGroup.position.set(W*0.28,-H+platH+0.45,platZ+0.75);
  signGroup.rotation.set(0.22,-0.35,-0.42);
  platformGroup.add(signGroup);

  subwayGroup.add(platformGroup);
  lastRadioDispatchTime=elapsed;
  sound('radioDispatch',{x,volume:0.65});

  // Authentic SEPTA Broad Street Line (B-IV) Subway Train Car on Tracks
  const carGroup=new THREE.Group();
  carGroup.name='septa-b4-subway-car';
  const carL=Math.min(W*0.96,14.5);
  const carW=2.75;
  const carH=2.65;
  const carTrackZ=-D*0.25; // Sits on southbound track
  const carCenterY=-H+0.22+carH*0.5;

  const steelBodyMat=new THREE.MeshStandardMaterial({color:0xc4cbd4,metalness:0.88,roughness:0.28});
  const septaRedMat=new THREE.MeshStandardMaterial({color:0xd9381e,roughness:0.42});
  const septaBlueMat=new THREE.MeshStandardMaterial({color:0x144988,roughness:0.42});
  const winGlassMat=new THREE.MeshStandardMaterial({color:0x1a2632,roughness:0.15,metalness:0.75});
  const winGlowMat=new THREE.MeshStandardMaterial({color:0xfff0cc,emissive:0xffd988,emissiveIntensity:0.65,roughness:0.5});

  const carBody=new THREE.Mesh(new THREE.BoxGeometry(carL,carH,carW),steelBodyMat);
  carBody.position.set(0,carCenterY,carTrackZ);
  carGroup.add(carBody);

  for(const side of [-1, 1]){
   const redStripe=new THREE.Mesh(new THREE.BoxGeometry(carL*0.98,0.16,0.04),septaRedMat);
   redStripe.position.set(0,carCenterY+0.12,carTrackZ+side*(carW*0.5+0.02));
   carGroup.add(redStripe);

   const blueStripe=new THREE.Mesh(new THREE.BoxGeometry(carL*0.98,0.12,0.04),septaBlueMat);
   blueStripe.position.set(0,carCenterY-0.06,carTrackZ+side*(carW*0.5+0.02));
   carGroup.add(blueStripe);

   const winCount=Math.max(4,Math.floor(carL/2.2));
   for(let w=0;w<winCount;w++){
    const wx=-carL*0.42+(w+0.5)*(carL*0.84/winCount);
    const win=new THREE.Mesh(new THREE.BoxGeometry(1.2,0.62,0.05),winGlassMat);
    win.position.set(wx,carCenterY+0.45,carTrackZ+side*(carW*0.5+0.02));
    carGroup.add(win);

    const glow=new THREE.Mesh(new THREE.BoxGeometry(1.1,0.52,0.02),winGlowMat);
    glow.position.set(wx,carCenterY+0.45,carTrackZ+side*(carW*0.5-0.05));
    carGroup.add(glow);
   }
  }

  for(const rx of [-carL*0.28, carL*0.28]){
   const hvac=new THREE.Mesh(new THREE.BoxGeometry(2.4,0.35,1.6),steelBodyMat);
   hvac.position.set(rx,carCenterY+carH*0.5+0.18,carTrackZ);
   carGroup.add(hvac);
  }

  for(const bx of [-carL*0.35, carL*0.35]){
   const truck=new THREE.Mesh(new THREE.BoxGeometry(2.1,0.32,carW*0.85),steelMat);
   truck.position.set(bx,-H+0.20,carTrackZ);
   carGroup.add(truck);
  }

  const isDerailed=isSubwayBreach&&(radius>=3.0||(opts.size||0)>=2.8||opts.isMassive);
  if(isDerailed){
   carGroup.userData.derailed=true;
   carGroup.rotation.z=-0.34;
   carGroup.rotation.x=0.08;
   carGroup.rotation.y=0.12;
   carGroup.position.y-=0.30;
   const crushedRoofSlab=new THREE.Mesh(new THREE.BoxGeometry(Math.min(W*0.48,5.8),0.42,carW*1.12),steelBodyMat);
   crushedRoofSlab.position.set(0,carCenterY+carH*0.5+0.18,carTrackZ);
   crushedRoofSlab.rotation.set(0.14,0.08,-0.25);
   carGroup.add(crushedRoofSlab);
   sound('crash',{x,volume:0.88,pitch:0.68});
   sound('electric',{x,volume:0.82});
  }else{
   carGroup.rotation.z=-0.04;
   carGroup.rotation.y=0.03;
  }
  subwayGroup.add(carGroup);

  // RC140: Subterranean subway flood water pooling on track bed
  const floodWaterMat=new THREE.MeshStandardMaterial({
   color:0x1b4858,roughness:0.12,metalness:0.25,transparent:true,opacity:0.80,emissive:0x09222c,emissiveIntensity:0.35
  });
  const floodWaterPool=new THREE.Mesh(new THREE.BoxGeometry(W*1.08,0.18,D*1.08),floodWaterMat);
  floodWaterPool.name='subway-flood-water-pool';
  floodWaterPool.position.set(0,-H+0.12,0);
  subwayGroup.add(floodWaterPool);

  // RC140: Boiling electric arcs where water contacts the 600V third rail
  const thirdRailArcMat=new THREE.MeshStandardMaterial({
   color:0xd0ffff,emissive:0x44ddff,emissiveIntensity:2.2,roughness:0.1
  });
  for(const trackZ of [-D*0.25, D*0.25]){
   for(const arcX of [-W*0.32, -W*0.12, W*0.15, W*0.35]){
    const arc=new THREE.Mesh(new THREE.SphereGeometry(0.16,6,6),thirdRailArcMat);
    arc.name='third-rail-arc';
    arc.position.set(arcX,-H+0.28,trackZ+1.18);
    subwayGroup.add(arc);
    const arcSpark=new THREE.Mesh(new THREE.ConeGeometry(0.09,0.38,4),thirdRailArcMat);
    arcSpark.position.set(arcX+(Math.random()-0.5)*0.2,-H+0.38,trackZ+1.18);
    arcSpark.rotation.z=(Math.random()-0.5)*1.2;
    subwayGroup.add(arcSpark);
   }
  }

  const arcLight=new THREE.Object3D();
  arcLight.name='subway-third-rail-arc-light';
  arcLight.intensity=0;
  subwayGroup.add(arcLight);
  subwayGroup.userData.railLight=railLight;

  // RC157: Subterranean emergency evacuation illuminated EXIT signs on tunnel bulkheads
  const exitHousingMat=new THREE.MeshStandardMaterial({color:0x1b2024,roughness:0.7,metalness:0.2});
  const exitSignMat=new THREE.MeshStandardMaterial({color:0x22ee55,emissive:0x00cc33,emissiveIntensity:1.2,roughness:0.25});
  for(const dir of [-1, 1]){
   const exitBox=new THREE.Group();
   exitBox.name='subway-emergency-exit-sign';
   const housing=new THREE.Mesh(new THREE.BoxGeometry(0.18,0.55,1.15),exitHousingMat);
   exitBox.add(housing);
   const face=new THREE.Mesh(new THREE.BoxGeometry(0.20,0.45,1.05),exitSignMat);
   exitBox.add(face);
   exitBox.position.set(dir*(W*0.5-0.22),-H*0.5+0.8,0);
   subwayGroup.add(exitBox);
  }

  // RC157: Subterranean emergency red warning beacon light
  const beaconGroup=new THREE.Group();
  beaconGroup.name='subway-emergency-beacon';
  const beaconBase=new THREE.Mesh(new THREE.CylinderGeometry(0.22,0.26,0.18,12),steelMat);
  beaconBase.position.set(0,-0.09,0);
  beaconGroup.add(beaconBase);
  const beaconDomeMat=new THREE.MeshStandardMaterial({color:0xff1100,emissive:0xff2200,emissiveIntensity:1.8,transparent:true,opacity:0.85});
  const beaconDome=new THREE.Mesh(new THREE.SphereGeometry(0.18,12,12),beaconDomeMat);
  beaconDome.name='subway-beacon-dome';
  beaconDome.position.set(0,0.10,0);
  beaconGroup.add(beaconDome);
  beaconGroup.position.set(W*0.35,-H+platH+0.09,platZ+0.5);
  subwayGroup.add(beaconGroup);

  batchOpaqueRelief(subwayGroup,{preserveNamed:true});
  scene.add(subwayGroup);
  cinematicFX.sparks(new THREE.Vector3(x,-H+0.5,z),28,1.8);
  sound('spark',{x});
  message('🚇 BROAD STREET SUBWAY BREACH! SEPTA TRAIN CAR & CAVERN COLLAPSED');
 } else if(!opts.waterOnly){
  // TRUE 3D PROCEDURAL VOLUMETRIC IMPACT CAVITY & HEAVED ASPHALT CREST
  const bowlObj=createVolumetricImpactBowl(radius);
  bowlMesh=bowlObj.mesh;
  bowlMesh.position.set(x,0,z);
  scene.add(bowlMesh);

  // 3D Procedural Jagged Heaved-Asphalt Crest (buckled upward +0.28m to +0.44m)
  rimMesh=createHeavedAsphaltRim(radius,false);
  rimMesh.position.set(x,0,z);
  scene.add(rimMesh);

  // Feathered radial scorch decal (zero polygon borders)
  sootDecal=createFeatheredRadialSootDecal(radius);
  sootDecal.position.set(x,0.03,z);
  scene.add(sootDecal);

  // Pulsating subsurface thermal magma fissure bed
  thermalCore=createPulsatingThermalFissures(radius,bowlObj.depth);
  thermalCore.group.position.set(x,-bowlObj.depth+0.06,z);
  scene.add(thermalCore.group);
  ember=thermalCore.mesh;
 }

 let geyserGroup=null;
 if(hasWater){
  geyserGroup=new THREE.Group();
  geyserGroup.name='water-main-geyser';
  const gx=x+(Math.random()-0.5)*(radius*0.75);
  const gz=z+(Math.random()-0.5)*(radius*0.75);
  geyserGroup.position.set(gx,0,gz);

  const pipeMat=new THREE.MeshStandardMaterial({color:0x2c2927,roughness:0.88,metalness:0.65});
  const pipe=new THREE.Mesh(new THREE.CylinderGeometry(0.26,0.32,1.3,12),pipeMat);
  pipe.position.set(0,-0.45,0);
  pipe.rotation.z=(Math.random()-0.5)*0.25;
  geyserGroup.add(pipe);

  // Cast-iron municipal water main flange collar and asphalt rupture rim
  const flange=new THREE.Mesh(new THREE.TorusGeometry(0.36,0.07,8,16),pipeMat);
  flange.position.set(0,0.12,0);
  flange.rotation.x=Math.PI*0.5;
  geyserGroup.add(flange);

  const rimMat=new THREE.MeshStandardMaterial({color:0x1b1918,roughness:0.96});
  const asphaltRim=new THREE.Mesh(new THREE.TorusGeometry(0.62,0.16,6,12),rimMat);
  asphaltRim.position.set(0,0.04,0);
  asphaltRim.rotation.x=Math.PI*0.5;
  geyserGroup.add(asphaltRim);

  // For subway breaches, water cascades down into the subterranean track bed sump (no flat disc covering chasm).
  // For surface impacts, a small localized puddle surrounds the sheared pipe.
  if(!isSubwayBreach){
   const puddleMat=new THREE.MeshStandardMaterial({
    color:0x152838,roughness:0.06,metalness:0.55,transparent:true,opacity:0.65,depthWrite:false
   });
   const puddleMesh=new THREE.Mesh(new THREE.CircleGeometry(Math.min(1.8,radius*0.35),16),puddleMat);
   puddleMesh.name='asphalt-water-puddle';
   puddleMesh.rotation.x=-Math.PI*0.5;
   puddleMesh.position.set(0,0.04,0);
   geyserGroup.add(puddleMesh);
  }

  scene.add(geyserGroup);
  sound('water');
  streetWaterRunoff?.triggerWaterMainRupture(x, z);
  streetWaterRunoff?.triggerRipple?.(x, z, 1.8);
 }

 craters.push({x,z,radius,mesh,inner,ember,rimMesh,bowlMesh,sootDecal,thermalGroup:thermalCore?.group??null,thermalUpdate:thermalCore?.update??null,waterOnly:!!opts.waterOnly,subwayGroup,geyserGroup,isSubway:isSubwayBreach,sparkTimer:0,geyserTimer:0,life:120,initialLife:120});
 streetStop=Math.max(streetStop,1.5);
 sound('steam',{x});
 if(craters.length>8){const c=craters.shift();disposeCrater(c);}
 neighborhood.syncCraterHoles?.(craters);cinematicFX.syncSubwayCraters?.(craters);
 return craters.at(-1);
}
function updateCraters(dt){
 streetStop=Math.max(0,streetStop-dt);
 for(let i=craters.length-1;i>=0;i--){
  const c=craters[i];c.life-=dt;
  const heatRatio=Math.max(0,c.life/120);
  if(c.thermalUpdate)c.thermalUpdate(elapsed);
  if(c.ember){
   c.ember.material.opacity=heatRatio*(.60+.25*Math.sin(elapsed*5.0));
   if(heatRatio>0.75)c.ember.material.color.setHex(0xfff4cc);
   else if(heatRatio>0.45)c.ember.material.color.setHex(0xff6a14);
   else if(heatRatio>0.20)c.ember.material.color.setHex(0xd43204);
   else c.ember.material.color.setHex(0x3a1208);
  }
  if(c.isSubway&&c.subwayGroup){
   c.sparkTimer=(c.sparkTimer||0)+dt;
   if(c.sparkTimer>0.50){
    c.sparkTimer=0;
    _craterV1.set(c.x+(Math.random()-.5)*1.4,-4.2,c.z+(Math.random()-.5)*1.8);
    cinematicFX.sparks(_craterV1,Math.round(6+Math.random()*6),1.1);
    if(Math.random()<0.35)sound('electric',{x:c.x});
   }
   c.steamTimer=(c.steamTimer||0)+dt;
   if(c.steamTimer>0.28){
    c.steamTimer=0;
    _craterV1.set(c.x+(Math.random()-.5)*1.8,-4.8,c.z+(Math.random()-.5)*1.6);
    cinematicFX.steamBurst?.(_craterV1,1.0);
    if(Math.random()<0.30)sound('steam',{x:c.x});
   }
  }
  if(c.subwayGroup){
   const floodWater=c.subwayGroup.getObjectByName('subway-flooded-water');
   if(floodWater){
    c.floodLevel=Math.min(0.68,(c.floodLevel??0.14)+dt*0.022);
    const floodY=(c.subwayGroup.userData.floodBaseY??-5.4)+c.floodLevel+Math.sin(elapsed*3.5+c.x*0.3)*0.03;
    floodWater.position.y=floodY;
    const secondaryWater=c.subwayGroup.getObjectByName('subway-flood-water-pool');
    if(secondaryWater)secondaryWater.position.y=floodY-.04;
   }
   // RC166: Animate subterranean waterfall curtains & foaming track bed spray
   const wfN=c.subwayGroup.getObjectByName('subway-waterfall-north');
   const wfS=c.subwayGroup.getObjectByName('subway-waterfall-south');
   if(wfN&&wfS){
    const pulse=0.68+Math.sin(elapsed*14.0)*0.12;
    wfN.material.opacity=pulse;
    wfS.material.opacity=pulse;
   }
   if(c.isSubway&&cinematicFX.waterSpray){
    _craterV1.set(c.x-2.4,-4.2,c.z);
    _craterV2.set(1.0,0.22,0.18).normalize();
    cinematicFX.waterSpray(_craterV1,_craterV2,dt,{rate:2,power:0.85});
    // Waterfall base impact mist
    _craterV1.set(c.x,-5.0,c.z-2.2);
    _craterV2.set(0,0.85,0.25).normalize();
    cinematicFX.waterSpray(_craterV1,_craterV2,dt,{rate:2,power:0.70});
   }
   const beacon=c.subwayGroup.getObjectByName('subway-emergency-beacon');
   if(beacon){
    const bd=beacon.getObjectByName('subway-beacon-dome');
    const pulse=(Math.sin(elapsed*9.0)>0.1)?1.0:0.12;
    if(bd&&bd.material)bd.material.emissiveIntensity=1.8*pulse;
   }
   const arcLight=c.subwayGroup.getObjectByName('subway-third-rail-arc-light');
   if(arcLight){
    if(Math.random()<0.30){
     arcLight.intensity=3.2+Math.random()*4.5;
    }else{
     arcLight.intensity=Math.max(0,arcLight.intensity-dt*14.0);
    }
    if(c.subwayGroup.userData.railLight)c.subwayGroup.userData.railLight.intensity=arcLight.intensity;
   }
  }
  if(c.geyserGroup){
   c.geyserTimer=(c.geyserTimer||0)+dt;
   const puddle=c.geyserGroup.getObjectByName('asphalt-water-puddle');
   if(puddle){
    puddle.scale.setScalar(1.0+Math.sin(elapsed*2.0)*0.04);
   }
   if(cinematicFX.waterJet){
    cinematicFX.waterJet(c.geyserGroup.position,dt,{rate:3,power:0.95,spread:0.18});
   }
   for(const f of schoolFire){
    if(f.root.position.distanceTo(c.geyserGroup.position)<16.0){
     f.suppression=Math.min(1.0,f.suppression+dt*2.2);
    }
   }
  }
  if(!c.waterOnly&&heatRatio>0.25&&Math.random()<dt*5&&quality.allowTrail(trailParticles.length)){
   _craterV1.set(c.x+(Math.random()-.5)*c.radius*.5,0.5,c.z+(Math.random()-.5)*c.radius*.5);
   emitTrail(_craterV1,true);
  }
  if(!c.waterOnly&&c.life>0&&Math.abs(c.x)<25&&isBroadRoad(c.x,c.z)){
   _craterV1.set(c.x,.35,c.z);
   cinematicFX.fire(_craterV1,elapsed,c.radius*.65,.28,'structure');
  }
  if(c.life<=0){
   disposeCrater(c);
   craters.splice(i,1);
   neighborhood.syncCraterHoles?.(craters);cinematicFX.syncSubwayCraters?.(craters);
  }
 }
}
function updateWorld(dt){
 if(chapterSettlement.active)militaryOccupation.suppress(1);
 militaryOccupation.update(dt,meteors,shots);updateCraters(dt);if(performanceLab.isEnabled('backgroundMeteors'))updateSkyBursts(dt);updateSignals();updatePoliceBlockades(dt);updateSkylineDamage(dt);
 if(performanceLab.isEnabled('backgroundMeteors')){updateDistantMeteors(dt);escalateBackgroundNeighborhood(dt);}
 for(let i=dangerZones.length-1;i>=0;i--)if((dangerZones[i].ttl-=dt)<=0)dangerZones.splice(i,1);
 const previousStun=dragonStun;invulnerable=Math.max(0,invulnerable-dt);dragonStun=Math.max(0,dragonStun-dt);if(previousStun>0&&dragonStun===0){recoveryLift=2.5;dragonGroundImpact=false;message('PAULO GETS UP, FLAPS HIS WINGS AND TAKES FLIGHT');}blockShield=Math.max(0,blockShield-dt);blockScene=Math.max(0,blockScene-dt);if(dragonStun>0){
 const beforeY=dragon.position.y;dragon.position.y=THREE.MathUtils.lerp(beforeY,1.3,Math.min(1,dt*3.4));
 dragon.rotation.z=Math.sin(elapsed*35)*.14;
 if(!dragonGroundImpact&&dragon.position.y<1.65){dragonGroundImpact=true;shake=Math.max(shake,.35);emitImpact(dragon.position.x,.7,dragon.position.z,20,.3);sound('impact');}
}else dragon.rotation.z=THREE.MathUtils.lerp(dragon.rotation.z,0,Math.min(1,dt*5));waterDisable=Math.max(0,waterDisable-dt);gasCooldown=Math.max(0,gasCooldown-dt);dragon.visible=dragonEnabled&&(dragonStun>0||invulnerable<=0||Math.floor(elapsed*11)%2===0);
 updateBurningVehicles(dt);if(performanceLab.isEnabled('helicopters'))helicopterTimer-=dt;if(performanceLab.isEnabled('helicopters')&&helicopterTimer<=0){spawnHelicopter();helicopterTimer=6+Math.random()*7;}
 for(let i=helicopters.length-1;performanceLab.isEnabled('helicopters')&&i>=0;i--){const h=helicopters[i];h.life-=dt;h.rotor.rotation.y+=dt*28;h.tail.rotation.z+=dt*22;let searchlightSynced=false;if(!h.crashing){
   // Cockpit forward visibility is deliberately limited: ~64-degree field of view.
   const forward=heliForwardScratch.set(Math.cos(h.heading),0,-Math.sin(h.heading));let nearest=null,nearestT=Infinity;
   for(const meteor of meteors){if(meteor.grounded||!meteor.mesh)continue;const delta=meteor.mesh.position.clone().sub(h.root.position);const dist=delta.length();if(dist>24||dist<.001||forward.dot(delta.clone().normalize())<.85)continue;
    const velocity=meteor.vel||new THREE.Vector3(0,-4,0),relative=velocity.clone().addScaledVector(forward,-h.speed);const closing=-delta.dot(relative)/Math.max(.01,relative.lengthSq());
    if(closing>=0&&closing<3.5&&delta.clone().addScaledVector(relative,closing).length()<5&&closing<nearestT){nearest=meteor;nearestT=closing;}}
   h.evasion=Math.max(0,h.evasion-dt);if(nearest&&h.evasion<.1){h.evasion=1.2;h.dodgeSide=(nearest.mesh.position.x>h.root.position.x?-1:1);}
   if(h.evasion>0){h.root.position.x+=h.dodgeSide*dt*h.speed*1.4;h.root.position.y+=dt*3.8;}
   const wantedHeading=h.evasion>0?(h.dodgeSide>0?0:Math.PI):h.dir>0?0:Math.PI;
   const turn=Math.atan2(Math.sin(wantedHeading-h.heading),Math.cos(wantedHeading-h.heading));h.heading+=THREE.MathUtils.clamp(turn,-dt*2.2,dt*2.2);
   h.root.rotation.order='YXZ';
   h.root.rotation.y=h.heading;const desiredBank=THREE.MathUtils.clamp(-turn*.19+(h.evasion>0?h.dodgeSide*.34:0),-.25,.25);
   h.roll=THREE.MathUtils.lerp(h.roll||0,desiredBank,Math.min(1,dt*2.8));
   h.root.rotation.x=h.roll;
  }
  h.beacon.visible=Math.sin(elapsed*9+h.root.position.x)>.15;
  h.searchlight.intensity=wave>=5?Math.min(5.2,Math.max(0,(wave-3)*1.25))*Math.min(1,Math.max(0,(displayedDarkness-.12)/.42)):0;
  if(h.root.userData.strobe)h.root.userData.strobe.visible=Math.floor(elapsed*8+h.variant)%2===0;
  if(h.root.userData.cockpitGlow)h.root.userData.cockpitGlow.visible=!h.crashing;
  // Chin-mounted searchlight tracking & realistic ground illumination pool
  if(h.root.userData.searchlightCone){
   const showSearch=wave>=5&&!h.crashing&&(displayedDarkness>.18);
   h.root.userData.searchlightCone.visible=showSearch;
   if(h.searchlightPool)h.searchlightPool.visible=showSearch;
   if(showSearch){
    const darknessRatio=Math.min(1,Math.max(0,(displayedDarkness-.18)/.42));
    h.root.userData.searchlightCone.material.opacity=0.08*darknessRatio;
    if(h.root.userData.innerCore)h.root.userData.innerCore.material.opacity=0.14*darknessRatio;
    if(h.role==='police'||h.role==='ice'){
     heliTargetScratch.copy(dragon.position);
    }else{
     heliTargetScratch.set(h.root.position.x+h.dir*14,0,20);
    }
    heliMountScratch.copy(heliMountOffset);
    h.root.localToWorld(heliMountScratch);
    heliAimScratch.copy(heliTargetScratch).sub(heliMountScratch).normalize();
    heliLocalTargetScratch.copy(heliTargetScratch);
    h.root.worldToLocal(heliLocalTargetScratch);
    heliLocalAimScratch.copy(heliLocalTargetScratch).sub(heliMountOffset).normalize();
    if(h.root.userData.searchlightGimbal&&heliLocalAimScratch.lengthSq()>.001){
     const dot=heliUpVector.dot(heliLocalAimScratch);
     if(dot>.9999){
      h.root.userData.searchlightGimbal.quaternion.identity();
     }else if(dot<-.9999){
      h.root.userData.searchlightGimbal.quaternion.set(1,0,0,0);
     }else{
      h.root.userData.searchlightGimbal.quaternion.setFromUnitVectors(heliUpVector,heliLocalAimScratch);
     }
    }
    if(h.searchlightPool){
     const t=(0.06-heliMountScratch.y)/Math.min(-0.02,heliAimScratch.y);
     if(t>0&&t<100){
      h.searchlightPool.position.set(heliMountScratch.x+heliAimScratch.x*t,0.08,heliMountScratch.z+heliAimScratch.z*t);
      h.searchlightPool.scale.setScalar(Math.min(2.4,Math.max(0.7,t*.06)));
      h.searchlightPool.material.opacity=0.45*darknessRatio;
     }
    }
    syncHelicopterSearchlight(h.root,h.searchlight,heliTargetScratch);
    searchlightSynced=true;
   }
  }
  if(h.crashing){
   h.v-=11.8*dt;h.root.position.y+=h.v*dt;
   h.root.rotation.order='YXZ';
   h.root.rotation.y+=dt*3.2;
   h.pitch=THREE.MathUtils.lerp(h.pitch||0,-0.22,dt*4);
   h.roll=Math.sin(elapsed*14.0+h.variant)*0.32;
   h.root.rotation.z=h.pitch;
   h.root.rotation.x=h.roll;
   if(Math.random()<dt*32)emitImpact(h.root.position.x,h.root.position.y,h.root.position.z,8,.35);
   if(h.root.position.y<1.1){
    flashAt(h.root.position.x,2,h.root.position.z,4.0);
    blast(h.root.position.x,1.4,h.root.position.z,5.4);
    blast(h.root.position.x+2.4,1.2,h.root.position.z-1.4,3.8);
    emitImpact(h.root.position.x,1,h.root.position.z,220,1.9);
    shake=Math.max(shake,.95);
    sound('crash');sound('impact');sound('car');
    ignite(h.root.position.x,1,h.root.position.z);
    spawnHelicopterCrashDebris(h.root.position,h.variant);
    spawnHelicopterWreck(h.root.position,h.variant);
    spawnSurvivingPilot(h.root.position);
    neighborhood.impact(h.root.position.x,5,h.root.position.z,4,p=>debrisPiece(p,'brick'));
    panicCrowdAt(h.root.position.x,h.root.position.z,36);
    h.life=0;h.crashed=true;
    if(h.gasHit){
     for(let j=0;j<7;j++){
      const m=new THREE.Sprite(new THREE.SpriteMaterial({map:visualBank.images.smoke,color:0x6ab85b,transparent:true,opacity:.45,depthWrite:false}));
      m.scale.set(2.1,2.4,1);m.position.copy(h.root.position).add(new THREE.Vector3((Math.random()-.5)*3,Math.random()*2,(Math.random()-.5)*2));
      scene.add(m);
      gasClouds.push({mesh:m,life:8,v:new THREE.Vector3(0,0,0),age:0});
     }
    }
   }
  } else {
   h.disorientTime=Math.max(0,h.disorientTime-dt);
   if(h.disorientTime>0){
    const strength=Math.min(1,h.disorientTime/1.2);
    h.root.position.x+=dt*(h.dir*h.speed*.34+Math.sin(elapsed*7+h.variant)*3.8*strength);
    h.root.position.y+=dt*(-1.0*strength+Math.sin(elapsed*11+h.variant)*2.6*strength);
    h.root.position.y=Math.max(4,h.root.position.y);
    h.heading+=dt*(2.2*strength+.1);
    h.root.rotation.order='YXZ';
    h.root.rotation.y=h.heading;
    h.pitch=THREE.MathUtils.clamp(Math.sin(elapsed*10+h.variant)*.22*strength,-0.22,0.22);
    h.roll=THREE.MathUtils.clamp(Math.sin(elapsed*13+h.variant)*.32*strength,-0.32,0.32);
    h.root.rotation.z=h.pitch;
    h.root.rotation.x=h.roll;
   } else {
    // Authentic helicopter flight aerodynamics:
    // Tactical loiter orbit with aerodynamic collective inertia, cyclic pitch, and banking roll
    h.loiterTime-=dt;
    if((h.role==='police'||h.role==='ice')&&h.loiterTime>0){
     const patrolSide=h.dir>0?1:-1;
     const orbitX=Math.sin(elapsed*0.65+i*1.8)*14.0;
     const orbitZ=Math.cos(elapsed*0.55+i*1.5)*3.5;
     const targetX=THREE.MathUtils.clamp(dragon.position.x-patrolSide*20+orbitX,-70,70);
     const cruiseCeiling=19.0+(i%3)*5.5;
     const targetY=THREE.MathUtils.clamp(cruiseCeiling+Math.sin(elapsed*0.75+i)*1.6,17,28);
     const targetZ=THREE.MathUtils.clamp(16+orbitZ,11,22);

     const accelX=THREE.MathUtils.clamp(targetX-h.root.position.x,-h.speed*1.2,h.speed*1.2);
     h.vel.x=THREE.MathUtils.lerp(h.vel.x,accelX,Math.min(1,dt*1.4));
     h.root.position.x+=h.vel.x*dt;
     h.root.position.y=THREE.MathUtils.lerp(h.root.position.y,targetY,Math.min(1,dt*0.65));
     h.root.position.z=THREE.MathUtils.lerp(h.root.position.z,targetZ,Math.min(1,dt*0.75));
    } else if(h.role==='news'&&h.loiterTime>0&&Math.abs(h.root.position.x)<55){
     const event=schoolFire[0]?.root.position||new THREE.Vector3(0,8,0);
     h.vel.x=THREE.MathUtils.lerp(h.vel.x,THREE.MathUtils.clamp(event.x-h.root.position.x,-h.speed,h.speed),Math.min(1,dt*1.8));
     h.root.position.x+=h.vel.x*dt;
     h.root.position.y=THREE.MathUtils.lerp(h.root.position.y,Math.max(22,event.y+12),dt*.3);
     h.root.position.z=THREE.MathUtils.lerp(h.root.position.z,15,dt*.5);
    } else if(!h.firefighting||!schoolFire.length){
     h.vel.x=THREE.MathUtils.lerp(h.vel.x,h.dir*h.speed,Math.min(1,dt*2));
     h.root.position.x+=h.vel.x*dt;
     h.root.position.z=THREE.MathUtils.lerp(h.root.position.z,16,dt*.5);
    }
    h.root.position.y+=Math.sin(elapsed*2.0+i)*dt*.35;
    if(h.firefighting&&schoolFire.length){
     const f=schoolFire.reduce((a,b)=>Math.abs(a.root.position.x-h.root.position.x)<Math.abs(b.root.position.x-h.root.position.x)?a:b);
     h.root.position.x=THREE.MathUtils.lerp(h.root.position.x,f.root.position.x,Math.min(1,dt*.7));
     h.root.position.z=THREE.MathUtils.lerp(h.root.position.z,THREE.MathUtils.clamp(f.root.position.z+5,-85,24),Math.min(1,dt*.7));
     h.root.position.y=THREE.MathUtils.lerp(h.root.position.y,Math.max(18,f.root.position.y+11),Math.min(1,dt*.5));
     if(Math.abs(h.root.position.x-f.root.position.x)<5&&Math.abs(h.root.position.z-(f.root.position.z+5))<8){
      const source=h.root.position.clone().add(new THREE.Vector3(0,-1,0));
      cinematicFX.water(source,f.root.position,.32);
      f.suppression+=dt*.52;
     }
    }
    // Authentic aerodynamic pitch/roll with upright rotor stabilization (order 'YXZ'):
    // Nose is along +X, wings along Z. Pitch is around Z, roll is around X!
    const forwardPitch=THREE.MathUtils.clamp(-h.vel.x*0.016,-0.16,0.16);
    h.pitch=THREE.MathUtils.lerp(h.pitch||0,forwardPitch,Math.min(1,dt*3.5));
    const bankAngle=THREE.MathUtils.clamp(-h.vel.x*0.015+(h.dodgeSide?h.dodgeSide*0.16:0),-0.20,0.20);
    h.roll=THREE.MathUtils.lerp(h.roll||0,bankAngle,Math.min(1,dt*2.8));
    h.bumpTime=Math.max(0,(h.bumpTime||0)-dt);
    const bumpRoll=Math.sin(elapsed*24)*0.06*Math.min(1,h.bumpTime);
    const bumpPitch=Math.cos(elapsed*20)*0.05*Math.min(1,h.bumpTime);
    h.root.rotation.order='YXZ';
    h.root.rotation.y=h.heading;
    h.root.rotation.z=THREE.MathUtils.clamp(h.pitch+bumpPitch,-0.18,0.18);
    h.root.rotation.x=THREE.MathUtils.clamp((h.roll||0)+bumpRoll,-0.22,0.22);

    // Building collision avoidance: helicopters do not clip through buildings
    h.bldgBumpCooldown=Math.max(0,(h.bldgBumpCooldown||0)-dt);
    const bldgBounds=[schoolBounds,...neighborhood.targetBuildings.filter(b=>!b.background).map(b=>({min:new THREE.Vector3(b.x-b.w/2-1.2,0,b.z-b.d/2-1.2),max:new THREE.Vector3(b.x+b.w/2+1.2,b.h+1.5,b.front+1.8)}))];
    for(const bb of bldgBounds){
     if(h.root.position.x>bb.min.x&&h.root.position.x<bb.max.x&&h.root.position.z>bb.min.z&&h.root.position.z<bb.max.z&&h.root.position.y<bb.max.y){
      if(h.root.position.y>bb.max.y-3.0){
       h.root.position.y=bb.max.y+0.6;
       h.vel.y=Math.max(h.vel.y||0,5.0);
      }else{
       const centerX=(bb.min.x+bb.max.x)/2;
       const pushDir=h.root.position.x>centerX?1:-1;
       h.root.position.x+=pushDir*1.2;
       h.vel.x=pushDir*Math.max(5.0,Math.abs(h.vel.x));
       h.root.position.z=bb.max.z+0.5;
      }
      if(h.bldgBumpCooldown<=0){
       h.bldgBumpCooldown=0.85;
       h.bumpTime=0.9;
       emitImpact(h.root.position.x,h.root.position.y,h.root.position.z,24,.38);
       sound('impact');
      }
     }
    }
    // Anti-locking 3D helicopter separation steering (RC106):
    // Prevents firefighting and ICE/police helicopters from colliding or locking together.
    for(let j=i-1;j>=0;j--){
     const h2=helicopters[j];
     if(!h2||h2.crashing)continue;
     const dx=h.root.position.x-h2.root.position.x;
     const dy=h.root.position.y-h2.root.position.y;
     const dz=h.root.position.z-h2.root.position.z;
     const dist3D=Math.hypot(dx,dy,dz);
     const dist2D=Math.hypot(dx,dz);

     if(dist2D<18.0){
      // 1. Altitude Corridor Separation: fly up and around each other
      const verticalAvoid=dy>=0?1:-1;
      h.root.position.y+=verticalAvoid*9.5*dt;
      h2.root.position.y-=verticalAvoid*4.5*dt;
      h.pitch=THREE.MathUtils.lerp(h.pitch||0,-verticalAvoid*0.22,dt*4);

      // 2. Lateral Avoidance Repulsion
      const avoidDir=Math.sign(dx)||(i>j?1:-1);
      h.vel.x+=avoidDir*18.0*dt;
      h.root.position.z+=(dz>=0?1:-1)*9.0*dt;
     }

     // 3. Anti-locking watchdog: if two helicopters get close, strongly separate them
     if(dist3D<5.8){
      h.lockTime=(h.lockTime||0)+dt;
      const sep=h.root.position.clone().sub(h2.root.position).normalize();
      // Vertical boost over the lower aircraft to unlock
      sep.y=Math.max(sep.y,0.65);
      h.root.position.addScaledVector(sep,dt*14.0);
      h.vel.x+=Math.sign(sep.x||1)*18.0*dt;

      if(!h.lastBumpTime||elapsed-h.lastBumpTime>2.2){
       h.lastBumpTime=elapsed;
       h.bumpTime=.6;h2.bumpTime=.6;
       emitImpact(h.root.position.x,h.root.position.y,h.root.position.z,18,.30);
       sound('impact');
      }
     }else{
      h.lockTime=Math.max(0,(h.lockTime||0)-dt*2);
     }
    }
    if(wave>8&&h.role==='police'&&h.disorientTime<=0){
     h.attackTimer-=dt;
     if(h.attackTimer<=0&&Math.abs(h.root.position.x-dragon.position.x)<26){
      h.attackTimer=1.3+Math.random();
      const m=new THREE.Mesh(sharedShotGeometry,mats.fire);m.position.copy(h.root.position);
      scene.add(m);
      shots.push({mesh:m,vel:dragon.position.clone().sub(m.position).normalize().multiplyScalar(23),target:dragon.position.clone(),life:2.5,hostile:true});
     }
    }
   }
   updateIceStream(h,dt);
   // Collision with dragon: does NOT cost a life! Helicopter reacts with physics bump
   h.dragonBumpCooldown=Math.max(0,(h.dragonBumpCooldown||0)-dt);
   if(h.root.position.distanceTo(dragon.position)<3.2&&h.dragonBumpCooldown<=0){
    h.dragonBumpCooldown=.75;
    const bumpDir=h.root.position.clone().sub(dragon.position).normalize();
    h.root.position.addScaledVector(bumpDir,2.2);
    h.vel.addScaledVector(bumpDir,15.0);
    h.bumpTime=1.0;
    emitImpact(h.root.position.x,h.root.position.y,h.root.position.z,36,.55);
    sound('impact');
    message('HELICOPTER BUMPED BY DRAGON');
   }
   for(const m of meteors)if(!m.grounded&&m.mesh?.position.distanceTo(h.root.position)<Math.max(2.2,(m.size||1)*.8+1.5))crashHelicopter(h);
   for(const b of blasts)if(h.root.position.distanceTo(b.mesh.position)<b.r+1.5) {crashHelicopter(h);score=Math.max(0,score-250);message('HELICOPTER HIT! -250');}
  }
  if(!searchlightSynced)syncHelicopterSearchlight(h.root,h.searchlight);
  if(h.crashed){
   retireHelicopter(h,false);
   helicopters.splice(i,1);
   continue;
  }
  if(h.departing){
   h.speed=THREE.MathUtils.lerp(h.speed,26,dt*2.2);
   h.root.position.x+=h.departDir*h.speed*dt;
   h.root.position.y+=dt*3.8;
   h.root.position.z=THREE.MathUtils.lerp(h.root.position.z,16,dt*0.5);
   h.root.rotation.order='YXZ';
   h.root.rotation.y=h.departDir>0?0:Math.PI;
   h.pitch=THREE.MathUtils.lerp(h.pitch||0,-0.06,dt*2.5);
   h.roll=THREE.MathUtils.lerp(h.roll||0,-h.departDir*0.12,dt*3);
   h.root.rotation.z=h.pitch;
   h.root.rotation.x=h.roll;
   if(h.searchlight)h.searchlight.intensity=Math.max(0,h.searchlight.intensity*(1-dt*2.5));
   if(Math.abs(h.root.position.x)>190||h.root.position.y>95||h.root.position.z<-140){
    retireHelicopter(h);
    helicopters.splice(i,1);
    continue;
   }
  }else if(h.life<=0&&!h.crashing){
   h.departing=true;
   h.departDir=(h.root.position.x>=0)?1:-1;
   h.speed=Math.max(h.speed,14);
   if(h.life>0){score+=150;message('HELICOPTER ESCORT +150');sound('bonus');updateHud();}
  }
 }
 if(performanceLab.isEnabled('pedestrians')&&pedestriansActive)crowdTimer-=dt;if(performanceLab.isEnabled('pedestrians')&&pedestriansActive&&crowdTimer<=0){spawnCrowd();crowdTimer=wave<=5?1.8:(wave<=10?2.4:3.0);}
 for(let i=crowd.length-1;performanceLab.isEnabled('pedestrians')&&i>=0;i--){const p=crowd[i];const previousX=p.g.position.x,previousZ=p.g.position.z;p.life-=dt;const threat=dangerZones.find(d=>Math.abs(p.g.position.x-d.x)<d.r&&Math.abs(p.g.position.z-d.z)<d.r);
  const nearCrater=craters.find(c=>Math.hypot(p.g.position.x-c.x,p.g.position.z-c.z)<c.radius+2.2);
  const isPanicked=(p.panic>0)||!!threat||!!nearCrater;
  if(p.panic>0)p.panic-=dt;
  if(threat||nearCrater){
   const hazardX=threat?threat.x:nearCrater.x;
   if(!p.panicAudible){p.panicAudible=true;sound('crowdPanic',{x:p.g.position.x});}
   p.dx=p.g.position.x<hazardX?-1:1;
   p.panicDir=p.dx;
   p.panic=Math.max(p.panic||0,3.5);
   p.life=Math.max(p.life,4);
   if(p.crossing){p.dz=p.g.position.z>BROAD_CENTER?1:-1;}
  }
  if(isPanicked){p.walkSpeed=Math.max(p.walkSpeed,6.2);}
  if(advancePedestrianWind(p,dt)){animatePerson(p.g,p.walkCycle||0,false,false);}
  else if(p.down>0){p.down-=dt;p.vy-=14*dt;p.g.position.y=Math.max(0,p.g.position.y+p.vy*dt);if(p.g.position.y===0)p.vy=0;p.g.rotation.z=THREE.MathUtils.lerp(p.g.rotation.z,(p.dx||1)*1.25,Math.min(1,dt*7));}
  else{
   if(p.crossing){
    if(trafficLightRed||p.jaywalker||isPanicked||(isBroadRoad(p.g.position.x,p.g.position.z)))p.g.position.z+=p.dz*dt*(isPanicked?5.8:p.walkSpeed);
    if((p.dz>0&&p.g.position.z>=29)||(p.dz<0&&p.g.position.z<=4))p.life=0;
   }else{
    p.g.position.x+=(p.panic>0?p.panicDir:p.dx)*dt*(isPanicked?p.walkSpeed:2+Math.sin(elapsed+p.phase));
   }
   const distance=updatePedestrianPose(p,previousX,previousZ,dt);
   p.walkCycle=(p.walkCycle||0)+distance*(isPanicked?6.5:4);
   animatePerson(p.g,p.walkCycle,distance>.0001,isPanicked);
   p.g.rotation.z=THREE.MathUtils.lerp(p.g.rotation.z,isPanicked?Math.sin(elapsed*22)*.20:0,Math.min(1,dt*8));
  }
  if(p.life<=0||Math.abs(p.g.position.x)>95){scene.remove(p.g);crowd.splice(i,1)} }
 for(let i=gasClouds.length-1;i>=0;i--){const c=gasClouds[i];c.life-=dt;c.age+=dt;
  c.v.y-=dt*9.5;c.v.x*=Math.max(0,1-dt*.2);c.mesh.position.addScaledVector(c.v,dt);
  if(c.mesh.position.y<.9){c.mesh.position.y=.9;c.v.y=0;c.v.x*=Math.max(0,1-dt*2);}
  c.mesh.material.opacity=Math.max(0,Math.min(.46,c.life*.12));c.mesh.scale.multiplyScalar(1+dt*.14);
  for(const f of schoolFire)if(f.root.position.distanceTo(c.mesh.position)<4.8)f.suppression=Math.min(1,f.suppression+dt*.32);
  for(const h of helicopters)if(performanceLab.isEnabled('helicopters')&&!h.crashing&&h.root.position.distanceTo(c.mesh.position)<3.8)crashHelicopter(h,true);
  militaryOccupation.applyGas(c.mesh.position,5.6,7);
  if(wave===15)finalSquadron.applyGas(c.mesh.position,6.0);
  for(const car of cars)if(performanceLab.isEnabled('traffic')&&car.emergency&&!car.frozen&&car.life>0&&Math.abs(car.root.position.x-c.mesh.position.x)<5.6&&Math.abs(car.root.position.z-c.mesh.position.z)<22&&c.mesh.position.y<7.2)freezeResponder(car);
  if(c.life<=0){scene.remove(c.mesh);if(!c.mesh.isSprite)c.mesh.geometry?.dispose();c.mesh.material.dispose();gasClouds.splice(i,1)}
 }
 for(const c of cars){if(!performanceLab.isEnabled('traffic'))break;if(c.hostile&&c.police&&!c.frozen&&c.stun<=0&&Math.abs(c.root.position.x-dragon.position.x)<16&&Math.abs(c.root.position.z-dragon.position.z)<18&&Math.random()<dt*.28){
  const m=new THREE.Mesh(new THREE.SphereGeometry(.16,6,4),mats.fire);m.position.copy(c.root.position).add(new THREE.Vector3(0,1.3,0));scene.add(m);
  shots.push({mesh:m,vel:dragon.position.clone().sub(m.position).normalize().multiplyScalar(19),target:dragon.position.clone(),life:1.8,hostile:true,iceGround:c.ice});sound('warning');}
  c.dragonBumpCooldown=Math.max(0,(c.dragonBumpCooldown||0)-dt);
   c.bumpImpulse=Math.max(0,(c.bumpImpulse||0)-dt*2.5);
   c.root.rotation.z=THREE.MathUtils.lerp(c.root.rotation.z,(c.bumpRoll||0)*c.bumpImpulse,Math.min(1,dt*8));
   // Ground vehicle collision with dragon does NOT cost a life: rocks on suspension with sparks
   if(dragon.position.y<2.8&&Math.abs(c.root.position.x-dragon.position.x)<3.2&&Math.abs(c.root.position.z-dragon.position.z)<2.6&&c.dragonBumpCooldown<=0){
    c.dragonBumpCooldown=.8;
    c.bumpImpulse=1.2;
    c.bumpRoll=(c.root.position.x>dragon.position.x?.38:-.38);
    c.speed*=.4;
    emitImpact(c.root.position.x,1.1,c.root.position.z,32,.45);
    sound('impact');
    message('VEHICLE BUMPED BY DRAGON');
   }
 }
}
// Game logic
let interceptionStreak=0,rapidFireUntil=0,schoolShieldUntil=0;
const sessionStats={start:0,shots:0,intercepts:0,militaryInterceptions:0,hunters:0,damage:0,highestWave:1,deaths:0,powerups:0,frames:0,frameTimeTotal:0,galeConvergences:0,combos:0,lastSecondSaves:0,nearMisses:0,wetShots:0};
const waveStats=[];
// Rolling frame-time samples for actual playtest comparisons; samples are bounded.
const playtestFrameMs=[];let peakDrawCalls=0;const stallEvents=[];
function playtestPercentile(p){if(!playtestFrameMs.length)return null;const sorted=[...playtestFrameMs].sort((a,b)=>a-b);return +(sorted[Math.min(sorted.length-1,Math.floor((sorted.length-1)*p))]).toFixed(1);}
function telemetrySnapshot(){return {version:GAME_VERSION,build:BUILD_ID,loop:rallyRecoveryChoice?'rally-recovery':rallyLoop?'rally':'standard',difficulty:document.getElementById('difficulty')?.value||'normal',graphics:visualPreset,durationSeconds:Math.round(elapsed),wave,score,schoolHealth:hp,dragonLives,...sessionStats,accuracy:sessionStats.shots?+(sessionStats.intercepts/sessionStats.shots).toFixed(3):0,waves:waveStats,performance:{bimBatch:window.__DD_BIM_BATCH||null,averageFPS:sessionStats.frameTimeTotal?+(sessionStats.frames/sessionStats.frameTimeTotal).toFixed(1):null,p95FrameMs:playtestPercentile(.95),p99FrameMs:playtestPercentile(.99),peakDrawCalls,sampleCount:playtestFrameMs.length,
  staticStreetBatch:streetBatchStats,cityExtensionProps:cityExtensions.propsEstimate,parkedCars:parkedCars.length,neighborhoodBatches:neighborhood.batchStats,skyline:skylineBackdrop.getStats(),vehiclePool:vehiclePoolStats,meteorAssets:rockStats,blastPool:blastStats,
  adaptiveResolution:+adaptiveResolution.toFixed(2),adaptiveAdjustments,maxRenderFPS,
  performanceLab:performanceLab.export(),captureLab: {history:captureLab.history()},frameHealth:frameHealth.summary(),
  simulationCpuMs:percentiles(detailedTimings.sim),renderSubmissionCpuMs:percentiles(detailedTimings.render),
  stalls:stallEvents.slice(-45),
  warning:'renderSubmissionCpuMs is CPU submission time, not a GPU timestamp. Large RAF gaps may arise outside instrumented game code; see frameHealth.'}};}
function exportTelemetry(){const blob=new Blob([JSON.stringify(telemetrySnapshot(),null,2)],{type:'application/json'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='dragon-defense-session-'+Date.now()+'.json';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000)}
document.getElementById('export-stats')?.addEventListener('click',exportTelemetry);
function updatePowerHud(){const e=document.getElementById('power-status');if(!e)return;
 const rapid=Math.max(0,rapidFireUntil-elapsed),shield=Math.max(0,schoolShieldUntil-elapsed),blue=Math.max(0,blueFireballUntil-elapsed),green=Math.max(0,greenBreathUntil-elapsed);
 const stream=Math.max(0,fireStreamUntil-elapsed),mega=Math.max(0,megaFireBreathUntil-elapsed),purple=Math.max(0,purpleRamUntil-elapsed);
 let extra='';
 if(stream>0)extra+=`  |  🔥 STREAM ${stream.toFixed(1)}s`;
 if(mega>0)extra+=`  |  ⚡ MEGA ${mega.toFixed(1)}s`;
 if(purple>0)extra+=`  |  💜 RAM BUSTER ${purple.toFixed(1)}s`;
 if(blue>0)extra+=`  |  💙 BLUE ${blue.toFixed(1)}s`;
 if(green>0)extra+=`  |  💚 GALE ${green.toFixed(1)}s`;
 const satBat=orbitalTheater?Math.round(orbitalTheater.getBattery()*100):100;
 const satStatus=satBat>0?`⚡ SATS ${satBat}%`:'⚡ SATS RECHARGING';
 e.textContent=`INTERCEPT ${interceptionStreak}/5  |  ${satStatus}  |  RAPID ${rapid.toFixed(1)}s  |  SHIELD ${shield.toFixed(1)}s${extra}`;
}
const hunterWarnings=[];
function warnHunter(){const el=document.getElementById('hunter-warning');if(el){el.textContent='⚠ FLAMING METEOR INBOUND — DODGE OR INTERCEPT';el.style.opacity='1';setTimeout(()=>{el.style.opacity='0'},1800)}}

let score=0,hp=100,wave=1,active=false,paused=false,spawnTimer=0,remaining=0,between=0,stormTimer=0,elapsed=0,shake=0,cooldown=0;
let fireStreamUntil=0,megaFireBreathUntil=0,purpleRamUntil=0,waveFireStreamRemaining=1,wavePurpleRemaining=1,satellitesCleared=false,finaleAscentPrompted=false,lastWingFlapTime=0,lastDiveWhooshTime=0,diveSonicBoomTriggered=false;
const escapingPilots=[];
const loopOptions=new URLSearchParams(location.search);
const rallyLoop=loopOptions.get('loop')==='rally';
const rallyRecoveryChoice=rallyLoop&&loopOptions.get('recovery')==='choice';
let rallyShieldQueued=false;
const impactMarker=rallyLoop?new THREE.Mesh(new THREE.RingGeometry(1.08,1.45,32),
 new THREE.MeshBasicMaterial({color:0xffbc67,transparent:true,opacity:.85,depthTest:false,depthWrite:false})):null;
if(impactMarker){impactMarker.visible=false;impactMarker.renderOrder=20;scene.add(impactMarker);}
const effects=new THREE.Group();scene.add(effects);
const effectObjects=[];
const _sharedShockRingGeo=new THREE.RingGeometry(.84,.96,20);
const _sharedShockPlaneGeo=new THREE.PlaneGeometry(1,1);
const _sharedShockRingMat=new THREE.MeshBasicMaterial({color:0xffd59a,transparent:true,opacity:.34,side:THREE.DoubleSide,depthWrite:false});
const _sharedShockFlashMat=new THREE.MeshBasicMaterial({map:visualBank.images.flash,color:0xffd695,transparent:true,opacity:.8,depthWrite:false,side:THREE.DoubleSide,blending:THREE.AdditiveBlending});
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
 const ringGeo=surface?_sharedShockRingGeo:_sharedShockPlaneGeo;
 const ringMat=surface?_sharedShockRingMat:_sharedShockFlashMat;
 const ring=new THREE.Mesh(ringGeo,ringMat);
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
  if(e.life<=0){effects.remove(e.mesh);effectObjects.splice(i,1)}
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
function drawRallyRecap(c,recap){
 c.fillStyle='#9be8f0';c.font='bold 11px sans-serif';
 c.fillText('WAVE '+recap.wave+' DEFENDED',10,20);
 c.fillStyle='#e8f4fa';c.font='13px sans-serif';
 c.fillText('Interceptions: '+recap.intercepts,10,49);
 c.fillText('School: '+(recap.schoolLost?'−'+recap.schoolLost+' pts':'held'),10,76);
 c.fillText('Block: '+(recap.blockLost?'−'+recap.blockLost+' pts':'held'),10,103);
}
function updateMeteorRadar(dt){
 radarTick-=dt;
 if(radarTick>0)return;
 radarTick=.1;
 const warning=impactMarker?selectMeteorWarning(meteors,neighborhood.school,neighborhood.targetBuildings):null;
 if(impactMarker){
  impactMarker.visible=Boolean(warning);
  if(warning){
   impactMarker.position.copy(warning.target);
   impactMarker.position.z+=.2;
   if(warning.eta<=3.5)warnCrowd(warning.target.x,warning.target.z,24);
   impactMarker.material.color.set(warning.eta<=2?0xff765d:0xffbc67);
  }
 }
 const c=radarCtx;
 c.clearRect(0,0,160,130);
 const recap=rallyLoop&&between>0?waveStats.at(-1)?.rallyResult:null;
 if(recap&&!warning){
  drawRallyRecap(c,recap);
  return;
 }
 c.strokeStyle='#3b777a';c.lineWidth=1;
 c.beginPath();c.arc(80,68,53,0,Math.PI*2);c.stroke();
 c.beginPath();c.arc(80,68,27,0,Math.PI*2);c.stroke();
 c.beginPath();c.moveTo(27,68);c.lineTo(133,68);c.moveTo(80,15);c.lineTo(80,121);c.stroke();
 c.fillStyle='#9be8f0';c.font='bold 10px sans-serif';
 c.fillText(warning?warning.label+' IMPACT':rallyLoop?'RALLY RADAR':'INCOMING RADAR',7,12);
 if(warning)c.fillText(Math.max(1,Math.ceil(warning.eta))+'s',139,12);
 c.fillStyle='#4ff5b3';c.fillRect(77,65,6,6);
 for(const meteor of meteors){
  if(meteor.grounded)continue;
  const isHighThreat=(meteor.size>=3.0||meteor.boss||meteor.isPowerup);
  const x=80+THREE.MathUtils.clamp((meteor.mesh.position.x-dragon.position.x)*.75,-51,51);
  const y=68-THREE.MathUtils.clamp((meteor.mesh.position.y-dragon.position.y)*.75,-51,51);
  if(meteor.mesh.position.y>dragon.position.y+45&&isHighThreat){
   c.fillStyle=meteor.isPowerup==='purple_ram'?'#c084fc':(meteor.burning?'#ff4d32':'#ffd152');
   c.beginPath();c.moveTo(x-4,17);c.lineTo(x+4,17);c.lineTo(x,22);c.closePath();c.fill();
  }
  c.fillStyle=meteor.isPowerup==='purple_ram'?'#c084fc':(meteor.burning?'#ff7a32':'#ffcf56');
  const dotRadius=meteor.boss?4.5:(meteor.size>=3.0?3.4:2.2);
  c.beginPath();c.arc(x,y,dotRadius,0,Math.PI*2);c.fill();
  if(warning?.meteor===meteor){
   c.strokeStyle='#fff2ce';
   c.beginPath();c.arc(x,y,dotRadius+3.5,0,Math.PI*2);c.stroke();
  }
 }
}
let bossSpawned=false,bossDefeated=false;let dragonMeteorTimer=8;const input=createInputState();
const difficulty=()=>({easy:.40,normal:1.0,hard:2.2}[document.getElementById('difficulty')?.value]||1);
const easyMode=()=>document.getElementById('difficulty')?.value==='easy';
let facing=1,turnTime=0;const explosionLights=[];let pointer=new THREE.Vector3(0,17,0);const ray=new THREE.Raycaster(),plane=new THREE.Plane(new THREE.Vector3(0,0,1),0);
// Pointer events can arrive many times per frame. Reuse raycast scratch values.
const aimNdc=new THREE.Vector2(),aimIntersection=new THREE.Vector3();
// Dynamic visible 3D targeting reticle tracking cursor across full screen
const targetingReticle=new THREE.Group();
const reticleRing=new THREE.Mesh(new THREE.RingGeometry(1.2,1.4,24),new THREE.MeshBasicMaterial({color:0x3be5ff,transparent:true,opacity:.85,depthWrite:false,side:THREE.DoubleSide}));
targetingReticle.add(reticleRing);
const reticleCenter=new THREE.Mesh(new THREE.CircleGeometry(.22,12),new THREE.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:.95,depthWrite:false}));
targetingReticle.add(reticleCenter);
for(let i=0;i<4;i++){
 const tick=new THREE.Mesh(new THREE.PlaneGeometry(.14,.65),new THREE.MeshBasicMaterial({color:0x78eeff,transparent:true,opacity:.85,depthWrite:false}));
 tick.position.set(Math.cos(i*Math.PI/2)*1.65,Math.sin(i*Math.PI/2)*1.65,0);
 tick.rotation.z=i*Math.PI/2;
 targetingReticle.add(tick);
}
targetingReticle.position.set(0,17,1.5);
scene.add(targetingReticle);

function aim(e){
 const r=renderer.domElement.getBoundingClientRect();
 const nx=THREE.MathUtils.clamp((e.clientX-r.left)/r.width*2-1,-1,1);
 const ny=THREE.MathUtils.clamp(-((e.clientY-r.top)/r.height*2-1),-1,1);
 aimNdc.set(nx,ny);
 ray.setFromCamera(aimNdc,camera);
 if(ray.ray.intersectPlane(plane,aimIntersection)){
  const maxAimX=340+Math.abs(cameraScrollX);
  pointer.set(THREE.MathUtils.clamp(aimIntersection.x,-maxAimX,maxAimX),THREE.MathUtils.clamp(aimIntersection.y,-12,flightCeiling+35),0);
  targetingReticle.position.set(pointer.x,pointer.y,1.5);
  targetingReticle.visible=active&&!paused;
 }
}
// Full-screen edge tracking: keep reticle synchronized even at the extreme edges of the browser and over HUD buttons
renderer.domElement.addEventListener('pointermove',aim);
window.addEventListener('pointermove',aim,{passive:true});
renderer.domElement.addEventListener('pointerdown',aim);
window.addEventListener('pointerdown',aim,{passive:true});
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
 material:new THREE.MeshBasicMaterial({map:visualBank.images.dust,color:0xd6c2a5,
  transparent:true,opacity:.52,depthWrite:false,side:THREE.DoubleSide}),
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
// The same live muzzle origin drives gust physics and the visible cone.
function syncWindMouth(){
 gustOrigin.copy(getBreathMouthWorld());
 gustDirection.copy(pointer).sub(gustOrigin);
 if(gustDirection.lengthSq()<.01)gustDirection.set(facing,0,0);
 else gustDirection.normalize();
 windVisual.position.copy(gustOrigin);
 windVisual.quaternion.setFromUnitVectors(breathXAxis,gustDirection);
}
function gustCooldownReset(){windCooldown=4;gustId++;}
function releaseWind(){if(!holdStart)return;if(!dragonEnabled||(freeFlightMode&&sandboxTool==='meteor')){holdStart=0;return;}const held=(performance.now()-holdStart)/1000;holdStart=0;if(held<.27){shoot();return;}if(held<.7||windCooldown>0||dragonStun>0||!active||paused){message(windCooldown>0?'WIND RECHARGING':'HOLD LONGER TO INHALE');return;}
 syncWindMouth();gustTime=.85;gustCooldownReset();gustRoadNotified=false;gustMissileNotified=false;windActive=true;if(wave===15)finalSquadron.deflectMissiles(dragon.position,gustDirection,26,1.2);sound('bonus');message('PAULO UNLEASHES A GALE!');}
let gasHolding=false;
let activeMouseButtons=0;
function cancelGasHold(){gasHolding=false;}
window.addEventListener('contextmenu',e=>{e.preventDefault();activeMouseButtons=e.buttons;if((e.buttons&2)===0&&!input.isDown(ACTIONS.GAS))cancelGasHold();},{capture:true});
renderer.domElement.addEventListener('pointerdown',e=>{
 if(e.pointerType==='touch')return;
 activeMouseButtons=e.buttons;
 aim(e);
 if(!dragonEnabled||(freeFlightMode&&sandboxTool==='meteor'))return;
 if(dragonStun>0){
  dragonStun=Math.max(0,dragonStun-0.22);
  flashAt(dragon.position.x,dragon.position.y,dragon.position.z,0.9);
  sound('warning');
  if(dragonStun<=0){recoveryLift=2.5;dragonGroundImpact=false;message('PAULO BREAKS FREE FROM SHOCK!');}
  else message(`ELECTRICAL SHOCK — TAP TO BREAK FREE (${dragonStun.toFixed(1)}s)`);
 }
 if(e.button===2){e.preventDefault();gasHolding=true;gasAttack();return;}
 if(e.button!==0)return;
 holdStart=performance.now();
 if(elapsed<fireStreamUntil||elapsed<megaFireBreathUntil||elapsed<rapidFireUntil)shoot();
});
window.addEventListener('pointerdown',e=>{activeMouseButtons=e.buttons;},{capture:true,passive:true});
window.addEventListener('pointermove',e=>{activeMouseButtons=e.buttons;if((e.buttons&2)===0&&!input.isDown(ACTIONS.GAS))cancelGasHold();},{capture:true,passive:true});
window.addEventListener('mousemove',e=>{activeMouseButtons=e.buttons;if((e.buttons&2)===0&&!input.isDown(ACTIONS.GAS))cancelGasHold();},{capture:true,passive:true});
window.addEventListener('pointerup',e=>{activeMouseButtons=e.buttons;if(e.button===2||(e.buttons&2)===0)cancelGasHold();if(e.button===0){if(dragonEnabled&&(!freeFlightMode||sandboxTool!=='meteor'))releaseWind();else holdStart=0;}},{capture:true});
window.addEventListener('mouseup',e=>{activeMouseButtons=e.buttons;if(e.button===2||(e.buttons&2)===0)cancelGasHold();if(e.button===0){if(dragonEnabled&&(!freeFlightMode||sandboxTool!=='meteor'))releaseWind();else holdStart=0;}},{capture:true});
window.addEventListener('pointercancel',()=>{activeMouseButtons=0;cancelGasHold();},{capture:true});
window.addEventListener('keydown',e=>{const action=input.keyDown(e.code);if(action)e.preventDefault();if(e.repeat)return;if(dragonStun>0){dragonStun=Math.max(0,dragonStun-0.22);flashAt(dragon.position.x,dragon.position.y,dragon.position.z,0.9);sound('warning');if(dragonStun<=0){recoveryLift=2.5;dragonGroundImpact=false;message('PAULO BREAKS FREE FROM SHOCK!');}else message(`ELECTRICAL SHOCK — TAP KEYS TO BREAK FREE (${dragonStun.toFixed(1)}s)`);}if(action===ACTIONS.FIRE)shoot();if(action===ACTIONS.PAUSE)togglePause();if(action===ACTIONS.GAS){gasHolding=true;gasAttack();}if(action===ACTIONS.DEBUG)profiler.toggle();});
window.addEventListener('keyup',e=>{const action=input.keyUp(e.code);if(action===ACTIONS.GAS)cancelGasHold();if(e.code==='Space')holdStart=0;});
window.addEventListener('blur',()=>{activeMouseButtons=0;cancelGasHold();input.clear();holdStart=0;});
document.addEventListener('visibilitychange',()=>{if(document.hidden){activeMouseButtons=0;cancelGasHold();input.clear();holdStart=0;}});
window.addEventListener('pagehide',()=>{activeMouseButtons=0;cancelGasHold();input.clear();holdStart=0;});
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
 if(!dragonEnabled){
  windCooldown=0;gustTime=0;windActive=false;
  if(windVisual)windVisual.visible=false;
  clearWindDebris();
  cinematicFX.setWind(null,null,0);
  return;
 }
 windCooldown=Math.max(0,windCooldown-dt);gustTime=Math.max(0,gustTime-dt);windActive=gustTime>0;windVisual.visible=windActive;updateBreathMeter();
 if(windActive)syncWindMouth();
 cinematicFX.setWind(gustOrigin,gustDirection,windActive?Math.min(1,gustTime/.55):0);
 if(!windActive){clearWindDebris();updateWindPlanting(dt);for(const c of cars)advanceVehicleWind(c,dt);}
 // While inhaling, Paulo visibly swells and leans back; gust is emitted on release.
 const inhaling=holdStart&&windCooldown<=0?Math.min(1,(performance.now()-holdStart)/850):0;
 dragon.scale.y=THREE.MathUtils.lerp(dragon.scale.y,1+inhaling*.22,Math.min(1,dt*8));
 if(!windActive)return;
 const origin=gustOrigin,direction=gustDirection,progress=1-gustTime/.85;
 const isGreenGale=elapsed<greenBreathUntil;
 const galePowerMult=isGreenGale?3.0:1.0;
 windMaterial.color.setHex(isGreenGale?0x22ff66:0xc4f2ff);
 windVisual.scale.set(isGreenGale?1.8:1,isGreenGale?1.8:1,isGreenGale?1.8:1);
 for(const particle of windParticles){const t=(particle.seed+progress*.75)%1;
  const spread=1.2+t*15,swirl=Math.sin(t*17+particle.phase+elapsed*9)*(1+t*2);
  particle.sprite.position.set(1+t*48,Math.cos(particle.phase)*spread*particle.spread+swirl,Math.sin(particle.phase)*spread*.55);
  const radius=(.55+t*3.2)*(0.75+particle.spread*.45);particle.sprite.scale.set(radius*2.2,radius,1);
  particle.sprite.material.opacity=(.12+.26*Math.sin(Math.PI*t)) * Math.min(1,gustTime*5);
 }
 const rocketsDeflected=militaryOccupation.deflectWind(origin,direction,dt);
 if(rocketsDeflected.affected&&!gustMissileNotified){gustMissileNotified=true;message('PAULO DEFLECTS MILITARY ROCKETS!');}
 for(const m of meteors){if(m.testMeteor||m.grounded||!m.mesh)continue;const delta=m.mesh.position.clone().sub(origin),along=delta.dot(direction),across=delta.clone().addScaledVector(direction,-along).length();if(along>0&&along<(isGreenGale?75:43)&&across<(isGreenGale?12:5)+along*.35){m.vel.addScaledVector(direction,dt*32*galePowerMult/(1+(m.size||1)*.16));m.vel.y+=dt*(isGreenGale?65.0:8.0);m.windPushedTime=elapsed;}}
 for(const h of helicopters){if(h.crashing||!h.root)continue;const delta=h.root.position.clone().sub(origin),along=delta.dot(direction),across=delta.clone().addScaledVector(direction,-along).length();if(along>0&&along<48&&across<7+along*.35){h.root.position.addScaledVector(direction,dt*29);h.root.position.y+=dt*5;if(h.disorientTime<=0){h.disorientTime=5;h.contactTime=0;message('HELICOPTER CAUGHT IN WIND — LOSING CONTROL!');}h.evasion=Math.max(h.evasion,1);h.dodgeSide=direction.x>0?1:-1;}}
 // Project the gust onto street level, independent of the dragon’s altitude.
 let windX=direction.x,windZ=direction.z;
 const groundLen=Math.hypot(windX,windZ);
 if(groundLen<.15){windX=facing;windZ=0;}
 else {windX/=groundLen;windZ/=groundLen;}
 const groundOrigin=windGroundOrigin.set(origin.x,0,origin.z);
 // Move a rooftop gust’s street footprint to the curb.
 if(groundOrigin.z>-12&&groundOrigin.z<12)groundOrigin.z=12;
 applyStreetGust(dt,groundOrigin,windX,windZ,progress);
 for(const fire of schoolFire){const delta=fire.root.position.clone().sub(origin),along=delta.dot(direction);if(along>0&&along<43&&delta.clone().addScaledVector(direction,-along).length()<8+along*.17)fire.suppression=Math.min(1,fire.suppression+dt*1.7);}
}
const windGroundOrigin=new THREE.Vector3();
function applyStreetGust(dt,origin,dx,dz,progress,vehicles=cars,people=crowd){
 let vehiclesHit=0;
 for(const car of vehicles){
  if(car.root?.visible&&hitVehicleWithWind(car,gustId,origin.x,origin.z,dx,dz))vehiclesHit++;
  advanceVehicleWind(car,dt);
 }
 if(vehicles===cars&&vehiclesHit&&!gustRoadNotified){gustRoadNotified=true;message('DRAGON GALE — TRAFFIC SKIDDING!');}
 for(const person of people)hitPedestrianWithWind(person,gustId,origin.x,origin.z,dx,dz);
 const pulse=Math.min(1,(1-progress)*4);
 const foliageBend=updateWindPlanting(dt,origin,dx,dz,pulse*(.86+.14*Math.sin(progress*36)));
 // Two instanced batches. Each band spirals around the direction of travel.
 windDustPool.begin();windLitterPool.begin();
 for(let i=0;i<44;i++){
  const seed=i/44,band=i%3;
  const t=(seed+progress*(.55+band*.12))%1;
  const travel=3+t*57;
  const angle=travel*.24+band*2.094-progress*14;
  const radius=2+t*13;
  const side=Math.cos(angle)*radius;
  const fade=pulse*Math.min(1,t*9,(1-t)*6);
  windDebrisPoint.set(origin.x+dx*travel-dz*side,
   .28+(1+Math.sin(angle))*radius*.29,
   origin.z+dz*travel+dx*side);
  windDustPool.add(windDebrisPoint,Math.max(.02,(1.35+t*4.6)*fade),angle);
  if(i%3===0){
   windDebrisPoint.y=.18+(1+Math.sin(angle+.9))*radius*.19;
   windLitterPool.add(windDebrisPoint,Math.max(.02,(1.1+t*1.5)*fade),angle*3);
  }
 }
 windDustPool.end();windLitterPool.end();
 return foliageBend;
}
function shoot(){if(!dragonEnabled||(freeFlightMode&&sandboxTool==='meteor')||dragonStun>0||!active||paused||cooldown>0)return;
const isWet=waterDisable>0;
const isMega=!isWet&&(elapsed<megaFireBreathUntil);
const isStream=!isWet&&(elapsed<fireStreamUntil);
const isBlue=!isWet&&!isMega&&!isStream&&(elapsed<blueFireballUntil);
cooldown=isStream?.038:(elapsed<rapidFireUntil?.045:(easyMode()?.12:(isMega?.048:(isBlue?.14:(isWet?.24:.19)))));
sessionStats.shots++;
if(isWet)sessionStats.wetShots=(sessionStats.wetShots||0)+1;
pauloFirePoseUntil=elapsed+.26;
sound(isWet?'steam':(isMega?'megaFire':(isStream?'fire':'shoot')),{x:dragon.position.x});
const start=getBreathMouthWorld(new THREE.Vector3()),target=pointer.clone(),dir=target.clone().sub(start).normalize();
if(isStream||isMega){
 const spreadAngle=isMega?0.08:0.055;
 dir.x+=(Math.random()-0.5)*spreadAngle;
 dir.y+=(Math.random()-0.5)*spreadAngle;
 dir.z+=(Math.random()-0.5)*0.03;
 dir.normalize();
}
const shotSize=isWet?1.3:(isMega?3.6:(isStream?1.8:(isBlue?2.6:1.0)));
const shotSpeed=isWet?45:(isMega?120:(isStream?78:(isBlue?84:64)));
const mesh=new THREE.Mesh(sharedShotGeometry,isWet?mats.steamyFire:(isMega?goldRedPlasmaMaterial:(isStream?fizzingFireMaterial:(isBlue?mats.blueFire:mats.fire))));
if(shotSize!==1.0)mesh.scale.set(shotSize,shotSize,shotSize);
mesh.position.copy(start);

// Radiant multi-layered additive flame corona & trailing tongues on EVERY dragon shot!
const mainCoronaMat=isWet?steamyFireCoronaMat:(isMega?goldRedPowerupCoronaMat:(isBlue?bluePowerupCoronaMat:(isStream?fizzingPowerupCoronaMat:dragonFireCoronaMat)));
const s1=new THREE.Sprite(mainCoronaMat);
s1.scale.setScalar(shotSize*(isMega?2.0:(isBlue?1.6:(isStream?1.4:1.4))));
mesh.add(s1);
if(!isWet){
 const s2=new THREE.Sprite(mainCoronaMat);
 s2.scale.setScalar(shotSize*(isMega?1.5:(isBlue?1.2:1.0)));
 s2.position.set(0,.15,-.35);
 mesh.add(s2);
 const s3=new THREE.Sprite(isMega?goldRedPowerupCoronaMat:(isBlue?bluePowerupCoronaMat:dragonFireCoreMat));
 s3.scale.setScalar(shotSize*0.95);
 mesh.add(s3);
}

// Flash & dynamic projectile light on EVERY shot!
dragonFireLight.position.copy(start);
dragonFireLight.distance=isMega?32:(isBlue?26:(isStream?24:20));
dragonFireLight.intensity=isMega?3.5:(isBlue?2.6:(isStream?2.2:1.8));
dragonFireLight.color.setHex(isMega?0xffea70:(isBlue?0x00d4ff:(isStream?0xff6611:0xff7722)));
flashAt(start.x,start.y,start.z,isMega?2.2:(isBlue?1.6:(isStream?1.2:1.0)));
shake=Math.max(shake,isMega?.20:.08);

scene.add(mesh);
const life=isStream?.75:(isMega?1.2:3.8);
shots.push({mesh,vel:dir.multiplyScalar(shotSpeed),target,life,maxLife:life,baseSize:shotSize,blue:isBlue,mega:isMega,isStream,wet:isWet,damageMult:isWet?0.5:(isMega?15.0:(isBlue?3.0:(isStream?2.2:1.0)))});
}
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
function registerIntercept(m,rally=rallyLoop){
 sessionStats.intercepts++;
 if(wave<15&&!m.fragment&&!m.grounded){
  const boost=rally?6:2.5;
  blockCharge=Math.min(100,blockCharge+boost);
  updateBlockButton();
 }
 interceptionStreak++;
 if(m.dragonHunter){sessionStats.hunters++;activateShield();}
 if(m.isPowerup==='blue_fireball'){
  blueFireballUntil=Math.max(blueFireballUntil,elapsed+16);
  sound('bonus');
  flashAt(m.mesh.position.x,m.mesh.position.y,m.mesh.position.z,3.5);
  cinematicFX.shock(m.mesh.position,7.0);
  message('⚡ BLUE PLASMA METEOR DESTROYED — POWERFUL BLUE FIREBALLS ACTIVATED (16s)!');
 }else if(m.isPowerup==='green_breath'){
  greenBreathUntil=Math.max(greenBreathUntil,elapsed+18);
  sound('bonus');
  flashAt(m.mesh.position.x,m.mesh.position.y,m.mesh.position.z,3.5);
  cinematicFX.shock(m.mesh.position,7.0);
  message('🌪️ GREEN TEMPEST METEOR DESTROYED — 3X GALE FORCE BREATH (BLOW METEORS TO SPACE)!');
 }else if(m.isPowerup==='fire_stream'){
  fireStreamUntil=Math.max(fireStreamUntil,elapsed+8);
  sound('bonus');
  flashAt(m.mesh.position.x,m.mesh.position.y,m.mesh.position.z,3.5);
  cinematicFX.shock(m.mesh.position,7.0);
  message('🔥 FIZZING FLAME METEOR DESTROYED — CONTINUOUS FIRE BREATH TORRENT (8s)!');
 }else if(m.isPowerup==='mega_fire_breath'){
  megaFireBreathUntil=Math.max(megaFireBreathUntil,elapsed+16);
  sound('bonus');
  sound('dragonRoar',{variant:'challenge',x:dragon.position.x});
  flashAt(m.mesh.position.x,m.mesh.position.y,m.mesh.position.z,4.5);
  cinematicFX.shock(m.mesh.position,9.0);
  message('⚡ SPARKLING GOLD & RED TITAN METEOR DESTROYED — MEGA FIRE BREATH ACTIVATED (16s)!');
 }
 if(m.windPushedTime&&(elapsed-m.windPushedTime)<3.5){
  sessionStats.galeConvergences++;
  score+=500;
  sound('combo');
  cinematicFX.shock(m.mesh.position,5.5);
  message('🌪️ GALE CONVERGENCE COMBO! +500 PTS');
 }
 const timeToImpact=(m.vel&&m.vel.y<-0.1)?(m.mesh.position.y-m.target.y)/Math.abs(m.vel.y):999;
 if(timeToImpact<=1.2&&m.mesh.position.y<14&&!m.fragment){
  sessionStats.lastSecondSaves++;
  score+=200;
  sound('fanfare');
  message('🦸 HEROIC SAVE! LAST-SECOND INTERCEPT +200 PTS');
 }
 if(interceptionStreak>=5){sessionStats.powerups++;interceptionStreak=0;rapidFireUntil=elapsed+4;message('5 INTERCEPTIONS — MACHINE-GUN FLAME 4s');sound('bonus');}
 updatePowerHud();
}
function updateShield(){const on=active&&elapsed<schoolShieldUntil;shieldMesh.visible=on;if(!on||!schoolBounds)return;const center=new THREE.Vector3();schoolBounds.getCenter(center);const size=new THREE.Vector3();schoolBounds.getSize(size);shieldMesh.position.set(center.x,Math.min(1,schoolBounds.min.y),center.z);shieldMesh.scale.set(Math.max(10,size.x*.72),Math.max(15,size.y*1.3),Math.max(11,size.z*.72));shieldMesh.material.opacity=.14+.045*Math.sin(elapsed*6);}
function groundFireball(x,y,z,size=1){panicCrowdAt(x,z,Math.max(22,14+size*6));shake=Math.max(shake,Math.min(1.8,.2+size*.5));blast(x,y,z,Math.min(16,Math.max(1.2,size*4.2)));emitImpact(x,y,z,Math.min(160,Math.round(25+size*35)),Math.max(.25,size*.7));}
const hunterGeometry=new THREE.IcosahedronGeometry(.8,1);
const hunterMaterial=new THREE.MeshBasicMaterial({color:0xff6d22});
function spawnDragonMeteor(){
 if(wave<=4||!active)return;
 const mesh=new THREE.Mesh(hunterGeometry,hunterMaterial);
 mesh.position.set(dragon.position.x+(Math.random()<.5?-48:48),meteorEntryHeight(dragon.position.z,.8,335+Math.random()*25),dragon.position.z);scene.add(mesh);
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
const moltenMaterial=rockMaterialVariants[5].clone();
moltenMaterial.emissive.setHex(0xff3b05);
moltenMaterial.emissiveIntensity=2.5;
moltenMaterial.onBeforeCompile=shader=>{
 shader.vertexShader='varying vec3 rockPoint;\n'+shader.vertexShader;
 shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nrockPoint=position;');
 shader.fragmentShader='varying vec3 rockPoint;\n'+shader.fragmentShader;
 shader.fragmentShader=shader.fragmentShader.replace('#include <emissivemap_fragment>',`#include <emissivemap_fragment>
 float veins=abs(sin(rockPoint.x*3.5+sin(rockPoint.y*4.)*.8)*sin(rockPoint.z*4.5+rockPoint.y*2.7));
 float lava=1.-smoothstep(.035,.13,veins);
 totalEmissiveRadiance*=lava;
 diffuseColor.rgb=mix(diffuseColor.rgb,vec3(.22,.035,.006),lava*.6);`);
};
const flamingMaterial=rockMaterialVariants[5].clone();
flamingMaterial.emissive.setHex(0xff4500);
flamingMaterial.emissiveIntensity=2.8;
flamingMaterial.onBeforeCompile=shader=>{
 shader.vertexShader='varying vec3 rockPoint;\n'+shader.vertexShader;
 shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nrockPoint=position;');
 shader.fragmentShader='varying vec3 rockPoint;\n'+shader.fragmentShader;
 shader.fragmentShader=shader.fragmentShader.replace('#include <emissivemap_fragment>',`#include <emissivemap_fragment>
 float veins=abs(sin(rockPoint.x*4.2+sin(rockPoint.y*4.8)*.9)*sin(rockPoint.z*4.6+rockPoint.y*3.0));
 float fire=1.-smoothstep(.03,.16,veins);
 totalEmissiveRadiance*=fire;
 diffuseColor.rgb=mix(diffuseColor.rgb,vec3(.24,.04,.008),fire*.6);`);
};
const fastImpactMaterial=rockMaterialVariants[5].clone();
fastImpactMaterial.emissive.setHex(0xff621c);
fastImpactMaterial.emissiveIntensity=3.6;
const bluePlasmaMaterial=rockMaterialVariants[5].clone();
bluePlasmaMaterial.emissive.setHex(0x0099ff);bluePlasmaMaterial.emissiveIntensity=3.8;bluePlasmaMaterial.color.setHex(0x1a4570);
bluePlasmaMaterial.onBeforeCompile=shader=>{
 shader.vertexShader='varying vec3 rockPoint;\n'+shader.vertexShader;
 shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nrockPoint=position;');
 shader.fragmentShader='varying vec3 rockPoint;\n'+shader.fragmentShader;
 shader.fragmentShader=shader.fragmentShader.replace('#include <emissivemap_fragment>',`#include <emissivemap_fragment>
 float veins=abs(sin(rockPoint.x*4.5+sin(rockPoint.y*5.)*.9)*sin(rockPoint.z*5.5+rockPoint.y*3.2));
 float energy=1.-smoothstep(.03,.16,veins);totalEmissiveRadiance=vec3(.05,.45,.95)*1.5+energy*vec3(.2,.7,1.5)*3.5;diffuseColor.rgb=mix(diffuseColor.rgb,vec3(.05,.45,.95),energy*.8);`);
};
const greenPlasmaMaterial=rockMaterialVariants[5].clone();
const fizzingFireMaterial=rockMaterialVariants[5].clone();fizzingFireMaterial.emissive.setHex(0xff5500);fizzingFireMaterial.emissiveIntensity=4.6;fizzingFireMaterial.color.setHex(0x902500);
fizzingFireMaterial.onBeforeCompile=shader=>{
 shader.vertexShader='varying vec3 rockPoint;\n'+shader.vertexShader;
 shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nrockPoint=position;');
 shader.fragmentShader='varying vec3 rockPoint;\n'+shader.fragmentShader;
 shader.fragmentShader=shader.fragmentShader.replace('#include <emissivemap_fragment>',`#include <emissivemap_fragment>
 float veins=abs(sin(rockPoint.x*6.0+sin(rockPoint.y*6.5)*1.2)*sin(rockPoint.z*6.0+rockPoint.y*4.0));
 float energy=1.-smoothstep(.02,.18,veins);totalEmissiveRadiance=vec3(1.0,.35,.05)*2.0+energy*vec3(2.5,1.5,.3)*4.2;diffuseColor.rgb=mix(diffuseColor.rgb,vec3(1.0,.45,.05),energy*.85);`);
};
const goldRedPlasmaMaterial=rockMaterialVariants[5].clone();
goldRedPlasmaMaterial.color.setHex(0xfffaea); // Radiant ivory white-gold crust
goldRedPlasmaMaterial.emissive.setHex(0xffea70); // Brilliant sparkling solar gold-white emissive glow
goldRedPlasmaMaterial.emissiveIntensity=6.2;
goldRedPlasmaMaterial.onBeforeCompile=shader=>{
 shader.vertexShader='varying vec3 rockPoint;\n'+shader.vertexShader;
 shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nrockPoint=position;');
 shader.fragmentShader='varying vec3 rockPoint;\n'+shader.fragmentShader;
 shader.fragmentShader=shader.fragmentShader.replace('#include <emissivemap_fragment>',`#include <emissivemap_fragment>
 float sparkle=pow(abs(sin(rockPoint.x*24.0)*sin(rockPoint.y*24.0)*sin(rockPoint.z*24.0)),5.0);
 float veins=abs(sin(rockPoint.x*5.8+sin(rockPoint.y*6.2)*1.2)*sin(rockPoint.z*5.8+rockPoint.y*4.2));
 float energy=1.-smoothstep(.018,.16,veins);
 totalEmissiveRadiance+=(energy*4.0+sparkle*12.0)*vec3(1.0,0.96,0.72);
 diffuseColor.rgb=mix(diffuseColor.rgb,vec3(1.0,0.98,0.92),energy*.95);`);
};
greenPlasmaMaterial.emissive.setHex(0x00ff55);greenPlasmaMaterial.emissiveIntensity=3.8;greenPlasmaMaterial.color.setHex(0x185528);
greenPlasmaMaterial.onBeforeCompile=shader=>{
 shader.vertexShader='varying vec3 rockPoint;\n'+shader.vertexShader;
 shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nrockPoint=position;');
 shader.fragmentShader='varying vec3 rockPoint;\n'+shader.fragmentShader;
 shader.fragmentShader=shader.fragmentShader.replace('#include <emissivemap_fragment>',`#include <emissivemap_fragment>
 float veins=abs(sin(rockPoint.x*4.5+sin(rockPoint.y*5.)*.9)*sin(rockPoint.z*5.5+rockPoint.y*3.2));
 float energy=1.-smoothstep(.03,.16,veins);totalEmissiveRadiance=vec3(.08,.85,.25)*1.5+energy*vec3(.3,1.6,.6)*3.5;diffuseColor.rgb=mix(diffuseColor.rgb,vec3(.08,.92,.32),energy*.8);`);
};
let blueFireballUntil=0,greenBreathUntil=0,waveBlueMeteorsRemaining=2,waveGreenMeteorRemaining=1;
const threatCoronaMat=new THREE.SpriteMaterial({map:visualBank.images.flash,color:0xff6b18,transparent:true,opacity:.72,depthWrite:false,blending:THREE.AdditiveBlending});
const dragonFireCoronaMat=new THREE.SpriteMaterial({map:visualBank.images.flash,color:0xff7711,transparent:true,opacity:.52,depthWrite:false,depthTest:true,blending:THREE.AdditiveBlending});
const dragonFireCoreMat=new THREE.SpriteMaterial({map:visualBank.images.flash,color:0xfff088,transparent:true,opacity:.46,depthWrite:false,depthTest:true,blending:THREE.AdditiveBlending});
const steamyFireCoronaMat=new THREE.SpriteMaterial({map:visualBank.images.flash,color:0xa0d8ef,transparent:true,opacity:.35,depthWrite:false,depthTest:true,blending:THREE.AdditiveBlending});
const fizzingPowerupCoronaMat=new THREE.SpriteMaterial({map:visualBank.images.flash,color:0xff5500,transparent:true,opacity:.48,depthWrite:false,depthTest:true,blending:THREE.AdditiveBlending});
const goldRedPowerupCoronaMat=new THREE.SpriteMaterial({map:visualBank.images.flash,color:0xfff5b8,transparent:true,opacity:.98,depthWrite:false,blending:THREE.AdditiveBlending});
const bluePowerupCoronaMat=new THREE.SpriteMaterial({map:visualBank.images.flash,color:0x00bfff,transparent:true,opacity:.95,depthWrite:false,blending:THREE.AdditiveBlending});
const greenPowerupCoronaMat=new THREE.SpriteMaterial({map:visualBank.images.flash,color:0x00ff66,transparent:true,opacity:.95,depthWrite:false,blending:THREE.AdditiveBlending});
const purpleCrystalMaterial=rockMaterialVariants[5].clone();
purpleCrystalMaterial.emissive.setHex(0xa855f7);purpleCrystalMaterial.emissiveIntensity=5.2;purpleCrystalMaterial.color.setHex(0x581c87);
purpleCrystalMaterial.onBeforeCompile=shader=>{
 shader.vertexShader='varying vec3 rockPoint;\n'+shader.vertexShader;
 shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nrockPoint=position;');
 shader.fragmentShader='varying vec3 rockPoint;\n'+shader.fragmentShader;
 shader.fragmentShader=shader.fragmentShader.replace('#include <emissivemap_fragment>',`#include <emissivemap_fragment>
 float veins=abs(sin(rockPoint.x*5.8+sin(rockPoint.y*6.2)*1.1)*sin(rockPoint.z*5.8+rockPoint.y*4.1));
 float energy=1.-smoothstep(.02,.17,veins);totalEmissiveRadiance=vec3(.65,.25,1.0)*1.8+energy*vec3(1.2,.5,1.8)*4.5;diffuseColor.rgb=mix(diffuseColor.rgb,vec3(.75,.35,1.0),energy*.9);`);
};
const purplePowerupCoronaMat=new THREE.SpriteMaterial({map:visualBank.images.flash,color:0xc084fc,transparent:true,opacity:.96,depthWrite:false,blending:THREE.AdditiveBlending});

// Purple Meteor-Buster translucent refractive bubble shield with impact ripple blur
let purpleShieldImpact=0;
const purpleShieldVertexShader=`
varying vec3 vNormal;
varying vec3 vViewPosition;
varying vec3 vWorldPosition;
uniform float uTime;
uniform float uImpact;

void main(){
 vNormal=normalize(normalMatrix*normal);
 vec3 pos=position;
 float wobble=sin(pos.y*3.2+uTime*4.5)*cos(pos.x*3.2+uTime*3.5)*0.08;
 if(uImpact>0.0){
  wobble+=sin(pos.y*14.0+uTime*28.0)*cos(pos.x*14.0+uTime*24.0)*(uImpact*0.35);
 }
 pos+=normal*wobble;
 vec4 mvPosition=modelViewMatrix*vec4(pos,1.0);
 vViewPosition=-mvPosition.xyz;
 vWorldPosition=(modelMatrix*vec4(pos,1.0)).xyz;
 gl_Position=projectionMatrix*mvPosition;
}
`;

const purpleShieldFragmentShader=`
varying vec3 vNormal;
varying vec3 vViewPosition;
varying vec3 vWorldPosition;
uniform float uTime;
uniform float uImpact;
uniform float uShieldType;

void main(){
 vec3 viewDir=normalize(vViewPosition);
 float dotNV=clamp(abs(dot(vNormal,viewDir)),0.0,1.0);
 float fresnel=1.0-dotNV;
 float rim=pow(fresnel,2.2);
 vec3 iridescence=0.5+0.5*cos(fresnel*6.28318-uTime*2.2+vec3(0.0,2.094,4.188));
 
 // Dual-mode palette:
 // Mode 0 (Purple Ram): Deep magenta-violet with iridescent rim
 // Mode 1 (Call the Block): Luminous soft cyan with golden solar rim
 vec3 basePurple=vec3(0.55,0.18,0.92);
 vec3 rimPurple=mix(vec3(0.88,0.52,1.0),iridescence,0.45);
 vec3 baseBlock=vec3(0.12,0.65,0.95);
 vec3 rimBlock=mix(vec3(0.40,0.92,1.0),vec3(0.98,0.85,0.40),fresnel*0.8);
 
 vec3 baseColor=mix(basePurple,baseBlock,uShieldType);
 vec3 rimColor=mix(rimPurple,rimBlock,uShieldType);
 vec3 impactColor=mix(vec3(1.0,0.94,1.0),vec3(0.95,1.0,1.0),uShieldType);
 
 vec3 color=mix(baseColor,rimColor,rim);
 if(uImpact>0.0){
  color=mix(color,impactColor,uImpact*0.65);
 }
 // Soft delicate soap bubble transparency: thin center (0.035), glowing rim (0.28), blurred impact flare (+0.38)
 float alpha=rim*(0.28-uShieldType*0.06)+0.035;
 if(uImpact>0.0){
  alpha+=uImpact*0.38;
 }
 gl_FragColor=vec4(color,clamp(alpha,0.0,0.85));
}
`;

const purpleRamShieldGeo=new THREE.SphereGeometry(3.7,36,26);
const purpleRamShieldMat=new THREE.ShaderMaterial({
 uniforms:{uTime:{value:0},uImpact:{value:0},uShieldType:{value:0}},
 vertexShader:purpleShieldVertexShader,
 fragmentShader:purpleShieldFragmentShader,
 transparent:true,
 side:THREE.DoubleSide,
 blending:THREE.AdditiveBlending,
 depthWrite:false
});
const purpleRamShieldMesh=new THREE.Mesh(purpleRamShieldGeo,purpleRamShieldMat);
purpleRamShieldMesh.visible=false;
scene.add(purpleRamShieldMesh);

function createPlayableRock(size=1,variant=-1){
 const gi=Math.floor(Math.random()*rockGeometryVariants.length);
 const mi=variant<0?Math.floor(Math.random()*5):Math.max(0,Math.min(5,variant));
 const mesh=new THREE.Mesh(rockGeometryVariants[gi],rockMaterialVariants[mi]);
 mesh.userData.sharedRockAsset=true;rockStats.meshCreations++;
 mesh.scale.set(size*(.87+Math.random()*.25),size*(.88+Math.random()*.24),size*(.87+Math.random()*.28));
 mesh.rotation.set(Math.random()*3,Math.random()*3,Math.random()*3);
 // Luminous threat corona: visually distinguishes interceptable threats on Paulo's combat plane from background streaks
 const corona=new THREE.Sprite(threatCoronaMat);
 corona.scale.setScalar(size*2.6);
 corona.name='threat-corona';
 mesh.add(corona);
 return mesh;
}
function spawnMeteor(random=Math.random,opening=null){
 if(meteors.length>=MAX_PLAYABLE_METEORS&&!opening)return;
 const isDeterministic=random!==Math.random;
 const roll=random();
 let kind=isDeterministic?opening?.kind:null;
 let isPowerup=null;
 let isMassive=false;
 let colossus=false;
 let size;

 if(wave===1&&opening){
  const cfg=getWave1SpawnConfig(wave1SpawnIndex);
  wave1SpawnIndex++;
  size=cfg.size;
  kind=cfg.kind;
  isMassive=cfg.isMassive;
  colossus=cfg.colossus;
  if(cfg.notice){
   message(cfg.notice);
   sound('warning');
   sound('dragonRoar',{variant:'challenge'});
  }
 }else{
  if(!kind){
   if(opening&&!isDeterministic){
    kind=roll<.18?'iron':roll<.42?'molten':roll<.72?'flaming':'stone';
   }else
   if(!isDeterministic&&wave>=4&&wavePurpleRemaining>0&&(meteors.length>=2||Math.random()<.32)&&!opening){
    wavePurpleRemaining--;
    isPowerup='purple_ram';
    kind='purple_crystal';
   }else if(!isDeterministic&&waveFireStreamRemaining>0&&(meteors.length>=2||Math.random()<.45)&&!opening){
    waveFireStreamRemaining--;
    isPowerup='fire_stream';
    kind='fizzing_flame';
   }else if(!isDeterministic&&waveGreenMeteorRemaining>0&&Math.random()<.28&&!opening){
    waveGreenMeteorRemaining--;
    isPowerup='green_breath';
    kind='green_plasma';
   }else if(!isDeterministic&&waveBlueMeteorsRemaining>0&&Math.random()<.32&&!opening){
    waveBlueMeteorsRemaining--;
    isPowerup='blue_fireball';
    kind='blue_plasma';
   }else{
     kind=roll<.18?'iron':roll<.42?'molten':roll<.72?'flaming':'stone';
   }
  }
  if(opening?.size&&isDeterministic)size=opening.size;
  else if(isPowerup)size=2.8+Math.random()*.6;
  else {
   const spawnMassiveAnchor=(wave>=2&&Math.random()<0.22&&!meteors.some(m=>m.isMassive));
   if(spawnMassiveAnchor){
    isMassive=true;
    size=8.5+Math.random()*3.5;
    kind='molten';
    message('⚠️ MASSIVE INCANDESCENT METEOR INCOMING! INTERCEPT TO SHATTER!');
    sound('warning');
   }else{
    const rollSize=(isDeterministic?random():Math.random());
    // Strict 70% giant/large chunks, 30% smaller chunks across all waves
    if(rollSize<0.70){
     const isColossalRoll=rollSize<0.25;
     if(isColossalRoll){
      size=5.2+Math.random()*2.2;
      colossus=wave>=3&&Math.random()<0.35;
     }else{
      size=3.4+Math.random()*1.8;
     }
    }else{
     size=1.1+Math.random()*1.7;
    }
   }
  }
 }
 const fastImpact=wave>=4&&kind==='flaming'&&roll<.39&&size<1.8;
 const buildings=neighborhood.targetBuildings.filter(b=>!opening||!b.background);
 const diffMode=document.getElementById('difficulty')?.value||'normal';
 const target=chooseMeteorTarget(buildings,schoolBounds.max.z,random,diffMode);
 let x=THREE.MathUtils.clamp(target.x+(random()-.5)*15,-220,220);
 if(wave===1&&opening){
  if(colossus)x=0;
  else if(isMassive)x=(wave1SpawnIndex%2===0?-42:42);
 }
 const mesh=createPlayableRock(size);
 if(kind==='blue_plasma'){mesh.material=bluePlasmaMaterial;const c=mesh.getObjectByName('threat-corona');if(c){c.material=bluePowerupCoronaMat;c.scale.setScalar(size*3.6);}}
 else if(kind==='green_plasma'){mesh.material=greenPlasmaMaterial;const c=mesh.getObjectByName('threat-corona');if(c){c.material=greenPowerupCoronaMat;c.scale.setScalar(size*3.6);}}
 else if(kind==='fizzing_flame'){mesh.material=fizzingFireMaterial;const c=mesh.getObjectByName('threat-corona');if(c){c.material=fizzingPowerupCoronaMat;c.scale.setScalar(size*4.2);}}
 else if(kind==='mega_fire_breath'){mesh.material=goldRedPlasmaMaterial;const c=mesh.getObjectByName('threat-corona');if(c){c.material=goldRedPowerupCoronaMat;c.scale.setScalar(size*4.8);}}
 else if(kind==='purple_crystal'){mesh.material=purpleCrystalMaterial;const c=mesh.getObjectByName('threat-corona');if(c){c.material=purplePowerupCoronaMat;c.scale.setScalar(size*4.5);}}
 else if(kind==='flaming'||opening?.kind==='flaming')mesh.material=flamingMaterial;
 else if(fastImpact)mesh.material=fastImpactMaterial;
 else if(kind==='molten'||isMassive)mesh.material=moltenMaterial;
 if(isPowerup==='fire_stream'){message('🔥 FIZZING FLAME POWERUP INCOMING! DESTROY FOR CONTINUOUS FIRE BREATH!');sound('bonus');}
 else if(isPowerup==='green_breath'){message('🌪️ GREEN TEMPEST METEOR INCOMING — GALE BREATH POWERUP!');sound('bonus');}
 else if(isPowerup==='blue_fireball'){message('⚡ BLUE PLASMA METEOR INCOMING — BLUE FIREBALL POWERUP!');sound('bonus');}
 else if(isPowerup==='mega_fire_breath'){message('✨ WHITE-GOLD SPARKLING METEOR INCOMING! DESTROY FOR MEGA FIRE BREATH!');sound('bonus');}
 else if(isPowerup==='purple_ram'){message('💜 PURPLE METEOR-BUSTER POWERUP INCOMING! DESTROY FOR 10s INVULNERABLE RAM SHIELD!');sound('bonus');purpleShieldImpact=1.0;}
 mesh.position.set(x,meteorEntryHeight(target.z-3,size),target.z-3);scene.add(mesh);if(orbitalTheater&&typeof orbitalTheater.blastLaserAt==='function'){orbitalTheater.blastLaserAt(x,368,-165);}
 const orbitalDist=Math.max(80,mesh.position.y-target.y);
 const baseFlightSec=Math.max(7.5,(14.0-wave*0.35)*(fastImpact?0.6:1.0));
 const speed=(orbitalDist/baseFlightSec)*(isMassive?0.88:(1.0+random()*0.22))*difficulty();
 const velocity=new THREE.Vector3(target.x-x,target.y-mesh.position.y,target.z-mesh.position.z).normalize().multiplyScalar(speed*(fastImpact?1.8:1));
 const meteorHp=isMassive?(colossus?7:5):(size>=3.2?Math.max(3,Math.ceil(size*(easyMode()?0.75:1.35))):Math.max(1,Math.ceil(size*(easyMode()?0.6:1.0))));
 meteors.push({kind,isPowerup,opening:!!opening,fastImpact,isMassive,colossus,largeSplitter:isMassive||!!opening||(size>1.8&&random()<.75),burning:kind==='flaming'||kind==='molten'||kind==='blue_plasma'||kind==='green_plasma'||kind==='purple_crystal',mesh,target:new THREE.Vector3(target.x,target.y,target.z),vel:velocity,trail:0,hp:meteorHp,size,damage:isMassive?3.5:(size>2.8?2.5:size>1.6?1.8:1),baseScale:mesh.scale.clone(),hitFlash:0});
}
function spawnFragmentMeteor(x,y,z,size=1.2,vx=0,vy=-3,vz=0,parent=null){
 const mesh=createPlayableRock(size);
 const opening=!!parent?.opening;
 const kind=opening?(parent.kind==='stone'?'stone':'molten'):(parent?.boss?'molten':'iron');
 if(kind==='molten')mesh.material=moltenMaterial;
 mesh.position.set(x,y,z);scene.add(mesh);
 const vel=new THREE.Vector3(vx,vy,vz);
 const fragHp = size >= 3.0 ? 2 : 1;
 const fragDmg = size >= 3.6 ? 2.5 : (size >= 2.0 ? 1.0 : 0.4);
 meteors.push({mesh,target:new THREE.Vector3(x+vx*3,.5,z+vz*3),vel,trail:0,hp:fragHp,size,kind,opening,damage:fragDmg,fragment:true,burning:kind==='molten',generation:parent?(parent.generation||0)+1:0,fragmentGrace:1.4,fragmentAge:0,ttl:22,hitBlasts:new Set(blasts),baseScale:mesh.scale.clone(),hitFlash:0});
}
function checkBossFracture(m){
 if(!m.boss||m.hp<=0)return;
 const hpRatio=m.hp/(m.maxHp||100);
 if(hpRatio<=0.65&&m.fracturePhase===0){
  m.fracturePhase=1;
  shake=Math.max(shake,0.48);
  m.hitFlash=0.45;
  flashAt(m.mesh.position.x,m.mesh.position.y,m.mesh.position.z,3.8);
  cinematicFX.shock(m.mesh.position,7.5);
  sound('meteorHit',{x:m.mesh.position.x});
  sound('impact',{x:m.mesh.position.x});
  message(`💥 ${m.colossusName||'COLOSSUS'} CRUST FRACTURING — INTERCEPT MAGMA SHARDS!`);
  emitMeteorShrapnel(m.mesh.position,Math.min(5,m.size*1.3));
  spawnFragmentMeteor(m.mesh.position.x-3.2,m.mesh.position.y-1,m.mesh.position.z,2.4,-3.2,-3.5,0,m);
  spawnFragmentMeteor(m.mesh.position.x+3.2,m.mesh.position.y-1,m.mesh.position.z,2.4,3.2,-3.5,0,m);
 }else if(hpRatio<=0.32&&m.fracturePhase===1){
  m.fracturePhase=2;
  shake=Math.max(shake,0.68);
  m.hitFlash=0.55;
  flashAt(m.mesh.position.x,m.mesh.position.y,m.mesh.position.z,4.6);
  cinematicFX.shock(m.mesh.position,9.5);
  sound('crash',{x:m.mesh.position.x});
  sound('meteorHit',{x:m.mesh.position.x});
  message(`🔥 ${m.colossusName||'COLOSSUS'} CORE COLLAPSE — BREAKING APART!`);
  emitMeteorShrapnel(m.mesh.position,Math.min(6,m.size*1.6));
  spawnFragmentMeteor(m.mesh.position.x-2.8,m.mesh.position.y-1,m.mesh.position.z,2.2,-2.6,-4.2,-1.2,m);
  spawnFragmentMeteor(m.mesh.position.x+2.8,m.mesh.position.y-1,m.mesh.position.z,2.2,2.6,-4.2,1.2,m);
  spawnFragmentMeteor(m.mesh.position.x,m.mesh.position.y-1,m.mesh.position.z+2.8,2.2,0,-4.5,-2.0,m);
 }
}
// Fragmentation is a true split into independently moving, independently targetable rocks.
// The generation cap prevents an exponential number of active meteors.
function fragmentMeteor(m){
 const plan=meteorSplitPlan(m,meteors.length);
 for(let k=0;k<plan.count;k++){
  const theta=Math.PI*2*k/plan.count+(Math.random()-.5)*.13;
  const size=plan.size*(.94+Math.random()*.10);
  const speed=(m.opening?3.3:m.boss?1.35:1.05)+Math.random()*.75;
  const vx=Math.cos(theta)*speed,vz=Math.sin(theta)*speed*.35;
  const vy=(m.opening?Math.min(-5,m.vel.y*.67):-.5)+Math.sin(theta)*.95+Math.random()*.65;
  spawnFragmentMeteor(m.mesh.position.x+Math.cos(theta)*m.size*.74,
   m.mesh.position.y+Math.sin(theta)*m.size*.52,m.mesh.position.z+Math.sin(theta)*m.size*.19,size,vx,vy,vz,m);
 }
 emitMeteorShrapnel(m.mesh.position,m.size);
 if(m.boss){
  cinematicFX.shock(m.mesh.position,12.0);
  flashAt(m.mesh.position.x,m.mesh.position.y,m.mesh.position.z,5.2);
  sound('crash');
  emitMeteorShrapnel(m.mesh.position,m.size*1.6);
  const shardCount=7;
  for(let k=0;k<shardCount;k++){
   const angle=k*(Math.PI*2/shardCount)+Math.random()*.25;
   const fSize=2.2+Math.random()*.9;
   const vx=Math.cos(angle)*(3.2+Math.random()*2.0);
   const vz=Math.sin(angle)*(1.8+Math.random()*1.4);
   const vy=-1.8-Math.random()*2.5;
   spawnFragmentMeteor(m.mesh.position.x+Math.cos(angle)*m.size*.65,
    m.mesh.position.y+Math.sin(angle)*1.2,
    m.mesh.position.z+vz*.6,fSize,vx,vy,vz,m);
  }
  const remainingBosses=meteors.filter(t=>t.boss&&t!==m).length;
  if(remainingBosses===0){
   bossDefeated=true;
   blockCharge=100;
   schoolShieldUntil=Math.max(schoolShieldUntil,elapsed+25);
   rapidFireUntil=Math.max(rapidFireUntil,elapsed+22);
   updateBlockButton();
   updatePowerHud();
   sound('bonus');
   message('📣 ALL COLOSSUS METEORS SHATTERED! PHILADELPHIA PREVAILS!');
  }else{
   sound('bonus');
   message(`COLOSSUS SHATTERED! ${remainingBosses} COLOSSAL THREATS REMAIN!`);
  }
 }
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
function spawnFinalBoss(){if(bossSpawned)return;bossSpawned=true;finalSquadron.start();sound('dragonRoar',{variant:'challenge',x:dragon.position.x});
 const bossSpecs=[
  {x:0,z:0,size:9.2,hp:120,name:'CENTRAL COLOSSUS'},
  {x:-44,z:-8,size:7.8,hp:85,name:'WEST FLANK COLOSSUS'},
  {x:44,z:-8,size:7.8,hp:85,name:'EAST FLANK COLOSSUS'},
  {x:-20,z:-22,size:6.8,hp:70,name:'MIDGROUND COLOSSUS'},
  {x:24,z:-22,size:6.8,hp:70,name:'BACKGROUND COLOSSUS'}
 ];
 for(const spec of bossSpecs){
  const mesh=createPlayableRock(spec.size,5);mesh.position.set(spec.x,meteorEntryHeight(spec.z,spec.size,345+Math.random()*20),spec.z);
  mesh.material=moltenMaterial;scene.add(mesh);
  meteors.push({mesh,target:new THREE.Vector3(spec.x,1,spec.z),vel:new THREE.Vector3(0,-22.0-Math.random()*4.0,0),trail:0,hp:spec.hp,maxHp:spec.hp,size:spec.size,damage:15,boss:true,burning:true,kind:'molten',fracturePhase:0,colossusName:spec.name,baseScale:mesh.scale.clone(),hitFlash:0});
 }
 // Guaranteed finale power-ups: Blue Plasma (Mega-Fireballs) & Green Tempest (Space Gale)
 function spawnFinalePowerup(kind,x,y,z,tx=x,ty=1,tz=z){
  const isBlue=kind==='blue_plasma';
  const size=isBlue?2.6:2.8;
  const mesh=createPlayableRock(size);
  mesh.material=isBlue?bluePlasmaMaterial:greenPlasmaMaterial;
  mesh.position.set(x,y,z);
  scene.add(mesh);
  const target=new THREE.Vector3(tx,ty,tz);
  const vel=target.clone().sub(mesh.position).normalize().multiplyScalar(7.5);
  meteors.push({kind,isPowerup:isBlue?'blue_fireball':'green_breath',burning:true,mesh,target,vel,trail:0,hp:Math.ceil(size*1.2),size,damage:1.5,baseScale:mesh.scale.clone(),hitFlash:0});
 }
 spawnFinalePowerup('blue_plasma',-32,345,6,-32,1,6);
 spawnFinalePowerup('blue_plasma',32,348,6,32,1,6);
 spawnFinalePowerup('green_plasma',0,350,10,0,1,10);
 message('CHAPTER 4: COLOSSUS ARMADA! SHOOT BLUE FOR MEGA-FIREBALLS / GREEN FOR SPACE GALE!');
}
function winGame(){active=false;finalSquadron.clear();if(new URLSearchParams(location.search).get('benchmark')!=='1')exportTelemetry();sound('bonus');const panel=document.getElementById('panel');document.getElementById('overlay').style.display='grid';const saved=neighborhood.targetBuildings.filter(b=>b.damage<.05&&!b.background).length;panel.innerHTML=`<h1>🏆 PHILADELPHIA SAVED!</h1><p style="font-size:16px;line-height:1.6;margin:12px 0">Paulo and the North Broad community have destroyed the Colossus Meteor!<br>Final Score: <strong style="color:#ffd358">${score.toLocaleString()}</strong> · School Health: <strong style="color:#6be285">${hp}%</strong> · Buildings Saved: <strong style="color:#80dcff">${saved}</strong></p><p style="color:#d2e5f5;margin:10px 0">The administration denies culpability for the disaster. The block demands justice.</p><div style="display:flex;gap:12px;justify-content:center;margin-top:14px"><button id="ending-block" style="background:#228844;color:#fff;font-weight:bold;padding:10px 18px;border-radius:6px;cursor:pointer">📣 CALL THE BLOCK — ACCOUNTABILITY</button><button id="ending-wait" style="background:#445566;color:#ddd;padding:10px 18px;border-radius:6px;cursor:pointer">DO NOT CALL — ESCAPE ENDING</button></div>`;document.getElementById('ending-block').onclick=()=>showFinalEnding(true);document.getElementById('ending-wait').onclick=()=>showFinalEnding(false);}
function showFinalEnding(accountability){
 const panel=document.getElementById('panel');sound(accountability?'bonus':'impact');
 panel.innerHTML=accountability?`<h1>📣 THE BLOCK ANSWERS!</h1><p style="font-size:15px;line-height:1.6;margin:12px 0">Neighbors, students, and first responders march together to the White House. The administration is held fully accountable before a jury of citizens. Paulo circles high above North Broad into a golden Philadelphia sunset.</p><h2 style="color:#78f090;margin:10px 0">THE END — ACCOUNTABILITY VICTORY</h2><button id="again" style="padding:10px 24px;font-weight:bold;cursor:pointer">PLAY AGAIN</button>`:`<h1>THE ESCAPE</h1><p style="font-size:15px;line-height:1.6;margin:12px 0">Supporters spirit the president away under cover of darkness into exile. Paulo and the students remain on North Broad to rebuild the city.</p><h2 style="color:#e0b060;margin:10px 0">THE END — ESCAPE ENDING</h2><button id="again" style="padding:10px 24px;font-weight:bold;cursor:pointer">PLAY AGAIN</button>`;
 const link=document.createElement('a');link.href='./campaign/chapters3-4.html';link.target='_blank';link.rel='noopener';link.textContent='▶ VIEW ANIMATED FINALE';link.style.cssText='display:inline-block;margin-top:10px;padding:10px;color:#ffce75;font-weight:bold';panel.appendChild(link);
 document.getElementById('again').onclick=reset;
}
const MAX_DYNAMIC_LIGHTS=4;
const explosionLightPool=createStableLightPool(scene,MAX_DYNAMIC_LIGHTS+4,()=>new THREE.PointLight(0xffbe78,0,50,1.5));
function updateExplosionLights(dt){for(let i=explosionLights.length-1;i>=0;i--){const e=explosionLights[i];e.life-=dt;const decayRate=(e.maxLife||.68)>1.0?2.2:3.5;e.light.intensity=Math.max(0,e.light.intensity*(1-dt*decayRate));if(e.life<=0){explosionLightPool.release(e.light);explosionLights.splice(i,1)}}}
function flashAt(x,y,z,power=1){if(explosionLights.length>=MAX_DYNAMIC_LIGHTS)return;const light=explosionLightPool.acquire();if(!light)return;light.color.setHex(0xffbe78);light.intensity=Math.min(9.5,3.2*power);light.distance=Math.min(36,18*power);light.color.setHex(power>3.0?0xfff6ea:power>1.8?0xffd690:power>1.0?0xffad58:0xff8838);light.position.set(x,y,z);const life=power>=3.5?.75:power>=2.0?.55:.35;explosionLights.push({light,life,maxLife:life});}
function remove(arr,i){const o=arr[i];if(!o)return;scene.remove(o.mesh);if(arr===debris&&o.ownsGeometry){o.mesh.geometry?.dispose();} if(o.mesh.userData.sharedRockAsset){arr.splice(i,1);return;}
 if(arr===blasts){if(blastMeshPool.length<110)blastMeshPool.push(o.mesh);else{o.mesh.material.dispose();}arr.splice(i,1);return;}if(arr===shots){for(const child of [...o.mesh.children]){o.mesh.remove(child);child.geometry?.dispose();if(child.material!==iceBoltMaterial)child.material?.dispose();}}if(arr===blasts||arr===meteors){if(o.mesh.geometry!==hunterGeometry&&o.mesh.geometry!==waterDropletGeometry&&o.mesh.geometry!==sharedShotGeometry)o.mesh.geometry.dispose();if(o.mesh.material!==hunterMaterial&&o.mesh.material!==mats.fire&&o.mesh.material!==waterMat&&o.mesh.material!==iceBoltMaterial)o.mesh.material.dispose()}else if(arr===shots){if(o.mesh.geometry!==hunterGeometry&&o.mesh.geometry!==waterDropletGeometry&&o.mesh.geometry!==sharedShotGeometry)o.mesh.geometry.dispose();if(o.mesh.material!==hunterMaterial&&o.mesh.material!==mats.fire&&o.mesh.material!==waterMat&&o.mesh.material!==iceBoltMaterial)o.mesh.material.dispose()}arr.splice(i,1)}const sharedBlastGeometry=new THREE.PlaneGeometry(1,1);
const blastMeshPool=[];const blastStats={created:0,reused:0};
function blast(x,y,z,max=4,playerFire=false){
 cinematicFX.shock(new THREE.Vector3(x,y,z),max);
 if(y>85){
  flashAt(x,y,z,Math.min(4.5,max*0.65));
  if(playerFire)cinematicFX.shock(new THREE.Vector3(x,y,z),max*1.35);
 }
 let mesh=blastMeshPool.pop();if(!mesh){
 mesh=new THREE.Mesh(sharedBlastGeometry,new THREE.MeshBasicMaterial({map:visualBank.images.flash,color:0xffa94e,transparent:true,opacity:.86,depthWrite:false,side:THREE.DoubleSide,blending:THREE.AdditiveBlending}));blastStats.created++;
 }else blastStats.reused++;
 mesh.position.set(x,y,z);mesh.scale.setScalar(1);mesh.material.opacity=.86;scene.add(mesh);
 blasts.push({mesh,r:0,max,age:0,playerFire});flashAt(x,y,z,max/4);
}
// Small fragments predominate. Occasional larger chunks are reserved for silhouette and drama.
const settledRubble=[];const MAX_RUBBLE=250;
const rubblePool=new InstancedParticlePool({THREE,parent:scene,geometry:cube,material:mats.stone,capacity:MAX_RUBBLE});
let rubbleDirty=false;
function refreshRubble(){if(!rubbleDirty)return;rubbleDirty=false;rubblePool.begin();for(const r of settledRubble)rubblePool.add(r.position,r.scale,r.rotation);rubblePool.end();}
const crashedWrecks=[];
const wreckHullMat=material(0x1a1e22,.95,.05);
const wreckBladeMat=material(0x282c30,.85,.1);
const wreckFrameMat=material(0x22262c,0.9,0.1);
const wreckGlassMat=new THREE.MeshStandardMaterial({color:0x7ec8e3,transparent:true,opacity:0.55,roughness:0.1,metalness:0.3});
const wreckBodyGeo=new THREE.BoxGeometry(1.5,0.85,3.6);
const wreckBladeGeo=new THREE.BoxGeometry(0.16,0.04,3.0);
const wreckFrameGeo=new THREE.CylinderGeometry(0.06,0.06,1.4,6);
const wreckShardGeo=new THREE.PlaneGeometry(0.55,0.4);

const pilotSuitMat=material(0xe65c00,0.8,0.1);
const pilotVestMat=material(0x2e4028,0.85,0.1);
const pilotHelmetMat=material(0xf2f4f8,0.3,0.7);
const pilotVisorMat=material(0x111116,0.1,0.9);
const pilotFlareStickMat=material(0xdd1100,0.5,0.2);
const pilotFlareMat=new THREE.SpriteMaterial({map:visualBank.images.flash,color:0xff3300,transparent:true,opacity:0.95,depthWrite:false,blending:THREE.AdditiveBlending});

const pilotBodyGeo=new THREE.BoxGeometry(0.36,0.68,0.24);
const pilotVestGeo=new THREE.BoxGeometry(0.38,0.35,0.26);
const pilotHelmetGeo=new THREE.SphereGeometry(0.22,8,8);
const pilotVisorGeo=new THREE.BoxGeometry(0.25,0.12,0.12);
const pilotLimbGeo=new THREE.BoxGeometry(0.12,0.46,0.12);
const pilotFlareStickGeo=new THREE.CylinderGeometry(0.03,0.03,0.28,6);

function spawnHelicopterWreck(pos,variant=0){
 const wreck=new THREE.Group();
 wreck.position.copy(pos);
 wreck.position.y=Math.max(0.35,pos.y);
 const body=new THREE.Mesh(wreckBodyGeo,wreckHullMat);
 body.rotation.set(0.18,Math.random()*Math.PI,0.22);
 wreck.add(body);
 const blade=new THREE.Mesh(wreckBladeGeo,wreckBladeMat);
 blade.position.set(0.5,-0.12,0.6);
 blade.rotation.set(0.28,0.7,-0.35);
 wreck.add(blade);
 const cockpitFrame=new THREE.Mesh(wreckFrameGeo,wreckFrameMat);
 cockpitFrame.rotation.set(0.6,0.4,0.3);
 cockpitFrame.position.set(-0.5,0.35,1.2);
 wreck.add(cockpitFrame);
 for(let g=0;g<3;g++){
  const shard=new THREE.Mesh(wreckShardGeo,wreckGlassMat);
  shard.position.set((Math.random()-0.5)*1.8,0.08,0.8+(Math.random()-0.5)*1.2);
  shard.rotation.set(-Math.PI*0.5+Math.random()*0.4,Math.random()*0.4,Math.random()*Math.PI);
  wreck.add(shard);
 }
 scene.add(wreck);
 crashedWrecks.push({root:wreck,smokeTimer:0,life:60});
}
function spawnSurvivingPilot(pos){
 const pilot=new THREE.Group();
 const startX=pos.x+(Math.random()>0.5?1.6:-1.6);
 pilot.position.set(startX,Math.max(0.25,pos.y),pos.z+1.0);
 const body=new THREE.Mesh(pilotBodyGeo,pilotSuitMat);body.position.y=0.45;pilot.add(body);
 const vest=new THREE.Mesh(pilotVestGeo,pilotVestMat);vest.position.y=0.52;pilot.add(vest);
 const helmet=new THREE.Mesh(pilotHelmetGeo,pilotHelmetMat);helmet.position.y=0.92;pilot.add(helmet);
 const visor=new THREE.Mesh(pilotVisorGeo,pilotVisorMat);visor.position.set(0,0.92,0.14);pilot.add(visor);
 const legL=new THREE.Mesh(pilotLimbGeo,pilotSuitMat);legL.position.set(-0.11,0.16,0);pilot.add(legL);
 const legR=new THREE.Mesh(pilotLimbGeo,pilotSuitMat);legR.position.set(0.11,0.16,0);pilot.add(legR);
 const armL=new THREE.Mesh(pilotLimbGeo,pilotSuitMat);armL.position.set(-0.25,0.46,0);pilot.add(armL);
 const armR=new THREE.Mesh(pilotLimbGeo,pilotSuitMat);armR.position.set(0.25,0.46,0);pilot.add(armR);
 const flareStick=new THREE.Mesh(pilotFlareStickGeo,pilotFlareStickMat);flareStick.position.set(0.32,0.70,0.12);flareStick.rotation.z=-0.35;pilot.add(flareStick);
 const flareSprite=new THREE.Sprite(pilotFlareMat);flareSprite.scale.setScalar(0.72);flareSprite.position.set(0.36,0.86,0.12);pilot.add(flareSprite);
 scene.add(pilot);
 const dir=startX>=0?1:-1;
 escapingPilots.push({root:pilot,dir,speed:8.5+Math.random()*2.5,life:18,legL,legR,armL,armR,flareSprite});
 message('PILOT ESCAPED COCKPIT WRECKAGE SAFELY!');
 sound('bonus');
}
function preserveRubble(d){if(settledRubble.length>=MAX_RUBBLE)settledRubble.shift();
 const scale=d.scale||d.mesh?.scale?.x||0.4;
 const pos=d.position||d.mesh?.position;
 const posY=(pos?.y!==undefined&&pos.y<0.2)?pos.y:((pos?.y>1.0)?pos.y:Math.max(.045,scale*.5));
 settledRubble.push({position:new THREE.Vector3(pos.x,posY,pos.z),scale,rotation:Math.random()*Math.PI});
 if(d.mesh&&d.mesh.parent)scene.remove(d.mesh);
 rubbleDirty=true;}
function settleMeteorAsPermanentSlag(m){
 if(!m||!m.mesh)return;
 const pos=m.mesh.position.clone();
 const baseScale=Math.max(0.32,Math.min(1.8,(m.size||1)*0.48));
 preserveRubble({position:pos,scale:baseScale});
 const shardCount=Math.min(5,Math.max(2,Math.round((m.size||1)*1.5)));
 for(let k=0;k<shardCount;k++){
  const ang=(k/shardCount)*Math.PI*2+Math.random()*0.5;
  const dist=baseScale*(0.8+Math.random()*0.7);
  const shardPos=new THREE.Vector3(pos.x+Math.cos(ang)*dist,pos.y,pos.z+Math.sin(ang)*dist);
  preserveRubble({position:shardPos,scale:baseScale*(0.25+Math.random()*0.35)});
 }
 if(m.mesh.parent)scene.remove(m.mesh);
}
function spawnFurnitureBurst(x,y,z,count=6){
 const types=['desk','chair','filing_cabinet','whiteboard','monitor'];
 for(let i=0;i<count;i++){
  const t=types[i%types.length];
  const offset=new THREE.Vector3((Math.random()-.5)*3.5,(Math.random()-.5)*1.8,(Math.random()-.5)*3.5);
  spawnFurnitureDebris(new THREE.Vector3(x,y,z).add(offset),t==='desk'?'wood':(t==='filing_cabinet'?'metal':'furniture'),new THREE.Vector3(x,y,z));
 }
 sound('thud',{x,volume:0.45});
}
function spawnFurnitureDebris(pos,type='wood',origin=null){
 if(debris.length>=96)return;
 const geo=cube;
 const mat=mats[type]||mats.wood;
 const mesh=new THREE.Mesh(geo,mat);
 mesh.position.copy(pos);
 const fKind=Math.random();
 if(fKind<0.35){
  mesh.scale.set(0.72+Math.random()*0.3,0.38,0.48+Math.random()*0.2);
 }else if(fKind<0.65){
  mesh.scale.set(0.42,0.75+Math.random()*0.35,0.38);
 }else{
  mesh.scale.set(0.35,0.35,0.35);
 }
 scene.add(mesh);
 let vx=(Math.random()-0.5)*8.0,vy=2.0+Math.random()*5.0,vz=3.5+Math.random()*7.0;
 if(origin){
  const out=pos.clone().sub(origin);
  if(out.lengthSq()>0.001){
   out.normalize();
   vx=out.x*(4.0+Math.random()*6.0);
   vy=Math.max(1.8,out.y*3.5+Math.random()*3.0);
   vz=Math.max(2.5,out.z*(5.0+Math.random()*6.0));
  }
 }
 debris.push({
  mesh,
  v:new THREE.Vector3(vx,vy,vz),
  angVel:new THREE.Vector3((Math.random()-.5)*14,(Math.random()-.5)*14,(Math.random()-.5)*14),
  life:3.5+Math.random()*2.0,
  bounces:0,
  rubble:true,
  isFurnitureDebris:true,
  trail:false
 });
}
function debrisPiece(pos,type,origin=null){
 if(debris.length>=220)return;
 const isGlass=type==='glass';
 const mesh=new THREE.Mesh(isGlass?glassShardGeometry:cube,mats[type]||mats.stone);
 mesh.position.copy(pos);
 const large=Math.random()<.05;
 mesh.scale.setScalar(cell*(large?.48+Math.random()*.30:(isGlass?0.12+Math.random()*0.24:0.08+Math.random()*.16)));
 scene.add(mesh);
 const implode=!isGlass&&Math.random()<0.38;
 let vx=(Math.random()-.5)*(isGlass?16.0:10.0),vy=3.5+Math.random()*(isGlass?12.0:8.0),vz=2.0+Math.random()*(isGlass?14.0:7.0);
 if(origin){
  const dir=pos.clone().sub(origin);
  if(dir.lengthSq()>0.001){
   dir.normalize();
   if(implode){
    vx=-dir.x*(3.2+Math.random()*4.5);
    vy=-(1.2+Math.random()*2.8);
    vz=-dir.z*(3.2+Math.random()*4.5);
   }else{
    const speedMult=isGlass?1.65:1.0;
    vx=dir.x*(5.0+Math.random()*8.0)*speedMult;
    vy=Math.max(2.5,(dir.y*(4.0+Math.random()*7.0)+Math.random()*4.0)*speedMult);
    vz=Math.max(1.8,(dir.z*(5.0+Math.random()*8.0)+Math.random()*3.5)*speedMult);
   }
  }
 }
 const angSpeed=isGlass?22.0:12.0;
 debris.push({mesh,v:new THREE.Vector3(vx,vy,vz),angVel:new THREE.Vector3((Math.random()-.5)*angSpeed,(Math.random()-.5)*angSpeed,(Math.random()-.5)*angSpeed),life:isGlass?5.5+Math.random()*2.5:3.5+Math.random()*2.5,bounces:0,rubble:!large&&Math.random()<.65,isImploding:implode,type,isGlass,trail:false});
}
const crashBodyMaterials=[0x294f70,0xe6e5dc,0xb83525].map(c=>material(c,.3,.4));
const crashMetalMaterial=material(0x656b72,.6,.4),crashDarkMaterial=material(0x22262a,.2,.6);
function spawnHelicopterCrashDebris(pos,variant=0){
 if(debris.length>=211)return;
 const bodyM=crashBodyMaterials[variant]||crashBodyMaterials[0];
 const metalM=crashMetalMaterial,darkM=crashDarkMaterial;
 for(let k=0;k<3;k++){
  const blade=new THREE.Mesh(new THREE.BoxGeometry(3.2,.06,.22),darkM);
  blade.position.copy(pos).add(new THREE.Vector3((Math.random()-.5)*1.8,1+Math.random(),(Math.random()-.5)*1.8));
  scene.add(blade);
  debris.push({mesh:blade,v:new THREE.Vector3((Math.random()-.5)*22,8+Math.random()*12,(Math.random()-.5)*18),angVel:new THREE.Vector3(12+Math.random()*8,Math.random()*8,4),life:3.5+Math.random(),bounces:0,rubble:false,isVehicleDebris:true,ownsGeometry:true});
 }
 const boom=new THREE.Mesh(new THREE.CylinderGeometry(.12,.28,2.4,10),bodyM);
 boom.position.copy(pos).add(new THREE.Vector3((Math.random()-.5)*1.2,1.2,(Math.random()-.5)*1.2));
 scene.add(boom);
 debris.push({mesh:boom,v:new THREE.Vector3((Math.random()-.5)*16,7+Math.random()*9,(Math.random()-.5)*14),angVel:new THREE.Vector3(3,7,2),life:3.8,bounces:0,rubble:false,isVehicleDebris:true,ownsGeometry:true});
 for(let k=0;k<6;k++){
  const panel=new THREE.Mesh(new THREE.BoxGeometry(.6+Math.random()*.4,.08,.5+Math.random()*.3),Math.random()<.5?bodyM:metalM);
  panel.position.copy(pos).add(new THREE.Vector3((Math.random()-.5)*2,.8,(Math.random()-.5)*2));
  scene.add(panel);
  debris.push({mesh:panel,v:new THREE.Vector3((Math.random()-.5)*20,9+Math.random()*11,(Math.random()-.5)*20),angVel:new THREE.Vector3(Math.random()*12,Math.random()*12,Math.random()*12),life:3.2+Math.random(),bounces:0,rubble:false,isVehicleDebris:true,ownsGeometry:true});
 }
}

// Opening-wave rocks hit the first standing roof or ground plane they cross.
// Sweep the fall so fast or small fragments cannot tunnel through a roof.
function traceOpeningMeteorImpact(m,start){
 const hit=traceMeteorCollision(start,m.mesh.position,neighborhood.targetBuildings,schoolBounds,schoolDamage<1);
 if(!hit)return false;
 m.target.set(hit.point.x,hit.point.y,hit.point.z);
 m.impactOwner=hit;
 return true;
}
function damage(x,z,y=7,meteor=null){
 if(meteor&&(meteor.harmless||(meteor.size&&meteor.size<1.35))){
  emitMeteorShrapnel(new THREE.Vector3(x,y,z),0.6);
  return;
 }
 const profile=meteor?structuralImpactProfile(meteor):impactProfile(1.8);
 warnCrowd(x,z,18);crackWindows(x,y,z,profile.radius);
 const diffMode=document.getElementById('difficulty')?.value||'normal';
 const diffDmg=diffMode==='hard'?3.2:diffMode==='easy'?.42:1.0;
 const targetX=x;
 const targetY=THREE.MathUtils.clamp(y,.3,40);
 const hitZ=z;
 const blastRadius=profile.radius*(diffMode==='hard'?2.2:1.0);
 const blastStrength=profile.strength*diffDmg;

 const owner=meteor?.impactOwner;
 const targetBuilding=owner?(owner.kind==='building'?owner.building:null):neighborhood.activeAt(targetX,hitZ);
 const schoolMaxY=neighborhood.school.h+2.0;

 const roadStrike=!targetBuilding&&targetY<=4.5&&isBroadRoad(targetX,hitZ);
 if(roadStrike){
  strikeParkedCars(targetX,hitZ,profile.radius);shake=Math.max(shake,Math.min(1.4,profile.strength));emitImpact(targetX,1,hitZ,Math.round(55+profile.strength*45),profile.strength*1.4);blast(targetX,1,hitZ,profile.shockRadius);flashAt(targetX,1.8,hitZ,4.6);cinematicFX.burst(new THREE.Vector3(targetX,1.2,hitZ),profile.shockRadius*1.2);cinematicFX.fire(new THREE.Vector3(targetX,.4,hitZ),elapsed,Math.max(2.4,profile.radius*.9),.45,'structure');if(Math.random()<profile.fire*(diffMode==='hard'?1.6:1.2))ignite(targetX,1,hitZ);if(Math.random()<.55)ignite(targetX+(Math.random()-.5)*3.2,1,hitZ+(Math.random()-.5)*2.5);
  for(const c of cars)if(performanceLab.isEnabled('traffic')&&c.life>0&&Math.abs(c.root.position.x-targetX)<6&&Math.abs(c.root.position.z-hitZ)<5)explodeCar(c);
  const mSz=meteor?.size||(profile.radius*0.45);
  const isExtinction = mSz >= 13.0;
  const isTitanic = mSz >= 9.0;
  const isColossal = mSz >= 4.0;
  const isSubwayPenetrator = (mSz >= 2.6) || (meteor && meteor.size >= 4.5) || isColossal || isTitanic || isExtinction;
  const craterRadius = isExtinction ? Math.min(18.0, 5.5 + mSz * 0.85) : (isTitanic ? Math.min(14.0, 4.2 + mSz * 0.80) : (isColossal ? Math.min(11.0, 3.4 + mSz * 0.75) : Math.min(7.0, 2.2 + mSz * 0.65)));
  addCrater(targetX,hitZ,craterRadius,{isSubway:isSubwayPenetrator,size:mSz,isTitanic,isExtinction,isColossal,isMassive:isColossal});
  sound('impact');

  return;
 }

 const isSchoolHit=owner?owner.kind==='school':!targetBuilding&&architecturalReady&&targetX>=schoolBounds.min.x&&targetX<=schoolBounds.max.x&&
  hitZ>=schoolBounds.min.z&&hitZ<=schoolBounds.max.z&&targetY<=schoolMaxY;
 if(isSchoolHit&&hp>0)sound('dragonRoar',{variant:'furious',x:dragon.position.x});

 const effectiveTarget=targetBuilding;
 if(!effectiveTarget&&!isSchoolHit){
  emitImpact(targetX,targetY,hitZ,50,profile.strength);
  sound('impact',{x:targetX});
  return;
 }
 let lost=0;
 if(effectiveTarget){
  for(const p of crowd)if(Math.abs(p.g.position.x-targetX)<25)p.dx=p.g.position.x<targetX?-1:1;
  const before=effectiveTarget.damage;
  northBroadModels.impactBuilding(effectiveTarget.id,new THREE.Vector3(targetX,targetY,hitZ),Math.min(blastRadius,8),Math.min(blastStrength,3));
  lost=effectiveTarget.damage>before?1:0;
  cinematicFX.dustBurst(new THREE.Vector3(targetX,targetY,hitZ),Math.min(2.5,blastStrength*1.2),{brick:true,count:16});
  if(lost>0){emitMeteorShrapnel(new THREE.Vector3(targetX,targetY,hitZ),Math.min(4,lost*.3+1.2));for(let j=0;performanceLab.isEnabled('particles')&&j<Math.min(14,lost*3)&&impactParticles.length<210;j++)impactParticles.push({pool:5,position:new THREE.Vector3(targetX+(Math.random()-.5)*2,targetY+(Math.random()-.5)*1.4,hitZ+.3),velocity:new THREE.Vector3((Math.random()-.5)*7,2+Math.random()*5,(Math.random()-.5)*5),scale:.04+Math.random()*.12,life:.7+Math.random()*.5,ttl:1.2,smoke:false});}flashAt(targetX,targetY,hitZ,4.2);panicCrowdAt(targetX,hitZ,38);
  emitImpact(targetX,targetY,hitZ,185,1.38);
  if(lost>0&&Math.random()<profile.fire*(diffMode==='hard'?1.5:1)){ignite(targetX,targetY,hitZ);cinematicFX.fire(new THREE.Vector3(targetX,targetY,hitZ),elapsed,Math.max(2.5,profile.radius*1.1),.48,'structure');if(Math.random()<.82)ignite(targetX+(Math.random()-.5)*3.2,Math.max(1,targetY-1.2),hitZ-.20);
   if(Math.random()<.55)ignite(targetX+(Math.random()-.5)*4.5,Math.min(14,targetY+1.8),hitZ-.35);
  }
  if(lost>0)score=Math.max(0,score-30);
 }else if(architecturalReady){
  const r=profile.radius;
  carveSchool(targetX,targetY,hitZ,r,profile.strength*diffDmg,meteor?.kind||'stone',meteor?.vel?.length?.()||0);
  if(voxelReady){
   lost=architecture.impact(new THREE.Vector3(targetX,targetY,hitZ),r,
     (pos,type)=>debrisPiece(pos,type===2?'glass':type===3?'roof':type===4?'stone':'brick'));
  }
  emitImpact(targetX,targetY,hitZ,180,1.3);flashAt(targetX,targetY,hitZ,4.4);cinematicFX.fire(new THREE.Vector3(targetX,targetY,hitZ),elapsed,Math.max(2.8,r*1.1),.45,'structure');
  // Damage accumulates against the actual school. When the gauge reaches 0%,
  // the architectural building is fully removed, not just cosmetically scarred.
  const previousDamage=schoolDamage;
  const mSize=meteor?.size??1.8;
  const hitDmg=meteor?.crunched||meteor?.crunchDamageDealt>0?0:schoolMeteorBudget(mSize);
  schoolDamage=Math.min(1,schoolDamage+hitDmg);
  hp=schoolDamage>=1?0:Math.max(1,Math.round((1-schoolDamage)*100));
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
  if(schoolDamage>previousDamage&&hp>0)sound('dragonRoar',{variant:'furious',x:dragon.position.x});
  if(schoolDamage>.03)addStorefrontSpiderwebCrack();if(schoolDamage>.03&&schoolDamage<1&&Math.random()<profile.fire){
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
 hp=schoolDamage>=1?0:Math.max(1,Math.round((1-schoolDamage)*100));
 sound('impact',{x:targetX});shake=Math.min(1.5,profile.strength);blast(targetX,targetY,hitZ,profile.shockRadius);emitImpact(targetX,targetY,hitZ,Math.round(35+profile.strength*40),profile.strength);
 updateHud();if(hp<=0)gameOver();
}
// v5.0 Preview 2: chapter progression is deliberately isolated from combat systems.
const CAMPAIGN_CHAPTERS=[
 {start:1,title:'FLIGHT ACADEMY & METEOR STORM',cinematic:'./campaign/chapter1.html'},
 {start:3,title:'OPERATION SKYFALL: MASS EVACUATION',cinematic:'./campaign/chapter1.html'},
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
 perchDragon(true);
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
function resetChapterTrafficAndCrowd(immediate=false){for(const h of helicopters)retireHelicopter(h);helicopters.length=0;helicopterLightPool.reset();if(immediate){for(const c of cars)recycleCar(c);cars.length=0;}else{for(const c of cars){c.exiting=true;c.speed=Math.max(c.speed,22);}}for(const p of crowd)scene.remove(p.g);crowd.length=0;carTimer=.2;crowdTimer=1.0;helicopterTimer=7;seedChapterTrafficAndCrowd(wave<=5?1:wave<=10?2:wave<=14?3:4);}
function applyResidualChapterDamage(){
 // Rebuild the block only AFTER the cinematic. Leave a few visibly damaged facades.
 clearFires(); neighborhood.restore();northBroadModels?.restore?.();schoolReconstruction?.reset?.();setInspectionCamera('street');
 for(const b of [...neighborhood.targetBuildings].filter(b=>!b.school).slice(3,6))
  neighborhood.city.forceDamage?.(b,.07+Math.random()*.045);
 schoolDamage=0;hp=100;schoolRubblePlaced=false;settledRubble.length=0;rubbleDirty=false;rubblePool.clear();
 for(const c of craters){disposeCrater(c);}craters.length=0;streetStop=0;neighborhood.syncCraterHoles?.([]);cinematicFX.syncSubwayCraters?.([]);streetWaterRunoff.reset();
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
 message('THE SKY CLEARS — A MOMENT OF CALM');
}
function updateChapterSettlement(dt){
 if(!chapterSettlement.active)return false;
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
function updateHud(){document.getElementById('score').textContent=score.toLocaleString();const isTr=trainingMissions?.isActive();document.getElementById('wave').textContent=freeFlightMode?'∞ SANDBOX':(isTr?'TRAIN':wave);const chapterLabel=document.getElementById('campaign-chapter-label');if(chapterLabel)chapterLabel.textContent=freeFlightMode?'🛠️ DIRECTOR SANDBOX (INFINITE)':(isTr?'🥋 ASTRAL SIMULATION VOID':'CH '+(CAMPAIGN_CHAPTERS.indexOf(currentChapter())+1)+' · '+currentChapter().title);document.getElementById('hp').textContent=isTr?'100%':hp+'%';document.getElementById('healthbar').style.width=(isTr?100:hp)+'%';updateNeighborhoodGauge();document.getElementById('lives').textContent=dragonLives;document.getElementById('school-wire').style.opacity=Math.max(.15,hp/100);}
let toastTimer=0;function message(t){document.getElementById('toast').textContent=t;toastTimer=1.8}
function isChapterEnd(wave){return wave===2||wave===3||wave===10||wave===14;}
function recordRallyClear(){
 const entry=waveStats.at(-1);
 if(!entry?.rallyStart||entry.rallyResult)return;
 const start=entry.rallyStart;
 entry.rallyResult={wave,intercepts:sessionStats.intercepts-start.intercepts,
  schoolLost:Math.max(0,start.schoolHealth-hp),
  blockLost:Math.max(0,start.blockHealth-neighborhoodHealth())};
}
let tacticalTrialActive=false,trialTimer=0,trialPhase=0,trialSpawnCountdown=1.0,trialCompleted=false;

function startTacticalTrial(){
 try{
  skipChapterIntroCinematic=true;
  reset();
  if(cinematicActive)closeChapterTransition();
  document.getElementById('campaign-transition').hidden=true;
  skipChapterIntroCinematic=false;
  tacticalTrialActive=true;
  trialTimer=0;
  trialPhase=1;
  trialSpawnCountdown=1.0;
  trialCompleted=false;
  document.getElementById('overlay').style.display='none';
  const waveEl=document.getElementById('wave');
  if(waveEl)waveEl.textContent='🎯 TRIAL';
  message('🎯 TACTICAL DEFENSE TRIAL STARTED (2.5 MINUTE TEST ENCOUNTER)');
  sound('bonus');
 }catch(e){
  console.error('Trial start error',e);
 }
}

function updateTacticalTrial(dt){
 trialTimer+=dt;
 const waveEl=document.getElementById('wave');
 if(waveEl)waveEl.textContent=`🎯 TRIAL ${Math.floor(trialTimer)}s/140s`;
 if(trialTimer<25){
  if(trialPhase===1){trialPhase=2;message('PHASE 1: PRECISION THREAT INTERCEPTION');}
  trialSpawnCountdown-=dt;
  if(trialSpawnCountdown<=0&&meteors.length<5){spawnMeteor();trialSpawnCountdown=2.2;}
 }else if(trialTimer<55){
  if(trialPhase===2){
   trialPhase=3;message('PHASE 2: TACTICAL DILEMMA — BLUE POWERUP & FLANKING THREATS');sound('bonus');
   const blueM=spawnMeteor();
   if(blueM){blueM.isPowerup='blue_fireball';blueM.mesh.material=mats.blueFire;blueM.burning=true;}
   trialSpawnCountdown=1.5;
  }
  trialSpawnCountdown-=dt;
  if(trialSpawnCountdown<=0&&meteors.length<6){spawnMeteor();trialSpawnCountdown=2.0;}
 }else if(trialTimer<95){
  if(trialPhase===3){
   trialPhase=4;message('PHASE 3: GALE CONVERGENCE — HOLD LMB TO CLUSTER METEORS WITH WIND!');sound('bonus');
   const greenM=spawnMeteor();
   if(greenM){greenM.isPowerup='green_breath';greenM.mesh.material=mats.greenFire;greenM.burning=true;}
   for(let k=-2;k<=2;k++){
    setTimeout(()=>{
     if(!tacticalTrialActive)return;
     const cm=spawnMeteor();
     if(cm){cm.mesh.position.set(k*11,meteorEntryHeight(10,cm.size),10);cm.vel.set(0,-32,-1);}
    },1200+k*150);
   }
   trialSpawnCountdown=3.5;
  }
  trialSpawnCountdown-=dt;
  if(trialSpawnCountdown<=0&&meteors.length<7){spawnMeteor();trialSpawnCountdown=2.4;}
 }else if(trialTimer<140){
  if(trialPhase===4){
   trialPhase=5;message('PHASE 4: CLIMAX — FRACTURING COLOSSUS! DESTROY MAGMA SHARDS');sound('warning');
   spawnFinalBoss();
   trialSpawnCountdown=2.0;
  }
  trialSpawnCountdown-=dt;
  if(trialSpawnCountdown<=0&&meteors.length<8){spawnMeteor();trialSpawnCountdown=2.8;}
  if(bossDefeated&&!trialCompleted){completeTacticalTrial();return;}
 }else{
  if(!trialCompleted)completeTacticalTrial();
 }
}

function completeTacticalTrial(){
 trialCompleted=true;tacticalTrialActive=false;active=false;sound('fanfare');
 const duration=Math.round(trialTimer);
 const totalShots=sessionStats.shots;
 const totalIntercepts=sessionStats.intercepts;
 const accuracy=totalShots>0?((totalIntercepts/totalShots)*100).toFixed(1):0;
 const schoolHp=hp,blockHp=neighborhoodHealth();
 const galeCombos=sessionStats.galeConvergences||0;
 const multiCombos=sessionStats.combos||0;
 const saves=sessionStats.lastSecondSaves||0;
 const nearMisses=sessionStats.nearMisses||0;
 const fps=sessionStats.frameTimeTotal>0?(sessionStats.frames/sessionStats.frameTimeTotal).toFixed(1):'45.0';
 let grade='C';
 if(score>=8000&&schoolHp>=70&&totalIntercepts>=20)grade='S';
 else if(score>=5000&&schoolHp>=45&&totalIntercepts>=15)grade='A';
 else if(score>=3000&&schoolHp>=20)grade='B';
 const panel=document.getElementById('panel'),overlay=document.getElementById('overlay');
 overlay.style.display='grid';
 panel.innerHTML=`<h1>🎯 TACTICAL TRIAL ASSESSMENT</h1><div style="font-size:28px;font-weight:900;color:${grade==='S'?'#ffd700':grade==='A'?'#35e889':'#80dcff'};margin:8px 0">DEFENSE RATING: GRADE ${grade}</div><p style="color:#d5e5f5;font-size:14px;margin-bottom:12px">Duration: <strong>${duration}s</strong> · Final Score: <strong style="color:#ffd358">${score.toLocaleString()}</strong></p><div style="background:rgba(12,24,40,.8);border:1px solid #4a7199;border-radius:10px;padding:12px;text-align:left;font-size:13px;line-height:1.7;margin-bottom:16px"><div>🎯 <strong>Interceptions:</strong> ${totalIntercepts} (${accuracy}% accuracy / ${totalShots} shots)</div><div>🏫 <strong>Tech Freire Preserved:</strong> ${schoolHp}% health</div><div>🏘️ <strong>Neighborhood Integrity:</strong> ${blockHp}% block health</div><div>🌪️ <strong>Gale Convergences:</strong> ${galeCombos} combo(s)</div><div>🔥 <strong>Multi-Meteor Blasts:</strong> ${multiCombos} double/triple blast(s)</div><div>🦸 <strong>Last-Second Saves:</strong> ${saves} heroic intercept(s)</div><div>💨 <strong>Close Calls / Near Misses:</strong> ${nearMisses}</div><div>⚡ <strong>Engine Performance:</strong> ${fps} avg FPS (${sessionStats.frames} frames)</div></div><div style="display:flex;gap:10px;justify-content:center;flex-wrap:wrap"><button id="trial-replay" style="background:#206a44;color:#fff;font-weight:bold;padding:10px 18px;border-radius:8px">🔁 REPLAY TRIAL</button><button id="trial-campaign" style="background:#284f70;color:#fff;font-weight:bold;padding:10px 18px;border-radius:8px">🎮 PLAY CAMPAIGN</button><button id="trial-export" style="background:#423b6b;color:#ddd;padding:10px 18px;border-radius:8px">📊 EXPORT METRICS</button></div>`;
 document.getElementById('trial-replay').onclick=()=>startTacticalTrial();
 document.getElementById('trial-campaign').onclick=()=>safelyStart();
 document.getElementById('trial-export').onclick=()=>exportTelemetry();
}

function updateWaveProgress(dt,rally=rallyLoop){
 if(freeFlightMode)return;
 if(tacticalTrialActive){updateTacticalTrial(dt);return;}
 const chapterEnd=isChapterEnd(wave);
 const opening=openingMeteorWave(wave);
 const satBattery=orbitalTheater?orbitalTheater.getBattery():1.0;
 if(wave<15){
  if(!rally&&!opening&&satBattery>0&&remaining>0){
   stormTimer-=dt;
   if(!chapterSettlement.active&&stormTimer<=0&&meteors.length<(easyMode()?9:13)){
    spawnMeteor();
    stormTimer=(chapterEnd?3.4:5.5)/Math.max(.7,difficulty())*(.75+Math.random()*.5);
   }
  }
  if(remaining>0&&satBattery>0){
   spawnTimer-=dt;
   if(spawnTimer<=0){
    spawnMeteor(Math.random,opening);
    remaining--;
    spawnTimer=opening?(2.4+Math.random()*0.5):waveBudget(wave,document.getElementById('difficulty')?.value).spawnBase*(.7+Math.random()*.5)/difficulty();
   }
   return;
  }
  // When satellite battery reaches 0 (or remaining budget exhausted), wait for active airborne meteors to clear
  if(satBattery<=0||remaining<=0||rally||opening){
   remaining=0;
   if(orbitalTheater&&orbitalTheater.getBattery()>0&&!rally&&!opening){
    orbitalTheater.setBattery(0);
   }
   if(meteors.some(m=>!m.grounded)){
    between=0;
    return;
   }
  }
 }else{
  const allSatsDown=!orbitalTheater||orbitalTheater.allSatellitesDestroyed();
  if(allSatsDown){
   if(!satellitesCleared){
    satellitesCleared=true;
    sound('bonus');
    sound('dragonRoar',{variant:'challenge',x:dragon.position.x});
    flashAt(dragon.position.x,dragon.position.y,dragon.position.z,6.0);
    cinematicFX.shock(dragon.position,85);
    for(let i=meteors.length-1;i>=0;i--){
     const m=meteors[i];
     if(!m.isPowerup){
      flashAt(m.mesh.position.x,m.mesh.position.y,m.mesh.position.z,3.0);
      remove(meteors,i);
     }
    }
    message('🏆 ALL SATELLITES DESTROYED BY MEGA FIRE BREATH! PHILADELPHIA IS SAVED!');
   }
   between+=dt;
   if(between>2.2){
    winGame();
    return;
   }
   return;
  }else{
   if(!finaleAscentPrompted||(elapsed%8.0<dt)){
    finaleAscentPrompted=true;
    message('⚡ DESTROY ELON’S SATELLITES WITH MEGA FIRE BREATH TO DEFEAT TITAN!');
   }
   between=0;
   return;
  }
 }
 if(meteors.some(m=>!m.grounded))return;
 const previous=between;
 if(previous===0){
  sound('waveWin');
  message('⚡ SATELLITE ARRAY RECHARGING — WAVE CLEAR!');
  if(rally)recordRallyClear();
 }
 between+=dt;
 if(chapterEnd){
  if(between>2.6)beginChapterSettlement();
  return;
 }
 if(evacuationChapter?.isActive()){return;}
 const recovery=rally&&!rallyRecoveryChoice?2.4:2.8;
 if(between>recovery){
  wave++;between=0;updateHud();newWave();
  if(rallyShieldQueued){
   rallyShieldQueued=false;
   schoolShieldUntil=Math.max(schoolShieldUntil,elapsed+9);
   updateBlockButton();updatePowerHud();
   message('SCHOOL SHIELD ACTIVE — 9s');
  }
 }else if(previous===0||Math.floor(between)>Math.floor(previous)){
  message('WAVE CLEAR — NEXT WAVE IN '+Math.max(1,Math.ceil(recovery-between))+'s');
 }
}
function newWave(){waveClearZoomBlend=0.0;const chapterIndex=(wave<=5?1:wave<=10?2:wave<=14?3:4);if(chapterStaging.mode==='leaving'||chapterStaging.mode==='settlement'){}else chapterStaging.setChapter(chapterIndex);if(CAMPAIGN_CHAPTERS.some(c=>c.start===wave)&&wave>1)resetChapterTrafficAndCrowd();
 if(impactMarker)impactMarker.visible=false;
 for(let i=cars.length-1;i>=0;i--)if(cars[i].frozen){recycleCar(cars[i]);cars.splice(i,1)}
 updateAtmosphere();sessionStats.highestWave=Math.max(sessionStats.highestWave,wave);
 const entry={wave,startedAt:Math.round(elapsed),scoreAtStart:score};
 if(rallyLoop)entry.rallyStart={intercepts:sessionStats.intercepts,schoolHealth:hp,blockHealth:neighborhoodHealth()};
 waveStats.push(entry);
 if(wave>1&&(!rallyLoop||waveStats.length>1)){const saved=neighborhood.targetBuildings.filter(b=>b.damage<.05&&(!rallyLoop||!b.background)).length;
  const bonus=saved*75;score+=bonus;message('BLOCK SAVED BONUS +'+bonus.toLocaleString());sound('bonus');updateHud();}
 stormTimer=0;waveBlueMeteorsRemaining=wave===15?6:2;waveGreenMeteorRemaining=wave===15?3:1;waveFireStreamRemaining=wave===15?4:2;wavePurpleRemaining=wave>=4?2:0;orbitalTheater?.setBattery(1.0);remaining=wave>=15?(wave===15?26:0):openingMeteorWave(wave)?.count??waveBudget(wave,document.getElementById('difficulty')?.value).regular; if(wave===15)spawnFinalBoss(); spawnTimer=easyMode()?2:(wave===15?0.95:.7);if(wave===1){
  perchDragon(true);
  introZoomProgress=0.0;
  skipChapterIntroCinematic=true;
  paused=false;
  for(const arr of [meteors,shots,blasts,debris]){while(arr.length)remove(arr,arr.length-1);}
  wave1SpawnIndex=0;
  remaining=openingMeteorWave(1)?.count??6;
  message('🚨 CHAPTER 1: THE INITIAL METEOR STORM — DEFEND TECH FREIRE SCHOOL!');
  sound('siren');
  sound('dragonRoar',{variant:'challenge'});
  spawnMeteor(Math.random,openingMeteorWave(1));
  remaining--;
  spawnTimer=4.5;
 }
 if(wave===3){message('WAVE 3: MASS EVACUATION — PROTECT CHINOOK CHOPPERS!');evacuationChapter?.start();schoolShieldUntil=elapsed+9999;shieldMesh.visible=true;} if(wave===7||wave===9||wave===12||wave===13){secondaryEscortTimer=5.5;} if(!skipChapterIntroCinematic&&CAMPAIGN_CHAPTERS.some(c=>c.start===wave))showChapterTransition();if(wave>=6&&!schoolFire.some(f=>Math.abs(f.root.position.x-20.2)<2&&Math.abs(f.root.position.y-8.8)<2))ignite(20.2,8.8,-1.0);if(wave>=6&&!craters.some(cr=>Math.abs(cr.x)<6&&Math.abs(cr.z-18)<6))addCrater(0,18,4.4);if(wave>=6)addStorefrontSpiderwebCrack();if(wave===6)message('ICE PURSUIT — AVOID ELECTRICAL BEAMS');if(wave===11)message('MILITARY OCCUPATION — DODGE OR INTERCEPT MISSILES');if(wave===6||wave===11||wave===15)message('A NEW CHAPTER BEGINS — THE STREET RESETS, BUT SCARS REMAIN.');
}
function reset(){clearPendingBarrages();setInspectionCamera('street');northBroadModels?.restore?.();tacticalTrialActive=false;trialCompleted=false;trialTimer=0;rallyShieldQueued=false;schoolReconstruction?.reset();finalSquadron.clear();militaryOccupation.reset();cinematicFX.reset();frameHealth.reset();playtestFrameMs.length=0;peakDrawCalls=0;stallEvents.length=0;detailedTimings.sim.length=0;detailedTimings.render.length=0;frameGovernor.reset();adaptiveResolution=1;adaptiveAdjustments=0;applyVisualPreset();nextLaneByDirection.east=0;nextLaneByDirection.west=0;resetParkedCars();settledRubble.length=0;rubbleDirty=false;rubblePool.clear();for(const w of crashedWrecks)scene.remove(w.root);crashedWrecks.length=0;skylineEventTimer=3;distantTimer=3;backgroundDamageTimer=2.5;for(const h of helicopters)retireHelicopter(h);helicopters.length=0;helicopterLightPool.reset();for(const p of crowd)scene.remove(p.g);crowd.length=0;for(const g of gasClouds){scene.remove(g.mesh);if(!g.mesh.isSprite)g.mesh.geometry?.dispose();g.mesh.material.dispose()}gasClouds.length=0;
 while(skyBursts.length)releaseSkyObject(skyBursts.pop());for(const m of distantStreaks)m.sprite.removeFromParent();distantStreaks.length=0;dangerZones.length=0;
 for(const crack of windowDamage){scene.remove(crack);crack.geometry.dispose()}windowDamage.length=0;for(const w of nightWindows){w.broken=false;w.mesh.visible=true;}helicopterTimer=7;crowdTimer=0;dragonLives=3;invulnerable=0;dragonStun=0;iceGroundHits=0;blockCharge=0;blockShield=0;blockScene=0;gasCooldown=0;waterDisable=0;windCooldown=0;gustTime=0;holdStart=0;windActive=false;gustRoadNotified=false;gustMissileNotified=false;windVisual.visible=false;clearWindDebris();updateWindPlanting(1);cinematicFX.setWind(null,null,0);chapterSettlement={active:false,phase:'idle',timer:0,nextWave:null,fromChapter:null};postCutsceneWave=null;skipChapterIntroCinematic=false;setChapterFade(false);iceWarning.style.display='none';policeBlockadeGroup.visible=false;chapterStaging.setChapter(0);for(const b of burningVehicles){if(b.driver)scene.remove(b.driver)}burningVehicles.length=0;facing=1;turnTime=0;recoveryLift=0;dragonGroundImpact=false;gasPose=0;dragon.scale.set(1,1,1);explosionLightPool.reset();explosionLights.length=0;for(const c of cars)recycleCar(c);cars.length=0;carTimer=0;damageHoles.length=0;resetSchoolDamageMasks();schoolDamage=0;schoolFragments.count=0;schoolFragments.instanceMatrix.needsUpdate=true;clearFires();syncDamageHoles();neighborhood.restore();
 if(architecturalModel){architecturalModel.visible=false;syncStructuralDamage()}if(voxelReady)architecture.restore();for(const e of effectObjects){effects.remove(e.mesh);e.mesh.geometry.dispose();e.mesh.material.dispose()}effectObjects.length=0;impactParticles.length=0;trailParticles.length=0;for(const pool of impactPools)pool.clear();trailSmokePool.clear();trailEmberPool.clear();quality.reset();for(const arr of [meteors,shots,blasts,debris]){while(arr.length)remove(arr,arr.length-1)}if(!architecturalReady)buildSchool();setMode(viewMode);score=0;hp=100;fireHealthAccumulator=0;wave=Math.min(15,clampWave(document.getElementById('start-wave')?.value));bossSpawned=false;bossDefeated=false;skylineDamage=0;schoolRubblePlaced=false;schoolDamage=0;damageHoles.length=0;syncDamageHoles();syncStructuralDamage();skylineBackdrop.reset();for(const f of skylineFires){skyline.remove(f.fire,...f.puffs);f.fire.material.dispose();for(const p of f.puffs)p.material.dispose();}skylineFires.length=0;Object.assign(sessionStats,{start:Date.now(),shots:0,intercepts:0,militaryInterceptions:0,hunters:0,damage:0,highestWave:wave,deaths:0,powerups:0,frames:0,frameTimeTotal:0,galeConvergences:0,combos:0,lastSecondSaves:0,nearMisses:0,wetShots:0});waveStats.length=0;dragonMeteorTimer=7;interceptionStreak=0;rapidFireUntil=0;schoolShieldUntil=0;blueFireballUntil=0;greenBreathUntil=0;fireStreamUntil=0;megaFireBreathUntil=0;purpleRamUntil=0;waveBlueMeteorsRemaining=2;waveGreenMeteorRemaining=1;waveFireStreamRemaining=1;wavePurpleRemaining=1;purpleRamShieldMesh.visible=false;satellitesCleared=false;finaleAscentPrompted=false;lastWingFlapTime=0;lastDiveWhooshTime=0;diveSonicBoomTriggered=false;introZoomProgress=(wave===1?1.0:0.0);waveClearZoomBlend=0.0;orbitalTheater?.reset();foregroundMeteors?.reset();if(wave>1)trainingMissions?.reset();evacuationChapter?.reset();secondaryEscortTimer=0;busterRamCollided=false;for(const p of escapingPilots)scene.remove(p.root);escapingPilots.length=0;powerGrid?.reset?.();shieldMesh.visible=false;streetStop=0;for(const c of craters)disposeCrater(c);craters.length=0;neighborhood.syncCraterHoles?.([]);cinematicFX.syncSubwayCraters?.([]);streetWaterRunoff.reset();updateAtmosphere();displayedPhase=dayPhase(wave);displayedDarkness=dayDarkness(wave);scene.background.copy(skyTarget);updateNight(0);elapsed=0;cooldown=0;between=0;paused=false;active=true;perchDragon(wave===1);cameraScrollX=0;skyline.position.x=skylineAnchor;celestial.position.x=0;if(actualSchoolOverlay)syncStructuralDamage();document.getElementById('overlay').style.display='none';document.getElementById('campaign-transition').hidden=true;if(cinematicActive)closeChapterTransition();document.getElementById('pause').textContent='Pause';updateHud();newWave();seedChapterTrafficAndCrowd(wave<=5?1:wave<=10?2:wave<=14?3:4);for(const [k,on] of Object.entries(performanceLab.states()))applyDiagnosticSystem(k,on);}
function gameOver(){if(freeFlightMode||!active)return;if(hp<=0&&schoolDamage<1){schoolDamage=1;syncStructuralDamage();}active=false;sound('dragonMourn',{x:dragon.position.x});if(new URLSearchParams(location.search).get('benchmark')!=='1')exportTelemetry();document.getElementById('overlay').style.display='grid';document.getElementById('panel').innerHTML=`<h1>GAME OVER</h1><p>School defense score: <strong>${score.toLocaleString()}</strong><br>Reached wave ${wave}</p><button id="again">PLAY AGAIN</button><button id="settings-again">SETTINGS</button>`;document.getElementById('settings-again').onclick=()=>{openUnifiedSettings();};document.getElementById('again').onclick=reset}
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
  if(typeof flamingRubblePool !== 'undefined' && flamingRubblePool?.mesh) flamingRubblePool.mesh.visible=on;
 }
}

// ============================================================================
// DRAGON DEFENSE RC130: UNIFIED SETTINGS MODAL & DIRECTOR SANDBOX SUITE
// ============================================================================
let freeFlightMode=false;
let subwayCamActive=false;
let basementCamActive=false;
function setInspectionCamera(mode='street'){
 const available=craters.some(c=>c.isSubway&&c.life>0&&c.subwayGroup);
 if(mode==='subway'&&!available)return false;
 subwayCamActive=mode==='subway';
 basementCamActive=mode==='basement';
 document.getElementById('dd-tb-subway-cam')?.classList.toggle('active',subwayCamActive);
 document.getElementById('dd-tb-basement-cam')?.classList.toggle('active',basementCamActive);
 return true;
}
function toggleSubwayCam(){
 const mode=subwayCamActive?'street':'subway';
 if(!setInspectionCamera(mode)){message('Create a subway breach to use the subway camera.');return;}
 message(mode==='subway'?'🚇 SUBWAY CAVERN CAM: Subterranean view of Broad Street transit chasm & SEPTA train':'🏙️ STREET OVERVIEW: Returned to aerial tactical camera');
}
function toggleBasementCam(){
 const mode=basementCamActive?'street':'basement';
 setInspectionCamera(mode);
 message(mode==='basement'?'🏚️ BASEMENT CAM: Subterranean view of Tech Freire basement foundation & rubble pile':'🏙️ STREET OVERVIEW: Returned to aerial tactical camera');
}
function igniteBlock(){
 ignite(-4, 3.2, 1.5);
 ignite(5, 6.5, -8.0);
 ignite(-28, 4.5, 1.2);
 ignite(-22, 6.0, 1.2);
 ignite(45, 7.5, -32.0);
 ignite(62, 5.0, 12.5);
 sound('radioDispatch');
 sound('siren');
 message('🔥 MULTI-ALARM CONFLAGRATION: Fires ignited across North Broad Street neighborhood!');
}
let sandboxTool='meteor'; // 'meteor' | 'firefighter' | 'inspect'
let sandboxMeteorSize=3.6;
let sandboxMeteorKind='molten';
let trafficActive=true;
let pedestriansActive=true;
let sandboxTimeScale=1.0;
let sandboxZoomLevel=1.0;
let currentHoveredBuildingInfo=null;


function getBuildingInspectorInfo(b){
 if(!b)return {icon:'🏛️',title:'North Broad Structure',height:'14.0m',health:'100%',healthPercent:100,status:'Structurally Sound'};
 const name=b.name||'';
 const isSchool=b===neighborhood.school||b.school===true;
 let icon='🏛️';
 let title=b.sourceRow?.address||name||'North Broad Structure';
 if(isSchool){
  icon='🏫';
  title='Tech Freire Charter School · 2221 N Broad St';
 }else if(String(b.id)==='1005656'){
  icon='⛪';
  title='Berean Presbyterian Church · 2101–07 N Broad St';
 }
 const height=(isSchool?schoolBounds.max.y-schoolBounds.min.y:b.h).toFixed(1)+'m';
 const healthPercent=Math.max(0,Math.min(100,isSchool?hp:Math.round((1-(b.damage||0))*100)));
 const health=healthPercent+'%';
 let status='Structurally Sound';
 if(healthPercent===0){
  status='Completely Ruined / Collapsed';
 }else if(healthPercent<40){
  status='Critical Structural Failure / Crater Impact';
 }else if(healthPercent<75){
  status='Moderate Facade & Roof Breach';
 }else if(healthPercent<100){
  status='Minor Exterior Impact Damage';
 }
 return {icon,title,height,health,healthPercent,status};
}

function clearSandboxDamageResidue(){
 // Do not remove campaign projectiles when a QA repair is invoked in defense.
 if(freeFlightMode){while(meteors.length)remove(meteors,meteors.length-1);}
 while(debris.length)remove(debris,debris.length-1);
 settledRubble.length=0;rubbleDirty=false;rubblePool.clear();
 for(const w of crashedWrecks)scene.remove(w.root);
 crashedWrecks.length=0;
 for(const p of escapingPilots)scene.remove(p.root);
 escapingPilots.length=0;
 // Vehicle fire timers must agree with the cleared burning-vehicle list.
 for(const b of burningVehicles){
  if(b.driver)scene.remove(b.driver);
  if(b.car){b.car.burning=0;b.car.serviceStop=false;}
 }
 burningVehicles.length=0;
}
function repairAllBuildings(){
 clearPendingBarrages();
 clearSandboxDamageResidue();
 setInspectionCamera('street');
 for(const crack of windowDamage){scene.remove(crack);crack.geometry?.dispose();}
 windowDamage.length=0;
 for(const w of nightWindows){w.broken=false;if(w.mesh)w.mesh.visible=true;}
 damageHoles.length=0;
 resetSchoolDamageMasks();
 schoolDamage=0;
 if(schoolFragments){schoolFragments.count=0;schoolFragments.instanceMatrix.needsUpdate=true;}
 clearFires();
 syncDamageHoles();
 neighborhood?.restore?.();
 northBroadModels?.restore?.();
 schoolReconstruction?.restore?.();
 if(architecturalModel){architecturalModel.visible=false;syncStructuralDamage();}
 if(voxelReady&&architecture?.restore)architecture.restore();
 for(const c of craters){disposeCrater(c);}
 craters.length=0;
 neighborhood.syncCraterHoles?.([]);cinematicFX.syncSubwayCraters?.([]);streetWaterRunoff.reset();
 hp=100;
 updateHud();
 sound('bonus');
 message('🛠️ ENTIRE BLOCK RESTORED & REPAIRED TO 100% HEALTH');
}

const SLOW_MO_RATES=[1.0, 0.50, 0.25, 0.10, 2.0];
function cycleSlowMoSpeed(){
 const currIdx=SLOW_MO_RATES.findIndex(r=>Math.abs(r-sandboxTimeScale)<0.04);
 const nextIdx=currIdx===-1?0:(currIdx+1)%SLOW_MO_RATES.length;
 setSlowMoSpeed(SLOW_MO_RATES[nextIdx]);
}

function setSlowMoSpeed(speed){
 sandboxTimeScale=speed;
 const tbSlow=document.getElementById('dd-tb-slowmo');
 if(tbSlow){
  tbSlow.textContent=`⏱️ ${speed.toFixed(2)}x`;
  tbSlow.classList.toggle('active',speed<0.95);
 }
 const modalSlow=document.getElementById('dd-modal-slowmo-btn');
 if(modalSlow){
  modalSlow.textContent=`⏱️ Sim Speed: ${speed.toFixed(2)}x`;
  modalSlow.classList.toggle('active',speed<0.95);
 }
 message(`⏱️ SIMULATION PHYSICS RATE: ${speed.toFixed(2)}x ${speed<=0.12?'(ULTRA BULLET-TIME)':speed<=0.3?'(SLOW-MOTION)':speed<=0.6?'(CINEMATIC HALF-SPEED)':speed>1.2?'(HIGH-SPEED)':'(NORMAL)'}`);
}

function toggleSlowMo(enable){
 if(enable!==undefined){
  setSlowMoSpeed(enable?0.25:1.0);
 }else{
  cycleSlowMoSpeed();
 }
}

const pendingBarrageTimers=new Set();
function clearPendingBarrages(){for(const timer of pendingBarrageTimers)clearTimeout(timer);pendingBarrageTimers.clear();}
function spawnMeteorBarrage(count=4,centerX=null,centerZ=null){
 count=Math.max(0,Math.min(24,Math.floor(Number(count)||0),24-pendingBarrageTimers.size));
 if(!count)return;
 const cx=(typeof centerX==='number')?centerX:(sandboxReticle.visible?sandboxReticle.position.x:(dragon?dragon.position.x:0));
 const cz=(typeof centerZ==='number')?centerZ:(sandboxReticle.visible?sandboxReticle.position.z:-10);
 const kinds=['molten','flaming','blue_plasma','purple_crystal'];
 const offsets=[-14,-4,6,16];
 for(let i=0;i<count;i++){
  const timer=setTimeout(()=>{
   pendingBarrageTimers.delete(timer);
   const ox=offsets[i%offsets.length]+(Math.random()-0.5)*4;
   const oz=(Math.random()-0.5)*6;
   const size=2.4+Math.random()*2.2;
   const kind=kinds[i%kinds.length];
   spawnTestMeteorAt(cx+ox,0.5,cz+oz,size,kind);
  },i*220);
  pendingBarrageTimers.add(timer);
 }
 sound('warning');
 message(`☄️ METEOR BARRAGE (${count} BOLIDES) INCOMING!`);
}

let dragonEnabled=true;
function toggleDragon(enable){
 dragonEnabled=(enable!==undefined)?!!enable:!dragonEnabled;
 if(dragon)dragon.visible=dragonEnabled;
 if(pauloPreviewRig&&pauloPreviewRig.root)pauloPreviewRig.root.visible=dragonEnabled;
 if(!dragonEnabled){
  for(let i=shots.length-1;i>=0;i--){
   const s=shots[i];
   if(!s.hostile){if(s.mesh)scene.remove(s.mesh);shots.splice(i,1);}
  }
  windCooldown=0;gustTime=0;windActive=false;
  if(windVisual)windVisual.visible=false;
  clearWindDebris();
  cinematicFX.setWind(null,null,0);
  dragonFireLight.intensity=0;
  holdStart=0;gasHolding=false;
  soundEngine.setFlameStreamAudio(false,false);
 }
 const tbDragon=document.getElementById('dd-tb-dragon');
 if(tbDragon){
  tbDragon.textContent=dragonEnabled?'🐉 Dragon & Breath Effects: ON':'🐉 Dragon & Breath Effects: OFF';
  tbDragon.classList.toggle('active',dragonEnabled);
 }
 const setDragon=document.getElementById('dd-setting-dragon');
 if(setDragon){
  setDragon.textContent=dragonEnabled?'🐉 Dragon & Breath Effects: ON':'🐉 Dragon & Breath Effects: OFF';
  setDragon.classList.toggle('active',dragonEnabled);
 }
 message(dragonEnabled?'🐉 DRAGON & WEAPONS ACTIVE':'🐉 DRAGON & FIRE/WIND REMOVED — CLEAN INSPECTION');
}
window.toggleDragon=toggleDragon;
window.toggleMusic=()=>{window.__DD_AUDIO.setMusicMuted(!soundEngine.isMusicMuted());refreshAudioButtons();};
window.toggleSfx=()=>{window.__DD_AUDIO.setSfxMuted(!soundEngine.isSfxMuted());refreshAudioButtons();};
window.startSandboxDirect=()=>{document.getElementById('overlay').style.display='none';if(!active){try{reset();}catch(e){}}toggleFreeFlight(true);toggleDragon(false);};


function runPresetBorehole(){
 setInspectionCamera('street');
 spawnTestMeteorAt(0,16.0,-16.0,5.2,'iron');
 message('💥 PRESET: HEAVY DENSE IRON KINETIC PENETRATOR LAUNCHED!');
}

function runPresetSubway(){
 setInspectionCamera('street');
 addCrater(0,BROAD_CENTER,5.5,{isSubway:true,size:6.8,isMassive:true});
 sound('crash',{x:0});
 sound('warning');
 cinematicFX.demolitionDustWave(new THREE.Vector3(-6,0.4,BROAD_CENTER),new THREE.Vector3(6,0.4,BROAD_CENTER),2.6);
 blast(0,1.0,BROAD_CENTER,12.0);
 message('🚇 PRESET: BROAD STREET SUBWAY CAVERN RUPTURE LAUNCHED!');
}

function runPresetTitanic(){
 setInspectionCamera('street');
 addCrater(0,BROAD_CENTER,7.5,{isSubway:true,size:10.5,isTitanic:true,isMassive:true});
 sound('collapse',{x:0});
 sound('crash',{x:0});
 sound('warning');
 cinematicFX.demolitionDustWave(new THREE.Vector3(-8,0.4,BROAD_CENTER),new THREE.Vector3(8,0.4,BROAD_CENTER),3.5);
 blast(0,1.0,BROAD_CENTER,18.0);
 message('💥 PRESET: TITANIC 10.5m SUPER-COLOSSAL METEOR BREACH ON BROAD STREET!');
}

function runPresetWaterMain(){
 setInspectionCamera('street');
 addCrater(0,BROAD_CENTER,4.5,{waterOnly:true});
 message('💧 PRESET: MUNICIPAL WATER MAIN RUPTURE ACTIVATED!');
}

function runPresetFloorPancake(){
 setInspectionCamera('basement');
 schoolReconstruction?.punchBorehole?.({
  x:0,y:22.0,z:-16.0,radius:5.2,isHeavyIron:true,isMassive:true
 });
 message('🥞 PRESET: INTERNAL FLOOR SLAB PANCAKE COLLAPSE TRIGGERED!');
}

function runPresetConflagration(){
 igniteBlock();
 message('🔥 PRESET: 4TH ALARM NEIGHBORHOOD CONFLAGRATION INITIATED!');
}

function toggleFreeFlight(enable){
 const next=(enable!==undefined)?!!enable:!freeFlightMode;
 if(next===freeFlightMode)return;
 freeFlightMode=next;
 const toolbar=document.getElementById('dd-sandbox-toolbar');
 if(toolbar)toolbar.hidden=!freeFlightMode;
 const flightToggle=document.getElementById('dd-sandbox-flight-toggle');
 if(flightToggle){
  flightToggle.textContent=freeFlightMode?'✈️ Free-Flight: ON':'✈️ Free-Flight: OFF';
  flightToggle.classList.toggle('active',freeFlightMode);
 }
 const bottomSandboxBtn=document.getElementById('sandbox-btn');
 if(bottomSandboxBtn){
  bottomSandboxBtn.classList.toggle('active',freeFlightMode);
 }
 const defBtn=document.getElementById('dd-set-mode-defense');
 const sandBtn=document.getElementById('dd-set-mode-sandbox');
 if(defBtn)defBtn.classList.toggle('active',!freeFlightMode);
 if(sandBtn)sandBtn.classList.toggle('active',freeFlightMode);

 if(freeFlightMode){
  if(!active){
   try{reset();}catch(e){}
  }
  if(paused){
   paused=false;
   document.getElementById('pause').textContent='Pause';
  }
  document.getElementById('overlay').style.display='none';
  document.getElementById('campaign-transition').hidden=true;
  if(cinematicActive)closeChapterTransition();
  dragonLives=999;
  invulnerable=999999;
  spawnTimer=999999;
  stormTimer=999999;
  remaining=0;
  between=0;
  chapterSettlement={active:false,phase:'idle',timer:0,nextWave:null,fromChapter:null};
  updateHud();
  message('✈️ FREE-FLIGHT MAP INSPECTOR ACTIVE — FLY ANYWHERE');
 }else{
  setInspectionCamera('street');
  dragonLives=3;
  invulnerable=0;
  spawnTimer=1.0;
  sandboxTimeScale=1.0;
  sandboxZoomLevel=1.0;
  const inspCard=document.getElementById('dd-inspector-card');
  if(inspCard)inspCard.hidden=true;
  // Sandbox deliberately changes the world and campaign timers. Start a
  // clean defense session instead of resuming stale/empty wave state.
  toggleDragon(true);
  reset();
  message('⚔️ STANDARD DEFENSE — NEW CAMPAIGN SESSION');
 }
}

function spawnTestMeteorAt(hitX,hitY,hitZ,size=3.6,kind='molten'){
 const mesh=createPlayableRock(size);
 if(kind==='iron')mesh.material=ironMeteorMaterial;
 else if(kind==='flaming')mesh.material=flamingMaterial;
 else if(kind==='molten')mesh.material=moltenMaterial;
 else if(kind==='blue_plasma')mesh.material=bluePlasmaMaterial;
 else if(kind==='purple_crystal')mesh.material=purpleCrystalMaterial;
 else mesh.material=rockMaterialVariants[0];

 const isSuperMassive=size>=9.0;
 const spawnY=hitY+Math.max(28.0,size*3.2);
 mesh.position.set(hitX,spawnY,hitZ);
 scene.add(mesh);

 const vel=new THREE.Vector3(0,-Math.max(28.0,size*2.6),0);
 const target=new THREE.Vector3(hitX,hitY,hitZ);

 meteors.push({
  testMeteor:true,
  kind,
  isPowerup:null,
  opening:false,
  fastImpact:true,
  isMassive:size>=4.0||kind==='iron',
  isHeavyIron:kind==='iron',
  mass:size*(kind==='iron'?3.8:1.0),
  colossus:size>=4.0,
  largeSplitter:false,
  burning:kind==='flaming'||kind==='molten',
  mesh,
  target,
  vel,
  trail:0,
  hp:kind==='iron'?8:1,
  size,
  damage:isSuperMassive?9.0:(size>=5.0?3.5:(size>=3.0?2.5:1.5)),
  baseScale:mesh.scale.clone(),
  hitFlash:0
 });

 sound('whoosh_launch',{x:hitX});
 message('☄️ TEST METEOR ('+size.toFixed(1)+'m '+kind.toUpperCase()+') DROPPED AT ['+Math.round(hitX)+', '+Math.round(hitZ)+']');
}

function dispatchFirefighters(targetX){
 const x=(typeof targetX==='number')?targetX:(dragon?dragon.position.x-20:0);
 spawnCar(x,BROAD_LANES[0],1,'fireTruck');
 sound('warning');
 message('🚒 PHILADELPHIA FIRE DEPARTMENT DISPATCHED WITH WATER MONITORS!');
}

function extinguishAllFires(){
 clearFires();
 for(const b of burningVehicles){
  if(b.driver)scene.remove(b.driver);
  if(b.car){b.car.burning=0;b.car.serviceStop=false;}
 }
 burningVehicles.length=0;
 message('🧯 ALL ACTIVE FIRES EXTINGUISHED');
}

function setTrafficEnabled(enabled){
 trafficActive=!!enabled;
 if(!trafficActive){
  for(const c of cars)recycleCar(c);
  cars.length=0;
  carTimer=999999;
 }else{
  carTimer=0.5;
 }
 const tbBtn=document.getElementById('dd-tb-traffic');
 if(tbBtn){
  tbBtn.textContent=trafficActive?'🚗 Traffic: ON':'🚗 Traffic: OFF';
  tbBtn.classList.toggle('active',trafficActive);
 }
 const modalBtn=document.getElementById('dd-traffic-toggle-btn');
 if(modalBtn){
  modalBtn.textContent=trafficActive?'🚗 Cars: ON':'🚗 Cars: OFF';
  modalBtn.classList.toggle('active',trafficActive);
 }
 message('🚗 VEHICLE TRAFFIC '+(trafficActive?'ENABLED':'PAUSED & CLEARED'));
}

function setPedestriansEnabled(enabled){
 pedestriansActive=!!enabled;
 if(!pedestriansActive){
  for(const p of crowd)scene.remove(p.g);
  crowd.length=0;
  crowdTimer=999999;
 }else{
  crowdTimer=1.0;
 }
 const tbBtn=document.getElementById('dd-tb-crowd');
 if(tbBtn){
  tbBtn.textContent=pedestriansActive?'🚶 Crowd: ON':'🚶 Crowd: OFF';
  tbBtn.classList.toggle('active',pedestriansActive);
 }
 const modalBtn=document.getElementById('dd-pedestrians-toggle-btn');
 if(modalBtn){
  modalBtn.textContent=pedestriansActive?'🚶 Crowd: ON':'🚶 Crowd: OFF';
  modalBtn.classList.toggle('active',pedestriansActive);
 }
 message('🚶 PEDESTRIAN CROWDS '+(pedestriansActive?'ENABLED':'PAUSED & CLEARED'));
}

function setLevelAtmosphere(lvl){
 let targetWave=1;
 if(lvl==='orbit'||lvl===6)targetWave=15;
 else if(lvl===5||lvl==='5')targetWave=14;
 else if(lvl===4||lvl==='4')targetWave=11;
 else if(lvl===3||lvl==='3')targetWave=8;
 else if(lvl===2||lvl==='2')targetWave=4;
 else targetWave=1;

 displayedPhase=dayPhase(targetWave);
 displayedDarkness=dayDarkness(targetWave);
 updateAtmosphere();
 cinematicLighting.update(0.1,displayedDarkness);
 northBroadModels?.setNight?.(displayedDarkness);
 schoolReconstruction?.setNight?.(displayedDarkness);
 skylineBackdrop.setTime(displayedPhase,displayedDarkness);
 scene.background.copy(skyTarget);
 scene.fog.color.copy(skyTarget);
 scene.fog.density=(lvl==='orbit'||targetWave>=15)?0.0004:(0.00105+displayedDarkness*0.00020);

 const tbAtmo=document.getElementById('dd-tb-atmo');
 if(tbAtmo)tbAtmo.value=String(lvl);
 document.querySelectorAll('.dd-atmo-btn').forEach(btn=>{
  btn.classList.toggle('active',btn.dataset.atmo===String(lvl));
 });

 const atmoName=(lvl==='orbit'||targetWave>=15)?'ORBIT (EXOSPHERE)':('LEVEL '+lvl+' ('+(targetWave<=3?'MORNING':targetWave<=6?'NOON':targetWave<=9?'SUNSET':targetWave<=12?'TWILIGHT':'MIDNIGHT')+')');
 message('🌅 ATMOSPHERE SWITCHED: '+atmoName);
}

function spawnLevelAsset(assetType){
 const px=dragon?dragon.position.x:0;
 const pz=dragon?dragon.position.z:12;
 switch(assetType){
  case 'helicopter_news':
   spawnHelicopter(0);
   message('🚁 NEWS HELICOPTER SPAWNED');
   break;
  case 'helicopter_police':
   spawnHelicopter(1);
   message('🚁 POLICE HELICOPTER SPAWNED');
   break;
  case 'helicopter_chinook':
   spawnHelicopter(2);
   message('🚁 MILITARY CHINOOK SPAWNED');
   break;
  case 'police':
   spawnCar(px-15,BROAD_LANES[0],1,'police');
   message('🚓 POLICE CRUISER SPAWNED');
   break;
  case 'ambulance':
   spawnCar(px-15,BROAD_LANES[0],1,'ambulance');
   message('🚑 AMBULANCE SPAWNED');
   break;
  case 'fire_truck':
   dispatchFirefighters(px-20);
   break;
  case 'powerup_purple':
   spawnTestMeteorAt(px+10,2,pz-4,3.2,'purple_crystal');
   break;
  case 'powerup_blue':
   spawnTestMeteorAt(px+10,2,pz-4,3.0,'blue_plasma');
   break;
  case 'powerup_fire_stream':
   spawnTestMeteorAt(px+10,2,pz-4,3.0,'fizzing_flame');
   break;
  case 'powerup_green':
   spawnTestMeteorAt(px+10,2,pz-4,3.0,'green_plasma');
   break;
  default:
   console.warn('Unknown asset type:',assetType);
 }
}

// Sandbox Raycasting and 3D Ground/Roof Reticle
const sandboxRaycaster=new THREE.Raycaster();
const sandboxMouse=new THREE.Vector2();
const sandboxGroundPlane=new THREE.Plane(new THREE.Vector3(0,1,0),0);
const reticleGeom=new THREE.RingGeometry(1.2,1.6,32);
reticleGeom.rotateX(-Math.PI/2);
const reticleMat=new THREE.MeshBasicMaterial({color:0xff3855,side:THREE.DoubleSide,transparent:true,opacity:0.85});
const sandboxReticle=new THREE.Mesh(reticleGeom,reticleMat);
sandboxReticle.name='sandbox-target-reticle';
sandboxReticle.visible=false;
scene.add(sandboxReticle);

function updateSandboxReticle(e){
 const inspCard=document.getElementById('dd-inspector-card');
 if(!freeFlightMode){
  sandboxReticle.visible=false;
  if(inspCard)inspCard.hidden=true;
  currentHoveredBuildingInfo=null;
  return;
 }
 sandboxMouse.x=(e.clientX/window.innerWidth)*2-1;
 sandboxMouse.y=-(e.clientY/window.innerHeight)*2+1;
 sandboxRaycaster.setFromCamera(sandboxMouse,camera);

 let hitPoint=null;
 let hitBuilding=null;
 const buildings=[neighborhood.school,...(neighborhood.targetBuildings||[])];
 const bBox=new THREE.Box3();
 const hitVec=new THREE.Vector3();

 for(const b of buildings){
  if(!b)continue;
  const halfW=(b.w||20)/2;
  const depth=b.d||20;
  const height=b.h||12;
  bBox.min.set(b.x-halfW,0,b.z-depth/2);
  bBox.max.set(b.x+halfW,height,b.z+depth/2);
  if(sandboxRaycaster.ray.intersectBox(bBox,hitVec)){
   if(!hitPoint||hitVec.distanceTo(sandboxRaycaster.ray.origin)<hitPoint.distanceTo(sandboxRaycaster.ray.origin)){
    hitPoint=hitVec.clone();
    hitBuilding=b;
   }
  }
 }

 if(!hitPoint){
  if(sandboxRaycaster.ray.intersectPlane(sandboxGroundPlane,hitVec)){
   hitPoint=hitVec.clone();
  }
 }

 if(hitPoint){
  sandboxReticle.position.copy(hitPoint).add(new THREE.Vector3(0,0.18,0));
  sandboxReticle.visible=(sandboxTool==='meteor');

  if(inspCard){
   if(hitBuilding){
    const info=getBuildingInspectorInfo(hitBuilding);
    currentHoveredBuildingInfo=info;
    const iconEl=document.getElementById('dd-insp-icon');
    const titleEl=document.getElementById('dd-insp-title');
    const descEl=document.getElementById('dd-insp-desc');
    if(iconEl)iconEl.textContent=info.icon;
    if(titleEl)titleEl.textContent=info.title;
    if(descEl)descEl.textContent=`Height: ${info.height} · Health: ${info.health} · Status: ${info.status}`;
    inspCard.hidden=false;
   }else{
    currentHoveredBuildingInfo={icon:'🛣️',title:'North Broad Street Corridor',height:'0.0m',health:'100%',healthPercent:100,status:'Clear Corridor'};
    const iconEl=document.getElementById('dd-insp-icon');
    const titleEl=document.getElementById('dd-insp-title');
    const descEl=document.getElementById('dd-insp-desc');
    if(iconEl)iconEl.textContent='🛣️';
    if(titleEl)titleEl.textContent='North Broad Street Corridor';
    if(descEl)descEl.textContent=`Elevation: 0.0m · Surface: Asphalt & Concrete · Pos: [${Math.round(hitPoint.x)}, ${Math.round(hitPoint.z)}]`;
    inspCard.hidden=false;
   }
  }
 }else{
  sandboxReticle.visible=false;
  if(inspCard)inspCard.hidden=true;
  currentHoveredBuildingInfo=null;
 }
}
window.addEventListener('pointermove',updateSandboxReticle);
window.addEventListener('wheel',e=>{
 if(!freeFlightMode)return;
 if(e.target.closest('#dd-unified-settings')||e.target.closest('#performance-lab-panel'))return;
 e.preventDefault();
 const delta=e.deltaY>0?-0.1:0.1;
 sandboxZoomLevel=THREE.MathUtils.clamp(sandboxZoomLevel+delta,0.55,2.5);
 message('🔍 INSPECTION ZOOM: '+Math.round(sandboxZoomLevel*100)+'%');
},{passive:false});


window.addEventListener('pointerdown',e=>{
 if(!freeFlightMode||sandboxTool!=='meteor')return;
 if(e.target.closest('#dd-unified-settings')||e.target.closest('#dd-sandbox-toolbar')||e.target.closest('#bottom')||e.target.closest('#hud')||e.target.closest('#performance-lab-panel'))return;
 if(sandboxReticle.visible){
  const pt=sandboxReticle.position;
  const size=parseFloat(document.getElementById('dd-tb-meteor-size')?.value||document.getElementById('dd-test-meteor-size')?.value||'3.6');
  const kind=document.getElementById('dd-tb-meteor-kind')?.value||document.getElementById('dd-test-meteor-kind')?.value||'molten';
  spawnTestMeteorAt(pt.x,Math.max(0.5,pt.y-0.18),pt.z,size,kind);
 }
});

// Unified Settings Modal Controls
let settingsPausedGame=false;
function openUnifiedSettings(defaultTab='gameplay'){
 const modal=document.getElementById('dd-unified-settings');
 if(!modal)return;
 modal.hidden=false;
 if(active&&!paused){
  settingsPausedGame=true;
  togglePause();
 }
 switchSettingsTab(defaultTab);
 syncSettingsUI();
}

function closeUnifiedSettings(){
 const modal=document.getElementById('dd-unified-settings');
 if(modal)modal.hidden=true;
 if(settingsPausedGame&&active&&paused)togglePause();
 settingsPausedGame=false;
}

function switchSettingsTab(tabName){
 document.querySelectorAll('.dd-settings-tab').forEach(t=>{
  const match=t.dataset.tab===tabName;
  t.classList.toggle('active',match);
  t.setAttribute('aria-selected',String(match));
 });
 document.querySelectorAll('.dd-settings-panel').forEach(p=>{
  p.hidden=(p.dataset.panel!==tabName);
 });
}

function syncSettingsUI(){
 const waveVal=clampWave(document.getElementById('start-wave')?.value||wave);
 const modalWave=document.getElementById('dd-modal-start-wave');
 const modalWaveVal=document.getElementById('dd-modal-start-wave-val');
 if(modalWave)modalWave.value=String(waveVal);
 if(modalWaveVal)modalWaveVal.textContent=String(waveVal);

 const diff=document.getElementById('difficulty')?.value||'normal';
 const modalDiff=document.getElementById('dd-modal-difficulty');
 if(modalDiff)modalDiff.value=diff;

 const gVal=visualPreset||'balanced';
 const modalG=document.getElementById('dd-modal-graphics');
 if(modalG)modalG.value=gVal;

 refreshAudioButtons();

 const flightToggle=document.getElementById('dd-sandbox-flight-toggle');
 if(flightToggle){
  flightToggle.textContent=freeFlightMode?'✈️ Free-Flight: ON':'✈️ Free-Flight: OFF';
  flightToggle.classList.toggle('active',freeFlightMode);
 }
 const defBtn=document.getElementById('dd-set-mode-defense');
 const sandBtn=document.getElementById('dd-set-mode-sandbox');
 if(defBtn)defBtn.classList.toggle('active',!freeFlightMode);
 if(sandBtn)sandBtn.classList.toggle('active',freeFlightMode);

 const cinemaBtn=document.getElementById('dd-modal-cinema-btn');
 if(cinemaBtn&&window.__DD_CINEMA_HUD){
  const cOn=window.__DD_CINEMA_HUD.snapshot().enabled;
  cinemaBtn.textContent=cOn?'🎬 Cinema HUD: ON':'🎬 Cinema HUD: OFF';
  cinemaBtn.classList.toggle('active',cOn);
 }
}

// Wire up event listeners for Unified Settings & Director Toolbar
function initUnifiedSettingsEvents(){
 document.querySelectorAll('.dd-settings-tab').forEach(btn=>{
  btn.addEventListener('click',()=>switchSettingsTab(btn.dataset.tab));
 });
 document.getElementById('dd-settings-close-btn')?.addEventListener('click',closeUnifiedSettings);
 document.getElementById('dd-modal-start-wave')?.addEventListener('input',e=>{
  const val=clampWave(e.target.value);
  const startWaveEl=document.getElementById('start-wave');
  if(startWaveEl)startWaveEl.value=String(val);
  const lbl=document.getElementById('dd-modal-start-wave-val');
  if(lbl)lbl.textContent=String(val);
 });
 document.getElementById('dd-modal-difficulty')?.addEventListener('change',e=>{
  const diffEl=document.getElementById('difficulty');
  if(diffEl)diffEl.value=e.target.value;
 });
 document.getElementById('dd-modal-graphics')?.addEventListener('change',e=>{
  visualPreset=e.target.value;
  const gEl=document.getElementById('graphics');
  if(gEl)gEl.value=visualPreset;
  applyVisualPreset();
 });
 document.getElementById('dd-set-mode-defense')?.addEventListener('click',()=>toggleFreeFlight(false));
 document.getElementById('dd-set-mode-sandbox')?.addEventListener('click',()=>toggleFreeFlight(true));
 document.getElementById('dd-modal-trial-btn')?.addEventListener('click',()=>{
  closeUnifiedSettings();
  startTacticalTrial();
 });
 document.getElementById('dd-modal-fullscreen-btn')?.addEventListener('click',async()=>{
  try{if(document.fullscreenElement)await document.exitFullscreen();else await document.documentElement.requestFullscreen();}catch(e){message('FULLSCREEN UNAVAILABLE');}
 });
 document.getElementById('dd-modal-cinema-btn')?.addEventListener('click',()=>{
  document.getElementById('cinema-hud-toggle')?.click();
  syncSettingsUI();
 });
 document.getElementById('dd-modal-perf-lab-btn')?.addEventListener('click',()=>{
  document.getElementById('performance-lab-btn')?.click();
  const lab=document.getElementById('performance-lab-panel');
  if(lab)lab.hidden=false;
 });
 document.getElementById('dd-modal-export-stats-btn')?.addEventListener('click',exportTelemetry);
 document.getElementById('dd-audio-master-btn')?.addEventListener('click',()=>{
  window.__DD_AUDIO.setMuted(!soundEngine.isMuted());
 });
 document.getElementById('dd-audio-music-btn')?.addEventListener('click',()=>{
  window.__DD_AUDIO.setMusicMuted(!soundEngine.isMusicMuted());
 });
 document.getElementById('dd-audio-sfx-btn')?.addEventListener('click',()=>{
  window.__DD_AUDIO.setSfxMuted(!soundEngine.isSfxMuted());
 });
 document.getElementById('dd-sandbox-flight-toggle')?.addEventListener('click',()=>toggleFreeFlight());
 document.querySelectorAll('.dd-atmo-btn').forEach(btn=>{
  btn.addEventListener('click',()=>setLevelAtmosphere(btn.dataset.atmo));
 });
 document.getElementById('dd-dispatch-firefighters-btn')?.addEventListener('click',()=>dispatchFirefighters());
 document.getElementById('dd-extinguish-all-btn')?.addEventListener('click',extinguishAllFires);
 document.getElementById('dd-traffic-toggle-btn')?.addEventListener('click',()=>setTrafficEnabled(!trafficActive));
 document.getElementById('dd-pedestrians-toggle-btn')?.addEventListener('click',()=>setPedestriansEnabled(!pedestriansActive));
 document.querySelectorAll('.dd-spawn-btn').forEach(btn=>{
  btn.addEventListener('click',()=>spawnLevelAsset(btn.dataset.asset));
 });

 // Director Toolbar Events
 function selectMeteorTool(){
  sandboxTool='meteor';
  document.getElementById('dd-tb-meteor-tool')?.classList.add('active');
  document.getElementById('dd-tb-ignite')?.classList.remove('active');
  message('🎯 METEOR DROPPER ACTIVE — CLICK ANY BUILDING OR STREET');
 }
 document.getElementById('dd-tb-meteor-tool')?.addEventListener('click',selectMeteorTool);
 document.getElementById('dd-meteor-tool-btn')?.addEventListener('click',()=>{
  document.getElementById('dd-tb-meteor-size').value=document.getElementById('dd-test-meteor-size').value;
  document.getElementById('dd-tb-meteor-kind').value=document.getElementById('dd-test-meteor-kind').value;
  closeUnifiedSettings();
  if(!freeFlightMode)toggleFreeFlight(true);
  selectMeteorTool();
 });
 document.getElementById('dd-tb-ignite')?.addEventListener('click',()=>{
  sandboxTool=(sandboxTool==='ignite'?'meteor':'ignite');
  document.getElementById('dd-tb-ignite')?.classList.toggle('active',sandboxTool==='ignite');
  document.getElementById('dd-tb-meteor-tool')?.classList.toggle('active',sandboxTool==='meteor');
  message(sandboxTool==='ignite'?'🔥 FIRE IGNITER ACTIVE — CLICK ANY BUILDING OR STREET TO START FIRE':'🎯 METEOR DROPPER ACTIVE');
 });
 document.getElementById('dd-tb-barrage')?.addEventListener('click',()=>spawnMeteorBarrage());
 document.getElementById('dd-modal-barrage-btn')?.addEventListener('click',()=>spawnMeteorBarrage());
 document.getElementById('dd-tb-firefighters')?.addEventListener('click',()=>dispatchFirefighters());
 document.getElementById('dd-tb-extinguish')?.addEventListener('click',extinguishAllFires);
 document.getElementById('dd-tb-repair')?.addEventListener('click',repairAllBuildings);
 document.getElementById('dd-modal-repair-btn')?.addEventListener('click',repairAllBuildings);
 document.getElementById('dd-tb-slowmo')?.addEventListener('click',()=>toggleSlowMo());
 document.getElementById('dd-modal-slowmo-btn')?.addEventListener('click',()=>toggleSlowMo());
 document.getElementById('dd-tb-traffic')?.addEventListener('click',()=>setTrafficEnabled(!trafficActive));
 document.getElementById('dd-tb-crowd')?.addEventListener('click',()=>setPedestriansEnabled(!pedestriansActive));
 document.getElementById('dd-tb-atmo')?.addEventListener('change',e=>setLevelAtmosphere(e.target.value));
 document.getElementById('dd-tb-settings')?.addEventListener('click',()=>openUnifiedSettings('sandbox'));
 document.getElementById('dd-tb-exit')?.addEventListener('click',()=>toggleFreeFlight(false));

 // Bottom Bar Sandbox Button
 document.getElementById('sandbox-btn')?.addEventListener('click',()=>toggleFreeFlight());
 document.getElementById('dd-tb-dragon')?.addEventListener('click',()=>toggleDragon());
 document.getElementById('dd-tb-subway-cam')?.addEventListener('click',()=>toggleSubwayCam());
 document.getElementById('dd-tb-basement-cam')?.addEventListener('click',()=>toggleBasementCam());
 document.getElementById('dd-tb-spawn-furniture')?.addEventListener('click',()=>{
  const px=pointer?.x||0, pz=pointer?.z||22;
  spawnFurnitureBurst(px,12,pz,6);
  message('🪑 DYNAMIC FURNITURE BURST SPAWNED');
 });
 document.getElementById('dd-tb-preset-borehole')?.addEventListener('click',()=>runPresetBorehole());
 document.getElementById('dd-tb-preset-subway')?.addEventListener('click',()=>runPresetSubway());
 document.getElementById('dd-tb-preset-water')?.addEventListener('click',()=>runPresetWaterMain());
 document.getElementById('dd-tb-preset-pancake')?.addEventListener('click',()=>runPresetFloorPancake());
  document.getElementById('dd-tb-preset-titanic')?.addEventListener('click',()=>runPresetTitanic());
 document.getElementById('dd-tb-preset-fire')?.addEventListener('click',()=>runPresetConflagration());
 document.getElementById('dd-tb-ignite-block')?.addEventListener('click',()=>igniteBlock());
 document.getElementById('dd-setting-dragon')?.addEventListener('click',()=>toggleDragon());
 document.getElementById('dd-tb-music')?.addEventListener('click',()=>{
  window.__DD_AUDIO.setMusicMuted(!soundEngine.isMusicMuted());
  refreshAudioButtons();
 });
 document.getElementById('dd-tb-sfx')?.addEventListener('click',()=>{
  window.__DD_AUDIO.setSfxMuted(!soundEngine.isSfxMuted());
  refreshAudioButtons();
 });
 document.getElementById('music-toggle-bottom')?.addEventListener('click',()=>{
  window.__DD_AUDIO.setMusicMuted(!soundEngine.isMusicMuted());
  refreshAudioButtons();
 });
 document.getElementById('sfx-toggle-bottom')?.addEventListener('click',()=>{
  window.__DD_AUDIO.setSfxMuted(!soundEngine.isSfxMuted());
  refreshAudioButtons();
 });
 document.getElementById('start-sandbox-direct')?.addEventListener('click',window.startSandboxDirect);
}

initUnifiedSettingsEvents();

window.addEventListener('keydown',e=>{
 if(e.key==='Escape'){
  const modal=document.getElementById('dd-unified-settings');
  if(modal&&!modal.hidden){
   closeUnifiedSettings();
   e.preventDefault();
  }else{
   openUnifiedSettings();
   e.preventDefault();
  }
 }else if(e.key==='F1'){
  toggleFreeFlight(!freeFlightMode);
  e.preventDefault();
 }else if(e.key==='F2'){
  openUnifiedSettings();
  e.preventDefault();
 }
});

function showSettings(){
 openUnifiedSettings();
 const visualSelect=document.getElementById('graphics');if(visualSelect)visualSelect.value=visualPreset;
}
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
const TRIAL_PARAM=QUERY_PARAMS.get('trial')==='1'||QUERY_PARAMS.get('encounter')==='1';
if(TRIAL_PARAM)setTimeout(startTacticalTrial,100);
document.getElementById('tactical-trial-btn')?.addEventListener('click',startTacticalTrial);
document.getElementById('start-trial')?.addEventListener('click',startTacticalTrial);
document.getElementById('graphics')?.addEventListener('change',e=>{visualPreset=e.target.value;applyVisualPreset();});
document.getElementById('settings-btn').onclick=()=>{openUnifiedSettings();};
document.getElementById('gas-btn').onclick=gasAttack;document.getElementById('start-training')?.addEventListener('click',()=>{playTrainingMode=true;skipChapterIntroCinematic=true;safelyStart();});
document.getElementById('start')?.addEventListener('click',()=>{playTrainingMode=false;skipChapterIntroCinematic=true;safelyStart();});
window.addEventListener('keydown',e=>{if(e.key==='Tab'&&trainingMissions?.isActive()){e.preventDefault();trainingMissions.skip();}});document.getElementById('restart').onclick=safelyStart;document.getElementById('pause').onclick=togglePause;
const defensePrevious=new THREE.Vector3(),defenseCurrent=new THREE.Vector3(),defenseMeteor=new THREE.Vector3();
const shotScratchPrevious=new THREE.Vector3(),shotScratchPath=new THREE.Vector3(),shotScratchClosest=new THREE.Vector3(),shotScratchDelta=new THREE.Vector3();
function update(dt){if(freeFlightMode){spawnTimer=999999;stormTimer=999999;remaining=0;dragonLives=999;}if(!paused){schoolReconstruction?.update(dt);chapterStaging.update(dt,elapsed);cinematicFX.begin(dt);neighborhood.update(dt);powerGrid.update(dt,flashAt,sound);buildingElectricalShorts.update(dt,cinematicFX,sound,schoolDamage,neighborhood.targetBuildings,craters.some(c=>c.isSubway&&c.subwayGroup),craters.some(c=>c.geyserGroup));orbitalTheater?.update(dt,elapsed,wave,dragon.position,elapsed<megaFireBreathUntil,(kind,x,y,z)=>{if(meteors.length>=MAX_PLAYABLE_METEORS&&kind!=='mega_fire_breath')return;const mesh=createPlayableRock(2.8);mesh.material=kind==='mega_fire_breath'?goldRedPlasmaMaterial:fizzingFireMaterial;mesh.position.set(x,y,z);scene.add(mesh);meteors.push({kind,isPowerup:kind,mesh,target:new THREE.Vector3(x,0.5,z),vel:new THREE.Vector3(0,-6,0),trail:0,hp:3,size:2.8,damage:1,burning:true});},(x,y,z)=>{
 if(meteors.length>=MAX_PLAYABLE_METEORS)return;
 const isGiant=Math.random()<0.70;
 const size=isGiant?3.6+Math.random()*1.2:1.2+Math.random()*1.0;
 const kindRoll=Math.random();
 const kind=kindRoll<0.35?'molten':kindRoll<0.65?'flaming':kindRoll<0.85?'iron':'stone';
 const mesh=createPlayableRock(size);
 if(kind==='molten'||kind==='flaming')mesh.material=moltenMaterial;
 mesh.position.set(x,y,z);
 scene.add(mesh);
 const hp=isGiant?Math.max(4,Math.ceil(size*1.3)):Math.max(2,Math.ceil(size*1.1));
 meteors.push({kind,mesh,target:new THREE.Vector3(x+(Math.random()-0.5)*30,0.5,z),vel:new THREE.Vector3((Math.random()-0.5)*4,isGiant?-11:-15,0),trail:0,hp,size,damage:isGiant?2.5:1.0,burning:kind==='molten'||kind==='flaming',largeSplitter:isGiant});
},(reason)=>{stunDragon(reason||'SATELLITE ELECTRICAL DEFENSE GRID');});for(let i=escapingPilots.length-1;i>=0;i--){const p=escapingPilots[i];p.life-=dt;p.root.position.x+=p.dir*p.speed*dt;const legAngle=Math.sin(elapsed*16)*0.75;p.legL.rotation.x=legAngle;p.legR.rotation.x=-legAngle;p.armL.rotation.x=-legAngle;p.armR.rotation.x=legAngle;if(p.flareSprite){p.flareSprite.scale.setScalar(0.70+Math.sin(elapsed*28.0)*0.22);if(performanceLab.isEnabled('particles')&&Math.random()<0.40){trailEmberPool.add(p.root.position.clone().add(new THREE.Vector3(0.36*p.dir,0.86,0.12)),0.45);}}if(p.life<=0||Math.abs(p.root.position.x)>180){scene.remove(p.root);escapingPilots.splice(i,1);}}if(active){neighborhood.school.damage=schoolDamage;hp=Math.max(0,Math.round((1-schoolDamage)*100));}updateNight(dt);if(performanceLab.isEnabled('weather'))cinematicWeather.update(dt,wave,dayDarkness(wave));if(performanceLab.isEnabled('particles'))updateEffects(dt);foregroundMeteors?.update(dt,elapsed,(x,y,z)=>flashAt(x,y,z,.42));
 if(trainingMissions?.isActive()){hp=100;schoolDamage=0;remaining=0;spawnTimer=9999;} trainingMissions?.update(dt,{dragonPos:dragon.position,dragonVelX,dragonVelY,dragonSpeed:Math.hypot(dragonVelX,dragonVelY),isGasDeployed:gasPose>0,hasBusterCollided:busterRamCollided,meteorsList:meteors,schoolFiresCount:schoolFire.length,carsList:cars});
 if(secondaryEscortTimer>0){secondaryEscortTimer-=dt;if(secondaryEscortTimer<=0&&!evacuationChapter?.isActive()){const rNum=wave===7?1:wave===9?2:wave===12?3:4;evacuationChapter?.startSecondaryEscort(rNum);}} evacuationChapter?.update(dt,elapsed,meteors);if(performanceLab.isEnabled('fires'))updateFires(dt);if(active&&performanceLab.isEnabled('traffic'))updateCars(dt);updateEmergencyLighting();updateBuildingElectricalShorts(dt);}if(!active||paused){
if(!freeFlightMode&&active&&neighborhoodHealth()<=0){hp=0;gameOver();return;}
 if(!active&&impactMarker)impactMarker.visible=false;
 if(targetingReticle)targetingReticle.visible=false;
 if(!paused&&neighborhoodHealth()===0&&performanceLab.isEnabled('backgroundMeteors')){
  updateSkyBursts(dt);updateDistantMeteors(dt);escalateBackgroundNeighborhood(dt);
 }
 return;
}
elapsed+=dt;const settling=chapterSettlement.active;updateChapterSettlement(dt);if(paused)return;const actualSchoolFires=schoolFire.filter(f=>Math.abs(f.root.position.x)<=13.5&&f.root.position.z>=-58.4&&f.root.position.z<=0.4&&f.root.position.y>=2.0);if(!settling&&actualSchoolFires.length){const severity=Math.min(1,actualSchoolFires.reduce((sum,f)=>sum+Math.max(0,1-f.suppression),0)/3);fireHealthAccumulator+=dt*(1+severity*.75)*severity;if(fireHealthAccumulator>=1){const damage=Math.floor(fireHealthAccumulator);fireHealthAccumulator-=damage;hp=Math.max(0,hp-damage);updateHud();if(hp<=0){gameOver();return;}}}blockCharge=Math.min(100,blockCharge+dt*(wave<=5?1.9:wave<=10?2.5:1.5));updateBlockButton();updatePowerHud();updateShield();updateWorld(dt);
if(active&&!paused){
 ray.setFromCamera(aimNdc,camera);
 if(ray.ray.intersectPlane(plane,aimIntersection)){
  const maxAimX=340+Math.abs(cameraScrollX);
  pointer.set(THREE.MathUtils.clamp(aimIntersection.x,-maxAimX,maxAimX),THREE.MathUtils.clamp(aimIntersection.y,-12,flightCeiling+35),0);
 }
}
if(targetingReticle){targetingReticle.rotation.z+=dt*1.2;const pulse=1+Math.sin(elapsed*7)*.08;targetingReticle.scale.set(pulse,pulse,pulse);targetingReticle.position.set(pointer.x,pointer.y,1.5);targetingReticle.visible=active&&!paused;}
 const isFiringContinuous=(elapsed<rapidFireUntil||elapsed<fireStreamUntil||elapsed<megaFireBreathUntil);const firePressed=input.isDown(ACTIONS.FIRE)||(activeMouseButtons&1)!==0;if(isFiringContinuous&&cooldown<=0&&firePressed&&dragonEnabled&&(!freeFlightMode||sandboxTool!=='meteor'))shoot();soundEngine.setFlameStreamAudio(isFiringContinuous&&firePressed,elapsed<megaFireBreathUntil);updateMeteorRadar(dt);
 // Mouse right button, F key or the GAS HUD button activate gas; prolonged fire never does.

 dragonMeteorTimer-=dt;if(!settling&&wave>4&&wave<15&&dragonMeteorTimer<=0&&(!rallyLoop||remaining>0)){spawnDragonMeteor();dragonMeteorTimer=waveBudget(wave,document.getElementById('difficulty')?.value).hunterMinInterval+Math.random()*3;}
 cooldown=Math.max(0,cooldown-dt);const move=dragonStun>0?0:Number(input.isDown(ACTIONS.RIGHT))-Number(input.isDown(ACTIONS.LEFT));const rise=dragonStun>0?0:Number(input.isDown(ACTIONS.UP))-Number(input.isDown(ACTIONS.DOWN));
const wasOnRoof=!dragonLeavingRoof;
if(move||rise||dragonStun>0)dragonLeavingRoof=true;
if(wasOnRoof&&dragonLeavingRoof){
 dragonVelY=Math.max(dragonVelY,8.5);
 sound('dragonFlap',{x:dragon.position.x});
 if(performanceLab.isEnabled('particles')){
  for(let k=0;k<6;k++)trailEmberPool.add(dragon.position.clone().add(new THREE.Vector3((Math.random()-.5)*2.5,-0.6,(Math.random()-.5)*1.5)),1.2);
 }
}
if(dragonLeavingRoof)dragon.position.z=THREE.MathUtils.lerp(dragon.position.z,15,Math.min(1,dt*9));
if(gasHolding&&!input.isDown(ACTIONS.GAS)&&(activeMouseButtons&2)===0)cancelGasHold();
isBoosting=gasHolding&&dragonStun<=0&&active&&!paused;
if(isBoosting){
 dragonLeavingRoof=true;
 gasPose=Math.max(gasPose,.45);
 if(Math.random()<dt*32){
  const boostDirX=move!==0?move:facing;
  const rear=dragon.position.clone().add(new THREE.Vector3(-boostDirX*1.3,-.35,0));
  const m=new THREE.Sprite(new THREE.SpriteMaterial({map:visualBank.images.smoke,color:0x78e058,transparent:true,opacity:.52,depthWrite:false}));
  m.scale.setScalar(.85+Math.random()*.5);
  m.position.copy(rear).add(new THREE.Vector3((Math.random()-.5)*.5,(Math.random()-.5)*.5,(Math.random()-.5)*.5));
  scene.add(m);
  gasClouds.push({mesh:m,life:1.1+Math.random()*.6,v:new THREE.Vector3(-boostDirX*(8+Math.random()*6),-2-Math.random()*2,(Math.random()-.5)*2),age:0});
 }
}
if(dragonLeavingRoof&&dragonStun<=0){
 if(move!==0){
  const maxHorizSpeed=isBoosting?38.0:22.0;
  const targetVelX=move*maxHorizSpeed;
  const accelRate=(move*dragonVelX<0)?140.0:(isBoosting?150.0:120.0);
  const diff=targetVelX-dragonVelX;
  dragonVelX+=Math.sign(diff)*Math.min(Math.abs(diff),accelRate*dt);
 }else{
  const dragX=dragon.position.y>280?1.35:3.6;
  dragonVelX*=Math.exp(-dragX*dt);
  if(Math.abs(dragonVelX)<0.06)dragonVelX=0;
 }
 if(rise<0){
  const diveTargetSpeed=isBoosting?-36.0:-28.0;
  const diveAccel=95.0;
  const diffY=diveTargetSpeed-dragonVelY;
  dragonVelY+=Math.sign(diffY)*Math.min(Math.abs(diffY),diveAccel*dt);
  diveEnergy=Math.min(24.0,diveEnergy+dt*15.0);
 }else if(rise>0){
  const zoomBoost=diveEnergy*0.85;
  diveEnergy=Math.max(0,diveEnergy-dt*20.0);
  const climbBaseSpeed=isBoosting?28.0:(dragon.position.y>60?17.5:19.5);
  const targetVelY=climbBaseSpeed+zoomBoost;
  const climbAccel=110.0;
  const diffY=targetVelY-dragonVelY;
  dragonVelY+=Math.sign(diffY)*Math.min(Math.abs(diffY),climbAccel*dt);
 }else{
  const dragY=dragon.position.y>280?1.6:4.6;
  dragonVelY*=Math.exp(-dragY*dt);
  if(Math.abs(dragonVelY)<0.06)dragonVelY=0;
  diveEnergy=Math.max(0,diveEnergy-dt*8.0);
 }
dragon.position.x=THREE.MathUtils.clamp(dragon.position.x+dragonVelX*dt,-DRAGON_BOUND_X,DRAGON_BOUND_X);
 if(Math.abs(dragon.position.x)>=DRAGON_BOUND_X)dragonVelX=0;
 if(rise>0&&dragon.position.y<=2.25){
  dragonVelY=Math.max(dragonVelY,17.5);
  if(elapsed-lastWingFlapTime>0.45){
   lastWingFlapTime=elapsed;
   sound('dragonFlap',{x:dragon.position.x});
   if(performanceLab.isEnabled('particles')){
    for(let k=0;k<8;k++){
     const ang=k*Math.PI*0.25;
     trailSmokePool.add(new THREE.Vector3(dragon.position.x+Math.cos(ang)*2.2,0.4,dragon.position.z+Math.sin(ang)*1.2),1.8);
    }
   }
  }
 }
 dragon.position.y=THREE.MathUtils.clamp(dragon.position.y+dragonVelY*dt,1.35,flightCeiling);if(orbitalTheater?.group){orbitalTheater.group.visible=(dragon.position.y>60||wave>=15);}
 if(dragon.position.y>=flightCeiling||dragon.position.y<=1.35){dragonVelY=0;diveEnergy=0;}
 const roofY=schoolBounds.max.y+2.4;
 const isOverRoof=Math.abs(dragon.position.x)<7.5&&Math.abs(dragon.position.z-(schoolBounds.max.z-1.8))<4.5;
 if(isOverRoof&&Math.abs(dragon.position.y-roofY)<1.1&&dragonVelY<=0&&rise<0&&Math.abs(dragonVelX)<4.0){
  perchDragon(true);
  sound('impact',{x:dragon.position.x});
  message('PAULO ROOSTS ON TECH FREIRE ROOF — BLOCK CHARGING');
 }
}else if(dragonStun>0){
 dragonVelX*=Math.exp(-5.0*dt);
 dragonVelY=Math.max(-18.0,dragonVelY-22.0*dt);
 dragon.position.x=THREE.MathUtils.clamp(dragon.position.x+dragonVelX*dt,-DRAGON_BOUND_X,DRAGON_BOUND_X);
 dragon.position.y=THREE.MathUtils.clamp(dragon.position.y+dragonVelY*dt,1.3,flightCeiling);
}
if(dragonVelX>1.2&&facing!==1){facing=1;turnTime=.28;}
else if(dragonVelX<-1.2&&facing!==-1){facing=-1;turnTime=.28;}
turnTime=Math.max(0,turnTime-dt);
const turning=turnTime>0?Math.sin(Math.PI*(turnTime/.28)):0;
const BASE_DRAGON_SCALE=1.10; // 10% larger dragon as requested
dragon.scale.x=THREE.MathUtils.lerp(dragon.scale.x,facing*BASE_DRAGON_SCALE,Math.min(1,dt*17));
dragon.scale.y=THREE.MathUtils.lerp(dragon.scale.y,BASE_DRAGON_SCALE,Math.min(1,dt*8));
dragon.scale.z=BASE_DRAGON_SCALE;
const targetRoll=-dragonVelX*0.022-move*0.16;
flightRoll=THREE.MathUtils.lerp(flightRoll,targetRoll,Math.min(1,dt*8.5));
const atBoardEdge=Math.abs(dragon.position.x)>=DRAGON_BOUND_X-22;
const isStaticFlight=dragonLeavingRoof&&Math.abs(move)<0.1&&Math.abs(rise)<0.1&&Math.abs(dragonVelX)<1.2&&Math.abs(dragonVelY)<1.2;
const shouldRearUp=atBoardEdge||isStaticFlight||!dragonLeavingRoof;
rearUpBlend=THREE.MathUtils.lerp(rearUpBlend,shouldRearUp?1.0:0.0,Math.min(1,dt*5.0));

const targetElevationPitch=(dragonVelY*0.025)*facing+(turning*0.34);
// Rearing up into standing hover: body pitches upward ~68 degrees
const uprightPitch=Math.PI*0.38*(facing||1);
const blendedPitch=THREE.MathUtils.lerp(targetElevationPitch,uprightPitch,rearUpBlend);
flightPitch=THREE.MathUtils.lerp(flightPitch,blendedPitch,Math.min(1,dt*9.0));

const isResting=(!dragonLeavingRoof||isStaticFlight||(Math.abs(dragonVelX)<1.2&&Math.abs(move)<0.1&&Math.abs(dragonVelY)<1.5));
restBlend=THREE.MathUtils.lerp(restBlend,isResting?1.0:0.0,Math.min(1,dt*4.5));
const flightYawDynamic=Math.sin(elapsed*2.2)*0.08+(dragonVelX*0.012)+(turning*0.55*facing);
// When resting/hovering or standing up, face towards the camera (towards +Z); smoothly transition to profile flight when moving
const cameraFacingYaw=(facing>0?1:-1)*1.52;
const targetYaw=THREE.MathUtils.lerp(flightYawDynamic,cameraFacingYaw+Math.sin(elapsed*1.5)*0.06,Math.max(restBlend,rearUpBlend));
flightYaw=THREE.MathUtils.lerp(flightYaw,targetYaw,Math.min(1,dt*8.0));
gasPose=Math.max(0,gasPose-dt);recoveryLift=Math.max(0,recoveryLift-dt);
const shocked=dragonStun>0||helicopters.some(h=>h.role==='ice'&&h.contactTime>.01);
if(dragonLeavingRoof){
 dragon.rotation.x=shocked?Math.sin(elapsed*24)*.24:flightRoll+(gasPose>0?-.22:0)+(gustTime>0?.15:0);
 dragon.rotation.y=flightYaw;
 dragon.rotation.z=flightPitch+(shocked?Math.sin(elapsed*17)*.23:(dragonStun>0?Math.sin(elapsed*35)*.14:Math.sin(elapsed*3.5)*.03));
}else{
 // Initial static state at game start: facing towards the camera in standing stance
 dragon.rotation.x=0;
 dragon.rotation.y=cameraFacingYaw;
 dragon.rotation.z=Math.PI*0.18*(facing||1);
}
dragon.children.forEach((part,i)=>{
 if(i>=17&&i<=23){
  const tailIdx=i-17;
  const tailLag=(tailIdx+1)*0.18;
  part.rotation.z=0.23+Math.sin(elapsed*4.5-tailLag)*0.12*(tailIdx/6)+(dragonVelY*0.008);
  part.rotation.y=Math.cos(elapsed*4.0-tailLag)*0.14*(tailIdx/6)-(dragonVelX*0.010);
 }else if(i<3){
  part.rotation.z=Math.sin(elapsed*6+i)*.04;
 }
});
if(recoveryLift>0&&dragonStun<=0){
 const recoverProgress=1-recoveryLift/2.5;
 const risePhase=Math.max(0,(recoverProgress-.30)/.70);
 dragon.position.y=Math.max(dragon.position.y,1.7+risePhase*4.3);
 dragon.rotation.x+=recoverProgress<.30?-.27*(1-recoverProgress/.30):.12*(1-risePhase);
 dragon.scale.y=1-Math.sin(Math.min(1,recoverProgress/.28)*Math.PI)*.12;
}else dragon.scale.y=THREE.MathUtils.lerp(dragon.scale.y,1,Math.min(1,dt*8));
for(let k=0;k<shockArcs.length;k++){const arc=shockArcs[k];arc.visible=shocked&&(Math.sin(elapsed*33+k*4)>-.25);if(arc.visible){const a=k*2.4+elapsed*14;arc.position.set(Math.cos(a)*1.4,Math.sin(a)*1.2,Math.sin(a*2)*.65);arc.rotation.set(a,a*.6,a*1.7);}}
const isDiving=dragonVelY<-7.0;
const isClimbing=dragonVelY>5.0;
if(isClimbing&&dragonVelY>12.0&&(elapsed-lastWingFlapTime>0.65)){
 lastWingFlapTime=elapsed;
 sound('dragonFlap',{x:dragon.position.x});
}
if(isDiving&&dragonVelY<-18.0&&(elapsed-lastDiveWhooshTime>0.75)){
 lastDiveWhooshTime=elapsed;
 sound('diveWhoosh',{x:dragon.position.x});
}
if(dragonVelY<-24.0&&!diveSonicBoomTriggered){
 diveSonicBoomTriggered=true;
 sound('sonicBoom',{x:dragon.position.x});
 shake=Math.max(shake,0.28);
 if(performanceLab.isEnabled('particles')){
  for(let k=0;k<14;k++){
   const ang=k*Math.PI*2/14;
   trailSmokePool.add(new THREE.Vector3(dragon.position.x+Math.cos(ang)*3.0,dragon.position.y+0.6,dragon.position.z+Math.sin(ang)*1.5),0.48);
  }
 }
}else if(dragonVelY>=-14.0){
 diveSonicBoomTriggered=false;
}
const isCoasting=Math.abs(move)===0&&Math.abs(dragonVelX)>3.5;
const isSoaring=isBoosting||isCoasting;
const flapFreq=recoveryLift>0?20:(isClimbing?7.5:(isDiving?2.2:(isSoaring?3.4:5.2)));
const flapAmp=isDiving?0.08:(isSoaring?0.16:(isClimbing?0.42:0.32));
const soarDihedral=isDiving?0.26:(isSoaring?-0.18:0);
const isOnPavement=dragonLeavingRoof&&dragon.position.y<=2.25;
if(isOnPavement){
 const trotCycle=elapsed*11.0+Math.abs(dragon.position.x)*1.8;
 for(const w of wings){
  w.pivot.rotation.x=w.sign*0.10;
  w.pivot.rotation.z=w.sign*0.68;
 }
 if(pauloPreviewRig){
  const moving=Math.abs(dragonVelX)>1.0;
  pauloPreviewRig.legs.forEach(({hip,knee,foot,fore,side})=>{
   const legSign=(fore?1:-1)*(side==='left'?1:-1);
   const swing=moving?Math.sin(trotCycle*legSign):0;
   hip.rotation.z=-0.50+swing*0.42;
   knee.rotation.z=0.45+Math.max(0,-swing)*0.50;
   foot.rotation.z=-0.22-swing*0.30;
  });
 }
 if(Math.abs(dragonVelX)>1.8&&Math.sin(trotCycle)>0.88){
  sound('dragonStep',{x:dragon.position.x});
  emitTrail(new THREE.Vector3(dragon.position.x,0.45,dragon.position.z),false);
 }
 if(Math.abs(dragonVelX)>10.0&&Math.random()<dt*18){
  emitImpact(dragon.position.x+(facing||1)*1.8,0.5,dragon.position.z,14,0.3);
 }
 for(const c of cars){
  if(c.life>0&&Math.abs(c.root.position.x-dragon.position.x)<4.8&&Math.abs(c.root.position.z-dragon.position.z)<3.8){
   const pushDir=Math.sign(c.root.position.x-dragon.position.x)||1;
   // Shift car into adjacent roadway lane or curb shoulder (different Z plane) so it immediately clears Paulo's path with zero stutter!
   const planeShift=(c.root.position.z>=dragon.position.z?1:-1)*(6.0+Math.random()*2.0);
   c.root.position.z+=planeShift;
   c.laneZ=c.root.position.z;
   c.root.position.x+=pushDir*2.8;
   c.root.rotation.z+=pushDir*0.22;
   c.root.rotation.y+=(Math.random()-.5)*0.35;
   c.speed*=0.4;
   sound('carCrunch',{x:c.root.position.x});
   shake=Math.max(shake,0.22);
   flashAt(c.root.position.x,1.2,c.root.position.z,1.8);
  }else if(c.life>0&&Math.abs(c.root.position.x-dragon.position.x)<14.0&&Math.abs(c.root.position.z-dragon.position.z)<4.0){
   c.braking=true;
   c.speed=Math.max(0,c.speed-dt*18.0);
  }
 }
 panicCrowdAt(dragon.position.x,dragon.position.z,24);
}else{
 for(const w of wings){
  w.pivot.rotation.x=w.sign*(Math.sin(elapsed*flapFreq)*flapAmp+soarDihedral+(shocked?Math.sin(elapsed*25)*.35:0)+turning*.28+(gasPose>0?-.22:0));
  w.pivot.rotation.z=isDiving?(w.sign*0.42):(w.sign*(0.05+Math.cos(elapsed*flapFreq)*0.08));
 }
 if(pauloPreviewRig){
  const rearFactor=Math.max(restBlend,rearUpBlend);
  pauloPreviewRig.legs.forEach(({hip,knee,foot,fore})=>{
   if(fore){
    hip.rotation.z=THREE.MathUtils.lerp(-0.25,0.45,rearFactor);
    knee.rotation.z=THREE.MathUtils.lerp(0.35,0.75,rearFactor);
    foot.rotation.z=THREE.MathUtils.lerp(-0.15,-0.35,rearFactor);
   }else{
    hip.rotation.z=THREE.MathUtils.lerp(-0.15,-0.75,rearFactor);
    knee.rotation.z=THREE.MathUtils.lerp(0.25,0.15,rearFactor);
    foot.rotation.z=THREE.MathUtils.lerp(-0.10,0.30,rearFactor);
   }
  });
 }
}
const isHighSpeed=isDiving||isSoaring||Math.abs(dragonVelX)>15.0;
if(isHighSpeed&&quality.allowTrail(trailParticles.length)&&Math.random()<dt*36){
 for(const sign of [-1,1]){
  const tipY=isDiving?-0.32:Math.sin(elapsed*flapFreq)*0.6;
  const tipPos=dragon.position.clone().add(new THREE.Vector3(-facing*1.5,tipY,sign*3.6));
  emitTrail(tipPos,true);
 }
}
const altExosphere=Math.max(0,(dragon.position.y-190)/178);
if(altExosphere>0&&quality.allowTrail(trailParticles.length)&&Math.random()<dt*(18+altExosphere*36)){
 const wingSign=Math.random()<.5?1:-1;
 const ionPos=new THREE.Vector3(
  dragon.position.x+(facing||1)*1.9+(Math.random()-.5)*.7,
  dragon.position.y+(Math.random()-.5)*.5,
  dragon.position.z+wingSign*(1.4+Math.random()*2.4)
 );
 trailEmberPool.add(ionPos,.45+altExosphere*.65);
}
if(dragon.position.y<7.5&&dragonVelY<-2.0){
 dragonVelY*=Math.exp(-8.0*dt);
}
if(elapsed<blueFireballUntil&&Math.random()<dt*18){
 flashAt(dragon.position.x+(Math.random()-.5)*1.8,dragon.position.y+(Math.random()-.5)*1.2,dragon.position.z+(Math.random()-.5)*1.6,.48);
}
pauloPoseDriver?.update(dt,{
 stunned:dragonStun>0,recovering:recoveryLift>0,windGust:gustTime>0,
 gasAttack:gasPose>0,windCharging:holdStart>0&&windCooldown<=0,
 fireAttack:elapsed<pauloFirePoseUntil,
 turning:turnTime>0,moving:Math.abs(dragonVelX)>1.5,rising:Math.abs(dragonVelY)>2.0,
 gliding:isSoaring||isDiving,
 perched:!dragonLeavingRoof,horizontal:move||Math.sign(dragonVelX),facing
});
if(!dragonLeavingRoof&&pauloPreviewRig&&!isOnPavement){
 pauloPreviewRig.legs.forEach(({hip,knee,foot,fore})=>{
  hip.rotation.z=fore?-.78:-.38;knee.rotation.z=fore?-.42:.58;foot.rotation.z=fore?.35:-.20;
 });
}
if(!dragonLeavingRoof&&dragonStun<=0){
 blockCharge=Math.min(100,blockCharge+dt*9.5);
 updateBlockButton();
}
// Wind samples the finished movement and head pose, not the previous frame.
updateDragonWind(dt);
updateExplosionLights(dt);
const isFiring=elapsed<pauloFirePoseUntil||shots.some(s=>!s.hostile);
const leadingShot=shots.find(s=>!s.hostile&&s.life>0);
if(isFiring){
 const mouth=getBreathMouthWorld(new THREE.Vector3());
 if(leadingShot){
  dragonFireLight.position.copy(leadingShot.mesh.position);
  dragonFireLight.distance=24;
  dragonFireLight.intensity=2.4+Math.sin(elapsed*30)*0.5;
 }else{
  dragonFireLight.position.copy(mouth);
  dragonFireLight.distance=18;
  dragonFireLight.intensity=1.8+Math.sin(elapsed*45)*0.3;
 }
}else if(gustTime>0){
 dragonFireLight.position.copy(gustOrigin);
 dragonFireLight.distance=16;
 dragonFireLight.intensity=1.2;
}else{
 dragonFireLight.intensity=Math.max(0,dragonFireLight.intensity-dt*16);
}
if(wave===15)finalSquadron.update(dt,dragon,()=>hurtDragon('FIGHTER MISSILE'));
 if(!settling)updateWaveProgress(dt);
const shotPrevious=shotScratchPrevious;const path=shotScratchPath;const closest=shotScratchClosest;
for(let i=shots.length-1;i>=0;i--){const s=shots[i];shotPrevious.copy(s.mesh.position);s.mesh.position.addScaledVector(s.vel,dt);s.life-=dt;if(wave===15&&!s.hostile&&finalSquadron.intercept(s.mesh.position,1.7,pos=>groundFireball(pos.x,pos.y,pos.z,1.4))){s.life=0;score+=75;}
 if(s.isStream||s.mega){
  const progress=Math.max(0,1-(s.life/(s.maxLife||1)));
  const expand=1.0+progress*(s.mega?3.8:2.6);
  s.mesh.scale.setScalar(s.baseSize*expand);
 }
 s.mesh.rotation.z+=dt*(s.isStream?6.5:4.5);
 s.mesh.rotation.x+=dt*3.5;
 if(!s.wet&&performanceLab.isEnabled('particles')){
  const emberScale=s.mega?1.85:(s.blue?1.4:(s.isStream?1.2:.95));
  trailEmberPool.add(s.mesh.position,emberScale);
  if(Math.random()<0.40)trailSmokePool.add(s.mesh.position,emberScale*1.15);
 }
 if(!s.hostile&&orbitalTheater){
  for(const sat of (orbitalTheater.satellites||[])){
   if(!sat.destroyed&&s.mesh.position.distanceTo(sat.root.position)<(s.mega?11.5:9.0)){
    orbitalTheater.hitSatellite(sat,s.mega?60:10,s.mega);
    s.life=0;break;
   }
  }
 }
 if((s.isStream||s.mega)&&!s.hostile){
  for(const c of cars){
   if(c.life>0&&s.mesh.position.distanceTo(c.root.position)<6.0)ignite(c.root.position.x,1,c.root.position.z);
  }
  for(const h of helicopters){
   if(!h.crashing&&s.mesh.position.distanceTo(h.root.position)<7.0){crashHelicopter(h);if(!s.mega)s.life=0;}
  }
  if(Math.random()<0.35){
   for(const b of neighborhood.targetBuildings){
    if(Math.abs(s.mesh.position.x-b.x)<b.w*0.5+3.0&&Math.abs(s.mesh.position.z-b.z)<b.d*0.5+3.0&&s.mesh.position.y<b.h+5){
     ignite(s.mesh.position.x,Math.min(b.h,Math.max(1.5,s.mesh.position.y)),b.front+0.5);
     break;
    }
   }
  }
 }
 if(!s.hostile&&!s.fireTarget&&s.life>0){
  projectDefensePoint(shotPrevious,camera.position,defensePrevious);
  projectDefensePoint(s.mesh.position,camera.position,defenseCurrent);
  path.copy(defenseCurrent).sub(defensePrevious);
  const travelSq=path.lengthSq();let hitIndex=-1,hitT=Infinity;
  for(let mi=0;mi<meteors.length;mi++){
   const m=meteors[mi];
   if(m.testMeteor)continue;
   const depthScale=projectDefensePoint(m.mesh.position,camera.position,defenseMeteor);
   const radius=(m.size*1.1+.95)*depthScale;
   shotScratchDelta.copy(defensePrevious).sub(defenseMeteor);
   const c=shotScratchDelta.lengthSq()-radius*radius;
   let t=0;
   if(c>0){
    if(travelSq<1e-10)continue;
    const halfB=shotScratchDelta.dot(path),disc=halfB*halfB-travelSq*c;
    if(disc<0)continue;
    t=(-halfB-Math.sqrt(disc))/travelSq;
    if(t<0||t>1)continue;
   }
   if(t<hitT){hitT=t;hitIndex=mi;}
  }
  if(hitIndex>=0){
   const m=meteors[hitIndex];
   const dmgMult=s.damageMult||1.0;
   m.hp-=fireballMeteorDamage(m)*dmgMult;
   m.hitFlash=0.12;
   if(m.baseScale)m.mesh.scale.copy(m.baseScale).multiplyScalar(1.08);
   if(s.mega){
    flashAt(m.mesh.position.x,m.mesh.position.y,m.mesh.position.z,4.8);
    cinematicFX.shock(m.mesh.position,8.5);
    m.hp=0;
    message('⚡ MEGA FIRE BREATH DISINTEGRATED METEOR!');
   }else if(s.isStream){
    if(m.size<2.0){m.hp=0;}else{m.hp-=4.5;if(m.hp<=0)fragmentMeteor(m);}
    sound('fire');
   }
   if(s.blue){
    flashAt(m.mesh.position.x,m.mesh.position.y,m.mesh.position.z,2.8);
    cinematicFX.shock(m.mesh.position,4.2);
   }
   emitImpact(m.mesh.position.x,m.mesh.position.y,m.mesh.position.z,s.blue?55:(s.mega?75:35),.4);
   emitMeteorShrapnel(m.mesh.position,Math.min(3,m.size));
   checkBossFracture(m);
   if(m.hp>0){
    sound('meteorHit',{x:m.mesh.position.x});
    flashAt(m.mesh.position.x,m.mesh.position.y,m.mesh.position.z,Math.max(1.6,m.size*0.75));
   }else if(m.hp<=0){
    if(m.isPowerup==='purple_ram'){
     purpleRamUntil=elapsed+10.0;
     sound('bonus');
     message('💜 METEOR-BUSTER ACTIVE (10s) — FLY DIRECTLY INTO METEORS TO OBLITERATE THEM!');
    }
    fragmentMeteor(m);registerIntercept(m);score+=m.isMassive?500:(100+wave*10);sound('intercept',{x:m.mesh.position.x});
    if(m.isMassive){
     message('💥 MASSIVE METEOR SHATTERED INTO LARGE CHUNKS! +500 PTS');
     sound('dragonRoar',{variant:'challenge'});
     cinematicFX.shock(m.mesh.position,9.0);
    }
    if(!m.boss&&!m.fragment)blast(m.mesh.position.x,m.mesh.position.y,m.mesh.position.z,Math.min(5.5,Math.max(3.2,1.2*m.size)),true);
    remove(meteors,hitIndex);updateHud();
   }
   s.life=0;
  }
 }if(s.mesh.position.distanceTo(s.target)<1.2||s.life<=0){if(s.fireTarget&&schoolFire.includes(s.fireTarget)&&s.mesh.position.distanceTo(s.target)<1.2){s.fireTarget.suppression+=.045;if(s.fireTarget.suppression>=1){fireGroup.remove(s.fireTarget.root);schoolFire.splice(schoolFire.indexOf(s.fireTarget),1);}}
 if(s.hostile){if(s.mesh.position.distanceTo(dragon.position)<3.2){if(s.water){waterDisable=3.0;message('SOAKED BY WATER — BREATH STEAMING / 50% DAMAGE');}else if(s.iceHelicopter)iceHit('ICE ELECTRICAL BEAM',true);else if(s.iceGround)iceHit('ICE GROUND PROJECTILE');else hurtDragon('POLICE FIRE');}}else if(!s.fireTarget){blast(s.mesh.position.x,s.mesh.position.y,s.mesh.position.z,s.blue?6.5:4,true);emitImpact(s.mesh.position.x,s.mesh.position.y,s.mesh.position.z,s.blue?64:42,.45);}remove(shots,i)}}
const meteorColNormal=new THREE.Vector3(),meteorColRelVel=new THREE.Vector3();
for(let i=meteors.length-1;i>=0;i--){const m=meteors[i];if(m.fragmentGrace>0)m.fragmentGrace=Math.max(0,m.fragmentGrace-dt);
if(m.hitFlash>0){
 m.hitFlash=Math.max(0,m.hitFlash-dt);
 if(m.baseScale){
  const bump=1.0+Math.sin((m.hitFlash/0.12)*Math.PI)*0.10;
  m.mesh.scale.copy(m.baseScale).multiplyScalar(bump);
 }
}
if(m.grounded){
 m.ttl-=dt;m.mesh.rotation.y+=dt*.25;
 if(m.mesh.material===moltenMaterial&&m.ttl<10)m.mesh.material=mats.stone;
 if(m.ttl<=0){settleMeteorAsPermanentSlag(m);meteors.splice(i,1);}
 continue;
}
 // Inter-meteor pairwise mid-air collisions & mutual destruction
 for(let j=i-1;j>=0;j--){
  const m2=meteors[j];
  if(m2.grounded||m2.hp<=0||m.fragmentGrace>0||m2.fragmentGrace>0)continue;
  const minDist=(m.size+m2.size)*0.85;
  const distSq=m.mesh.position.distanceToSquared(m2.mesh.position);
  if(distSq<minDist*minDist){
   const dist=Math.sqrt(distSq);
   meteorColNormal.copy(m.mesh.position).sub(m2.mesh.position).normalize();
   if(dist<0.001)meteorColNormal.set(0,1,0);
   meteorColRelVel.copy(m.vel).sub(m2.vel);
   const impulse=Math.max(2.8,meteorColRelVel.dot(meteorColNormal));
   m.vel.addScaledVector(meteorColNormal,impulse*0.48);
   m2.vel.addScaledVector(meteorColNormal,-impulse*0.48);
   const colDmg=Math.max(1,Math.round((m.size+m2.size)*0.65));
   m.hp-=colDmg;
   m2.hp-=colDmg;
   sound('meteorCollision',{x:m.mesh.position.x});
   flashAt((m.mesh.position.x+m2.mesh.position.x)*0.5,(m.mesh.position.y+m2.mesh.position.y)*0.5,(m.mesh.position.z+m2.mesh.position.z)*0.5,2.4);
   emitMeteorShrapnel(m.mesh.position,Math.min(2.5,m.size));
   if(m2.hp<=0){
    if(m2.isPowerup==='purple_ram'){purpleRamUntil=elapsed+10.0;sound('bonus');sound('dragonRoar',{variant:'challenge',x:dragon.position.x});message('💜 METEOR-BUSTER ACTIVE (10s)!');}
    blast(m2.mesh.position.x,m2.mesh.position.y,m2.mesh.position.z,m2.size*1.8,false);
    emitMeteorShrapnel(m2.mesh.position,Math.min(3.5,m2.size));
    remove(meteors,j);
    if(j<i)i--;
   }
   if(m.hp<=0){
    if(m.isPowerup==='purple_ram'){purpleRamUntil=elapsed+10.0;sound('bonus');message('💜 METEOR-BUSTER ACTIVE (10s)!');}
    blast(m.mesh.position.x,m.mesh.position.y,m.mesh.position.z,m.size*1.8,false);
    emitMeteorShrapnel(m.mesh.position,Math.min(3.5,m.size));
    remove(meteors,i);
    break;
   }
  }
 }
 if(m.hp<=0)continue;

 // Purple Meteor-Buster Ram vs Meteors & Satellites & Full-Speed Flight Meteor Buster
 const distToDragon=m.mesh.position.distanceTo(dragon.position);
 if(dragonEnabled&&!m.testMeteor&&!m.grounded&&distToDragon<(m.size*0.85+2.8)){
  if(elapsed<purpleRamUntil){
   purpleShieldImpact=1.0;
   sound('purpleRamHit',{x:m.mesh.position.x});
   flashAt(m.mesh.position.x,m.mesh.position.y,m.mesh.position.z,4.5);
   cinematicFX.shock(m.mesh.position,8.0);
   score+=350;sessionStats.intercepts++;
   message('💥 METEOR-BUSTER IMPACT! METEOR OBLITERATED +350 PTS');
   emitMeteorShrapnel(m.mesh.position,Math.min(4,m.size*1.6));
   blast(m.mesh.position.x,m.mesh.position.y,m.mesh.position.z,Math.max(4.0,m.size*2.2),true);
   if(m.isPowerup==='purple_ram')purpleRamUntil=elapsed+10.0;
   fragmentMeteor(m);
   remove(meteors,i);updateHud();continue;
  }else{
   const dragonSpeed=Math.hypot(dragonVelX,dragonVelY);
   const isFullSpeedFlight=isBoosting||isDiving||Math.abs(dragonVelX)>13.5||dragonSpeed>15.0;
   if(isFullSpeedFlight||elapsed<purpleRamUntil){
    sound('impact',{x:dragon.position.x});
    sound('dragonRoar',{variant:'growl',x:dragon.position.x});
    flashAt(m.mesh.position.x,m.mesh.position.y,m.mesh.position.z,5.0);
    cinematicFX.shock(m.mesh.position,8.5);
    score+=m.isMassive?500:250;
    message(m.isMassive?'💥 SUPERSONIC BUSTER SHATTERS MASSIVE METEOR! +500 PTS':'💥 SUPERSONIC BUSTER! PAULO CRUSHES METEOR +250 PTS');
    busterRamCollided=true;
    emitMeteorShrapnel(m.mesh.position,Math.min(6,m.size*1.8));
    blast(m.mesh.position.x,m.mesh.position.y,m.mesh.position.z,Math.max(4.2,m.size*2.4),true);
    // Physical speed hitch on collision
    dragonVelX*=0.62;
    dragonVelY*=0.65;
    shake=Math.max(shake,0.38);
    registerIntercept(m);
    fragmentMeteor(m);
    remove(meteors,i);
    updateHud();
    continue;
   }
  }
 }
 if(elapsed<purpleRamUntil&&orbitalTheater&&dragon.position.y>280){
  for(const sat of (orbitalTheater.satellites||[])){
   if(!sat.destroyed&&dragon.position.distanceTo(sat.root.position)<10.5){
    orbitalTheater.hitSatellite(sat,100,true);
    purpleShieldImpact=1.0;
    sound('purpleRamHit',{x:sat.root.position.x});
    flashAt(sat.root.position.x,sat.root.position.y,sat.root.position.z,5.0);
    cinematicFX.shock(sat.root.position,9.0);
    score+=1000;
    message('💜 PURPLE RAM CRUSHES ELON’S SATELLITE! +1,000 PTS');
   }
  }
 }
 if(m.fragment){m.fragmentAge+=dt;m.ttl-=dt;m.vel.y-=1.25*dt;
  m.vel.x*=Math.max(.0,1-.10*dt);m.vel.z*=Math.max(.0,1-.10*dt);
  if(m.ttl<=0){remove(meteors,i);continue;}}
 if(orbitalTheater&&m.mesh.position.y>290&&m.mesh.position.y<370){
  for(const sat of (orbitalTheater.satellites||[])){
   if(!sat.destroyed&&m.mesh.position.distanceTo(sat.root.position)<10.5){
    orbitalTheater.triggerShieldDeflection(sat);
    const pushDir=m.mesh.position.x>=sat.root.position.x?1:-1;
    m.vel.x=pushDir*(14+Math.random()*8);
    m.vel.y=-Math.max(16,Math.abs(m.vel.y)*1.15);
    emitMeteorShrapnel(m.mesh.position,Math.min(2.5,m.size));
    break;
   }
  }
 }
 if(m.isPowerup){
  const c=m.mesh.getObjectByName('threat-corona');
  if(c){
   const pulseRate=m.isPowerup==='mega_fire_breath'?14:(m.isPowerup==='purple_ram'?12:9);
   const baseScale=m.isPowerup==='mega_fire_breath'?5.0:(m.isPowerup==='purple_ram'?4.6:(m.isPowerup==='fire_stream'?4.2:3.4));
   c.scale.setScalar(m.size*(baseScale+Math.sin(elapsed*pulseRate)*.7));
  }
  if(performanceLab.isEnabled('particles')){
   if(m.isPowerup==='fire_stream'){
    trailEmberPool.add(m.mesh.position,.65);
    if(Math.random()<.25)flashAt(m.mesh.position.x+(Math.random()-.5)*1.2,m.mesh.position.y+(Math.random()-.5)*1.2,m.mesh.position.z,.55);
   }else if(m.isPowerup==='mega_fire_breath'){
    trailEmberPool.add(m.mesh.position.clone().add(new THREE.Vector3((Math.random()-.5)*2.2,(Math.random()-.5)*2.2,(Math.random()-.5)*2.2)),1.5);
    if(Math.random()<0.65)flashAt(m.mesh.position.x+(Math.random()-.5)*2.4,m.mesh.position.y+(Math.random()-.5)*2.4,m.mesh.position.z,1.8);
   }else if(m.isPowerup==='purple_ram'){
    trailEmberPool.add(m.mesh.position,.85);
    if(Math.random()<.30)flashAt(m.mesh.position.x+(Math.random()-.5)*1.5,m.mesh.position.y+(Math.random()-.5)*1.5,m.mesh.position.z,1.0);
   }
  }
 }
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
  powerGrid.checkMeteorInterception(m.mesh.position,m.size,flashAt,sound);
  if(m.mesh.position.y>115&&m.vel.y>2.0&&!m.boss){
   score+=250;sessionStats.intercepts++;sound('bonus');
   cinematicFX.shock(m.mesh.position,6.0);
   flashAt(m.mesh.position.x,m.mesh.position.y,m.mesh.position.z,3.0);
   message('🚀 METEOR BLOWN BACK INTO SPACE! +250 PTS');
   remove(meteors,i);updateHud();continue;
  }
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
  const inStratosphere=m.mesh.position.y>58;
  m.mesh.rotation.x+=dt*2;m.mesh.rotation.y+=dt*1.5;
  const corona=m.mesh.getObjectByName('threat-corona');
  if(corona){
   const targetScale=m.size*(inStratosphere?4.0:2.6);
   corona.scale.setScalar(THREE.MathUtils.lerp(corona.scale.x,targetScale,Math.min(1,dt*6)));
  }
  if(m.burning||inStratosphere||m.isMassive){
   const burnScale=inStratosphere?Math.max(m.size*1.15,1.8):m.size*.65;
   cinematicFX.fire(m.mesh.position,elapsed,burnScale,0,'meteor');
   if(performanceLab.isEnabled('particles')&&Math.random()<0.65){
    trailEmberPool.add(m.mesh.position.clone().add(new THREE.Vector3((Math.random()-.5)*m.size*.8,(Math.random()-.5)*m.size*.8,(Math.random()-.5)*m.size*.8)),Math.max(0.8,m.size*.45));
   }
  }
  m.trail-=dt;
  if(m.trail<=0){
   m.trail=inStratosphere?.025:(m.fastImpact?.035:.09);
   if(quality.allowTrail(trailParticles.length)){
    emitTrail(m.mesh.position,!inStratosphere&&!m.fastImpact&&(!m.burning||Math.random()<.65));
    if(inStratosphere&&Math.random()<.55)emitTrail(m.mesh.position,false);
   }
  }
  if(!m.nearMissTriggered&&!m.grounded&&!m.dragonHunter&&m.vel&&m.vel.y<-2.0){
   const dDist=m.mesh.position.distanceTo(dragon.position);
   if(dDist<4.2&&dDist>1.8&&m.mesh.position.y<dragon.position.y+1.5&&m.mesh.position.y>dragon.position.y-2.5){
    m.nearMissTriggered=true;
    sessionStats.nearMisses++;
    shake=Math.max(shake,.38);
    sound('nearmiss');
    message('CLOSE CALL! METEOR GRAZED PAULO');
   }
  }
  if(m.dragonHunter&&m.mesh.position.distanceTo(dragon.position)<2.6){hurtDragon('FLAMING METEOR');groundFireball(m.mesh.position.x,m.mesh.position.y,m.mesh.position.z,1.2);remove(meteors,i);continue;}
 const openingImpact=m.opening&&traceOpeningMeteorImpact(m,meteorStart);

  // Progressive downward meteor crunching through building structure
  if(m.crunching){
   // The general meteor integrator already advanced this tick.
   const stopY=m.crunchStopY??.6;
   const currY=Math.max(stopY,m.mesh.position.y);
   m.mesh.position.y=currY;
   const b=m.crunchBuilding;
   const sz=m.size||1;

   const isSchool=(b===neighborhood?.school)||!!b?.school;
   const stepDmg=penetrationDamageStep(m.crunchMaxBudget,m.crunchDamageBudget,m.crunchStartY,stopY,meteorStart.y,currY);
   m.crunchDamageBudget=Math.max(0,(m.crunchDamageBudget||0)-stepDmg);
   m.crunchDamageDealt=(m.crunchDamageDealt||0)+stepDmg;

   // Sectional floor-by-floor coring destruction: punch localized holes every ~2.8m of vertical descent
   const punchInterval=2.8;
   const shouldPunchFloor=Math.abs((m.lastPunchY??currY)-currY)>=punchInterval;
   if(shouldPunchFloor){
    m.lastPunchY=currY;
    const punchRad=Math.min(3.8,Math.max(1.4,sz*(m.kind==='iron'?0.42:0.52)));
    if(isSchool){
     carveSchool(m.mesh.position.x,currY,m.mesh.position.z,punchRad,0.38,m.kind,16);
     schoolReconstruction?.punchBorehole?.({
      x:m.mesh.position.x,
      y:currY,
      z:m.mesh.position.z,
      radius:punchRad,
      isHeavyIron:m.kind==='iron',
      isMassive:!!(m.isMassive||sz>=3.8)
     });
    }else if(b){
     northBroadModels.impactBuilding(b.id,m.mesh.position,punchRad,0.38);
    }

    // Physical furniture spillout tumbling out through facade openings onto the street
    const fCount=Math.floor(Math.random()*3)+1;
    for(let f=0;f<fCount;f++){
     const fPos=m.mesh.position.clone().add(new THREE.Vector3((Math.random()-0.5)*2.5,(Math.random()-0.5)*0.8,1.2+Math.random()*1.8));
     const fType=Math.random()<0.35?'wood':(Math.random()<0.65?'furniture':'metal');
     spawnFurnitureDebris(fPos,fType,m.mesh.position);
    }
   }

   if(isSchool){
    if(stepDmg>0){
     schoolDamage=Math.min(1,schoolDamage+stepDmg);
     hp=schoolDamage>=1?0:Math.max(1,Math.round((1-schoolDamage)*100));
     syncStructuralDamage();updateHud();
     if(hp===0){gameOver();break;}
    }
   }else if(b){
    // Physical impacts already update the damage ratio. Reconcile against
    // the original health and cumulative budget instead of charging twice.
    b.damage=Math.max(b.damage||0,Math.min(1.0,m.crunchInitialDamage+m.crunchDamageDealt));
    if(b.damage>=1.0){
     northBroadModels?.collapseBuilding?.(b.id||b.name);
    }
   }

   // Live electrical wire shorts and sparking within collapsing building
   if(Math.random()<dt*12){
    cinematicFX.sparks(m.mesh.position,5,1.1);
    if(Math.random()<0.2)sound('spark',{x:m.mesh.position.x});
   }

   // Shards giving way directly beneath the meteor as it crunches through
   m.crunchShardClock=(m.crunchShardClock??0)-dt;
   const shardCount=m.crunchShardClock<=0?Math.min(4,Math.max(1,Math.round((m.size||1)*1.2))):0;
   if(shardCount)m.crunchShardClock=.10;
   for(let s=0;s<shardCount;s++){
    const shardPos=m.mesh.position.clone().add(new THREE.Vector3(
     (Math.random()-.5)*(m.size||1)*0.7,
     -0.3-Math.random()*0.8,
     (Math.random()-.5)*(m.size||1)*0.7
    ));
    const shardType=s===0?'glass':(Math.random()<0.4?'roof':(Math.random()<0.5?'wood':'concrete'));
    debrisPiece(shardPos,shardType,m.mesh.position);
   }

   // Dust puffs kicking up from pulverized building materials
   if(Math.random()<dt*16){
    cinematicFX.dustBurst(m.mesh.position,Math.max(0.4,(m.size||1)*0.4),{count:3,radial:true});
   }

   // Flaming/molten meteors ignite interior floor fires as they crunch through
   if(m.burning&&Math.random()<dt*8&&schoolFire.length<40){
    ignite(m.mesh.position.x+(Math.random()-.5)*2.0,m.mesh.position.y,m.mesh.position.z+(Math.random()-.5)*1.8);
   }

   // Check if meteor reached its crunch stopping depth
   if(currY<=stopY){
    m.crunching=false;
    m.crunched=true;
    m.mesh.position.y=(m.crunchStopY!==undefined&&m.crunchStopY<0)?m.crunchStopY:Math.max(0.4,m.crunchStopY||0.6);

    // Size-dependent resting or disintegration
    if((m.size||1)>=3.2||m.isMassive||m.kind==='iron'){
     // Big / heavy iron meteors reach basement/foundation: crunch ground pavement into crater & shockwave
     addCrater(m.mesh.position.x,m.mesh.position.z,2.6+(m.size||1)*0.45,{isSubway:(m.size||1)>=3.5,size:m.size||1});
     blast(m.mesh.position.x,m.mesh.position.y,m.mesh.position.z,4.8*(m.size||1));
     cinematicFX.demolitionDustWave(
      m.mesh.position,
      m.mesh.position.clone().add(new THREE.Vector3(0,0,3.5)),
      2.4
     );
     for(let s=0;s<8;s++){
      debrisPiece(m.mesh.position.clone().add(new THREE.Vector3((Math.random()-.5)*2.5,-0.2,(Math.random()-.5)*2.5)),'concrete',m.mesh.position);
     }
     shake=Math.max(shake,0.85);
     sound('impact',{x:m.mesh.position.x});

     // Heavy flaming meteor ignites raging basement fire
     if(m.burning){
      ignite(m.mesh.position.x,Math.max(-0.5,m.mesh.position.y),m.mesh.position.z);
      ignite(m.mesh.position.x+1.5,Math.max(-0.5,m.mesh.position.y),m.mesh.position.z-1.2);
     }

     // Bigger meteors can break up a little bit, or stay as one massive charred core in the basement
     if(Math.random()<0.40){
      const fragPieces=Math.min(6,Math.max(3,Math.round((m.size||1)*1.2)));
      for(let p=0;p<fragPieces;p++){
       const fp=m.mesh.position.clone().add(new THREE.Vector3((Math.random()-.5)*2.5,m.mesh.position.y+0.2,(Math.random()-.5)*2.5));
       preserveRubble({position:fp,scale:0.45+Math.random()*0.55,isFlaming:m.burning});
      }
      remove(meteors,i);
      continue;
     }else{
      m.grounded=true;
      m.ttl=28.0;
      m.vel.set(0,0,0);
     }
    }else{
     // Small or medium meteor remains embedded in roof or middle floor
     sound('thud',{x:m.mesh.position.x});
     cinematicFX.dustBurst(m.mesh.position,1.2,{count:8});
     if(m.burning){
      ignite(m.mesh.position.x,m.mesh.position.y+0.2,m.mesh.position.z);
     }
     shake=Math.max(shake,0.45);
     if(Math.random()<0.65){
      // Stays stuck/embedded in the floor/roof as smoldering rock
      m.grounded=true;
      m.ttl=20.0;
      m.vel.set(0,0,0);
     }else{
      settleMeteorAsPermanentSlag(m);
      remove(meteors,i);
      continue;
     }
    }
   }
   continue;
  }

  // The same continuous collision test handles opening and later waves.
  // A large time step cannot skip a roof or pass through a side facade.
  const collision=!m.opening&&!m.dragonHunter&&m.vel?.y<-.1?
   traceMeteorCollision(meteorStart,m.mesh.position,neighborhood.targetBuildings,schoolBounds,schoolDamage<1):null;
  const sweepHit=collision?new THREE.Vector3(collision.point.x,collision.point.y,collision.point.z):null;
  const hitBuilding=collision?.building??null;
  const hitSchool=collision?.kind==='school';
  if(collision)m.impactOwner=collision;

  // Roof breach triggers progressive crunching through the building
  if(sweepHit&&hitSchool&&elapsed<schoolShieldUntil){groundFireball(sweepHit.x,sweepHit.y,sweepHit.z,m.size);remove(meteors,i);continue;}
  if(sweepHit&&(hitBuilding||hitSchool)&&!m.harmless&&(m.size??1)>=1.35&&!m.dragonHunter&&!m.boss&&!m.opening&&sweepHit.y>1.2){
   m.mesh.position.copy(sweepHit);
   m.crunching=true;
   m.crunchBuilding=hitBuilding||(hitSchool?neighborhood.school:null);
   m.crunchStartY=m.mesh.position.y;
   const sz=m.size||1;
   const maxMeteorDmg=hitSchool
    ? schoolMeteorBudget(sz)
    : (sz>=8.0?1.0:(sz>=4.5?0.85:(sz>=3.0?0.50:(sz>=1.8?0.25:0.10))));
   m.crunchMaxBudget=maxMeteorDmg;
   m.crunchDamageBudget=maxMeteorDmg;
   m.crunchDamageDealt=0;
   m.crunchInitialDamage=hitBuilding?.damage??0;
   m.crunchShardClock=0;
   m.lastPunchY=m.mesh.position.y;
   const roofY=hitBuilding?hitBuilding.h:(hitSchool?schoolBounds.max.y:m.mesh.position.y);
   if(sz<1.8&&!m.isMassive&&m.kind!=='iron'){
    // Small rock meteors embed directly in roof or upper floor deck
    m.crunchStopY=Math.max(1.2,roofY-1.4);
   }else if(sz<3.8&&!m.isMassive&&m.kind!=='iron'){
    // Medium rock meteors penetrate 2-3 floors and get stuck embedded on floor 2 or 1
    m.crunchStopY=Math.max(0.6,roofY-7.5);
   }else{
    // Big / heavy iron / massive / colossal meteors crunch all the way through into basement!
    m.crunchStopY=(hitSchool||(hitBuilding&&hitBuilding.h>10))?-0.8:0.4;
   }
   // Keep penetration within its original building footprint.
   m.crunchStopY=Math.min(m.crunchStopY,m.crunchStartY-.01);
   m.vel.set(0,-16.0,0);
   if(hitBuilding)northBroadModels.impactBuilding(hitBuilding.id,m.mesh.position,Math.max(1.5,sz*1.4),.45);
   cinematicFX.burst(m.mesh.position,Math.max(0.4,sz*0.7));
   sound('impact',{x:m.mesh.position.x});
   emitMeteorShrapnel(m.mesh.position,Math.min(6,sz*2.0));
   shake=Math.max(shake,Math.min(0.75,0.25+sz*0.1));
   if(m.burning)ignite(m.mesh.position.x,m.mesh.position.y-0.4,m.mesh.position.z);
   continue;
  }

  const targetReached=(!m.opening&&!m.dragonHunter&&(
   m.mesh.position.distanceTo(m.target)<Math.max(1.0,m.size*0.75)||
   (m.mesh.position.y<=m.target.y&&Math.hypot(m.mesh.position.x-m.target.x,m.mesh.position.z-m.target.z)<Math.max(4.0,m.size*1.8))||
   m.mesh.position.y<=0.7
  ));

  if(openingImpact||(m.dragonHunter&&m.mesh.position.y<=.8)||sweepHit||targetReached){
   if(sweepHit)m.target.copy(sweepHit);
   if(m.dragonHunter){groundFireball(m.target.x,Math.max(.6,m.target.y),m.target.z,1.5);remove(meteors,i);continue;}
   const heat=openingMoltenHeat(m);
   if(elapsed<schoolShieldUntil&&(m.impactOwner?m.impactOwner.kind==='school':m.target.z<14&&Math.abs(m.target.x)<30&&!neighborhood.activeAt(m.target.x,m.target.z))){groundFireball(m.target.x,m.target.y,m.target.z,m.size);remove(meteors,i);continue;}
   if(m.boss){groundFireball(m.target.x,m.target.y,m.target.z,8);damage(m.target.x,m.target.z,m.target.y,m);remove(meteors,i);continue;}
   groundFireball(m.target.x,m.target.y,m.target.z,m.size*heat);
   cinematicFX.burst(m.target,Math.max(.4,m.size));
   if(impactProfile(m.size,m.kind).penetrates&&m.target.z<13){
    const internal=m.target.clone().add(new THREE.Vector3(0,-1.2,-1.7));
    cinematicFX.burst(internal,Math.max(.4,m.size*.8));
   }
   if(m.burning){
    const count=m.kind==='flaming'?5:3;
    for(let k=0;k<count;k++)ignite(m.target.x+(Math.random()-.5)*m.size*4,Math.max(.4,m.target.y),m.target.z+(Math.random()-.5)*2);
   }
   damage(m.target.x,m.target.z,m.target.y,m);
   if(m.size>1.5)blast(m.target.x,m.target.y,m.target.z,5*m.size);
   strikeParkedCars(m.target.x,m.target.z,5.5*heat);
   for(const c of cars)if(performanceLab.isEnabled('traffic')&&Math.abs(c.root.position.x-m.target.x)<4&&Math.abs(c.root.position.z-m.target.z)<7&&m.target.y<5)explodeCar(c);

   // Realistic physics breakup: explosive detonation, shrapnel spray, and cascading debris
   // Meteors NEVER sit, linger, or remain inside buildings!
   blast(m.target.x,m.target.y,m.target.z,Math.max(3.8,2.2*m.size));
   emitMeteorShrapnel(m.target,Math.min(10,3+m.size*2.5));
   sound('impact',{x:m.target.x});
   const pieceCount=Math.min(16,Math.round(5+m.size*3.0));
   for(let s=0;s<pieceCount;s++){
    const p=m.target.clone().add(new THREE.Vector3((Math.random()-.5)*1.8,(Math.random()-.5)*1.8,(Math.random()-.5)*1.8));
    debrisPiece(p,s%3===0?'glass':(m.kind==='flaming'?'stone':'brick'),m.target);
   }
   remove(meteors,i);
   if(!active)break;continue;
  }
 for(const b of blasts){if(m.fragmentGrace>0||b.age>.64)continue;const dist=m.mesh.position.distanceTo(b.mesh.position),reach=b.r+m.size*.85+(easyMode()?2.2:.8);
 if(dist>=reach)continue;
 const centrality=Math.max(0,1-dist/Math.max(.1,reach));
 if(!m.hitBlasts)m.hitBlasts=new Set();if(m.hitBlasts.has(b))continue;m.hitBlasts.add(b);
 // Central fireball kills small meteors instantly; fringe hits chip larger rocks.
 const force=fireballMeteorDamage(m,b.playerFire,shockDamage(dist,reach,easyMode()));m.hp-=force;
 if(!m.boss&&m.size<2.0)m.mesh.scale.multiplyScalar(Math.max(.75,1-force*.035));
 emitImpact(m.mesh.position.x,m.mesh.position.y,m.mesh.position.z,Math.round(15+centrality*38),.3);emitMeteorShrapnel(m.mesh.position,Math.min(2,m.size));
 checkBossFracture(m);
 if(m.hp<=0){
  b.killCount=(b.killCount||0)+1;
  if(b.killCount===2){score+=300;sessionStats.combos=(sessionStats.combos||0)+1;sound('combo');cinematicFX.shock(b.mesh.position,4.8);message('🔥 DOUBLE INTERCEPT! +300 PTS');}
  else if(b.killCount===3){score+=600;sessionStats.combos=(sessionStats.combos||0)+1;sound('combo');cinematicFX.shock(b.mesh.position,6.2);message('⚡ TRIPLE INTERCEPT! +600 PTS');}
  else if(b.killCount>=4){score+=1200;sessionStats.combos=(sessionStats.combos||0)+1;sound('combo');cinematicFX.shock(b.mesh.position,8.0);message('💥 MASS CONVERGENCE BLAST! +1200 PTS');}
  fragmentMeteor(m);registerIntercept(m);score+=Math.round((100+wave*10)*m.damage);sound('intercept',{x:m.mesh.position.x});updateHud();if(!m.boss&&!m.fragment)blast(m.mesh.position.x,m.mesh.position.y,m.mesh.position.z,Math.min(5.5,Math.max(3.2,1.2*m.size)),b.playerFire);emitImpact(m.mesh.position.x,m.mesh.position.y,m.mesh.position.z,80*m.size,.7);remove(meteors,i);break;}
 }}
for(let i=blasts.length-1;i>=0;i--){const b=blasts[i];b.age+=dt;b.r=Math.min(b.max,b.age*10);b.mesh.scale.setScalar(b.r);b.mesh.material.opacity=Math.max(0,.42*(1-b.age/.78));if(b.age>.78)remove(blasts,i)}for(let i=debris.length-1;i>=0;i--){const d=debris[i];d.life-=dt;d.v.y-=10.8*dt;d.mesh.position.addScaledVector(d.v,dt);d.mesh.rotation.x+=dt*(d.angVel?.x||3);if(d.angVel){d.mesh.rotation.y+=d.angVel.y*dt;d.mesh.rotation.z+=d.angVel.z*dt;}const inSchool=d.mesh.position.x>=schoolBounds.min.x+0.5&&d.mesh.position.x<=schoolBounds.max.x-0.5&&d.mesh.position.z>=schoolBounds.min.z+0.5&&d.mesh.position.z<=schoolBounds.max.z-0.5;
let floorY=0.05;
if(inSchool&&(schoolDamage>0.35||d.isImploding)){floorY=-2.2;}
else if(d.isImploding){const b=neighborhood.targetBuildings?.find(tb=>Math.abs(tb.x-d.mesh.position.x)<tb.w*0.52&&Math.abs(tb.z-d.mesh.position.z)<tb.d*0.52&&(tb.damage>0.35||tb.fireCollapsed));if(b)floorY=-1.8;}
if(d.mesh.position.y<floorY){d.mesh.position.y=floorY;if(d.v.y<-.4&&d.bounces<3){d.v.y=-d.v.y*.28;d.v.x*=.65;d.v.z*=.65;d.bounces++;}else{d.v.y=0;d.v.x*=Math.max(0,1-dt*5);d.v.z*=Math.max(0,1-dt*5);}}if(d.life<=0){if(d.rubble&&!d.trail){preserveRubble(d);debris.splice(i,1)}else remove(debris,i)}}if(toastTimer>0&&(toastTimer-=dt)<=0)document.getElementById('toast').textContent=''}
const clock=new THREE.Clock();let lastW=0,lastH=0;let cameraScrollX=0;let qaCameraScrollX=null;let hostMetricTime=0;let hostMetricFrames=0;
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
if(schoolQA||new URLSearchParams(location.search).get('benchmark')==='1'){
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
const motionQA=schoolQA&&new URLSearchParams(location.search).get('motion')==='1';
function animate(){if(!motionQA){requestAnimationFrame(animate);renderFrame();}}
window.renderFrame=renderFrame;
function renderFrame(captureCamera=null,forcedDt=null){diagnosticFrames.ticks++;diagnosticFrames.lastTickUTC=Date.now();const present=performance.now();
 if(forcedDt===null&&!motionQA&&maxRenderFPS>0&&present-previousRenderAt<1000/maxRenderFPS-1.0)return;
 previousRenderAt=present;const dt=forcedDt!==null?forcedDt:(motionQA?3/60:clock.getDelta());
 if(!motionQA){
  if(dt>.25&&active&&!paused)quality.sample(Math.min(dt,.2));
  quality.sample(dt);evaluateRenderPressure(dt,active&&!paused&&!document.hidden&&document.hasFocus());
 }
 hostMetricTime+=dt;hostMetricFrames++;
 sessionStats.frames++;sessionStats.frameTimeTotal+=dt;const simStart=performance.now();const effectiveDt=dt*(freeFlightMode?sandboxTimeScale:1.0);const step=fixedStep.advance(effectiveDt,update);refreshRubble();const simMs=performance.now()-simStart;
 const w=innerWidth,h=innerHeight;
 const resized=w!==lastW||h!==lastH;
 if(resized){
  applyVisualPreset();
  renderer.setSize(w,h,false);
  renderer.domElement.style.width=w+'px';renderer.domElement.style.height=h+'px';
  camera.aspect=w/h;
  lastW=w;lastH=h;
 }
 const jitter=shake>0?(Math.random()-.5)*shake:0;
 shake=Math.max(0,shake-Math.min(dt,.1));
 const follow=skyCameraLift(dragon.position.y);
 const deadZone=35*Math.min(1,camera.aspect/(16/9));
 const targetScrollX=dragon.position.x-THREE.MathUtils.clamp(dragon.position.x,-deadZone,deadZone)+(dragonVelX*0.35);
 if(qaCameraScrollX!==null){cameraScrollX=qaCameraScrollX;}else{cameraScrollX=THREE.MathUtils.lerp(cameraScrollX,targetScrollX,Math.min(1,dt*4.8));}
 skylineBackdrop.update(elapsed,displayedDarkness,dt);
 skyline.position.x=skylineParallaxX(skylineAnchor,cameraScrollX,.62);
 const altRatio=THREE.MathUtils.clamp((dragon.position.y-44)/(flightCeiling-44),0,1);
 skyline.scale.set(4.35,2.80,1.15);
 skyline.position.y=-18-Math.pow(altRatio,0.95)*58.0;
 const baseFog=.00105+displayedDarkness*.00020;
 scene.fog.density=baseFog*(1.0+Math.pow(altRatio,1.2)*1.4);
 skylineAirUniforms.opacity.value=.14+altRatio*.22;
 neighborhood.foreground.position.x=-cameraScrollX*.035;
 const skyAscent=THREE.MathUtils.clamp((dragon.position.y-32)/110,0,1);
 const isNearPavement=dragonLeavingRoof&&dragon.position.y<=2.25;
 const pavementPitch=isNearPavement?0.75:0;
 const pavementFollow=isNearPavement?-0.95:0;
 const pitchLift=skyAscent*16.2-Math.pow(altRatio,1.25)*10.0+pavementPitch;
 // RC106 Camera Movement: Gentle, smoothed, damped without extreme tilts, shifts, or zoom-ins
 const verticalVelocityLead=THREE.MathUtils.clamp(dragonVelY*0.06,-1.6,1.6);
 const isWaveClearing=(between>0||chapterSettlement.active)&&active&&!paused&&wave<15;
 waveClearZoomBlend=THREE.MathUtils.lerp(waveClearZoomBlend,isWaveClearing?1.0:0.0,Math.min(1,dt*1.8));

 const cinematicZoomBonus=waveClearZoomBlend*0.06;
 let targetZoom=freeFlightMode?sandboxZoomLevel:THREE.MathUtils.clamp((wave===15?.92:1.0)+cinematicZoomBonus,0.96,1.08);


 const subwayView=subwayCamActive?craters.findLast(c=>c.isSubway&&c.life>0&&c.subwayGroup):null;
 if(subwayCamActive&&!subwayView)setInspectionCamera('street');
 if(subwayView){
  camera.position.set(subwayView.x,Math.max(2.5,subwayView.radius*.8),subwayView.z+subwayView.radius*.6);
  camera.lookAt(subwayView.x,(subwayView.subwayGroup.userData.floodBaseY??-5.4)+2.2,subwayView.z);
  targetZoom=1;
 }else if(basementCamActive){
  camera.position.set(0,-0.8,-16.5);
  camera.lookAt(0,-2.4,-36.0);
  targetZoom=1;
 }else{
  const cameraZ=streetView.z+Math.pow(altRatio,1.1)*24.0;
  camera.position.set(streetView.x+cameraScrollX+jitter,streetView.y+follow+pavementFollow*0.4,cameraZ);

  const heroBlend=waveClearZoomBlend*0.25;
  const heroLookX=THREE.MathUtils.lerp(cameraScrollX,dragon.position.x*0.35,heroBlend);
  const baseLookY=streetView.targetY+follow+pavementFollow*0.4+pitchLift*0.5+verticalVelocityLead;
  const heroLookY=THREE.MathUtils.lerp(baseLookY,dragon.position.y*0.25+baseLookY*0.75,heroBlend);
  const heroLookZ=THREE.MathUtils.lerp(streetView.targetZ,dragon.position.z,heroBlend);

  camera.lookAt(heroLookX,heroLookY,heroLookZ);
 }

 // Softened, non-disorienting Dutch tilt (clamped to [-0.012, 0.012])
 const targetDutchTilt=THREE.MathUtils.clamp(-flightRoll*0.008-(dragonVelX*0.0003),-0.012,0.012);
 if(!subwayView&&!basementCamActive)camera.rotation.z+=targetDutchTilt;

 const nextZoom=THREE.MathUtils.lerp(camera.zoom,targetZoom,Math.min(1,dt*(introZoomProgress>0.08||waveClearZoomBlend>0.08?3.5:2.5)));
 if(resized||Math.abs(nextZoom-camera.zoom)>.0001){camera.zoom=nextZoom;camera.updateProjectionMatrix();}
 soundEngine.update(dt,camera.position.y,368,altRatio>0.15,{wave,active:active&&!paused,meteorsCount:meteors.filter(m=>!m.grounded).length,bossActive:bossSpawned&&!bossDefeated,schoolHp:hp,dragonVelY,isBoosting,elapsed});
 if(active&&!paused&&elapsed-lastIntenseRoarElapsed>12.0){
  const nearbyMeteors=meteors.filter(m=>!m.grounded&&Math.hypot(m.mesh.position.x-dragon.position.x,m.mesh.position.y-dragon.position.y)<26.0).length;
  if(nearbyMeteors>=3||(wave===15&&bossSpawned&&!bossDefeated&&Math.random()<0.015)||(dragonVelY<-24.0)){
   lastIntenseRoarElapsed=elapsed;
   sound('dragonRoar',{variant:'intense',x:dragon.position.x});
  }
 }
 if(purpleRamShieldMesh){
  const purpleActive=elapsed<purpleRamUntil;
  const blockActive=blockShield>0;
  const shieldActive=purpleActive||blockActive;
  purpleRamShieldMesh.visible=shieldActive;
  if(shieldActive){
   purpleShieldImpact=Math.max(0,purpleShieldImpact-dt*3.5);
   purpleRamShieldMat.uniforms.uTime.value=elapsed;
   purpleRamShieldMat.uniforms.uImpact.value=purpleShieldImpact;
   purpleRamShieldMat.uniforms.uShieldType.value=purpleActive?0.0:1.0;
   purpleRamShieldMesh.position.set(dragon.position.x+(facing||1)*0.2,dragon.position.y+0.65,dragon.position.z);
   const pulseRate=purpleActive?14.0:8.5;
   purpleRamShieldMesh.scale.setScalar(3.6+Math.sin(elapsed*pulseRate)*0.22+(purpleShieldImpact*0.45));
  }
 }
 const renderStartUTC=Date.now();const renderStart=performance.now();
 visualBank.advanceFireVisuals(elapsed);
 cinematicFX.flush();
 if(useCrowdBatch)crowdRenderer.update(crowd,captureCamera||camera,performanceLab.isEnabled('pedestrians'));
 renderer.render(scene,captureCamera||camera);const renderMs=performance.now()-renderStart;const renderEndUTC=Date.now();if(renderMs>=100){diagnosticFrames.rendererBlocks100++;diagnosticFrames.maxRendererBlockMs=Math.max(diagnosticFrames.maxRendererBlockMs,renderMs);diagnosticFrames.lastRendererBlockUTC=renderEndUTC;}window.__DD_LAST_RENDER_UTC=renderEndUTC;diagnosticFrames.rendered++;diagnosticFrames.lastRenderUTC=window.__DD_LAST_RENDER_UTC;captureLab.afterRender();recordCpuTimings(simMs,renderMs);
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


// Director & Free-Flight Sandbox public API
window.__DD_SANDBOX={
 isFreeFlight:()=>freeFlightMode,
 setFreeFlight:(on)=>toggleFreeFlight(on),
 spawnTestMeteorAt,
 spawnMeteorBarrage,
 dispatchFirefighters,
 extinguishAllFires,
 repairAllBuildings,
 toggleSlowMo,
 getTimeScale:()=>sandboxTimeScale,
 setTimeScale:(s)=>{sandboxTimeScale=s;},
 getZoomLevel:()=>sandboxZoomLevel,
 setZoomLevel:(z)=>{sandboxZoomLevel=z;},
 getHoveredBuildingInfo:()=>currentHoveredBuildingInfo,
  toggleDragon:(on)=>{toggleDragon(on);return {dragonEnabled,visible:dragon.visible};},
  setDragonEnabled:(on)=>{toggleDragon(on);return dragonEnabled;},
  isDragonEnabled:()=>dragonEnabled,
  setMusicMuted:(on)=>{window.__DD_AUDIO.setMusicMuted(on);refreshAudioButtons();return soundEngine.isMusicMuted();},
  setSfxMuted:(on)=>{window.__DD_AUDIO.setSfxMuted(on);refreshAudioButtons();return soundEngine.isSfxMuted();},
 setTrafficEnabled,
 isTrafficEnabled:()=>trafficActive,
 setPedestriansEnabled,
 isPedestriansEnabled:()=>pedestriansActive,
 setLevelAtmosphere,
 spawnLevelAsset,
 openSettings:(tab)=>openUnifiedSettings(tab),
 closeSettings:()=>closeUnifiedSettings()
};

// QA bridge is enabled only on ?qa=1. It exposes actual game entities and uses
// production functions; no mock gameplay or alternate renderer is involved.
if(new URLSearchParams(location.search).get('qa')==='1'){
 const qaLog=[];let qaSequence=0;
 const snap=()=>({version:GAME_VERSION,build:BUILD_ID,active,paused,wave,score,hp,
  dragon:{x:dragon.position.x,y:dragon.position.y,z:dragon.position.z,lives:dragonLives},
  aim:{x:pointer.x,y:pointer.y,z:pointer.z},
  chapterTransition:{...chapterSettlement,postCutsceneWave,stagingMode:chapterStaging.mode,fadeOpacity:chapterFade.style.opacity},
  camera:{x:camera.position.x,y:camera.position.y,z:camera.position.z,scroll:cameraScrollX,skylineOffset:skyline.position.x-skylineAnchor,perspective:camera.isPerspectiveCamera,foregroundOffset:neighborhood.foreground.position.x,streetOrigins:neighborhood.streetOrigins()},
  schoolReconstruction:schoolReconstruction?.stats()||null,
  sourceSchool:{visible:Boolean(actualSchoolOverlay?.visible),strikes:sourceDamage.strikes(),interiorAudit:actualSchoolOverlayStats?.sourceInteriorAudit??null},
  realBlockReferences:{facadeCount:referenceFacades.referenceBuildings,drawObjects:referenceFacades.drawObjects,facades:referenceFacades.snapshots()},
  renderVisibility:{schoolEnabled:performanceLab.isEnabled('schoolModel'),schoolVisible:Boolean(architecturalModel?.visible || actualSchoolOverlay?.visible || (!architecturalReady&&Object.values(meshes).some(m=>m.visible))),actualSchoolOverlayReady,fbxRowhouses:{left:!!actualRowhouseOverlays.leftRowhouse?.visible,right:!!actualRowhouseOverlays.rightRowhouse?.visible},schoolModelCalibration:actualSchoolOverlayStats?.calibration||null,skylineEnabled:performanceLab.isEnabled('skyline'),skylineVisible:skylineBackdrop.group.visible,backgroundEnabled:performanceLab.isEnabled('backgroundBuildings'),particlesEnabled:performanceLab.isEnabled('particles'),fireEnabled:performanceLab.isEnabled('fires'),renderFPSCap:maxRenderFPS,preset:visualPreset,pixelRatio:renderer.getPixelRatio(),shadows:renderer.shadowMap.enabled},
  atmosphere:{phase:displayedPhase,darkness:displayedDarkness},structure:neighborhood.city.stats(),
  vehicleLighting:cars.filter(c=>c.root.userData.headlightBeam).map(c=>({visible:c.root.userData.headlightBeam.visible,strength:c.root.userData.headlightBeam.material.uniforms.strength.value,emissive:c.root.userData.headlightMaterial.emissiveIntensity})),
  neighborhood:{damaged:neighborhood.targetBuildings.filter(b=>b.damage>.001).length,damageSum:+neighborhood.targetBuildings.reduce((sum,b)=>sum+b.damage,0).toFixed(3),targets:neighborhood.targetBuildings.filter(b=>!b.background).slice(0,12).map(b=>({name:b.name,x:b.x,y:Math.min(b.h-2,7),front:b.front,w:b.w,damage:+b.damage.toFixed(3)}))},
  schoolDamage:+schoolDamage.toFixed(3),scene:{meshes:renderer.info.memory.geometries,textures:renderer.info.memory.textures,drawCalls:renderer.info.render.calls,triangles:renderer.info.render.triangles,renderScale:adaptiveResolution},
  lighting:{explosionSlots:explosionLightPool.lights.length,activeExplosions:explosionLightPool.activeCount,helicopterSlots:helicopterLightPool.lights.length,activeHelicopters:helicopterLightPool.activeCount},
  finalSquadron:finalSquadron.stats(),counts:{meteors:meteors.length,fragmentMeteors:meteors.filter(m=>m.fragment).length,bossMeteors:meteors.filter(m=>m.boss).length,shots:shots.length,blasts:blasts.length,debris:debris.length,cars:cars.length,helicopters:helicopters.length,skylineFires:skylineFires.length},
  meteors:meteors.slice(0,60).map(m=>({x:m.mesh.position.x,y:m.mesh.position.y,z:m.mesh.position.z,size:m.size,hp:m.hp,kind:m.kind,fragment:!!m.fragment,boss:!!m.boss,generation:m.generation||0,grace:m.fragmentGrace||0})),
  campaign:{remaining,spawnTimer,stormTimer,between,freeFlightMode,dragonEnabled},
  lastErrors:qaLog.slice(-15),elapsed,frameTimes:{frames:sessionStats.frames,seconds:sessionStats.frameTimeTotal}});
 const run=(name,fn)=>{let result;try{result=fn();qaLog.push({seq:++qaSequence,name,ok:true});return {ok:true,result};}catch(err){qaLog.push({seq:++qaSequence,name,ok:false,error:String(err)});return {ok:false,error:String(err)};}};
 // A dedicated geometry-based skyline camera for visual QA. Normal gameplay
 // camera, coordinates and renderer remain unchanged after the next RAF.
 const qaSkylineCamera=new THREE.OrthographicCamera(-190,190,106.875,-106.875,.1,650);
 // A close camera captures Paulo at real gameplay scale and lighting.
 // Rendering here is diagnostic only; the next game frame restores its camera.
 const qaDragonCamera=new THREE.PerspectiveCamera(42,16/9,.1,250);
 window.__DD_SCENE=scene;window.__DD_RENDERER=renderer;window.__DD_CAMERA=camera;window.__DD_THREE=THREE;
window.__DD_QA={snap,
  inspectSchool:()=>getBuildingInspectorInfo(neighborhood.school),
  advanceSimulation:(frames=1)=>{for(let i=0;i<Math.min(120,frames);i++)update(1/60);},
  verifyMeteorImpact:(x,y,z,size)=>{damage(x,z,y,{size,kind:'iron'});return snap();},
  stepFrame:(n=1,dt=0.05)=>{for(let i=0;i<n;i++)renderFrame(null,dt);return true;},
  renderFrame:(cam,dt)=>renderFrame(cam,dt),
  isFreeFlight:()=>freeFlightMode,
  schoolReconstruction:()=>schoolReconstruction?.stats()||null,
  getSchoolPieces:()=>schoolReconstruction?.getPieces?.()||[],setSchoolDamage:(val)=>{schoolDamage=val;syncStructuralDamage?.();},damageSchool:(val)=>{schoolDamage=Math.min(1.0,schoolDamage+val);syncStructuralDamage?.();},punchSchoolBorehole:(x=0,y=14.5,z=-15,r=3.5,iron=true,massive=false)=>schoolReconstruction?.punchBorehole?.({x,y,z,radius:r,isHeavyIron:iron,isMassive:massive})||0,addCraterAt:(x,z,r=4.5,opts={})=>addCrater(x,z,r,opts),hasStationMezzanine:()=>craters.some(c=>c.subwayGroup?.getObjectByName('subway-station-mezzanine')),hasTurnstiles:()=>craters.some(c=>c.subwayGroup?.getObjectByName('station-turnstile')),hasFallenSeptaSign:()=>craters.some(c=>c.subwayGroup?.getObjectByName('fallen-septa-station-sign')),getEvadingCarsCount:()=>cars.filter(c=>c.evadingCrater).length,hasRadioDispatchTriggered:()=>(elapsed-lastRadioDispatchTime)<30.0,spawnFurnitureBurst:(x=0,y=12,z=22,count=6)=>spawnFurnitureBurst(x,y,z,count),getSchoolFurnitureCount:()=>(schoolReconstruction?.getPieces?.()||[]).filter(p=>p.isFurniture).length,getImplosionPiecesCount:()=>(schoolReconstruction?.getPieces?.()||[]).filter(p=>p.isImploded).length,hasSubwaySteamGeyser:()=>craters.some(c=>c.isSubway&&c.subwayGroup),
  getCars:()=>cars,
 toggleFreeFlight:(on)=>run('toggleFreeFlight',()=>{toggleFreeFlight(on);return {freeFlightMode,snapshot:snap()};}),
 spawnTestMeteorAt:(x,y,z,size,kind)=>run('spawnTestMeteorAt',()=>{spawnTestMeteorAt(x,y,z,size,kind);return snap();}),
 spawnMeteorBarrage:(count,x,z)=>run('spawnMeteorBarrage',()=>{spawnMeteorBarrage(count,x,z);return snap();}),
 dispatchFirefighters:(x)=>run('dispatchFirefighters',()=>{dispatchFirefighters(x);return snap();}),
 extinguishAllFires:()=>run('extinguishAllFires',()=>{extinguishAllFires();return snap();}),
 repairAllBuildings:()=>run('repairAllBuildings',()=>{repairAllBuildings();return snap();}),
 toggleSlowMo:(enable)=>run('toggleSlowMo',()=>{toggleSlowMo(enable);return {timeScale:sandboxTimeScale,snapshot:snap()};}),
 getTimeScale:()=>sandboxTimeScale,
 setTimeScale:(s)=>{sandboxTimeScale=s;},
 getZoomLevel:()=>sandboxZoomLevel,
 setZoomLevel:(z)=>{sandboxZoomLevel=z;},
 getHoveredBuildingInfo:()=>currentHoveredBuildingInfo,
  toggleDragon:(on)=>run('toggleDragon',()=>{toggleDragon(on);return {dragonEnabled,visible:dragon.visible,snapshot:snap()};}),
  setDragonEnabled:(on)=>{toggleDragon(on);return dragonEnabled;},
  isDragonEnabled:()=>dragonEnabled,
  setMusicMuted:(on)=>{window.__DD_AUDIO.setMusicMuted(on);refreshAudioButtons();return soundEngine.isMusicMuted();},
  setSfxMuted:(on)=>{window.__DD_AUDIO.setSfxMuted(on);refreshAudioButtons();return soundEngine.isSfxMuted();},
 setTrafficEnabled:(on)=>run('setTrafficEnabled',()=>{setTrafficEnabled(on);return snap();}),
 setPedestriansEnabled:(on)=>run('setPedestriansEnabled',()=>{setPedestriansEnabled(on);return snap();}),
 setLevelAtmosphere:(lvl)=>run('setLevelAtmosphere',()=>{setLevelAtmosphere(lvl);return snap();}),
 spawnLevelAsset:(a)=>run('spawnLevelAsset',()=>{spawnLevelAsset(a);return snap();}),
 audioStats:()=>({muted:soundEngine.isMuted(),musicMuted:soundEngine.isMusicMuted(),sfxMuted:soundEngine.isSfxMuted(),taiko:soundEngine.getTaikoStats()}),setCameraPan:(x)=>{qaCameraScrollX=x;cameraScrollX=x;if(dragon)dragon.position.x=x;},getCity:()=>neighborhood.city,getSchoolHp:()=>hp,getSchoolDamage:()=>schoolDamage,northBroadModels:()=>run('northBroadModels',()=>northBroadModels?.getStats?.()||null),damageNorthBroad:(idOrAddr,amount=0.5)=>run('damageNorthBroad',()=>northBroadModels?.damageBuilding?.(idOrAddr,amount)),impactNorthBroad:(point,radius=5,strength=1)=>run('impactNorthBroad',()=>northBroadModels?.impact?.(point,radius,strength)),hasBereanFeatures:()=>!!scene.getObjectByName('berean-church-rose-window-and-spires'),getFiresCount:()=>schoolFire.length,
  getElectricalShortsCount:()=>electricalShortsCount,getNorthBroadEntry:(idOrAddr)=>{const e=northBroadModels?.entries?.find?.(x=>x.def.id===idOrAddr||x.def.address.includes(idOrAddr));return e?{id:e.def.id,damage:e.damage,cracksVisible:!!e.facadeCracks?.visible,cracksOpacity:e.facadeCracksMat?.opacity||0}:null;},getSchoolCracks:()=>{const g=scene.getObjectByName('TECH-FREIRE-FACADE-CRACKS');return g?{visible:!!g.visible,linesCount:g.children.length}:null;},getSkyBurstsCount:()=>skyBursts.filter(b=>b.smoke).length,getDistantSmokeMaxY:()=>{let maxY=0;for(const b of skyBursts){if(b.smoke)maxY=Math.max(maxY,b.m.position.y);}return maxY;},getCrunchedMeteors:()=>meteors.filter(m=>m.crunched||m.crunching).map(m=>({x:m.mesh?.position?.x,y:m.mesh?.position?.y,z:m.mesh?.position?.z,size:m.size,stopY:m.crunchStopY,kind:m.kind,crunched:m.crunched,crunching:m.crunching})),getBoreholeSeveredCount:()=>schoolReconstruction?.getPieces?.().filter(p=>p.falling&&p.vy<-5.0).length||0,getInteriorProxiesVisibleCount:()=>northBroadModels?.entries?.filter(e=>e.interiorProxy?.visible).length||0,isSchoolEffectsHooked:()=>!!schoolReconstruction,getSchoolStats:()=>schoolReconstruction?.stats?.(),collapseSchool:()=>schoolReconstruction?.collapse(),hasFloodedSubwayWater:()=>craters.some(c=>c.subwayGroup?.getObjectByName?.('subway-flooded-water')),setSubwayCam:(active)=>{setInspectionCamera(active?'subway':'street');return subwayCamActive;},isSubwayCamActive:()=>subwayCamActive,setBasementCam:(active)=>{setInspectionCamera(active?'basement':'street');return basementCamActive;},isBasementCamActive:()=>basementCamActive,igniteBlock:()=>igniteBlock(),getBurningBuildingsCount:()=>neighborhood.targetBuildings.filter(b=>schoolFire.some(sf=>Math.abs(sf.root.position.x-b.x)<b.w*0.6&&Math.abs(sf.root.position.z-b.z)<b.d*0.6)).length,hasWaterMainGeyser:()=>craters.some(c=>c.geyserGroup),
   getWaterParticleCount:()=>cinematicFX.getWaterParticleCount?cinematicFX.getWaterParticleCount():0,
   getCinematicStats:()=>cinematicFX.stats?cinematicFX.stats():null,
   getBuildingSlots:()=>buildingRegistry.getBuildingSlots(),
   swapBuildingModel:(id,source,opts)=>buildingRegistry.swapBuildingModel(id,source,opts),
   loadBuildingManifest:(m)=>buildingRegistry.loadBuildingManifest(m),
   exportBuildingManifest:()=>buildingRegistry.exportManifest(),
   createProceduralBuildingFallback:(slot)=>buildingRegistry.createProceduralFallback(slot),
   getStreetRunoffStats:()=>streetWaterRunoff.getStats(),
   triggerStreetRunoff:(vol)=>streetWaterRunoff.setRunoffVolume(vol),
   getSubwayThirdRailArcLight:()=>{const g=scene.getObjectByName('subway-cavern-group');return g?g.getObjectByName('subway-third-rail-arc-light'):null;},
  getElectricalShortsCount:()=>buildingElectricalShorts.getTotalShortsTriggered(),
  getActiveArcsCount:()=>buildingElectricalShorts.getActiveArcsCount(),
  triggerElectricalShort:(x=0,y=4.5,z=-15,power=1.0)=>{buildingElectricalShorts.triggerArc(new THREE.Vector3(x,y,z),new THREE.Vector3(x+(Math.random()-0.5)*1.5,y-0.3-Math.random()*0.8,z+(Math.random()-0.5)*1.5),power,cinematicFX,sound);return true;},
  dropMeteorWithMaterial:(kind='iron',size=4.5,x=0,z=-15)=>{spawnTestMeteorAt(x,14.0,z,size,kind);return meteors.at(-1);},
  getIronMeteorsCount:()=>meteors.filter(m=>m.kind==='iron').length,
  runPresetBorehole:()=>runPresetBorehole(),
  runPresetSubway:()=>runPresetSubway(),
  runPresetWaterMain:()=>runPresetWaterMain(),
  runPresetTitanic:()=>runPresetTitanic(),
  getCraterUniforms:()=>neighborhood?.getCraterUniforms?.()||[],
  runPresetFloorPancake:()=>runPresetFloorPancake(),
  getEmergencyExitSignsCount:()=>{const g=scene.getObjectByName('subway-cavern-group');return g?g.children.filter(ch=>ch.name==='subway-emergency-exit-sign').length:0;},
  getSubwayEmergencyBeacon:()=>{const g=scene.getObjectByName('subway-cavern-group');return g?g.getObjectByName('subway-emergency-beacon'):null;},
  triggerBrickDustBurst:(x=0,y=2.0,z=0,p=1.5)=>{cinematicFX.dustBurst(new THREE.Vector3(x,y,z),p,{brick:true});return true;},
  hasAsphaltWaterPuddle:()=>{return craters.some(c=>c.geyserGroup?.getObjectByName('asphalt-water-puddle')||c.subwayGroup?.getObjectByName('subway-flooded-water'));},
  getSubwayFloodLevel:()=>{const c=craters.find(cr=>cr.isSubway);return c?c.floodLevel||0.14:0;},
   triggerWaterMain:(x=0,z=BROAD_CENTER,r=4.2)=>addCrater(x,z,r,{waterOnly:true}),
  runPresetConflagration:()=>runPresetConflagration(),
  getGlassDebrisCount:()=>debris.filter(d=>d.type==='glass'||d.isGlass).length,
  getDebrisCount:()=>debris.length,
  cycleSlowMoSpeed:()=>cycleSlowMoSpeed(),
  setSlowMoSpeed:(s)=>setSlowMoSpeed(s),
  getRebarPiecesCount:()=>(schoolReconstruction?.getPieces?.()||[]).filter(p=>p.zone==='rebar').length,
  getBoreholeCharRingsCount:()=>{const g=scene.getObjectByName('TECH-FREIRE-BOREHOLE-CHAR');return g?g.children.length:0;},isSubwayTrainDerailed:()=>craters.some(c=>c.subwayGroup?.getObjectByName('septa-b4-subway-car')?.userData?.derailed),getSubwayCarsCount:()=>craters.filter(c=>c.subwayGroup?.getObjectByName('septa-b4-subway-car')).length,getCratersWithSteam:()=>craters.filter(c=>c.isSubway&&c.subwayGroup).length,getCraters:()=>craters,getImplodingDebrisCount:()=>debris.filter(d=>d.isImploding).length,getBasementDebrisCount:()=>debris.filter(d=>d.mesh.position.y<0.0).length,getEmbeddedMeteorsCount:()=>meteors.filter(m=>m.crunched||m.grounded).length,igniteAt:(x,y,z)=>ignite(x,y,z),getSmokeStats:()=>cinematicFX.stats?.(),getFurnitureDebrisCount:()=>debris.filter(d=>d.isFurnitureDebris).length,isBuildingDestructible:(idOrName)=>!!neighborhood?.targetBuildings?.find(b=>b.name===idOrName||(b.name&&b.name.includes(idOrName))),getFires:()=>schoolFire.map(f=>({x:f.root.position.x,y:f.root.position.y,z:f.root.position.z,age:f.age,suppression:f.suppression,size:f.size})),igniteAt:(x,y,z)=>ignite(x,y,z),dispatchFirefighters:(x)=>dispatchFirefighters(x),repairAllBuildings:()=>repairAllBuildings(),groundedMeteorsCount:()=>meteors.filter(m=>m.grounded).length,collapseNorthBroad:(idOrAddr)=>run('collapseNorthBroad',()=>northBroadModels?.collapseBuilding?.(idOrAddr)),meteorsList:()=>meteors.map(m=>({size:m.size,hp:m.hp,isMassive:!!m.isMassive,colossus:!!m.colossus,x:m.mesh?.position?.x??0,y:m.mesh?.position?.y??0,z:m.mesh?.position?.z??0,crunching:!!m.crunching,grounded:!!m.grounded,crunchStopY:m.crunchStopY})),log:()=>qaLog.slice(),run,startTrial:startTacticalTrial,isTrialActive:()=>tacticalTrialActive,bubbleShield:()=>({visible:purpleRamShieldMesh?.visible||false,impact:purpleShieldImpact,type:purpleRamShieldMat?.uniforms?.uShieldType?.value||0}),neighborhoodHealth:()=>neighborhoodHealth(),gameOver:()=>gameOver(),winGame:()=>winGame(),taikoStats:()=>soundEngine.getTaikoStats(),roarStats:()=>soundEngine.getRoarStats(),triggerRoar:(v='furious')=>sound('dragonRoar',{variant:v,x:dragon.position.x}),cameraZoom:()=>({zoom:camera.zoom,introZoomProgress,waveClearZoomBlend}),dragonPose:()=>({x:dragon.position.x,y:dragon.position.y,z:dragon.position.z,rx:dragon.rotation.x,ry:dragon.rotation.y,rz:dragon.rotation.z,rearUpBlend,perched:!dragonLeavingRoof}),carsList:()=>cars.map(c=>({x:c.root.position.x,y:c.root.position.y,z:c.root.position.z,laneZ:c.laneZ,fireTruck:!!c.fireTruck,speed:c.speed,serviceTarget:!!c.serviceTarget})),spawnCar:(x,z,dir,type)=>spawnCar(x,z,dir,type),
  stageFluidFire:()=>run('stageFluidFire',()=>{
   const initial=visualBank.fireVisualStats();
   visualBank.advanceFireVisuals(124.15);
   const before=visualBank.fireVisualChecksum();
   visualBank.advanceFireVisuals(124.62);
   const after=visualBank.fireVisualChecksum();
   const metrics=visualBank.fireVisualStats();
   visualBank.advanceFireVisuals(elapsed);
   return {initial,metrics,checksumChanged:before!==after,
    sharedFlameTexture:visualBank.images.flame===flameTexture,
    proceduralSkylineFire:skylineBackdrop.getStats().combustion.textures===0,
    phaseOne:before,phaseTwo:after};
  }),
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
   // The full city shot retains the intended skyline scale. A focused fire
   // shot must aim at the *world-space impact*, not the tower's lower floors;
   // the old close-up cut every major flame off above the screenshot.
   skyline.updateMatrixWorld(true);
   const tower=skylineBackdrop.towers.find(t=>t.def.id==='comcast-technology');
   const fireWorld=(tower?skylineBackdrop.group.localToWorld(skylineBackdrop.fireState(tower).position):null)??new THREE.Vector3(centerX,60,skyline.position.z);
   if(detail){
    qaSkylineCamera.position.set(fireWorld.x,fireWorld.y+12,skyline.position.z+35);
    qaSkylineCamera.lookAt(fireWorld.x,fireWorld.y,skyline.position.z);
   }else{
    qaSkylineCamera.position.set(centerX,62,skyline.position.z+165);
    qaSkylineCamera.lookAt(centerX,39,skyline.position.z);
   }
   qaSkylineCamera.updateProjectionMatrix();
   qaSkylineCamera.updateMatrixWorld(true);
   const fireNdc=fireWorld.clone().project(qaSkylineCamera);
   renderer.render(scene,qaSkylineCamera);
   return {png:renderer.domElement.toDataURL('image/png'),detail,
    fireVisible:!!tower&&skylineBackdrop.fireState(tower).active,
    fireNdc:fireNdc.toArray(),
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
  stageDistantBuildingCollapse:()=>run('stageDistantBuildingCollapse',()=>{
   const district=neighborhood.longRange;
   const impact=district.strike(0,-100,.36);
   if(!impact)throw Error('Expected an intact distant building');
   const target=district.root.localToWorld(new THREE.Vector3(impact.x,impact.y*.42,impact.z));
   const camera=new THREE.PerspectiveCamera(49,renderer.domElement.width/renderer.domElement.height,.1,500);
   camera.position.copy(target).add(new THREE.Vector3(4,13,31));
   // Frame the entire ballistic debris arc rather than cropping chunks above the roof.
   camera.lookAt(target.clone().add(new THREE.Vector3(0,3.5,0)));
   const capture=()=>{
    renderer.render(scene,camera);
    return renderer.domElement.toDataURL('image/png');
   };
   const intact=district.buildingState(impact.id),before=capture();
   district.strike(impact.x,impact.z,.36);
   district.strike(impact.x,impact.z,.36);
   district.update(.68);
   const falling=district.buildingState(impact.id),flightBudget=district.stats(),flight=capture();
   district.update(3.0);
   const settled=district.buildingState(impact.id),settledBudget=district.stats(),after=capture();
   // Five stationary ticks verify idle GPU instances do not become dirty.
   for(let i=0;i<5;i++)district.update(0);
   const idleBudget=district.stats();
   return {id:impact.id,intact,falling,settled,flightBudget,settledBudget,idleBudget,before,flight,after};
  }),
  distantNeighborhoodStats:()=>neighborhood.longRange.stats(),
  strikeDistantNeighborhood:(x,z,strength)=>neighborhood.longRange.strike(x,z,strength),
  distantBuildingState:id=>neighborhood.longRange.buildingState(id),
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
   const smokeVisibleImmediately=skylineBackdrop.fireState(t).active;
   skylineBackdrop.setDamage(skylineDamage);
   skylineBackdrop.update(elapsed,displayedDarkness,1/60);
   return {landmark:t.def.id,worldPosition:hit?.toArray(),beforeDamage:before,
    expectedPreDamageWorld,postDamageImpactWorld,
    smokeVisibleImmediately,afterDamage:t.strikeDamage,flashVisible:t.impactSprite.visible,
    flashParentStable:t.impactSprite.parent===skylineBackdrop.group,
    flashWorldPosition:t.impactSprite.getWorldPosition(new THREE.Vector3()).toArray(),
    flashOpacity:t.impactSprite.material.opacity,flashAge:t.impactAge,
    flashScaleImmediately,
    smokeVisible:skylineBackdrop.fireState(t).active,smokeOpacity:null,
    smokeColor:null,
    fireVisible:skylineBackdrop.fireState(t).active,fireOpacity:null,
    fireSize:[skylineBackdrop.fireState(t).width,skylineBackdrop.fireState(t).height,1],
    secondaryBurnSites:t.burnSites.map(site=>({active:site.active,index:site.index,
     position:site.origin.toArray(),width:site.width,height:site.height,
     renderWidth:site.renderWidth,renderHeight:site.renderHeight,ignitedAt:site.ignitedAt})),
    skylineBurnBudget:skylineBackdrop.getStats(),
    smokeParentStable:skylineBackdrop.fireState(t).parentStable,
    smokeWorldScale:skylineBackdrop.group.getWorldScale(new THREE.Vector3()).toArray(),
    scorchVisible:t.scorchSprite.visible,scorchOpacity:t.scorchSprite.material.opacity};
  }),
  stageSkylineCollapse:()=>run('stageSkylineCollapse',()=>{
   // Capture the smoke's world position on both sides of the same synchronous
   // collapse event. No animation step occurs between these snapshots, so
   // any displacement would mean smoke inherited the tower transform.
   const t=skylineBackdrop.towers.find(t=>t.def.id==='comcast-technology');
   if(!t)throw Error('Expected landmark missing');
   const smokeWorldBefore=skylineBackdrop.group.localToWorld(skylineBackdrop.fireState(t).position).toArray();
   const flashWorldBefore=t.impactSprite.getWorldPosition(new THREE.Vector3()).toArray();
   skylineBackdrop.setDamage(1);
   const smokeWorldAfter=skylineBackdrop.group.localToWorld(skylineBackdrop.fireState(t).position).toArray();
   const flashWorldAfter=t.impactSprite.getWorldPosition(new THREE.Vector3()).toArray();
   return {landmark:t.def.id,collapse:t.collapse,ruinVisible:t.ruin.visible,
    smokeWorldBefore,smokeWorldAfter,flashWorldBefore,flashWorldAfter,
    flashParentStable:t.impactSprite.parent===skylineBackdrop.group,
    rubbleDetached:t.ruin.parent===skylineBackdrop.group,
    rubbleGroundY:t.ruin.position.y,slabs:t.slabs.length,
    fallActive:t.fallActive,fallElapsed:t.fallElapsed,
    smokeVisible:skylineBackdrop.fireState(t).active,
    fireVisible:skylineBackdrop.fireState(t).active,
    smokeParentStable:skylineBackdrop.fireState(t).parentStable,
    smokeWorldScale:skylineBackdrop.group.getWorldScale(new THREE.Vector3()).toArray(),
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
    impactVisible:t.impactSprite.visible,smokeVisible:skylineBackdrop.fireState(t).active,
    fireVisible:skylineBackdrop.fireState(t).active,
    smokeWorldPosition:skylineBackdrop.group.localToWorld(skylineBackdrop.fireState(t).position).toArray(),
    combustionClock:skylineBackdrop.fireState(t).clock,
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
  stageBreathAnchor:()=>run('stageBreathAnchor',()=>{
   const before={position:dragon.position.clone(),scale:dragon.scale.clone(),
    rotation:dragon.rotation.clone(),aim:pointer.clone(),preview:pauloPreviewEnabled,
    origin:gustOrigin.clone(),direction:gustDirection.clone(),visualPosition:windVisual.position.clone(),
    visualRotation:windVisual.quaternion.clone(),visualVisible:windVisual.visible};
   const samples=[];
   const sample=label=>{
    syncWindMouth();
    samples.push({label,model:pauloPreviewEnabled?'paulo':'legacy',
     dragon:dragon.position.toArray(),mouth:getBreathMouthWorld(new THREE.Vector3()).toArray(),
     origin:gustOrigin.toArray(),visual:windVisual.position.toArray(),
     direction:gustDirection.toArray(),
     visualForward:breathXAxis.clone().applyQuaternion(windVisual.quaternion).toArray()});
   };
   try{
    pointer.set(75,40,0);
    setPauloPreview(false);
    dragon.position.set(-20,12,15);dragon.rotation.set(0,0,0);dragon.scale.set(1.2,1,1.2);
    sample('legacy-hover');
    dragon.position.set(24,30,15);dragon.rotation.set(.17,.15,-.2);dragon.scale.x=-1.2;
    sample('legacy-turn');
    if(!setPauloPreview(true))throw Error('Paulo preview rig unavailable');
    dragon.position.set(-12,20,15);dragon.rotation.set(.1,0,.05);dragon.scale.x=1.2;
    pauloPreviewRig.applyPose(.35,'hover',1,.2);sample('paulo-hover');
    dragon.position.set(12,38,15);dragon.rotation.set(.15,.1,.08);
    pauloPreviewRig.applyPose(.85,'flight',1,.35);sample('paulo-flight');
    dragon.scale.x=-1.2;dragon.rotation.set(.25,-.3,-.25);
    pauloPreviewRig.applyPose(1.1,'bank',-1,.2);sample('paulo-turn');
    return {samples};
   }finally{
    setPauloPreview(before.preview);
    dragon.position.copy(before.position);dragon.scale.copy(before.scale);dragon.rotation.copy(before.rotation);
    pointer.copy(before.aim);gustOrigin.copy(before.origin);gustDirection.copy(before.direction);
    windVisual.position.copy(before.visualPosition);windVisual.quaternion.copy(before.visualRotation);
    windVisual.visible=before.visualVisible;
   }
  }),
  stageGroundWind:()=>run('stageGroundWind',()=>{
   const makeCar=extra=>({root:new THREE.Group(),dir:-1,speed:7,laneZ:20,...extra});
   const car=makeCar({}),bus=makeCar({bus:true}),truck=makeCar({truck:true});
   const pedestrian={g:new THREE.Group(),down:0};
   const vehicles=[car,bus,truck];
   for(const v of vehicles)v.root.position.set(12,0,20);
   pedestrian.g.position.set(12,0,20);
   const origin=new THREE.Vector3(0,0,20),direction=new THREE.Vector3(1,0,0);
   const before={score,wave,hp,windActive,origin:gustOrigin.clone(),direction:gustDirection.clone()};
   const existingPuffs=skyBursts.splice(0);
   try{
    let foliageBend=0,carTilt=0;
    for(let i=0;i<12;i++){
     foliageBend=Math.max(foliageBend,applyStreetGust(.05,origin,1,0,i/17,vehicles,[pedestrian]));
     advancePedestrianWind(pedestrian,.05);
     carTilt=Math.max(carTilt,Math.abs(car.root.rotation.x));
    }
    const smokeY=dragon.position.y+30;
    windActive=true;gustOrigin.set(0,smokeY,20);gustDirection.copy(direction);
    cinematicFX.setWind(gustOrigin,gustDirection,1);
    const testSmoke={m:{position:new THREE.Vector3(12,smokeY,20),
     scale:new THREE.Vector3(1,1,1),material:{opacity:.58}},
     smoke:true,life:2,initialLife:2};
    skyBursts.push(testSmoke);
    updateSkyBursts(.08);
    const personTilt=pedestrian.g.rotation.x,personX=pedestrian.g.position.x;
    for(let i=0;i<80;i++){
     advanceVehicleWind(car,.05);
     advancePedestrianWind(pedestrian,.05);
    }
    return {busX:bus.root.position.x,truckX:truck.root.position.x,carTilt,
     personX,personTilt,foliageBend,
     personRecovered:pedestrian.windFall===0&&pedestrian.g.rotation.x===0,
     carRecovered:car.windRecovery===0&&Math.abs(car.root.rotation.x)<.02,
     statePreserved:score===before.score&&wave===before.wave&&hp===before.hp&&pedestrian.down===0,
     dustInstances:windDustPool.mesh.count,litterInstances:windLitterPool.mesh.count,
     smokeWindStrength:cinematicFX.stats().windStrength,
     puffX:testSmoke.m.position.x,puffOpacity:testSmoke.m.material.opacity};
   }finally{
    skyBursts.length=0;skyBursts.push(...existingPuffs);
    windActive=before.windActive;gustOrigin.copy(before.origin);gustDirection.copy(before.direction);
    clearWindDebris();
    updateWindPlanting(1);
    cinematicFX.setWind(gustOrigin,gustDirection,windActive?Math.min(1,gustTime/.55):0);
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
   wave=11;dragon.position.set(-3,13,15);facing=1;dragonLeavingRoof=true;dragon.rotation.set(0,0,0);pointer.set(25,13,15);militaryOccupation.reset();
   militaryOccupation.stageWindRocket(new THREE.Vector3(12,13,15));
   const before=militaryOccupation.windRocketStates();
   gustOrigin.copy(dragon.position);gustDirection.set(1,0,0);gustTime=.85;windCooldown=4;windActive=true;gustMissileNotified=false;
   updateDragonWind(.05);
   return {before,after:militaryOccupation.windRocketStates(),snapshot:snap()};
  }),
  labStageMilitarySearchlights:()=>run('labStageMilitarySearchlights',()=>{
   if(!active)reset();if(cinematicActive)closeChapterTransition();paused=false;
   wave=13;dragon.position.set(0,18,15);militaryOccupation.reset();updateHud();
   // No missiles are fired during this 1.5s visual-only staged aim test.
   for(let i=0;i<90;i++)militaryOccupation.update(1/60,[],[]);
   const footprints=militaryOccupation.footprints().map(bounds=>{
    const {minX,maxX,minZ,maxZ}=bounds;
    const buildingOverlap=neighborhood.city.buildings.some(b=>
     minX<b.x+b.w/2&&maxX>b.x-b.w/2&&minZ<b.front&&maxZ>b.z-b.d/2);
    return {...bounds,buildingOverlap,crossStreetOverlap:occupiesCrossStreet((minX+maxX)/2,maxX-minX)};
   });
   renderer.render(scene,camera);
   return {states:militaryOccupation.searchlightStates(),counts:militaryOccupation.counts(),footprints,snapshot:snap(),
    png:renderer.domElement.toDataURL('image/png')};
  }),
  labStageWind:()=>run('labStageWind',()=>{if(!active)reset();if(cinematicActive)closeChapterTransition();paused=false;wave=6;dragon.position.set(-3,13,15);facing=1;helicopterTimer=600;spawnHelicopter(1);const h=helicopters.at(-1);if(!h)throw Error('Unable to spawn test helicopter');h.root.position.set(9,13,15);h.disorientTime=0;gustOrigin.copy(dragon.position);gustDirection.set(1,0,0);gustTime=.85;windCooldown=4;windActive=true;return {description:'Production dragon wind will strike a helicopter and induce 5s disorientation',snapshot:snap()};}),
  labStageIce:()=>run('labStageIce',()=>{if(!active)reset();if(cinematicActive)closeChapterTransition();paused=false;wave=6;dragon.position.set(0,13,15);helicopterTimer=600;spawnHelicopter(1);const h=helicopters.at(-1);if(!h)throw Error('Unable to spawn ICE helicopter');h.root.position.set(10,13,15);h.role='ice';h.disorientTime=0;h.iceCooldown=0;h.contactTime=0;return {description:'Continuous 17-unit beam; uninterrupted 3s contact required',snapshot:snap()};}),
  labStageDragonFall:()=>run('labStageDragonFall',()=>{if(!active)reset();if(cinematicActive)closeChapterTransition();paused=false;dragon.position.set(0,26,15);stunDragon('QA ELECTRICAL FALL');return {description:'Production stun, falling, impact and takeoff sequences',snapshot:snap()};}),
  labGasAttack:()=>run('labGasAttack',()=>{if(!active)reset();if(cinematicActive)closeChapterTransition();paused=false;gasCooldown=0;dragon.position.set(0,13,15);facing=1;gasAttack();return {description:'Real dragon gas cloud and collision rules',cloudCount:gasClouds.length,snapshot:snap()};}),
  labCrowd:()=>run('labCrowd',()=>{if(!active)reset();if(cinematicActive)closeChapterTransition();paused=false;for(let n=0;n<4;n++)spawnCrowd();return {description:'Production pedestrian animations and crowd movement',snapshot:snap()};}),
  advanceFlashLights:(dt=.6)=>run('advanceFlashLights',()=>{updateExplosionLights(Math.max(0,Math.min(1,dt)));return snap()}),
  flashAt:(x=0,y=6,z=10)=>run('flashAt',()=>{flashAt(x,y,z,1);return snap()}),
  stageDefenseRegression:()=>run('stageDefenseRegression',()=>{
   const contacts=[];
   for(const z of [0,-25,-35]){
    reset();if(cinematicActive)closeChapterTransition();paused=false;
    remaining=1;spawnTimer=1000;stormTimer=1000;
    dragon.position.set(-12,20,15);dragonLeavingRoof=true;facing=1;
    spawnMeteor();const m=meteors.at(-1);
    m.mesh.position.set(12,20,z);m.target.set(12,-100,z);m.vel.set(0,0,0);
    m.size=.5;m.hp=1;m.opening=false;m.fastImpact=false;m.largeSplitter=false;
    projectDefensePoint(m.mesh.position,camera.position,pointer);
    const before=sessionStats.intercepts;cooldown=0;shoot();
    const speed=shots.at(-1).vel.length();
    for(let j=0;j<100&&meteors.includes(m);j++)update(1/60);
    contacts.push({z,speed,intercepted:!meteors.includes(m)&&sessionStats.intercepts>before});
   }
   reset();if(cinematicActive)closeChapterTransition();paused=false;
   wave=5;dragon.position.set(18,21,15);dragonLeavingRoof=true;
   beginChapterSettlement();const before=dragon.position.toArray();
   input.keyDown('KeyD');input.keyDown('KeyW');
   for(let j=0;j<30;j++)update(1/60);
   input.clear();const after=dragon.position.toArray();
   const phase=chapterSettlement.phase;
   reset();if(cinematicActive)closeChapterTransition();paused=false;
   active=false;document.getElementById('overlay').style.display='grid';
   return {contacts,settlement:{before,after,phase},rearBoundary:DEFENSE_REAR_Z};
  }),
  setWave:(n)=>run('setWave',()=>{wave=clampWave(n);updateAtmosphere();updateHud();return snap()}),
  beginSettlement:()=>run('beginSettlement',()=>{wave=5;remaining=0;beginChapterSettlement();return snap()}),
  steeringPose:(x=0)=>run('steeringPose',()=>{const c=cars[0];if(!c)return {noCars:true};c.steerAngle=x;animateVehicleSteering(c,.2);return {steerVisual:c.steerVisual,frontWheelCount:c.root.userData.frontSteer?.length||0};}),
  laneSafety:()=>run('laneSafety',()=>({cars:cars.slice(0,10).map(c=>({x:+c.root.position.x.toFixed(2),z:+c.root.position.z.toFixed(2),laneZ:c.laneZ,passing:choosePassingLane(c,cars,craters),steer:c.steerVisual||0})),streetGlowCount:streetGlows.length})),
  advanceSettlement:(seconds=4)=>run('advanceSettlement',()=>{for(let t=0;t<seconds;t+=1/30){chapterStaging.update(1/30,elapsed);updateChapterSettlement(1/30);}return snap()}),
  closeCinematic:()=>run('closeCinematic',()=>{closeChapterTransition();return snap()}),
  advanceAtmosphere:(dt=1)=>run('advanceAtmosphere',()=>{for(let t=0;t<dt;t+=1/60)updateNight(1/60);return snap()}),
  stageDistantMeteorCadence:(damaged)=>run('stageDistantMeteorCadence',()=>{
   const foreground=neighborhood.targetBuildings.filter(building=>!building.background);
   if(!foreground.length)throw Error('QA cadence requires foreground buildings');
   const before={streak:distantTimer,strike:skylineEventTimer,background:backgroundDamageTimer,count:distantStreaks.length};
   for(const building of foreground)building.damage=damaged?1:0;
   distantTimer=skylineEventTimer=0;
   backgroundDamageTimer=.1;
   updateDistantMeteors(0);
   return {before,after:{streak:distantTimer,strike:skylineEventTimer,count:distantStreaks.length}};
  }),
  stageOpeningWave:()=>run('stageOpeningWave',()=>{
   closeChapterTransition();
   dragon.position.y=flightCeiling;
   const view=camera.clone();
   view.position.set(streetView.x,streetView.y+skyCameraLift(flightCeiling),streetView.z);
   view.lookAt(0,streetView.targetY+skyCameraLift(flightCeiling),streetView.targetZ);
   view.updateMatrixWorld(true);
   updateWaveProgress(10);
   updateWaveProgress(10);
   updateWaveProgress(10);
   const incoming=meteors.map(m=>({size:m.size,kind:m.kind,falling:m.vel.y<0,boss:!!m.boss,
    offscreen:m.mesh.position.clone().add(new THREE.Vector3(0,-m.size*1.4,0)).project(view).y>1,
     fissuredMaterial:m.mesh.material===moltenMaterial}));
   let png=null;
   if(wave===4){
    // Capture the live renderer with the real wave composition after entry.
    const positions=meteors.map(m=>m.mesh.position.clone());
    const lift=skyCameraLift(65);
    dragon.position.y=65;
    view.position.set(streetView.x,streetView.y+lift,streetView.z);
    view.lookAt(0,streetView.targetY+lift,streetView.targetZ);
    view.updateMatrixWorld(true);
    for(const [index,m] of meteors.entries()){
     m.mesh.position.set((index-.5)*34,streetView.y+lift+13,m.mesh.position.z);
    }
    renderer.render(scene,view);
    png=renderer.domElement.toDataURL('image/png');
    for(const [index,m] of meteors.entries())m.mesh.position.copy(positions[index]);
   }
   const layers=[];
   for(let i=0;i<4;i++){
    const parents=meteors.filter(m=>m.generation===i||(i===0&&!m.fragment));
    for(const parent of parents){
     remove(meteors,meteors.indexOf(parent));
     fragmentMeteor(parent);
    }
    layers.push(meteors.map(m=>({size:m.size,kind:m.kind,generation:m.generation,falling:m.vel.y<0})));
    updateWaveProgress(.01);
   }
   const heldDuringSplit=between<.02;
   const roof=schoolBounds.getCenter(new THREE.Vector3());
   roof.y=schoolBounds.max.y;
   const sweep={mesh:{position:new THREE.Vector3(roof.x,0,roof.z)},target:new THREE.Vector3()};
   const hitRoof=traceOpeningMeteorImpact(sweep,roof.clone().add(new THREE.Vector3(0,15,0)))&&
    Math.abs(sweep.target.y-roof.y)<.001;
   sweep.mesh.position.set(0,0,24);
   const hitGround=traceOpeningMeteorImpact(sweep,new THREE.Vector3(0,12,24))&&
    Math.abs(sweep.target.y-.7)<.001;
   updateWaveProgress(7.1);
   return {incoming,layers,heldDuringSplit,advancedTo:wave,skyLift:skyCameraLift(44+skyScreenHeight)-skyCameraLift(44),skyScreenHeight,
    intact:backgroundImpactEffects(100),damaged:backgroundImpactEffects(0),hitRoof,hitGround,png};
  }),
  stageMoltenStructuralImpact:()=>run('stageMoltenStructuralImpact',()=>{
   // Exercise the production damage() path on both a neighbor and the school.
   // The city tracks deterministic structural pressure even when random debris
   // detaches; schoolDamage is a deterministic fraction of profile strength.
   const normal={size:.8,kind:'molten',opening:false,vel:new THREE.Vector3(0,-10,0)};
   const hot={...normal,opening:true};
   const building=neighborhood.targetBuildings.find(b=>!b.background&&b.z<13&&b.damage<.1);
   if(!building)throw Error('QA molten structural impact needs an intact foreground building');
   const y=Math.max(2,Math.min(10,building.h*.5));
   damage(building.x,building.z,y,normal);
   const ordinaryPressure=building.pressure;
   neighborhood.restore();
   damage(building.x,building.z,y,hot);
   const moltenPressure=building.pressure;
   neighborhood.restore();
   // The original FBX bounds extend deep into the block; target the actual
   // school gameplay footprint, not the FBX bounding-box midpoint.
   const center=new THREE.Vector3(neighborhood.school.x,0,neighborhood.school.z);
   const roofY=Math.max(2,Math.min(20,schoolBounds.max.y-1));
   const before=schoolDamage;
   damage(center.x,center.z,roofY,normal);
   const ordinarySchool=schoolDamage-before;
   const beforeHot=schoolDamage;
   damage(center.x,center.z,roofY,hot);
   const moltenSchool=schoolDamage-beforeHot;
   return {ordinaryPressure,moltenPressure,ordinarySchool,moltenSchool,heat:openingMoltenHeat(hot)};
  }),
  // Actual player shoot() -> swept projectile -> shockwave -> fragmentation.
  // Isolate targets so staged waves cannot obscure a missed peripheral hit.
  stagePlayerInterception:(size=.7,withFringe=false)=>run('stagePlayerInterception',()=>{
   if(cinematicActive)closeChapterTransition();
   active=true;paused=false;waterDisable=0;dragonStun=0;
   for(let i=meteors.length-1;i>=0;i--)remove(meteors,i);
   for(let i=shots.length-1;i>=0;i--)remove(shots,i);
   for(let i=blasts.length-1;i>=0;i--)remove(blasts,i);
   remaining=0;between=99;dragonMeteorTimer=999;helicopterTimer=999;
   dragon.position.set(0,27,15);dragonLeavingRoof=true;facing=1;
   dragon.scale.x=1;dragon.rotation.set(0,0,0);dragon.updateMatrixWorld(true);
   const mouth=getBreathMouthWorld(new THREE.Vector3());
   const priorAim=pointer.clone();
   const mesh=createPlayableRock(size);
   mesh.position.copy(mouth).add(new THREE.Vector3(6,0,0));
   if(size>2)mesh.material=moltenMaterial;
   scene.add(mesh);
   const root={mesh,target:mesh.position.clone(),vel:new THREE.Vector3(),
    trail:1,hp:Math.ceil(size*3),size,kind:size>2?'flaming':'stone',
    opening:true,generation:size>2?1:size>1.1?2:3,largeSplitter:true,burning:size>2,damage:1};
   meteors.push(root);
   let fringe=null;
   if(withFringe){
    const fringeMesh=createPlayableRock(.65);
    fringeMesh.position.copy(mesh.position).add(new THREE.Vector3(0,3.1,0));
    scene.add(fringeMesh);
    fringe={mesh:fringeMesh,target:fringeMesh.position.clone(),vel:new THREE.Vector3(),
     trail:1,hp:3,size:.65,kind:'stone',opening:true,generation:3,damage:1};
    meteors.push(fringe);
   }
   const shrapnelBefore=impactParticles.filter(p=>p.shrapnel).length;
   const shotsBefore=sessionStats.shots;
   pointer.copy(mouth).add(new THREE.Vector3(20,0,0));
   try{
    cooldown=0;shoot();update(.22);
    for(let i=0;i<4&&fringe&&meteors.includes(fringe);i++)update(.13);
    return {size,playerShots:sessionStats.shots-shotsBefore,
     directRemoved:!meteors.includes(root),
     fringeRemoved:fringe?!meteors.includes(fringe):null,
     fragments:meteors.filter(m=>m.fragment&&m.generation===root.generation+1).map(m=>({
      size:m.size,kind:m.kind,opening:!!m.opening,burning:!!m.burning})),
     shrapnel:impactParticles.filter(p=>p.shrapnel).length-shrapnelBefore};
   }finally{pointer.copy(priorAim);}
  }),
  stageMeteorShootability:(roll,edge=false,allowImpact=false)=>run('stageMeteorShootability',()=>{
   spawnMeteor(()=>roll);
   const meteor=meteors.at(-1);
   const speed=meteor.vel.length();
   dragon.position.set(edge?66:0,27,15);
   facing=1;
   meteor.mesh.position.copy(dragon.position).add(new THREE.Vector3(7,1.2,0));
   meteor.vel.set(0,0,0);
   const priorAim=pointer.clone();
   pointer.copy(dragon.position).add(new THREE.Vector3(20,1.2,0));
   const initialHP=meteor.hp;
   const fire=()=>{
    cooldown=0;
    shoot();
    update(.2);
   };
   if(!allowImpact)fire();
   const firstHitHP=meteor.hp;
   for(let i=0;!allowImpact&&i<4&&meteors.includes(meteor);i++)fire();
   pointer.copy(priorAim);
   const result={kind:meteor.kind,fastImpact:meteor.fastImpact,splitter:meteor.largeSplitter,speed,
    initialHP,firstHitHP,finalHP:meteor.hp,removed:!meteors.includes(meteor),
    fragments:meteors.filter(m=>m.fragment).length};
   if(allowImpact&&meteors.includes(meteor)){
    const strikesBefore=sourceDamage.strikes();
    meteor.target.set(0,11,.35);
    meteor.mesh.position.copy(meteor.target).add(new THREE.Vector3(0,2.8,0));
    meteor.vel.set(0,-speed,0);
    for(let i=0;i<12&&meteors.includes(meteor);i++)update(1/60);
    result.schoolStrikes=sourceDamage.strikes()-strikesBefore;
    result.removedOnImpact=!meteors.includes(meteor);
   }
   return result;
  }),
  stageZeroBlockMeteorDamage:()=>run('stageZeroBlockMeteorDamage',()=>{
   for(const building of neighborhood.targetBuildings)building.damage=1;
   const near=neighborhood.targetBuildings.find(building=>building.background&&building.z<DEFENSE_REAR_Z);
   near.damage=.95;
   updateHud();
   const district=neighborhood.longRange;
   backgroundDamageTimer=0;
   escalateBackgroundNeighborhood(0,()=>.25);
   const incoming=distantStreaks.filter(streak=>streak.landing);
   const beforeImpact=district.stats();
   updateDistantMeteors(1.81);
   const afterImpact=district.stats();
   district.update(3.3);
   const point=incoming.find(streak=>streak.landing.far).landing.point;
   const camera=new THREE.PerspectiveCamera(52,renderer.domElement.width/renderer.domElement.height,.1,500);
   camera.position.copy(point).add(new THREE.Vector3(4,14,28));
   camera.lookAt(point.x,point.y*.5,point.z);
   renderer.render(scene,camera);
   return {health:neighborhoodHealth(),incoming:incoming.length,nearDamage:near.damage,beforeImpact,afterImpact,settled:district.stats(),
    png:renderer.domElement.toDataURL('image/png')};
  }),
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
  activatePowerup:(type)=>run('activatePowerup',()=>{if(type==='fire_stream')fireStreamUntil=elapsed+8;else if(type==='mega_fire_breath')megaFireBreathUntil=elapsed+16;else if(type==='purple_ram')purpleRamUntil=elapsed+10;updatePowerHud();return snap()}),
  triggerHelicopterCrash:(variant=1)=>run('triggerHelicopterCrash',()=>{spawnHelicopter(variant);const h=helicopters.at(-1);if(h)crashHelicopter(h);return snap()}),
  stageFirefighter:()=>run('stageFirefighter',()=>{ignite(0,3,3);spawnHelicopter(2);const h=helicopters[helicopters.length-1];h.root.position.set(0,16,3);return snap()}),
  start:(at=1)=>run('start',()=>{const field=document.getElementById('start-wave');if(!field)showSettings();document.getElementById('start-wave').value=Math.max(1,Math.min(15,at));reset();if(cinematicActive)closeChapterTransition();return snap()}),
  move:(x,y=10)=>run('move',()=>{dragon.position.set(THREE.MathUtils.clamp(x,-DRAGON_BOUND_X,DRAGON_BOUND_X),THREE.MathUtils.clamp(y,1.35,flightCeiling),15);dragonVelX=0;dragonVelY=0;diveEnergy=0;dragonLeavingRoof=true;return snap()}),
  advanceOrdinaryWave:()=>run('advanceOrdinaryWave',()=>{if(!active||wave>=15||[5,10,14].includes(wave))throw Error('QA ordinary-wave transition requires active non-chapter boundary wave');const before=snap();wave++;between=0;updateHud();newWave();return {before,after:snap()}}),
  stageRallyLoop:()=>run('stageRallyLoop',()=>{
   remaining=0;
   spawnMeteor(()=>.8);
   const meteor=meteors.at(-1);
   updateWaveProgress(8,true);
   const held={wave,between,count:meteors.length};
   registerIntercept(meteor,true);
   const earned=blockCharge;
   registerIntercept({fragment:true},true);
   meteor.grounded=true;
   registerIntercept(meteor,true);
   const afterExcluded=blockCharge;
   blockCharge=98;
   registerIntercept({},true);
   const capped=blockCharge;
   updateWaveProgress(.1,true);
   const countdown=document.getElementById('toast').textContent;
   updateWaveProgress(3.8,true);
   const beforeAdvance=wave;
   updateWaveProgress(.2,true);
   return {held,earned,afterExcluded,capped,countdown,beforeAdvance,afterAdvance:wave};
  }),
  stageRallyImpactWarning:()=>run('stageRallyImpactWarning',()=>{
   if(!impactMarker)throw Error('Rally preview is required');
   const startingScore=score;
   spawnMeteor(()=>.8);
   const meteor=meteors.at(-1);
   meteor.target.set(0,13,schoolBounds.max.z-.4);
   meteor.mesh.position.copy(meteor.target).add(new THREE.Vector3(0,28,0));
   meteor.vel.set(0,-10,0);
   updateMeteorRadar(.2);
   const marked={visible:impactMarker.visible,position:impactMarker.position.toArray(),
    eta:selectMeteorWarning(meteors,neighborhood.school,neighborhood.targetBuildings)?.eta};
   return {marked,target:meteor.target.toArray(),startingScore};
  }),
  stageRallyRecovery:(buy)=>run('stageRallyRecovery',()=>{
   if(!rallyRecoveryChoice)throw Error('Rally recovery choice preview is required');
   remaining=0;
   blockCharge=40;
   updateWaveProgress(.1);
   updateBlockButton();
   const button=document.getElementById('call-block');
   const offer={text:button.textContent,enabled:!button.disabled};
   if(buy){button.click();activateBlock();}
   const queued=rallyShieldQueued;
   const charge=blockCharge;
   const earlyShield=schoolShieldUntil>elapsed;
   updateWaveProgress(6.8);
   const beforeAdvance=wave;
   updateWaveProgress(.2);
   return {offer,queued,charge,earlyShield,beforeAdvance,afterAdvance:wave,
    shieldSeconds:Math.max(0,schoolShieldUntil-elapsed),queueCleared:!rallyShieldQueued,score};
  }),
  stageRallyRecap:()=>run('stageRallyRecap',()=>{
   if(!rallyLoop)throw Error('Rally preview is required');
   remaining=0;
   registerIntercept({});
   registerIntercept({});
   hp-=7;
   for(const building of neighborhood.targetBuildings.slice(0,40))building.damage=.5;
   updateHud();
   updateWaveProgress(.1);
   const recap=waveStats.at(-1).rallyResult;
   const expectedBlockLoss=100-neighborhoodHealth();
   updateMeteorRadar(.2);
   hp-=2;
   updateWaveProgress(.1);
   return {recap,expectedBlockLoss,unchanged:recap===waveStats.at(-1).rallyResult};
  }),
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
  hitSchool:(amount=25)=>run('hitSchool',()=>{hp=Math.max(0,hp-Math.max(0,amount));schoolDamage=(100-hp)/100;neighborhood.city.forceDamage(neighborhood.school,schoolDamage);syncStructuralDamage();updateHud();if(hp>0)sound('dragonRoar',{variant:'furious',x:dragon.position.x});if(hp===0)gameOver();return snap()}),
  actualSchoolGeometry:()=>run('actualSchoolGeometry',()=>({loaded:actualSchoolOverlayReady,details:actualSchoolOverlayStats,bounds:actualSchoolOverlay?(()=>{const b=new THREE.Box3().setFromObject(actualSchoolOverlay),v=b.getSize(new THREE.Vector3());return {min:b.min.toArray(),max:b.max.toArray(),size:v.toArray()};})():null,showingOldShell:architecturalModel?.children.filter(o=>o.name==='physical-components'&&o.visible).length||0,sourceFacadeCalibration:actualSchoolOverlayStats?.calibration||null,independentSourceRowhouses:actualRowhouseStats,schoolGlassCards:schoolWindowLights.length,attachedGlazingMaterials:schoolGlazingMaterials.length,decorativeSchoolFacade:referenceFacades.snapshots().some(e=>e.building==='tech-freire-school')})),
  inspectThreeBuildingSource:()=>run('inspectThreeBuildingSource',()=>({central:actualSchoolOverlayStats,flanking:actualRowhouseStats,activeSourceGroups:{left:!!actualRowhouseOverlays.leftRowhouse?.visible,right:!!actualRowhouseOverlays.rightRowhouse?.visible},duplicateGenerated:{left:!!neighborhood.buildings.find(b=>b.name==='united-fund-cream')?.hideIntactGeometry,right:!!neighborhood.buildings.find(b=>b.name==='north-brownstone')?.hideIntactGeometry}})),
  focusActualSchool:()=>run('focusActualSchool',()=>{if(!active)reset();if(cinematicActive)closeChapterTransition();paused=false;setMode('real');performanceLab.set('schoolModel',true);dragon.position.set(0,12,15);return {description:'Original school meshes aligned with the production school footprint',overlayReady:actualSchoolOverlayReady,overlayStats:actualSchoolOverlayStats,snapshot:snap()};}),
  actualSchoolImpact:()=>run('actualSchoolImpact',()=>{if(!active)reset();if(cinematicActive)closeChapterTransition();paused=false;setMode('real');performanceLab.set('schoolModel',true);damage(0,.45,11,{size:4.0,isMassive:true,kind:'flaming'});return {description:'Production school impact against the real-model-aligned school scene',overlayReady:actualSchoolOverlayReady,overlayStats:actualSchoolOverlayStats,snapshot:snap()};}),
  sceneMetrics:()=>run('sceneMetrics',snap),
  screenshotMark:(label)=>run('screenshotMark',()=>({label,time:elapsed,frame:sessionStats.frames})),
  impactAt:(x=0,z=.4,y=10)=>run('impactAt',()=>{damage(x,z,y);return snap()}),
  impactNeighborhood:(name='north-brick')=>run('impactNeighborhood',()=>{const b=neighborhood.targetBuildings.find(t=>t.name===name&&!t.background);if(!b)throw Error('Missing target '+name);damage(b.x,b.front,Math.min(b.h-2,7));return snap()}),
  igniteAt:(x=0,y=3,z=8)=>run('igniteAt',()=>{ignite(x,y,z);return snap()}),
  damageMaskPixels:()=>run('damageMaskPixels',()=>({front:schoolDamagePlanes.front.getContext('2d').getImageData(0,0,SCHOOL_MASK_SIZE,SCHOOL_MASK_SIZE).data.length,side:schoolDamagePlanes.side.getContext('2d').getImageData(0,0,SCHOOL_MASK_SIZE,SCHOOL_MASK_SIZE).data.length,schoolDamage})),
  clearMeteors:()=>run('clearMeteors',()=>{remaining=0;while(meteors.length)remove(meteors,meteors.length-1);return snap();}),
  advanceProgress:(dt=0.1)=>run('advanceProgress',()=>{updateWaveProgress(dt);return snap();}),
  destroyAllSatellites:()=>run('destroyAllSatellites',()=>{if(orbitalTheater){for(const sat of orbitalTheater.satellites)orbitalTheater.hitSatellite(sat,100,true);}return snap();}),
   foregroundMeteorsStats:()=>foregroundMeteors.getStats(),
   spawnNearBolide:(x,z)=>foregroundMeteors.spawnNearBolide(x,z),
   schoolDestructionStats:()=>({schoolDamage,hp,schoolFragmentsCount:schoolFragments.count}),
   setDragonFullSpeed:(vx=22,vy=0)=>{dragonVelX=vx;dragonVelY=vy;dragonLeavingRoof=true;},
   trainingStats:()=>trainingMissions.getStats(),
   skipTraining:()=>trainingMissions.skip(),
   advanceTrainingStep:(step)=>trainingMissions.advanceToStep(step),
   destroyTrainingTarget:()=>run('destroyTrainingTarget',()=>{const t=meteors.find(m=>m.isTrainingTarget);if(t){const ix=meteors.indexOf(t);if(ix>=0){scene.remove(t.mesh);meteors.splice(ix,1);}}return trainingMissions.getStats();}),
   extinguishTrainingFire:()=>run('extinguishTrainingFire',()=>{trainingMissions.extinguishFire();clearFires();return trainingMissions.getStats();}),
   freezeTrainingCop:()=>run('freezeTrainingCop',()=>{trainingMissions.disableCruiser();cars.forEach(c=>{if(c.trainingCop||c.police)freezeResponder(c);});return trainingMissions.getStats();}),
  startChapter1:()=>startChapterOneCombat(),
   evacuationStats:()=>evacuationChapter.getStats(),
   startEvacuation:()=>evacuationChapter.start(),
   triggerChopperCrash:()=>evacuationChapter.crashChopper(),
   triggerChopperEscape:()=>evacuationChapter.safeEscape(),
  startSecondaryEscort:(r=1)=>evacuationChapter.startSecondaryEscort(r),
  errors:qaLog,
 };
 window.__DD_ORBITAL_THEATER=orbitalTheater;
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
if(motionQA){
 window.__DD_CINEMATIC_REVIEW={
  stage:(at=4,x=0)=>{
   const qa=window.__DD_QA;
   qa.start(at);qa.closeCinematic();qa.cinematicStage('quiet');qa.move(x,20);
   qa.qaSettleAtmosphere();
   for(let n=0;n<6;n++)spawnCar();
   document.getElementById('toast').textContent='';
   window.__DD_CINEMA_HUD?.setEnabled(true);
   return {wave,phase:displayedPhase,darkness:displayedDarkness};
  },
  frame:()=>{
   renderFrame();
   return {png:renderer.domElement.toDataURL('image/png').split(',')[1],
    lighting:cinematicLighting.stats(),sun:sun.intensity,ambient:ambience.intensity,
    trees:upgradedStreet.windTrees.length,drawCalls:renderer.info.render.calls,
    triangles:renderer.info.render.triangles,schoolReady:actualSchoolOverlayReady};
  }
 };
 const qa=window.__DD_QA,district=neighborhood.longRange;
 const detail=new THREE.PerspectiveCamera(45,16/9,.1,500);
 let scenario,meteor,house,tower,vehicle,captureCamera,frame=0;
 window.__DD_MOTION={
  start(name){
   if(scenario)throw Error('Use a fresh page for each motion scenario');
   scenario=name;
   const started=qa.start(name==='skyfall'||name==='dragon'?4:7);
   if(!started.ok)throw Error(started.error);
   closeChapterTransition();
   qa.cinematicStage('quiet');
   qa.qaSettleAtmosphere();
   dragonMeteorTimer=distantTimer=skylineEventTimer=600;
   if(name==='skyfall'){
    dragon.position.set(-28,35,15);
    setPauloPreview(true);
    spawnMeteor(Math.random,{size:3.6,kind:'flaming'});
    meteor=meteors.at(-1);
    meteor.mesh.position.set(9,67,13);
    meteor.vel.set(-1,-15,0);
   }else if(name==='dragon'){
    dragon.position.set(-22,30,15);
    setPauloPreview(true);
    dragonLeavingRoof=true;
    detail.position.copy(dragon.position).add(new THREE.Vector3(0,4.5,16));
    detail.lookAt(dragon.position.x,dragon.position.y+1.3,dragon.position.z);
    captureCamera=detail;
   }else if(name==='houses'){
    house=district.targetAt(0,-100);
    const target=district.root.localToWorld(new THREE.Vector3(house.x,house.y*.5,house.z));
    detail.position.copy(target).add(new THREE.Vector3(4,13,34));
    detail.lookAt(target.clone().add(new THREE.Vector3(0,3,0)));
    captureCamera=detail;
   }else if(name==='skyline'){
    tower=skylineBackdrop.towers.find(t=>t.def.id==='comcast-technology');
    const point=tower.group.localToWorld(new THREE.Vector3(0,tower.def.h*.78,0));
    detail.position.copy(point).add(new THREE.Vector3(0,9,156));
    detail.lookAt(point);
    captureCamera=detail;
   }else if(name==='traffic'){
    dragon.position.set(-22,9,19);
    dragonLeavingRoof=true;
    for(let i=0;i<8&&!vehicle;i++){
     spawnCar();
     vehicle=cars.find(c=>!c.emergency&&c.root.userData.headlightBeam);
    }
    if(!vehicle)throw Error('No road vehicle for motion capture');
    vehicle.root.position.set(14,-.36,20);
    vehicle.root.rotation.y=Math.PI;
    Object.assign(vehicle,{dir:-1,laneZ:20,speed:7,desiredSpeed:7,turnAt:null});
    // Tight enough to see individual wheels, chassis roll and recovery.
    detail.position.set(12,8,44);
    detail.lookAt(12,1,20);
    captureCamera=detail;
   }else throw Error('Unknown motion scenario '+name);
   return {version:GAME_VERSION,build:BUILD_ID,wave};
  },
  frame(){
   if(scenario==='skyfall'){
    if(frame===0){input.keyDown('KeyD');input.keyDown('KeyW');}
    if(frame===12)input.keyUp('KeyW');
    if(frame===24&&meteors.includes(meteor)){
     remove(meteors,meteors.indexOf(meteor));
     fragmentMeteor(meteor);
    }
    if(frame===29){input.keyUp('KeyD');input.keyDown('KeyA');}
    if(frame===54)input.keyUp('KeyA');
   }
   if(scenario==='dragon'){
    if(frame===0){input.keyDown('KeyD');input.keyDown('KeyW');}
    if(frame===14)input.keyUp('KeyW');
    if(frame===28){input.keyUp('KeyD');input.keyDown('KeyA');}
    if(frame===57){input.keyUp('KeyA');input.keyDown('KeyD');}
    if(frame===83)input.keyUp('KeyD');
    // Keep Paulo large in the frame while making his turn visible.
    detail.position.copy(dragon.position).add(new THREE.Vector3(0,4.5,16));
    detail.lookAt(dragon.position.x,dragon.position.y+1.3,dragon.position.z);
   }
   if(scenario==='houses'&&[12,27,42].includes(frame))district.strikeTarget(house.id,.36);
   if(scenario==='skyline'&&[15,42].includes(frame)){
    const strike=qa.stageSkylineStrike();
    if(!strike.ok)throw Error(strike.error);
   }
   // QA-only second facade fire for genuine 30-second multi-fire motion review.
   if(scenario==='skyline'&&[220,390].includes(frame)){
    const second=skylineBackdrop.towers.find(t=>t.def.id==='comcast-center');
    if(!second)throw Error('Second skyline landmark missing');
    skylineBackdrop.strikeNearest(second.group.position.x);
   }
   if(scenario==='traffic'&&frame===25){
    pointer.set(45,5,20);
    gustCooldownReset();
    gustTime=.85;
    windActive=true;
   }
   renderFrame(captureCamera);
   frame++;
   const state={
    elapsed,drawCalls:renderer.info.render.calls,triangles:renderer.info.render.triangles,
    dragon:dragon.position.toArray()
   };
   if(meteor)state.meteors=meteors.map(m=>({y:m.mesh.position.y,generation:m.generation||0}));
   if(scenario==='dragon')state.flight={x:dragon.position.x,y:dragon.position.y,
    heading:dragon.rotation.y,model:pauloPreviewEnabled?'paulo':'legacy',
    pose:pauloPoseDriver?.snapshot()?.pose??null,
    // Renderer-side visual-only kinematics for motion QA; no collision or
    // gameplay state is changed. Real wings must move at distinct phases.
    wingJoints:pauloPreviewRig?.wings.map(({side,shoulder,elbow,wrist})=>({
     side,shoulder:shoulder.rotation.x,elbow:elbow.rotation.x,
     wrist:wrist.rotation.x,spread:wrist.rotation.y})),
    tuckedLegs:pauloPreviewRig?.legs.map(({hip,knee})=>({
     hip:hip.rotation.z,knee:knee.rotation.z}))};
   if(house){
    const {damage,fall,rubbleCount,airborneCount,largeParticleCount,smallParticleCount,smokePosition,burning}=district.buildingState(house.id);
    state.house={damage,fall,rubbleCount,airborneCount,largeParticleCount,smallParticleCount,smokePosition,burning};
   }
   if(tower)state.tower={damage:tower.strikeDamage,combustionTime:skylineBackdrop.fireState(tower).clock,
    smoke:null,fireVisible:skylineBackdrop.fireState(tower).active,smokeVisible:skylineBackdrop.fireState(tower).active};
   if(tower)state.skylineFires=skylineBackdrop.towers.filter(t=>skylineBackdrop.fireState(t).active).map(t=>t.def.id);
   if(vehicle)state.traffic={position:vehicle.root.position.toArray(),roll:vehicle.root.rotation.x,
    gust:windActive,hit:vehicle.windGustId===gustId,headlights:vehicle.root.userData.headlightBeam.visible};
   return {state,png:renderer.domElement.toDataURL('image/png').split(',')[1]};
  }
 };
}
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
}
// RC40: lightweight, single-producer Windows heartbeat outside motion-only QA.
// Do not call __DD_QA.snap() here: it traverses thousands of scene components.
// The Python server logs its own samples even if this JS timer stops firing.
let hostHeartbeatIndex=0;
if(!schoolQA && (location.hostname==='127.0.0.1'||location.hostname==='localhost')){
 setInterval(()=>{
  if(window.__DD_HOST_MONITOR_READY!==true)return;
  const m=window.__DD_GAME_METRICS||{};
  const body={wave,fps:m.fps??null,drawCalls:m.drawCalls??null,
   frameMs:m.frameMs??null,recording:captureLab.isRecording(),
   stallCount:frameHealth.summary().totalLongFrames,
   phase:!active?'idle':paused?'paused':'playing',active:Boolean(active&&!paused),
   gameFrameCount:sessionStats.frames,lastGameFrameUTC:window.__DD_LAST_RENDER_UTC??null,
   documentHidden:document.hidden,documentHasFocus:document.hasFocus(),
   heartbeatIndex:++hostHeartbeatIndex};
  fetch('./__game_telemetry',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body),cache:'no-store'})
   .catch(()=>{window.__DD_HOST_MONITOR_READY=false;});
 },1000);
}

window.addEventListener('test-activate-powerup', (e) => {
  if (e.detail === 'fire_stream') fireStreamUntil = elapsed + 8;
  else if (e.detail === 'mega_fire_breath') megaFireBreathUntil = elapsed + 16;
  updatePowerHud();
});
