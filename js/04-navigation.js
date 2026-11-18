// ============================================================================
// PLAYER, MOVEMENT, COLLISION AND NAVIGATION — Ellesméra V16 interaction standard
// World unit = 1 meter. Eye height = 1.70 m. Walking and running use human scale.
// ============================================================================
const jogador={pos:new THREE.Vector3(7800,0,0),vel:new THREE.Vector3(),noChao:true,raio:.35,alturaOlhos:1.70};
const teclas={};
let yaw=Math.PI/2,pitch=0,travado=false,vooLivre=false,vistaInspecao=false,iniciou=false;
let indiceTP=0,estadoAntesInspecao=null;
const clock=new THREE.Clock();

// Interpolate the same two triangles used by the rendered PlaneGeometry.
// The character therefore follows the actual mesh rather than a second terrain formula.
function alturaChao(x,z){
  if(!groundGrid)return terrainHeightAnalytic(x,z);
  const {size,segments,heights,offsetY,cell}=groundGrid;
  const gx=THREE.MathUtils.clamp((x+size/2)/cell,0,segments-.000001);
  const gz=THREE.MathUtils.clamp((z+size/2)/cell,0,segments-.000001);
  const ix=Math.floor(gx),iz=Math.floor(gz),fx=gx-ix,fz=gz-iz,stride=segments+1;
  const a=heights[iz*stride+ix],b=heights[(iz+1)*stride+ix];
  const c=heights[(iz+1)*stride+ix+1],d=heights[iz*stride+ix+1];
  let h;
  if(fx+fz<=1)h=a*(1-fx-fz)+d*fx+b*fz;
  else h=d*(1-fz)+c*(fx+fz-1)+b*(1-fx);
  return h+offsetY;
}
const pontosTP=[
  {id:"central",nome:"Câmara central",x:0,z:0,yaw:0,pitch:-.03,levelY:ENTRY_HALL_FLOOR+1.7},
  {id:"northHall",nome:"Corredor norte",x:0,z:-260,yaw:0,pitch:0,levelY:ENTRY_HALL_FLOOR+1.7},
  {id:"southHall",nome:"Corredor sul",x:0,z:260,yaw:Math.PI,pitch:0,levelY:ENTRY_HALL_FLOOR+1.7},
  {id:"westHall",nome:"Corredor oeste",x:-260,z:0,yaw:Math.PI/2,pitch:0,levelY:ENTRY_HALL_FLOOR+1.7},
  {id:"tunnel",nome:"Entrada da montanha",x:7800,z:0,yaw:Math.PI/2,pitch:0},
  {id:"approach",nome:"Caminho central",x:4650,z:0,yaw:Math.PI/2,pitch:0},
  {id:"gate",nome:"Portão de Tronjheim",x:TRONJHEIM_GATE.facadeX+42,z:0,yaw:Math.PI/2,pitch:-.04},
  {id:"overlook",nome:"Vista externa",x:2750,z:1050,yaw:Math.atan2(2750,1050),pitch:-.12},
  // The book places the training ground half a mile behind Tronjheim; exact coordinates are interpretive.
  {id:"training",nome:"Campo de treinamento",x:-2600,z:350,yaw:-Math.PI/2,pitch:0},
  {id:"west",nome:"Lado oeste",x:-5000,z:-300,yaw:-Math.PI/2,pitch:0},
  {id:"entryHall",nome:"Grande corredor — entrada",x:TRONJHEIM_GATE.doorX-120,z:0,yaw:Math.PI/2,pitch:0,levelY:ENTRY_HALL_FLOOR+1.7},
  {id:"deepHall",nome:"Grande corredor — interior",x:TRONJHEIM_GATE.hallEndX+310,z:0,yaw:Math.PI/2,pitch:0,levelY:ENTRY_HALL_FLOOR+1.7}
];
function alinharCamera(){camera.position.copy(jogador.pos);camera.rotation.order="YXZ";camera.rotation.set(pitch,yaw,0,"YXZ");}
function teleportarIndice(i){
  indiceTP=(i+pontosTP.length)%pontosTP.length;const p=pontosTP[indiceTP];
  jogador.pos.set(p.x,p.levelY!==undefined?p.levelY:alturaChao(p.x,p.z)+jogador.alturaOlhos,p.z);
  jogador.vel.set(0,0,0);jogador.noChao=true;vooLivre=false;yaw=p.yaw;pitch=p.pitch;alinharCamera();
  document.getElementById("modeLabel").textContent="Local: "+p.nome;
  document.getElementById("tpAtual").textContent=p.nome;
}
function teleportarPorId(id){const i=pontosTP.findIndex(p=>p.id===id);if(i>=0)teleportarIndice(i);}
function inspecionarPortao(){
  jogador.pos.set(TRONJHEIM_GATE.facadeX+82,alturaChao(TRONJHEIM_GATE.facadeX+82,0)+jogador.alturaOlhos,0);
  jogador.vel.set(0,0,0);jogador.noChao=true;vooLivre=false;yaw=Math.PI/2;pitch=-.12;alinharCamera();
  document.getElementById("modeLabel").textContent="Inspeção: fachada e portão";
  document.getElementById("tpAtual").textContent="Inspeção do portão";
}
function solicitarPointerLock(){renderer.domElement.requestPointerLock?.();}
document.addEventListener("pointerlockchange",()=>{
  travado=document.pointerLockElement===renderer.domElement;if(travado)iniciou=true;
  document.getElementById("start").style.display=(travado||iniciou)?"none":"grid";
});
renderer.domElement.addEventListener("click",()=>{if(!vistaInspecao)solicitarPointerLock();});
document.getElementById("enter").addEventListener("click",solicitarPointerLock);
document.getElementById("lockBtn").addEventListener("click",solicitarPointerLock);
document.addEventListener("mousemove",e=>{
  if(!travado||vistaInspecao)return;yaw-=e.movementX*.0022;pitch-=e.movementY*.0022;
  pitch=THREE.MathUtils.clamp(pitch,-Math.PI/2+.01,Math.PI/2-.01);camera.rotation.set(pitch,yaw,0,"YXZ");
});
document.addEventListener("keydown",e=>{
  if(["Space","Tab","ArrowUp","ArrowDown","ArrowLeft","ArrowRight"].includes(e.code))e.preventDefault();
  teclas[e.code]=true;
  if(e.code==="KeyM")teleportarIndice(indiceTP+1);
  if(e.code==="KeyN")teleportarIndice(indiceTP-1);
  if(e.code==="KeyG")inspecionarPortao();
  if(e.code==="KeyF"){vooLivre=!vooLivre;jogador.vel.y=0;document.getElementById("modeLabel").textContent="Modo: "+(vooLivre?"voo livre":"exploração");}
  if(e.code==="KeyV")alternarInspecao();
  if(e.code==="Tab"){mapaVisivel=!mapaVisivel;atualizarVisibilidadeMapa();}
});
document.addEventListener("keyup",e=>{teclas[e.code]=false;});
function alternarInspecao(){
  vistaInspecao=!vistaInspecao;document.getElementById("hint").classList.toggle("show",vistaInspecao);
  if(vistaInspecao){
    estadoAntesInspecao={pos:jogador.pos.clone(),yaw,pitch};document.exitPointerLock?.();
    camera.position.set(0,3150,6100);camera.lookAt(0,620,0);camera.rotation.order="YXZ";
    document.getElementById("modeLabel").textContent="Modo: vista de inspeção";
  }else{
    if(estadoAntesInspecao){jogador.pos.copy(estadoAntesInspecao.pos);yaw=estadoAntesInspecao.yaw;pitch=estadoAntesInspecao.pitch;}
    alinharCamera();document.getElementById("modeLabel").textContent="Modo: exploração";
  }
}
document.getElementById("overviewBtn").addEventListener("click",alternarInspecao);

function dentroDaArquitetura(x,z){
  const r=Math.hypot(x,z);
  const inChamber=r<=CENTRAL_WALL_RADIUS-2.2;
  const inEastHall=x>=TRONJHEIM_GATE.hallEndX-2 && x<=TRONJHEIM_GATE.doorX-4 && Math.abs(z)<=38.4;
  const inGateThroat=x>=TRONJHEIM_GATE.doorX-6 && x<=CITY.radius+3 && Math.abs(z)<=11.5;
  const branchStart=SIDE_CORRIDOR_START,branchEnd=SIDE_CORRIDOR_START+SIDE_CORRIDOR_LENGTH-2;
  const half=SIDE_CORRIDOR_HALF_WIDTH;
  const inNorth=z<=-branchStart && z>=-branchEnd && Math.abs(x)<=half;
  const inSouth=z>=branchStart && z<=branchEnd && Math.abs(x)<=half;
  const inWest=x<=-branchStart && x>=-branchEnd && Math.abs(z)<=half;
  return inChamber||inEastHall||inGateThroat||inNorth||inSouth||inWest;
}
function podeOcuparXZ(x,z){
  const r=Math.hypot(x,z);
  if(r>8075-jogador.raio)return false;
  // Tronjheim is a solid mountain shell except at the actual eastern gate.
  if(r<CITY.radius-jogador.raio && !dentroDaArquitetura(x,z))return false;
  // The 32 red-jasper columns are solid obstacles, not walk-through decoration.
  if(r<CENTRAL_WALL_RADIUS-4){
    for(let i=0;i<32;i++){
      const a=i*Math.PI/16,cx=Math.cos(a)*CENTRAL_COLUMN_RADIUS,cz=Math.sin(a)*CENTRAL_COLUMN_RADIUS;
      if(Math.hypot(x-cx,z-cz)<5.0)return false;
    }
  }
  return true;
}
function alturaPisoNaPosicao(x,z){
  return dentroDaArquitetura(x,z)?ENTRY_HALL_FLOOR:alturaChao(x,z);
}
function limitarAoInterior(pos){
  const r=Math.hypot(pos.x,pos.z),limite=8075-jogador.raio;
  if(r>limite){const f=limite/r;pos.x*=f;pos.z*=f;}
  pos.x=THREE.MathUtils.clamp(pos.x,-8075+jogador.raio,8075-jogador.raio);
  pos.z=THREE.MathUtils.clamp(pos.z,-8075+jogador.raio,8075-jogador.raio);
}
function atualizarJogador(dt){
  if(vistaInspecao)return;
  const frente=new THREE.Vector3(-Math.sin(yaw),0,-Math.cos(yaw));
  const direita=new THREE.Vector3(Math.cos(yaw),0,-Math.sin(yaw));
  const direcao=new THREE.Vector3();
  if(teclas.KeyW||teclas.ArrowUp)direcao.add(frente);
  if(teclas.KeyS||teclas.ArrowDown)direcao.sub(frente);
  if(teclas.KeyD||teclas.ArrowRight)direcao.add(direita);
  if(teclas.KeyA||teclas.ArrowLeft)direcao.sub(direita);
  if(direcao.lengthSq()>0)direcao.normalize();
  const correndo=teclas.ShiftLeft||teclas.ShiftRight;
  const velocidade=vooLivre?230:(correndo?725:400);
  jogador.vel.x=THREE.MathUtils.damp(jogador.vel.x,direcao.x*velocidade,vooLivre?12:24,dt);
  jogador.vel.z=THREE.MathUtils.damp(jogador.vel.z,direcao.z*velocidade,vooLivre?12:24,dt);
  // Swept substeps prevent the high requested speed from tunnelling through walls.
  const dx=jogador.vel.x*dt,dz=jogador.vel.z*dt;
  const distance=Math.hypot(dx,dz),steps=Math.max(1,Math.ceil(distance/1.1));
  for(let step=0;step<steps;step++){
    const sx=dx/steps,sz=dz/steps;
    const nx=jogador.pos.x+sx,nz=jogador.pos.z+sz;
    if(podeOcuparXZ(nx,nz)){jogador.pos.x=nx;jogador.pos.z=nz;}
    else{
      if(podeOcuparXZ(nx,jogador.pos.z))jogador.pos.x=nx;
      if(podeOcuparXZ(jogador.pos.x,nz))jogador.pos.z=nz;
    }
  }
  limitarAoInterior(jogador.pos);
  if(vooLivre){
    if(teclas.Space)jogador.pos.y+=velocidade*dt;
    if(teclas.ControlLeft||teclas.ControlRight)jogador.pos.y-=velocidade*dt;
    jogador.pos.y=THREE.MathUtils.clamp(jogador.pos.y,1.7,19500);
  }else{
    const piso=alturaPisoNaPosicao(jogador.pos.x,jogador.pos.z);
    if(teclas.Space&&jogador.noChao){jogador.vel.y=8.2;jogador.noChao=false;}
    if(!jogador.noChao){
      jogador.vel.y-=24*dt;jogador.pos.y+=jogador.vel.y*dt;
      const limite=piso+jogador.alturaOlhos;
      if(jogador.pos.y<=limite){jogador.pos.y=limite;jogador.vel.y=0;jogador.noChao=true;}
    }else{
      const alvo=piso+jogador.alturaOlhos;
      // Grounded feet must stay on the exact rendered support surface.
      jogador.pos.y=alvo;jogador.vel.y=0;
    }
  }
  alinharCamera();
  document.getElementById("cx").textContent=jogador.pos.x.toFixed(1)+" m";
  document.getElementById("cy").textContent=jogador.pos.y.toFixed(1)+" m";
  document.getElementById("cz").textContent=jogador.pos.z.toFixed(1)+" m";
}

// MINIMAPA: geral/local, zoom pela roda, TAB para esconder e clique para teleportar.
const mapCanvas=document.getElementById("miniMap"),mapCtx=mapCanvas.getContext("2d");
const MAP_SIZE=mapCanvas.width,MAP_LIMIT=8400;
let mapaVisivel=true,mapaZoomLocal=false;
const mapaEscala=document.getElementById("mm-escala");
function atualizarVisibilidadeMapa(){document.getElementById("miniPanel").style.display=mapaVisivel?"block":"none";}
document.getElementById("miniPanel").addEventListener("wheel",e=>{
  e.preventDefault();mapaZoomLocal=!mapaZoomLocal;mapaEscala.textContent=mapaZoomLocal?"zoom local":"visão geral";
},{passive:false});
function mundoParaMapa(x,z){
  if(mapaZoomLocal){const raio=1700;return{x:MAP_SIZE/2+(x-jogador.pos.x)/raio*(MAP_SIZE/2),y:MAP_SIZE/2-(z-jogador.pos.z)/raio*(MAP_SIZE/2)};}
  return{x:MAP_SIZE/2+x/(MAP_LIMIT*2)*MAP_SIZE,y:MAP_SIZE/2-z/(MAP_LIMIT*2)*MAP_SIZE};
}
function desenharMinimapa(){
  if(!mapaVisivel)return;const c=mapCtx,w=MAP_SIZE,h=MAP_SIZE,cx=w/2,cy=h/2;
  c.clearRect(0,0,w,h);c.fillStyle="#080d13";c.fillRect(0,0,w,h);
  const p=(x,z)=>mundoParaMapa(x,z);
  c.strokeStyle="rgba(155,169,181,.42)";c.lineWidth=2;c.beginPath();c.ellipse(cx,cy,8200/(MAP_LIMIT*2)*w,8200/(MAP_LIMIT*2)*h,0,0,Math.PI*2);c.stroke();
  c.strokeStyle="rgba(123,139,153,.19)";c.lineWidth=1;for(let r=2000;r<=8000;r+=2000){c.beginPath();c.arc(cx,cy,r/(MAP_LIMIT*2)*w,0,Math.PI*2);c.stroke();}
  const a=p(7800,0),b=p(1760,0);c.strokeStyle="#92999f";c.lineWidth=5;c.beginPath();c.moveTo(a.x,a.y);c.lineTo(b.x,b.y);c.stroke();
  const cr=1760/(MAP_LIMIT*2)*w;c.fillStyle="rgba(220,222,224,.82)";c.beginPath();c.arc(cx,cy,cr,0,Math.PI*2);c.fill();c.strokeStyle="rgba(232,218,185,.8)";c.lineWidth=2;c.stroke();
  pontosTP.forEach((tp,i)=>{const m=p(tp.x,tp.z);if(m.x<-12||m.x>w+12||m.y<-12||m.y>h+12)return;c.fillStyle="#e2c78e";c.beginPath();c.arc(m.x,m.y,8,0,Math.PI*2);c.fill();c.fillStyle="#171a1d";c.font="bold 10px Arial";c.textAlign="center";c.textBaseline="middle";c.fillText(String(i+1),m.x,m.y);});
  const jm=p(jogador.pos.x,jogador.pos.z);c.save();c.translate(jm.x,jm.y);c.rotate(-yaw+Math.PI/2);c.fillStyle="#70e1d0";c.beginPath();c.moveTo(0,-12);c.lineTo(8,9);c.lineTo(0,5);c.lineTo(-8,9);c.closePath();c.fill();c.restore();
  c.fillStyle="rgba(207,216,224,.78)";c.font="12px Arial";c.textAlign="left";c.fillText("N",cx+8,17);c.fillText("S",cx+8,h-7);c.fillText("O",7,cy-7);c.fillText("L",w-18,cy-7);
}
mapCanvas.addEventListener("click",e=>{
  const rect=mapCanvas.getBoundingClientRect(),mx=(e.clientX-rect.left)/rect.width*MAP_SIZE,my=(e.clientY-rect.top)/rect.height*MAP_SIZE;
  let nearest=-1,min=Infinity;
  pontosTP.forEach((tp,i)=>{const m=mundoParaMapa(tp.x,tp.z),d=(m.x-mx)**2+(m.y-my)**2;if(d<min){min=d;nearest=i;}});
  if(nearest>=0&&min<24*24)teleportarIndice(nearest);
});
document.querySelectorAll("[data-teleport]").forEach(btn=>btn.addEventListener("click",()=>teleportarPorId(btn.dataset.teleport)));

// Checklist saves manual ticks in localStorage, matching the persistent interaction
// used for the Ellesméra project. Actual progress is updated explicitly in commits.
document.querySelectorAll("#checklist input[data-check]").forEach(input=>{
  const key="tronjheim-check-"+input.dataset.check,saved=localStorage.getItem(key);
  if(saved!==null)input.checked=saved==="1";
  const label=input.closest("label");if(input.checked)label.classList.add("done");
  input.addEventListener("change",()=>{localStorage.setItem(key,input.checked?"1":"0");label.classList.toggle("done",input.checked);});
});

// Initial spawn at the crater-wall tunnel, facing inward toward the city.
jogador.pos.set(7800,alturaChao(7800,0)+jogador.alturaOlhos,0);
jogador.vel.set(0,0,0);yaw=Math.PI/2;pitch=0;alinharCamera();
document.getElementById("tpAtual").textContent="Entrada da montanha";

// simple starless cavern atmosphere: fine floating dust, deliberately subtle
function buildDust(){
  const n=1300, arr=new Float32Array(n*3);for(let i=0;i<n;i++){const a=Math.random()*Math.PI*2,r=900+Math.random()*6600;arr[i*3]=Math.cos(a)*r;arr[i*3+1]=100+Math.random()*4800;arr[i*3+2]=Math.sin(a)*r;}
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(arr,3));const m=new THREE.PointsMaterial({color:0xc4cbd0,size:2.5,transparent:true,opacity:.18,sizeAttenuation:true});scene.add(new THREE.Points(g,m));
}
buildDust();

let mapaTimer=0;
function animate(){requestAnimationFrame(animate);const dt=Math.min(clock.getDelta(),.05);atualizarJogador(dt);mapaTimer+=dt;if(mapaTimer>.08){desenharMinimapa();mapaTimer=0;}renderer.render(scene,camera);}
animate();
window.addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);});
window.addEventListener('contextmenu',e=>e.preventDefault());
