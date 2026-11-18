// ============================================================================
// TRONJHEIM — FASE 12: MATERIAIS PBR E RELEVO DE SUPERFÍCIE
// Texturas procedurais tileáveis, mapas de altura/normal/roughness e
// alvenaria de escala arquitetônica. Não usa texturas externas ou placeholders.
// ============================================================================

(function buildTronjheimPBRPass(){
  const size=512;
  const anisotropy=Math.min(renderer.capabilities.getMaxAnisotropy(),16);
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  const smooth=t=>t*t*(3-2*t);

  function random(seed){
    let state=seed>>>0;
    return ()=>{state=(state*1664525+1013904223)>>>0;return state/4294967296;};
  }
  function makeNoiseGrid(w,h,rng){
    const values=new Float32Array(w*h);
    for(let i=0;i<values.length;i++)values[i]=rng()*2-1;
    return {w,h,values};
  }
  function noiseAt(grid,u,v){
    const x=u*grid.w,y=v*grid.h,ix=Math.floor(x),iy=Math.floor(y);
    const fx=smooth(x-ix),fy=smooth(y-iy);
    const wrap=(n,m)=>(n%m+m)%m;
    const at=(px,py)=>grid.values[wrap(py,grid.h)*grid.w+wrap(px,grid.w)];
    return THREE.MathUtils.lerp(
      THREE.MathUtils.lerp(at(ix,iy),at(ix+1,iy),fx),
      THREE.MathUtils.lerp(at(ix,iy+1),at(ix+1,iy+1),fx),fy
    );
  }
  function canvasTexture(imageData,colorSpace=false){
    const canvas=document.createElement("canvas");
    canvas.width=size;canvas.height=size;
    canvas.getContext("2d").putImageData(imageData,0,0);
    const texture=new THREE.CanvasTexture(canvas);
    texture.wrapS=texture.wrapT=THREE.RepeatWrapping;
    texture.repeat.set(3.5,3.5);
    texture.anisotropy=anisotropy;
    texture.generateMipmaps=true;
    texture.minFilter=THREE.LinearMipmapLinearFilter;
    texture.magFilter=THREE.LinearFilter;
    if(colorSpace)texture.colorSpace=THREE.SRGBColorSpace;
    texture.needsUpdate=true;
    return texture;
  }

  const families=["marble","limestone","granite","darkRock","slate","jasper","wood","metal","leather"];
  const textures={};
  for(let familyIndex=0;familyIndex<families.length;familyIndex++){
    const family=families[familyIndex],rng=random(8031+familyIndex*7919);
    const grids=[
      makeNoiseGrid(32,32,rng),makeNoiseGrid(96,96,rng),
      makeNoiseGrid(256,256,rng)
    ];
    const colorData=new ImageData(size,size);
    const heightData=new ImageData(size,size);
    const roughData=new ImageData(size,size);
    const baseHeights=new Uint8Array(size*size);

    for(let y=0;y<size;y++){
      const v=y/size;
      for(let x=0;x<size;x++){
        const u=x/size,index=y*size+x,p=index*4;
        const broad=noiseAt(grids[0],u,v),medium=noiseAt(grids[1],u,v),fine=noiseAt(grids[2],u,v);
        const warp=broad*.035+medium*.012;
        let grain=broad*.50+medium*.34+fine*.16;
        let vein=0,strata=0,pores=0,pattern=0;

        if(family==="marble"){
          const line=Math.sin((v+warp+Math.sin(u*8)*.002)*Math.PI*2*5.2+u*3.6);
          vein=Math.pow(Math.max(0,1-Math.abs(line)),10);
          vein=Math.max(vein,Math.pow(Math.max(0,1-Math.abs(Math.sin((v+warp*.7)*Math.PI*2*13+u*1.8))),17)*.35);
          pattern=vein;
        }else if(family==="limestone"){
          const line=Math.sin((v+warp*1.2)*Math.PI*2*15+Math.sin(u*11)*.15);
          strata=Math.pow(Math.max(0,1-Math.abs(line)),12);
          pores=Math.pow(Math.max(0,fine-.48),3)*.12;
          pattern=strata*.6+pores;
        }else if(family==="granite"){
          pores=Math.pow(Math.max(0,fine-.2),2)*.32;
          pattern=pores+Math.pow(Math.max(0,medium-.52),3)*.12;
        }else if(family==="darkRock"){
          const crack=Math.sin((u*.7+v+warp*.8)*Math.PI*2*9+medium*.7);
          vein=Math.pow(Math.max(0,1-Math.abs(crack)),16)*.7;
          pattern=vein+Math.pow(Math.max(0,fine-.36),2)*.2;
        }else if(family==="slate"){
          const line=Math.sin((v+warp*.65)*Math.PI*2*22+Math.sin(u*9)*.09);
          strata=Math.pow(Math.max(0,1-Math.abs(line)),13);
          pattern=strata*.7+Math.pow(Math.max(0,fine-.45),2)*.1;
        }else if(family==="jasper"){
          const line=Math.sin((u*.8+v+warp)*Math.PI*2*7+medium*.25);
          vein=Math.pow(Math.max(0,1-Math.abs(line)),14);
          pattern=vein*.8+Math.pow(Math.max(0,fine-.52),3)*.12;
        }else if(family==="wood"){
          const grainLine=Math.sin((v*190+warp*24+Math.sin(u*10)*.18)*Math.PI*2);
          strata=Math.pow(Math.max(0,1-Math.abs(grainLine)),8);
          const knot=Math.exp(-Math.pow((u-(.22+.56*noiseAt(grids[0],u*.15,v*.15)))*18,2)-
                              Math.pow((v-(.3+.35*noiseAt(grids[1],u*.1,v*.1)))*13,2));
          pattern=strata*.35+knot*.45;
        }else if(family==="metal"){
          const brush=Math.sin((v*580+medium*5+fine*.3)*Math.PI*2);
          pattern=Math.abs(brush)*.12+Math.abs(fine)*.06;
        }else if(family==="leather"){
          pores=Math.pow(Math.max(0,fine*.5+medium*.5-.05),2)*.22;
          const crease=Math.pow(Math.max(0,Math.sin((u*.35+v+warp)*Math.PI*2*4)),18)*.18;
          pattern=pores+crease;
        }

        const heightValue=clamp(128+grain*(family==="marble"?11:family==="wood"?17:26)+
          pattern*(family==="marble"?34:family==="wood"?23:42)-strata*12,0,255);
        baseHeights[index]=heightValue;

        let shade=family==="marble"?249:
          family==="limestone"?241:
          family==="granite"?236:
          family==="darkRock"?231:
          family==="slate"?238:
          family==="jasper"?242:
          family==="wood"?239:
          family==="metal"?246:238;
        shade+=grain*(family==="marble"?7:family==="wood"?12:17)-pattern*(family==="marble"?37:family==="metal"?4:24);
        shade=clamp(shade,0,255);
        let r=shade,g=shade,b=shade;

        if(family==="marble"){r=shade+1;g=shade;b=shade-2;}
        if(family==="limestone"){r=shade+1;g=shade;b=shade-3;}
        if(family==="granite"){r=shade+2;g=shade+1;b=shade-1;}
        if(family==="darkRock"){r=shade+2;g=shade+1;b=shade-1;}
        if(family==="slate"){r=shade-2;g=shade;b=shade+4;}
        if(family==="jasper"){r=shade+3;g=shade-3;b=shade-4;}
        if(family==="wood"){r=shade+4;g=shade;b=shade-4;}
        if(family==="metal"){r=shade+1;g=shade+1;b=shade;}
        if(family==="leather"){r=shade+2;g=shade;b=shade-3;}
        colorData.data[p]=clamp(r,0,255);
        colorData.data[p+1]=clamp(g,0,255);
        colorData.data[p+2]=clamp(b,0,255);
        colorData.data[p+3]=255;

        heightData.data[p]=heightData.data[p+1]=heightData.data[p+2]=heightValue;
        heightData.data[p+3]=255;

        const roughBase=family==="marble"?184:
          family==="metal"?116:
          family==="wood"?205:
          family==="leather"?224:
          family==="granite"?238:
          family==="slate"?222:232;
        const roughValue=clamp(roughBase+grain*27+pattern*(family==="metal"?-18:16),0,255);
        roughData.data[p]=roughData.data[p+1]=roughData.data[p+2]=roughValue;
        roughData.data[p+3]=255;
      }
    }

    const normalData=new ImageData(size,size);
    for(let y=0;y<size;y++)for(let x=0;x<size;x++){
      const left=baseHeights[y*size+(x+size-1)%size];
      const right=baseHeights[y*size+(x+1)%size];
      const up=baseHeights[((y+size-1)%size)*size+x];
      const down=baseHeights[((y+1)%size)*size+x];
      const nx=clamp(128-(right-left)*.9,0,255);
      const ny=clamp(128-(down-up)*.9,0,255);
      const p=(y*size+x)*4;
      normalData.data[p]=nx;normalData.data[p+1]=ny;
      normalData.data[p+2]=250;normalData.data[p+3]=255;
    }

    textures[family]={
      color:canvasTexture(colorData,true),
      height:canvasTexture(heightData,false),
      roughness:canvasTexture(roughData,false),
      normal:canvasTexture(normalData,false)
    };
  }

  function materialFamily(material){
    if(material===MAT.marble||material===MAT.marbleLight)return "marble";
    const color=material.color||new THREE.Color(0xaaaaaa);
    const hsl=color.getHSL({});
    const rough=material.roughness??.8,metal=material.metalness??0;
    if(metal>.5)return "metal";
    if(rough>.97&&hsl.l<.42)return "darkRock";
    if(hsl.s>.22&&(hsl.h<.025||hsl.h>.965))return "jasper";
    if(hsl.h>.54&&hsl.h<.73&&hsl.s>.08)return "slate";
    if(hsl.h>.035&&hsl.h<.14&&hsl.s>.13)
      return rough>.93&&hsl.l<.38?"leather":"wood";
    if(rough>.92&&hsl.l<.30)return "darkRock";
    if(rough>.91&&hsl.s<.18&&hsl.l<.64)return "granite";
    if(rough>.88&&hsl.l<.45)return "darkRock";
    return "limestone";
  }

  function ensurePlanarUV(geometry){
    if(!geometry||geometry.attributes.uv||!geometry.attributes.position)return false;
    if(!geometry.attributes.normal)geometry.computeVertexNormals();
    const pos=geometry.attributes.position,norm=geometry.attributes.normal;
    const uv=new Float32Array(pos.count*2);
    for(let i=0;i<pos.count;i++){
      const x=pos.getX(i),y=pos.getY(i),z=pos.getZ(i);
      const nx=Math.abs(norm.getX(i)),ny=Math.abs(norm.getY(i)),nz=Math.abs(norm.getZ(i));
      let u,v;
      if(ny>=nx&&ny>=nz){u=x/7.5;v=z/7.5;}
      else if(nx>=nz){u=z/7.5;v=y/7.5;}
      else{u=x/7.5;v=y/7.5;}
      uv[i*2]=u;uv[i*2+1]=v;
    }
    geometry.setAttribute("uv",new THREE.BufferAttribute(uv,2));
    return true;
  }

  const smoothGeometryCache=new Map();
  function smoothLateGeometry(source){
    if(!source||!source.parameters)return source;
    if(smoothGeometryCache.has(source.uuid))return smoothGeometryCache.get(source.uuid);
    const p=source.parameters;
    let result=source;
    if(source.type==="BoxGeometry"){
      const min=Math.min(p.width,p.height,p.depth),max=Math.max(p.width,p.height,p.depth);
      if(min>=.26&&max<=180){
        const bevel=Math.min(.065,min*.13);
        const shape=new THREE.Shape();
        const w=p.width-bevel*1.3,h=p.height-bevel*1.3;
        shape.moveTo(-w/2,-h/2);shape.lineTo(w/2,-h/2);
        shape.lineTo(w/2,h/2);shape.lineTo(-w/2,h/2);shape.closePath();
        const core=Math.max(.02,p.depth-2*bevel);
        result=new THREE.ExtrudeGeometry(shape,{
          depth:core,steps:1,bevelEnabled:true,bevelSegments:3,
          bevelSize:bevel*.65,bevelThickness:bevel,curveSegments:3
        });
        result.translate(0,0,-core/2);result.computeVertexNormals();
      }
    }else if(source.type==="CylinderGeometry"&&p.radialSegments<28){
      result=new THREE.CylinderGeometry(p.radiusTop,p.radiusBottom,p.height,36,
        Math.max(2,p.heightSegments||1),p.openEnded,p.thetaStart,p.thetaLength);
    }else if(source.type==="ConeGeometry"&&p.radialSegments<28){
      result=new THREE.ConeGeometry(p.radius,p.height,36,
        Math.max(2,p.heightSegments||1),p.openEnded,p.thetaStart,p.thetaLength);
    }else if(source.type==="SphereGeometry"&&p.widthSegments<32){
      result=new THREE.SphereGeometry(p.radius,48,32,p.phiStart,p.phiLength,p.thetaStart,p.thetaLength);
    }else if(source.type==="TorusGeometry"&&(p.radialSegments<24||p.tubularSegments<72)){
      result=new THREE.TorusGeometry(p.radius,p.tube,24,96,p.arc);
    }
    smoothGeometryCache.set(source.uuid,result);
    return result;
  }

  let materialCount=0,geometryUVCount=0;
  const seen=new WeakSet(),seenGeometries=new WeakSet();
  scene.traverse(object=>{
    if(!object.isMesh)return;
    object.geometry=smoothLateGeometry(object.geometry);
    if(object.geometry&&!seenGeometries.has(object.geometry)){
      if(ensurePlanarUV(object.geometry))geometryUVCount++;
      seenGeometries.add(object.geometry);
    }
    const materials=Array.isArray(object.material)?object.material:[object.material];
    for(const material of materials){
      if(!material||!material.isMeshStandardMaterial||seen.has(material))continue;
      // Keep glass, water and emissive lamps clean; their transparency and
      // glow should not be dirtied by opaque stone surface maps.
      if(material.transparent||(material.opacity??1)<.96||(material.emissiveIntensity??0)>.75)continue;
      seen.add(material);
      const family=materialFamily(material),set=textures[family];
      if(!material.map||material.map.userData?.tronjheimGenericDetail)material.map=set.color;
      if(!material.bumpMap||material.bumpMap.userData?.tronjheimGenericDetail){
        material.bumpMap=set.height;
        material.bumpScale=family==="marble"?.018:
          family==="wood"?.042:
          family==="metal"?.009:
          family==="darkRock"?.075:.048;
      }
      if(!material.roughnessMap||material.roughnessMap.userData?.tronjheimGenericDetail)
        material.roughnessMap=set.roughness;
      if(!material.normalMap){
        material.normalMap=set.normal;
        material.normalScale.set(family==="marble"?.28:family==="metal"?.12:.36,
                                 family==="marble"?.28:family==="metal"?.12:.36);
      }
      material.envMapIntensity=Math.max(material.envMapIntensity||0,.52);
      material.needsUpdate=true;
      materialCount++;
    }
  });

  function makeStoneMasonry(cx,cz,radius,baseY,height,segments,courses,doorAngles,seed){
    const positions=[],uvs=[],colors=[],indices=[];
    const rng=random(seed),stoneTones=[
      new THREE.Color(0xb3b2aa),new THREE.Color(0xc1bfb6),
      new THREE.Color(0xa9aaa5),new THREE.Color(0xbab8ae)
    ];
    function pushVertex(x,y,z,color,u,v){
      positions.push(x,y,z);colors.push(color.r,color.g,color.b);uvs.push(u,v);
    }
    function quad(vertices,color,u0,v0,u1,v1){
      const start=positions.length/3;
      for(let i=0;i<vertices.length;i++){
        const uv=[[u0,v0],[u1,v0],[u1,v1],[u0,v1]][i]||[u0,v0];
        pushVertex(vertices[i][0],vertices[i][1],vertices[i][2],color,uv[0],uv[1]);
      }
      indices.push(start,start+1,start+2,start,start+2,start+3);
    }
    for(let row=0;row<courses;row++){
      const y0=baseY+row*(height/courses)+.065;
      const y1=baseY+(row+1)*(height/courses)-.065;
      for(let col=0;col<segments;col++){
        const a0=col/segments*Math.PI*2+(row%2)*Math.PI/segments;
        const a1=(col+1)/segments*Math.PI*2+(row%2)*Math.PI/segments;
        const mid=(a0+a1)/2;
        if(doorAngles.some(angle=>Math.abs(Math.atan2(Math.sin(mid-angle),Math.cos(mid-angle)))<.29))continue;
        const angleMargin=.008+rng()*.009;
        const a=a0+angleMargin,b=a1-angleMargin;
        const radialJitter=(rng()-.5)*.12,front=radius+.07+radialJitter;
        const inner=radius-.19+radialJitter*.3;
        const yJitter=(rng()-.5)*.045;
        const top=y1+yJitter,bottom=y0+yJitter;
        const stone=stoneTones[Math.floor(rng()*stoneTones.length)].clone();
        stone.multiplyScalar(.94+rng()*.12);
        const bulge=.035+rng()*.065;
        const corners=[
          [Math.cos(a)*front,bottom,Math.sin(a)*front],
          [Math.cos(b)*front,bottom,Math.sin(b)*front],
          [Math.cos(b)*front,top,Math.sin(b)*front],
          [Math.cos(a)*front,top,Math.sin(a)*front]
        ];
        const centerAngle=(a+b)/2,centerRadius=front+bulge;
        const center=[Math.cos(centerAngle)*centerRadius,(bottom+top)/2,Math.sin(centerAngle)*centerRadius];
        const baseIndex=positions.length/3;
        for(let i=0;i<4;i++)pushVertex(corners[i][0],corners[i][1],corners[i][2],stone,
          (i===0||i===3)?a/(Math.PI*2):b/(Math.PI*2),(i<2?bottom:top)/8);
        pushVertex(center[0],center[1],center[2],stone,centerAngle/(Math.PI*2),(bottom+top)/16);
        indices.push(baseIndex,baseIndex+1,baseIndex+4,
                     baseIndex+1,baseIndex+2,baseIndex+4,
                     baseIndex+2,baseIndex+3,baseIndex+4,
                     baseIndex+3,baseIndex,baseIndex+4);
        const innerCorners=corners.map(p=>[p[0]*inner/front,p[1],p[2]*inner/front]);
        for(let i=0;i<4;i++){
          const next=(i+1)%4,idx=positions.length/3;
          pushVertex(...corners[i],stone,a/(Math.PI*2),bottom/8);
          pushVertex(...corners[next],stone,b/(Math.PI*2),top/8);
          pushVertex(...innerCorners[next],stone,b/(Math.PI*2),top/8);
          pushVertex(...innerCorners[i],stone,a/(Math.PI*2),bottom/8);
          indices.push(idx,idx+1,idx+2,idx,idx+2,idx+3);
        }
      }
    }
    const geometry=new THREE.BufferGeometry();
    geometry.setAttribute("position",new THREE.Float32BufferAttribute(positions,3));
    geometry.setAttribute("color",new THREE.Float32BufferAttribute(colors,3));
    geometry.setAttribute("uv",new THREE.Float32BufferAttribute(uvs,2));
    geometry.setIndex(indices);geometry.computeVertexNormals();
    const material=new THREE.MeshStandardMaterial({
      color:0xffffff,map:textures.limestone.color,bumpMap:textures.limestone.height,
      bumpScale:.055,roughness:.93,roughnessMap:textures.limestone.roughness,
      normalMap:textures.limestone.normal,normalScale:new THREE.Vector2(.32,.32),
      vertexColors:true,side:THREE.DoubleSide
    });
    const mesh=new THREE.Mesh(geometry,material);
    mesh.position.set(cx,0,cz);mesh.castShadow=true;mesh.receiveShadow=true;scene.add(mesh);
    return mesh;
  }

  // Five courses of individually chamfer-like stone relief unify the outer
  // cylindrical buildings without covering their actual door openings.
  const council=makeStoneMasonry(
    COUNCIL_ROOM_CENTER_X,COUNCIL_ROOM_CENTER_Z,29.2,COUNCIL_ROOM_FLOOR,17.2,56,7,[0,Math.PI],1201
  );
  const library=makeStoneMasonry(
    LIBRARY_CENTER_X,LIBRARY_CENTER_Z,35.8,LIBRARY_FLOOR,26.3,72,10,[0,Math.PI],2207
  );

  function buildCouncilFloorRelief(){
    const cx=COUNCIL_ROOM_CENTER_X,cz=COUNCIL_ROOM_CENTER_Z,y=COUNCIL_ROOM_FLOOR+.045;
    const pale=new THREE.MeshStandardMaterial({color:0xb9b7ad,roughness:.38,metalness:.04});
    const gold=new THREE.MeshStandardMaterial({color:0x9c7d4a,metalness:.68,roughness:.28});
    for(const radius of [12.2,15.8,20.8,23.1]){
      const ring=new THREE.Mesh(new THREE.TorusGeometry(radius,.085,8,192),gold);
      ring.rotation.x=Math.PI/2;ring.position.set(cx,y,cz);scene.add(ring);
    }
    for(let i=0;i<24;i++){
      const a=i/24*Math.PI*2;
      const geometry=new THREE.BoxGeometry(8.1,.055,.075);
      const line=new THREE.Mesh(geometry,pale);
      const r=18.3,mid=r-4.05;
      line.position.set(cx+Math.cos(a)*mid,y+.01,cz+Math.sin(a)*mid);
      line.rotation.y=-a;scene.add(line);
      const stud=new THREE.Mesh(new THREE.SphereGeometry(.12,12,8),gold);
      stud.position.set(cx+Math.cos(a)*20.8,y+.08,cz+Math.sin(a)*20.8);scene.add(stud);
    }
  }

  function buildTrainingGroundMaterialDetails(){
    const iron=new THREE.MeshStandardMaterial({color:0x555b5e,metalness:.76,roughness:.28});
    const brass=new THREE.MeshStandardMaterial({color:0xa68b58,metalness:.78,roughness:.24});
    const wood=new THREE.MeshStandardMaterial({color:0x63452d,roughness:.72});
    const yardX=-2600,yardZ=350,groundY=terrainHeightAnalytic(yardX,yardZ);
    // Forged collars, peened rivets and end caps give the tool racks and
    // target frames hardware at a believable physical scale.
    for(const [x,z] of [[yardX-55,yardZ+27],[yardX+51,yardZ+30]]){
      for(const side of [-1,1]){
        const foot=new THREE.Mesh(new THREE.CylinderGeometry(.22,.28,.28,20),brass);
        foot.position.set(x+side*2.4,groundY+.36,z);scene.add(foot);
        for(const y of [.75,2.05]){
          for(const end of [-1,1]){
            const bolt=new THREE.Mesh(new THREE.SphereGeometry(.095,12,10),iron);
            bolt.position.set(x+side*2.4,yardZ?groundY+y:groundY+y,z+end*.14);scene.add(bolt);
          }
        }
      }
    }
    for(let i=0;i<5;i++){
      const x=yardX+36,z=yardZ-30+i*15;
      const hub=new THREE.Mesh(new THREE.CylinderGeometry(.18,.18,.28,20),brass);
      hub.rotation.x=Math.PI/2;hub.position.set(x,groundY+3.8,z+.18);scene.add(hub);
      const pin=new THREE.Mesh(new THREE.SphereGeometry(.16,16,12),iron);
      pin.position.set(x,groundY+3.8,z+.36);scene.add(pin);
    }
    // A simple carved timber end-grain disc enriches the canopy's main beam.
    const cap=new THREE.Mesh(new THREE.CylinderGeometry(.28,.28,.16,28),wood);
    cap.rotation.z=Math.PI/2;cap.position.set(yardX-13,groundY+4.4,yardZ+54);scene.add(cap);
  }

  function buildStairAndCaveRelief(){
    const rockMaterial=new THREE.MeshStandardMaterial({
      color:0xffffff,map:textures.darkRock.color,bumpMap:textures.darkRock.height,
      bumpScale:.085,roughness:.99,roughnessMap:textures.darkRock.roughness,
      normalMap:textures.darkRock.normal,normalScale:new THREE.Vector2(.48,.48)
    });
    const seamMaterial=new THREE.MeshStandardMaterial({color:0x262a2b,roughness:1});
    // Large, irregular rock shoulders at the foot of the Throne Cave walls.
    for(let i=0;i<34;i++){
      const side=i%2===0?-1:1;
      const t=Math.floor(i/2)/16;
      const x=THRONE_ROOM_MAX_X-10-t*(THRONE_ROOM_MAX_X-THRONE_ROOM_MIN_X-18);
      const z=side*(THRONE_ROOM_HALF_WIDTH-1.0);
      const rock=new THREE.Mesh(new THREE.IcosahedronGeometry(1,2),rockMaterial);
      const size=1.5+hash(i+31,83)*1.8;
      rock.position.set(x,THRONE_ROOM_FLOOR+size*.42,z);
      rock.scale.set(size*1.15,size*.56,size*.9);
      rock.rotation.set(hash(i+41,94)*.2,hash(i+51,27)*Math.PI,hash(i+61,38)*.2);
      rock.castShadow=true;rock.receiveShadow=true;scene.add(rock);
    }

    // A restrained ring of mineral joints around the Dragonhold floor breaks
    // the single flat disc into large hand-laid stone courses.
    for(let i=0;i<32;i++){
      const a=i/32*Math.PI*2;
      const r=DRAGONHOLD_RADIUS-1.45;
      const joint=new THREE.Mesh(new THREE.BoxGeometry(2.35,.025,.045),seamMaterial);
      joint.position.set(Math.cos(a)*r,VOL_TURIN_TOP_Y+.035,Math.sin(a)*r);
      joint.rotation.y=-a;scene.add(joint);
    }
    const centreRing=new THREE.Mesh(new THREE.TorusGeometry(7.1,.045,6,128),
      new THREE.MeshStandardMaterial({color:0x9d8150,metalness:.72,roughness:.28}));
    centreRing.rotation.x=Math.PI/2;centreRing.position.y=VOL_TURIN_TOP_Y+.045;scene.add(centreRing);
  }

  buildCouncilFloorRelief();
  buildTrainingGroundMaterialDetails();
  buildStairAndCaveRelief();

  // Low-angle wall grazing lights reveal the mineral relief rather than
  // washing it out with uniform ambient illumination.
  const grazingLights=[
    [-561,COUNCIL_ROOM_FLOOR+4,-17,0xb3c9df],
    [-619,COUNCIL_ROOM_FLOOR+4,17,0xb3c9df],
    [-626,LIBRARY_FLOOR+5,-21,0xd5c5a5],
    [-694,LIBRARY_FLOOR+5,21,0xd5c5a5],
    [-179,ENTRY_HALL_FLOOR-2,-10,0xffd19a],
    [-179,ENTRY_HALL_FLOOR-2,10,0xffd19a]
  ];
  for(const [x,y,z,color] of grazingLights){
    const light=new THREE.PointLight(color,10,32,2);
    light.position.set(x,y,z);scene.add(light);
  }

  renderer.shadowMap.needsUpdate=true;
  globalThis.TRONJHEIM_PBR_PASS={
    materialFamilies:families.length,
    mappedMaterials:materialCount,
    generatedUVs:geometryUVCount,
    smoothedLateGeometries:smoothGeometryCache.size,
    masonryBuildings:2,
    masonryCourseCount:17,
    texturesPerFamily:4
  };
})();
