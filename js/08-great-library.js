// ============================================================================
// FASE 8 — GRANDE BIBLIOTECA
// [LIVRO: ERAGON] salão semelhante a uma floresta; colunatas ramificadas até
// um teto escuro e nervurado a cinco andares; estantes de mármore negro em
// pares; rolos nas paredes; três escadas sinuosas; bancos de pedra aos pares
// e pequenas mesas cujas bases se fundem ao piso.
// [INTERPRETAÇÃO] posição em Tronjheim, diâmetro, alturas exatas, modulação,
// número de estantes e configuração de galerias.
// ============================================================================

const LIBRARY_CENTER_X = -660.5;
const LIBRARY_CENTER_Z = 0;
const LIBRARY_RADIUS = 30.5;
const LIBRARY_FLOOR = ENTRY_HALL_FLOOR;
const LIBRARY_WALL_HEIGHT = 22.4;
const LIBRARY_LEVEL_HEIGHT = 4.4;
const LIBRARY_LEVELS = 4;
const LIBRARY_PASSAGE_END_X = -629.2;
const LIBRARY_PASSAGE_START_X = -613.5;
const LIBRARY_STAIR_WIDTH = 2.55;
const LIBRARY_STAIRS = [];
const LIBRARY_SHELF_BLOCKERS = [];

function libraryPassageContains(x,z) {
  return x<=LIBRARY_PASSAGE_START_X+.2 &&
    x>=LIBRARY_PASSAGE_END_X-.5 && Math.abs(z)<=7.15;
}
function libraryInsideFromDoor() {
  return jogador.pos.x<=LIBRARY_PASSAGE_END_X+.3 &&
    jogador.pos.x>=LIBRARY_PASSAGE_END_X-1.0 &&
    Math.abs(jogador.pos.z)<=7.1;
}
function libraryWalkableContains(x,z) {
  const passage=libraryPassageContains(x,z);
  const r=Math.hypot(x-LIBRARY_CENTER_X,z-LIBRARY_CENTER_Z);
  const currentR=Math.hypot(jogador.pos.x-LIBRARY_CENTER_X,jogador.pos.z-LIBRARY_CENTER_Z);
  const alreadyInside=currentR<=LIBRARY_RADIUS-.05;
  const entering=libraryInsideFromDoor() && x<LIBRARY_CENTER_X+LIBRARY_RADIUS+.6;
  return passage || (r<=LIBRARY_RADIUS-.4 && (alreadyInside||entering));
}

function libraryAngleDistance(a,b) {
  return Math.abs(Math.atan2(Math.sin(a-b),Math.cos(a-b)));
}
function libraryFurnitureBlocks(x,z,floorY) {
  for(const item of LIBRARY_SHELF_BLOCKERS){
    if(Math.abs(floorY-item.floorY)>1.35)continue;
    const dx=x-item.x,dz=z-item.z;
    const radial=dx*Math.cos(item.angle)+dz*Math.sin(item.angle);
    const tangent=-dx*Math.sin(item.angle)+dz*Math.cos(item.angle);
    if(Math.abs(radial)<item.radialHalf && Math.abs(tangent)<item.tangentHalf)return true;
  }
  return false;
}
function libraryStairFloorAtXZ(x,z,referenceFeetY=(jogador.pos.y-jogador.alturaOlhos)) {
  let best=null,bestDelta=Infinity;
  for(const stair of LIBRARY_STAIRS){
    const dx=x-stair.x,dz=z-stair.z;
    const radius=Math.hypot(dx,dz);
    if(Math.abs(radius-stair.radius)>LIBRARY_STAIR_WIDTH/2+.35)continue;
    const angle=Math.atan2(dz,dx);
    const phase=(angle-stair.startAngle+Math.PI*2)%(Math.PI*2);
    for(let turn=0;turn<=stair.turns;turn++){
      const t=(phase+turn*Math.PI*2)/stair.totalAngle;
      if(t<0||t>1)continue;
      const index=THREE.MathUtils.clamp(Math.floor(t*stair.stepCount),0,stair.stepCount-1);
      const floor=LIBRARY_FLOOR+(index+1)*stair.stepRise;
      const delta=Math.abs(floor-referenceFeetY);
      if(delta<bestDelta && delta<2.35){bestDelta=delta;best=floor;}
    }
  }
  return best;
}
function libraryBridgeContains(x,z,stair) {
  const dx=x-stair.x,dz=z-stair.z;
  const along=dx*Math.cos(stair.startAngle)+dz*Math.sin(stair.startAngle);
  const lateral=-dx*Math.sin(stair.startAngle)+dz*Math.cos(stair.startAngle);
  return along>=2.65 && along<=8.0 && Math.abs(lateral)<=1.85;
}
function libraryGallerySectorContains(x,z) {
  const dx=x-LIBRARY_CENTER_X,dz=z-LIBRARY_CENTER_Z;
  const r=Math.hypot(dx,dz);
  if(r<14.15 || r>LIBRARY_RADIUS-.45)return false;
  const a=Math.atan2(dz,dx);
  for(const stair of LIBRARY_STAIRS){
    if(libraryAngleDistance(a,stair.startAngle)<.21)return false;
  }
  return true;
}
function libraryFloorAtXZ(x,z,referenceFeetY=(jogador.pos.y-jogador.alturaOlhos)) {
  if(libraryPassageContains(x,z) && Math.abs(referenceFeetY-LIBRARY_FLOOR)<2.25)return LIBRARY_FLOOR;
  const r=Math.hypot(x-LIBRARY_CENTER_X,z-LIBRARY_CENTER_Z);
  if(r<=LIBRARY_RADIUS-.35 && Math.abs(referenceFeetY-LIBRARY_FLOOR)<2.25 &&
     !libraryFurnitureBlocks(x,z,LIBRARY_FLOOR))return LIBRARY_FLOOR;

  for(let level=1;level<=LIBRARY_LEVELS;level++){
    const floor=LIBRARY_FLOOR+level*LIBRARY_LEVEL_HEIGHT;
    if(Math.abs(referenceFeetY-floor)>2.25)continue;
    const gallery=libraryGallerySectorContains(x,z) || LIBRARY_STAIRS.some(stair=>libraryBridgeContains(x,z,stair));
    if(gallery && !libraryFurnitureBlocks(x,z,floor))return floor;
  }
  return null;
}

function libraryBox(w,h,d,material,x,y,z,rotationY=0) {
  const mesh=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),material);
  mesh.position.set(x,y,z);mesh.rotation.y=rotationY;
  mesh.castShadow=true;mesh.receiveShadow=true;scene.add(mesh);
  return mesh;
}

function buildLibraryPassage() {
  const start=LIBRARY_PASSAGE_START_X,end=LIBRARY_PASSAGE_END_X;
  const length=start-end,mid=(start+end)/2;
  const pale=new THREE.MeshStandardMaterial({color:0xd5d2ca,roughness:.42});
  const blue=new THREE.MeshStandardMaterial({color:0x45586d,roughness:.55});
  const bronze=new THREE.MeshStandardMaterial({color:0xa48b59,metalness:.72,roughness:.3});
  const darkWood=new THREE.MeshStandardMaterial({color:0x37271d,roughness:.76});

  const floor=new THREE.Mesh(new THREE.BoxGeometry(length,1.7,14.2),pale);
  floor.position.set(mid,LIBRARY_FLOOR-.85,0);floor.receiveShadow=true;scene.add(floor);
  const roof=new THREE.Mesh(new THREE.BoxGeometry(length,1.3,14.8),pale);
  roof.position.set(mid,LIBRARY_FLOOR+12.0,0);scene.add(roof);
  for(const side of [-1,1]){
    const wall=new THREE.Mesh(new THREE.BoxGeometry(length,11.5,1.1),blue);
    wall.position.set(mid,LIBRARY_FLOOR+5.75,side*6.95);scene.add(wall);
    const cornice=new THREE.Mesh(new THREE.BoxGeometry(length,1.0,1.45),pale);
    cornice.position.set(mid,LIBRARY_FLOOR+11.6,side*6.85);scene.add(cornice);
    for(let i=0;i<3;i++){
      const lamp=new THREE.Mesh(new THREE.SphereGeometry(.36,10,8),
        new THREE.MeshStandardMaterial({color:0xf2dfb8,emissive:0xd4ac70,emissiveIntensity:1.35}));
      lamp.position.set(start-3-i*5,LIBRARY_FLOOR+8.2,side*6.2);scene.add(lamp);
    }
  }
  // The two portals are framed separately; both door leaves rest against the jambs.
  for(const [doorX,halfWidth,rotation] of [[start,6.7,1], [end,6.8,-1]]){
    for(const side of [-1,1]){
      const jamb=new THREE.Mesh(new THREE.BoxGeometry(1.5,12,1.6),pale);
      jamb.position.set(doorX,LIBRARY_FLOOR+6,side*halfWidth);scene.add(jamb);
      const capital=new THREE.Mesh(new THREE.BoxGeometry(2.1,.8,2.1),bronze);
      capital.position.set(doorX,LIBRARY_FLOOR+12.1,side*halfWidth);scene.add(capital);
      const door=new THREE.Group();
      door.position.set(doorX,LIBRARY_FLOOR,side*halfWidth);
      door.rotation.y=side*rotation*1.14;
      const panel=new THREE.Mesh(new THREE.BoxGeometry(.62,10.7,6.5),darkWood);
      panel.position.set(0,5.35,-side*3.25);door.add(panel);
      for(const yy of [2,5.35,8.7]){
        const band=new THREE.Mesh(new THREE.BoxGeometry(.78,.27,6.3),bronze);
        band.position.set(.34,yy,-side*3.25);door.add(band);
      }
      scene.add(door);
    }
  }
  const entryArch=new THREE.Mesh(new THREE.TorusGeometry(6.8,.42,9,44,Math.PI),pale);
  entryArch.rotation.y=Math.PI/2;entryArch.position.set(start-.12,LIBRARY_FLOOR+6.9,0);scene.add(entryArch);
  const libraryArch=new THREE.Mesh(new THREE.TorusGeometry(6.8,.42,9,44,Math.PI),pale);
  libraryArch.rotation.y=Math.PI/2;libraryArch.position.set(end+.12,LIBRARY_FLOOR+6.9,0);scene.add(libraryArch);
}

function buildLibraryShell() {
  const cx=LIBRARY_CENTER_X,cz=LIBRARY_CENTER_Z,y=LIBRARY_FLOOR;
  const pale=new THREE.MeshStandardMaterial({color:0xd9d7cf,roughness:.38,metalness:.035});
  const darkStone=new THREE.MeshStandardMaterial({color:0x222832,roughness:.82,metalness:.035});
  const darkWall=new THREE.MeshStandardMaterial({color:0x303b49,roughness:.72,metalness:.035});
  const floor=new THREE.Mesh(new THREE.CircleGeometry(LIBRARY_RADIUS-.05,128),pale);
  floor.rotation.x=-Math.PI/2;floor.position.set(cx,y+.012,cz);floor.receiveShadow=true;scene.add(floor);

  // Wall split leaves one east-facing entrance aligned to the connector.
  const halfDoor=.25;
  const arcs=[
    [0,Math.PI/2-halfDoor],
    [Math.PI/2+halfDoor,Math.PI*1.5-halfDoor]
  ];
  for(const [start,length] of arcs){
    const geo=new THREE.CylinderGeometry(LIBRARY_RADIUS,LIBRARY_RADIUS,LIBRARY_WALL_HEIGHT,128,1,true,start,length);
    const wall=new THREE.Mesh(geo,darkWall);
    wall.position.set(cx,y+LIBRARY_WALL_HEIGHT/2,cz);wall.receiveShadow=true;scene.add(wall);
  }
  for(const [height,r,tube,mat] of [
    [1.05,LIBRARY_RADIUS-.12,.42,pale],
    [LIBRARY_WALL_HEIGHT-.7,LIBRARY_RADIUS-.12,.48,pale],
    [LIBRARY_WALL_HEIGHT,LIBRARY_RADIUS-.15,.28,darkStone]
  ]){
    const ring=new THREE.Mesh(new THREE.TorusGeometry(r,tube,8,128),mat);
    ring.rotation.x=Math.PI/2;ring.position.set(cx,y+height,cz);scene.add(ring);
  }

  // East doorway: stone jambs, carved capitals, and leaves turned open against the wall.
  const bronze=new THREE.MeshStandardMaterial({color:0xa58c5e,metalness:.7,roughness:.3});
  const wood=new THREE.MeshStandardMaterial({color:0x31231c,roughness:.8});
  for(const side of [-1,1]){
    const jamb=new THREE.Mesh(new THREE.BoxGeometry(1.9,22,1.8),pale);
    jamb.position.set(cx+LIBRARY_RADIUS-.5,y+11,side*8.1);scene.add(jamb);
    const capital=new THREE.Mesh(new THREE.BoxGeometry(2.6,1.0,2.6),bronze);
    capital.position.set(cx+LIBRARY_RADIUS-.5,y+22,side*8.1);scene.add(capital);
    const door=new THREE.Group();
    door.position.set(cx+LIBRARY_RADIUS-.8,y,side*7.6);
    door.rotation.y=side*1.2;
    const leaf=new THREE.Mesh(new THREE.BoxGeometry(.82,19,7.4),wood);
    leaf.position.set(0,9.5,-side*3.7);door.add(leaf);
    for(const yy of [3.1,9.5,15.9]){
      const band=new THREE.Mesh(new THREE.BoxGeometry(1.0,.35,7.2),bronze);
      band.position.set(.48,yy,-side*3.7);door.add(band);
    }
    scene.add(door);
  }
  const arch=new THREE.Mesh(new THREE.TorusGeometry(8.0,.58,10,56,Math.PI),pale);
  arch.rotation.y=Math.PI/2;arch.position.set(cx+LIBRARY_RADIUS-.2,y+12.0,0);scene.add(arch);

  // Five-story height is expressed through four accessible upper galleries.
  const vaultMat=new THREE.MeshStandardMaterial({color:0x202731,roughness:.84,metalness:.04,side:THREE.DoubleSide});
  const vaultGeo=new THREE.SphereGeometry(LIBRARY_RADIUS,72,36,0,Math.PI*2,0,Math.PI/2);
  const vault=new THREE.Mesh(vaultGeo,vaultMat);
  vault.scale.y=.34;vault.position.set(cx,y+LIBRARY_WALL_HEIGHT-.6,cz);
  vault.receiveShadow=true;scene.add(vault);
  for(let i=0;i<18;i++){
    const a=i/18*Math.PI*2;
    const points=[
      new THREE.Vector3(cx+Math.cos(a)*LIBRARY_RADIUS,y+LIBRARY_WALL_HEIGHT-.8,cz+Math.sin(a)*LIBRARY_RADIUS),
      new THREE.Vector3(cx+Math.cos(a)*LIBRARY_RADIUS*.72,y+LIBRARY_WALL_HEIGHT+2.8,cz+Math.sin(a)*LIBRARY_RADIUS*.72),
      new THREE.Vector3(cx+Math.cos(a)*LIBRARY_RADIUS*.38,y+LIBRARY_WALL_HEIGHT+7.1,cz+Math.sin(a)*LIBRARY_RADIUS*.38),
      new THREE.Vector3(cx,y+LIBRARY_WALL_HEIGHT+10.0,cz)
    ];
    const curve=new THREE.CatmullRomCurve3(points);
    const rib=new THREE.Mesh(new THREE.TubeGeometry(curve,48,.22,7,false),darkStone);
    scene.add(rib);
  }
}

function buildLibraryGalleries() {
  const cx=LIBRARY_CENTER_X,cz=LIBRARY_CENTER_Z;
  const floorMat=new THREE.MeshStandardMaterial({color:0xc8c6be,roughness:.48,metalness:.025});
  const edgeMat=new THREE.MeshStandardMaterial({color:0x8e8e88,roughness:.42,metalness:.06});
  const gapHalf=.19;
  const gaps=[0,Math.PI*2/3,Math.PI*4/3];
  const segments=[];
  for(let i=0;i<gaps.length;i++){
    const start=gaps[i]+gapHalf;
    const end=(i+1<gaps.length?gaps[i+1]:Math.PI*2)-gapHalf;
    segments.push([start,end-start]);
  }
  for(let level=1;level<=LIBRARY_LEVELS;level++){
    const y=LIBRARY_FLOOR+level*LIBRARY_LEVEL_HEIGHT;
    for(const [start,length] of segments){
      const geo=new THREE.RingGeometry(14.15,LIBRARY_RADIUS-.5,96,1,start,length);
      const floor=new THREE.Mesh(geo,floorMat);
      floor.rotation.x=-Math.PI/2;floor.position.set(cx,y,cz);floor.receiveShadow=true;scene.add(floor);
    }
    // Short open bridges connect each spiral stair to the ring gallery.
    for(const stair of LIBRARY_STAIRS){
      const a=stair.startAngle;
      const bx=stair.x+Math.cos(a)*5.25,bz=stair.z+Math.sin(a)*5.25;
      const bridge=new THREE.Mesh(new THREE.BoxGeometry(5.2,.34,3.2),floorMat);
      bridge.position.set(bx,y-.17,bz);bridge.rotation.y=-a;bridge.receiveShadow=true;scene.add(bridge);
      for(const side of [-1,1]){
        const post=new THREE.Mesh(new THREE.BoxGeometry(.32,1.0,.32),edgeMat);
        const px=bx+Math.cos(a)*1.65+(-Math.sin(a))*side*1.55;
        const pz=bz+Math.sin(a)*1.65+Math.cos(a)*side*1.55;
        post.position.set(px,y+.5,pz);scene.add(post);
      }
    }
    // Continuous carved fascia makes the layered balconies readable from below.
    const rim=new THREE.Mesh(new THREE.TorusGeometry(22.1,.16,7,112),
      new THREE.MeshStandardMaterial({color:0xaaa79d,roughness:.48}));
    rim.rotation.x=Math.PI/2;rim.position.set(cx,y-.18,cz);scene.add(rim);
  }
}

function buildLibraryStairs() {
  const layouts=[
    {x:LIBRARY_CENTER_X+8.0,z:0,start:0,turns:3.0,radius:3.0},
    {x:LIBRARY_CENTER_X-4.0,z:6.928,start:Math.PI*2/3,turns:3.0,radius:3.0},
    {x:LIBRARY_CENTER_X-4.0,z:-6.928,start:Math.PI*4/3,turns:3.0,radius:3.0}
  ];
  const riseHeight=LIBRARY_LEVELS*LIBRARY_LEVEL_HEIGHT;
  const stepRise=.17,stepCount=Math.ceil(riseHeight/stepRise);
  const realRise=riseHeight/stepCount;
  const treadMat=new THREE.MeshStandardMaterial({color:0xd4d1c7,roughness:.4,metalness:.025});
  const edgeMat=new THREE.MeshStandardMaterial({color:0xa58c5c,metalness:.68,roughness:.3});
  const stepGeo=new THREE.BoxGeometry(LIBRARY_STAIR_WIDTH,.28,1);
  for(let stairIndex=0;stairIndex<layouts.length;stairIndex++){
    const layout=layouts[stairIndex];
    const totalAngle=layout.turns*Math.PI*2;
    const steps=new THREE.InstancedMesh(stepGeo,treadMat,stepCount);
    const nosings=new THREE.InstancedMesh(new THREE.BoxGeometry(LIBRARY_STAIR_WIDTH,.08,.14),edgeMat,stepCount);
    const dummy=new THREE.Object3D();
    const depth=THREE.MathUtils.clamp(layout.radius*totalAngle/stepCount*.9,.38,.72);
    for(let i=0;i<stepCount;i++){
      const t=(i+.5)/stepCount,a=layout.start+totalAngle*t;
      const topY=LIBRARY_FLOOR+(i+1)*realRise;
      const x=layout.x+Math.cos(a)*layout.radius;
      const z=layout.z+Math.sin(a)*layout.radius;
      dummy.position.set(x,topY-.14,z);dummy.rotation.set(0,-a,0);
      dummy.scale.set(1,1,depth);dummy.updateMatrix();steps.setMatrixAt(i,dummy.matrix);
      dummy.position.y=topY-.035;dummy.scale.set(1,1,depth);
      dummy.updateMatrix();nosings.setMatrixAt(i,dummy.matrix);
    }
    steps.instanceMatrix.needsUpdate=true;nosings.instanceMatrix.needsUpdate=true;
    scene.add(steps,nosings);

    const posts=new THREE.InstancedMesh(new THREE.CylinderGeometry(.10,.13,.95,8),
      new THREE.MeshStandardMaterial({color:0x777b7c,metalness:.7,roughness:.34}),
      Math.ceil(stepCount/8)+1);
    const railPoints=[];let n=0;
    for(let i=0;i<=stepCount;i+=8){
      const t=Math.min(1,i/stepCount),a=layout.start+totalAngle*t;
      const y=LIBRARY_FLOOR+riseHeight*t+.92;
      const r=layout.radius+1.28;
      const x=layout.x+Math.cos(a)*r,z=layout.z+Math.sin(a)*r;
      dummy.position.set(x,y-.47,z);dummy.updateMatrix();posts.setMatrixAt(n++,dummy.matrix);
      railPoints.push(new THREE.Vector3(x,y,z));
    }
    posts.count=n;posts.instanceMatrix.needsUpdate=true;scene.add(posts);
    const curve=new THREE.CatmullRomCurve3(railPoints,false,"centripetal");
    const rail=new THREE.Mesh(new THREE.TubeGeometry(curve,Math.max(240,stepCount*2),.17,7,false),
      new THREE.MeshStandardMaterial({color:0xa18a5b,metalness:.72,roughness:.28}));
    scene.add(rail);

    LIBRARY_STAIRS.push({
      x:layout.x,z:layout.z,startAngle:layout.start,turns:layout.turns,
      totalAngle,stepCount,stepRise:realRise,radius:layout.radius
    });
  }
}

function buildBranchingColonnades() {
  const marble=new THREE.MeshStandardMaterial({color:0xc7c4ba,roughness:.38,metalness:.035});
  const darkMarble=new THREE.MeshStandardMaterial({color:0x545b62,roughness:.52,metalness:.035});
  const count=12;
  for(let i=0;i<count;i++){
    const a=i/count*Math.PI*2,r=14.1;
    const x=LIBRARY_CENTER_X+Math.cos(a)*r,z=LIBRARY_CENTER_Z+Math.sin(a)*r;
    const trunk=new THREE.Mesh(new THREE.CylinderGeometry(.66,.94,20.8,14),marble);
    trunk.position.set(x,LIBRARY_FLOOR+10.4,z);trunk.castShadow=true;scene.add(trunk);
    const base=new THREE.Mesh(new THREE.CylinderGeometry(1.3,1.55,.65,14),darkMarble);
    base.position.set(x,LIBRARY_FLOOR+.32,z);scene.add(base);
    const capital=new THREE.Mesh(new THREE.CylinderGeometry(1.2,1.05,.75,14),marble);
    capital.position.set(x,LIBRARY_FLOOR+20.85,z);scene.add(capital);
    // Each pillar divides into three stone ribs like the branching limbs of a tree.
    for(let branch=0;branch<3;branch++){
      const offset=(branch-1)*.62;
      const sign=branch===1?0:Math.sign(offset);
      const endA=a+offset*.095;
      const endR=23.0+Math.abs(offset)*2.3;
      const points=[
        new THREE.Vector3(x,LIBRARY_FLOOR+20.8,z),
        new THREE.Vector3(LIBRARY_CENTER_X+Math.cos(a)*(r+3.2),LIBRARY_FLOOR+23.1,z+Math.sin(a)*3.2),
        new THREE.Vector3(LIBRARY_CENTER_X+Math.cos(endA)*endR,LIBRARY_FLOOR+25.0,LIBRARY_CENTER_Z+Math.sin(endA)*endR)
      ];
      const curve=new THREE.CatmullRomCurve3(points);
      const rib=new THREE.Mesh(new THREE.TubeGeometry(curve,24,.24,7,false),marble);
      rib.castShadow=true;scene.add(rib);
    }
  }
}

function buildLibraryShelves() {
  const black=new THREE.MeshStandardMaterial({color:0x11151b,roughness:.3,metalness:.1});
  const edge=new THREE.MeshStandardMaterial({color:0x555b61,roughness:.37,metalness:.12});
  const parchment=new THREE.MeshStandardMaterial({color:0xb8a27b,roughness:.82});
  const endGold=new THREE.MeshStandardMaterial({color:0x9d8353,metalness:.66,roughness:.3});
  const shelfFloors=[LIBRARY_FLOOR,...Array.from({length:LIBRARY_LEVELS},(_,i)=>LIBRARY_FLOOR+(i+1)*LIBRARY_LEVEL_HEIGHT)];
  const angles=[.56,.98,1.42,1.86,2.30,2.74,3.18,3.62,4.06,4.50,4.94,5.38];
  for(const floorY of shelfFloors){
    for(const a of angles){
      const radius=24.5;
      const cx=LIBRARY_CENTER_X+Math.cos(a)*radius;
      const cz=LIBRARY_CENTER_Z+Math.sin(a)*radius;
      for(const pairSide of [-1,1]){
        const tangentOffset=pairSide*2.05;
        const x=cx-Math.sin(a)*tangentOffset;
        const z=cz+Math.cos(a)*tangentOffset;
        const group=new THREE.Group();
        group.position.set(x,floorY,z);group.rotation.y=-a;scene.add(group);
        // Paired black-marble bookcases, not modern wooden shelving.
        const back=new THREE.Mesh(new THREE.BoxGeometry(.25,4.35,3.65),black);
        back.position.set(.38,2.28,0);group.add(back);
        for(const side of [-1,1]){
          const post=new THREE.Mesh(new THREE.BoxGeometry(1.0,4.5,.18),edge);
          post.position.set(0,2.25,side*1.78);group.add(post);
        }
        for(let level=0;level<5;level++){
          const shelf=new THREE.Mesh(new THREE.BoxGeometry(1.35,.22,3.72),black);
          shelf.position.set(-.02,.35+level*.91,0);group.add(shelf);
          for(let roll=0;roll<4;roll++){
            const scroll=new THREE.Mesh(new THREE.CylinderGeometry(.115,.115,.72,8),parchment);
            scroll.rotation.x=Math.PI/2;
            scroll.position.set(-.12,.58+level*.91,-1.32+roll*.86);group.add(scroll);
            const capA=new THREE.Mesh(new THREE.SphereGeometry(.12,7,6),endGold);
            capA.scale.set(1,.5,1);capA.position.set(-.12,.58+level*.91,-1.32+roll*.86-.37);group.add(capA);
            const capB=capA.clone();capB.position.z+=.74;group.add(capB);
          }
        }
        LIBRARY_SHELF_BLOCKERS.push({
          x,z,angle:a,radialHalf:.82,tangentHalf:1.9,floorY
        });
      }
    }
  }
}

function buildLibraryReadingFurniture() {
  const stone=new THREE.MeshStandardMaterial({color:0xb9b7af,roughness:.58});
  const dark=new THREE.MeshStandardMaterial({color:0x62686c,roughness:.72});
  const brass=new THREE.MeshStandardMaterial({color:0x9c8255,metalness:.66,roughness:.34});
  for(let i=0;i<6;i++){
    const a=i/6*Math.PI*2+.22,r=12.4;
    if(LIBRARY_STAIRS.some(stair=>libraryAngleDistance(a,stair.startAngle)<.36))continue;
    const x=LIBRARY_CENTER_X+Math.cos(a)*r,z=LIBRARY_CENTER_Z+Math.sin(a)*r;
    const tableBase=new THREE.Mesh(new THREE.CylinderGeometry(.38,.95,1.0,12),stone);
    tableBase.position.set(x,LIBRARY_FLOOR+.5,z);scene.add(tableBase);
    const top=new THREE.Mesh(new THREE.BoxGeometry(1.75,.28,1.4),stone);
    top.position.set(x,LIBRARY_FLOOR+1.15,z);top.rotation.y=-a;scene.add(top);
    for(const side of [-1,1]){
      const bench=new THREE.Mesh(new THREE.BoxGeometry(.82,.6,2.2),dark);
      bench.position.set(x-Math.cos(a)*2.2,LIBRARY_FLOOR+.3,z-Math.sin(a)*2.2+side*1.5);
      bench.rotation.y=-a;scene.add(bench);
      const seat=new THREE.Mesh(new THREE.BoxGeometry(.9,.18,2.3),stone);
      seat.position.set(bench.position.x,LIBRARY_FLOOR+.68,bench.position.z);seat.rotation.y=-a;scene.add(seat);
    }
  }
}

function buildLibraryLight() {
  const fixture=new THREE.MeshStandardMaterial({color:0xb4a078,metalness:.62,roughness:.32});
  const glass=new THREE.MeshStandardMaterial({color:0xf1e1bd,emissive:0xdab77b,emissiveIntensity:1.1,roughness:.23});
  for(let i=0;i<10;i++){
    const a=i/10*Math.PI*2,r=LIBRARY_RADIUS-.8;
    const x=LIBRARY_CENTER_X+Math.cos(a)*r,z=LIBRARY_CENTER_Z+Math.sin(a)*r;
    const mount=new THREE.Mesh(new THREE.BoxGeometry(.8,1.2,.8),fixture);
    mount.position.set(x,LIBRARY_FLOOR+9.0,z);mount.rotation.y=-a;scene.add(mount);
    const lamp=new THREE.Mesh(new THREE.SphereGeometry(.48,10,8),glass);
    lamp.position.set(x,LIBRARY_FLOOR+10.0,z);scene.add(lamp);
    const point=new THREE.PointLight(0xffd9a3,26,34,2);
    point.position.set(x,LIBRARY_FLOOR+9.7,z);scene.add(point);
  }
  const ambient=new THREE.PointLight(0x8195b7,44,52,2);
  ambient.position.set(LIBRARY_CENTER_X,LIBRARY_FLOOR+26,0);scene.add(ambient);
}

function buildGreatLibrary() {
  buildLibraryPassage();
  buildLibraryShell();
  buildLibraryStairs();
  buildLibraryGalleries();
  buildBranchingColonnades();
  buildLibraryShelves();
  buildLibraryReadingFurniture();
  buildLibraryLight();
}
buildGreatLibrary();
