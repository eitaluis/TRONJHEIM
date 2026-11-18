// ============================================================================
// TRONJHEIM — FASE 10: REFINAMENTO VISUAL GLOBAL
// Aplicado depois da construção de todos os ambientes e antes da navegação.
// Objetivo: reduzir a leitura de blocos low-poly e dar resposta de materiais,
// micro-relevo, arestas trabalhadas e escala ambiental mais orgânica.
// ============================================================================
(function refineTronjheimVisuals(){
  const maxAniso=Math.min(renderer.capabilities.getMaxAnisotropy(),12);

  function seeded(seed){
    let s=seed>>>0;
    return ()=>{s=(s*1664525+1013904223)>>>0;return s/4294967296;};
  }

  function makeDetailTexture(kind,size=512){
    const canvas=document.createElement("canvas");
    canvas.width=canvas.height=size;
    const ctx=canvas.getContext("2d");
    const image=ctx.createImageData(size,size);
    const rand=seeded(kind==="height"?1701:kind==="rough"?2903:4109);
    for(let y=0;y<size;y++){
      for(let x=0;x<size;x++){
        const i=(y*size+x)*4;
        const n=rand()-.5;
        let v=128;
        if(kind==="height")v=128+n*17+Math.sin(x*.035+Math.sin(y*.021)*2)*2.2;
        if(kind==="rough")v=232+n*27;
        if(kind==="color")v=242+n*9;
        v=Math.max(0,Math.min(255,v));
        if(kind==="color"){
          image.data[i]=Math.min(255,v+1);
          image.data[i+1]=Math.max(0,v);
          image.data[i+2]=Math.max(0,v-4);
        }else{
          image.data[i]=image.data[i+1]=image.data[i+2]=v;
        }
        image.data[i+3]=255;
      }
    }
    ctx.putImageData(image,0,0);
    if(kind==="height"){
      // Fine, irregular mineral veins: low contrast so the relief reads at
      // close range without becoming a tiled or stylized game texture.
      ctx.save();
      ctx.globalAlpha=.055;
      ctx.strokeStyle="#343434";
      ctx.lineWidth=1.2;
      for(let i=0;i<22;i++){
        const x=rand()*size,y=rand()*size;
        ctx.beginPath();ctx.moveTo(x,y);
        for(let k=1;k<8;k++){
          ctx.lineTo(x+k*18,y+Math.sin(k*.7+i)*5+(rand()-.5)*7);
        }
        ctx.stroke();
      }
      ctx.restore();
    }
    const texture=new THREE.CanvasTexture(canvas);
    texture.wrapS=texture.wrapT=THREE.RepeatWrapping;
    texture.repeat.set(2.6,2.6);
    texture.anisotropy=maxAniso;
    texture.generateMipmaps=true;
    texture.minFilter=THREE.LinearMipmapLinearFilter;
    texture.magFilter=THREE.LinearFilter;
    if(kind==="color")texture.colorSpace=THREE.SRGBColorSpace;
    texture.needsUpdate=true;
    return texture;
  }

  const colorDetail=makeDetailTexture("color");
  const heightDetail=makeDetailTexture("height");
  const roughnessDetail=makeDetailTexture("rough");

  const geometryCache=new Map();
  function bevelBoxGeometry(source){
    const p=source.parameters;
    const w=p.width,h=p.height,d=p.depth;
    const minDim=Math.min(w,h,d),maxDim=Math.max(w,h,d);
    // Leave monumental slabs untouched; soften the edges of architectural
    // blocks, cornices, furniture and stair elements at human scale.
    if(minDim<.24||maxDim>180)return source;
    const bevel=Math.min(.055,minDim*.12);
    const key=[w,h,d,bevel].map(v=>v.toFixed(3)).join("|");
    if(geometryCache.has(key))return geometryCache.get(key);
    const shape=new THREE.Shape();
    const sw=w-bevel*1.3,sh=h-bevel*1.3;
    shape.moveTo(-sw/2,-sh/2);
    shape.lineTo(sw/2,-sh/2);
    shape.lineTo(sw/2,sh/2);
    shape.lineTo(-sw/2,sh/2);
    shape.closePath();
    const coreDepth=Math.max(.015,d-2*bevel);
    const geometry=new THREE.ExtrudeGeometry(shape,{
      depth:coreDepth,
      steps:1,
      bevelEnabled:true,
      bevelSegments:2,
      bevelSize:bevel*.65,
      bevelThickness:bevel,
      curveSegments:2
    });
    geometry.translate(0,0,-coreDepth/2);
    geometry.computeVertexNormals();
    geometryCache.set(key,geometry);
    return geometry;
  }

  const smoothGeometryCache=new Map();
  function refineGeometry(source){
    if(!source||!source.parameters)return source;
    const p=source.parameters;
    const key=source.uuid;
    if(smoothGeometryCache.has(key))return smoothGeometryCache.get(key);
    let refined=source;
    if(source.type==="BoxGeometry"){
      refined=bevelBoxGeometry(source);
    }else if(source.type==="SphereGeometry"){
      const ws=Math.max(28,p.widthSegments||8),hs=Math.max(20,p.heightSegments||6);
      if(ws!==(p.widthSegments||8)||hs!==(p.heightSegments||6)){
        refined=new THREE.SphereGeometry(p.radius,ws,hs,p.phiStart,p.phiLength,p.thetaStart,p.thetaLength);
      }
    }else if(source.type==="CylinderGeometry"){
      const radial=Math.max(28,p.radialSegments||8),vertical=Math.max(2,p.heightSegments||1);
      if(radial!==(p.radialSegments||8)||vertical!==(p.heightSegments||1)){
        refined=new THREE.CylinderGeometry(p.radiusTop,p.radiusBottom,p.height,radial,vertical,p.openEnded,p.thetaStart,p.thetaLength);
      }
    }else if(source.type==="ConeGeometry"){
      const radial=Math.max(28,p.radialSegments||8),vertical=Math.max(2,p.heightSegments||1);
      if(radial!==(p.radialSegments||8)||vertical!==(p.heightSegments||1)){
        refined=new THREE.ConeGeometry(p.radius,p.height,radial,vertical,p.openEnded,p.thetaStart,p.thetaLength);
      }
    }else if(source.type==="TorusGeometry"){
      const radial=Math.max(16,p.radialSegments||8),tubular=Math.max(64,p.tubularSegments||6);
      if(radial!==(p.radialSegments||8)||tubular!==(p.tubularSegments||6)){
        refined=new THREE.TorusGeometry(p.radius,p.tube,radial,tubular,p.arc);
      }
    }else if(source.type==="CircleGeometry"){
      const segments=Math.max(96,p.segments||8);
      if(segments!==(p.segments||8)){
        refined=new THREE.CircleGeometry(p.radius,segments,p.thetaStart,p.thetaLength);
      }
    }
    if(refined!==source)refined.computeVertexNormals();
    smoothGeometryCache.set(key,refined);
    return refined;
  }

  const materialCache=new WeakSet();
  function refineMaterial(material){
    if(!material||!material.isMeshStandardMaterial||materialCache.has(material))return;
    materialCache.add(material);
    const rough=material.roughness??.8;
    const metal=material.metalness??0;
    if(rough>.32){
      if(!material.map&&metal<.28&&rough>.48)material.map=colorDetail;
      if(!material.bumpMap){
        material.bumpMap=heightDetail;
        material.bumpScale=rough>.82?.038:.024;
      }
      if(!material.roughnessMap)material.roughnessMap=roughnessDetail;
    }
    material.envMapIntensity=Math.max(material.envMapIntensity||0,.32);
    material.needsUpdate=true;
  }

  function buildBasinRockField(){
    // The basin used to read as a nearly empty, smooth plane. Two instanced
    // fields of naturally varied stone add geological scale without thousands
    // of separate draw calls or conspicuous cubic props.
    const rockGeometry=new THREE.DodecahedronGeometry(1,2);
    const positions=rockGeometry.attributes.position;
    for(let i=0;i<positions.count;i++){
      const x=positions.getX(i),y=positions.getY(i),z=positions.getZ(i);
      const variation=1+(hash(i*.71+13, i*.37+29)-.5)*.22+fbm(x*4+7,z*4-3)*.09;
      positions.setXYZ(i,x*variation,y*variation,z*variation);
    }
    rockGeometry.computeVertexNormals();
    const rockMaterial=new THREE.MeshStandardMaterial({
      color:0xffffff,roughness:.96,metalness:.015
    });
    const dummy=new THREE.Object3D();
    const stoneColors=[0x777b7d,0x696f73,0x85827b,0x60686c,0x8a8881].map(c=>new THREE.Color(c));

    function field(count,nearBase){
      const mesh=new THREE.InstancedMesh(rockGeometry,rockMaterial,count);
      for(let i=0;i<count;i++){
        const a=hash(i+31,nearBase?91:191)*Math.PI*2;
        const radial=nearBase?1815+hash(i+71,33)*1050:2850+hash(i+131,77)*5000;
        const x=Math.cos(a)*radial,z=Math.sin(a)*radial;
        const size=nearBase?3.2+hash(i+41,17)*10.5:.9+hash(i+51,27)*3.6;
        const sx=size*(.72+hash(i+21,14)*.8);
        const sy=size*(.28+hash(i+11,24)*.62);
        const sz=size*(.75+hash(i+61,34)*.8);
        dummy.position.set(x,terrainHeightAnalytic(x,z)+sy*.43,z);
        dummy.rotation.set(hash(i+81,4)*.3,hash(i+91,8)*Math.PI*2,hash(i+101,12)*.24);
        dummy.scale.set(sx,sy,sz);
        dummy.updateMatrix();
        mesh.setMatrixAt(i,dummy.matrix);
        const shade=stoneColors[Math.floor(hash(i+111,44)*stoneColors.length)].clone();
        shade.multiplyScalar(.88+hash(i+121,54)*.24);
        mesh.setColorAt(i,shade);
      }
      mesh.instanceMatrix.needsUpdate=true;
      if(mesh.instanceColor)mesh.instanceColor.needsUpdate=true;
      mesh.castShadow=false;mesh.receiveShadow=true;
      scene.add(mesh);
    }
    field(460,true);
    field(1050,false);
  }

  function addCinematicFill(){
    const coolBounce=new THREE.DirectionalLight(0xc7d8e7,.32);
    coolBounce.position.set(-2600,3900,-1800);
    coolBounce.castShadow=false;
    scene.add(coolBounce);
    const warmInteriorBounce=new THREE.PointLight(0xf4d9b0,95,680,2);
    warmInteriorBounce.position.set(-12,ENTRY_HALL_FLOOR+22,8);
    scene.add(warmInteriorBounce);
  }

  buildBasinRockField();
  addCinematicFill();

  // A higher pixel ratio and more even geometry tessellation improve the
  // rendered image while keeping the scene within a practical desktop budget.
  renderer.setPixelRatio(Math.min(devicePixelRatio,2));
  renderer.setSize(innerWidth,innerHeight);
  renderer.toneMappingExposure=1.14;

  scene.traverse(object=>{
    if(!object.isMesh)return;
    if(object.geometry)object.geometry=refineGeometry(object.geometry);
    if(Array.isArray(object.material))object.material.forEach(refineMaterial);
    else refineMaterial(object.material);
  });

  globalThis.TRONJHEIM_VISUAL_PASS={
    materialMaps:3,
    bevelledBoxGeometry:geometryCache.size,
    refinedPrimitiveGeometry:smoothGeometryCache.size,
    basinRockInstances:1510
  };
})();
