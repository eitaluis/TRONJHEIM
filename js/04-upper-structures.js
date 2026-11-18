// ============================================================================
// FASES 5–6 — VOL TURIN, ISIDAR MITHRIM E DRAGONHOLD
// Referência narrativa: Eragon, Christopher Paolini.
// [LIVRO] Vol Turin é uma escadaria única e ininterrupta junto à parede da
// câmara central; uma calha lisa acompanha o percurso. Isidar Mithrim é a
// safira em forma de rosa que coroa a câmara e forma o piso do Dragonhold.
// Dragonhold é circular, aberto ao céu, com cavernas nas paredes e rungs
// metálicos. [INTERPRETAÇÃO] perfil do afunilamento, número de voltas e planta.
// ============================================================================

const ISIDAR_DIMENSION = 18.288; // 20 jardas: diâmetro e espessura aproximada.
const DRAGONHOLD_DIMENSION = 18.288; // 60 pés: diâmetro e altura.
const DRAGONHOLD_RADIUS = DRAGONHOLD_DIMENSION / 2;
const DRAGONHOLD_OUTER_RADIUS = 12.4;
const VOL_TURIN_START_ANGLE = Math.PI * 0.16;
const VOL_TURIN_TURNS = 42;
const VOL_TURIN_WALL_TOP_RADIUS = 34;
const VOL_TURIN_WALL_BASE_RADIUS = CENTRAL_WALL_RADIUS;
const VOL_TURIN_BASE_Y = ENTRY_HALL_FLOOR;
const TRONJHEIM_TOP_Y = -8 + CITY.height;
const VOL_TURIN_TOP_Y = TRONJHEIM_TOP_Y - DRAGONHOLD_DIMENSION;
const CENTRAL_CHAMBER_TOP_Y = VOL_TURIN_TOP_Y - ISIDAR_DIMENSION;
const VOL_TURIN_HEIGHT = VOL_TURIN_TOP_Y - VOL_TURIN_BASE_Y;
const VOL_TURIN_STEP_COUNT = Math.ceil(VOL_TURIN_HEIGHT / 0.205);
const VOL_TURIN_STEP_RISE = VOL_TURIN_HEIGHT / VOL_TURIN_STEP_COUNT;
const VOL_TURIN_TOTAL_ANGLE = VOL_TURIN_TURNS * Math.PI * 2;
const VOL_TURIN_STEP_HALF_WIDTH = 2.6;
const VOL_TURIN = {
  baseY: VOL_TURIN_BASE_Y,
  topY: VOL_TURIN_TOP_Y,
  height: VOL_TURIN_HEIGHT,
  baseWallRadius: VOL_TURIN_WALL_BASE_RADIUS,
  topWallRadius: VOL_TURIN_WALL_TOP_RADIUS,
  turns: VOL_TURIN_TURNS,
  steps: VOL_TURIN_STEP_COUNT,
  stepRise: VOL_TURIN_STEP_RISE,
  startAngle: VOL_TURIN_START_ANGLE,
  totalAngle: VOL_TURIN_TOTAL_ANGLE,
  halfWidth: VOL_TURIN_STEP_HALF_WIDTH
};

function volTurinWallRadiusAtProgress(t) {
  return THREE.MathUtils.lerp(VOL_TURIN_WALL_BASE_RADIUS, VOL_TURIN_WALL_TOP_RADIUS, THREE.MathUtils.clamp(t,0,1));
}
function volTurinStairRadiusAtProgress(t) {
  return volTurinWallRadiusAtProgress(t) - 9.0;
}
function volTurinSlideRadiusAtProgress(t) {
  return volTurinWallRadiusAtProgress(t) - 2.4;
}
function volTurinPointAtProgress(t, offsetRadius=0) {
  const a=VOL_TURIN_START_ANGLE+VOL_TURIN_TOTAL_ANGLE*t;
  const y=VOL_TURIN_BASE_Y+VOL_TURIN_HEIGHT*t;
  const r=volTurinStairRadiusAtProgress(t)+offsetRadius;
  return new THREE.Vector3(Math.cos(a)*r,y,Math.sin(a)*r);
}
// Resolve a Vol Turin tread only when the player is already at that tread's
// elevation. The old X/Z-only lookup confused the central chamber floor with
// the spiral stair because the stair winds through many overlapping radii.
function volTurinStepDepthAtProgress(t) {
  const radius=volTurinStairRadiusAtProgress(t);
  const run=radius*VOL_TURIN_TOTAL_ANGLE/VOL_TURIN_STEP_COUNT;
  // The tread reaches almost to the next tread: no long unsupported gaps.
  return Math.max(.62,run*.97);
}
function volTurinFloorAtXZ(x,z,referenceFeetY=null) {
  if(referenceFeetY===null || !Number.isFinite(referenceFeetY))return null;
  const radius=Math.hypot(x,z);
  const angle=Math.atan2(z,x);
  const phase=((angle-VOL_TURIN_START_ANGLE)%(Math.PI*2)+Math.PI*2)%(Math.PI*2);
  const radialHalf=2.6;
  const maxVerticalSnap=Math.max(.55,VOL_TURIN_STEP_RISE*2.6);
  let bestFloor=null,bestScore=Infinity;

  // Each revolution has the same angle, but a different radius and elevation.
  // Test the possible windings, then confirm against the real rectangular tread.
  for(let turn=0;turn<=VOL_TURIN_TURNS;turn++){
    const progress=(phase+turn*Math.PI*2)/VOL_TURIN_TOTAL_ANGLE;
    if(progress<0||progress>1)continue;
    const approxIndex=Math.round(progress*VOL_TURIN_STEP_COUNT-.5);
    for(let index=Math.max(0,approxIndex-1);index<=Math.min(VOL_TURIN_STEP_COUNT-1,approxIndex+1);index++){
      const t=(index+.5)/VOL_TURIN_STEP_COUNT;
      const centerAngle=VOL_TURIN_START_ANGLE+VOL_TURIN_TOTAL_ANGLE*t;
      const angularOffset=Math.atan2(Math.sin(angle-centerAngle),Math.cos(angle-centerAngle));
      const centerRadius=volTurinStairRadiusAtProgress(t);
      const radialOffset=Math.abs(radius-centerRadius);
      const tangentOffset=Math.abs(angularOffset)*centerRadius;
      const depth=volTurinStepDepthAtProgress(t);
      if(radialOffset>radialHalf+.22 || tangentOffset>depth/2+.22)continue;

      // The mesh top is the tread center height minus 1 cm (its 34 cm slab).
      const treadTop=VOL_TURIN_BASE_Y+(index+.5)*VOL_TURIN_STEP_RISE-.01;
      const verticalOffset=Math.abs(treadTop-referenceFeetY);
      if(verticalOffset>maxVerticalSnap)continue;
      const score=(radialOffset/radialHalf)**2+(tangentOffset/(depth/2+.22))**2+
        (verticalOffset/maxVerticalSnap)**2*1.6;
      if(score<bestScore){bestScore=score;bestFloor=treadTop;}
    }
  }
  return bestFloor;
}
function volTurinTopLandingContains(x,z) {
  const r=Math.hypot(x,z),a=Math.atan2(z,x);
  const exit=VOL_TURIN_START_ANGLE;
  const d=Math.abs(Math.atan2(Math.sin(a-exit),Math.cos(a-exit)));
  return r>DRAGONHOLD_OUTER_RADIUS+0.5 && r<volTurinSlideRadiusAtProgress(1)+3 && d*r<5.5;
}
function dragonholdCaveContains(x,z,cave) {
  const r=Math.hypot(x,z),a=Math.atan2(z,x);
  const d=Math.abs(Math.atan2(Math.sin(a-cave.angle),Math.cos(a-cave.angle)));
  const radialStart=DRAGONHOLD_OUTER_RADIUS-0.5;
  const radialEnd=DRAGONHOLD_OUTER_RADIUS+cave.depth;
  return r>=radialStart && r<=radialEnd && d*r<=cave.width/2+0.8;
}
const DRAGONHOLD_CAVES = [
  {id:"saphira",angle:4.72,width:7.4,height:6.0,bottom:2.2,depth:15.5,kind:"dragon"},
  {id:"great",angle:2.45,width:9.0,height:9.4,bottom:1.2,depth:20.0,kind:"great"},
  {id:"mediumA",angle:4.05,width:5.8,height:5.5,bottom:2.0,depth:11.5,kind:"medium"},
  {id:"niche1",angle:1.55,width:2.3,height:2.8,bottom:3.0,depth:4.0,kind:"small"},
  {id:"niche2",angle:3.58,width:2.0,height:2.6,bottom:3.2,depth:3.8,kind:"small"},
  {id:"niche3",angle:5.95,width:2.4,height:2.9,bottom:3.1,depth:4.4,kind:"small"},
  {id:"exit",angle:VOL_TURIN_START_ANGLE,width:6.6,height:14.5,bottom:1.8,depth:8.0,kind:"exit"}
];
function dragonholdWalkableContains(x,z) {
  if(Math.hypot(x,z)<=DRAGONHOLD_RADIUS-0.5)return true;
  return DRAGONHOLD_CAVES.some(c=>dragonholdCaveContains(x,z,c));
}
function isDragonholdExitBridge(x,z) {
  const a=Math.atan2(z,x),exit=VOL_TURIN_START_ANGLE;
  const delta=Math.abs(Math.atan2(Math.sin(a-exit),Math.cos(a-exit)));
  const r=Math.hypot(x,z);
  return r>DRAGONHOLD_OUTER_RADIUS-0.5 && r<volTurinSlideRadiusAtProgress(1)+5 && delta*r<7.0;
}

// ---------------------------------------------------------------------------
// TAPERED CHAMBER WALL: repeated open arches continue toward the peak.
// The stair and slide sit directly behind these openings.
// ---------------------------------------------------------------------------
function buildVolTurinArcadeShaft() {
  const startY=VOL_TURIN_BASE_Y+110;
  const endY=CENTRAL_CHAMBER_TOP_Y;
  const startRadius=VOL_TURIN_WALL_BASE_RADIUS;
  const endRadius=VOL_TURIN_WALL_TOP_RADIUS;
  const radialSegments=384,verticalSegments=448;
  const positions=[],indices=[];
  const rowCount=VOL_TURIN_TURNS+1;
  const levelHeight=(endY-startY)/rowCount;

  function windowFor(angle,yMid,radius) {
    const level=Math.floor((yMid-startY)/levelHeight);
    if(level<0 || level>=rowCount)return false;
    const localY=yMid-(startY+level*levelHeight);
    if(localY<3 || localY>22.5)return false;
    const count=Math.max(8,Math.floor((2*Math.PI*radius)/14.5));
    const step=Math.PI*2/count;
    const center=Math.round(angle/step)*step;
    const delta=Math.abs(Math.atan2(Math.sin(angle-center),Math.cos(angle-center)))*radius;
    const halfWidth=Math.min(5.4,radius*step*.36);
    if(localY<=14.2)return delta<halfWidth;
    const rise=localY-14.2;
    if(rise>halfWidth)return false;
    return delta<Math.sqrt(Math.max(0,halfWidth*halfWidth-rise*rise));
  }

  for(let j=0;j<=verticalSegments;j++){
    const v=j/verticalSegments,y=startY+(endY-startY)*v;
    const radius=THREE.MathUtils.lerp(startRadius,endRadius,v);
    for(let i=0;i<=radialSegments;i++){
      const a=i/radialSegments*Math.PI*2;
      positions.push(Math.cos(a)*radius,y,Math.sin(a)*radius);
    }
  }
  for(let j=0;j<verticalSegments;j++){
    const vm=(j+.5)/verticalSegments,ym=startY+(endY-startY)*vm;
    const radius=THREE.MathUtils.lerp(startRadius,endRadius,vm);
    for(let i=0;i<radialSegments;i++){
      const a=(i+.5)/radialSegments*Math.PI*2;
      if(windowFor(a,ym,radius))continue;
      const v0=j*(radialSegments+1)+i,v1=v0+radialSegments+1;
      indices.push(v0,v1,v0+1,v0+1,v1,v1+1);
    }
  }
  const geo=new THREE.BufferGeometry();
  geo.setAttribute("position",new THREE.Float32BufferAttribute(positions,3));
  geo.setIndex(indices);geo.computeVertexNormals();
  const wallMat=new THREE.MeshStandardMaterial({color:0xd4d5d2,roughness:.42,metalness:.035,side:THREE.DoubleSide});
  const wall=new THREE.Mesh(geo,wallMat);wall.receiveShadow=true;wall.castShadow=true;scene.add(wall);

  // Repeated arch jambs and voussoirs are instanced rather than thousands of
  // independent meshes. Each level has a diminishing number of arches.
  const pierGeo=new THREE.BoxGeometry(1.15,14.2,1.35);
  const pierMat=new THREE.MeshStandardMaterial({color:0x702b34,roughness:.42,metalness:.06});
  const archGeo=new THREE.TorusGeometry(1,.55,8,18,Math.PI);
  const archMat=new THREE.MeshStandardMaterial({color:0xe1ded5,roughness:.34,metalness:.04});
  let totalOpenings=0;
  const layout=[];
  for(let level=0;level<rowCount;level++){
    const t=(level+.5)/rowCount;
    const y=startY+level*levelHeight+3;
    const radius=THREE.MathUtils.lerp(startRadius,endRadius,(y-startY)/(endY-startY));
    const count=Math.max(8,Math.floor((2*Math.PI*radius)/14.5));
    const halfWidth=Math.min(5.4,radius*(Math.PI*2/count)*.36);
    totalOpenings+=count;
    for(let n=0;n<count;n++)layout.push({angle:n*Math.PI*2/count+(level%2)*Math.PI/count,radius,y,halfWidth});
  }
  const piers=new THREE.InstancedMesh(pierGeo,pierMat,totalOpenings*2);
  const arches=new THREE.InstancedMesh(archGeo,archMat,totalOpenings);
  const dummy=new THREE.Object3D();let pIndex=0,aIndex=0;
  for(const item of layout){
    const tangentOffset=item.halfWidth/item.radius;
    for(const side of [-1,1]){
      const angle=item.angle+side*tangentOffset;
      dummy.position.set(Math.cos(angle)*(item.radius-.2),item.y+7.1,Math.sin(angle)*(item.radius-.2));
      dummy.rotation.set(0,-item.angle-Math.PI/2,0);
      dummy.updateMatrix();piers.setMatrixAt(pIndex++,dummy.matrix);
    }
    dummy.position.set(Math.cos(item.angle)*(item.radius-.12),item.y+14.2,Math.sin(item.angle)*(item.radius-.12));
    dummy.rotation.set(0,-item.angle-Math.PI/2,0);
    dummy.scale.set(item.halfWidth, item.halfWidth, 1);
    dummy.updateMatrix();arches.setMatrixAt(aIndex++,dummy.matrix);
    dummy.scale.set(1,1,1);
  }
  piers.instanceMatrix.needsUpdate=true;arches.instanceMatrix.needsUpdate=true;
  scene.add(piers,arches);

  // A few pale stone ribs and low lanterns make the repeating levels legible.
  const ribGeo=new THREE.TorusGeometry(1,.65,8,128);
  const ribMat=new THREE.MeshStandardMaterial({color:0xbebcb4,roughness:.46});
  const ribs=new THREE.InstancedMesh(ribGeo,ribMat,rowCount);
  for(let level=0;level<rowCount;level++){
    const y=startY+level*levelHeight+1.4;
    const v=(y-startY)/(endY-startY);
    const radius=THREE.MathUtils.lerp(startRadius,endRadius,v);
    dummy.position.set(0,y,0);dummy.rotation.set(Math.PI/2,0,0);dummy.scale.set(radius,radius,1);dummy.updateMatrix();
    ribs.setMatrixAt(level,dummy.matrix);
  }
  ribs.instanceMatrix.needsUpdate=true;scene.add(ribs);
}

// ---------------------------------------------------------------------------
// VOL TURIN: one helical stair all the way from the chamber floor to Isidar.
// The narrow, polished trough runs beside the stair and has an open U profile.
// ---------------------------------------------------------------------------
function buildVolTurinStaircase() {
  const treadMat=new THREE.MeshStandardMaterial({color:0xdad9d2,roughness:.34,metalness:.03});
  const treadEdgeMat=new THREE.MeshStandardMaterial({color:0x9b7844,roughness:.29,metalness:.7});
  const stairGeo=new THREE.BoxGeometry(5.2,.34,1);
  const steps=new THREE.InstancedMesh(stairGeo,treadMat,VOL_TURIN_STEP_COUNT);
  const edges=new THREE.InstancedMesh(new THREE.BoxGeometry(5.15,.09,1),treadEdgeMat,VOL_TURIN_STEP_COUNT);
  const dummy=new THREE.Object3D();
  for(let i=0;i<VOL_TURIN_STEP_COUNT;i++){
    const t=(i+.5)/VOL_TURIN_STEP_COUNT;
    const point=volTurinPointAtProgress(t);
    const radius=volTurinStairRadiusAtProgress(t);
    const depth=volTurinStepDepthAtProgress(t);
    dummy.position.set(point.x,point.y-.18,point.z);
    dummy.rotation.set(0,-(VOL_TURIN_START_ANGLE+VOL_TURIN_TOTAL_ANGLE*t),0);
    dummy.scale.set(1,1,depth);dummy.updateMatrix();steps.setMatrixAt(i,dummy.matrix);
    dummy.position.y=point.y-.055;dummy.scale.set(1,1,depth);dummy.updateMatrix();edges.setMatrixAt(i,dummy.matrix);
  }
  steps.instanceMatrix.needsUpdate=true;edges.instanceMatrix.needsUpdate=true;
  steps.computeBoundingSphere();edges.computeBoundingSphere();scene.add(steps,edges);

  // Two continuous handrails follow the helical path. The supports are instanced.
  const railMat=new THREE.MeshStandardMaterial({color:0x9f804f,metalness:.76,roughness:.26});
  const postMat=new THREE.MeshStandardMaterial({color:0x777d7e,metalness:.72,roughness:.34});
  const railGeometry=new THREE.CylinderGeometry(.16,.18,1.15,8);
  const postsPerSide=Math.ceil(VOL_TURIN_STEP_COUNT/18)+1;
  for(const side of [-1,1]){
    const points=[];
    const postInstances=new THREE.InstancedMesh(railGeometry,postMat,postsPerSide);
    let postIndex=0;
    for(let i=0;i<=VOL_TURIN_STEP_COUNT;i+=18){
      const t=Math.min(1,i/VOL_TURIN_STEP_COUNT);
      const a=VOL_TURIN_START_ANGLE+VOL_TURIN_TOTAL_ANGLE*t;
      const y=VOL_TURIN_BASE_Y+VOL_TURIN_HEIGHT*t+.58;
      const radius=volTurinStairRadiusAtProgress(t)+side*2.45;
      const x=Math.cos(a)*radius,z=Math.sin(a)*radius;
      points.push(new THREE.Vector3(x,y+.5,z));
      dummy.position.set(x,y,z);dummy.rotation.set(0,0,0);dummy.updateMatrix();
      postInstances.setMatrixAt(postIndex++,dummy.matrix);
    }
    postInstances.count=postIndex;postInstances.instanceMatrix.needsUpdate=true;scene.add(postInstances);
    const curve=new THREE.CatmullRomCurve3(points,false,"centripetal");
    const rail=new THREE.Mesh(new THREE.TubeGeometry(curve,Math.max(1200,VOL_TURIN_TURNS*130),.28,7,false),railMat);
    scene.add(rail);
  }

  // Lower landing meets the exact top surface of tread 0.
  const firstT=.5/VOL_TURIN_STEP_COUNT;
  const firstPoint=volTurinPointAtProgress(firstT);
  const firstTop=VOL_TURIN_BASE_Y+.5*VOL_TURIN_STEP_RISE-.01;
  const landing=new THREE.Mesh(
    new THREE.CylinderGeometry(7.7,8.0,.34,64),
    new THREE.MeshStandardMaterial({color:0xc8c5bc,roughness:.38,metalness:.025})
  );
  landing.position.set(firstPoint.x,firstTop-.17,firstPoint.z);
  landing.receiveShadow=true;landing.castShadow=true;scene.add(landing);
}

// Open-topped U-shaped polished trough. This is a channel, not a closed pipe.
function buildVolTurinSlide() {
  const longitudinal=1900;
  const profile=[
    [-.82,.55],[-.68,.26],[-.43,.08],[0,0],[.43,.08],[.68,.26],[.82,.55]
  ];
  const positions=[],indices=[];
  function centerAt(t){
    const a=VOL_TURIN_START_ANGLE+VOL_TURIN_TOTAL_ANGLE*t;
    const y=VOL_TURIN_BASE_Y+VOL_TURIN_HEIGHT*t+1.0;
    const r=volTurinSlideRadiusAtProgress(t);
    return new THREE.Vector3(Math.cos(a)*r,y,Math.sin(a)*r);
  }
  for(let i=0;i<=longitudinal;i++){
    const t=i/longitudinal;
    const center=centerAt(t);
    const before=centerAt(Math.max(0,t-.0005)),after=centerAt(Math.min(1,t+.0005));
    const tangent=after.sub(before).normalize();
    const upWorld=new THREE.Vector3(0,1,0);
    const side=new THREE.Vector3().crossVectors(tangent,upWorld).normalize();
    const up=new THREE.Vector3().crossVectors(side,tangent).normalize();
    for(const [u,v] of profile){
      const p=center.clone().addScaledVector(side,u).addScaledVector(up,v);
      positions.push(p.x,p.y,p.z);
    }
  }
  for(let i=0;i<longitudinal;i++)for(let j=0;j<profile.length-1;j++){
    const a=i*profile.length+j,b=a+profile.length;
    indices.push(a,b,a+1,a+1,b,b+1);
  }
  const geo=new THREE.BufferGeometry();
  geo.setAttribute("position",new THREE.Float32BufferAttribute(positions,3));
  geo.setIndex(indices);geo.computeVertexNormals();
  const stoneMat=new THREE.MeshStandardMaterial({color:0xaaaead,roughness:.12,metalness:.2,side:THREE.DoubleSide});
  const trough=new THREE.Mesh(geo,stoneMat);trough.receiveShadow=true;scene.add(trough);

  // Raised lips on both sides give the trough a distinct cut-stone silhouette.
  const lipMat=new THREE.MeshStandardMaterial({color:0xc5c6c0,roughness:.18,metalness:.16});
  for(const sideSign of [-1,1]){
    const points=[];
    for(let i=0;i<=700;i++){
      const t=i/700,center=centerAt(t);
      const before=centerAt(Math.max(0,t-.0008)),after=centerAt(Math.min(1,t+.0008));
      const tangent=after.sub(before).normalize();
      const side=new THREE.Vector3().crossVectors(tangent,new THREE.Vector3(0,1,0)).normalize();
      const up=new THREE.Vector3().crossVectors(side,tangent).normalize();
      points.push(center.clone().addScaledVector(side,sideSign*.82).addScaledVector(up,.55));
    }
    const curve=new THREE.CatmullRomCurve3(points,false,"centripetal");
    scene.add(new THREE.Mesh(new THREE.TubeGeometry(curve,2600,.18,6,false),lipMat));
  }

  // Leather pads are stored beside the upper mouth of the dangerous slide.
  const leather=new THREE.MeshStandardMaterial({color:0x3c241b,roughness:.86});
  const padGeo=new THREE.BoxGeometry(1.25,.12,1.55);
  const pads=new THREE.InstancedMesh(padGeo,leather,12);
  const start=centerAt(1);
  for(let i=0;i<12;i++){
    dummy.position.set(start.x-2.1+(i%3)*.75,start.y+1.0+Math.floor(i/3)*.16,start.z-1.3+Math.floor(i/3)*.75);
    dummy.rotation.set(.02,((i%3)-1)*.05,0);dummy.updateMatrix();pads.setMatrixAt(i,dummy.matrix);
  }
  pads.instanceMatrix.needsUpdate=true;scene.add(pads);
}

// ---------------------------------------------------------------------------
// ISIDAR MITHRIM — intact Star Rose state, before the Battle of Farthen Dûr.
// The gemstone is a large dawn-red star sapphire, with carved overlapping petals.
// ---------------------------------------------------------------------------
function makeRosePetalGeometry(length,width,height,segments=18) {
  const positions=[],indices=[],across=8;
  for(let i=0;i<=segments;i++){
    const t=i/segments;
    const r=.35+t*length;
    const w=width*Math.pow(Math.sin(Math.PI*t),.72);
    for(let j=0;j<=across;j++){
      const u=j/across*2-1;
      const x=r;
      const z=u*w*.5;
      const y=height*(.22+.78*Math.sin(Math.PI*t)) + .9*u*u*Math.sin(Math.PI*t);
      positions.push(x,y,z);
    }
  }
  for(let i=0;i<segments;i++)for(let j=0;j<across;j++){
    const a=i*(across+1)+j,b=a+across+1;
    indices.push(a,b,a+1,a+1,b,b+1);
  }
  const g=new THREE.BufferGeometry();
  g.setAttribute("position",new THREE.Float32BufferAttribute(positions,3));
  g.setIndex(indices);g.computeVertexNormals();return g;
}
function buildIsidarMithrim() {
  const gemBottom=CENTRAL_CHAMBER_TOP_Y;
  const gemCenterY=gemBottom+ISIDAR_DIMENSION/2;
  const gemTop=gemBottom+ISIDAR_DIMENSION;
  const gemGroup=new THREE.Group();gemGroup.position.y=gemCenterY;scene.add(gemGroup);
  const gemMat=new THREE.MeshPhysicalMaterial({
    color:0xc84d72,roughness:.14,metalness:.1,transparent:true,opacity:.78,
    transmission:.18,thickness:5,ior:1.45,clearcoat:.8,clearcoatRoughness:.12,
    emissive:0x59112b,emissiveIntensity:.26
  });
  const body=new THREE.Mesh(new THREE.SphereGeometry(1,56,36),gemMat);
  body.scale.set(ISIDAR_DIMENSION/2,ISIDAR_DIMENSION/2,ISIDAR_DIMENSION/2);
  gemGroup.add(body);

  // Twelve broad outer petals and eight smaller inner petals create a rose,
  // rather than a generic pointed crystal.
  const outerMat=new THREE.MeshPhysicalMaterial({
    color:0xd96e8f,roughness:.17,metalness:.12,transparent:true,opacity:.82,
    transmission:.12,thickness:1.3,clearcoat:.8,emissive:0x6d1f3a,emissiveIntensity:.3,
    side:THREE.DoubleSide
  });
  const innerMat=new THREE.MeshPhysicalMaterial({
    color:0xf09ab0,roughness:.13,metalness:.08,transparent:true,opacity:.86,
    transmission:.18,thickness:1,clearcoat:1,emissive:0x8b2d50,emissiveIntensity:.34,
    side:THREE.DoubleSide
  });
  const outerPetal=makeRosePetalGeometry(7.55,4.9,1.65,22);
  const innerPetal=makeRosePetalGeometry(4.8,3.8,2.5,18);
  for(let i=0;i<12;i++){
    const angle=i*Math.PI/6;
    const petal=new THREE.Mesh(outerPetal,outerMat);
    petal.rotation.y=-angle;petal.position.set(0,7.1,0);gemGroup.add(petal);
  }
  for(let i=0;i<8;i++){
    const angle=i*Math.PI/4+Math.PI/8;
    const petal=new THREE.Mesh(innerPetal,innerMat);
    petal.rotation.y=-angle;petal.position.set(0,7.7,0);gemGroup.add(petal);
  }
  const heartMat=new THREE.MeshPhysicalMaterial({color:0xf8bed0,roughness:.08,metalness:.12,emissive:0xf08baa,emissiveIntensity:.65,clearcoat:1});
  const heart=new THREE.Mesh(new THREE.IcosahedronGeometry(2.0,2),heartMat);
  heart.scale.set(1.05,.65,1.05);heart.position.y=8.55;gemGroup.add(heart);
  const starShape=new THREE.Shape();
  for(let i=0;i<24;i++){
    const a=i/24*Math.PI*2-Math.PI/2,r=i%2===0?4.1:1.2;
    const x=Math.cos(a)*r,z=Math.sin(a)*r;
    if(i===0)starShape.moveTo(x,z);else starShape.lineTo(x,z);
  }
  starShape.closePath();
  const star=new THREE.Mesh(new THREE.ShapeGeometry(starShape),new THREE.MeshBasicMaterial({color:0xffd5df,transparent:true,opacity:.44,side:THREE.DoubleSide}));
  star.rotation.x=-Math.PI/2;star.position.y=8.72;gemGroup.add(star);

  // The belt of lanterns encircles the sapphire; only a few real lights cast shadows.
  const lanternMat=new THREE.MeshStandardMaterial({color:0xffb4cb,emissive:0xf16b9b,emissiveIntensity:1.8,roughness:.2});
  const lanternGeo=new THREE.SphereGeometry(.42,10,8);
  const belt=new THREE.InstancedMesh(lanternGeo,lanternMat,64);
  const dummy=new THREE.Object3D();
  for(let i=0;i<64;i++){
    const a=i/64*Math.PI*2,r=ISIDAR_DIMENSION/2+.9;
    dummy.position.set(Math.cos(a)*r,gemTop-.35,Math.sin(a)*r);
    dummy.scale.set(.75,1.5,.75);dummy.updateMatrix();belt.setMatrixAt(i,dummy.matrix);
  }
  belt.instanceMatrix.needsUpdate=true;scene.add(belt);
  for(let i=0;i<8;i++){
    const a=i/8*Math.PI*2;
    const light=new THREE.PointLight(0xf080a4,22,34,2);
    light.position.set(Math.cos(a)*8.5,gemTop+1.4,Math.sin(a)*8.5);scene.add(light);
  }
  const rim=new THREE.Mesh(new THREE.TorusGeometry(ISIDAR_DIMENSION/2+.2,.35,8,128),
    new THREE.MeshStandardMaterial({color:0xe1b4c0,metalness:.4,roughness:.22,emissive:0x8b3859,emissiveIntensity:.25}));
  rim.rotation.x=Math.PI/2;rim.position.y=gemTop-.1;scene.add(rim);
  return {bottomY:gemBottom,centerY:gemCenterY,topY:gemTop};
}

// ---------------------------------------------------------------------------
// DRAGONHOLD — a roofless circular room with naturally carved dragon caves.
// ---------------------------------------------------------------------------
function makeDragonholdArchGeometry(width,height) {
  const r=width/2,spring=height-r,shape=new THREE.Shape();
  shape.moveTo(-r,0);shape.lineTo(r,0);shape.lineTo(r,spring);
  shape.absarc(0,spring,r,0,Math.PI,false);shape.lineTo(-r,0);
  return new THREE.ShapeGeometry(shape,20);
}
function buildDragonhold(gemTopY) {
  const floorY=gemTopY,roomHeight=DRAGONHOLD_DIMENSION,innerR=DRAGONHOLD_RADIUS,outerR=DRAGONHOLD_OUTER_RADIUS;
  const wallStone=new THREE.MeshStandardMaterial({color:0xbebdb6,roughness:.52,metalness:.025});
  const innerStone=new THREE.MeshStandardMaterial({color:0x8f8a7d,roughness:.86});
  const darkStone=new THREE.MeshStandardMaterial({color:0x211f1c,roughness:.96});
  const brownRock=new THREE.MeshStandardMaterial({color:0x4b3a2c,roughness:1});
  const bronze=new THREE.MeshStandardMaterial({color:0xaaa17f,metalness:.82,roughness:.24});

  // The gem is the floor. A narrow annular lip and the wall ring rise around it.
  const border=new THREE.Mesh(new THREE.RingGeometry(innerR,outerR,96),wallStone);
  border.rotation.x=-Math.PI/2;border.position.y=floorY+.08;scene.add(border);
  const segments=128;
  for(let i=0;i<segments;i++){
    const a=(i+.5)/segments*Math.PI*2;
    let opening=null;
    for(const cave of DRAGONHOLD_CAVES){
      const delta=Math.abs(Math.atan2(Math.sin(a-cave.angle),Math.cos(a-cave.angle)));
      if(delta*innerR<cave.width/2+.35){opening=cave;break;}
    }
    const tangentLength=2*Math.PI*outerR/segments;
    const centerRadius=(innerR+outerR)/2;
    const x=Math.cos(a)*centerRadius,z=Math.sin(a)*centerRadius;
    const rotationY=Math.PI/2-a;
    const box=new THREE.BoxGeometry(tangentLength+.08,roomHeight,outerR-innerR);
    if(!opening){
      const wall=new THREE.Mesh(box,wallStone);
      wall.position.set(x,floorY+roomHeight/2,z);wall.rotation.y=rotationY;scene.add(wall);
    }else{
      const bottom=opening.bottom,top=opening.bottom+opening.height;
      if(bottom>0.1){
        const lower=new THREE.Mesh(new THREE.BoxGeometry(tangentLength+.08,bottom,outerR-innerR),wallStone);
        lower.position.set(x,floorY+bottom/2,z);lower.rotation.y=rotationY;scene.add(lower);
      }
      if(top<roomHeight-.1){
        const upper=new THREE.Mesh(new THREE.BoxGeometry(tangentLength+.08,roomHeight-top,outerR-innerR),wallStone);
        upper.position.set(x,floorY+top+(roomHeight-top)/2,z);upper.rotation.y=rotationY;scene.add(upper);
      }
    }
  }

  // Carved arch mouldings, dark tunnel mouths and rough rock interiors.
  for(const cave of DRAGONHOLD_CAVES){
    const a=cave.angle;
    const radial=new THREE.Vector3(Math.cos(a),0,Math.sin(a));
    const centerR=outerR+cave.depth/2-.7;
    const group=new THREE.Group();
    group.position.set(radial.x*centerR,floorY+cave.bottom+cave.height/2,radial.z*centerR);
    group.rotation.y=Math.PI/2-a;
    // Hollow cave shell: floor, ceiling, side walls and a rough back face.
    // The central volume remains empty so the cave reads as a space to enter.
    const caveFloor=new THREE.Mesh(new THREE.BoxGeometry(cave.width,cave.depth,.65),innerStone);
    caveFloor.position.set(0,-cave.height/2+.05,0);caveFloor.rotation.x=Math.PI/2;group.add(caveFloor);
    const caveCeiling=new THREE.Mesh(new THREE.BoxGeometry(cave.width,cave.depth,.65),brownRock);
    caveCeiling.position.set(0,cave.height/2,0);caveCeiling.rotation.x=Math.PI/2;group.add(caveCeiling);
    for(const side of [-1,1]){
      const sideWall=new THREE.Mesh(new THREE.BoxGeometry(.6,cave.height,cave.depth),brownRock);
      sideWall.position.set(side*(cave.width/2-.15),0,0);group.add(sideWall);
    }
    const back=new THREE.Mesh(new THREE.BoxGeometry(cave.width,cave.height,.8),brownRock);
    back.position.z=cave.depth/2-.4;group.add(back);
    // Rough-hewn natural ceiling and side bulges; this is a cave, not a marble room.
    for(let k=0;k<7;k++){
      const rock=new THREE.Mesh(new THREE.IcosahedronGeometry(1,1),brownRock);
      rock.position.set((Math.random()-.5)*cave.width*.8,(Math.random()-.5)*cave.height*.65,(Math.random()-.5)*cave.depth*.7);
      rock.scale.set(.8+Math.random()*1.4,.5+Math.random()*.9,.8+Math.random()*1.4);
      group.add(rock);
    }
    scene.add(group);

    const archGeo=makeDragonholdArchGeometry(cave.width,cave.height);
    const archMat=cave.kind==="exit"?wallStone:innerStone;
    const arch=new THREE.Mesh(archGeo,archMat);
    arch.position.set(radial.x*(outerR-.1),floorY+cave.bottom,radial.z*(outerR-.1));
    arch.rotation.y=Math.PI/2-a;scene.add(arch);

    // Stone cheeks define each cave opening.
    for(const side of [-1,1]){
      const cheek=new THREE.Mesh(new THREE.BoxGeometry(.8,cave.height,1.4),wallStone);
      const offset=side*cave.width/2;
      cheek.position.set(Math.cos(a)*outerR-Math.sin(a)*offset,floorY+cave.bottom+cave.height/2,
                         Math.sin(a)*outerR+Math.cos(a)*offset);
      cheek.rotation.y=Math.PI/2-a;scene.add(cheek);
    }
  }

  // Saphira's own cave: dark brown cut stone, an inset bed, cushion and shuttered red lamp.
  const saphira=DRAGONHOLD_CAVES.find(c=>c.id==="saphira");
  const sa=saphira.angle;
  const caveCenterR=outerR+saphira.depth*.5;
  const caveGroup=new THREE.Group();
  caveGroup.position.set(Math.cos(sa)*caveCenterR,floorY+saphira.bottom,Math.sin(sa)*caveCenterR);
  caveGroup.rotation.y=Math.PI/2-sa;
  const insetBed=new THREE.Mesh(new THREE.BoxGeometry(3.3,.72,2.7),new THREE.MeshStandardMaterial({color:0x47372d,roughness:.92}));
  insetBed.position.set(-1.0,1.2,4.0);caveGroup.add(insetBed);
  const mattress=new THREE.Mesh(new THREE.BoxGeometry(3.1,.42,2.4),new THREE.MeshStandardMaterial({color:0x8e7964,roughness:.96}));
  mattress.position.set(-1.0,1.72,4.0);caveGroup.add(mattress);
  const cushion=new THREE.Mesh(new THREE.CapsuleGeometry(1.45,.7,6,10),new THREE.MeshStandardMaterial({color:0x4b342b,roughness:.98}));
  cushion.rotation.z=Math.PI/2;cushion.scale.set(1.15,.62,2.0);cushion.position.set(1.1,.6,3.7);caveGroup.add(cushion);
  const lanternMount=new THREE.Mesh(new THREE.BoxGeometry(.72,1.15,.62),
    new THREE.MeshStandardMaterial({color:0x352923,roughness:.86}));
  lanternMount.position.set(-2.5,4.0,-5.95);caveGroup.add(lanternMount);
  const lantern=new THREE.Mesh(new THREE.BoxGeometry(.45,.9,.42),
    new THREE.MeshStandardMaterial({color:0x9f271d,emissive:0xb42a1c,emissiveIntensity:1.2,roughness:.35}));
  lantern.position.set(-2.5,4.2,-5.55);caveGroup.add(lantern);
  const shutter=new THREE.Mesh(new THREE.BoxGeometry(.55,.7,.12),bronze);
  shutter.position.set(-2.5,4.2,-5.28);caveGroup.add(shutter);
  // The red lamp is attached to the cave itself, so it cannot float outside
  // the wall when the cave group is rotated or repositioned.
  const redGlow=new THREE.PointLight(0xb93627,8,18,2);
  redGlow.position.set(-2.5,4.2,-4.9);caveGroup.add(redGlow);
  // Irregular natural rock shoulders frame the bed and soften the cut-stone shell.
  const caveRock=new THREE.MeshStandardMaterial({color:0x514237,roughness:1});
  for(const [x,y,z,sx,sy,sz] of [
    [-4.7,2.1,1.5,1.8,2.0,2.6],[3.8,1.5,2.8,2.1,1.5,2.2],
    [-4.1,5.0,5.4,2.0,1.2,2.4],[3.4,5.3,-1.5,2.4,1.3,2.0],
    [0.8,6.1,7.2,2.6,1.0,1.7]
  ]){
    const rock=new THREE.Mesh(new THREE.IcosahedronGeometry(1,2),caveRock);
    rock.position.set(x,y,z);rock.scale.set(sx,sy,sz);caveGroup.add(rock);
  }
  scene.add(caveGroup);

  // Polished metal rungs rise up the inner wall toward the upper caves.
  const rungCount=30,railGeo=new THREE.CylinderGeometry(.11,.11,11.5,8),rungGeo=new THREE.CylinderGeometry(.09,.09,1.35,8);
  const ladderRails=new THREE.InstancedMesh(railGeo,bronze,2);
  const ladderRungs=new THREE.InstancedMesh(rungGeo,bronze,rungCount);
  const ladderDummy=new THREE.Object3D();
  const ladderAngle=5.05,ladderR=innerR-.2;
  for(let side=0;side<2;side++){
    const offset=(side?1:-1)*.68;
    ladderDummy.position.set(Math.cos(ladderAngle)*(ladderR),floorY+9.1,Math.sin(ladderAngle)*(ladderR));
    ladderDummy.position.x+=-Math.sin(ladderAngle)*offset;ladderDummy.position.z+=Math.cos(ladderAngle)*offset;
    ladderDummy.rotation.set(0,0,0);ladderDummy.updateMatrix();ladderRails.setMatrixAt(side,ladderDummy.matrix);
  }
  for(let i=0;i<rungCount;i++){
    const y=floorY+3.4+i*.43;
    ladderDummy.position.set(Math.cos(ladderAngle)*ladderR,y,Math.sin(ladderAngle)*ladderR);
    ladderDummy.rotation.set(0,0,Math.PI/2);ladderDummy.updateMatrix();ladderRungs.setMatrixAt(i,ladderDummy.matrix);
  }
  ladderRails.instanceMatrix.needsUpdate=true;ladderRungs.instanceMatrix.needsUpdate=true;scene.add(ladderRails,ladderRungs);

  // The Dragonhold remains open. No roof, dome or glass cap is placed above it.
  const rim=new THREE.Mesh(new THREE.TorusGeometry(outerR-.25,.55,10,96),wallStone);
  rim.rotation.x=Math.PI/2;rim.position.y=floorY+roomHeight;scene.add(rim);
  const lanternMat=new THREE.MeshStandardMaterial({color:0xf0d5a6,emissive:0xd9a45a,emissiveIntensity:1.8,roughness:.24});
  const lights=new THREE.InstancedMesh(new THREE.SphereGeometry(.26,8,6),lanternMat,12);
  const dummy=new THREE.Object3D();
  for(let i=0;i<12;i++){
    const a=i/12*Math.PI*2;
    dummy.position.set(Math.cos(a)*(outerR-.7),floorY+roomHeight-.6,Math.sin(a)*(outerR-.7));
    dummy.scale.set(.8,1.4,.8);dummy.updateMatrix();lights.setMatrixAt(i,dummy.matrix);
  }
  lights.instanceMatrix.needsUpdate=true;scene.add(lights);
}

// ---------------------------------------------------------------------------
// Farthen Dûr's torn opening above Tronjheim: a visible patch of open sky.
// The Dragonhold itself has no ceiling; the distant aperture is far overhead.
// ---------------------------------------------------------------------------
function buildFarthenDurSkyAperture() {
  const canvas=document.createElement("canvas");canvas.width=512;canvas.height=512;
  const ctx=canvas.getContext("2d");
  const gradient=ctx.createLinearGradient(0,0,0,512);
  gradient.addColorStop(0,"#172637");gradient.addColorStop(.48,"#516c80");gradient.addColorStop(1,"#c6b5a0");
  ctx.fillStyle=gradient;ctx.fillRect(0,0,512,512);
  const haze=ctx.createRadialGradient(260,205,18,260,205,230);
  haze.addColorStop(0,"rgba(244,220,187,.62)");haze.addColorStop(1,"rgba(244,220,187,0)");
  ctx.fillStyle=haze;ctx.fillRect(0,0,512,512);
  for(let i=0;i<18;i++){
    const x=(i*97)%512,y=60+(i*53)%260;
    ctx.fillStyle="rgba(220,228,232,.035)";
    ctx.beginPath();ctx.ellipse(x,y,28+(i%5)*11,4+(i%3)*3,0,0,Math.PI*2);ctx.fill();
  }
  const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;
  const sky=new THREE.Mesh(new THREE.CircleGeometry(398,128),new THREE.MeshBasicMaterial({map:texture,side:THREE.DoubleSide,depthWrite:false}));
  sky.rotation.x=-Math.PI/2;sky.position.set(0,19930,0);scene.add(sky);
}

function buildVolTurinAndDragonhold() {
  buildVolTurinArcadeShaft();
  buildVolTurinStaircase();
  buildVolTurinSlide();
  const isidar=buildIsidarMithrim();
  buildDragonhold(isidar.topY);
  buildFarthenDurSkyAperture();
  const exitAngle=VOL_TURIN_START_ANGLE;
  const lastT=1-.5/VOL_TURIN_STEP_COUNT;
  const lastPoint=volTurinPointAtProgress(lastT);
  const bridgeRadius=(DRAGONHOLD_OUTER_RADIUS+Math.hypot(lastPoint.x,lastPoint.z))/2;
  const bridge=new THREE.Mesh(new THREE.BoxGeometry(13.5,.32,5.2),
    new THREE.MeshStandardMaterial({color:0xc9c7be,roughness:.36,metalness:.025}));
  // The bridge top is flush with the Dragonhold floor; the final riser is only
  // the natural half-step transition from the last Vol Turin tread.
  bridge.position.set(Math.cos(exitAngle)*bridgeRadius,isidar.topY-.16,Math.sin(exitAngle)*bridgeRadius);
  bridge.rotation.y=-exitAngle;bridge.receiveShadow=true;bridge.castShadow=true;scene.add(bridge);
}
buildVolTurinAndDragonhold();
