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

  // Concentric raised galleries around the chamber, open to the central void.
  const levels=[24,49,74,99];
  for(let i=0;i<levels.length;i++){
    const y=floorY+levels[i];
    const ring=new THREE.Mesh(new THREE.TorusGeometry(wallRadius-9,2.5,10,192),pale);
    ring.rotation.x=Math.PI/2;ring.position.y=y;scene.add(ring);
    const innerBand=new THREE.Mesh(new THREE.TorusGeometry(104,1.4,8,160),bronze);
    innerBand.rotation.x=Math.PI/2;innerBand.position.y=y-1.5;scene.add(innerBand);
    // Segmented balcony walkways, leaving the four cardinal openings clear.
    for(let seg=0;seg<32;seg++){
      const a=seg*Math.PI/16;
      const nearAxis=[0,Math.PI/2,Math.PI,Math.PI*1.5].some(v=>Math.abs(Math.atan2(Math.sin(a-v),Math.cos(a-v)))<.16);
      if(nearAxis)continue;
      const block=new THREE.Mesh(new THREE.BoxGeometry(22,2.4,13),stone);
      block.position.set(Math.cos(a)*125,y-2.3,Math.sin(a)*125);
      block.rotation.y=-a;block.receiveShadow=true;scene.add(block);
    }
  }

  // Tall perimeter piers and carved capitals form the chamber's monumental rhythm.
  const columnGeo=makeFlutedColumnGeometry(4.25,chamberHeight,20);
  const baseGeo=new THREE.CylinderGeometry(6.1,6.8,2.2,16);
  const capGeo=new THREE.BoxGeometry(12,3.2,12);
  for(let i=0;i<32;i++){
    const a=i*Math.PI/16;
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

