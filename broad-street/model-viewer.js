import {buildLandmark} from './landmarks.js';
import * as THREE from 'three';
import {createStructuralCity} from './rc86/rendering/structural-city.js';
import {createBroadStreetReferenceFacades} from './rc86/rendering/broad-street-reference.js';
import {populateCity} from './rc86/simulation/city-layout.js';

// Source-exact RC86 structural geometry and facade enrichment. Only the selected
// building is registered to avoid allocating hundreds of off-screen structures.
export class BuildingViewer {
 constructor(canvas){
  this.canvas=canvas;this.renderer=new THREE.WebGLRenderer({canvas,antialias:true,preserveDrawingBuffer:true});
  this.renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,2));this.renderer.setClearColor(0x9aafc4);
  this.scene=new THREE.Scene();this.scene.background=new THREE.Color(0x9aafc4);
  this.camera=new THREE.PerspectiveCamera(37,1,.1,1000);this.light=new THREE.HemisphereLight(0xffffff,0x5a6675,2.4);this.scene.add(this.light);
  this.sun=new THREE.DirectionalLight(0xffefdc,2.3);this.sun.position.set(-35,55,70);this.scene.add(this.sun);
  this.angle=.12;this.elevation=.14;this.distance=40;this.target=new THREE.Vector3(0,8,0);this.day=true;
  this.pointer=null;canvas.addEventListener('pointerdown',e=>{this.pointer=[e.clientX,e.clientY];canvas.setPointerCapture(e.pointerId)});
  canvas.addEventListener('pointermove',e=>{if(!this.pointer)return;const dx=e.clientX-this.pointer[0],dy=e.clientY-this.pointer[1];this.pointer=[e.clientX,e.clientY];this.angle+=dx*.008;this.elevation=Math.max(-.2,Math.min(.85,this.elevation+dy*.006));this.draw()});
  canvas.addEventListener('pointerup',()=>this.pointer=null);
  canvas.addEventListener('wheel',e=>{e.preventDefault();this.distance=Math.max(12,Math.min(130,this.distance*Math.exp(e.deltaY*.001)));this.draw()},{passive:false});
  this.resizeObserver=new ResizeObserver(()=>this.draw());this.resizeObserver.observe(canvas);
 }
 load(b){
  if(this.buildingGroup){this.scene.remove(this.buildingGroup);this.buildingGroup.traverse(o=>{if(o.geometry)o.geometry.dispose();if(o.material){const m=Array.isArray(o.material)?o.material:[o.material];m.forEach(x=>x.dispose())}})}
  this.buildingGroup=new THREE.Group();this.scene.add(this.buildingGroup);
  const landmark=buildLandmark(b.id);
  if(landmark){
   this.buildingGroup.add(landmark);this.target.set(0,b.h*.38,0);
   this.angle=.30;this.elevation=.32;this.distance=Math.max(b.w,b.d)*2.6;
   this.draw();return {components:landmark.children.length,drawBatches:landmark.children.length,landmark:true};
  }
  const colors={brick:0x965f4c,limestone:0xc9bcaa};
  const bank={getBuilding:(type,fallback)=>new THREE.MeshStandardMaterial({color:fallback||colors[type]||0xb0a397,roughness:.84}),concrete:new THREE.MeshStandardMaterial({color:0x999b9c}),roof:new THREE.MeshStandardMaterial({color:0x515459}),blackMetal:new THREE.MeshStandardMaterial({color:0x272d35}),images:{}};
  const city=createStructuralCity(THREE,this.buildingGroup,bank);
  // Populate the exact RC86 definitions but register only the selected object.
  // This ensures building dimensions/attributes stay in sync with game source.
  const chosen=[];populateCity({addBuilding(o){if(o.name===b.name){chosen.push(o);return o;}return o;}});
  if(chosen.length!==1)throw Error('RC86 building missing: '+b.name);
  city.addBuilding(chosen[0]);city.finalize();
  createBroadStreetReferenceFacades(this.buildingGroup,city.buildings);
  this.buildingGroup.position.x=-b.x;this.buildingGroup.position.z=-b.z;
  this.target.set(0,b.h*.46,0);this.distance=Math.max(24,b.w*1.6,b.h*2.05,b.d*2.2);
  this.draw();return city.stats();
 }
 setNight(night){this.day=!night;this.scene.background.setHex(night?0x111b31:0x9aafc4);this.light.intensity=night?.65:2.4;this.sun.intensity=night?.3:2.3;this.draw()}
 setAngle(a){this.angle=a;this.elevation=.12;this.draw()}
 draw(){if(!this.renderer)return;const w=this.canvas.clientWidth||640,h=this.canvas.clientHeight||400;this.renderer.setSize(w,h,false);this.camera.aspect=w/h;this.camera.position.set(this.target.x+Math.sin(this.angle)*Math.cos(this.elevation)*this.distance,this.target.y+Math.sin(this.elevation)*this.distance,this.target.z+Math.cos(this.angle)*Math.cos(this.elevation)*this.distance);this.camera.lookAt(this.target);this.camera.updateProjectionMatrix();this.renderer.render(this.scene,this.camera)}
 png(){this.draw();return this.canvas.toDataURL('image/png')}
}
