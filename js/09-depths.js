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
  const stone=new THREE.MeshStandardMaterial({color:0x62594e,roughness:.98});
  const floor=new THREE.Mesh(new THREE.BoxGeometry(length+1,.9,width),stone);
  floor.position.set(midX,midY-.45,0);floor.rotation.z=angle;floor.receiveShadow=true;scene.add(floor);
  const roof=new THREE.Mesh(new THREE.BoxGeometry(length+1,1.2,width),stone);
  roof.position.set(midX,midY+height,width*0);roof.rotation.z=angle;scene.add(roof);
  for(const side of [-1,1]){
    const wall=new THREE.Mesh(new THREE.BoxGeometry(length+1,height,1.8),stone);
    wall.position.set(midX,midY+height/2,side*width/2);wall.rotation.z=angle;wall.receiveShadow=true;scene.add(wall);
  }
  for(let x=xStart-14;x>xEnd+8;x-=28){
    const rib=new THREE.Mesh(new THREE.BoxGeometry(1.3,height+1,width+2),
      new THREE.MeshStandardMaterial({color:0x8a7c69,roughness:.95}));
    const t=(xStart-x)/length;
    rib.position.set(x,THREE.MathUtils.lerp(yStart,yEnd,t)+height/2,0);
    rib.rotation.z=angle;scene.add(rib);
    const lamp=new THREE.Mesh(new THREE.SphereGeometry(.58,10,8),MAT.lantern);
    lamp.position.set(x,THREE.MathUtils.lerp(yStart,yEnd,t)+height-2.2,0); // centered ceiling marker
    scene.add(lamp);
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
    const light=new THREE.PointLight(0xffc77e,18,34,2);
    light.position.copy(lamp.position);scene.add(light);
  }
}
function buildUndergroundLake(){
  const water=new THREE.Mesh(new THREE.CircleGeometry(51,96),
    new THREE.MeshStandardMaterial({color:0x456d78,roughness:.14,metalness:.28,transparent:true,opacity:.82}));
  water.rotation.x=-Math.PI/2;water.position.set(-900,DEPTHS_LAKE_Y+.12,0);scene.add(water);
  const shore=new THREE.Mesh(new THREE.TorusGeometry(55,1.4,8,96),
    new THREE.MeshStandardMaterial({color:0x827967,roughness:.95}));
  shore.rotation.x=Math.PI/2;shore.position.set(-900,DEPTHS_LAKE_Y+.18,0);scene.add(shore);
  for(let i=0;i<14;i++){
    const x=-940+i*6.2;
    const crystal=new THREE.Mesh(new THREE.OctahedronGeometry(1.8+hash(i,72)*1.8,1),
      new THREE.MeshStandardMaterial({color:0x76939a,roughness:.24,metalness:.18,emissive:0x16333a,emissiveIntensity:.18}));
    crystal.position.set(x,DEPTHS_LAKE_Y+2.5,-58+hash(i,91)*14);scene.add(crystal);
  }
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
