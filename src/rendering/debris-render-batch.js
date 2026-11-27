// Render-only instancing for ordinary opaque box debris. Physics, ownership,
// lifetime, collision and diagnostic meshes remain untouched outside draw().
export function createDebrisRenderBatch(T,scene,geometry,materials,capacity=220){
 const allowed=new Set(materials),groups=new Map(),hidden=[];
 const stats={eligible:0,batched:0,batches:0,savedDraws:0,enabled:false};
 function render(debris,draw,{enabled=true,shadows=false}={}){
  stats.eligible=stats.batched=stats.batches=stats.savedDraws=0;
  stats.enabled=!!(enabled&&!shadows);
  if(!stats.enabled)return draw();
  for(const g of groups.values())g.items.length=0;
  try{
   for(const d of debris){
    const m=d.mesh,mat=m?.material;
    if(!m?.isMesh||m.isInstancedMesh||!m.visible||m.parent!==scene||m.geometry!==geometry||
      d.ownsGeometry||!allowed.has(mat)||mat.transparent||!mat.depthWrite||
      m.children.length||m.castShadow||m.receiveShadow||m.renderOrder!==0||m.layers.mask!==1)continue;
    if(m.onBeforeRender!==T.Object3D.prototype.onBeforeRender||m.onAfterRender!==T.Object3D.prototype.onAfterRender)continue;
    let g=groups.get(mat);
    if(!g){g={items:[],mesh:null};groups.set(mat,g);}
    if(g.items.length>=capacity)continue;
    g.items.push(m);stats.eligible++;
   }
   for(const [mat,g] of groups){
    if(g.items.length<2)continue;
    if(!g.mesh){
     g.mesh=new T.InstancedMesh(geometry,mat,capacity);
     g.mesh.name='opaque-debris-render-batch';g.mesh.count=0;g.mesh.visible=false;
     g.mesh.frustumCulled=false;g.mesh.instanceMatrix.setUsage(T.DynamicDrawUsage);
     scene.add(g.mesh);
    }
    for(let i=0;i<g.items.length;i++){
     const m=g.items[i];if(m.matrixAutoUpdate)m.updateMatrix();
     g.mesh.setMatrixAt(i,m.matrix);
     hidden.push(m);m.visible=false;
    }
    g.mesh.count=g.items.length;g.mesh.instanceMatrix.clearUpdateRanges();
    g.mesh.instanceMatrix.addUpdateRange(0,g.items.length*16);g.mesh.instanceMatrix.needsUpdate=true;g.mesh.visible=true;
    stats.batched+=g.items.length;stats.batches++;stats.savedDraws+=g.items.length-1;
   }
   return draw();
  }finally{
   for(const m of hidden)m.visible=true;
   hidden.length=0;
   for(const g of groups.values()){
    if(g.mesh){g.mesh.visible=false;g.mesh.count=0;}
    g.items.length=0;
   }
  }
 }
 function dispose(){for(const g of groups.values())if(g.mesh){g.mesh.removeFromParent();g.mesh.dispose();}groups.clear();}
 return {render,stats:()=>({...stats}),dispose};
}
