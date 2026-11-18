// ============================================================================
// FASE 8 — CATACUMBAS, LAGO SUBTERRÂNEO E TÚNEIS DE FARTHEN DÛR
// [INTERPRETAÇÃO] implantação e dimensões desta rede; Drums of Derva fica
// reservado para pesquisa textual antes de qualquer reconstrução específica.
// ============================================================================

const DEPTHS_THRONE_Y=THRONE_ROOM_FLOOR;
const DEPTHS_CATACOMB_Y=DEPTHS_THRONE_Y-12;
const DEPTHS_LAKE_Y=DEPTHS_THRONE_Y-20;
const DEPTHS_ROUTE_Z=80;
const DEPTHS_ROUTE_START_X=THRONE_ROOM_MIN_X-1.8;
const DEPTHS_ROUTE_TURN_X=-500;
const DEPTHS_LAKE_EXIT_END_X=-1100;

function depthsBentRouteProjection(x,z){
  const vx=DEPTHS_ROUTE_TURN_X-DEPTHS_ROUTE_START_X;
  const vz=DEPTHS_ROUTE_Z;
  const lengthSq=vx*vx+vz*vz;
  const t=THREE.MathUtils.clamp(((x-DEPTHS_ROUTE_START_X)*vx+z*vz)/lengthSq,0,1);
  const px=DEPTHS_ROUTE_START_X+vx*t,pz=vz*t;
  const distance=Math.hypot(x-px,z-pz);
  if(distance>13.4)return null;
  return {t,distance,floor:THREE.MathUtils.lerp(DEPTHS_THRONE_Y,DEPTHS_THRONE_Y-3.4,t)};
}
function depthsWalkableContains(x,z){
  const bent=depthsBentRouteProjection(x,z)!==null;
  const tunnelA=x<=DEPTHS_ROUTE_TURN_X && x>=-650 && Math.abs(z-DEPTHS_ROUTE_Z)<=12.5;
  const catacomb=Math.hypot(x+700,z-DEPTHS_ROUTE_Z)<=52.5;
  const tunnelB=x<=-755 && x>=-820 && Math.abs(z-DEPTHS_ROUTE_Z)<=12.5;
  const lake=Math.hypot(x+900,z-DEPTHS_ROUTE_Z)<=79.5;
  const lakeExit=x<=-982 && x>=DEPTHS_LAKE_EXIT_END_X && Math.abs(z-DEPTHS_ROUTE_Z)<=12.5;
  return bent||tunnelA||catacomb||tunnelB||lake||lakeExit;
}
function depthsFloorAtXZ(x,z){
  const bent=depthsBentRouteProjection(x,z);
  if(bent)return bent.floor;
  if(x<=DEPTHS_ROUTE_TURN_X && x>=-650 && Math.abs(z-DEPTHS_ROUTE_Z)<=12.5){
    const t=THREE.MathUtils.clamp((DEPTHS_ROUTE_TURN_X-x)/150,0,1);
    return THREE.MathUtils.lerp(DEPTHS_THRONE_Y-3.4,DEPTHS_CATACOMB_Y,t);
  }
  if(Math.hypot(x+700,z-DEPTHS_ROUTE_Z)<=52.5)return DEPTHS_CATACOMB_Y;
  if(x<=-755 && x>=-820 && Math.abs(z-DEPTHS_ROUTE_Z)<=12.5){
    const t=THREE.MathUtils.clamp((-755-x)/65,0,1);
    return THREE.MathUtils.lerp(DEPTHS_CATACOMB_Y,DEPTHS_LAKE_Y,t);
  }
  if(Math.hypot(x+900,z-DEPTHS_ROUTE_Z)<=79.5)return DEPTHS_LAKE_Y;
  if(x<=-982 && x>=DEPTHS_LAKE_EXIT_END_X && Math.abs(z-DEPTHS_ROUTE_Z)<=12.5)
    return DEPTHS_LAKE_Y;
  return null;
}

function buildDepthPathTunnel(controlPoints,width=25,height=16){
  const curve=new THREE.CatmullRomCurve3(
    controlPoints.map(p=>new THREE.Vector3(p[0],p[1],p[2])),
    false,"centripetal"
  );
  const length=curve.getLength(),half=width/2;
  const spring=Math.min(height*.43,half*.82),archRise=height-spring;
  const profile=[];
  for(let i=0;i<=8;i++)profile.push({u:-half,y:spring*i/8});
  for(let i=1;i<=32;i++){
    const a=Math.PI-Math.PI*i/32;
    profile.push({u:half*Math.cos(a),y:spring+archRise*Math.sin(a)});
  }
  for(let i=1;i<=8;i++)profile.push({u:half,y:spring*(1-i/8)});

  const sections=Math.max(48,Math.ceil(length/5));
  const vertices=[],uvs=[],indices=[],floorVertices=[],floorIndices=[];
  for(let i=0;i<=sections;i++){
    const t=i/sections,p=curve.getPointAt(t),tan=curve.getTangentAt(t);
    const hlen=Math.hypot(tan.x,tan.z)||1,nx=-tan.z/hlen,nz=tan.x/hlen;
    for(let j=0;j<profile.length;j++){
      const q=profile[j];
      vertices.push(p.x+nx*q.u,p.y+q.y,p.z+nz*q.u);
      uvs.push(t*length/12,j/(profile.length-1)*2.2);
    }
    floorVertices.push(p.x+nx*half,p.y-.45,p.z+nz*half,
      p.x-nx*half,p.y-.45,p.z-nz*half);
  }
  for(let i=0;i<sections;i++){
    for(let j=0;j<profile.length-1;j++){
      const a=i*profile.length+j,b=a+profile.length;
      indices.push(a,b,a+1,b,b+1,a+1);
    }
    const k=i*2;
    floorIndices.push(k,k+2,k+1,k+1,k+2,k+3);
  }
  const vaultGeo=new THREE.BufferGeometry();
  vaultGeo.setAttribute("position",new THREE.Float32BufferAttribute(vertices,3));
  vaultGeo.setAttribute("uv",new THREE.Float32BufferAttribute(uvs,2));
  vaultGeo.setIndex(indices);vaultGeo.computeVertexNormals();
  const stone=new THREE.MeshStandardMaterial({color:0x62594e,roughness:.96,side:THREE.DoubleSide});
  const vault=new THREE.Mesh(vaultGeo,stone);vault.receiveShadow=true;vault.castShadow=true;scene.add(vault);
  const floorGeo=new THREE.BufferGeometry();
  floorGeo.setAttribute("position",new THREE.Float32BufferAttribute(floorVertices,3));
  floorGeo.setIndex(floorIndices);floorGeo.computeVertexNormals();
  const floor=new THREE.Mesh(floorGeo,new THREE.MeshStandardMaterial({color:0x71604e,roughness:.9,side:THREE.DoubleSide}));
  floor.receiveShadow=true;scene.add(floor);

  const ribMat=new THREE.MeshStandardMaterial({color:0x8a7c69,roughness:.92});
  for(let d=18;d<length-6;d+=27){
    const t=d/length,p=curve.getPointAt(t),tan=curve.getTangentAt(t);
    const hlen=Math.hypot(tan.x,tan.z)||1,nx=-tan.z/hlen,nz=tan.x/hlen;
    const points=profile.map(q=>new THREE.Vector3(p.x+nx*q.u,p.y+q.y,p.z+nz*q.u));
    const rib=new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points,false,"centripetal"),72,.38,8,false),ribMat);
    rib.castShadow=true;rib.receiveShadow=true;scene.add(rib);
    const lamp=new THREE.Mesh(new THREE.CylinderGeometry(.34,.46,1.2,20,2,true),
      new THREE.MeshStandardMaterial({color:0xf0d8a9,emissive:0xd49c53,emissiveIntensity:.72,roughness:.3}));
    lamp.position.set(p.x,p.y+height-1.7,p.z);scene.add(lamp);
    const glow=new THREE.PointLight(0xffc77e,9,48,2);
    glow.position.copy(lamp.position);scene.add(glow);
  }
}
function buildDepthTunnel(xStart,xEnd,yStart,yEnd,width=25,height=15,centerZ=DEPTHS_ROUTE_Z){
  const length=xStart-xEnd,midX=(xStart+xEnd)/2,midY=(yStart+yEnd)/2;
  const angle=Math.atan2(yEnd-yStart,xEnd-xStart);
  const stone=new THREE.MeshStandardMaterial({color:0x62594e,roughness:.98,side:THREE.DoubleSide});
  const floor=new THREE.Mesh(new THREE.BoxGeometry(length+1,.9,width),stone);
  floor.position.set(midX,midY-.45,centerZ);floor.rotation.z=angle;floor.receiveShadow=true;scene.add(floor);

  // Vault cross-section: vertical spring walls transition into a continuous
  // elliptical stone arch. This replaces the box-shaped roof and wall slabs.
  const halfWidth=width/2,spring=Math.min(height*.43,halfWidth*.82),archRise=height-spring;
  const profile=[];
  for(let i=0;i<=8;i++)profile.push({z:halfWidth,y:spring*i/8});
  for(let i=1;i<=32;i++){
    const a=Math.PI*i/32;
    profile.push({z:halfWidth*Math.cos(a),y:spring+archRise*Math.sin(a)});
  }
  for(let i=1;i<=8;i++)profile.push({z:-halfWidth,y:spring*(1-i/8)});
  const axialSegments=Math.max(24,Math.ceil(length/10));
  const vertices=[],uvs=[],indices=[];
  for(let i=0;i<=axialSegments;i++){
    const t=i/axialSegments,x=THREE.MathUtils.lerp(xStart,xEnd,t);
    const baseY=THREE.MathUtils.lerp(yStart,yEnd,t);
    for(let j=0;j<profile.length;j++){
      vertices.push(x,baseY+profile[j].y,centerZ+profile[j].z);
      uvs.push(t*length/12,j/(profile.length-1)*2.4);
    }
  }
  for(let i=0;i<axialSegments;i++)for(let j=0;j<profile.length-1;j++){
    const a=i*profile.length+j,b=a+profile.length;
    indices.push(a,b,a+1,b,b+1,a+1);
  }
  const vaultGeometry=new THREE.BufferGeometry();
  vaultGeometry.setAttribute("position",new THREE.Float32BufferAttribute(vertices,3));
  vaultGeometry.setAttribute("uv",new THREE.Float32BufferAttribute(uvs,2));
  vaultGeometry.setIndex(indices);vaultGeometry.computeVertexNormals();
  const vault=new THREE.Mesh(vaultGeometry,stone);
  vault.receiveShadow=true;vault.castShadow=true;scene.add(vault);

  // Raised stone ribs follow the arch profile, rather than reading as square beams.
  const ribMaterial=new THREE.MeshStandardMaterial({color:0x8a7c69,roughness:.92});
  for(let x=xStart-18;x>xEnd+8;x-=32){
    const t=(xStart-x)/length,baseY=THREE.MathUtils.lerp(yStart,yEnd,t);
    const points=profile.map(p=>new THREE.Vector3(x,baseY+p.y,centerZ+p.z));
    const curve=new THREE.CatmullRomCurve3(points,false,"centripetal");
    const rib=new THREE.Mesh(new THREE.TubeGeometry(curve,72,.42,8,false),ribMaterial);
    rib.castShadow=true;rib.receiveShadow=true;scene.add(rib);

    const glass=new THREE.MeshStandardMaterial({
      color:0xf0d8a9,emissive:0xd49c53,emissiveIntensity:.72,roughness:.3
    });
    const lantern=new THREE.Mesh(new THREE.CylinderGeometry(.32,.48,1.25,20,2,true),glass);
    lantern.position.set(x,baseY+height-1.6,centerZ);scene.add(lantern);
    const glow=new THREE.PointLight(0xffc77e,8,46,2);
    glow.position.copy(lantern.position);scene.add(glow);
  }
}
function buildDepthChamber(cx,cy,radius,kind,cz=DEPTHS_ROUTE_Z){
  const wallHeight=kind==="lake"?17:15;
  const wallRadius=radius-1.6;
  const rock=new THREE.MeshStandardMaterial({
    color:kind==="lake"?0x4b5558:0x62594e,roughness:.99,side:THREE.BackSide
  });
  // A vaulted upper hemisphere rises from the perimeter instead of a full
  // sphere whose lower half intersected the walkable lake shore.
  const domeGeo=new THREE.SphereGeometry(radius,72,40,0,Math.PI*2,0,Math.PI/2);
  const dome=new THREE.Mesh(domeGeo,rock);
  dome.scale.y=kind==="lake"?0.68:.58;
  dome.position.set(cx,cy,cz);dome.receiveShadow=true;scene.add(dome);

  const floor=new THREE.Mesh(new THREE.CircleGeometry(radius-2.0,112),
    new THREE.MeshStandardMaterial({color:kind==="lake"?0x555b57:0x71604e,roughness:.92}));
  floor.rotation.x=-Math.PI/2;floor.position.set(cx,cy+.012,cz);floor.receiveShadow=true;scene.add(floor);

  // A true ring of rock walls closes the chamber. East and west portals are
  // deliberately left open to the connected tunnels.
  const wallSegments=48,segmentLength=2*Math.PI*wallRadius/wallSegments;
  const wallMat=new THREE.MeshStandardMaterial({
    color:kind==="lake"?0x525b5c:0x62594e,roughness:.98
  });
  for(let i=0;i<wallSegments;i++){
    const a=(i+.5)/wallSegments*Math.PI*2;
    const east=Math.abs(Math.atan2(Math.sin(a),Math.cos(a)));
    const west=Math.abs(Math.atan2(Math.sin(a-Math.PI),Math.cos(a-Math.PI)));
    if(east<.19 || west<.19)continue;
    const panel=new THREE.Mesh(new THREE.BoxGeometry(segmentLength+.35,wallHeight,3.2),wallMat);
    panel.position.set(cx+Math.cos(a)*wallRadius,cy+wallHeight/2,cz+Math.sin(a)*wallRadius);
    panel.rotation.y=-a-Math.PI/2;panel.castShadow=true;panel.receiveShadow=true;scene.add(panel);
  }

  const bronze=new THREE.MeshStandardMaterial({color:0x94784d,metalness:.68,roughness:.34});
  const pale=new THREE.MeshStandardMaterial({color:0x888276,roughness:.92});
  for(const angle of [0,Math.PI]){
    const group=new THREE.Group();
    group.position.set(cx+Math.cos(angle)*(wallRadius-.1),cy,cz+Math.sin(angle)*(wallRadius-.1));
    group.rotation.y=-angle;
    for(const side of [-1,1]){
      const jamb=new THREE.Mesh(new THREE.BoxGeometry(2.0,wallHeight+1.5,2.0),pale);
      jamb.position.set(0,(wallHeight+1.5)/2,side*8.1);jamb.castShadow=true;group.add(jamb);
      const capital=new THREE.Mesh(new THREE.BoxGeometry(2.8,1.0,2.8),bronze);
      capital.position.set(0,wallHeight+.6,side*8.1);group.add(capital);
    }
    const arch=new THREE.Mesh(new THREE.TorusGeometry(8.1,.65,10,56,Math.PI),bronze);
    arch.rotation.y=Math.PI/2;arch.position.set(0,wallHeight-1.0,0);group.add(arch);
    // Two heavy leaves stand open against the jambs; the passage remains clear.
    for(const side of [-1,1]){
      const leaf=new THREE.Group();leaf.position.set(0,cy===0?0:0,side*8.0);
      leaf.rotation.y=side*1.12;
      const panel=new THREE.Mesh(new THREE.BoxGeometry(.72,wallHeight-2.5,7.4),
        new THREE.MeshStandardMaterial({color:0x302720,roughness:.84}));
      panel.position.set(.1,(wallHeight-2.5)/2,-side*3.7);leaf.add(panel);
      for(const y of [3,wallHeight/2,wallHeight-5]){
        const strap=new THREE.Mesh(new THREE.BoxGeometry(.9,.3,7.1),bronze);
        strap.position.set(.52,y,-side*3.7);leaf.add(strap);
      }
      group.add(leaf);
    }
    scene.add(group);
  }

  // Stalactites and mineral spires frame the walkable center without sealing
  // either doorway or forcing the player through the cavern shell.
  for(let i=0;i<24;i++){
    const a=i/24*Math.PI*2;
    const x=cx+Math.cos(a)*(radius-9),z=cz+Math.sin(a)*(radius-9);
    const h=5+hash(i,kind==="lake"?81:41)*8;
    const spire=new THREE.Mesh(new THREE.ConeGeometry(1.2,h,12,2),
      new THREE.MeshStandardMaterial({color:0x756a5c,roughness:1}));
    spire.position.set(x,cy+h/2,z);spire.rotation.z=(hash(i,17)-.5)*.18;scene.add(spire);
  }
}

function buildDwarfCatacombs(){
  const stone=new THREE.MeshStandardMaterial({color:0x554d45,roughness:.86});
  const bronze=new THREE.MeshStandardMaterial({color:0x9d804d,metalness:.68,roughness:.34});
  // Eight stone burial plinths, each recessed into a carved wall bay.
  for(let i=0;i<8;i++){
    const z=-35+i*10;
    const tomb=new THREE.Mesh(new THREE.BoxGeometry(8,1.8,5.4),stone);
    tomb.position.set(-700,DEPTHS_CATACOMB_Y+.9,DEPTHS_ROUTE_Z+z);scene.add(tomb);
    const lid=new THREE.Mesh(new THREE.BoxGeometry(8.2,.35,5.6),bronze);
    lid.position.set(-700,DEPTHS_CATACOMB_Y+1.95,DEPTHS_ROUTE_Z+z);scene.add(lid);
    const marker=new THREE.Mesh(new THREE.BoxGeometry(.8,2.2,.8),bronze);
    marker.position.set(-700,DEPTHS_CATACOMB_Y+3.1,DEPTHS_ROUTE_Z+z);scene.add(marker);
  }
  for(const side of [-1,1]){
    const col=new THREE.Mesh(new THREE.CylinderGeometry(1.1,1.35,15,10),stone);
    col.position.set(-700,DEPTHS_CATACOMB_Y+7.5,DEPTHS_ROUTE_Z+side*47);scene.add(col);
    const lamp=new THREE.Mesh(new THREE.SphereGeometry(.8,10,8),MAT.lantern);
    lamp.position.set(-700,DEPTHS_CATACOMB_Y+11,DEPTHS_ROUTE_Z+side*43);scene.add(lamp);
    const light=new THREE.PointLight(0xffc77e,10,52,2);
    light.position.copy(lamp.position);scene.add(light);
  }
}
function buildUndergroundLake(){
  const water=new THREE.Mesh(new THREE.CircleGeometry(51,160),
    new THREE.MeshPhysicalMaterial({
      color:0x456d78,roughness:.11,metalness:.2,transparent:true,opacity:.86,
      clearcoat:.82,clearcoatRoughness:.12
    }));
  water.rotation.x=-Math.PI/2;water.position.set(-900,DEPTHS_LAKE_Y+.12,DEPTHS_ROUTE_Z);
  water.receiveShadow=true;scene.add(water);

  // Concentric mineral strata define the wet edge without turning the shore
  // into a perfectly smooth decorative ring.
  const shore=new THREE.Mesh(new THREE.TorusGeometry(55,1.4,12,160),
    new THREE.MeshStandardMaterial({color:0x827967,roughness:.92}));
  shore.rotation.x=Math.PI/2;shore.position.set(-900,DEPTHS_LAKE_Y+.18,DEPTHS_ROUTE_Z);scene.add(shore);
  const outerVein=new THREE.Mesh(new THREE.TorusGeometry(59,.34,8,160),
    new THREE.MeshStandardMaterial({color:0x52676b,roughness:.72,metalness:.08}));
  outerVein.rotation.x=Math.PI/2;outerVein.position.set(-900,DEPTHS_LAKE_Y+.05,DEPTHS_ROUTE_Z);scene.add(outerVein);

  const boulderMat=new THREE.MeshStandardMaterial({color:0x625d54,roughness:.98});
  const boulderGeo=new THREE.IcosahedronGeometry(1,2);
  for(let i=0;i<42;i++){
    const a=hash(i+201,63)*Math.PI*2;
    const radius=53+hash(i+71,92)*10;
    const size=1.8+hash(i+31,48)*4.6;
    const rock=new THREE.Mesh(boulderGeo,boulderMat);
    rock.position.set(-900+Math.cos(a)*radius,DEPTHS_LAKE_Y+size*.3,DEPTHS_ROUTE_Z+DEPTHS_ROUTE_Z+DEPTHS_ROUTE_Z+DEPTHS_ROUTE_Z+Math.sin(a)*radius);
    rock.scale.set(size*(.7+hash(i+81,12)*.8),size*(.3+hash(i+41,7)*.45),size*(.65+hash(i+61,18)*.7));
    rock.rotation.set(hash(i+91,24)*.25,hash(i+11,33)*Math.PI*2,hash(i+101,46)*.2);
    rock.castShadow=true;rock.receiveShadow=true;scene.add(rock);
  }

  // Mineral needles grow in uneven clusters along one side of the cavern.
  for(let i=0;i<28;i++){
    const a=-1.05+hash(i+141,29)*1.25;
    const radius=56+hash(i+151,38)*14;
    const height=3.2+hash(i+161,47)*8.5;
    const x=-900+Math.cos(a)*radius,z=DEPTHS_ROUTE_Z+DEPTHS_ROUTE_Z+DEPTHS_ROUTE_Z+Math.sin(a)*radius;
    const crystal=new THREE.Mesh(new THREE.OctahedronGeometry(.9+hash(i+171,56)*1.2,1),
      new THREE.MeshStandardMaterial({color:0x76939a,roughness:.2,metalness:.18,emissive:0x16333a,emissiveIntensity:.2}));
    crystal.position.set(x,DEPTHS_LAKE_Y+height*.48,z);
    crystal.scale.set(.9,height,.9);crystal.rotation.y=hash(i+181,65)*Math.PI;scene.add(crystal);
  }
  const reflectedGlow=new THREE.PointLight(0x6c9eac,22,145,2);
  reflectedGlow.position.set(-884,DEPTHS_LAKE_Y+12,DEPTHS_ROUTE_Z-24);scene.add(reflectedGlow);
}
function buildDepths(){
  // A bent connector leaves the Throne Room through its rear portal, turns
  // away from the council wing, and joins the separate underground network.
  buildDepthPathTunnel([
    [DEPTHS_ROUTE_START_X,DEPTHS_THRONE_Y,0],
    [-454,DEPTHS_THRONE_Y-1.0,27],
    [-478,DEPTHS_THRONE_Y-2.5,56],
    [DEPTHS_ROUTE_TURN_X,DEPTHS_THRONE_Y-3.4,DEPTHS_ROUTE_Z]
  ],25,16);
  buildDepthTunnel(DEPTHS_ROUTE_TURN_X,-650,DEPTHS_THRONE_Y-3.4,DEPTHS_CATACOMB_Y,25,15,DEPTHS_ROUTE_Z);
  buildDepthChamber(-700,DEPTHS_CATACOMB_Y,55,"catacomb",DEPTHS_ROUTE_Z);
  buildDepthTunnel(-755,-820,DEPTHS_CATACOMB_Y,DEPTHS_LAKE_Y,25,17,DEPTHS_ROUTE_Z);
  buildDepthChamber(-900,DEPTHS_LAKE_Y,82,"lake",DEPTHS_ROUTE_Z);
  // The west portal of the lake opens into a further vaulted passage, so the
  // chamber has a genuine exit rather than ending against a blank rock wall.
  buildDepthTunnel(-982,DEPTHS_LAKE_EXIT_END_X,DEPTHS_LAKE_Y,DEPTHS_LAKE_Y,25,17,DEPTHS_ROUTE_Z);
  buildDwarfCatacombs();
  buildUndergroundLake();
}
buildDepths();
