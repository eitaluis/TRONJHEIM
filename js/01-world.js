// FARTHEN DÛR: [LIVRO] enorme cratera vulcânica com abertura muito alta.
// [INTERPRETAÇÃO] raio e perfil matemático da parede para permitir navegação.
function buildCraterWall(){
  const radial=256, vertical=160, bottomR=8200, topR=410, height=20000;
  const positions=[], colors=[], uvs=[], indices=[];
  for(let j=0;j<=vertical;j++){
    const v=j/vertical, y=80+height*v;
    const r=bottomR*(1-v)+topR*v + Math.sin(v*Math.PI*3)*170;
    for(let i=0;i<=radial;i++){
      const a=i/radial*Math.PI*2;
      const n=fbm(Math.cos(a)*7+v*5,Math.sin(a)*7-v*4);
      const ridge=fbm(Math.cos(a)*23+v*19,Math.sin(a)*23-v*17);
      const rr=r+n*(62+v*145)+ridge*(12+v*18)+Math.sin(a*13+v*8)*32;
      const yy=y+n*24+ridge*8;
      positions.push(Math.cos(a)*rr,yy,Math.sin(a)*rr); uvs.push(i/radial*8,v*5);
      const shade=THREE.MathUtils.clamp(.28+n*.15-v*.07,.22,.82);
      colors.push(shade*.80,shade*.87,shade*.94);
    }
  }
  for(let j=0;j<vertical;j++)for(let i=0;i<radial;i++){const a=j*(radial+1)+i,b=a+radial+1;indices.push(a,b,a+1,b,b+1,a+1);}
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));g.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uvs,2));g.setIndex(indices);g.computeVertexNormals();
  const wall=new THREE.Mesh(g,MAT.rock);wall.receiveShadow=true;scene.add(wall);
  // Broken mineral strata follow the curved cavern wall instead of using
  // isolated rectangular ledges. The ribbons have irregular, eroded profiles.
  const strataMaterials=[
    new THREE.MeshStandardMaterial({color:0x41494e,roughness:.98}),
    new THREE.MeshStandardMaterial({color:0x535b60,roughness:.96}),
    new THREE.MeshStandardMaterial({color:0x353d42,roughness:1})
  ];
  for(let k=0;k<74;k++){
    const yBase=420+hash(k,9)*19000;
    const vBase=(yBase-80)/height;
    const wallRadius=bottomR*(1-vBase)+topR*vBase;
    const a0=hash(k,13)*Math.PI*2;
    const arcLength=Math.min(180+hash(k,19)*520,wallRadius*.62);
    const arcSpan=arcLength/Math.max(200,wallRadius);
    const points=[];
    for(let j=0;j<=12;j++){
      const t=j/12*2-1;
      const a=a0+t*arcSpan*.5;
      const localV=THREE.MathUtils.clamp(vBase+Math.sin(t*2.3+k*.7)*.00065,.025,.975);
      const localR=bottomR*(1-localV)+topR*localV+
        Math.sin(a*13+localV*8)*32-12+fbm(Math.cos(a)*11,Math.sin(a)*11)*16;
      const y=80+localV*height+
        Math.sin(t*3.1+k)* (5+hash(k,5)*12)+fbm(Math.cos(a)*17,Math.sin(a)*17)*10;
      points.push(new THREE.Vector3(Math.cos(a)*localR,y,Math.sin(a)*localR));
    }
    const curve=new THREE.CatmullRomCurve3(points,false,"centripetal");
    const thickness=1.8+hash(k,23)*4.6;
    const ridge=new THREE.Mesh(
      new THREE.TubeGeometry(curve,24,thickness,6,false),
      strataMaterials[Math.floor(hash(k,29)*strataMaterials.length)]
    );
    ridge.receiveShadow=true;ridge.castShadow=false;scene.add(ridge);
  }

  // Long, narrow fractures break the enormous cavern surface into geological
  // plates. They follow the wall curvature and fade before reaching the rim.
  const fractureMat=new THREE.MeshStandardMaterial({color:0x252e34,roughness:1});
  for(let k=0;k<38;k++){
    const a0=hash(k,37)*Math.PI*2;
    const v0=.08+hash(k,41)*.74;
    const span=.07+hash(k,43)*.16;
    const points=[];
    for(let j=0;j<=18;j++){
      const t=j/18;
      const v=THREE.MathUtils.clamp(v0+span*t,.035,.94);
      const a=a0+Math.sin(t*4+k)*.012;
      const rr=bottomR*(1-v)+topR*v+
        Math.sin(a*13+v*8)*32-7;
      points.push(new THREE.Vector3(Math.cos(a)*rr,80+v*height,Math.sin(a)*rr));
    }
    const curve=new THREE.CatmullRomCurve3(points,false,"centripetal");
    const crack=new THREE.Mesh(new THREE.TubeGeometry(curve,28,.55+hash(k,47)*1.1,5,false),fractureMat);
    crack.castShadow=false;scene.add(crack);
  }
}
buildCraterWall();

// Ground: [INTERPRETAÇÃO] rocky basin floor, gently irregular at kilometre scale.
// Store its displaced vertices so the player stands on the rendered triangles.
let groundMesh=null;
let groundGrid=null;
function buildGround(){
  const size=16400, seg=480, g=new THREE.PlaneGeometry(size,size,seg,seg);g.rotateX(-Math.PI/2);
  const p=g.attributes.position, colors=[];
  const heights=new Float32Array(p.count);
  for(let i=0;i<p.count;i++){
    const x=p.getX(i),z=p.getZ(i);
    const broad=fbm(x*.00065,z*.00065);
    const middle=fbm(x*.0021+17,z*.0021-9);
    const fine=fbm(x*.009+31,z*.009-23);
    const naturalHeight=broad*14+middle*3.2+fine*.72+
      Math.sin(x*.0005)*4+Math.cos(z*.0004)*4;
    const blend=THREE.MathUtils.smoothstep(Math.hypot(x,z),1800,2300);
    const localHeight=THREE.MathUtils.lerp(0,naturalHeight,blend);
    p.setY(i,localHeight); heights[i]=localHeight;
    const patch=fbm(x*.0015+8,z*.0015-4);
    const mineral=fbm(x*.0047-22,z*.0047+16);
    const base=.525+patch*.062+mineral*.022;
    colors.push(base*.94,base*.97,Math.min(1,base*1.02));
  }
  // Remove every terrain triangle that touches the city footprint. The old
  // ground plane sat coplanar with the entrance and corridor floors at y=-8,
  // causing visible z-fighting as the player moved through the architecture.
  const source=g.index.array,kept=[];
  for(let i=0;i<source.length;i+=3){
    const ia=source[i],ib=source[i+1],ic=source[i+2];
    const minR=Math.min(Math.hypot(p.getX(ia),p.getZ(ia)),Math.hypot(p.getX(ib),p.getZ(ib)),Math.hypot(p.getX(ic),p.getZ(ic)));
    if(minR>=1760)kept.push(ia,ib,ic);
  }
  g.setIndex(kept);
  g.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));g.computeVertexNormals();
  groundMesh=new THREE.Mesh(g,MAT.floor);groundMesh.position.y=-8;groundMesh.receiveShadow=true;scene.add(groundMesh);
  groundGrid={size,segments:seg,heights,offsetY:groundMesh.position.y,cell:size/seg};
}
buildGround();

function terrainHeightAnalytic(x,z){
  const natural=fbm(x*.00065,z*.00065)*14+
    fbm(x*.0021+17,z*.0021-9)*3.2+
    fbm(x*.009+31,z*.009-23)*.72+
    Math.sin(x*.0005)*4+Math.cos(z*.0004)*4;
  const blend=THREE.MathUtils.smoothstep(Math.hypot(x,z),1800,2300);
  return -8+natural*blend;
}
function buildHumanScaleReference(){
  const x=2070,z=150,y=terrainHeightAnalytic(x,z);
  const mat=new THREE.MeshStandardMaterial({color:0x8b795b,roughness:.86,metalness:.05});
  const ref=new THREE.Group();ref.position.set(x,y,z);
  const torso=new THREE.Mesh(new THREE.CapsuleGeometry(.19,.52,4,8),mat);torso.position.y=1.02;ref.add(torso);
  const head=new THREE.Mesh(new THREE.SphereGeometry(.13,10,8),mat);head.position.y=1.48;ref.add(head);
  for(const side of [-1,1]){const leg=new THREE.Mesh(new THREE.CylinderGeometry(.065,.08,.48,8),mat);leg.position.set(side*.105,.28,0);ref.add(leg);const arm=new THREE.Mesh(new THREE.CylinderGeometry(.05,.06,.43,8),mat);arm.position.set(side*.25,1.04,0);arm.rotation.z=side*.12;ref.add(arm);}
  const measure=new THREE.Mesh(new THREE.CylinderGeometry(.012,.012,1.7,6),new THREE.MeshBasicMaterial({color:0xd7b879}));measure.position.set(-.42,.85,0);ref.add(measure);
  scene.add(ref);
}
buildHumanScaleReference();

// TRONJHEIM: [LIVRO] marble city-mountain, over one mile high.
// [DERIVADO] height = 1,609 m (1 mile). Outer footprint is shown as an
// approximate 3.5 km diameter envelope for this first-stage spatial model.
// [INTERPRETAÇÃO] exact cone profile, subtle fluting, detailed window layout and footprint diameter. The book gives the height as slightly over a mile, but this version does not treat the base diameter as a confirmed measurement (3.52 km is only a provisional scene scale).
const CITY={height:1660, radius:1760, topRadius:72};
const CENTRAL_CHAMBER_RADIUS=152.4;
const CENTRAL_WALL_RADIUS=146.5;
const CENTRAL_COLUMN_RADIUS=135.5;
const SIDE_CORRIDOR_START=132;
const SIDE_CORRIDOR_LENGTH=390;
const SIDE_CORRIDOR_HALF_WIDTH=17.8;
let TRONJHEIM_GATE={facadeX:1760,doorX:1741.7,floorY:-8,hallEndX:120};
let ENTRY_HALL_FLOOR=-8;
function cityRadius(t){
  const taper=(CITY.radius-CITY.topRadius)*Math.pow(1-t,.88)+CITY.topRadius;
  // Broad, low-frequency stone strata interrupt the perfect mathematical cone.
  // The relief fades at the foot and summit so the gate and Dragonhold remain aligned.
  const relief=(Math.sin(t*Math.PI*6)*20+Math.sin(t*Math.PI*2.4)*7)*Math.sin(Math.PI*t);
  return taper+relief;
}
function buildCity(){
  const radial=768, vertical=352, positions=[],uvs=[],indices=[];
  for(let j=0;j<=vertical;j++){
    const t=j/vertical,y=-8+CITY.height*t,r=cityRadius(t);
    for(let i=0;i<=radial;i++){
      const a=i/radial*Math.PI*2;
      // very subtle sculpted surface, not a sharp polygonal cone
      const fade=Math.sin(Math.PI*t);
      const flute=(
        Math.sin(a*16+Math.sin(t*8))*10+
        Math.sin(a*33+t*2)*4.0+
        Math.sin(a*71-t*5)*1.35+
        Math.sin(a*5+t*19)*2.1
      )*fade;
      const rr=r+flute;
      positions.push(Math.cos(a)*rr,y,Math.sin(a)*rr);uvs.push(i/radial*3,j/vertical*2.5);
    }
  }
  for(let j=0;j<vertical;j++)for(let i=0;i<radial;i++){
    const angleMid=(i+.5)/radial*Math.PI*2;
    const angleDistance=Math.abs(Math.atan2(Math.sin(angleMid),Math.cos(angleMid)));
    const yMid=-8+CITY.height*(j+.5)/vertical;
    // [INTERPRETAÇÃO] gate aperture width; the 20-yard recess itself is canonical.
    if(angleDistance<(13.5/CITY.radius) && yMid<15)continue;
    const a=j*(radial+1)+i,b=a+radial+1;
    indices.push(a,b,a+1,a+1,b,b+1);
  }
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uvs,2));g.setIndex(indices);g.computeVertexNormals();
  const body=new THREE.Mesh(g,MAT.marble);body.castShadow=true;body.receiveShadow=true;scene.add(body);
  // Base ring: restrained architectural footing rather than stacked blocks.
  const base=new THREE.Mesh(new THREE.TorusGeometry(CITY.radius*.985,13,8,240),MAT.marbleLight);base.rotation.x=Math.PI/2;base.position.y=-4;scene.add(base);
  // Fine horizontal carved bands; subtle to preserve the single mountain mass.
  for(let n=1;n<=11;n++){
    const t=n/12, y=-8+t*CITY.height, r=cityRadius(t)+4;
    const ring=new THREE.Mesh(new THREE.TorusGeometry(r,5.2,8,256),MAT.marbleLight);ring.rotation.x=Math.PI/2;ring.position.y=y;scene.add(ring);
  }
  buildFacadeWindows(); buildMainGate(); buildEntryHall(); buildPath(); buildOuterLanterns();
}
