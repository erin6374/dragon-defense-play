import * as T from 'three';
import {buildings} from './district.js';
import {YORK_PROFILES,renderYorkDistrict,yorkPlan} from './york-facades.mjs';
const $=id=>document.getElementById(id),canvas=$('view');
const rows=buildings.filter(b=>Object.hasOwn(YORK_PROFILES,b[2])).sort((a,b)=>a[2].localeCompare(b[2]));
const scene=new T.Scene();scene.background=new T.Color(0xb8c4ca);scene.add(new T.HemisphereLight(0xffffff,0x716f62,2.0));
const sun=new T.DirectionalLight(0xfff2db,2.3);sun.position.set(-480,80,-40);scene.add(sun);
const mat=c=>new T.MeshStandardMaterial({color:c,roughness:.87});
function mesh(g,c,x=0,y=0,z=0){const m=new T.Mesh(g,mat(c));m.position.set(x,y,z);scene.add(m);return m;}
function box(x,y,z,w,h,d,c,a=0){const m=mesh(new T.BoxGeometry(w,h,d),c,x,y,z);m.rotation.y=a;return m;}
function block(poly,h,c,base=0){const make=(r,C)=>{const p=new C();r.forEach(([x,z],i)=>i?p.lineTo(x,-z):p.moveTo(x,-z));p.closePath();return p;};const s=make(poly[0],T.Shape);s.holes=poly.slice(1).map(r=>make(r,T.Path));const g=new T.ExtrudeGeometry(s,{depth:h,bevelEnabled:false});g.rotateX(-Math.PI/2);return mesh(g,c,0,base,0);}
box(-520,-.15,-82,80,.25,74,0x999c89);box(-525.5,.02,-82,10,.10,70,0x55595b);box(-532,.06,-82,2,.12,70,0xbeb9ac);box(-519,.06,-82,2,.12,70,0xbeb9ac);
for(const [ps,h,n] of rows)renderYorkDistrict(ps,h,n,{block,box,mesh,T});
for(const [ps,h,n] of rows)$('target').add(new Option(n,n));
const camera=new T.OrthographicCamera(-10,10,10,-10,.1,500);let renderer;let mode='whole';
try{renderer=new T.WebGLRenderer({canvas,antialias:true});renderer.setPixelRatio(Math.min(window.devicePixelRatio,2));}catch(e){$('status').textContent='WebGL unavailable: '+e.message;throw e;}
function render(){const w=canvas.clientWidth,h=canvas.clientHeight,aspect=w/h,zoom=+$('zoom').value;renderer.setSize(w,h,false);const [ps,height,n]=rows.find(r=>r[2]===$('target').value)||rows[0];const p=yorkPlan(ps,height,n),pts=ps.flatMap(q=>q[0]);const x=(Math.min(...pts.map(q=>q[0]))+Math.max(...pts.map(q=>q[0])))/2,z=(p.lo+p.hi)/2;const whole=mode==='whole';let half=(whole?48:mode==='top'?Math.max(16,p.width*.8):Math.max(10,p.width*.65,height*.72))*zoom;camera.left=-half*aspect;camera.right=half*aspect;camera.top=half;camera.bottom=-half;camera.updateProjectionMatrix();
 if(whole){camera.position.set(-477,65,-17);camera.lookAt(-521,2,-81);}else if(mode==='top'){camera.position.set(x,90,z+.001);camera.lookAt(x,0,z);}else{camera.position.set(x+p.profile.side*55,mode==='angle'?26:height*.5+1,z+(mode==='angle'?24:0));camera.lookAt(x,height*.47,z);}
 renderer.render(scene,camera);$('status').textContent=whole?'Whole York group | isolated geometry view':n+' | '+p.profile.kind+' | GIS height '+height.toFixed(2)+' m | '+(p.profile.kind==='small-detached'?'No unsupported openings modeled':'Provisional opening positions');}
for(const [id,m] of [['front','front'],['angle','angle'],['top','top'],['whole','whole']])$(id).onclick=()=>{mode=m;render();};$('target').onchange=()=>{mode='front';render();};$('zoom').oninput=render;window.addEventListener('resize',render);render();
