// ============================================================================
// FASE 13 — CAVERNA DE SAPHIRA E TERRENO ESCULPIDO
// ============================================================================

(function buildSaphiraCaveAndTerrainPass(){
  const cave=DRAGONHOLD_CAVES.find(c=>c.id==="saphira");
  if(!cave)return;
  const floorY=VOL_TURIN_TOP_Y+cave.bottom;
  const centerR=DRAGONHOLD_OUTER_RADIUS+cave.depth*.5-.7;
  const group=new THREE.Group();
  group.position.set(Math.cos(cave.angle)*centerR,floorY+cave.height*.5,Math.sin(cave.angle)*centerR);
  group.rotation.y=Math.PI/2-cave.angle;

  // Piso de pedra contínuo, discretamente irregular e alinhado ao piso físico.
  const floorGeo=new THREE.PlaneGeometry(cave.width*.96,cave.depth*.96,40,72);
  const fp=floorGeo.attributes.position;
  for(let i=0;i<fp.count;i++){
    const x=fp.getX(i),z=fp.getY(i);
    const edge=Math.max(Math.abs(x)/(cave.width*.48),Math.abs(z)/(cave.depth*.48));
    const relief=(Math.sin(x*2.7+z*.7)*.035+Math.sin(z*1.35-x*1.1)*.045+
      Math.sin(x*6.2+z*3.1)*.018)*(1-edge*.45);
    fp.setZ(i,relief);
  }
  floorGeo.rotateX(-Math.PI/2);floorGeo.computeVertexNormals();
  const floor=new THREE.Mesh(floorGeo,new THREE.MeshStandardMaterial({color:0x554638,roughness:.98}));
  floor.position.y=-cave.height*.5+.39;floor.receiveShadow=true;floor.castShadow=true;group.add(floor);

  // Abóbada elíptica contínua: paredes e teto pertencem à mesma malha.
  const around=72,along=56,positions=[],uvs=[],indices=[];
  for(let j=0;j<=along;j++){
    const t=j/along,z=(t-.5)*(cave.depth+.2),taper=.88+.12*Math.sin(Math.PI*t);
    for(let i=0;i<=around;i++){
      const a=i/around*Math.PI*2,nx=Math.cos(a),ny=Math.sin(a);
      const ripple=(Math.sin(t*19+a*5)+Math.sin(t*37-a*9)*.45)*.075;
      const rx=(cave.width*.5+.48)*taper+ripple,ry=(cave.height*.5+.45)+ripple*.8;
      positions.push(nx*rx,ny*ry,z);uvs.push(i/around*3,j/along*4);
    }
  }
  for(let j=0;j<along;j++)for(let i=0;i<around;i++){
    const a=j*(around+1)+i,b=a+around+1;indices.push(a,a+1,b,a+1,b+1,b);
  }
  const vaultGeo=new THREE.BufferGeometry();
  vaultGeo.setAttribute("position",new THREE.Float32BufferAttribute(positions,3));
  vaultGeo.setAttribute("uv",new THREE.Float32BufferAttribute(uvs,2));
  vaultGeo.setIndex(indices);vaultGeo.computeVertexNormals();
  const vault=new THREE.Mesh(vaultGeo,new THREE.MeshStandardMaterial({color:0x514437,roughness:1,side:THREE.DoubleSide}));
  vault.receiveShadow=true;vault.castShadow=true;group.add(vault);

  // Nervuras transversais e talude rochoso nas laterais, mantendo o eixo livre.
  const ribMat=new THREE.MeshStandardMaterial({color:0x76634e,roughness:.96});
  for(const z of [-5.4,-1.8,1.8,5.4]){
    const rib=new THREE.Mesh(new THREE.TorusGeometry(1,.22,10,64),ribMat);
    rib.scale.set(cave.width*.48,cave.height*.49,1);rib.position.set(0,0,z);group.add(rib);
  }
  let seed=74191;const rand=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
  const rockMat=new THREE.MeshStandardMaterial({color:0x62513e,roughness:1});
  const rocks=new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1,2),rockMat,34);
  const dummy=new THREE.Object3D();
  for(let i=0;i<34;i++){
    const side=i%2?1:-1,x=side*(2.7+rand()*1.15),z=(rand()-.5)*(cave.depth-2.5);
    dummy.position.set(x,-cave.height*.5+.35+rand()*.5,z);
    dummy.rotation.set(rand()*Math.PI,rand()*Math.PI,rand()*Math.PI);
    dummy.scale.set(.35+rand()*.85,.22+rand()*.55,.45+rand()*1.05);
    dummy.updateMatrix();rocks.setMatrixAt(i,dummy.matrix);
  }
  rocks.instanceMatrix.needsUpdate=true;group.add(rocks);
  const bounce=new THREE.PointLight(0x9a6544,2.8,17,2);bounce.position.set(0,-1.4,1.5);group.add(bounce);
  scene.add(group);

  // Afloramentos em grupos quebram a superfície exterior lisa.
  const terrainMat=new THREE.MeshStandardMaterial({color:0x77756f,roughness:1});
  const boulders=new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1,2),terrainMat,260);
  let placed=0;
  for(let i=0;i<780&&placed<260;i++){
    const angle=rand()*Math.PI*2,radius=2050+rand()*5650;
    const x=Math.cos(angle)*radius,z=Math.sin(angle)*radius,y=terrainHeightAnalytic(x,z);
    const scale=9+Math.pow(rand(),1.8)*32;
    dummy.position.set(x,y+scale*.18,z);dummy.rotation.set(rand()*Math.PI,rand()*Math.PI,rand()*Math.PI);
    dummy.scale.set(scale*(.75+rand()*.55),scale*(.28+rand()*.32),scale*(.7+rand()*.7));
    dummy.updateMatrix();boulders.setMatrixAt(placed++,dummy.matrix);
  }
  boulders.count=placed;boulders.instanceMatrix.needsUpdate=true;
  boulders.castShadow=true;boulders.receiveShadow=true;scene.add(boulders);
})();
