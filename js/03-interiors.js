// Walkable upper-gallery levels and helical stair flights, in world metres.
const CENTRAL_GALLERY_LEVELS=[24,49,74,99];
const CENTRAL_STAIR_RADIUS=118;
const CENTRAL_STAIR_RADIAL_HALF_WIDTH=10;
const CENTRAL_STAIRWAYS=CENTRAL_GALLERY_LEVELS.map((upper,index)=>{
  const lower=index===0?0:CENTRAL_GALLERY_LEVELS[index-1];
  const steps=Math.ceil((upper-lower)/.29);
  const span=(steps*.95)/CENTRAL_STAIR_RADIUS;
  const center=(45+index*90)*Math.PI/180;
  return {lower,upper,steps,span,start:center-span/2,end:center+span/2,center};
});
function centralAngleDelta(a,b){
  return Math.atan2(Math.sin(a-b),Math.cos(a-b));
}
function centralStairProgress(x,z,stair){
  const radius=Math.hypot(x,z);
  if(radius<CENTRAL_STAIR_RADIUS-CENTRAL_STAIR_RADIAL_HALF_WIDTH-1 ||
     radius>CENTRAL_STAIR_RADIUS+CENTRAL_STAIR_RADIAL_HALF_WIDTH+1)return null;
  const angle=Math.atan2(z,x);
  const progress=THREE.MathUtils.euclideanModulo(angle-stair.start,Math.PI*2);
  if(progress>stair.span)return null;
  return THREE.MathUtils.clamp(progress/stair.span,0,1);
}
function centralStairFloorOffset(x,z){
  for(const stair of CENTRAL_STAIRWAYS){
    const progress=centralStairProgress(x,z,stair);
    if(progress===null)continue;
    const step=Math.round(progress*stair.steps);
    return stair.lower+(stair.upper-stair.lower)*(step/stair.steps);
  }
  return null;
}

// ============================================================================
// FASE 3 — CÂMARA CENTRAL E TRÊS CORREDORES PRINCIPAIS
// [LIVRO] Câmara com cerca de 1.000 pés (304,8 m) de diâmetro; piso de
// cornalina com emblema de Korgan; galerias e circulação em quatro direções.
// [INTERPRETAÇÃO] alturas, desenho exato das arcadas, modulação e ornamentação.
// O grande corredor oriental construído na Fase 2 conecta-se pelo lado leste.
// ============================================================================
function buildCentralChamber(){
  const floorY=ENTRY_HALL_FLOOR;
  const radius=CENTRAL_CHAMBER_RADIUS, wallRadius=CENTRAL_WALL_RADIUS, chamberHeight=116;
  const stone=new THREE.MeshStandardMaterial({color:0xc9c9c5,roughness:.38,metalness:.035});
  const pale=new THREE.MeshStandardMaterial({color:0xe0ded6,roughness:.34});
  const redJasper=new THREE.MeshStandardMaterial({color:0x702b34,roughness:.34,metalness:.08});
  const darkJasper=new THREE.MeshStandardMaterial({color:0x3e2027,roughness:.42});
  const bronze=new THREE.MeshStandardMaterial({color:0x9c7942,metalness:.76,roughness:.28});
  const carnelian=new THREE.MeshStandardMaterial({color:0x8e3528,roughness:.3,metalness:.08});
  const darkRed=new THREE.MeshStandardMaterial({color:0x542027,roughness:.38});
  const floor=new THREE.Mesh(new THREE.CircleGeometry(radius,160),carnelian);
  floor.rotation.x=-Math.PI/2;floor.position.y=floorY+.12;floor.receiveShadow=true;scene.add(floor);

  // Continuous circular stone enclosure; openings are reserved for the four
  // actual passages, while every other sector is a solid wall.
  const wallSegments=384,wallRows=24,wallPositions=[],wallIndices=[];
  for(let j=0;j<=wallRows;j++){
    const y=floorY+chamberHeight*j/wallRows;
    for(let i=0;i<=wallSegments;i++){
      const a=i/wallSegments*Math.PI*2;
      wallPositions.push(Math.cos(a)*wallRadius,y,Math.sin(a)*wallRadius);
    }
  }
  const portals=[{a:0,w:42},{a:Math.PI/2,w:21},{a:Math.PI,w:21},{a:Math.PI*1.5,w:21}];
  for(let j=0;j<wallRows;j++)for(let i=0;i<wallSegments;i++){
    const aMid=(i+.5)/wallSegments*Math.PI*2;
    const yMid=floorY+chamberHeight*(j+.5)/wallRows;
    const isOpen=portals.some(p=>{
      const delta=Math.abs(Math.atan2(Math.sin(aMid-p.a),Math.cos(aMid-p.a)));
      return delta<Math.asin(p.w/wallRadius) && yMid<floorY+36;
    });
    if(isOpen)continue;
    const a=j*(wallSegments+1)+i,b=a+wallSegments+1;
    wallIndices.push(a,b,a+1,a+1,b,b+1);
  }
  const wallGeo=new THREE.BufferGeometry();
  wallGeo.setAttribute('position',new THREE.Float32BufferAttribute(wallPositions,3));
  wallGeo.setIndex(wallIndices);wallGeo.computeVertexNormals();
  const chamberWallMat=new THREE.MeshStandardMaterial({color:0xc9c9c5,roughness:.48,metalness:.025,side:THREE.DoubleSide});
  const chamberWall=new THREE.Mesh(wallGeo,chamberWallMat);
  chamberWall.receiveShadow=true;scene.add(chamberWall);
  for(const h of [36,76,116]){
    const cornice=new THREE.Mesh(new THREE.TorusGeometry(wallRadius,1.35,8,192),pale);
    cornice.rotation.x=Math.PI/2;cornice.position.y=floorY+h;scene.add(cornice);
  }
  for(const portal of portals){
    const tx=-Math.sin(portal.a),tz=Math.cos(portal.a);
    for(const side of [-1,1]){
      const x=Math.cos(portal.a)*wallRadius+tx*side*portal.w;
      const z=Math.sin(portal.a)*wallRadius+tz*side*portal.w;
      const jamb=new THREE.Mesh(new THREE.BoxGeometry(5,36,5),redJasper);
      jamb.position.set(x,floorY+18,z);jamb.rotation.y=-portal.a;scene.add(jamb);
      const capital=new THREE.Mesh(new THREE.BoxGeometry(7,2.5,7),pale);
      capital.position.set(x,floorY+36,z);capital.rotation.y=-portal.a;scene.add(capital);
    }
    const header=new THREE.Mesh(new THREE.BoxGeometry(6,3.2,portal.w*2+10),redJasper);
    header.position.set(Math.cos(portal.a)*wallRadius,floorY+36,Math.sin(portal.a)*wallRadius);
    header.rotation.y=-portal.a;scene.add(header);
  }

  // Large polished floor medallion and concentric stone/brass inlay.
  for(const [r,tube,mat] of [[146,1.1,pale],[132,.55,bronze],[108,.42,darkRed],[82,.42,bronze],[57,.35,pale]]){
    const ring=new THREE.Mesh(new THREE.TorusGeometry(r,tube,8,192),mat);
    ring.rotation.x=Math.PI/2;ring.position.y=floorY+.28;scene.add(ring);
  }
  // Radial joints in the carnelian pavement: subtle, broad stone sectors.
  const seamMat=new THREE.MeshStandardMaterial({color:0x55252a,roughness:.62});
  for(let i=0;i<32;i++){
    const a=i*Math.PI/16;
    const seam=new THREE.Mesh(new THREE.BoxGeometry(1.15, .12, radius*1.82),seamMat);
    seam.position.set(0,floorY+.22,0);seam.rotation.y=a;scene.add(seam);
  }

  // Hammer emblem of Korgan, inlaid in pale stone and bronze at the center.
  const emblem=new THREE.Group();emblem.position.set(0,floorY+.48,0);
  const head=new THREE.Mesh(new THREE.BoxGeometry(31,1.15,12),pale);
  head.position.set(0,0,-7);emblem.add(head);
  const cap=new THREE.Mesh(new THREE.BoxGeometry(8,1.25,20),bronze);
  cap.position.set(0,.02,-7);emblem.add(cap);
  const haft=new THREE.Mesh(new THREE.BoxGeometry(6.5,1.1,42),pale);
  haft.position.set(0,0,16);haft.rotation.y=-.18;emblem.add(haft);
  const pommel=new THREE.Mesh(new THREE.OctahedronGeometry(5,0),bronze);
  pommel.position.set(0,.2,37);emblem.add(pommel);scene.add(emblem);

  // Four continuous annular galleries. The walking surface has a real thickness
  // and a deliberate stairwell opening on the level above each incoming flight.
  const galleryInner=108,galleryOuter=142,stairGapHalf=.36;
  const galleryFloorMat=new THREE.MeshStandardMaterial({color:0xd4d3cb,roughness:.42,metalness:.025,side:THREE.DoubleSide});
  const galleryUndersideMat=new THREE.MeshStandardMaterial({color:0x777a79,roughness:.68,side:THREE.DoubleSide});
  const balusterMat=new THREE.MeshStandardMaterial({color:0xc7c5bc,roughness:.38,metalness:.06});
  const handrailMat=new THREE.MeshStandardMaterial({color:0xa4824c,roughness:.3,metalness:.72});
  function annularDeckGeometry(y,gapCenter){
    const angular=384,radial=10,positions=[],indices=[];
    for(let j=0;j<=radial;j++){
      const r=galleryInner+(galleryOuter-galleryInner)*j/radial;
      for(let i=0;i<=angular;i++){
        const a=i/angular*Math.PI*2;
        positions.push(Math.cos(a)*r,y,Math.sin(a)*r);
      }
    }
    for(let j=0;j<radial;j++)for(let i=0;i<angular;i++){
      const aMid=(i+.5)/angular*Math.PI*2;
      const rMid=galleryInner+(galleryOuter-galleryInner)*(j+.5)/radial;
      const inStairSlot=gapCenter!==null &&
        Math.abs(centralAngleDelta(aMid,gapCenter))<stairGapHalf &&
        rMid< CENTRAL_STAIR_RADIUS+CENTRAL_STAIR_RADIAL_HALF_WIDTH+1;
      if(inStairSlot)continue;
      const a=j*(angular+1)+i,b=a+angular+1;
      indices.push(a,a+1,b,a+1,b+1,b);
    }
    const g=new THREE.BufferGeometry();
    g.setAttribute("position",new THREE.Float32BufferAttribute(positions,3));
    g.setIndex(indices);g.computeVertexNormals();return g;
  }
  function curvedRail(radius,y,startAngle,endAngle,material,tube=.42){
    const points=[];
    for(let i=0;i<=180;i++){
      const a=startAngle+(endAngle-startAngle)*i/180;
      points.push(new THREE.Vector3(Math.cos(a)*radius,y,Math.sin(a)*radius));
    }
    const curve=new THREE.CatmullRomCurve3(points,false,"centripetal");
    const mesh=new THREE.Mesh(new THREE.TubeGeometry(curve,240,tube,8,false),material);
    scene.add(mesh);
  }
  function buildGalleryRail(levelY,gapCenter,isInner){
    const radius=isInner?galleryInner:galleryOuter;
    const gap=isInner?stairGapHalf:0;
    if(gapCenter===null || gap===0){
      curvedRail(radius,levelY+1.35,0,Math.PI*2,handrailMat,.48);
    }else{
      curvedRail(radius,levelY+1.35,gapCenter+gap,gapCenter-gap+Math.PI*2,handrailMat,.48);
    }
    const count=144,geo=new THREE.CylinderGeometry(.32,.38,1.35,8);
    const posts=new THREE.InstancedMesh(geo,balusterMat,count,new THREE.MeshStandardMaterial());
    const dummy=new THREE.Object3D();let used=0;
    for(let i=0;i<count;i++){
      const a=i/count*Math.PI*2;
      if(gapCenter!==null && isInner && Math.abs(centralAngleDelta(a,gapCenter))<stairGapHalf)continue;
      dummy.position.set(Math.cos(a)*radius,levelY+.68,Math.sin(a)*radius);
      dummy.rotation.y=-a;dummy.updateMatrix();posts.setMatrixAt(used++,dummy.matrix);
    }
    posts.count=used;posts.instanceMatrix.needsUpdate=true;scene.add(posts);
  }
  for(let i=0;i<CENTRAL_GALLERY_LEVELS.length;i++){
    const level=CENTRAL_GALLERY_LEVELS[i],y=floorY+level;
    const outgoing=i<CENTRAL_STAIRWAYS.length-1?CENTRAL_STAIRWAYS[i+1].center:null;
    const deck=new THREE.Mesh(annularDeckGeometry(y-.35,outgoing),galleryFloorMat);
    deck.receiveShadow=true;deck.castShadow=true;scene.add(deck);
    const underside=new THREE.Mesh(annularDeckGeometry(y-1.15,outgoing),galleryUndersideMat);
    scene.add(underside);
    buildGalleryRail(y,outgoing,true);
    buildGalleryRail(y,outgoing,false);
    // Stone fascia bands make the gallery slabs read as substantial architecture.
    const outerBand=new THREE.Mesh(new THREE.TorusGeometry(galleryOuter-.7,.85,8,192),pale);
    outerBand.rotation.x=Math.PI/2;outerBand.position.y=y-.72;scene.add(outerBand);
    const innerBand=new THREE.Mesh(new THREE.TorusGeometry(galleryInner+.7,.7,8,192),darkJasper);
    innerBand.rotation.x=Math.PI/2;innerBand.position.y=y-.72;scene.add(innerBand);
  }

  // Monumental curved stair flights: each one rises to the next gallery level.
  // Their 20-metre radial width and bronze handrails are visible from the chamber floor.
  const treadMaterial=new THREE.MeshStandardMaterial({color:0xe0ded6,roughness:.38});
  const treadEdgeMaterial=new THREE.MeshStandardMaterial({color:0x9a7441,metalness:.66,roughness:.34});
  for(const stair of CENTRAL_STAIRWAYS){
    const rise=(stair.upper-stair.lower)/stair.steps;
    for(let i=0;i<stair.steps;i++){
      const progress=(i+.5)/stair.steps;
      const angle=stair.start+stair.span*progress;
      const surfaceY=floorY+stair.lower+(i+1)*rise;
      const tread=new THREE.Mesh(new THREE.BoxGeometry(20,.52,1.12),treadMaterial);
      tread.position.set(Math.cos(angle)*CENTRAL_STAIR_RADIUS,surfaceY-.26,Math.sin(angle)*CENTRAL_STAIR_RADIUS);
      tread.rotation.y=-angle;tread.receiveShadow=true;tread.castShadow=true;scene.add(tread);
      const nosing=new THREE.Mesh(new THREE.BoxGeometry(19.8,.12,.13),treadEdgeMaterial);
      nosing.position.set(Math.cos(angle)*CENTRAL_STAIR_RADIUS,surfaceY-.055,Math.sin(angle)*CENTRAL_STAIR_RADIUS);
      nosing.rotation.y=-angle;scene.add(nosing);
    }
    // Inner and outer handrails follow the same rising arc as the treads.
    for(const railRadius of [CENTRAL_STAIR_RADIUS-CENTRAL_STAIR_RADIAL_HALF_WIDTH,
                              CENTRAL_STAIR_RADIUS+CENTRAL_STAIR_RADIAL_HALF_WIDTH]){
      const points=[];
      for(let i=0;i<=48;i++){
        const p=i/48,angle=stair.start+stair.span*p;
        const y=floorY+stair.lower+(stair.upper-stair.lower)*p+1.25;
        points.push(new THREE.Vector3(Math.cos(angle)*railRadius,y,Math.sin(angle)*railRadius));
      }
      const curve=new THREE.CatmullRomCurve3(points,false,"centripetal");
      const rail=new THREE.Mesh(new THREE.TubeGeometry(curve,100,.42,8,false),handrailMat);
      scene.add(rail);
      const postGeo=new THREE.CylinderGeometry(.24,.3,1.25,8);
      for(let i=0;i<=stair.steps;i+=8){
        const p=i/stair.steps,angle=stair.start+stair.span*p;
        const y=floorY+stair.lower+(stair.upper-stair.lower)*p+.62;
        const post=new THREE.Mesh(postGeo,balusterMat);
        post.position.set(Math.cos(angle)*railRadius,y,Math.sin(angle)*railRadius);
        scene.add(post);
      }
    }
  }

  // Tall perimeter piers and carved capitals form the chamber's monumental rhythm.
  const columnGeo=makeFlutedColumnGeometry(4.25,chamberHeight,20);
  const baseGeo=new THREE.CylinderGeometry(6.1,6.8,2.2,16);
  const capGeo=new THREE.BoxGeometry(12,3.2,12);
  for(let i=0;i<32;i++){
    const a=i*Math.PI/16;
    // Keep columns out of the physical stair footprint and preserve clear landings.
    const overlapsStair=CENTRAL_STAIRWAYS.some(stair=>{
      const progress=THREE.MathUtils.euclideanModulo(a-stair.start,Math.PI*2);
      return progress<=stair.span && Math.abs(CENTRAL_COLUMN_RADIUS-CENTRAL_STAIR_RADIUS)<CENTRAL_STAIR_RADIAL_HALF_WIDTH+5;
    });
    if(overlapsStair)continue;
    const x=Math.cos(a)*CENTRAL_COLUMN_RADIUS,z=Math.sin(a)*CENTRAL_COLUMN_RADIUS;
    const col=new THREE.Mesh(columnGeo,redJasper);
    col.position.set(x,floorY+chamberHeight/2,z);col.castShadow=true;scene.add(col);
    const base=new THREE.Mesh(baseGeo,darkJasper);base.position.set(x,floorY+1.1,z);scene.add(base);
    const cap=new THREE.Mesh(capGeo,pale);cap.position.set(x,floorY+chamberHeight-1.5,z);scene.add(cap);
    const inset=new THREE.Mesh(new THREE.BoxGeometry(2.3,17,.7),bronze);
    inset.position.set(x-Math.cos(a)*4,floorY+chamberHeight*.68,z-Math.sin(a)*4);
    inset.rotation.y=-a;scene.add(inset);
  }

  // Four cardinal portals. The eastern opening is occupied by the already-built
  // one-mile entrance hall; the other three continue as navigable side corridors.
  const directions=[
    {id:"north",x:0,z:-1,angle:0},
    {id:"south",x:0,z:1,angle:Math.PI},
    {id:"west",x:-1,z:0,angle:Math.PI/2}
  ];
  const corridorLength=390,width=38,height=34,start=132,end=radius+corridorLength;
  for(const d of directions){
    const cx=d.x*(start+corridorLength/2),cz=d.z*(start+corridorLength/2);
    const floor=new THREE.Mesh(new THREE.BoxGeometry(d.x?corridorLength:width,2.1,d.z?corridorLength:width),stone);
    floor.position.set(cx,floorY-1.05,cz);scene.add(floor);
    const roof=new THREE.Mesh(new THREE.BoxGeometry(d.x?corridorLength:width,2.4,d.z?corridorLength:width),stone);
    roof.position.set(cx,floorY+height+1.2,cz);scene.add(roof);
    for(const side of [-1,1]){
      const wall=d.z!==0
        ? new THREE.Mesh(new THREE.BoxGeometry(2.4,height,corridorLength),stone)
        : new THREE.Mesh(new THREE.BoxGeometry(corridorLength,height,2.4),stone);
      wall.position.set(d.z!==0?side*width/2:cx,floorY+height/2,d.z!==0?cz:side*width/2);
      wall.receiveShadow=true;scene.add(wall);
    }
    // Repeated jasper piers, arch ribs, and warm lanterns along each branch.
    for(let p=0;p<=4;p++){
      const dist=start+18+p*76;
      for(const side of [-1,1]){
        const x=d.x*dist+(d.z?side*width*.39:0);
        const z=d.z*dist+(d.x?side*width*.39:0);
        const pier=new THREE.Mesh(new THREE.BoxGeometry(3.1,height,3.1),redJasper);
        pier.position.set(x,floorY+height/2,z);scene.add(pier);
        const capital=new THREE.Mesh(new THREE.BoxGeometry(6,2.2,6),pale);
        capital.position.set(x,floorY+height-1,z);scene.add(capital);
        const lamp=new THREE.Mesh(new THREE.SphereGeometry(1.7,10,8),MAT.lantern);
        lamp.position.set(x,floorY+height-5,z);scene.add(lamp);
      }
      const rib=new THREE.Mesh(new THREE.BoxGeometry(d.x?3.2:width,2.4,d.z?3.2:width),pale);
      rib.position.set(d.x*dist,floorY+height-1.2,d.z*dist);scene.add(rib);
    }
    // Stop the unfinished side corridor at a visible closed timber door.
    const endWall=d.z!==0
      ? new THREE.Mesh(new THREE.BoxGeometry(width,height,3),stone)
      : new THREE.Mesh(new THREE.BoxGeometry(3,height,width),stone);
    endWall.position.set(d.z!==0?0:d.x*end,floorY+height/2,d.z!==0?d.z*end:0);
    scene.add(endWall);
    const endDoor=d.z!==0
      ? new THREE.Mesh(new THREE.BoxGeometry(19,25,1.8),darkJasper)
      : new THREE.Mesh(new THREE.BoxGeometry(1.8,25,19),darkJasper);
    endDoor.position.set(d.z!==0?0:d.x*(end-1),floorY+12.5,d.z!==0?d.z*(end-1):0);
    scene.add(endDoor);
    for(const side of [-1,1]){
      const strap=d.z!==0
        ? new THREE.Mesh(new THREE.BoxGeometry(18,.65,2.1),bronze)
        : new THREE.Mesh(new THREE.BoxGeometry(2.1,.65,18),bronze);
      strap.position.set(d.z!==0?0:d.x*(end-2),floorY+5+side*6,d.z!==0?d.z*(end-2):0);
      scene.add(strap);
    }
  }

  // Low perimeter lighting gives the chamber depth without washing out the stone.
  const lightGeo=new THREE.SphereGeometry(1.8,10,8);
  for(let i=0;i<24;i++){
    const a=i*Math.PI/12,x=Math.cos(a)*116,z=Math.sin(a)*116;
    const lamp=new THREE.Mesh(lightGeo,MAT.lantern);lamp.position.set(x,floorY+7,z);scene.add(lamp);
    const glow=new THREE.PointLight(0xd99a54,22,48,2);glow.position.set(x,floorY+8,z);scene.add(glow);
  }
}
buildCentralChamber();
// The navigation module uses the stair constants above to resolve walkable heights.


// EASTERN TUNNEL THROUGH CRATER WALL: [LIVRO] the entry tunnel opens into the
// crater. Its precise location and facade dimensions are treated as interpretation.
function buildCraterTunnel(){
  const x=8060,z=0,y=80;
  const mouth=new THREE.Mesh(new THREE.BoxGeometry(240,190,300),MAT.dark);mouth.position.set(x,y,z);scene.add(mouth);
  const rim=new THREE.Mesh(new THREE.TorusGeometry(125,12,10,64),new THREE.MeshStandardMaterial({color:0x59636b,roughness:.92}));rim.position.set(x-100,y,z);rim.rotation.y=Math.PI/2;scene.add(rim);
  const lip=new THREE.Mesh(new THREE.BoxGeometry(80,12,330),new THREE.MeshStandardMaterial({color:0x424a51,roughness:1}));lip.position.set(x-90, y-92,z);scene.add(lip);
}
buildCraterTunnel();

// STALACTITES / ICE: [LIVRO] gigantic hanging icicles. Exact placements are not
// specified; scale and distribution are visual interpretations for navigation.
function buildIce(){
  const count=30, geo=new THREE.ConeGeometry(1,1,7,2), inst=new THREE.InstancedMesh(geo,MAT.ice,count),o=new THREE.Object3D();
  for(let i=0;i<count;i++){
    const a=i/count*Math.PI*2, r=2600+(i%6)*850, top=10800+(i%5)*1450, h=320+(hash(i,1)*780),rad=22+hash(i,3)*34;
    o.position.set(Math.cos(a)*r,top-h/2,Math.sin(a)*r);o.rotation.set((hash(i,2)-.5)*.1,0,(hash(i,4)-.5)*.1);o.scale.set(rad,h,rad);o.updateMatrix();inst.setMatrixAt(i,o.matrix);
  }
  inst.instanceMatrix.needsUpdate=true;scene.add(inst);
}
buildIce();

// Distant rock outcrops and talus, used to break the flatness of the basin.
function buildBoulders(){
  const g=new THREE.IcosahedronGeometry(1,1),m=new THREE.MeshStandardMaterial({color:0x3b4248,roughness:1});
  const inst=new THREE.InstancedMesh(g,m,210),o=new THREE.Object3D();
  for(let i=0;i<210;i++){
    const a=hash(i,11)*Math.PI*2,r=2400+hash(i,12)*5600,s=12+hash(i,13)*85;
    o.position.set(Math.cos(a)*r,s*.28-3,Math.sin(a)*r);o.rotation.set(hash(i,15),hash(i,16),hash(i,17));o.scale.set(s*1.7,s*.7,s);o.updateMatrix();inst.setMatrixAt(i,o.matrix);
  }
  inst.instanceMatrix.needsUpdate=true;scene.add(inst);
}
buildBoulders();

