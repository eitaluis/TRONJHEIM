// ============================================================================
// PLAYER, MOVEMENT, COLLISION AND NAVIGATION — Vol Turin / Dragonhold
// World unit = 1 meter. Eye height = 1.70 m. Vertical movement follows real stairs and floors.
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
  {id:"volTurinLower",nome:"Vol Turin — base",x:volTurinPointAtProgress(.018).x,z:volTurinPointAtProgress(.018).z,yaw:Math.PI-(VOL_TURIN_START_ANGLE+VOL_TURIN_TOTAL_ANGLE*.018),pitch:0,levelY:VOL_TURIN_BASE_Y+(Math.floor(.018*VOL_TURIN_STEP_COUNT)+1)*VOL_TURIN_STEP_RISE+1.7},
  {id:"volTurinUpper",nome:"Vol Turin — alto",x:volTurinPointAtProgress(.985).x,z:volTurinPointAtProgress(.985).z,yaw:Math.PI-(VOL_TURIN_START_ANGLE+VOL_TURIN_TOTAL_ANGLE*.985),pitch:0,levelY:VOL_TURIN_BASE_Y+(Math.floor(.985*VOL_TURIN_STEP_COUNT)+1)*VOL_TURIN_STEP_RISE+1.7},
  {id:"isidar",nome:"Isidar Mithrim — Star Rose",x:0,z:0,yaw:0,pitch:-.42,levelY:VOL_TURIN_TOP_Y+1.7},
  {id:"dragonhold",nome:"Dragonhold",x:0,z:-5.5,yaw:0,pitch:0,levelY:VOL_TURIN_TOP_Y+1.7},
  {id:"saphiraCave",nome:"Caverna de Saphira",x:Math.cos(4.72)*(DRAGONHOLD_OUTER_RADIUS+7),z:Math.sin(4.72)*(DRAGONHOLD_OUTER_RADIUS+7),yaw:Math.PI,pitch:0,levelY:VOL_TURIN_TOP_Y+DRAGONHOLD_CAVES.find(c=>c.id==="saphira").bottom+1.7},
  {id:"throneAccess",nome:"Escadaria do trono — norte",x:Math.cos(Math.PI+.31)*(CENTRAL_WALL_RADIUS-1.8),z:Math.sin(Math.PI+.31)*(CENTRAL_WALL_RADIUS-1.8),yaw:Math.PI+.31+Math.PI/2,pitch:0,levelY:ENTRY_HALL_FLOOR+1.7},
  {id:"throneAccessSouth",nome:"Escadaria do trono — sul",x:Math.cos(Math.PI-.31)*(CENTRAL_WALL_RADIUS-1.8),z:Math.sin(Math.PI-.31)*(CENTRAL_WALL_RADIUS-1.8),yaw:Math.PI-.31+Math.PI/2,pitch:0,levelY:ENTRY_HALL_FLOOR+1.7},
  {id:"throneRoom",nome:"Sala do Trono",x:-343,z:0,yaw:Math.PI/2,pitch:0,levelY:THRONE_ROOM_FLOOR+1.7},
  {id:"catacombs",nome:"Catacumbas dos anões",x:-700,z:DEPTHS_ROUTE_Z,yaw:Math.PI/2,pitch:0,levelY:depthsFloorAtXZ(-700,DEPTHS_ROUTE_Z)+1.7},
  {id:"deepLake",nome:"Lago subterrâneo",x:-900,z:DEPTHS_ROUTE_Z,yaw:Math.PI/2,pitch:-.04,levelY:depthsFloorAtXZ(-900,DEPTHS_ROUTE_Z)+1.7},
  {id:"councilEntrance",nome:"Sala do Conselho — acesso oeste",x:-526,z:0,yaw:Math.PI/2,pitch:0,levelY:ENTRY_HALL_FLOOR+1.7},
  {id:"councilRoom",nome:"Sala do Conselho",x:-586,z:0,yaw:Math.PI/2,pitch:0,levelY:ENTRY_HALL_FLOOR+1.7},
  {id:"libraryEntrance",nome:"Biblioteca — entrada",x:-621.5,z:0,yaw:Math.PI/2,pitch:0,levelY:LIBRARY_FLOOR+1.7},
  {id:"greatLibrary",nome:"Grande Biblioteca",x:LIBRARY_CENTER_X,z:0,yaw:Math.PI,pitch:0,levelY:LIBRARY_FLOOR+1.7},
  {id:"libraryGallery",nome:"Biblioteca — galerias superiores",x:LIBRARY_CENTER_X+17,z:12, yaw:Math.PI,pitch:0,levelY:LIBRARY_FLOOR+LIBRARY_LEVELS*LIBRARY_LEVEL_HEIGHT+1.7},
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
  {id:"deepHall",nome:"Grande corredor — interior",x:TRONJHEIM_GATE.hallEndX+28,z:0,yaw:Math.PI/2,pitch:0,levelY:ENTRY_HALL_FLOOR+1.7}
];
// M/N navigation starts from the location where the player is actually spawned.
indiceTP=Math.max(0,pontosTP.findIndex(p=>p.id==="approach"));
function alinharCamera(){camera.position.copy(jogador.pos);camera.rotation.order="YXZ";camera.rotation.set(pitch,yaw,0,"YXZ");}
let locationToastTimer=null;
function mostrarLocalAtual(p,index){
  const label=document.getElementById("locationToast");
  if(label){
    label.textContent="ÁREA "+String(index+1).padStart(2,"0")+" · "+p.nome;
    label.classList.add("show");
    if(locationToastTimer)clearTimeout(locationToastTimer);
    locationToastTimer=setTimeout(()=>label.classList.remove("show"),2800);
  }
  document.getElementById("modeLabel").textContent="Local: "+p.nome;
  document.getElementById("tpAtual").textContent=p.nome;
}
function resetarTeclasJogador(){for(const code of Object.keys(teclas))teclas[code]=false;}
function teleportarIndice(i){
  indiceTP=(i+pontosTP.length)%pontosTP.length;const p=pontosTP[indiceTP];
  resetarTeclasJogador();
  jogador.pos.set(p.x,p.levelY!==undefined?p.levelY:alturaChao(p.x,p.z)+jogador.alturaOlhos,p.z);
  jogador.vel.set(0,0,0);jogador.noChao=true;vooLivre=false;yaw=p.yaw;pitch=p.pitch;alinharCamera();
  mostrarLocalAtual(p,indiceTP);
}
function teleportarPorId(id){const i=pontosTP.findIndex(p=>p.id===id);if(i>=0)teleportarIndice(i);}
function inspecionarPortao(){
  resetarTeclasJogador();
  jogador.pos.set(TRONJHEIM_GATE.facadeX+82,alturaChao(TRONJHEIM_GATE.facadeX+82,0)+jogador.alturaOlhos,0);
  jogador.vel.set(0,0,0);jogador.noChao=true;vooLivre=false;yaw=Math.PI/2;pitch=-.12;alinharCamera();
  indiceTP=Math.max(0,pontosTP.findIndex(p=>p.id==="gate"));
  mostrarLocalAtual(pontosTP[indiceTP],indiceTP);
  document.getElementById("modeLabel").textContent="Inspeção: fachada e portão";
}
function solicitarPointerLock(){renderer.domElement.requestPointerLock?.();}
function limparTeclas(){
  for(const code of Object.keys(teclas))teclas[code]=false;
  jogador.vel.x=0;jogador.vel.z=0;
}
document.addEventListener("pointerlockchange",()=>{
  travado=document.pointerLockElement===renderer.domElement;
  limparTeclas();
  if(travado)iniciou=true;
  document.getElementById("start").style.display=(travado||iniciou)?"none":"grid";
});
window.addEventListener("blur",limparTeclas);
document.addEventListener("visibilitychange",()=>{if(document.hidden)limparTeclas();});
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
  const plainShortcut=travado&&!e.repeat&&!e.shiftKey&&!e.ctrlKey&&!e.altKey&&!e.metaKey;
  if(travado&&["KeyW","KeyA","KeyS","KeyD","ArrowUp","ArrowDown","ArrowLeft","ArrowRight","Space"].includes(e.code))
    e.preventDefault();
  if(plainShortcut&&(e.code==="KeyM"||e.code==="KeyN"))e.preventDefault();
  if(plainShortcut&&e.code==="KeyM")teleportarIndice(indiceTP+1);
  if(plainShortcut&&e.code==="KeyN")teleportarIndice(indiceTP-1);
  if(e.code==="KeyG"&&!e.repeat)inspecionarPortao();
  if(e.code==="KeyF"&&!e.repeat){
    vooLivre=!vooLivre;
    jogador.vel.y=0;
    if(!vooLivre)jogador.noChao=false;
    document.getElementById("modeLabel").textContent="Modo: "+(vooLivre?"voo livre · Espaço sobe · Ctrl desce":"exploração");
  }
  if(e.code==="KeyV"&&!e.repeat)alternarInspecao();
  if(e.code==="Tab"&&!e.repeat){mapaVisivel=!mapaVisivel;atualizarVisibilidadeMapa();}
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
  const inEastHall=x>=TRONJHEIM_GATE.hallEndX-3 && x<=TRONJHEIM_GATE.doorX-3 && Math.abs(z)<=38.8;
  const inHallSideRoom=entryHallSideRoomContains(x,z);
  const inGateThroat=x>=TRONJHEIM_GATE.doorX-6 && x<=CITY.radius+3 && Math.abs(z)<=11.5;
  const branchStart=SIDE_CORRIDOR_START,branchEnd=SIDE_CORRIDOR_START+SIDE_CORRIDOR_LENGTH-2;
  const half=SIDE_CORRIDOR_HALF_WIDTH;
  const inNorth=z<=-branchStart && z>=-branchEnd && Math.abs(x)<=half;
  const inSouth=z>=branchStart && z<=branchEnd && Math.abs(x)<=half;
  const inWest=x<=-branchStart && x>=-branchEnd && Math.abs(z)<=half;
  const inUpperRoom=dragonholdWalkableContains(x,z)||isDragonholdExitBridge(x,z);
  const inThroneRoom=throneRoomWalkableContains(x,z);
  const inCouncilRoom=councilRoomWalkableContains(x,z);
  const inLibrary=libraryWalkableContains(x,z);
  const inDepths=depthsWalkableContains(x,z);
  return inChamber||inEastHall||inHallSideRoom||inGateThroat||inNorth||inSouth||inWest||inUpperRoom||inThroneRoom||inCouncilRoom||inLibrary||inDepths;
}
function podeOcuparXZ(x,z){
  const r=Math.hypot(x,z);
  if(r>8075-jogador.raio)return false;
  // Free flight is deliberately noclip: the player must keep horizontal
  // movement even when above floors, stairs, rails or architectural openings.
  if(vooLivre)return true;
  const feetY=jogador.pos.y-jogador.alturaOlhos;
  // The throne junction and cave floor are lower levels. Do not let their
  // floor zones catch a player who is still crossing the upper central chamber.
  const atThroneJunction=x>=-180 && x<=-160 && Math.abs(z)<=8.2;
  if(atThroneJunction && feetY>ENTRY_HALL_FLOOR-7.2+2.25)return false;
  const insideThroneCave=x>=THRONE_ROOM_MIN_X && x<=THRONE_ROOM_MAX_X &&
    Math.abs(z)<=THRONE_ROOM_HALF_WIDTH-.8;
  if(insideThroneCave && feetY>THRONE_ROOM_FLOOR+2.25)return false;
  // Use the mountain's actual cross-section at this height, not its maximum
  // base radius. Otherwise an invisible 3.5 km cylinder traps the player
  // outside the narrowing marble wall.
  const cityT=THREE.MathUtils.clamp((feetY+8)/CITY.height,0,1);
  const exteriorLimit=cityRadius(cityT)-jogador.raio;
  if(r<exteriorLimit && !dentroDaArquitetura(x,z))return false;
  const onVolTurin=volTurinFloorAtXZ(x,z,feetY);
  const dragonFloor=dragonholdFloorAtXZ(x,z,feetY);
  const inDragonhold=feetY>=VOL_TURIN_TOP_Y-2 && dragonholdWalkableContains(x,z);
  const onExitBridge=feetY>=VOL_TURIN_TOP_Y-2 && isDragonholdExitBridge(x,z);

  // Above the chamber floor, the only walkable route is the actual spiral stair,
  // its top landing, or the Dragonhold/caves. The open shaft is not an invisible floor.
  if(r<160 && feetY>ENTRY_HALL_FLOOR+5 && feetY<VOL_TURIN_TOP_Y-2){
    if(onVolTurin===null || Math.abs(onVolTurin-feetY)>Math.max(.62,VOL_TURIN_STEP_RISE*3))return false;
    const t=THREE.MathUtils.clamp((feetY-(VOL_TURIN_BASE_Y+110))/(CENTRAL_CHAMBER_TOP_Y-(VOL_TURIN_BASE_Y+110)),0,1);
    const wallR=THREE.MathUtils.lerp(VOL_TURIN_WALL_BASE_RADIUS,VOL_TURIN_WALL_TOP_RADIUS,t);
    if(r>wallR-1.7)return false;
  }
  if(feetY>=VOL_TURIN_TOP_Y-2 && !inDragonhold && !onExitBridge && onVolTurin===null)return false;

  // The library uses explicit support surfaces at every level. Shelves,
  // columns and the empty shaft between galleries are not walkable; only the
  // ground floor, ring galleries, short landings and the three spiral stairs are.
  if(libraryWalkableContains(x,z)){
    const gallery=libraryFloorAtXZ(x,z,feetY);
    const stair=libraryStairFloorAtXZ(x,z,feetY);
    if(gallery===null && stair===null)return false;
  }

  // Deep tunnels and chambers have their own continuous floor profile.
  const deepFloor=depthsFloorAtXZ(x,z);
  if(deepFloor!==null && Math.abs(deepFloor-feetY)<=2.65)return true;
  // Below the central chamber, walking is permitted only on modeled stairs,
  // the throne-room floor, or the newly connected deep route.
  if(feetY<ENTRY_HALL_FLOOR-2.5){
    const throneFloor=throneRoomFloorAtXZ(x,z,feetY);
    const stairFloor=throneRoomStairFloorAtXZ(x,z,null);
    const supported=throneFloor!==null&&Math.abs(throneFloor-feetY)<=2.65 ||
      stairFloor!==null&&Math.abs(stairFloor-feetY)<=2.65 ||
      deepFloor!==null&&Math.abs(deepFloor-feetY)<=2.65 ||
      dragonFloor!==null&&Math.abs(dragonFloor-feetY)<=2.65;
    if(!supported)return false;
  }
  return true;
}
function alturaPisoNaPosicao(x,z){
  const feetY=jogador.pos.y-jogador.alturaOlhos;

  // Resolve vertically separated architecture by its own physical support.
  // A missing local tread must never fall back to the central floor, which
  // previously snapped the player into a different room/level.
  const dragonFloor=dragonholdFloorAtXZ(x,z,feetY);
  if(dragonFloor!==null)return dragonFloor;

  const libraryStair=libraryStairFloorAtXZ(x,z,feetY);
  if(libraryStair!==null)return libraryStair;
  const libraryFloor=libraryFloorAtXZ(x,z,feetY);
  if(libraryFloor!==null)return libraryFloor;

  const councilFloor=councilRoomFloorAtXZ(x,z);
  if(councilFloor!==null)return councilFloor;

  const deepFloor=depthsFloorAtXZ(x,z);
  if(deepFloor!==null)return deepFloor;

  const throneFloor=throneRoomFloorAtXZ(x,z,feetY);
  if(throneFloor!==null)return throneFloor;
  // If the player is inside the geometric footprint of a tread, resolve that
  // tread directly rather than snapping to the upper chamber when vertical
  // error temporarily exceeds the contact tolerance.
  const nearbyThroneTread=throneRoomStairFloorAtXZ(x,z,null);
  if(nearbyThroneTread!==null)return nearbyThroneTread;

  const volFloor=volTurinFloorAtXZ(x,z,feetY);
  if(volFloor!==null)return volFloor;

  const inCentralChamber=Math.hypot(x,z)<=CENTRAL_WALL_RADIUS-2.2;
  const inEastHall=x>=TRONJHEIM_GATE.hallEndX-3 && x<=TRONJHEIM_GATE.doorX-3 && Math.abs(z)<=38.8;
  const inGateThroat=x>=TRONJHEIM_GATE.doorX-6 && x<=CITY.radius+3 && Math.abs(z)<=11.5;
  const inSideCorridor=(Math.abs(x)<=SIDE_CORRIDOR_HALF_WIDTH &&
    Math.abs(z)>=SIDE_CORRIDOR_START && Math.abs(z)<=SIDE_CORRIDOR_START+SIDE_CORRIDOR_LENGTH-2) ||
    (x<=-SIDE_CORRIDOR_START && x>=-(SIDE_CORRIDOR_START+SIDE_CORRIDOR_LENGTH-2) && Math.abs(z)<=SIDE_CORRIDOR_HALF_WIDTH);
  const inThroneLanding=x>=-180 && x<=-160 && Math.abs(z)<=8.2;
  const inThroneCave=x>=THRONE_ROOM_MIN_X && x<=THRONE_ROOM_MAX_X &&
    Math.abs(z)<=THRONE_ROOM_HALF_WIDTH-.8;
  const inThronePortal=throneAccessVestibuleContains(x,z);
  if(inCentralChamber||inEastHall||inGateThroat||inSideCorridor||inThroneLanding||inThroneCave||inThronePortal)
    return ENTRY_HALL_FLOOR;

  return alturaChao(x,z);
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
  // Slightly quicker exploration speeds, while preserving controllable movement.
  // Free-flight is also restrained so inspection of vertical spaces stays controllable.
  const velocidade=vooLivre?230:(correndo?145:80);
  jogador.vel.x=THREE.MathUtils.damp(jogador.vel.x,direcao.x*velocidade,vooLivre?12:24,dt);
  jogador.vel.z=THREE.MathUtils.damp(jogador.vel.z,direcao.z*velocidade,vooLivre?12:24,dt);
  // Swept substeps prevent the high requested speed from tunnelling through walls.
  const dx=jogador.vel.x*dt,dz=jogador.vel.z*dt;
  const distance=Math.hypot(dx,dz);
  const feetBeforeMove=jogador.pos.y-jogador.alturaOlhos;
  const nearVolTurin=Math.hypot(jogador.pos.x,jogador.pos.z)<230 &&
    feetBeforeMove>ENTRY_HALL_FLOOR+.2 && feetBeforeMove<VOL_TURIN_TOP_Y+1;
  const maxSubstep=nearVolTurin?.32:.9;
  const steps=Math.max(1,Math.ceil(distance/maxSubstep));
  for(let step=0;step<steps;step++){
    const sx=dx/steps,sz=dz/steps;
    const nx=jogador.pos.x+sx,nz=jogador.pos.z+sz;
    if(podeOcuparXZ(nx,nz)){
      jogador.pos.x=nx;jogador.pos.z=nz;
    }else{
      // When walking along the outside face of the marble mountain, project
      // the attempted movement onto the tangent of the wall. This preserves
      // lateral exploration without allowing the player to enter the stone.
      const currentR=Math.hypot(jogador.pos.x,jogador.pos.z);
      const feetY=jogador.pos.y-jogador.alturaOlhos;
      const cityT=THREE.MathUtils.clamp((feetY+8)/CITY.height,0,1);
      const wallR=cityRadius(cityT)-jogador.raio;
      let slid=false;
      if(currentR>0 && currentR>=wallR-.75 && Math.hypot(nx,nz)<wallR){
        const normalX=jogador.pos.x/currentR,normalZ=jogador.pos.z/currentR;
        const inward=Math.min(0,sx*normalX+sz*normalZ);
        const slideX=sx-inward*normalX,slideZ=sz-inward*normalZ;
        const slideTargetX=jogador.pos.x+slideX,slideTargetZ=jogador.pos.z+slideZ;
        if(Math.hypot(slideX,slideZ)>.015 && podeOcuparXZ(slideTargetX,slideTargetZ)){
          jogador.pos.x=slideTargetX;jogador.pos.z=slideTargetZ;slid=true;
        }
      }
      if(!slid){
        if(podeOcuparXZ(nx,jogador.pos.z))jogador.pos.x=nx;
        if(podeOcuparXZ(jogador.pos.x,nz))jogador.pos.z=nz;
      }
    }
    // Follow each physical tread during fast movement instead of updating height
    // only after the whole frame. This prevents the player from skipping levels.
    if(!vooLivre){
      const currentFeet=jogador.pos.y-jogador.alturaOlhos;
      const stairFloor=volTurinFloorAtXZ(jogador.pos.x,jogador.pos.z,currentFeet);
      const libraryStairFloor=libraryStairFloorAtXZ(jogador.pos.x,jogador.pos.z,currentFeet);
      const activeStairFloor=libraryStairFloor!==null?libraryStairFloor:stairFloor;
      if(jogador.noChao && activeStairFloor!==null &&
         Math.abs(activeStairFloor-currentFeet)<Math.max(.68,VOL_TURIN_STEP_RISE*3.2)){
        jogador.pos.y=activeStairFloor+jogador.alturaOlhos;
        jogador.vel.y=0;
      }
    }
  }
  limitarAoInterior(jogador.pos);
  if(vooLivre){
    const subir=teclas.Space||teclas.KeyE;
    const descer=teclas.ControlLeft||teclas.ControlRight||teclas.KeyQ;
    if(subir!==descer)jogador.pos.y+=(subir?1:-1)*velocidade*dt;
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

// Localização contextual: o nome acompanha o espaço físico em que o jogador
// está, sem provocar teleporte ou alterar suas coordenadas.
let areaCandidata=null,areaTempoEstavel=0,areaAtualId="approach";
function detectarAreaAtual(){
  const x=jogador.pos.x,z=jogador.pos.z,feetY=jogador.pos.y-jogador.alturaOlhos,r=Math.hypot(x,z);
  const saphira=DRAGONHOLD_CAVES.find(c=>c.id==="saphira");
  if(dragonholdCaveContains(x,z,saphira))return ["saphira","Caverna de Saphira"];
  const otherCave=DRAGONHOLD_CAVES.find(c=>c.id!=="saphira"&&dragonholdCaveContains(x,z,c));
  if(otherCave)return ["dragon-caves","Cavernas do Dragonhold"];
  if(dragonholdSaphiraApproachContains(x,z))return ["saphira-access","Acesso à Caverna de Saphira"];
  if(feetY>=VOL_TURIN_TOP_Y-2 && dragonholdWalkableContains(x,z))return ["dragonhold","Dragonhold · Isidar Mithrim"];
  if(volTurinFloorAtXZ(x,z,feetY)!==null)return ["vol-turin","Vol Turin"];
  if(x>=THRONE_ROOM_MIN_X&&x<=THRONE_ROOM_MAX_X&&Math.abs(z)<=THRONE_ROOM_HALF_WIDTH-.8)
    return ["throne-room","Sala do Trono"];
  if(throneRoomStairFloorAtXZ(x,z,null)!==null)return ["throne-stairs","Escadarias da Sala do Trono"];
  if(throneAccessVestibuleContains(x,z))return ["throne-portal","Portal da Sala do Trono"];
  if(depthsWalkableContains(x,z)){
    if(Math.hypot(x+900,z-DEPTHS_ROUTE_Z)<=79.5)return ["deep-lake","Lago subterrâneo"];
    if(Math.hypot(x+700,z-DEPTHS_ROUTE_Z)<=52.5)return ["catacombs","Catacumbas dos Anões"];
    if(x<=-982&&x>=DEPTHS_LAKE_EXIT_END_X)return ["deep-exit","Túnel das Profundezas"];
    return ["deep-tunnel","Túneis subterrâneos"];
  }
  if(councilRoomWalkableContains(x,z)){
    if(Math.hypot(x-COUNCIL_ROOM_CENTER_X,z-COUNCIL_ROOM_CENTER_Z)<=COUNCIL_ROOM_RADIUS+.8)
      return ["council","Sala do Conselho"];
    return ["council-passage","Passagem do Conselho"];
  }
  if(libraryWalkableContains(x,z)){
    if(Math.hypot(x-LIBRARY_CENTER_X,z-LIBRARY_CENTER_Z)<=LIBRARY_RADIUS+1)
      return ["library","Grande Biblioteca"];
    return ["library-passage","Passagem da Biblioteca"];
  }
  if(x>=-180&&x<=-160&&Math.abs(z)<=8.2)return ["throne-landing","Patamar das Escadarias do Trono"];
  if(r<=CENTRAL_WALL_RADIUS-2.2)return ["central-chamber","Câmara Central"];
  if(x>=TRONJHEIM_GATE.hallEndX-3&&x<=TRONJHEIM_GATE.doorX-3&&Math.abs(z)<=38.8)
    return ["entry-hall","Grande Corredor de Entrada"];
  if(Math.abs(x)<=SIDE_CORRIDOR_HALF_WIDTH&&Math.abs(z)>=SIDE_CORRIDOR_START&&Math.abs(z)<=SIDE_CORRIDOR_START+SIDE_CORRIDOR_LENGTH)
    return [z<0?"north-hall":"south-hall",z<0?"Corredor Norte":"Corredor Sul"];
  if(x<=-SIDE_CORRIDOR_START&&x>=-(SIDE_CORRIDOR_START+SIDE_CORRIDOR_LENGTH)&&Math.abs(z)<=SIDE_CORRIDOR_HALF_WIDTH)
    return ["west-hall","Corredor Oeste"];
  if(x>=-2750&&x<=-2450&&Math.abs(z-350)<=180)return ["training-ground","Campo de Treinamento"];
  if(x>=TRONJHEIM_GATE.doorX-75&&x<=TRONJHEIM_GATE.doorX+40&&Math.abs(z)<=32)
    return ["gate","Portão de Tronjheim"];
  if(Math.hypot(x,z)>CITY.radius)return ["farthen-dur","Cavidade de Farthen Dûr"];
  return ["approach","Caminho de Aproximação"];
}
function atualizarRotuloDeArea(dt){
  if(vooLivre||vistaInspecao)return;
  const detected=detectarAreaAtual();
  if(detected[0]===areaCandidata)areaTempoEstavel+=dt;
  else{areaCandidata=detected[0];areaTempoEstavel=0;}
  if(areaTempoEstavel<.24||detected[0]===areaAtualId)return;
  areaAtualId=detected[0];
  const label=document.getElementById("tpAtual");
  if(label)label.textContent=detected[1];
  const mode=document.getElementById("modeLabel");
  if(mode)mode.textContent="Modo: exploração · "+detected[1];
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
  const nearby=pontosTP.map((tp,i)=>{
    const m=mundoParaMapa(tp.x,tp.z);
    return {i,d:(m.x-mx)**2+(m.y-my)**2};
  }).filter(item=>item.d<24*24).sort((a,b)=>a.d-b.d);
  if(!nearby.length)return;
  // A 2D minimap cannot distinguish vertically stacked places such as the
  // central chamber, Isidar Mithrim and Dragonhold. Never guess between them.
  if(nearby.length>1 && Math.sqrt(nearby[1].d)-Math.sqrt(nearby[0].d)<2.4){
    const label=document.getElementById("locationToast");
    if(label){
      label.textContent="VÁRIOS NÍVEIS NESTE PONTO · USE M/N OU A LISTA DE LOCAIS";
      label.classList.add("show");
      if(locationToastTimer)clearTimeout(locationToastTimer);
      locationToastTimer=setTimeout(()=>label.classList.remove("show"),3200);
    }
    return;
  }
  teleportarIndice(nearby[0].i);
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

// Initial spawn on the central approach, close enough to read the complete city silhouette.
jogador.pos.set(4650,alturaChao(4650,0)+jogador.alturaOlhos,0);
jogador.vel.set(0,0,0);yaw=Math.PI/2;pitch=.08;alinharCamera();
document.getElementById("tpAtual").textContent="Caminho central — vista de Tronjheim";

// simple starless cavern atmosphere: fine floating dust, deliberately subtle
function buildDust(){
  const n=1300, arr=new Float32Array(n*3);for(let i=0;i<n;i++){const a=Math.random()*Math.PI*2,r=900+Math.random()*6600;arr[i*3]=Math.cos(a)*r;arr[i*3+1]=100+Math.random()*4800;arr[i*3+2]=Math.sin(a)*r;}
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(arr,3));const m=new THREE.PointsMaterial({color:0xc4cbd0,size:2.5,transparent:true,opacity:.18,sizeAttenuation:true});scene.add(new THREE.Points(g,m));
}
buildDust();

let mapaTimer=0,areaTimer=0;
function animate(){
  requestAnimationFrame(animate);
  const dt=Math.min(clock.getDelta(),.05);
  atualizarJogador(dt);
  mapaTimer+=dt;areaTimer+=dt;
  if(mapaTimer>.08){desenharMinimapa();mapaTimer=0;}
  if(areaTimer>.12){atualizarRotuloDeArea(areaTimer);areaTimer=0;}
  renderer.render(scene,camera);
}
animate();
window.addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);});
window.addEventListener('contextmenu',e=>e.preventDefault());
