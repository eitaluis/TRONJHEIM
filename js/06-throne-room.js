// ============================================================================
// FASE 7 — SALA DO TRONO
// [LIVRO: ERAGON] acesso por duas escadarias que se unem, portas de granito
// com coroa de sete pontas; caverna natural longa, formações calcárias,
// lanternas espaçadas, 41 estátuas de reis anteriores e trono negro monolítico.
// [INTERPRETAÇÃO] planta, medidas, posição exata, desenho das estátuas e detalhes
// de escultura. O salão é mantido como uma caverna, não como um aposento palaciano.
// ============================================================================

const THRONE_ROOM_FLOOR = ENTRY_HALL_FLOOR - 30.48; // [DERIVADO] 100 ft
const THRONE_ROOM_MIN_X = -430;
const THRONE_ROOM_MAX_X = -257;
const THRONE_ROOM_HALF_WIDTH = 18.0;
const THRONE_ROOM_HEIGHT = 24.5;
const THRONE_ROOM_DOOR_X = -254.5;
const THRONE_ROOM_PATHS = [];

function buildThroneStairPath(name, controlPoints, width, topY, bottomY, stepRise=0.18) {
  const curve = new THREE.CatmullRomCurve3(
    controlPoints.map(p=>new THREE.Vector3(p[0],p[1],p[2])),
    false,
    "centripetal"
  );
  const drop = topY-bottomY;
  const steps = Math.ceil(drop/stepRise);
  const rise = drop/steps;
  const length = curve.getLength();
  const treadDepth = Math.max(.42,length/steps*.94);
  const stone = new THREE.MeshStandardMaterial({color:0xd4d1c8,roughness:.48,metalness:.025});
  const edge = new THREE.MeshStandardMaterial({color:0xa78a57,roughness:.32,metalness:.58});
  // The final tread of the broad stair is replaced by a flat granite landing
  // immediately before the doors, avoiding a coplanar overlap.
  const renderedSteps=name==="escadaria-ampla"?steps-1:steps;
  const treads = new THREE.InstancedMesh(new THREE.BoxGeometry(width,.32,1),stone,renderedSteps);
  const nosings = new THREE.InstancedMesh(new THREE.BoxGeometry(width,.10,.13),edge,renderedSteps);
  const dummy = new THREE.Object3D();
  const sampleCount = Math.max(220,steps*2);
  const samples = [];
  for(let i=0;i<=sampleCount;i++){
    const t=i/sampleCount,p=curve.getPointAt(t);
    samples.push({t,x:p.x,z:p.z});
  }
  for(let i=0;i<steps;i++){
    if(i>=renderedSteps)continue;
    const t=(i+.5)/steps;
    const p=curve.getPointAt(t);
    p.y=topY-(i+1)*rise-.16;
    const tangent=curve.getTangentAt(t);
    const rotation=Math.atan2(tangent.x,tangent.z);
    dummy.position.copy(p);
    dummy.rotation.set(0,rotation,0);
    dummy.scale.set(1,1,treadDepth);
    dummy.updateMatrix();treads.setMatrixAt(i,dummy.matrix);
    p.y+=.115;
    dummy.position.copy(p);
    dummy.scale.set(1,1,treadDepth);
    dummy.updateMatrix();nosings.setMatrixAt(i,dummy.matrix);
  }
  treads.count=renderedSteps;
  nosings.count=renderedSteps;
  treads.instanceMatrix.needsUpdate=true;
  nosings.instanceMatrix.needsUpdate=true;
  scene.add(treads,nosings);

  // Low stone parapets and a restrained bronze handrail keep the long descent legible.
  const railMaterial=new THREE.MeshStandardMaterial({color:0x91764b,metalness:.72,roughness:.3});
  for(const side of [-1,1]){
    const railPoints=[],postCount=Math.ceil(steps/8)+1;
    const posts=new THREE.InstancedMesh(new THREE.CylinderGeometry(.10,.13,1,8),
      new THREE.MeshStandardMaterial({color:0xaaa69a,roughness:.5}),postCount);
    let postIndex=0;
    for(let i=0;i<=steps;i+=8){
      const t=Math.min(1,i/steps),p=curve.getPointAt(t);
      const tangent=curve.getTangentAt(t),perp=new THREE.Vector3(-tangent.z,0,tangent.x).normalize();
      p.x+=perp.x*side*(width/2-.15);p.z+=perp.z*side*(width/2-.15);
      const y=topY-Math.min(steps,Math.max(1,i))*rise;
      railPoints.push(new THREE.Vector3(p.x,y+1.04,p.z));
      dummy.position.set(p.x,y+.54,p.z);dummy.scale.set(1,1.08,1);dummy.updateMatrix();posts.setMatrixAt(postIndex++,dummy.matrix);
    }
    posts.count=postIndex;posts.instanceMatrix.needsUpdate=true;scene.add(posts);
    if(railPoints.length>1){
      const railCurve=new THREE.CatmullRomCurve3(railPoints);
      scene.add(new THREE.Mesh(new THREE.TubeGeometry(railCurve,Math.max(80,steps*2),.13,7,false),railMaterial));
    }
  }
  THRONE_ROOM_PATHS.push({name,curve,width,steps,rise,topY,bottomY,samples});
  return {curve,steps,rise,length};
}

function throneRoomStairFloorAtXZ(x,z) {
  let best=null,bestDistance=Infinity;
  for(const path of THRONE_ROOM_PATHS){
    for(const sample of path.samples){
      const d=Math.hypot(x-sample.x,z-sample.z);
      if(d<bestDistance){bestDistance=d;best={path,t:sample.t};}
    }
  }
  if(!best || bestDistance>best.path.width*.5+.28)return null;
  const p=best.path,index=THREE.MathUtils.clamp(Math.floor(best.t*p.steps),0,p.steps-1);
  return p.topY-(index+1)*p.rise;
}
function throneRoomWalkableContains(x,z) {
  const inLanding=x>=THRONE_ROOM_DOOR_X-4.5 && x<=THRONE_ROOM_DOOR_X+5.5 && Math.abs(z)<=9.2;
  if(inLanding)return true;
  if(x>=THRONE_ROOM_MIN_X && x<=THRONE_ROOM_MAX_X &&
     Math.abs(z)<=THRONE_ROOM_HALF_WIDTH-.8)return true;
  return throneRoomStairFloorAtXZ(x,z)!==null;
}
function throneRoomFloorAtXZ(x,z) {
  const stair=throneRoomStairFloorAtXZ(x,z);
  if(stair!==null)return stair;
  const inLanding=x>=THRONE_ROOM_DOOR_X-4.5 && x<=THRONE_ROOM_DOOR_X+5.5 && Math.abs(z)<=9.2;
  if(inLanding)return THRONE_ROOM_FLOOR;
  if(x>=THRONE_ROOM_MIN_X && x<=THRONE_ROOM_MAX_X &&
     Math.abs(z)<=THRONE_ROOM_HALF_WIDTH-.8)return THRONE_ROOM_FLOOR;
  return null;
}

function buildThroneAccess() {
  const top=ENTRY_HALL_FLOOR,branchBottom=top-7.2;
  const branchWidth=8.2;
  // The upper flights begin at the two tall arches flanking the western hall.
  buildThroneStairPath("escadaria-gêmea-norte",[
    [-137,top,-42],[-143,top-1.8,-39],[-155,top-4.5,-24],[-170,branchBottom,-5.0]
  ],branchWidth,top,branchBottom);
  buildThroneStairPath("escadaria-gêmea-sul",[
    [-137,top,42],[-143,top-1.8,39],[-155,top-4.5,24],[-170,branchBottom,5.0]
  ],branchWidth,top,branchBottom);

  // The paired flights meet on a broad landing; one wide stair continues down
  // the final 100-foot descent toward the granite doors.
  const landing=new THREE.Mesh(new THREE.BoxGeometry(18,.48,15),
    new THREE.MeshStandardMaterial({color:0xc9c7bf,roughness:.48}));
  landing.position.set(-170,branchBottom-.24,0);landing.receiveShadow=true;scene.add(landing);
  buildThroneStairPath("escadaria-ampla",[
    [-170,branchBottom,0],[-193,top-13,0],[-220,top-22,0],[-249,THRONE_ROOM_FLOOR,0]
  ],15.8,branchBottom,THRONE_ROOM_FLOOR,.18);
  const doorLanding=new THREE.Mesh(new THREE.BoxGeometry(9,.72,36),
    new THREE.MeshStandardMaterial({color:0xc4c1b8,roughness:.5}));
  doorLanding.position.set(-253.5,THRONE_ROOM_FLOOR-.36,0);
  doorLanding.receiveShadow=true;scene.add(doorLanding);

  // Tall freestanding portals mark the two openings at the upper landing.
  const jasper=new THREE.MeshStandardMaterial({color:0x712a34,roughness:.4,metalness:.04});
  const pale=new THREE.MeshStandardMaterial({color:0xdedbd2,roughness:.35});
  for(const side of [-1,1]){
    const startX=-137,startZ=side*42;
    const frame=new THREE.Group();frame.position.set(startX,top,startZ);
    const left=new THREE.Mesh(new THREE.BoxGeometry(1.7,18,1.9),jasper);
    left.position.set(0,9,-4.1);frame.add(left);
    const right=left.clone();right.position.z=4.1;frame.add(right);
    const lintel=new THREE.Mesh(new THREE.BoxGeometry(2.0,2.1,10.0),pale);
    lintel.position.y=18;frame.add(lintel);
    const crownLine=new THREE.Mesh(new THREE.BoxGeometry(2.2,.34,8.4),jasper);
    crownLine.position.set(0,16.2,0);frame.add(crownLine);
    scene.add(frame);
  }
}

function buildGraniteThroneDoors() {
  const granite=new THREE.MeshStandardMaterial({color:0x62666a,roughness:.78,metalness:.07});
  const darkGranite=new THREE.MeshStandardMaterial({color:0x34393e,roughness:.84,metalness:.05});
  const bronze=new THREE.MeshStandardMaterial({color:0x9d824f,metalness:.7,roughness:.34});
  const doorY=THRONE_ROOM_FLOOR+6.8;
  const frameX=THRONE_ROOM_DOOR_X;
  for(const side of [-1,1]){
    // Each granite leaf is swung inward, leaving the entrance traversable.
    const hinge=new THREE.Group();
    hinge.position.set(frameX,doorY,side*7.85);
    hinge.rotation.y=side*1.05;
    const leaf=new THREE.Mesh(new THREE.BoxGeometry(1.15,13.6,7.65),granite);
    leaf.position.set(0,0,-side*3.825);
    leaf.castShadow=true;leaf.receiveShadow=true;hinge.add(leaf);
    for(let i=0;i<4;i++){
      const groove=new THREE.Mesh(new THREE.BoxGeometry(.06,11.5,.09),darkGranite);
      groove.position.set(.61,-.2,-side*(.9+i*1.55));hinge.add(groove);
    }
    const pivot=new THREE.Mesh(new THREE.CylinderGeometry(.28,.28,13.3,10),bronze);
    pivot.position.set(.66,0,0);hinge.add(pivot);
    scene.add(hinge);
  }
  for(const side of [-1,1]){
    const jamb=new THREE.Mesh(new THREE.BoxGeometry(2.8,16.5,2.5),darkGranite);
    jamb.position.set(frameX,THRONE_ROOM_FLOOR+8.25,side*8.3);scene.add(jamb);
    const capital=new THREE.Mesh(new THREE.BoxGeometry(3.8,1.8,3.2),granite);
    capital.position.set(frameX,THRONE_ROOM_FLOOR+16.8,side*8.3);scene.add(capital);
  }
  const lintel=new THREE.Mesh(new THREE.BoxGeometry(3.4,2.2,19.2),granite);
  lintel.position.set(frameX,THRONE_ROOM_FLOOR+17.0,0);scene.add(lintel);

  // One seven-point crown crosses both door leaves, carved as a single relief.
  const crownShape=new THREE.Shape();
  const crownPoints=[];
  for(let i=0;i<13;i++){
    const z=-5.4+i*.9;
    const y=(i%2===0?3.0:1.25); // Seven distinct points and six valleys.
    crownPoints.push([z,y]);
  }
  crownShape.moveTo(-5.8,.1);crownShape.lineTo(5.8,.1);
  crownShape.lineTo(5.4,1.1);
  for(let i=12;i>=0;i--)crownShape.lineTo(crownPoints[i][0],crownPoints[i][1]);
  crownShape.closePath();
  const crown=new THREE.Mesh(new THREE.ShapeGeometry(crownShape,16),bronze);
  crown.rotation.y=Math.PI/2;
  crown.position.set(frameX+1.78,THRONE_ROOM_FLOOR+10.3,0);scene.add(crown);
}

function buildDwarfGuard(x,z,side,index) {
  const g=new THREE.Group();g.position.set(x,THRONE_ROOM_FLOOR,z);
  g.rotation.y=Math.PI/2;
  const armor=new THREE.MeshStandardMaterial({color:index%2?0x667078:0x555d63,metalness:.62,roughness:.38});
  const dark=new THREE.MeshStandardMaterial({color:0x352820,roughness:.92});
  const skin=new THREE.MeshStandardMaterial({color:0x8e735e,roughness:.88});
  const gold=new THREE.MeshStandardMaterial({color:0xb28a48,metalness:.75,roughness:.28});
  const body=new THREE.Mesh(new THREE.CylinderGeometry(.34,.43,.78,10),armor);body.position.y=.83;g.add(body);
  const head=new THREE.Mesh(new THREE.SphereGeometry(.25,10,8),skin);head.position.y=1.43;g.add(head);
  const beard=new THREE.Mesh(new THREE.ConeGeometry(.23,.62,7),dark);beard.position.set(0,1.08,.23);beard.rotation.x=-.25;g.add(beard);
  const helmet=new THREE.Mesh(new THREE.SphereGeometry(.3,10,6,0,Math.PI*2,0,Math.PI/2),gold);helmet.position.y=1.54;g.add(helmet);
  for(const s of [-1,1]){
    const arm=new THREE.Mesh(new THREE.CylinderGeometry(.12,.14,.62,8),armor);
    arm.position.set(s*.42,.88,.02);arm.rotation.z=s*.2;g.add(arm);
    const boot=new THREE.Mesh(new THREE.BoxGeometry(.28,.42,.48),dark);
    boot.position.set(s*.22,.23,.1);g.add(boot);
  }
  const belt=new THREE.Mesh(new THREE.TorusGeometry(.37,.07,6,16),gold);belt.rotation.x=Math.PI/2;belt.position.y=.65;g.add(belt);
  const shaft=new THREE.Mesh(new THREE.CylinderGeometry(.055,.075,2.45,8),dark);
  shaft.position.set(.53,1.15,.22);shaft.rotation.z=-.18;g.add(shaft);
  const headAxe=new THREE.Mesh(new THREE.BoxGeometry(.18,.62,.78),gold);
  headAxe.position.set(.72,2.25,.22);g.add(headAxe);
  const cap=new THREE.Mesh(new THREE.SphereGeometry(.12,8,6),gold);cap.position.set(0,1.83,0);g.add(cap);
  return g;
}
function buildPortalGuards() {
  for(const side of [-1,1]){
    for(let i=0;i<7;i++){
      const z=side*(9.5+i*.95);
      // Guards stand just inside the cave portal, on the actual lower hall floor.
      scene.add(buildDwarfGuard(-260.5,z,side,i));
    }
  }
}

function buildCaveShell() {
  const longitudinal=52,radial=64;
  const positions=[],colors=[],indices=[];
  const startX=THRONE_ROOM_MAX_X-1.0,endX=THRONE_ROOM_MIN_X-1.0;
  const length=startX-endX;
  const centerY=THRONE_ROOM_FLOOR+THRONE_ROOM_HEIGHT/2-.35;
  const verticalRadius=THRONE_ROOM_HEIGHT/2+.15;
  const horizontalRadius=THRONE_ROOM_HALF_WIDTH+.7;
  for(let i=0;i<=longitudinal;i++){
    const t=i/longitudinal,x=startX-length*t;
    for(let j=0;j<=radial;j++){
      const a=j/radial*Math.PI*2;
      const distortion=fbm(x*.031,Math.cos(a)*1.7+Math.sin(a)*.9)*.055;
      const y=centerY+Math.sin(a)*verticalRadius*(1+distortion);
      const z=Math.cos(a)*horizontalRadius*(1+distortion);
      positions.push(x,y,z);
      const shade=THREE.MathUtils.clamp(.78+fbm(x*.018,z*.05)*.16,.52,.98);
      colors.push(shade,shade*.94,shade*.84);
    }
  }
  for(let i=0;i<longitudinal;i++)for(let j=0;j<radial;j++){
    const a=i*(radial+1)+j,b=a+radial+1;
    indices.push(a,b,a+1,a+1,b,b+1);
  }
  const geo=new THREE.BufferGeometry();
  geo.setAttribute("position",new THREE.Float32BufferAttribute(positions,3));
  geo.setAttribute("color",new THREE.Float32BufferAttribute(colors,3));
  geo.setIndex(indices);geo.computeVertexNormals();
  const rock=new THREE.Mesh(geo,new THREE.MeshStandardMaterial({
    color:0xffffff,vertexColors:true,roughness:.96,side:THREE.DoubleSide
  }));
  rock.receiveShadow=true;scene.add(rock);

  const floor=new THREE.Mesh(new THREE.BoxGeometry(length+2,.72,THRONE_ROOM_HALF_WIDTH*2),
    new THREE.MeshStandardMaterial({color:0x6b4e3a,roughness:.3,metalness:.02}));
  floor.position.set((startX+endX)/2,THRONE_ROOM_FLOOR-.36,0);
  floor.receiveShadow=true;scene.add(floor);

  const endRock=new THREE.Mesh(new THREE.SphereGeometry(1,24,16),
    new THREE.MeshStandardMaterial({color:0x685a4a,roughness:1}));
  endRock.scale.set(5.5,12.8,18.2);
  endRock.position.set(THRONE_ROOM_MIN_X-2.7,THRONE_ROOM_FLOOR+12.0,0);scene.add(endRock);
}

function makeRockSpire(height,radius,up=true) {
  const group=new THREE.Group();
  const mat=new THREE.MeshStandardMaterial({color:0x75695b,roughness:1});
  const cone=new THREE.Mesh(new THREE.ConeGeometry(radius,height,9,2),mat);
  if(!up)cone.rotation.x=Math.PI;
  group.add(cone);
  const shoulder=new THREE.Mesh(new THREE.IcosahedronGeometry(1,1),
    new THREE.MeshStandardMaterial({color:0x847666,roughness:1}));
  shoulder.scale.set(radius*.9,height*.18,radius*.9);
  shoulder.position.y=height*.14;group.add(shoulder);
  return group;
}
function buildCaveFormations() {
  // Each stalactite and stalagmite is massive enough to read as thicker than a person.
  for(let i=0;i<12;i++){
    const x=THRONE_ROOM_MAX_X-14-i*12.3;
    for(const side of [-1,1]){
      const h=5.8+hash(i,side+7)*3.4,r=1.35+hash(i,side+12)*.45;
      const lower=makeRockSpire(h,r,true);
      lower.position.set(x,THRONE_ROOM_FLOOR+h/2,side*16.25);
      scene.add(lower);
      const upperH=6.4+hash(i,side+19)*3.5;
      const upper=makeRockSpire(upperH,r*.92,false);
      upper.position.set(x-3.0,THRONE_ROOM_FLOOR+THRONE_ROOM_HEIGHT-upperH/2,side*16.0);
      scene.add(upper);
    }
  }
}

function buildDwarfKingStatue(x,z,side,index) {
  const group=new THREE.Group();group.position.set(x,THRONE_ROOM_FLOOR,z);
  group.rotation.y=side>0?Math.PI:0;
  const stone=new THREE.MeshStandardMaterial({color:index%3===0?0x98958b:0x827f78,roughness:.82,metalness:.04});
  const dark=new THREE.MeshStandardMaterial({color:0x494b4b,roughness:.78});
  const gold=new THREE.MeshStandardMaterial({color:0x9f8758,metalness:.62,roughness:.38});
  const base=new THREE.Mesh(new THREE.BoxGeometry(3.25,1.05,2.8),dark);
  base.position.y=.525;group.add(base);
  const seat=new THREE.Mesh(new THREE.BoxGeometry(1.75,1.55,1.4),dark);
  seat.position.set(0,1.45,-.12);group.add(seat);
  const robe=new THREE.Mesh(new THREE.CylinderGeometry(.78,.92,1.45,10),stone);
  robe.position.set(0,2.12,.05);group.add(robe);
  const shoulders=new THREE.Mesh(new THREE.SphereGeometry(.88,12,10),stone);
  shoulders.scale.set(1.05,.56,.75);shoulders.position.set(0,2.62,0);group.add(shoulders);
  const head=new THREE.Mesh(new THREE.SphereGeometry(.52,12,10),stone);
  head.scale.set(1,1.08,.92);head.position.set(0,3.35,.1);group.add(head);
  const beard=new THREE.Mesh(new THREE.ConeGeometry(.42,1.05,8),stone);
  beard.position.set(0,2.77,.48);beard.rotation.x=-.12;group.add(beard);
  for(const armSide of [-1,1]){
    const arm=new THREE.Mesh(new THREE.CylinderGeometry(.22,.28,1.0,8),stone);
    arm.position.set(armSide*.72,2.25,.18);arm.rotation.z=-armSide*.22;group.add(arm);
    const hand=new THREE.Mesh(new THREE.SphereGeometry(.22,8,7),stone);
    hand.position.set(armSide*.68,1.88,.48);group.add(hand);
    const knee=new THREE.Mesh(new THREE.BoxGeometry(.58,.62,.62),stone);
    knee.position.set(armSide*.38,1.55,.68);group.add(knee);
  }
  const crownBand=new THREE.Mesh(new THREE.TorusGeometry(.48,.10,6,18),gold);
  crownBand.position.set(0,3.77,.1);crownBand.rotation.x=Math.PI/2;group.add(crownBand);
  for(let i=0;i<5;i++){
    const a=(i/4-.5)*Math.PI*.8;
    const spike=new THREE.Mesh(new THREE.ConeGeometry(.10,.5,5),gold);
    spike.position.set(Math.sin(a)*.43,4.05,.1+Math.cos(a)*.12);group.add(spike);
  }
  const plaque=new THREE.Mesh(new THREE.BoxGeometry(1.9,.52,.12),gold);
  plaque.position.set(0,.98,side>0?-1.47:1.47);group.add(plaque);
  for(let k=0;k<3;k++){
    const rune=new THREE.Mesh(new THREE.BoxGeometry(.12,.28,.055),dark);
    rune.position.set((k-1)*.38,1.0,side>0?-1.55:1.55);group.add(rune);
  }
  return group;
}
function buildKingStatues() {
  // 41 predecessors: twenty-one on one side and twenty on the other.
  const firstX=THRONE_ROOM_MAX_X-20.5,spacing=6.05;
  for(let i=0;i<21;i++){
    scene.add(buildDwarfKingStatue(firstX-i*spacing,-12.2,-1,i));
  }
  for(let i=0;i<20;i++){
    scene.add(buildDwarfKingStatue(firstX-i*spacing,12.2,1,i+21));
  }
}

function buildMonolithicThrone() {
  const blackMarble=new THREE.MeshStandardMaterial({color:0x171a1e,roughness:.28,metalness:.06});
  const dais=new THREE.Mesh(new THREE.BoxGeometry(8.4,1.1,9.4),blackMarble);
  dais.position.set(THRONE_ROOM_MIN_X+10.5,THRONE_ROOM_FLOOR+.55,0);scene.add(dais);
  const shape=new THREE.Shape();
  shape.moveTo(-2.25,0);shape.lineTo(2.25,0);shape.lineTo(2.25,1.8);
  shape.lineTo(1.72,2.05);shape.lineTo(1.72,2.85);
  shape.lineTo(1.35,2.85);shape.lineTo(1.35,5.0);
  shape.lineTo(-1.35,5.0);shape.lineTo(-1.35,2.85);
  shape.lineTo(-1.72,2.85);shape.lineTo(-1.72,2.05);
  shape.lineTo(-2.25,1.8);shape.closePath();
  const geometry=new THREE.ExtrudeGeometry(shape,{depth:5.2,bevelEnabled:false,steps:1,curveSegments:1});
  geometry.translate(0,0,-2.6);
  const throne=new THREE.Mesh(geometry,blackMarble);
  throne.rotation.y=Math.PI/2;
  throne.position.set(THRONE_ROOM_MIN_X+8.5,THRONE_ROOM_FLOOR+1.05,0);
  throne.castShadow=true;throne.receiveShadow=true;scene.add(throne);
}

function buildThroneRoomLanterns() {
  const lanternMat=new THREE.MeshStandardMaterial({
    color:0xf2d5a0,emissive:0xe3a75d,emissiveIntensity:1.45,roughness:.25
  });
  const sconce=new THREE.MeshStandardMaterial({color:0x585048,metalness:.45,roughness:.6});
  for(let i=0;i<10;i++){
    const x=THRONE_ROOM_MAX_X-14-i*15.2,side=i%2===0?-1:1;
    const mount=new THREE.Mesh(new THREE.BoxGeometry(1.1,1.4,1.0),sconce);
    mount.position.set(x,THRONE_ROOM_FLOOR+5.7,side*16.7);scene.add(mount);
    const lamp=new THREE.Mesh(new THREE.SphereGeometry(.48,10,8),lanternMat);
    lamp.position.set(x,THRONE_ROOM_FLOOR+6.7,side*16.2);scene.add(lamp);
    const light=new THREE.PointLight(0xffc77e,34,42,2);
    light.position.set(x,THRONE_ROOM_FLOOR+6.5,side*14.4);scene.add(light);
  }
}

function buildThroneRoom() {
  buildThroneAccess();
  buildCaveShell();
  buildGraniteThroneDoors();
  buildPortalGuards();
  buildCaveFormations();
  buildKingStatues();
  buildMonolithicThrone();
  buildThroneRoomLanterns();
}
buildThroneRoom();
