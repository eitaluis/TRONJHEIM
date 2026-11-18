function buildFacadeWindows(){
  // Deeper, warmer windows now remain visible all the way toward the summit.
  const windowGeo=new THREE.CapsuleGeometry(1,1.2,10,32);
  const windowMat=new THREE.MeshStandardMaterial({
    color:0x716e68,roughness:.62,emissive:0xa86d37,emissiveIntensity:.24
  });
  const frameMat=new THREE.MeshStandardMaterial({color:0xd0b989,metalness:.48,roughness:.38});
  const capacity=1500;
  const windows=new THREE.InstancedMesh(windowGeo,windowMat,capacity);
  const frames=new THREE.InstancedMesh(new THREE.TorusGeometry(1,0.12,12,40),frameMat,capacity);
  const dummy=new THREE.Object3D();let n=0;
  for(let row=0;row<18;row++){
    const t=.045+row*.0505, y=-8+t*CITY.height, r=cityRadius(t)+3.5;
    const count=Math.max(10,Math.floor(2*Math.PI*r/112));
    for(let i=0;i<count && n<capacity;i++){
      const a=i/count*Math.PI*2+(row%2)*.035;
      const x=Math.cos(a)*r,z=Math.sin(a)*r;
      dummy.position.set(x,y,z);dummy.rotation.set(0,-a,0);dummy.scale.set(7.4,8.0,2.2);dummy.updateMatrix();windows.setMatrixAt(n,dummy.matrix);
      dummy.position.set(x,y,z);dummy.rotation.set(0,Math.PI/2-a,0);dummy.scale.set(9.1,15.2,1.3);dummy.updateMatrix();frames.setMatrixAt(n,dummy.matrix);n++;
    }
  }
  windows.count=n;frames.count=n;windows.instanceMatrix.needsUpdate=true;frames.instanceMatrix.needsUpdate=true;scene.add(windows,frames);
}
function buildMainGate(){
  // [LIVRO: ERAGON] Portão de madeira recuado 20 jardas; dois grifos dourados
  // de 30 pés ladeiam a entrada. [DERIVADO] 20 yd = 18,288 m; 30 ft = 9,144 m.
  // [INTERPRETAÇÃO] localização, largura/altura do vão e anatomia dos grifos.
  const facadeX=cityRadius(10/CITY.height),doorRecess=18.288,doorX=facadeX-doorRecess;
  const floorY=terrainHeightAnalytic(facadeX,0),gateHeight=23,gateRadius=11,centerY=floorY+12;
  TRONJHEIM_GATE={facadeX,doorX,floorY,hallEndX:doorX-5-1609.344};
  ENTRY_HALL_FLOOR=terrainHeightAnalytic((doorX+TRONJHEIM_GATE.hallEndX)/2,0);

  const jasper=new THREE.MeshStandardMaterial({color:0x672630,roughness:.36,metalness:.09});
  const timber=new THREE.MeshStandardMaterial({color:0x302019,roughness:.78,metalness:.08});
  const iron=new THREE.MeshStandardMaterial({color:0x34383a,roughness:.48,metalness:.72});
  const gold=new THREE.MeshStandardMaterial({color:0xb18a43,metalness:.82,roughness:.27});

  // Recess throat: side walls and lintel leave the passage open.
  for(const side of [-1,1]){
    const wall=new THREE.Mesh(new THREE.BoxGeometry(doorRecess,gateHeight,3),MAT.dark);
    wall.position.set((facadeX+doorX)/2,centerY,side*13.5);scene.add(wall);
  }
  const throatTop=new THREE.Mesh(new THREE.BoxGeometry(doorRecess,2.4,30),MAT.dark);
  throatTop.position.set((facadeX+doorX)/2,floorY+gateHeight+1,0);scene.add(throatTop);

  // Outer marble portal, red-j as per interior stonework, and vertical arch.
  for(const side of [-1,1]){
    const pier=new THREE.Mesh(new THREE.BoxGeometry(5,gateHeight+4,4.5),MAT.marbleLight);
    pier.position.set(facadeX+1,floorY+(gateHeight+4)/2,side*13.5);scene.add(pier);
    const inset=new THREE.Mesh(new THREE.BoxGeometry(2.2,gateHeight-2,1.2),jasper);
    inset.position.set(facadeX+3.7,floorY+gateHeight/2,side*13.5);scene.add(inset);
    const capital=new THREE.Mesh(new THREE.BoxGeometry(7,2.5,6),MAT.marbleLight);
    capital.position.set(facadeX+1,floorY+gateHeight+1,side*13.5);scene.add(capital);
  }
  const lintel=new THREE.Mesh(new THREE.BoxGeometry(5,4,31),MAT.marbleLight);
  lintel.position.set(facadeX+1,floorY+gateHeight+1.8,0);scene.add(lintel);
  const arch=new THREE.Mesh(new THREE.TorusGeometry(gateRadius,1.8,12,64,Math.PI),MAT.marbleLight);
  arch.position.set(facadeX+3.8,centerY,0);arch.rotation.y=Math.PI/2;scene.add(arch);
  const innerArch=new THREE.Mesh(new THREE.TorusGeometry(gateRadius-2.4,.5,8,64,Math.PI),jasper);
  innerArch.position.set(facadeX+4.4,centerY,0);innerArch.rotation.y=Math.PI/2;scene.add(innerArch);

  // Timber leaves are folded against the inner sides so the doorway remains visible.
  for(const side of [-1,1]){
    const leaf=new THREE.Group();
    const panel=new THREE.Mesh(new THREE.BoxGeometry(1.4,21,10.5),timber);
    panel.position.set(0,10.5,side*5.25);leaf.add(panel);
    for(let k=0;k<8;k++){
      const plank=new THREE.Mesh(new THREE.BoxGeometry(1.55,20.4,1.08),
        new THREE.MeshStandardMaterial({color:k%2?0x39251c:0x241912,roughness:.84}));
      plank.position.set(.78,10.5,side*(.7+k*1.28));leaf.add(plank);
    }
    for(const yy of [3.1,10.5,18.0]){
      const band=new THREE.Mesh(new THREE.BoxGeometry(1.8,.48,10.7),iron);
      band.position.set(.95,yy,side*5.25);leaf.add(band);
    }
    for(let k=0;k<5;k++){
      const stud=new THREE.Mesh(new THREE.SphereGeometry(.22,8,6),gold);
      stud.position.set(1.1,5+k*2.65,side*5.25);leaf.add(stud);
    }
    leaf.position.set(doorX-2,floorY,side*10.2);leaf.rotation.y=side*.93;scene.add(leaf);
  }

  // [LIVRO] two golden griffins, 30 ft tall. [INTERPRETAÇÃO] sculptural anatomy.
  const goldBody=new THREE.MeshStandardMaterial({color:0xa77d35,metalness:.78,roughness:.3});
  const goldLight=new THREE.MeshStandardMaterial({color:0xd0ae62,metalness:.74,roughness:.28});
  const wingShape=new THREE.Shape();
  wingShape.moveTo(0,0);wingShape.lineTo(-.5,2.1);wingShape.lineTo(-1.25,5.25);
  wingShape.lineTo(-2.55,5.75);wingShape.lineTo(-2.05,3.9);wingShape.lineTo(-3.15,4.45);
  wingShape.lineTo(-2.25,2.55);wingShape.lineTo(-3.0,2.9);wingShape.lineTo(-1.35,.5);wingShape.closePath();
  const wingGeo=new THREE.ShapeGeometry(wingShape,12);
  for(const side of [-1,1]){
    const griffin=new THREE.Group();griffin.position.set(facadeX+20,floorY,side*22.5);
    const plinth=new THREE.Mesh(new THREE.BoxGeometry(5.2,1,4.6),MAT.marbleLight);
    plinth.position.y=.5;griffin.add(plinth);
    const body=new THREE.Mesh(new THREE.SphereGeometry(1,20,16),goldBody);
    body.scale.set(1.95,1.2,1.05);body.position.set(-.15,3,0);griffin.add(body);
    const chest=new THREE.Mesh(new THREE.SphereGeometry(1,16,12),goldLight);
    chest.scale.set(.9,1.42,.86);chest.position.set(1.15,3.25,0);griffin.add(chest);
    const neck=new THREE.Mesh(new THREE.CylinderGeometry(.55,.78,2.1,12),goldBody);
    neck.rotation.z=-.38;neck.position.set(1.65,4.45,0);griffin.add(neck);
    const head=new THREE.Mesh(new THREE.SphereGeometry(1,16,12),goldLight);
    head.scale.set(.78,.85,.68);head.position.set(2.05,5.45,0);griffin.add(head);
    const beak=new THREE.Mesh(new THREE.ConeGeometry(.38,.9,6),goldBody);
    beak.rotation.z=-Math.PI/2;beak.position.set(2.88,5.34,0);griffin.add(beak);
    for(const eyeSide of [-1,1]){
      const eye=new THREE.Mesh(new THREE.SphereGeometry(.11,8,8),MAT.dark);
      eye.position.set(2.35,5.63,eyeSide*.57);griffin.add(eye);
      const ear=new THREE.Mesh(new THREE.ConeGeometry(.28,.9,5),goldLight);
      ear.position.set(1.85,6.15,eyeSide*.38);ear.rotation.z=-.35;griffin.add(ear);
    }
    for(const wingSide of [-1,1]){
      const wing=new THREE.Mesh(wingGeo,goldLight);
      wing.position.set(-.65,2.2,wingSide*.82);wing.rotation.y=wingSide*Math.PI/2;griffin.add(wing);
    }
    for(const xLeg of [-1.35,1])for(const zLeg of [-.62,.62]){
      const leg=new THREE.Mesh(new THREE.CylinderGeometry(.24,.32,1.85,10),goldBody);
      leg.position.set(xLeg,1.93,zLeg);griffin.add(leg);
      const paw=new THREE.Mesh(new THREE.SphereGeometry(.34,10,8),goldLight);
      paw.scale.set(1,.5,1.1);paw.position.set(xLeg,1.05,zLeg);griffin.add(paw);
    }
    const tail=new THREE.Mesh(new THREE.CylinderGeometry(.13,.22,2.7,8),goldBody);
    tail.position.set(-2.15,3.65,0);tail.rotation.z=-.68;griffin.add(tail);
    const tailTip=new THREE.Mesh(new THREE.ConeGeometry(.38,.9,6),goldLight);
    tailTip.position.set(-3,4.55,0);tailTip.rotation.z=-.7;griffin.add(tailTip);
    // From plinth to highest wing point: 30 ft / 9.144 m.
    griffin.scale.setScalar(9.144/7.95);
    scene.add(griffin);
  }
}

function makeFlutedColumnGeometry(radius,height,flutes=16){
  const radial=96,vertical=6,positions=[],indices=[];
  for(let j=0;j<=vertical;j++){
    const y=-height/2+height*j/vertical;
    for(let i=0;i<=radial;i++){
      const a=i/radial*Math.PI*2,r=radius*(1+.025*Math.cos(a*flutes));
      positions.push(Math.cos(a)*r,y,Math.sin(a)*r);
    }
  }
  for(let j=0;j<vertical;j++)for(let i=0;i<radial;i++){
    const a=j*(radial+1)+i,b=a+radial+1;
    indices.push(a,b,a+1,a+1,b,b+1);
  }
  const g=new THREE.BufferGeometry();
  g.setAttribute("position",new THREE.Float32BufferAttribute(positions,3));
  g.setIndex(indices);g.computeVertexNormals();return g;
}
function makeArchedPassageGeometry(width,height){
  const r=width/2,spring=height-r,shape=new THREE.Shape();
  shape.moveTo(-r,0);shape.lineTo(r,0);shape.lineTo(r,spring);
  shape.absarc(0,spring,r,0,Math.PI,false);shape.lineTo(-r,0);
  return new THREE.ShapeGeometry(shape,18);
}
// Side chambers are built behind every lower doorway, rather than leaving
// the open doors facing an unmodeled void inside the mountain.
const ENTRY_HALL_SIDE_ROOMS=[];
function entryHallSideRoomContains(x,z){
  return ENTRY_HALL_SIDE_ROOMS.some(room=>
    Math.abs(x-room.x)<=room.halfWidth &&
    (room.side<0 ? z<=-38.2 && z>=-room.backZ : z>=38.2 && z<=room.backZ)
  );
}
function buildEntryHall(){
  // [LIVRO: ERAGON] four-storey entrance passage; upper three tiers have arched
  // openings to curved gray passages; stout lower doors; fluted blood-red jasper
  // columns, statues of strange creatures, and rich tapestries.
  // [DERIVADO] one mile = 1,609.344 m.
  // [INTERPRETAÇÃO] width, floor heights, bay spacing and ornamental patterns.
  const startX=TRONJHEIM_GATE.doorX-5,endX=TRONJHEIM_GATE.hallEndX;
  const length=startX-endX,midX=(startX+endX)/2,floorY=ENTRY_HALL_FLOOR,halfWidth=36,height=76;
  const jasper=new THREE.MeshStandardMaterial({color:0x69232d,roughness:.34,metalness:.08});
  const jasperShadow=new THREE.MeshStandardMaterial({color:0x3f1820,roughness:.48,metalness:.08});
  const onyx=new THREE.MeshStandardMaterial({color:0x090b10,roughness:.24,metalness:.12});
  const timber=new THREE.MeshStandardMaterial({color:0x2b1d16,roughness:.79});
  const tapestries=[
    new THREE.MeshStandardMaterial({color:0x64252b,roughness:.9,side:THREE.DoubleSide}),
    new THREE.MeshStandardMaterial({color:0x263d46,roughness:.9,side:THREE.DoubleSide}),
    new THREE.MeshStandardMaterial({color:0x71603c,roughness:.92,side:THREE.DoubleSide})
  ];
  const carvedStone=new THREE.MeshStandardMaterial({color:0xb9b8b0,roughness:.82});
  const gold=new THREE.MeshStandardMaterial({color:0x9d7b43,metalness:.72,roughness:.32});

  const floor=new THREE.Mesh(new THREE.BoxGeometry(length,2.2,80),MAT.marbleLight);
  floor.position.set(midX,floorY-1.12,0);floor.receiveShadow=true;scene.add(floor);
  const roof=new THREE.Mesh(new THREE.BoxGeometry(length,3.2,82),MAT.marble);
  roof.position.set(midX,floorY+height+1.6,0);roof.receiveShadow=true;scene.add(roof);
  const underside=new THREE.Mesh(new THREE.BoxGeometry(length-2,.6,78),MAT.dark);
  underside.position.set(midX,floorY+height-.2,0);scene.add(underside);

  // Continuous side enclosure: the entrance hall is a real stone corridor,
  // not a row of isolated columns. Door bays are deliberately left as apertures.
  const sideWallMat=new THREE.MeshStandardMaterial({color:0xc9c8c1,roughness:.52,metalness:.025});
  for(const sideZ of [-40,40]){
    let cursor=startX;
    for(let doorX=startX-120;doorX>endX+65;doorX-=220){
      const right=doorX+9.8,left=doorX-9.8;
      if(cursor>right){
        const segment=new THREE.Mesh(new THREE.BoxGeometry(cursor-right,height,2.4),sideWallMat);
        segment.position.set((cursor+right)/2,floorY+height/2,sideZ);segment.receiveShadow=true;scene.add(segment);
      }
      const header=new THREE.Mesh(new THREE.BoxGeometry(19.6,height-14,2.4),sideWallMat);
      header.position.set(doorX,floorY+14+(height-14)/2,sideZ);scene.add(header);
      for(const edgeX of [doorX-9.8,doorX+9.8]){
        const jamb=new THREE.Mesh(new THREE.BoxGeometry(1.5,14,3.1),MAT.marbleLight);
        jamb.position.set(edgeX,floorY+7,sideZ);scene.add(jamb);
      }
      cursor=left;
    }
    if(cursor>endX){
      const segment=new THREE.Mesh(new THREE.BoxGeometry(cursor-endX,height,2.4),sideWallMat);
      segment.position.set((cursor+endX)/2,floorY+height/2,sideZ);segment.receiveShadow=true;scene.add(segment);
    }
  }

  const galleryLevels=[18,36,54];
  for(const level of galleryLevels)for(const side of [-1,1]){
    const gallery=new THREE.Mesh(new THREE.BoxGeometry(length,2.2,15),MAT.marbleLight);
    gallery.position.set(midX,floorY+level,side*35);gallery.receiveShadow=true;scene.add(gallery);
    const rail=new THREE.Mesh(new THREE.BoxGeometry(length,1.25,.55),gold);
    rail.position.set(midX,floorY+level+1.8,side*42);scene.add(rail);
    for(let x=startX-30;x>endX+20;x-=42){
      const bal=new THREE.Mesh(new THREE.BoxGeometry(.32,1.2,.32),MAT.marbleLight);
      bal.position.set(x,floorY+level+1.15,side*42);scene.add(bal);
    }
  }

  // Carved red-jasper columns with 18 vertical flutes, continuous through four levels.
  const columnGeo=makeFlutedColumnGeometry(3.05,72,18);
  const baseGeo=new THREE.TorusGeometry(3.75,.55,8,24),capGeo=new THREE.TorusGeometry(3.8,.65,8,24);
  for(let x=startX-36;x>endX+34;x-=92)for(const side of [-1,1]){
    const z=side*31.2;
    const shaft=new THREE.Mesh(columnGeo,jasper);shaft.position.set(x,floorY+36,z);shaft.castShadow=true;scene.add(shaft);
    const base=new THREE.Mesh(baseGeo,jasperShadow);base.rotation.x=Math.PI/2;base.position.set(x,floorY+1.1,z);scene.add(base);
    const cap=new THREE.Mesh(capGeo,jasperShadow);cap.rotation.x=Math.PI/2;cap.position.set(x,floorY+71.1,z);scene.add(cap);
    const abacus=new THREE.Mesh(new THREE.BoxGeometry(9,1.5,8),MAT.marbleLight);
    abacus.position.set(x,floorY+72.2,z);scene.add(abacus);
  }

  // Arched openings to the side passages on each of the three upper stories.
  const archGeo=new THREE.TorusGeometry(10.6,1.15,8,32,Math.PI);
  const passageGeo=makeArchedPassageGeometry(19.5,17.2);
  for(let x=startX-90;x>endX+50;x-=184)for(const side of [-1,1])for(const level of galleryLevels){
    const back=new THREE.Mesh(passageGeo,MAT.dark);
    back.position.set(x,floorY+level+2,side*29.7);if(side===1)back.rotation.y=Math.PI;scene.add(back);
    const arch=new THREE.Mesh(archGeo,jasperShadow);
    arch.position.set(x,floorY+level+8,side*30);if(side===1)arch.rotation.y=Math.PI;scene.add(arch);
    const sill=new THREE.Mesh(new THREE.BoxGeometry(22,1.2,2),MAT.marbleLight);
    sill.position.set(x,floorY+level+1.8,side*30.1);scene.add(sill);
  }

  // Lower level: massive timber doors in the side walls.
  for(let x=startX-120;x>endX+65;x-=220)for(const side of [-1,1]){
    // Open double leaves are hinged at the jamb, not floating across the passage.
    const doorGroup=new THREE.Group();
    doorGroup.position.set(x-8.5,floorY,side*39.0);
    doorGroup.rotation.y=side*1.12;
    for(const leafX of [4.25,12.75]){
      const leaf=new THREE.Mesh(new THREE.BoxGeometry(8.5,13,1.0),timber);
      leaf.position.set(leafX,6.5,0);doorGroup.add(leaf);
      for(const yy of [3.5,9.8]){
        const strap=new THREE.Mesh(new THREE.BoxGeometry(8.0,.42,1.2),gold);
        strap.position.set(leafX,yy,.58);doorGroup.add(strap);
      }
    }
    scene.add(doorGroup);
    const threshold=new THREE.Mesh(new THREE.BoxGeometry(19.6,.24,3.2),MAT.marbleLight);
    threshold.position.set(x,floorY+.02,side*40);scene.add(threshold);

    // A complete room is carved into the mountain behind this doorway.
    const roomWidth=62,roomDepth=60,roomHeight=17,roomCenterZ=side*(40+roomDepth/2);
    ENTRY_HALL_SIDE_ROOMS.push({x,side,halfWidth:roomWidth/2,backZ:40+roomDepth});
    const roomStone=new THREE.MeshStandardMaterial({color:0xbfc0bb,roughness:.62,metalness:.025});
    const roomDark=new THREE.MeshStandardMaterial({color:0x55575a,roughness:.8});
    const roomLampMat=new THREE.MeshStandardMaterial({color:0xffd9a5,emissive:0xffb85f,emissiveIntensity:2.0,roughness:.24});
    const roomFloor=new THREE.Mesh(new THREE.BoxGeometry(roomWidth,1.25,roomDepth),MAT.marbleLight);
    roomFloor.position.set(x,floorY-.62,roomCenterZ);roomFloor.receiveShadow=true;scene.add(roomFloor);
    const roomRoof=new THREE.Mesh(new THREE.BoxGeometry(roomWidth,1.1,roomDepth),MAT.marble);
    roomRoof.position.set(x,floorY+roomHeight+.55,roomCenterZ);roomRoof.receiveShadow=true;scene.add(roomRoof);
    for(const endSide of [-1,1]){
      const sideWall=new THREE.Mesh(new THREE.BoxGeometry(1.5,roomHeight,roomDepth),roomStone);
      sideWall.position.set(x+endSide*(roomWidth/2),floorY+roomHeight/2,roomCenterZ);
      sideWall.receiveShadow=true;scene.add(sideWall);
      const pilaster=new THREE.Mesh(new THREE.BoxGeometry(2.1,roomHeight,2.2),jasper);
      pilaster.position.set(x+endSide*(roomWidth/2-2.0),floorY+roomHeight/2,roomCenterZ-side*17);
      scene.add(pilaster);
    }
    const backWall=new THREE.Mesh(new THREE.BoxGeometry(roomWidth,roomHeight,1.6),roomStone);
    backWall.position.set(x,floorY+roomHeight/2,side*(40+roomDepth));
    backWall.receiveShadow=true;scene.add(backWall);
    // Storage plinths and a central worktable make the rooms read as occupied
    // mountain interiors, not empty boxes beyond the doorway.
    const plinth=new THREE.Mesh(new THREE.BoxGeometry(12,1.1,7),roomDark);
    plinth.position.set(x,floorY+.55,roomCenterZ+side*10);scene.add(plinth);
    const table=new THREE.Mesh(new THREE.BoxGeometry(8,1.4,4),MAT.marbleLight);
    table.position.set(x,floorY+1.35,roomCenterZ-side*4);scene.add(table);
    for(const lampSide of [-1,1]){
      const mount=new THREE.Mesh(new THREE.BoxGeometry(.7,1.5,.7),gold);
      mount.position.set(x+lampSide*25,floorY+7,roomCenterZ);scene.add(mount);
      const flame=new THREE.Mesh(new THREE.SphereGeometry(.65,10,8),roomLampMat);
      flame.position.set(x+lampSide*25,floorY+8,roomCenterZ);scene.add(flame);
      const light=new THREE.PointLight(0xffc986,16,28,2);
      light.position.copy(flame.position);scene.add(light);
    }
  }

  // Tapestries between the storeys.
  let ti=0;
  for(let x=startX-170;x>endX+90;x-=276)for(const side of [-1,1])for(const level of [7,25,43]){
    const cloth=new THREE.Mesh(new THREE.PlaneGeometry(13,10.5),tapestries[ti++%tapestries.length]);
    cloth.position.set(x,floorY+level+5.2,side*29.2);if(side===1)cloth.rotation.y=Math.PI;scene.add(cloth);
    const rod=new THREE.Mesh(new THREE.CylinderGeometry(.18,.18,14,8),gold);
    rod.rotation.z=Math.PI/2;rod.position.set(x,floorY+level+10.8,side*29.1);scene.add(rod);
    const weight=new THREE.Mesh(new THREE.BoxGeometry(12.5,.5,.35),gold);
    weight.position.set(x,floorY+level-.2,side*29.1);scene.add(weight);
  }

  // Warm wall lanterns illuminate the four-storey hall; emissive meshes alone
  // do not cast light, so each fixture receives a real non-shadow-casting light.
  const hallLampGeo=new THREE.SphereGeometry(1.55,10,8);
  const hallLampMat=new THREE.MeshStandardMaterial({color:0xffd9a5,emissive:0xffb85f,emissiveIntensity:2.1,roughness:.24});
  for(let i=0,x=startX-55;x>endX+35;x-=125,i++){
    const side=i%2===0?-1:1;
    const sconce=new THREE.Mesh(new THREE.BoxGeometry(1.6,2.1,.8),gold);
    sconce.position.set(x,floorY+21,side*38.2);scene.add(sconce);
    const lamp=new THREE.Mesh(hallLampGeo,hallLampMat);
    lamp.position.set(x,floorY+21,side*37.1);scene.add(lamp);
    const glow=new THREE.PointLight(0xffc986,82,155,2);
    glow.position.set(x,floorY+21,side*34.0);scene.add(glow);
  }

  // [INTERPRETAÇÃO] generalized creature silhouettes; the text does not identify species.
  for(let x=startX-260;x>endX+100;x-=390)for(const side of [-1,1]){
    const statue=new THREE.Group();statue.position.set(x,floorY,side*23.3);
    const pedestal=new THREE.Mesh(new THREE.BoxGeometry(4.2,2.4,4.2),MAT.marbleLight);
    pedestal.position.y=1.2;statue.add(pedestal);
    const torso=new THREE.Mesh(new THREE.SphereGeometry(1,12,10),carvedStone);
    torso.scale.set(.95,1.8,.82);torso.position.y=3.6;statue.add(torso);
    const head=new THREE.Mesh(new THREE.SphereGeometry(.72,10,8),carvedStone);
    head.position.set(.2,5.25,0);statue.add(head);
    for(const hornSide of [-1,1]){
      const horn=new THREE.Mesh(new THREE.ConeGeometry(.25,1.9,6),carvedStone);
      horn.position.set(.1,6.4,hornSide*.48);horn.rotation.z=-.28;statue.add(horn);
      const limb=new THREE.Mesh(new THREE.ConeGeometry(.34,2.3,6),carvedStone);
      limb.position.set(-.65,3.9,hornSide*1.05);limb.rotation.z=.9;statue.add(limb);
    }
    scene.add(statue);
  }

  // Cross-beams and the terminal arch with black onyx pillars and yellow zircons.
  for(let x=startX-75;x>endX+30;x-=150){
    const beam=new THREE.Mesh(new THREE.BoxGeometry(4.2,2.7,76),MAT.marbleLight);
    beam.position.set(x,floorY+height-4.5,0);scene.add(beam);
  }
  const terminalX=endX+8;
  const terminalArch=new THREE.Mesh(new THREE.TorusGeometry(28,2.3,12,64,Math.PI),MAT.marbleLight);
  terminalArch.position.set(terminalX,floorY+28,0);terminalArch.rotation.y=Math.PI/2;scene.add(terminalArch);
  const zirconMat=new THREE.MeshStandardMaterial({color:0xdab943,emissive:0x6b4c0c,emissiveIntensity:.16,metalness:.22,roughness:.2});
  for(const side of [-1,1]){
    const pillar=new THREE.Mesh(new THREE.CylinderGeometry(4.2,4.8,30,12),onyx);
    pillar.position.set(terminalX,floorY+15,side*27);scene.add(pillar);
    const base=new THREE.Mesh(new THREE.CylinderGeometry(5.7,5.7,2.1,12),MAT.marbleLight);
    base.position.set(terminalX,floorY+1.1,side*27);scene.add(base);
    const cap=new THREE.Mesh(new THREE.BoxGeometry(8.8,2.2,8.8),onyx);
    cap.position.set(terminalX,floorY+31,side*27);scene.add(cap);
    const zircon=new THREE.Mesh(new THREE.OctahedronGeometry(3,1),zirconMat);
    zircon.position.set(terminalX,floorY+35,side*27);zircon.scale.set(1,1.25,1);scene.add(zircon);
  }
}

function buildPath(){
  const start=7800,end=cityRadius(0)+12,width=44,segmentLength=90;
  const cobbleMat=new THREE.MeshStandardMaterial({color:0x96999a,roughness:.92});
  const totalSegments=Math.ceil((start-end)/segmentLength);
  for(let i=0;i<totalSegments;i++){
    const rightX=start-i*segmentLength;
    const leftX=Math.max(end,rightX-segmentLength);
    const len=rightX-leftX,midX=(rightX+leftX)/2;
    const hRight=terrainHeightAnalytic(rightX,0),hLeft=terrainHeightAnalytic(leftX,0);
    const bed=new THREE.Mesh(new THREE.BoxGeometry(len+.8,1.5,width+14),MAT.path);
    bed.position.set(midX,(hRight+hLeft)/2-.75,0);
    bed.rotation.z=Math.atan2(hRight-hLeft,len);
    bed.receiveShadow=true;scene.add(bed);
  }
  const geo=new THREE.BoxGeometry(5,1.2,5.8),total=1900;
  const stones=new THREE.InstancedMesh(geo,cobbleMat,total),dummy=new THREE.Object3D();
  for(let i=0;i<total;i++){
    const x=start-Math.random()*(start-end),z=(Math.random()-.5)*width;
    dummy.position.set(x,terrainHeightAnalytic(x,z)+.58,z);
    dummy.rotation.set((Math.random()-.5)*.08,Math.random()*Math.PI,(Math.random()-.5)*.08);
    dummy.scale.set(.55+Math.random()*.8,.65+Math.random()*.45,.55+Math.random()*.8);
    dummy.updateMatrix();stones.setMatrixAt(i,dummy.matrix);
  }
  stones.instanceMatrix.needsUpdate=true;scene.add(stones);
  const postGeo=new THREE.CylinderGeometry(1.3,2,8,8),lampGeo=new THREE.SphereGeometry(2.5,8,8);
  for(let x=start-80;x>end+100;x-=250)for(const side of [-1,1]){
    const z=side*(width/2+12),gy=terrainHeightAnalytic(x,z);
    const post=new THREE.Mesh(postGeo,MAT.gold);post.position.set(x,gy+4,z);scene.add(post);
    const lamp=new THREE.Mesh(lampGeo,MAT.lantern);lamp.position.set(x,gy+8.5,z);scene.add(lamp);
  }
}
function buildOuterLanterns(){
  // Distant points of light in the facade; not all upper levels are assumed occupied.
  const g=new THREE.SphereGeometry(3.5,8,6),m=new THREE.MeshBasicMaterial({color:0xf0bd70});
  const inst=new THREE.InstancedMesh(g,m,230),o=new THREE.Object3D();let n=0;
  for(let row=0;row<10;row++){const t=.1+row*.075,r=cityRadius(t)+4,y=-8+t*CITY.height;const count=Math.floor(2*Math.PI*r/175);
    for(let i=0;i<count&&n<230;i+=2){const a=i/count*Math.PI*2;o.position.set(Math.cos(a)*r,y,Math.sin(a)*r);o.scale.setScalar(.6+hash(i,row)*.7);o.updateMatrix();inst.setMatrixAt(n++,o.matrix);}}
  inst.count=n;inst.instanceMatrix.needsUpdate=true;scene.add(inst);
}
buildCity();

