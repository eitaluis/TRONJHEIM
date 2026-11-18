// ============================================================================
// TRONJHEIM — FASE 1
// [LIVRO] Valores e elementos citados diretamente em Eragon/Eldest.
// [DERIVADO] Conversões de milhas/pés para metros.
// [INTERPRETAÇÃO] Forma do relevo, distribuição de detalhes e medidas não
// especificadas diretamente. Nenhuma interpretação abaixo deve ser confundida
// com planta oficial ou descrição exata do autor.
// Unidade de mundo: 1 unidade = 1 metro.
// ============================================================================

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x263642);
scene.fog = new THREE.FogExp2(0x354650, 0.000018);
const camera = new THREE.PerspectiveCamera(72, innerWidth/innerHeight, 0.1, 30000);
camera.position.set(5300, 2.0, 280);
camera.rotation.order = 'YXZ';
const renderer = new THREE.WebGLRenderer({antialias:true, powerPreference:'high-performance'});
renderer.setPixelRatio(Math.min(devicePixelRatio, 1.65));
renderer.setSize(innerWidth, innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.28;
document.body.appendChild(renderer.domElement);

const hemi = new THREE.HemisphereLight(0xc2d0dc, 0x55504a, 1.15); scene.add(hemi);
const fill = new THREE.AmbientLight(0xb5c1ca, 0.52); scene.add(fill);
const apertureLight = new THREE.DirectionalLight(0xe0edf5, 2.8);
apertureLight.position.set(-1200, 19000, -900); apertureLight.castShadow = false; scene.add(apertureLight);
const warmBounce = new THREE.DirectionalLight(0xffd9ad, 1.05);
warmBounce.position.set(2600, 920, 1800); warmBounce.castShadow = false; scene.add(warmBounce);
const cityGlow = new THREE.PointLight(0xe8d1a8, 2600, 6200, 1.7); cityGlow.position.set(0, 520, 0); scene.add(cityGlow);

const MAT = {};
MAT.marble = new THREE.MeshStandardMaterial({color:0xd7d9d9, roughness:0.33, metalness:0.04, map:makeMarbleTexture()});
MAT.marbleLight = new THREE.MeshStandardMaterial({color:0xe5e4dc, roughness:0.28, metalness:0.03});
MAT.rock = new THREE.MeshStandardMaterial({color:0xffffff, roughness:0.98, metalness:0.02, vertexColors:true, side:THREE.BackSide});
MAT.floor = new THREE.MeshStandardMaterial({color:0xffffff, roughness:0.97, metalness:0.02, vertexColors:true});
MAT.dark = new THREE.MeshStandardMaterial({color:0x171b20, roughness:0.9});
MAT.gold = new THREE.MeshStandardMaterial({color:0x9c793e, metalness:0.78, roughness:0.28});
MAT.lantern = new THREE.MeshStandardMaterial({color:0xf3d99e, emissive:0xe2a54f, emissiveIntensity:1.8, roughness:0.25});
MAT.ice = new THREE.MeshStandardMaterial({color:0xa9c9d8, roughness:0.18, metalness:0.12, transparent:true, opacity:0.82});
MAT.path = new THREE.MeshStandardMaterial({color:0x777b7d, roughness:0.85, metalness:0.06});

function makeMarbleTexture(){
  const c=document.createElement('canvas'); c.width=1024; c.height=512; const ctx=c.getContext('2d');
  ctx.fillStyle='#d4d5d1'; ctx.fillRect(0,0,c.width,c.height);
  let seed=81; const rand=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
  for(let i=0;i<45000;i++){const x=rand()*1024,y=rand()*512,a=rand()*0.075;ctx.fillStyle=`rgba(65,73,78,${a})`;ctx.fillRect(x,y,1+rand()*2,1+rand()*2);}
  for(let i=0;i<27;i++){
    const y=rand()*512; ctx.beginPath(); ctx.moveTo(-30,y);
    let yy=y; for(let x=0;x<=1080;x+=24){yy+=Math.sin(x*.012+i*1.7)*3+(rand()-.5)*5;ctx.lineTo(x,yy);}
    ctx.strokeStyle=`rgba(92,103,108,${0.08+rand()*.13})`;ctx.lineWidth=1+rand()*2;ctx.stroke();
  }
  const t=new THREE.CanvasTexture(c);t.wrapS=THREE.RepeatWrapping;t.wrapT=THREE.RepeatWrapping;t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=8;return t;
}

// deterministic smooth noise helpers
function hash(x,z){let n=Math.sin(x*127.1+z*311.7+18.17)*43758.5453;return n-Math.floor(n);}
function noise2(x,z){const ix=Math.floor(x),iz=Math.floor(z),fx=x-ix,fz=z-iz;const u=fx*fx*(3-2*fx),v=fz*fz*(3-2*fz);const a=hash(ix,iz),b=hash(ix+1,iz),c=hash(ix,iz+1),d=hash(ix+1,iz+1);return THREE.MathUtils.lerp(THREE.MathUtils.lerp(a,b,u),THREE.MathUtils.lerp(c,d,u),v)*2-1;}
function fbm(x,z){return noise2(x,z)*.55+noise2(x*2.4,z*2.4)*.27+noise2(x*5.7,z*5.7)*.13+noise2(x*12,z*12)*.05;}
