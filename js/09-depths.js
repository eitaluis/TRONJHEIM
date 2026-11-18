// ============================================================================
// FASE 8 — CATACUMBAS, LAGO SUBTERRÂNEO E TÚNEIS DE FARTHEN DÛR
// [INTERPRETAÇÃO] implantação e dimensões desta rede; Drums of Derva fica
// reservado para pesquisa textual antes de qualquer reconstrução específica.
// ============================================================================

const DEPTHS_THRONE_Y=THRONE_ROOM_FLOOR;
const DEPTHS_CATACOMB_Y=DEPTHS_THRONE_Y-12;
const DEPTHS_LAKE_Y=DEPTHS_THRONE_Y-20;

function depthsWalkableContains(x,z){
  const tunnelA=x<=THRONE_ROOM_MIN_X && x>=-650 && Math.abs(z)<=12.5;
  const catacomb=Math.hypot(x+700,z)<=55;
  const tunnelB=x<=-755 && x>=-820 && Math.abs(z)<=12.5;
  const lake=Math.hypot(x+900,z)<=82;
  return tunnelA||catacomb||tunnelB||lake;
}
function depthsFloorAtXZ(x,z){
  if(x<=THRONE_ROOM_MIN_X && x>=-650 && Math.abs(z)<=12.5){
    const t=THREE.MathUtils.clamp((THRONE_ROOM_MIN_X-x)/(650+THRONE_ROOM_MIN_X),0,1);
    return THREE.MathUtils.lerp(DEPTHS_THRONE_Y,DEPTHS_CATACOMB_Y,t);
  }
  if(Math.hypot(x+700,z)<=55)return DEPTHS_CATACOMB_Y;
  if(x<=-755 && x>=-820 && Math.abs(z)<=12.5){
    const t=THREE.MathUtils.clamp((-755-x)/65,0,1);
    return THREE.MathUtils.lerp(DEPTHS_CATACOMB_Y,DEPTHS_LAKE_Y,t);
  }
  if(Math.hypot(x+900,z)<=82)return DEPTHS_LAKE_Y;
  return null;
}

function buildDepthTunnel(xStart,xEnd,yStart,yEnd,width=25,height=15){
  const length=xStart-xEnd,midX=(xStart+xEnd)/2,midY=(yStart+yEnd)/2;
  const angle=Math.atan2(yEnd-yStart,xEnd-xStart);
  const stone=new THREE.MeshStandardMaterial({color:0x62594e,roughness:.98,side:THREE.DoubleSide});
  const floor=new THREE.Mesh(new THREE.BoxGeometry(length+1,.9,width),stone);
  floor.position.set(midX,midY-.45,0);floor.rotation.z=angle;floor.receiveShadow=true;scene.add(floor);

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
      vertices.push(x,baseY+profile[j].y,profile[j].z);
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
    const points=profile.map(p=>new THREE.Vector3(x,baseY+p.y,p.z));
    const curve=new THREE.CatmullRomCurve3(points,false,"centripetal");
    const rib=new THREE.Mesh(new THREE.TubeGeometry(curve,72,.42,8,false),ribMaterial);
    rib.castShadow=true;rib.receiveShadow=true;scene.add(rib);

    const glass=new THREE.MeshStandardMaterial({
      color:0xf0d8a9,emissive:0xd49c53,emissiveIntensity:.72,roughness:.3
    });
    const lantern=new THREE.Mesh(new THREE.CylinderGeometry(.32,.48,1.25,20,2,true),glass);
    lantern.position.set(x,baseY+height-1.6,0);scene.add(lantern);
    const glow=new THREE.PointLight(0xffc77e,8,46,2);
    glow.position.copy(lantern.position);scene.add(glow);
  }
}
function buildDepthChamber(cx,cy,radius,kind){
  const rock=new THREE.MeshStandardMaterial({color:kind==="lake"?0x4b5558:0x62594e,roughness:.99,side:THREE.BackSide});
  const dome=new THREE.Mesh(new THREE.SphereGeometry(1,40,24),rock);
  dome.scale.set(radius,kind==="lake"?42:30,radius);
  dome.position.set(cx,cy+(kind==="lake"?25:19),0);scene.add(dome);
  const floor=new THREE.Mesh(new THREE.CircleGeometry(radius,64),
    new THREE.MeshStandardMaterial({color:kind==="lake"?0x555b57:0x71604e,roughness:.92}));
  floor.rotation.x=-Math.PI/2;floor.position.set(cx,cy,0);floor.receiveShadow=true;scene.add(floor);
  for(let i=0;i<20;i++){
    const a=i/20*Math.PI*2,x=cx+Math.cos(a)*(radius-3),z=Math.sin(a)*(radius-3);
    const h=5+hash(i,kind==="lake"?81:41)*8;
    const spire=new THREE.Mesh(new THREE.ConeGeometry(1.4,h,8),
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
    tomb.position.set(-700,DEPTHS_CATACOMB_Y+.9,z);scene.add(tomb);
    const lid=new THREE.Mesh(new THREE.BoxGeometry(8.2,.35,5.6),bronze);
    lid.position.set(-700,DEPTHS_CATACOMB_Y+1.95,z);scene.add(lid);
    const marker=new THREE.Mesh(new THREE.BoxGeometry(.8,2.2,.8),bronze);
    marker.position.set(-700,DEPTHS_CATACOMB_Y+3.1,z);scene.add(marker);
  }
  for(const side of [-1,1]){
    const col=new THREE.Mesh(new THREE.CylinderGeometry(1.1,1.35,15,10),stone);
    col.position.set(-700,DEPTHS_CATACOMB_Y+7.5,side*47);scene.add(col);
    const lamp=new THREE.Mesh(new THREE.SphereGeometry(.8,10,8),MAT.lantern);
    lamp.position.set(-700,DEPTHS_CATACOMB_Y+11,side*43);scene.add(lamp);
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
  water.rotation.x=-Math.PI/2;water.position.set(-900,DEPTHS_LAKE_Y+.12,0);
  water.receiveShadow=true;scene.add(water);

  // Concentric mineral strata define the wet edge without turning the shore
  // into a perfectly smooth decorative ring.
  const shore=new THREE.Mesh(new THREE.TorusGeometry(55,1.4,12,160),
    new THREE.MeshStandardMaterial({color:0x827967,roughness:.92}));
  shore.rotation.x=Math.PI/2;shore.position.set(-900,DEPTHS_LAKE_Y+.18,0);scene.add(shore);
  const outerVein=new THREE.Mesh(new THREE.TorusGeometry(59,.34,8,160),
    new THREE.MeshStandardMaterial({color:0x52676b,roughness:.72,metalness:.08}));
  outerVein.rotation.x=Math.PI/2;outerVein.position.set(-900,DEPTHS_LAKE_Y+.05,0);scene.add(outerVein);

  const boulderMat=new THREE.MeshStandardMaterial({color:0x625d54,roughness:.98});
  const boulderGeo=new THREE.IcosahedronGeometry(1,2);
  for(let i=0;i<42;i++){
    const a=hash(i+201,63)*Math.PI*2;
    const radius=53+hash(i+71,92)*10;
    const size=1.8+hash(i+31,48)*4.6;
    const rock=new THREE.Mesh(boulderGeo,boulderMat);
    rock.position.set(-900+Math.cos(a)*radius,DEPTHS_LAKE_Y+size*.3,Math.sin(a)*radius);
    rock.scale.set(size*(.7+hash(i+81,12)*.8),size*(.3+hash(i+41,7)*.45),size*(.65+hash(i+61,18)*.7));
    rock.rotation.set(hash(i+91,24)*.25,hash(i+11,33)*Math.PI*2,hash(i+101,46)*.2);
    rock.castShadow=true;rock.receiveShadow=true;scene.add(rock);
  }

  // Mineral needles grow in uneven clusters along one side of the cavern.
  for(let i=0;i<28;i++){
    const a=-1.05+hash(i+141,29)*1.25;
    const radius=56+hash(i+151,38)*14;
    const height=3.2+hash(i+161,47)*8.5;
    const x=-900+Math.cos(a)*radius,z=Math.sin(a)*radius;
    const crystal=new THREE.Mesh(new THREE.OctahedronGeometry(.9+hash(i+171,56)*1.2,1),
      new THREE.MeshStandardMaterial({color:0x76939a,roughness:.2,metalness:.18,emissive:0x16333a,emissiveIntensity:.2}));
    crystal.position.set(x,DEPTHS_LAKE_Y+height*.48,z);
    crystal.scale.set(.9,height,.9);crystal.rotation.y=hash(i+181,65)*Math.PI;scene.add(crystal);
  }
  const reflectedGlow=new THREE.PointLight(0x6c9eac,22,145,2);
  reflectedGlow.position.set(-884,DEPTHS_LAKE_Y+12,-24);scene.add(reflectedGlow);
}
function buildDepths(){
  buildDepthTunnel(THRONE_ROOM_MIN_X,-650,DEPTHS_THRONE_Y,DEPTHS_CATACOMB_Y);
  buildDepthChamber(-700,DEPTHS_CATACOMB_Y,55,"catacomb");
  buildDepthTunnel(-755,-820,DEPTHS_CATACOMB_Y,DEPTHS_LAKE_Y,25,17);
  buildDepthChamber(-900,DEPTHS_LAKE_Y,82,"lake");
  buildDwarfCatacombs();
  buildUndergroundLake();
}
buildDepths();
