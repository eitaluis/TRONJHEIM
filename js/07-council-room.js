// ============================================================================
// FASE 7 — SALA DO CONSELHO DOS ANCIÃOS
// [LIVRO: ELDEST] sala circular; cúpula azul-celeste com constelações;
// mesa redonda de mármore com o brasão de Dûrgrimst Ingeitum:
// martelo vertical cercado por doze estrelas.
// [INTERPRETAÇÃO] dimensões, implantação no quadrante oeste, número e posição
// das cadeiras, desenho das molduras e iluminação. O texto descreve a sala,
// mas não fornece uma planta baixa nem sua posição exata em Tronjheim.
// ============================================================================

const COUNCIL_ROOM_CENTER_X = -590;
const COUNCIL_ROOM_CENTER_Z = 0;
const COUNCIL_ROOM_RADIUS = 24;
const COUNCIL_ROOM_FLOOR = ENTRY_HALL_FLOOR;
const COUNCIL_ROOM_WALL_HEIGHT = 14;
const COUNCIL_ROOM_PASSAGE_END_X = -566;

function councilRoomWalkableContains(x,z) {
  const elderPassage = x<=-519.5 && x>=COUNCIL_ROOM_PASSAGE_END_X-1.5 && Math.abs(z)<=8.2;
  const libraryPassage = x<=-613.5 && x>=-630.2 && Math.abs(z)<=7.2;
  const r = Math.hypot(x-COUNCIL_ROOM_CENTER_X,z-COUNCIL_ROOM_CENTER_Z);
  const currentR = Math.hypot(jogador.pos.x-COUNCIL_ROOM_CENTER_X,jogador.pos.z-COUNCIL_ROOM_CENTER_Z);
  const alreadyInside = currentR<=COUNCIL_ROOM_RADIUS-.35;
  const enteringThroughEastDoor = jogador.pos.x<=-540 && jogador.pos.x>=COUNCIL_ROOM_PASSAGE_END_X-1.5 &&
    Math.abs(jogador.pos.z)<=8.2 && jogador.pos.x>COUNCIL_ROOM_CENTER_X;
  const enteringThroughWestDoor = jogador.pos.x<=-613.5 && jogador.pos.x>=-630.2 &&
    Math.abs(jogador.pos.z)<=7.2 && jogador.pos.x<COUNCIL_ROOM_CENTER_X;
  const chamber = r<=COUNCIL_ROOM_RADIUS-.35 && (alreadyInside||enteringThroughEastDoor||enteringThroughWestDoor);
  return elderPassage||libraryPassage||chamber;
}
function councilRoomFloorAtXZ(x,z) {
  return councilRoomWalkableContains(x,z)?COUNCIL_ROOM_FLOOR:null;
}

function councilBox(w,h,d,material,x,y,z,rotationY=0) {
  const mesh=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),material);
  mesh.position.set(x,y,z);mesh.rotation.y=rotationY;
  mesh.castShadow=true;mesh.receiveShadow=true;scene.add(mesh);
  return mesh;
}

function buildCouncilPassage() {
  const start=-520.5,end=COUNCIL_ROOM_PASSAGE_END_X,length=start-end,mid=(start+end)/2;
  const floorMat=new THREE.MeshStandardMaterial({color:0xd7d3c9,roughness:.42});
  const wallMat=new THREE.MeshStandardMaterial({color:0xc6c4bb,roughness:.56});
  const blueStone=new THREE.MeshStandardMaterial({color:0x304a67,roughness:.46,metalness:.08});
  const brass=new THREE.MeshStandardMaterial({color:0xa48a58,metalness:.68,roughness:.31});

  const floor=new THREE.Mesh(new THREE.BoxGeometry(length,1.8,19.4),floorMat);
  floor.position.set(mid,COUNCIL_ROOM_FLOOR-.9,0);floor.receiveShadow=true;scene.add(floor);
  const roof=new THREE.Mesh(new THREE.BoxGeometry(length,1.6,20.4),wallMat);
  roof.position.set(mid,COUNCIL_ROOM_FLOOR+16.2,0);scene.add(roof);
  for(const side of [-1,1]){
    const wall=new THREE.Mesh(new THREE.BoxGeometry(length,16,1.7),wallMat);
    wall.position.set(mid,COUNCIL_ROOM_FLOOR+8,side*9.5);wall.receiveShadow=true;scene.add(wall);
  }
  // Recessed, repeated arch ribs lead the eye from the west hall into the chamber.
  for(let i=0;i<3;i++){
    const x=start-8-i*13.2;
    const rib=new THREE.Mesh(new THREE.TorusGeometry(9.2,.42,8,40,Math.PI),
      i===2?brass:blueStone);
    rib.rotation.y=Math.PI/2;rib.position.set(x,COUNCIL_ROOM_FLOOR+8.6,0);scene.add(rib);
    for(const side of [-1,1]){
      const pier=new THREE.Mesh(new THREE.BoxGeometry(1.15,16,1.2),blueStone);
      pier.position.set(x,COUNCIL_ROOM_FLOOR+8,side*9.05);scene.add(pier);
      const capital=new THREE.Mesh(new THREE.BoxGeometry(2.0,.7,2.0),brass);
      capital.position.set(x,COUNCIL_ROOM_FLOOR+15.2,side*9.05);scene.add(capital);
    }
  }
  // A luminous threshold marks the entrance without blocking the passage.
  const threshold=new THREE.Mesh(new THREE.BoxGeometry(3,.3,20),brass);
  threshold.position.set(end+.2,COUNCIL_ROOM_FLOOR+.035,0);scene.add(threshold);
}

function buildCouncilRoomShell() {
  const cx=COUNCIL_ROOM_CENTER_X,cz=COUNCIL_ROOM_CENTER_Z,y=COUNCIL_ROOM_FLOOR;
  const paleMarble=new THREE.MeshStandardMaterial({color:0xd9d8d0,roughness:.39,metalness:.035});
  const marbleTrim=new THREE.MeshStandardMaterial({color:0xaaa99f,roughness:.35,metalness:.08});
  const blueDome=new THREE.MeshStandardMaterial({
    color:0x1e3b61,roughness:.72,metalness:.06,side:THREE.DoubleSide
  });
  const blueWall=new THREE.MeshStandardMaterial({color:0x61758b,roughness:.58,metalness:.035});
  const darkBlue=new THREE.MeshStandardMaterial({color:0x172b44,roughness:.72});

  const floor=new THREE.Mesh(new THREE.CircleGeometry(COUNCIL_ROOM_RADIUS,112),paleMarble);
  floor.rotation.x=-Math.PI/2;floor.position.set(cx,y+.018,cz);
  floor.receiveShadow=true;scene.add(floor);

  // The cylindrical wall has two genuine openings: east to the western
  // hall, and west to the Great Library. CylinderGeometry's XZ angle starts
  // on +Z, so the east/west openings are centered at PI/2 and 3PI/2.
  const halfDoorAngle=.44;
  const wallArcs=[
    [0,Math.PI/2-halfDoorAngle],
    [Math.PI/2+halfDoorAngle,Math.PI-2*halfDoorAngle],
    [3*Math.PI/2+halfDoorAngle,Math.PI/2-halfDoorAngle]
  ];
  for(const [startAngle,arcLength] of wallArcs){
    const wallGeo=new THREE.CylinderGeometry(
      COUNCIL_ROOM_RADIUS,COUNCIL_ROOM_RADIUS,COUNCIL_ROOM_WALL_HEIGHT,
      112,1,true,startAngle,arcLength
    );
    const wall=new THREE.Mesh(wallGeo,blueWall);
    wall.position.set(cx,y+COUNCIL_ROOM_WALL_HEIGHT/2,cz);
    wall.receiveShadow=true;scene.add(wall);
  }

  // Carved marble belt and cornice bands define the room's round geometry.
  for(const [yy,r,tube,mat] of [
    [y+1.2,COUNCIL_ROOM_RADIUS-.25,.32,marbleTrim],
    [y+12.9,COUNCIL_ROOM_RADIUS-.22,.44,paleMarble],
    [y+14.05,COUNCIL_ROOM_RADIUS-.1,.3,marbleTrim]
  ]){
    const ring=new THREE.Mesh(new THREE.TorusGeometry(r,tube,8,112),mat);
    ring.rotation.x=Math.PI/2;ring.position.set(cx,yy,cz);scene.add(ring);
  }

  // Fourteen pale pilasters articulate the curved wall; the doorway sector is skipped.
  for(let i=0;i<14;i++){
    const a=(i/14)*Math.PI*2;
    const delta=Math.abs(Math.atan2(Math.sin(a),Math.cos(a)));
    if(delta<.62)continue;
    const px=cx+Math.cos(a)*(COUNCIL_ROOM_RADIUS-.28);
    const pz=cz+Math.sin(a)*(COUNCIL_ROOM_RADIUS-.28);
    const pier=new THREE.Mesh(new THREE.BoxGeometry(1.1,12.5,1.45),paleMarble);
    pier.position.set(px,y+6.3,pz);pier.rotation.y=-a;scene.add(pier);
    const cap=new THREE.Mesh(new THREE.BoxGeometry(1.8,.8,2.0),marbleTrim);
    cap.position.set(px,y+12.8,pz);cap.rotation.y=-a;scene.add(cap);
  }

  // The entrance is a defined arched doorway, with both leaves held open against
  // the sides. The passage is therefore a real architectural opening, not a hole
  // through an otherwise solid wall.
  const doorFrameMat=new THREE.MeshStandardMaterial({color:0x8e7650,metalness:.56,roughness:.34});
  for(const side of [-1,1]){
    const jamb=new THREE.Mesh(new THREE.BoxGeometry(1.6,15.5,1.7),paleMarble);
    jamb.position.set(cx+COUNCIL_ROOM_RADIUS-.45,y+7.75,side*10.25);scene.add(jamb);
    const capital=new THREE.Mesh(new THREE.BoxGeometry(2.4,1.0,2.4),doorFrameMat);
    capital.position.set(cx+COUNCIL_ROOM_RADIUS-.45,y+15.1,side*10.25);scene.add(capital);

    const door=new THREE.Group();
    door.position.set(cx+COUNCIL_ROOM_RADIUS-.8,y,side*10.1);
    door.rotation.y=side*1.2;
    const leaf=new THREE.Mesh(new THREE.BoxGeometry(.7,13.8,8.0),
      new THREE.MeshStandardMaterial({color:0x3c2c21,roughness:.78}));
    leaf.position.set(0,6.9,-side*4.0);door.add(leaf);
    for(const yy of [2.1,6.9,11.7]){
      const band=new THREE.Mesh(new THREE.BoxGeometry(.86,.34,7.7),doorFrameMat);
      band.position.set(.42,yy,-side*4.0);door.add(band);
    }
    scene.add(door);
  }
  const arch=new THREE.Mesh(new THREE.TorusGeometry(10.2,.55,10,48,Math.PI),paleMarble);
  arch.rotation.y=Math.PI/2;arch.position.set(cx+COUNCIL_ROOM_RADIUS-.15,y+10.1,0);scene.add(arch);

  // Matching west portal and double leaves held open against the inner wall.
  for(const side of [-1,1]){
    const jamb=new THREE.Mesh(new THREE.BoxGeometry(1.6,15.5,1.7),paleMarble);
    jamb.position.set(cx-COUNCIL_ROOM_RADIUS+.45,y+7.75,side*7.2);scene.add(jamb);
    const capital=new THREE.Mesh(new THREE.BoxGeometry(2.4,1.0,2.4),doorFrameMat);
    capital.position.set(cx-COUNCIL_ROOM_RADIUS+.45,y+15.1,side*7.2);scene.add(capital);
    const door=new THREE.Group();
    door.position.set(cx-COUNCIL_ROOM_RADIUS+.8,y,side*7.0);
    door.rotation.y=-side*1.2;
    const leaf=new THREE.Mesh(new THREE.BoxGeometry(.7,13.8,7.0),
      new THREE.MeshStandardMaterial({color:0x3c2c21,roughness:.78}));
    leaf.position.set(0,6.9,-side*3.5);door.add(leaf);
    for(const yy of [2.1,6.9,11.7]){
      const band=new THREE.Mesh(new THREE.BoxGeometry(.86,.34,6.8),doorFrameMat);
      band.position.set(.42,yy,-side*3.5);door.add(band);
    }
    scene.add(door);
  }
  const westArch=new THREE.Mesh(new THREE.TorusGeometry(7.2,.55,10,48,Math.PI),paleMarble);
  westArch.rotation.y=-Math.PI/2;westArch.position.set(cx-COUNCIL_ROOM_RADIUS+.15,y+7.2,0);scene.add(westArch);

  // Sky-blue hemispherical dome — the canonical identifying feature of the room.
  const domeGeo=new THREE.SphereGeometry(COUNCIL_ROOM_RADIUS,72,36,0,Math.PI*2,0,Math.PI/2);
  const dome=new THREE.Mesh(domeGeo,blueDome);
  dome.position.set(cx,y+COUNCIL_ROOM_WALL_HEIGHT,cz);
  dome.receiveShadow=true;scene.add(dome);

  // A subtle central boss and radial ribs frame the constellations.
  const boss=new THREE.Mesh(new THREE.SphereGeometry(1.25,20,16),marbleTrim);
  boss.position.set(cx,y+COUNCIL_ROOM_WALL_HEIGHT+COUNCIL_ROOM_RADIUS-.7,cz);scene.add(boss);
  for(let i=0;i<8;i++){
    const a=i*Math.PI/4;
    const r=COUNCIL_ROOM_RADIUS-.6;
    const pointA=new THREE.Vector3(cx,y+14.4,cz);
    const pointB=new THREE.Vector3(cx+Math.cos(a)*r,y+14.4,cz+Math.sin(a)*r);
    const curve=new THREE.LineCurve3(pointA,pointB);
    const rib=new THREE.Mesh(new THREE.TubeGeometry(curve,24,.11,6,false),marbleTrim);
    scene.add(rib);
  }
}

function buildCouncilConstellations() {
  const cx=COUNCIL_ROOM_CENTER_X,cz=COUNCIL_ROOM_CENTER_Z;
  const baseY=COUNCIL_ROOM_FLOOR+COUNCIL_ROOM_WALL_HEIGHT;
  const radius=COUNCIL_ROOM_RADIUS-.38;
  const starMaterial=new THREE.MeshBasicMaterial({color:0xd9e8ff});
  const warmStarMaterial=new THREE.MeshBasicMaterial({color:0xe2c78d});
  const starGeo=new THREE.SphereGeometry(.16,8,6);
  const points=[];
  const stars=[];
  // Deterministic golden-angle placement produces a composed celestial ceiling.
  for(let i=0;i<76;i++){
    const phi=.12+((i*7)%31)/31*1.38;
    const theta=i*2.399963229728653;
    const x=cx+Math.sin(phi)*Math.cos(theta)*radius;
    const y=baseY+Math.cos(phi)*radius-.22;
    const z=cz+Math.sin(phi)*Math.sin(theta)*radius;
    const star=new THREE.Mesh(starGeo,i%9===0?warmStarMaterial:starMaterial);
    star.position.set(x,y,z);scene.add(star);stars.push(star.position.clone());
  }
  const pairs=[[1,5],[5,12],[12,18],[18,24],[7,15],[15,22],[22,28],[31,37],[37,44],[44,51],[53,59],[59,66],[66,72]];
  const vertices=[];
  for(const [a,b] of pairs){
    const p=stars[a],q=stars[b];
    vertices.push(p.x,p.y,p.z,q.x,q.y,q.z);
  }
  const geometry=new THREE.BufferGeometry();
  geometry.setAttribute("position",new THREE.Float32BufferAttribute(vertices,3));
  const lines=new THREE.LineSegments(geometry,
    new THREE.LineBasicMaterial({color:0x88a8d1,transparent:true,opacity:.48}));
  scene.add(lines);

  // Thin constellations are also visible from the floor, not only as scattered dots.
  const halo=new THREE.Mesh(new THREE.TorusGeometry(8.2,.075,6,96),
    new THREE.MeshBasicMaterial({color:0x6888b3,transparent:true,opacity:.36}));
  halo.rotation.x=Math.PI/2;halo.position.set(cx,baseY+radius*.56,cz);scene.add(halo);
}

function buildCouncilTable() {
  const cx=COUNCIL_ROOM_CENTER_X,cz=COUNCIL_ROOM_CENTER_Z,y=COUNCIL_ROOM_FLOOR;
  const marble=new THREE.MeshStandardMaterial({color:0xe3e1d8,roughness:.24,metalness:.04});
  const darker=new THREE.MeshStandardMaterial({color:0xbfc0bc,roughness:.34,metalness:.08});
  const silver=new THREE.MeshStandardMaterial({color:0xb9c6d4,metalness:.72,roughness:.23});
  const gold=new THREE.MeshStandardMaterial({color:0xa88950,metalness:.72,roughness:.27});

  const pedestal=new THREE.Mesh(new THREE.CylinderGeometry(2.5,3.6,1.5,32),darker);
  pedestal.position.set(cx,y+1.15,cz);scene.add(pedestal);
  const table=new THREE.Mesh(new THREE.CylinderGeometry(5.7,5.7,.72,64),marble);
  table.position.set(cx,y+2.05,cz);table.castShadow=true;table.receiveShadow=true;scene.add(table);
  const rim=new THREE.Mesh(new THREE.TorusGeometry(5.48,.15,8,96),gold);
  rim.rotation.x=Math.PI/2;rim.position.set(cx,y+2.42,cz);scene.add(rim);

  // Ingeitum crest: vertical hammer enclosed by twelve stars.
  const hammer=new THREE.Group();hammer.position.set(cx,y+2.43,cz);
  const head=new THREE.Mesh(new THREE.BoxGeometry(2.2,.16,.62),silver);
  head.position.set(0,0,-.76);hammer.add(head);
  const collar=new THREE.Mesh(new THREE.BoxGeometry(.48,.18,1.1),gold);
  collar.position.set(0,.015,-.75);hammer.add(collar);
  const shaft=new THREE.Mesh(new THREE.BoxGeometry(.42,.16,2.35),silver);
  shaft.position.set(0,0,.55);hammer.add(shaft);
  const pommel=new THREE.Mesh(new THREE.OctahedronGeometry(.32,0),gold);
  pommel.position.set(0,.04,1.76);hammer.add(pommel);scene.add(hammer);

  const starShape=new THREE.Shape();
  for(let i=0;i<10;i++){
    const a=i/10*Math.PI*2-Math.PI/2,r=i%2===0?.28:.12;
    const x=Math.cos(a)*r,z=Math.sin(a)*r;
    if(i===0)starShape.moveTo(x,z);else starShape.lineTo(x,z);
  }
  starShape.closePath();
  const starGeo=new THREE.ShapeGeometry(starShape);
  for(let i=0;i<12;i++){
    const a=i/12*Math.PI*2,r=4.25;
    const star=new THREE.Mesh(starGeo,silver);
    star.rotation.x=-Math.PI/2;
    star.position.set(cx+Math.cos(a)*r,y+2.47,cz+Math.sin(a)*r);
    scene.add(star);
  }

  // Seats remain empty; the scene depicts the chamber architecture rather than
  // inventing portraits or identities for the five named council members.
  const chairStone=new THREE.MeshStandardMaterial({color:0xb7b5ad,roughness:.52});
  const chairDark=new THREE.MeshStandardMaterial({color:0x4b5360,roughness:.72});
  const chairTrim=new THREE.MeshStandardMaterial({color:0x9f8758,metalness:.62,roughness:.34});
  for(let i=0;i<12;i++){
    const a=i/12*Math.PI*2;
    const x=cx+Math.cos(a)*8.6,z=cz+Math.sin(a)*8.6;
    const chair=new THREE.Group();chair.position.set(x,y,z);
    chair.rotation.y=-a+Math.PI/2;
    const seat=new THREE.Mesh(new THREE.BoxGeometry(1.7,.42,1.55),chairStone);
    seat.position.y=1.12;chair.add(seat);
    const back=new THREE.Mesh(new THREE.BoxGeometry(1.7,2.0,.38),chairDark);
    back.position.set(0,2.15,-.63);chair.add(back);
    const top=new THREE.Mesh(new THREE.BoxGeometry(1.84,.24,.5),chairTrim);
    top.position.set(0,3.2,-.63);chair.add(top);
    for(const side of [-1,1]){
      const leg=new THREE.Mesh(new THREE.BoxGeometry(.2,1.0,.2),chairDark);
      leg.position.set(side*.64,.5,.52);chair.add(leg);
      const arm=new THREE.Mesh(new THREE.BoxGeometry(.22,.22,1.3),chairTrim);
      arm.position.set(side*.82,1.65,-.03);chair.add(arm);
    }
    scene.add(chair);
  }
}

function buildCouncilLanterns() {
  const cx=COUNCIL_ROOM_CENTER_X,cz=COUNCIL_ROOM_CENTER_Z,y=COUNCIL_ROOM_FLOOR;
  const sconce=new THREE.MeshStandardMaterial({color:0x6b6d6d,metalness:.72,roughness:.32});
  const glass=new THREE.MeshStandardMaterial({
    color:0xe5d5ad,emissive:0xd7ab64,emissiveIntensity:1.3,roughness:.22
  });
  for(let i=0;i<8;i++){
    const a=i/8*Math.PI*2;
    if(Math.abs(Math.atan2(Math.sin(a),Math.cos(a)))<.64)continue;
    const x=cx+Math.cos(a)*(COUNCIL_ROOM_RADIUS-.7);
    const z=cz+Math.sin(a)*(COUNCIL_ROOM_RADIUS-.7);
    const mount=new THREE.Mesh(new THREE.BoxGeometry(1.2,1.1,.8),sconce);
    mount.position.set(x,y+7.6,z);mount.rotation.y=-a;scene.add(mount);
    const lamp=new THREE.Mesh(new THREE.SphereGeometry(.55,10,8),glass);
    lamp.position.set(x,y+8.6,z);scene.add(lamp);
    const light=new THREE.PointLight(0xffd99b,34,38,2);
    light.position.set(x,y+8.2,z);scene.add(light);
  }
  const skylight=new THREE.PointLight(0x8db9ee,42,45,2);
  skylight.position.set(cx,y+24,cz);scene.add(skylight);
}

function buildCouncilRoom() {
  buildCouncilPassage();
  buildCouncilRoomShell();
  buildCouncilConstellations();
  buildCouncilTable();
  buildCouncilLanterns();
}
buildCouncilRoom();
