// ============================================================================
// TRONJHEIM — FASE 11: ARQUITETURA DE CONEXÃO, AMBIENTES E VIDA MATERIAL
// [INTERPRETAÇÃO] escadarias monumentais, fachadas externas, mobiliário e
// equipamentos cotidianos. A estrutura dos ambientes continua separada dos
// elementos decorativos para que colisão e exploração sejam previsíveis.
// ============================================================================

const TRONJHEIM_ENVIRONMENT_PASS = { built:false, training:false, exteriors:false };

function makeEnvironmentStone(color=0xaaa9a2,roughness=.82,metalness=.02){
  return new THREE.MeshStandardMaterial({color,roughness,metalness});
}
function addEnvironmentMesh(geometry,material,x,y,z,rotationY=0){
  const mesh=new THREE.Mesh(geometry,material);
  mesh.position.set(x,y,z);mesh.rotation.y=rotationY;
  mesh.castShadow=true;mesh.receiveShadow=true;scene.add(mesh);
  return mesh;
}
function environmentAngleDelta(a,b){
  return Math.abs(Math.atan2(Math.sin(a-b),Math.cos(a-b)));
}

// A real vaulted envelope follows the three spline stair flights. It creates
// visible side walls, an arched ceiling, stone ribs and wall lamps around the
// existing treads, so the stairs no longer appear suspended in an empty void.
function buildThroneStairVault(path){
  const width=path.width+5.8,half=width/2;
  const spring=8.6,archRise=4.8,height=spring+archRise;
  const profile=[];
  for(let i=0;i<=8;i++)profile.push({u:-half,y:spring*i/8});
  for(let i=1;i<=36;i++){
    const a=Math.PI-Math.PI*i/36;
    profile.push({u:half*Math.cos(a),y:spring+archRise*Math.sin(a)});
  }
  for(let i=1;i<=8;i++)profile.push({u:half,y:spring*(1-i/8)});

  const sections=Math.max(120,Math.ceil(path.curve.getLength()/1.25));
  const positions=[],uvs=[],indices=[];
  for(let i=0;i<=sections;i++){
    const t=i/sections,p=path.curve.getPointAt(t),tan=path.curve.getTangentAt(t);
    const hlen=Math.hypot(tan.x,tan.z)||1;
    const nx=-tan.z/hlen,nz=tan.x/hlen;
    const stepIndex=THREE.MathUtils.clamp(Math.floor(t*path.steps),0,path.steps-1);
    const floorY=path.topY-(stepIndex+1)*path.rise;
    for(let j=0;j<profile.length;j++){
      const q=profile[j];
      positions.push(p.x+nx*q.u,floorY+q.y,p.z+nz*q.u);
      uvs.push(t*path.curve.getLength()/10,j/(profile.length-1)*2);
    }
  }
  for(let i=0;i<sections;i++)for(let j=0;j<profile.length-1;j++){
    const a=i*profile.length+j,b=a+profile.length;
    indices.push(a,b,a+1,b,b+1,a+1);
  }
  const geo=new THREE.BufferGeometry();
  geo.setAttribute("position",new THREE.Float32BufferAttribute(positions,3));
  geo.setAttribute("uv",new THREE.Float32BufferAttribute(uvs,2));
  geo.setIndex(indices);geo.computeVertexNormals();
  const wallMat=new THREE.MeshStandardMaterial({color:0x696b6b,roughness:.86,metalness:.025,side:THREE.DoubleSide});
  const shell=new THREE.Mesh(geo,wallMat);
  shell.castShadow=true;shell.receiveShadow=true;scene.add(shell);

  const ribMat=new THREE.MeshStandardMaterial({color:0xc2beb4,roughness:.48,metalness:.035});
  const jasper=new THREE.MeshStandardMaterial({color:0x702b34,roughness:.42,metalness:.06});
  const bronze=new THREE.MeshStandardMaterial({color:0x9e8153,roughness:.32,metalness:.7});
  const lampMat=new THREE.MeshStandardMaterial({color:0xf0d9b2,emissive:0xd49d56,emissiveIntensity:1.1,roughness:.26});
  const length=path.curve.getLength();
  for(let distance=8;distance<length-5;distance+=11.5){
    const t=distance/length,p=path.curve.getPointAt(t),tan=path.curve.getTangentAt(t);
    const hlen=Math.hypot(tan.x,tan.z)||1,nx=-tan.z/hlen,nz=tan.x/hlen;
    const stepIndex=THREE.MathUtils.clamp(Math.floor(t*path.steps),0,path.steps-1);
    const floorY=path.topY-(stepIndex+1)*path.rise;
    const points=profile.map(q=>new THREE.Vector3(p.x+nx*q.u,floorY+q.y,p.z+nz*q.u));
    const archCurve=new THREE.CatmullRomCurve3(points,false,"centripetal");
    const rib=new THREE.Mesh(new THREE.TubeGeometry(archCurve,88,.42,8,false),ribMat);
    rib.castShadow=true;rib.receiveShadow=true;scene.add(rib);

    for(const side of [-1,1]){
      const wallX=p.x+nx*side*(half-.65),wallZ=p.z+nz*side*(half-.65);
      const pier=new THREE.Mesh(new THREE.CylinderGeometry(.82,1.05,8.3,18,2),jasper);
      pier.position.set(wallX,floorY+4.15,wallZ);
      pier.castShadow=true;pier.receiveShadow=true;scene.add(pier);
      const capital=new THREE.Mesh(new THREE.BoxGeometry(2.1,.6,2.1),bronze);
      capital.position.set(wallX,floorY+8.35,wallZ);capital.rotation.y=Math.atan2(tan.x,tan.z);scene.add(capital);

      const mount=new THREE.Mesh(new THREE.BoxGeometry(.85,1.35,.72),bronze);
      mount.position.set(wallX-nx*side*.2,floorY+5.0,wallZ-nz*side*.2);scene.add(mount);
      const lamp=new THREE.Mesh(new THREE.CylinderGeometry(.28,.4,1.05,20,2,true),lampMat);
      lamp.position.set(wallX-nx*side*.58,floorY+5.8,wallZ-nz*side*.58);scene.add(lamp);
      const glow=new THREE.PointLight(0xffc985,8,34,2);
      glow.position.set(lamp.position.x,floorY+5.7,lamp.position.z);scene.add(glow);
    }
  }
  // Carved stone bridge-heads and broad landing pads complete the transition
  // between the paired flights and the single descending stair.
  const landingMat=new THREE.MeshStandardMaterial({color:0xc9c6bd,roughness:.42,metalness:.025});
  for(const [x,y,z,w,d] of [[-170,ENTRY_HALL_FLOOR-7.2,0,21,19],[-251.5,THRONE_ROOM_FLOOR,0,12,38]]){
    const pad=new THREE.Mesh(new THREE.BoxGeometry(w,.42,d),landingMat);
    pad.position.set(x,y-.21,z);pad.receiveShadow=true;pad.castShadow=true;scene.add(pad);
    for(const side of [-1,1]){
      const plinth=new THREE.Mesh(new THREE.BoxGeometry(2.2,1.7,2.4),jasper);
      plinth.position.set(x, y+.65, side*(d/2-1.2));scene.add(plinth);
      const cap=new THREE.Mesh(new THREE.BoxGeometry(2.8,.42,2.8),bronze);
      cap.position.set(x,y+1.55,side*(d/2-1.2));scene.add(cap);
    }
  }
}

function buildAncillaryExteriorShells(){
  const wallMat=new THREE.MeshStandardMaterial({color:0x646f79,roughness:.74,metalness:.035});
  const pale=new THREE.MeshStandardMaterial({color:0xc9c7be,roughness:.42,metalness:.035});
  const trim=new THREE.MeshStandardMaterial({color:0x9d8354,roughness:.32,metalness:.68});

  // Council: an outer masonry ring, buttresses, cornices and a second blue dome
  // make the building read as a complete volume when approached from outside.
  {
    const cx=COUNCIL_ROOM_CENTER_X,cz=COUNCIL_ROOM_CENTER_Z,y=COUNCIL_ROOM_FLOOR;
    const r=29.2,h=17.2,halfEast=.38,halfWest=.29;
    const arcs=[
      [0,Math.PI/2-halfEast],
      [Math.PI/2+halfEast,Math.PI-halfEast-halfWest],
      [3*Math.PI/2+halfWest,Math.PI/2-westHalf(halfWest)]
    ];
    for(const [start,length] of arcs){
      const wall=new THREE.Mesh(new THREE.CylinderGeometry(r,r,h,112,1,true,start,length),wallMat);
      wall.position.set(cx,y+h/2,cz);wall.receiveShadow=true;scene.add(wall);
    }
    const dome=new THREE.Mesh(new THREE.SphereGeometry(r,72,36,0,Math.PI*2,0,Math.PI/2),
      new THREE.MeshStandardMaterial({color:0x273f5c,roughness:.78,metalness:.04,side:THREE.BackSide}));
    dome.position.set(cx,y+h,cz);dome.scale.y=.9;dome.receiveShadow=true;scene.add(dome);
    for(let i=0;i<18;i++){
      const a=i/18*Math.PI*2;
      if(environmentAngleDelta(a,Math.PI/2)<.48||environmentAngleDelta(a,3*Math.PI/2)<.4)continue;
      const x=cx+Math.cos(a)*(r-.6),z=cz+Math.sin(a)*(r-.6);
      const buttress=new THREE.Mesh(new THREE.CylinderGeometry(1.45,2.0,h+1,16,2),pale);
      buttress.position.set(x,y+(h+1)/2,z);buttress.rotation.z=-Math.cos(a)*.08;scene.add(buttress);
      const capital=new THREE.Mesh(new THREE.BoxGeometry(3.2,1.0,3.2),trim);
      capital.position.set(x,y+h-.35,z);capital.rotation.y=-a;scene.add(capital);
    }
    for(const yy of [y+1.2,y+h-.6]){
      const ring=new THREE.Mesh(new THREE.TorusGeometry(r-.1,.36,10,144),trim);
      ring.rotation.x=Math.PI/2;ring.position.set(cx,yy,cz);scene.add(ring);
    }
    for(const angle of [Math.PI/2,3*Math.PI/2]){
      const group=new THREE.Group();
      group.position.set(cx+Math.cos(angle)*(r-.2),y,cz+Math.sin(angle)*(r-.2));
      group.rotation.y=-angle;
      for(const side of [-1,1]){
        const jamb=new THREE.Mesh(new THREE.BoxGeometry(2.2,17.5,2.4),pale);
        jamb.position.set(0,8.75,side*8.6);group.add(jamb);
        const cap=new THREE.Mesh(new THREE.BoxGeometry(3.0,1.1,3.0),trim);
        cap.position.set(0,17.2,side*8.6);group.add(cap);
      }
      const arch=new THREE.Mesh(new THREE.TorusGeometry(8.6,.72,12,56,Math.PI),pale);
      arch.rotation.y=Math.PI/2;arch.position.set(0,13.2,0);group.add(arch);
      scene.add(group);
    }
  }

  // Great Library: its dark outer shell is independent of the interior stacks;
  // open portals align with the east connector, while heavy piers articulate
  // the exterior wall and give the cylinder a recognisable silhouette.
  {
    const cx=LIBRARY_CENTER_X,cz=LIBRARY_CENTER_Z,y=LIBRARY_FLOOR;
    const r=35.8,h=26.3,halfDoor=.3;
    const arcs=[
      [0,Math.PI/2-halfDoor],
      [Math.PI/2+halfDoor,Math.PI*1.5-halfDoor]
    ];
    for(const [start,length] of arcs){
      const wall=new THREE.Mesh(new THREE.CylinderGeometry(r,r,h,128,1,true,start,length),
        new THREE.MeshStandardMaterial({color:0x242e39,roughness:.82,metalness:.035}));
      wall.position.set(cx,y+h/2,cz);wall.receiveShadow=true;scene.add(wall);
    }
    const dome=new THREE.Mesh(new THREE.SphereGeometry(r,80,40,0,Math.PI*2,0,Math.PI/2),
      new THREE.MeshStandardMaterial({color:0x18222c,roughness:.86,side:THREE.BackSide}));
    dome.scale.y=.58;dome.position.set(cx,y+h,cz);dome.receiveShadow=true;scene.add(dome);
    for(let i=0;i<22;i++){
      const a=i/22*Math.PI*2;
      if(environmentAngleDelta(a,Math.PI/2)<.43)continue;
      const x=cx+Math.cos(a)*(r-.8),z=cz+Math.sin(a)*(r-.8);
      const buttress=new THREE.Mesh(new THREE.CylinderGeometry(1.3,1.8,h+1.5,16,2),pale);
      buttress.position.set(x,y+(h+1.5)/2,z);buttress.rotation.z=-Math.cos(a)*.07;scene.add(buttress);
      const cap=new THREE.Mesh(new THREE.BoxGeometry(3.0,1.0,3.0),trim);
      cap.position.set(x,y+h-.2,z);cap.rotation.y=-a;scene.add(cap);
    }
    for(const yy of [y+1.1,y+h-.5]){
      const ring=new THREE.Mesh(new THREE.TorusGeometry(r-.2,.32,9,160),trim);
      ring.rotation.x=Math.PI/2;ring.position.set(cx,yy,cz);scene.add(ring);
    }
    const door=new THREE.Group();door.position.set(cx+r-.2,y,0);door.rotation.y=-Math.PI/2;
    for(const side of [-1,1]){
      const jamb=new THREE.Mesh(new THREE.BoxGeometry(2.2,26,2.2),pale);
      jamb.position.set(0,13,side*8.8);door.add(jamb);
    }
    const arch=new THREE.Mesh(new THREE.TorusGeometry(8.8,.72,12,56,Math.PI),pale);
    arch.rotation.y=Math.PI/2;arch.position.set(0,17,0);door.add(arch);
    scene.add(door);
  }
}
function westHalf(value){return value;}

// Stone and timber equipment gives the open training ground readable purpose:
// sparring ring, target lanes, practice forms, racks, benches and a weathered canopy.
function buildTrainingGroundScene(){
  const cx=-2600,cz=350,groundY=terrainHeightAnalytic(cx,cz);
  const earth=new THREE.MeshStandardMaterial({color:0x62523f,roughness:.98});
  const darkEarth=new THREE.MeshStandardMaterial({color:0x342d26,roughness:1});
  const stone=new THREE.MeshStandardMaterial({color:0x77766e,roughness:.9});
  const wood=new THREE.MeshStandardMaterial({color:0x4a3021,roughness:.9});
  const woodLight=new THREE.MeshStandardMaterial({color:0x765337,roughness:.84});
  const iron=new THREE.MeshStandardMaterial({color:0x3f4548,metalness:.62,roughness:.38});
  const rope=new THREE.MeshStandardMaterial({color:0xb9a17b,roughness:.9});
  const cloths=[0x6b2732,0x35495a,0x83704a].map(c=>new THREE.MeshStandardMaterial({color:c,roughness:.92,side:THREE.DoubleSide}));

  const court=new THREE.Mesh(new THREE.CircleGeometry(72,112),earth);
  court.rotation.x=-Math.PI/2;court.position.set(cx,groundY+.06,cz);court.receiveShadow=true;scene.add(court);
  const ring=new THREE.Mesh(new THREE.TorusGeometry(56,.55,10,144),stone);
  ring.rotation.x=Math.PI/2;ring.position.set(cx,groundY+.18,cz);scene.add(ring);
  const innerRing=new THREE.Mesh(new THREE.TorusGeometry(18,.22,8,96),rope);
  innerRing.rotation.x=Math.PI/2;innerRing.position.set(cx,groundY+.22,cz);scene.add(innerRing);

  // Eight low stone markers define the main sparring circle.
  for(let i=0;i<8;i++){
    const a=i/8*Math.PI*2,x=cx+Math.cos(a)*18,z=cz+Math.sin(a)*18;
    const post=new THREE.Mesh(new THREE.CylinderGeometry(.32,.52,1.65,12),stone);
    post.position.set(x,groundY+.82,z);post.castShadow=true;scene.add(post);
    const cap=new THREE.Mesh(new THREE.SphereGeometry(.4,16,12),iron);
    cap.position.set(x,groundY+1.73,z);scene.add(cap);
  }

  // A row of full-bodied training dummies, not floating target heads.
  function dummyAt(x,z,index){
    const g=new THREE.Group();g.position.set(x,groundY,z);
    const torso=new THREE.Mesh(new THREE.CapsuleGeometry(.32,.8,6,12),woodLight);
    torso.position.y=1.35;g.add(torso);
    const head=new THREE.Mesh(new THREE.SphereGeometry(.24,16,12),wood);
    head.position.y=2.12;g.add(head);
    for(const side of [-1,1]){
      const arm=new THREE.Mesh(new THREE.CylinderGeometry(.12,.16,.9,12),wood);
      arm.position.set(side*.48,1.48,0);arm.rotation.z=side*.28;g.add(arm);
      const leg=new THREE.Mesh(new THREE.CylinderGeometry(.14,.18,.9,12),wood);
      leg.position.set(side*.2,.45,0);g.add(leg);
    }
    const collar=new THREE.Mesh(new THREE.TorusGeometry(.33,.07,6,18),iron);
    collar.position.y=1.78;g.add(collar);
    const base=new THREE.Mesh(new THREE.CylinderGeometry(.55,.7,.42,12),stone);
    base.position.y=.21;g.add(base);
    scene.add(g);
    return g;
  }
  for(let i=0;i<7;i++)dummyAt(cx-43+i*14.2,cz-37,i);
  for(let i=0;i<5;i++){
    const x=cx+36,z=cz-30+i*15;
    const frame=new THREE.Group();frame.position.set(x,groundY,z);
    const board=new THREE.Mesh(new THREE.CylinderGeometry(.05,.05,4.8,10),wood);
    board.position.y=2.4;frame.add(board);
    const target=new THREE.Mesh(new THREE.CircleGeometry(1.35,48),
      new THREE.MeshStandardMaterial({color:0xd0c1a1,roughness:.94,side:THREE.DoubleSide}));
    target.position.set(0,3.8,.12);frame.add(target);
    for(let r=0;r<3;r++){
      const band=new THREE.Mesh(new THREE.TorusGeometry(1.35-r*.38,.035,6,48),
        new THREE.MeshStandardMaterial({color:r===0?0x862f2d:0x3f4142,roughness:.9}));
      band.position.set(0,3.8,.15);frame.add(band);
    }
    scene.add(frame);
  }

  // Timber weapon racks and a covered tool shelter.
  for(const [x,z] of [[cx-55,cz+27],[cx+51,cz+30]]){
    const rack=new THREE.Group();rack.position.set(x,groundY,z);
    for(const side of [-1,1]){
      const upright=new THREE.Mesh(new THREE.BoxGeometry(.32,2.6,.36),wood);
      upright.position.set(side*2.4,1.3,0);rack.add(upright);
      const foot=new THREE.Mesh(new THREE.BoxGeometry(1.2,.28,.6),stone);
      foot.position.set(side*2.4,.14,0);rack.add(foot);
    }
    for(const y of [.75,2.05]){
      const rail=new THREE.Mesh(new THREE.BoxGeometry(5.2,.22,.28),iron);
      rail.position.y=y;rack.add(rail);
    }
    for(let i=0;i<7;i++){
      const pole=new THREE.Mesh(new THREE.CylinderGeometry(.07,.1,2.2,8),woodLight);
      pole.position.set(-1.8+i*.6,1.35,0);pole.rotation.z=(i%2?-.1:.1);rack.add(pole);
    }
    scene.add(rack);
  }
  const shed=new THREE.Group();shed.position.set(cx-8,groundY,cz+54);
  const posts=[];
  for(const x of [-5,5])for(const z of [-3,3]){
    const post=new THREE.Mesh(new THREE.CylinderGeometry(.24,.32,4.6,12),wood);
    post.position.set(x,2.3,z);post.castShadow=true;shed.add(post);posts.push(post);
  }
  const roof=new THREE.Mesh(new THREE.ConeGeometry(8.0,2.0,4),woodLight);
  roof.position.y=5.2;roof.rotation.y=Math.PI/4;shed.add(roof);
  const canopy=new THREE.Mesh(new THREE.BoxGeometry(12,.3,8),cloths[1]);
  canopy.position.y=4.25;shed.add(canopy);
  const bench=new THREE.Mesh(new THREE.BoxGeometry(8,.55,1.2),woodLight);
  bench.position.set(0,.45,0);shed.add(bench);
  for(const x of [-3.2,3.2]){
    const leg=new THREE.Mesh(new THREE.BoxGeometry(.5,.9,.5),stone);
    leg.position.set(x,.1,0);shed.add(leg);
  }
  scene.add(shed);

  // Banners and field lanterns establish scale against the surrounding cavern.
  for(let i=0;i<4;i++){
    const a=i/4*Math.PI*2,x=cx+Math.cos(a)*64,z=cz+Math.sin(a)*64;
    const pole=new THREE.Mesh(new THREE.CylinderGeometry(.12,.2,10,12),iron);
    pole.position.set(x,groundY+5,z);scene.add(pole);
    const flag=new THREE.Mesh(new THREE.PlaneGeometry(3.2,5.0),cloths[i%cloths.length]);
    flag.position.set(x+1.25,groundY+7.1,z);flag.rotation.y=-a;scene.add(flag);
    const base=new THREE.Mesh(new THREE.CylinderGeometry(.65,.8,.6,12),stone);
    base.position.set(x,groundY+.3,z);scene.add(base);
  }

  const brazierMat=new THREE.MeshStandardMaterial({color:0x8a6c43,metalness:.56,roughness:.4});
  for(const [x,z] of [[cx-25,cz+8],[cx+25,cz+8]]){
    const bowl=new THREE.Mesh(new THREE.CylinderGeometry(.8,1.2,.6,16),brazierMat);
    bowl.position.set(x,groundY+1.4,z);scene.add(bowl);
    const flame=new THREE.Mesh(new THREE.IcosahedronGeometry(.55,2),
      new THREE.MeshStandardMaterial({color:0xffb34d,emissive:0xff6b19,emissiveIntensity:1.6}));
    flame.position.set(x,groundY+2.2,z);scene.add(flame);
    const glow=new THREE.PointLight(0xff963d,9,28,2);glow.position.copy(flame.position);scene.add(glow);
  }
  TRONJHEIM_ENVIRONMENT_PASS.training=true;
}

function buildDragonholdInteriorDetails(){
  const floorY=VOL_TURIN_TOP_Y;
  const stone=new THREE.MeshStandardMaterial({color:0x8b8981,roughness:.58,metalness:.025});
  const pale=new THREE.MeshStandardMaterial({color:0xd4d0c6,roughness:.4});
  const dark=new THREE.MeshStandardMaterial({color:0x343637,roughness:.82});
  const bronze=new THREE.MeshStandardMaterial({color:0x9d8454,metalness:.72,roughness:.3});
  const leather=new THREE.MeshStandardMaterial({color:0x49352a,roughness:.9});
  const glow=new THREE.MeshStandardMaterial({color:0xe7c99b,emissive:0xd39c56,emissiveIntensity:1.1,roughness:.24});

  // A sparse ring of carved supports and resting ledges leaves the central
  // Star Rose floor open while giving the Dragonhold a monumental interior.
  for(let i=0;i<8;i++){
    const a=i/8*Math.PI*2;
    if(environmentAngleDelta(a,VOL_TURIN_START_ANGLE)<.38 ||
       environmentAngleDelta(a,4.72)<.4)continue;
    const x=Math.cos(a)*7.65,z=Math.sin(a)*7.65;
    const base=new THREE.Mesh(new THREE.CylinderGeometry(.78,1.05,.65,18),dark);
    base.position.set(x,floorY+.325,z);scene.add(base);
    const shaft=new THREE.Mesh(new THREE.CylinderGeometry(.38,.62,4.2,20,3),stone);
    shaft.position.set(x,floorY+2.75,z);shaft.castShadow=true;scene.add(shaft);
    const capital=new THREE.Mesh(new THREE.CylinderGeometry(.82,.58,.72,20),pale);
    capital.position.set(x,floorY+5.2,z);scene.add(capital);
    const lantern=new THREE.Mesh(new THREE.CylinderGeometry(.26,.38,1.05,18,2,true),glow);
    lantern.position.set(x,floorY+6.0,z);scene.add(lantern);
    const light=new THREE.PointLight(0xffcc87,7,27,2);
    light.position.set(x,floorY+5.7,z);scene.add(light);
  }
  for(let i=0;i<6;i++){
    const a=i/6*Math.PI*2+.28;
    if(environmentAngleDelta(a,4.72)<.45||environmentAngleDelta(a,VOL_TURIN_START_ANGLE)<.45)continue;
    const x=Math.cos(a)*6.35,z=Math.sin(a)*6.35;
    const bench=new THREE.Mesh(new THREE.BoxGeometry(3.2,.48,1.05),leather);
    bench.position.set(x,floorY+.65,z);bench.rotation.y=-a;bench.castShadow=true;scene.add(bench);
    const legs=new THREE.Mesh(new THREE.BoxGeometry(2.6,.65,.7),dark);
    legs.position.set(x,floorY+.25,z);legs.rotation.y=-a;scene.add(legs);
    const chest=new THREE.Mesh(new THREE.BoxGeometry(1.5,1.25,1.1),stone);
    chest.position.set(x+Math.cos(a)*1.9,floorY+.62,z+Math.sin(a)*1.9);chest.rotation.y=-a;scene.add(chest);
    const lid=new THREE.Mesh(new THREE.BoxGeometry(1.65,.24,1.2),bronze);
    lid.position.set(chest.position.x,floorY+1.34,chest.position.z);lid.rotation.y=-a;scene.add(lid);
  }

  // A short, continuous stone stair climbs from the gemstone floor to
  // Saphira's cave threshold. It finishes in a broad landing at cave-floor
  // height rather than stopping in open air.
  const cave=DRAGONHOLD_CAVES.find(c=>c.id==="saphira");
  const a=cave.angle,startR=DRAGONHOLD_RADIUS-.55,endR=DRAGONHOLD_OUTER_RADIUS+.35;
  const rise=cave.bottom/12,steps=12,run=(endR-startR)/steps;
  const treadMat=new THREE.MeshStandardMaterial({color:0xd5d2c9,roughness:.37,metalness:.025});
  const edgeMat=new THREE.MeshStandardMaterial({color:0x9c8051,metalness:.68,roughness:.3});
  const treadDepth=run*1.35;
  const rotationY=Math.PI/2-a;
  for(let i=0;i<steps;i++){
    const radius=startR+(i+.5)*run;
    const top=floorY+(i+1)*rise;
    const tread=new THREE.Mesh(new THREE.BoxGeometry(5.2,.36,treadDepth),treadMat);
    tread.position.set(Math.cos(a)*radius,top-.18,Math.sin(a)*radius);
    tread.rotation.y=rotationY;tread.castShadow=true;tread.receiveShadow=true;scene.add(tread);
    const nosing=new THREE.Mesh(new THREE.BoxGeometry(5.05,.09,.16),edgeMat);
    nosing.position.set(Math.cos(a)*radius,top-.035,Math.sin(a)*radius);
    nosing.rotation.y=rotationY;scene.add(nosing);
  }
  const landingRadius=endR+.8;
  const landing=new THREE.Mesh(new THREE.BoxGeometry(6.3,.36,2.8),pale);
  landing.position.set(Math.cos(a)*landingRadius,floorY+cave.bottom-.18,Math.sin(a)*landingRadius);
  landing.rotation.y=rotationY;landing.castShadow=true;landing.receiveShadow=true;scene.add(landing);

  // Bronze rails continue from the landing and turn into the cave on both sides.
  for(const side of [-1,1]){
    const points=[];
    for(let i=0;i<=steps;i++){
      const t=i/steps,r=startR+t*(endR-startR);
      const offset=side*2.8;
      const tangentOffset=offset;
      const x=Math.cos(a)*r-Math.sin(a)*tangentOffset;
      const z=Math.sin(a)*r+Math.cos(a)*tangentOffset;
      points.push(new THREE.Vector3(x,floorY+t*cave.bottom+1.0,z));
    }
    const curve=new THREE.CatmullRomCurve3(points,false,"centripetal");
    scene.add(new THREE.Mesh(new THREE.TubeGeometry(curve,96,.16,8,false),bronze));
  }
  TRONJHEIM_ENVIRONMENT_PASS.built=true;
}

function buildSaphiraCaveInterior(){
  const cave=DRAGONHOLD_CAVES.find(c=>c.id==="saphira");
  const caveCenterR=DRAGONHOLD_OUTER_RADIUS+cave.depth/2-.7;
  const group=new THREE.Group();
  group.position.set(Math.cos(cave.angle)*caveCenterR,VOL_TURIN_TOP_Y+cave.bottom,
                     Math.sin(cave.angle)*caveCenterR);
  group.rotation.y=Math.PI/2-cave.angle;
  const darkRock=new THREE.MeshStandardMaterial({color:0x4d3d31,roughness:.98});
  const hide=new THREE.MeshStandardMaterial({color:0x50382b,roughness:.94});
  const bronze=new THREE.MeshStandardMaterial({color:0x987a4c,metalness:.7,roughness:.34});
  const pale=new THREE.MeshStandardMaterial({color:0x958779,roughness:.83});

  // A broad, raised sleeping nest with layered hide, stone edging and warm
  // braziers fills the deep end of the cave without obstructing the entry.
  const nestBase=new THREE.Mesh(new THREE.CylinderGeometry(3.0,3.35,.55,48),darkRock);
  nestBase.position.set(0,.3,4.2);group.add(nestBase);
  const nestRim=new THREE.Mesh(new THREE.TorusGeometry(2.75,.42,12,72),pale);
  nestRim.rotation.x=Math.PI/2;nestRim.position.set(0,.72,4.2);group.add(nestRim);
  const bedding=new THREE.Mesh(new THREE.SphereGeometry(1,36,20),hide);
  bedding.scale.set(2.35,.32,2.15);bedding.position.set(0,.78,4.2);group.add(bedding);
  for(let i=0;i<9;i++){
    const a=i/9*Math.PI*2,r=2.25;
    const hideFold=new THREE.Mesh(new THREE.CapsuleGeometry(.32,.92,5,10),hide);
    hideFold.position.set(Math.cos(a)*r,.92,4.2+Math.sin(a)*r);
    hideFold.rotation.y=-a;hideFold.rotation.z=.18;hideFold.scale.set(1,.5,1.35);group.add(hideFold);
  }

  // Stone trough, water basin, storage coffer and a bronze wall lantern.
  const trough=new THREE.Mesh(new THREE.BoxGeometry(3.1,.72,1.15),darkRock);
  trough.position.set(-2.05,.42,-1.9);group.add(trough);
  const waterBowl=new THREE.Mesh(new THREE.CylinderGeometry(.7,.95,.45,24),pale);
  waterBowl.position.set(2.0,.28,-1.75);group.add(waterBowl);
  const water=new THREE.Mesh(new THREE.CircleGeometry(.62,32),
    new THREE.MeshPhysicalMaterial({color:0x577b82,roughness:.1,metalness:.15,transparent:true,opacity:.8}));
  water.rotation.x=-Math.PI/2;water.position.set(2,.52,-1.75);group.add(water);
  const coffer=new THREE.Mesh(new THREE.BoxGeometry(1.55,1.15,1.2),darkRock);
  coffer.position.set(2.45,.58,1.2);group.add(coffer);
  const lid=new THREE.Mesh(new THREE.BoxGeometry(1.62,.2,1.25),bronze);
  lid.position.set(2.45,1.25,1.2);group.add(lid);
  for(const side of [-1,1]){
    const hook=new THREE.Mesh(new THREE.TorusGeometry(.34,.12,8,24),bronze);
    hook.position.set(side*3.1,3.6,-4.3);hook.rotation.y=side*.5;group.add(hook);
  }
  const lamp=new THREE.Mesh(new THREE.CylinderGeometry(.3,.4,1.05,20,2,true),
    new THREE.MeshStandardMaterial({color:0xf0d8ae,emissive:0xe1a54e,emissiveIntensity:1.1,roughness:.25}));
  lamp.position.set(2.8,4.3,-5.5);group.add(lamp);
  const light=new THREE.PointLight(0xffa84d,12,28,2);light.position.set(2.8,4.0,-5.0);group.add(light);

  // Low natural ledges and broken rock pillows soften the squared cave shell.
  for(let i=0;i<12;i++){
    const a=i/12*Math.PI*2,r=5.4+hash(i,71)*1.0;
    const rock=new THREE.Mesh(new THREE.IcosahedronGeometry(1,2),darkRock);
    rock.position.set(Math.cos(a)*r,1.1+hash(i,81)*1.3,Math.sin(a)*r+2.0);
    rock.scale.set(1.1+hash(i,91)*.9,.55+hash(i,101)*.55,1.0+hash(i,111)*.8);
    group.add(rock);
  }
  scene.add(group);
}

function buildEnvironmentEnhancements(){
  if(THRONE_ROOM_PATHS?.length){
    for(const path of THRONE_ROOM_PATHS)buildThroneStairVault(path);
  }
  buildAncillaryExteriorShells();
  buildTrainingGroundScene();
  buildDragonholdInteriorDetails();
  buildSaphiraCaveInterior();
  TRONJHEIM_ENVIRONMENT_PASS.built=true;
  renderer.shadowMap.needsUpdate=true;
}
buildEnvironmentEnhancements();
