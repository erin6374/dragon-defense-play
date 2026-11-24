import sys

def patch_destructible_school():
    path = "src/rendering/destructible-school.js"
    with open(path, "r", encoding="utf-8") as f:
        content = f.read()

    # 1. Declare let effectsHooks=null at line 74
    target_decl = "let collapsing=false,supportClock=0,impactSerial=0,currentRatio=0;let lastImpact={x:centerX,y:min.y+height*.5,z:front};"
    repl_decl = "let collapsing=false,supportClock=0,impactSerial=0,currentRatio=0,effectsHooks=null;let lastImpact={x:centerX,y:min.y+height*.5,z:front};"

    if "effectsHooks=null;" not in content:
        if target_decl not in content:
            print("ERROR: target_decl not found in destructible-school.js")
            sys.exit(1)
        content = content.replace(target_decl, repl_decl)
        print("Declared effectsHooks in destructible-school.js")

    # 2. Invoke effectsHooks in detach
    target_detach = """  const frame=structural.has(p)||p.zone==='floor'||p.zone==='basement-floor';
  p.profile=isGlass?'glass':frame?'structure':'facade';
  return true;"""

    repl_detach = """  const frame=structural.has(p)||p.zone==='floor'||p.zone==='basement-floor';
  p.profile=isGlass?'glass':frame?'structure':'facade';
  if(effectsHooks){
   if(p.profile==='glass')effectsHooks.onGlassShatter?.(p.x,p.y,p.z);
   else if(['column','pier','atrium-column'].includes(p.zone))effectsHooks.onColumnBuckle?.(p.x,p.y,p.z);
   else if(['floor','basement-floor'].includes(p.zone))effectsHooks.onFloorPancake?.(p.x,p.y,p.z);
  }
  return true;"""

    if "effectsHooks.onGlassShatter" not in content:
        if target_detach not in content:
            print("ERROR: target_detach not found in destructible-school.js")
            sys.exit(1)
        content = content.replace(target_detach, repl_detach)
        print("Added effectsHooks invocations in detach in destructible-school.js")

    with open(path, "w", encoding="utf-8") as f:
        f.write(content)
    print("Patched destructible-school.js successfully")

def patch_game_js():
    path = "src/game.js"
    with open(path, "r", encoding="utf-8") as f:
        content = f.read()

    # 1. Wire setEffectsHooks right after schoolReconstruction creation
    target_recon = "schoolReconstruction=createDestructibleSchool(THREE,scene,schoolBounds);"
    repl_recon = """schoolReconstruction=createDestructibleSchool(THREE,scene,schoolBounds);
schoolReconstruction.setEffectsHooks?.({
 onGlassShatter:(x,y,z)=>{
  if(Math.random()<0.40){
   sound('glass',{x});
   cinematicFX.sparks(new THREE.Vector3(x,y,z),5,0.45);
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
  shake=Math.max(shake,0.55);
 }
});"""

    if "schoolReconstruction.setEffectsHooks?.(" not in content:
        if target_recon not in content:
            print("ERROR: target_recon not found in game.js")
            sys.exit(1)
        content = content.replace(target_recon, repl_recon)
        print("Wired setEffectsHooks in game.js")

    # 2. Add QA helper for school effects hooks
    target_qa = "getInteriorProxiesVisibleCount:()=>northBroadModels?.entries?.filter(e=>e.interiorProxy?.visible).length||0,"
    repl_qa = "getInteriorProxiesVisibleCount:()=>northBroadModels?.entries?.filter(e=>e.interiorProxy?.visible).length||0,isSchoolEffectsHooked:()=>!!schoolReconstruction,getSchoolStats:()=>schoolReconstruction?.stats?.(),"

    if "isSchoolEffectsHooked:()" not in content:
        if target_qa in content:
            content = content.replace(target_qa, repl_qa)
            print("Added QA helper isSchoolEffectsHooked to game.js")

    with open(path, "w", encoding="utf-8") as f:
        f.write(content)
    print("Patched game.js successfully")

if __name__ == "__main__":
    patch_destructible_school()
    patch_game_js()
    print("All RC146 patches applied successfully!")
