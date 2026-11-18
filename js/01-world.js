// FARTHEN DÛR: [LIVRO] enorme cratera vulcânica com abertura muito alta.
// [INTERPRETAÇÃO] raio e perfil matemático da parede para permitir navegação.
function buildCraterWall(){
  const radial=128, vertical=96, bottomR=8200, topR=410, height=20000;
  const positions=[], colors=[], uvs=[], indices=[];
  for(let j=0;j<=vertical;j++){
    const v=j/vertical, y=80+height*v;
    const r=bottomR*(1-v)+topR*v + Math.sin(v*Math.PI*3)*170;
    for(let i=0;i<=radial;i++){
      const a=i/radial*Math.PI*2;
      const n=fbm(Math.cos(a)*7+v*5,Math.sin(a)*7-v*4);
      const rr=r+n*(45+v*120)+Math.sin(a*13+v*8)*32;
      const yy=y+n*18;
      positions.push(Math.cos(a)*rr,yy,Math.sin(a)*rr); uvs.push(i/radial*8,v*5);
      const shade=THREE.MathUtils.clamp(.48+n*.12-v*.18,0.12,.72);
      colors.push(shade*.77,shade*.84,shade*.91);
    }
  }
  for(let j=0;j<vertical;j++)for(let i=0;i<radial;i++){const a=j*(radial+1)+i,b=a+radial+1;indices.push(a,b,a+1,b,b+1,a+1);}
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));g.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uvs,2));g.setIndex(indices);g.computeVertexNormals();
  const wall=new THREE.Mesh(g,MAT.rock);wall.receiveShadow=true;scene.add(wall);
  // irregular ribs and ledges on the cavern wall, deliberately restrained
  const ledgeMat=new THREE.MeshStandardMaterial({color:0x3c444b,roughness:1});
  for(let k=0;k<46;k++){
    const a=k/46*Math.PI*2, y=800+(k%7)*1350, v=(y-80)/height, r=bottomR*(1-v)+topR*v;
    const length=240+hash(k,9)*420;
    const geo=new THREE.BoxGeometry(length,18+hash(k,2)*35,38);
    const mesh=new THREE.Mesh(geo,ledgeMat);mesh.position.set(Math.cos(a)*(r-18),y,Math.sin(a)*(r-18));mesh.rotation.y=-a;mesh.rotation.z=(hash(k,4)-.5)*.08;scene.add(mesh);
  }
}
buildCraterWall();

// Ground: [INTERPRETAÇÃO] rocky basin floor, gently irregular at kilometre scale.
// Store its displaced vertices so the player stands on the rendered triangles.
let groundMesh=null;
let groundGrid=null;
function buildGround(){
  const size=16400, seg=360, g=new THREE.PlaneGeometry(size,size,seg,seg);g.rotateX(-Math.PI/2);
  const p=g.attributes.position, colors=[];
  const heights=new Float32Array(p.count);
  for(let i=0;i<p.count;i++){
    const x=p.getX(i),z=p.getZ(i);const n=fbm(x*.00065,z*.00065);
    const naturalHeight=n*14+Math.sin(x*.0005)*4+Math.cos(z*.0004)*4;
    const blend=THREE.MathUtils.smoothstep(Math.hypot(x,z),1800,2300);
    const localHeight=THREE.MathUtils.lerp(0,naturalHeight,blend);
    p.setY(i,localHeight); heights[i]=localHeight;
    const patch=fbm(x*.0015+8,z*.0015-4);const base=.43+patch*.07;
    colors.push(base*.96,base,base*1.04);
  }
  g.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));g.computeVertexNormals();
  groundMesh=new THREE.Mesh(g,MAT.floor);groundMesh.position.y=-8;groundMesh.receiveShadow=true;scene.add(groundMesh);
  groundGrid={size,segments:seg,heights,offsetY:groundMesh.position.y,cell:size/seg};
}
buildGround();

function terrainHeightAnalytic(x,z){
  const natural=fbm(x*.00065,z*.00065)*14+Math.sin(x*.0005)*4+Math.cos(z*.0004)*4;
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
const CITY={height:1660, radius:1760, topRadius:155};
const CENTRAL_CHAMBER_RADIUS=152.4;
const CENTRAL_WALL_RADIUS=146.5;
const CENTRAL_COLUMN_RADIUS=135.5;
const SIDE_CORRIDOR_START=132;
const SIDE_CORRIDOR_LENGTH=390;
const SIDE_CORRIDOR_HALF_WIDTH=17.8;
let TRONJHEIM_GATE={facadeX:1760,doorX:1741.7,floorY:-8,hallEndX:120};
let ENTRY_HALL_FLOOR=-8;
function cityRadius(t){return (CITY.radius-CITY.topRadius)*Math.pow(1-t,.88)+CITY.topRadius;}
function buildCity(){
  const radial=512, vertical=256, positions=[],uvs=[],indices=[];
  for(let j=0;j<=vertical;j++){
    const t=j/vertical,y=-8+CITY.height*t,r=cityRadius(t);
    for(let i=0;i<=radial;i++){
      const a=i/radial*Math.PI*2;
      // very subtle sculpted surface, not a sharp polygonal cone
      const flute=Math.sin(a*24+Math.sin(t*8))*7 + Math.sin(a*48+t*2)*2.2;
      const swell=Math.sin(t*Math.PI*7)*8;
      const rr=r+flute+swell;
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
  for(let n=1;n<=8;n++){
    const t=n/10, y=-8+t*CITY.height, r=cityRadius(t)+3;
    const ring=new THREE.Mesh(new THREE.TorusGeometry(r,2.3,5,192),MAT.marbleLight);ring.rotation.x=Math.PI/2;ring.position.y=y;scene.add(ring);
  }
  buildFacadeWindows(); buildMainGate(); buildEntryHall(); buildPath(); buildOuterLanterns();
}
