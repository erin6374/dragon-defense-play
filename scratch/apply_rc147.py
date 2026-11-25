"""Apply RC147 structural smoke soot shift, subterranean boiling steam, and conduit audio."""
import sys

def patch_cinematic_effects():
    path = "src/rendering/cinematic-effects.js"
    with open(path, "r", encoding="utf-8") as f:
        content = f.read()

    # 1. Update pool to support per-instance color and smooth feathering without quad edge clipping
    target_pool = """function pool(capacity,material,geometry=new T.PlaneGeometry(1,1)){
  const m=new T.InstancedMesh(geometry,material,capacity);m.frustumCulled=false;m.count=0;m.instanceMatrix.setUsage(T.DynamicDrawUsage);scene.add(m);
  const alpha=new T.InstancedBufferAttribute(new Float32Array(capacity),1);m.geometry.setAttribute('fxAlpha',alpha);
  material.onBeforeCompile=s=>{s.vertexShader='attribute float fxAlpha;varying float vFxAlpha;varying vec2 vFxUv;\\n'+s.vertexShader;s.vertexShader=s.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\\nvFxAlpha=fxAlpha;vFxUv=uv;');s.fragmentShader='varying float vFxAlpha;varying vec2 vFxUv;\\n'+s.fragmentShader;s.fragmentShader=s.fragmentShader.replace('#include <color_fragment>','#include <color_fragment>\\nfloat fxEdgeR=length((vFxUv-vec2(0.5))*2.0);float fxFeather=1.0-smoothstep(0.20,0.98,fxEdgeR);diffuseColor.a*=vFxAlpha*fxFeather;')};
  return {m,alpha,capacity,n:0,add(pos,w,h,opacity=1,rotation=0){if(this.n>=capacity)return;dummy.position.copy(pos);dummy.quaternion.copy(camera.quaternion);dummy.rotateZ(rotation);dummy.scale.set(w,h,1);dummy.updateMatrix();m.setMatrixAt(this.n,dummy.matrix);alpha.setX(this.n++,opacity)},flush(){m.count=this.n;m.instanceMatrix.needsUpdate=true;alpha.needsUpdate=true}};
 }
 const flame=pool(420,new T.MeshBasicMaterial({map:bank.images.flame,color:0xffffff,transparent:true,opacity:.95,depthWrite:false,blending:T.AdditiveBlending}));
 const smoke=pool(1400,new T.MeshBasicMaterial({map:bank.images.smoke,color:0x3c3b39,transparent:true,opacity:.85,depthWrite:false}));"""

    repl_pool = """function pool(capacity,material,geometry=new T.PlaneGeometry(1,1)){
  const m=new T.InstancedMesh(geometry,material,capacity);m.frustumCulled=false;m.count=0;m.instanceMatrix.setUsage(T.DynamicDrawUsage);scene.add(m);
  const alpha=new T.InstancedBufferAttribute(new Float32Array(capacity),1);m.geometry.setAttribute('fxAlpha',alpha);
  material.onBeforeCompile=s=>{s.vertexShader='attribute float fxAlpha;varying float vFxAlpha;varying vec2 vFxUv;\\n'+s.vertexShader;s.vertexShader=s.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\\nvFxAlpha=fxAlpha;vFxUv=uv;');s.fragmentShader='varying float vFxAlpha;varying vec2 vFxUv;\\n'+s.fragmentShader;s.fragmentShader=s.fragmentShader.replace('#include <color_fragment>','#include <color_fragment>\\nfloat fxEdgeR=length((vFxUv-vec2(0.5))*2.0);float fxFeather=1.0-smoothstep(0.08,0.88,fxEdgeR);diffuseColor.a*=vFxAlpha*fxFeather;')};
  return {m,alpha,capacity,n:0,add(pos,w,h,opacity=1,rotation=0,col=null){if(this.n>=capacity)return;dummy.position.copy(pos);dummy.quaternion.copy(camera.quaternion);dummy.rotateZ(rotation);dummy.scale.set(w,h,1);dummy.updateMatrix();m.setMatrixAt(this.n,dummy.matrix);if(col&&m.setColorAt)m.setColorAt(this.n,col);alpha.setX(this.n++,opacity)},flush(){m.count=this.n;m.instanceMatrix.needsUpdate=true;if(m.instanceColor)m.instanceColor.needsUpdate=true;alpha.needsUpdate=true}};
 }
 const defaultSmokeColor=new T.Color(0x605c56);
 const sootColor=new T.Color(0x181512);
 const steamColor=new T.Color(0xe6f0fa);
 const flame=pool(420,new T.MeshBasicMaterial({map:bank.images.flame,color:0xffffff,transparent:true,opacity:.95,depthWrite:false,blending:T.AdditiveBlending}));
 const smoke=pool(1400,new T.MeshBasicMaterial({map:bank.images.smoke,color:0xffffff,transparent:true,opacity:.85,depthWrite:false}));"""

    if target_pool not in content:
        print("ERROR: target_pool not found in cinematic-effects.js")
        sys.exit(1)
    content = content.replace(target_pool, repl_pool)
    print("Patched pool and smoke material in cinematic-effects.js")

    # 2. Add steamBurst method and update begin(dt) for steam puffs
    target_begin = """  for(let i=puffs.length-1;i>=0;i--){
   const p=puffs[i];p.age+=dt;p.p.addScaledVector(p.v,dt);p.v.multiplyScalar(1-dt*.6);p.v.y+=dt*.35;
   smoke.add(p.p,p.size+p.age,p.size+p.age,(1-p.age/p.life)*.7,p.age*.1);
   if(p.age>=p.life)puffs.splice(i,1);
  }"""

    repl_begin = """  for(let i=puffs.length-1;i>=0;i--){
   const p=puffs[i];p.age+=dt;p.p.addScaledVector(p.v,dt);p.v.multiplyScalar(1-dt*.6);p.v.y+=dt*.35;
   const col=p.isSteam?steamColor:defaultSmokeColor;
   smoke.add(p.p,p.size+p.age,p.size+p.age,(1-p.age/p.life)*(p.isSteam?0.62:0.7),p.age*.1,col);
   if(p.age>=p.life)puffs.splice(i,1);
  }"""

    if target_begin not in content:
        print("ERROR: target_begin not found in cinematic-effects.js")
        sys.exit(1)
    content = content.replace(target_begin, repl_begin)
    print("Patched begin(dt) in cinematic-effects.js")

    # 3. Add steamBurst function before water
    target_water = "function water(from,to,width=.12){"
    repl_water = """function steamBurst(pos,power=1){
  const num=Math.min(24,Math.max(4,Math.round(8*power)));
  for(let i=0;i<num&&puffs.length<220;i++){
   puffs.push({
    p:pos.clone().add(new T.Vector3((Math.random()-.5)*1.8,0.2,(Math.random()-.5)*1.8)),
    v:new T.Vector3((Math.random()-.5)*1.4,3.2+Math.random()*3.8,(Math.random()-.5)*1.4),
    age:0,
    life:1.2+Math.random()*1.5,
    size:1.2+Math.random()*power*1.1,
    isSteam:true
   });
  }
 }
 function water(from,to,width=.12){"""

    if target_water not in content:
        print("ERROR: target_water not found in cinematic-effects.js")
        sys.exit(1)
    content = content.replace(target_water, repl_water)
    print("Added steamBurst in cinematic-effects.js")

    # 4. Update fire signature and smoke.add call for soot factor
    target_fire = "fire(pos,age,size=1,suppression=0,style='structure'){"
    repl_fire = "fire(pos,age,size=1,suppression=0,style='structure',sootFactor=0){"
    if target_fire not in content:
        print("ERROR: target_fire not found in cinematic-effects.js")
        sys.exit(1)
    content = content.replace(target_fire, repl_fire)

    target_smoke_add = """   const altitudeDissipation=fastTrail?1.0:Math.max(0.03,Math.pow(1.0-progress,1.45));
   const puffAlpha=Math.sin(Math.pow(progress,0.65)*Math.PI)*(fastTrail?.26:(.54-.18*suppression)*altitudeDissipation)*(1-windAtFire*.55);
   smoke.add(smokePosition,scale,scale*(fastTrail?1.20:1.28),puffAlpha,Math.sin(i*1.2+age*.25)*0.5);"""

    repl_smoke_add = """   const altitudeDissipation=fastTrail?1.0:Math.max(0.03,Math.pow(1.0-progress,1.45));
   const puffAlpha=Math.sin(Math.pow(progress,0.65)*Math.PI)*(fastTrail?.26:(.54-.18*suppression)*altitudeDissipation)*(1-windAtFire*.55);
   const sootLerp=Math.min(1.0,Math.max(0.0,sootFactor));
   const currentSmokeCol=sootLerp>0.04?defaultSmokeColor.clone().lerp(sootColor,sootLerp):defaultSmokeColor;
   smoke.add(smokePosition,scale,scale*(fastTrail?1.20:1.28),puffAlpha,Math.sin(i*1.2+age*.25)*0.5,currentSmokeCol);"""

    if target_smoke_add not in content:
        print("ERROR: target_smoke_add not found in cinematic-effects.js")
        sys.exit(1)
    content = content.replace(target_smoke_add, repl_smoke_add)
    print("Patched fire sootFactor and smoke.add in cinematic-effects.js")

    # 5. Export steamBurst and update stats
    target_ret = "return {begin,fire,setWind,water,burst,shock,dustBurst,demolitionDustWave,sparks,flush(){"
    repl_ret = "return {begin,fire,setWind,water,burst,shock,dustBurst,demolitionDustWave,sparks,steamBurst,flush(){"
    if target_ret not in content:
        print("ERROR: target_ret not found in cinematic-effects.js")
        sys.exit(1)
    content = content.replace(target_ret, repl_ret)

    target_stats = "stats:()=>({drawBatches:pools.length,puffs:puffs.length,dustPuffs:dustPuffs.length,shockwaves:rings.length,windStrength})};"
    repl_stats = "stats:()=>({drawBatches:pools.length,puffs:puffs.length,dustPuffs:dustPuffs.length,shockwaves:rings.length,windStrength,smokePuffs:smoke.n})};"
    if target_stats not in content:
        print("ERROR: target_stats not found in cinematic-effects.js")
        sys.exit(1)
    content = content.replace(target_stats, repl_stats)
    print("Exported steamBurst and smokePuffs in cinematic-effects.js")

    with open(path, "w", encoding="utf-8") as f:
        f.write(content)
    print("Successfully patched src/rendering/cinematic-effects.js")

def patch_game_js():
    path = "src/game.js"
    with open(path, "r", encoding="utf-8") as f:
        content = f.read()

    # 1. Flooded subway water pool in createCrater
    target_subway_floor = """  // Cavern Ballast Floor
  const floor=new THREE.Mesh(new THREE.BoxGeometry(W*1.15,0.45,D*1.15),ballastMat);
  floor.position.set(0,-H-0.22,0);subwayGroup.add(floor);"""

    repl_subway_floor = """  // Cavern Ballast Floor
  const floor=new THREE.Mesh(new THREE.BoxGeometry(W*1.15,0.45,D*1.15),ballastMat);
  floor.position.set(0,-H-0.22,0);subwayGroup.add(floor);

  // Flooded subterranean track sump pool
  const subwayWaterMat=new THREE.MeshStandardMaterial({color:0x0f2330,roughness:0.15,metalness:0.82,transparent:true,opacity:0.82});
  const waterPool=new THREE.Mesh(new THREE.BoxGeometry(W*0.95,0.20,D*0.90),subwayWaterMat);
  waterPool.position.set(0,-H+0.14,0);
  waterPool.name='subway-flooded-water';
  subwayGroup.add(waterPool);"""

    if target_subway_floor not in content:
        print("ERROR: target_subway_floor not found in game.js")
        sys.exit(1)
    content = content.replace(target_subway_floor, repl_subway_floor)
    print("Added flooded subway water pool in game.js")

    # 2. Subway steam burst and electric arcing in updateCraters
    target_subway_crater = """  if(c.isSubway&&c.subwayGroup){
   c.sparkTimer=(c.sparkTimer||0)+dt;
   if(c.sparkTimer>0.55){
    c.sparkTimer=0;
    cinematicFX.sparks(new THREE.Vector3(c.x+(Math.random()-.5)*1.2,-4.0,c.z+(Math.random()-.5)*1.6),Math.round(8+Math.random()*8),1.2);
    if(Math.random()<0.25)sound('spark',{x:c.x});
   }
   if(Math.random()<dt*3.5){
    cinematicFX.dustBurst(new THREE.Vector3(c.x+(Math.random()-.5)*2.0,0.2,c.z+(Math.random()-.5)*2.0),0.7,{count:4,upward:1.4});
   }
  }"""

    repl_subway_crater = """  if(c.isSubway&&c.subwayGroup){
   c.sparkTimer=(c.sparkTimer||0)+dt;
   if(c.sparkTimer>0.48){
    c.sparkTimer=0;
    cinematicFX.sparks(new THREE.Vector3(c.x+(Math.random()-.5)*1.4,-4.2,c.z+(Math.random()-.5)*1.8),Math.round(8+Math.random()*8),1.2);
    if(Math.random()<0.40)sound('electric',{x:c.x});
   }
   c.steamTimer=(c.steamTimer||0)+dt;
   if(c.steamTimer>0.24){
    c.steamTimer=0;
    cinematicFX.steamBurst?.(new THREE.Vector3(c.x+(Math.random()-.5)*1.8,-4.8,c.z+(Math.random()-.5)*1.6),1.25);
    if(Math.random()<0.35)sound('steam',{x:c.x});
   }
   if(Math.random()<dt*3.5){
    cinematicFX.dustBurst(new THREE.Vector3(c.x+(Math.random()-.5)*2.0,0.2,c.z+(Math.random()-.5)*2.0),0.7,{count:4,upward:1.4});
   }
  }"""

    if target_subway_crater not in content:
        print("ERROR: target_subway_crater not found in game.js")
        sys.exit(1)
    content = content.replace(target_subway_crater, repl_subway_crater)
    print("Added subway boiling steam and electric arcing in game.js")

    # 3. Building live wire electrical shorts audio boost
    target_building_sparks = """   cinematicFX.sparks(new THREE.Vector3(spX,spY,spZ),Math.round(6+Math.random()*8),1.2);
   if(Math.random()<0.22)sound('electric',{x:spX});
  }
  if(onSchoolStructure&&schoolDamage>0.10&&Math.random()<dt*2.5){
   const spX=(Math.random()-.5)*24;
   const spY=2.0+Math.random()*12.0;
   const spZ=-45+Math.random()*42;
   cinematicFX.sparks(new THREE.Vector3(spX,spY,spZ),Math.round(8+Math.random()*10),1.3);
   if(Math.random()<0.25)sound('electric',{x:spX});
  }"""

    repl_building_sparks = """   cinematicFX.sparks(new THREE.Vector3(spX,spY,spZ),Math.round(6+Math.random()*8),1.2);
   if(Math.random()<0.45)sound('electric',{x:spX});
  }
  if(onSchoolStructure&&schoolDamage>0.10&&Math.random()<dt*2.5){
   const spX=(Math.random()-.5)*24;
   const spY=2.0+Math.random()*12.0;
   const spZ=-45+Math.random()*42;
   cinematicFX.sparks(new THREE.Vector3(spX,spY,spZ),Math.round(8+Math.random()*10),1.3);
   if(Math.random()<0.50)sound('electric',{x:spX});
  }"""

    if target_building_sparks not in content:
        print("ERROR: target_building_sparks not found in game.js")
        sys.exit(1)
    content = content.replace(target_building_sparks, repl_building_sparks)
    print("Boosted electrical short audio probability in game.js")

    # 4. Fire sootFactor calculation in updateFires
    target_fire_call = "cinematicFX.fire(f.root.position,f.age,f.size,f.suppression);"
    repl_fire_call = """const fireSoot=bldg?Math.min(1.0,(bldg.fireDamage||0)*1.6+(bldg.damage||0)*0.5):(onSchoolStructure?Math.min(1.0,schoolDamage*1.5):(f.age>6.0?0.65:0.20));
  cinematicFX.fire(f.root.position,f.age,f.size,f.suppression,'structure',fireSoot);"""

    if target_fire_call not in content:
        print("ERROR: target_fire_call not found in game.js")
        sys.exit(1)
    content = content.replace(target_fire_call, repl_fire_call)
    print("Passed fireSoot to cinematicFX.fire in game.js")

    # 5. QA helpers on window.__DD_QA
    target_qa_helpers = "collapseSchool:()=>schoolReconstruction?.collapse(),getFurnitureDebrisCount:()=>debris.filter(d=>d.isFurnitureDebris).length,"
    repl_qa_helpers = "collapseSchool:()=>schoolReconstruction?.collapse(),hasFloodedSubwayWater:()=>craters.some(c=>c.subwayGroup?.getObjectByName?.('subway-flooded-water')),getCratersWithSteam:()=>craters.filter(c=>c.isSubway&&c.subwayGroup).length,getSmokeStats:()=>cinematicFX.stats?.(),getFurnitureDebrisCount:()=>debris.filter(d=>d.isFurnitureDebris).length,"

    if target_qa_helpers not in content:
        print("ERROR: target_qa_helpers not found in game.js")
        sys.exit(1)
    content = content.replace(target_qa_helpers, repl_qa_helpers)
    print("Added RC147 QA helpers in game.js")

    with open(path, "w", encoding="utf-8") as f:
        f.write(content)
    print("Successfully patched src/game.js")

if __name__ == "__main__":
    patch_cinematic_effects()
    patch_game_js()
    print("All RC147 patches applied successfully!")
