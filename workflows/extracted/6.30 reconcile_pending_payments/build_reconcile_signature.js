// === ARCHIVO GENERADO -- NO EDITAR ===
// Extraido de: 6.30 reconcile_pending_payments  (workflow id nRnyi0HdNMaYFFeC)
// Nodo:        build_reconcile_signature
//
// La fuente de verdad es el JSON del workflow en workflows/exports/.
// Editar este archivo no tiene ningun efecto. Regenerar con:
//   node scripts/extract_workflow_code.js
// =====================================

function sha256(data) {
  const H=[0x6a09e667,0xbb67ae85,0x3c6ef372,0xa54ff53a,0x510e527f,0x9b05688c,0x1f83d9ab,0x5be0cd19];
  const K=[0x428a2f98,0x71374491,0xb5c0fbcf,0xe9b5dba5,0x3956c25b,0x59f111f1,0x923f82a4,0xab1c5ed5,0xd807aa98,0x12835b01,0x243185be,0x550c7dc3,0x72be5d74,0x80deb1fe,0x9bdc06a7,0xc19bf174,0xe49b69c1,0xefbe4786,0x0fc19dc6,0x240ca1cc,0x2de92c6f,0x4a7484aa,0x5cb0a9dc,0x76f988da,0x983e5152,0xa831c66d,0xb00327c8,0xbf597fc7,0xc6e00bf3,0xd5a79147,0x06ca6351,0x14292967,0x27b70a85,0x2e1b2138,0x4d2c6dfc,0x53380d13,0x650a7354,0x766a0abb,0x81c2c92e,0x92722c85,0xa2bfe8a1,0xa81a664b,0xc24b8b70,0xc76c51a3,0xd192e819,0xd6990624,0xf40e3585,0x106aa070,0x19a4c116,0x1e376c08,0x2748774c,0x34b0bcb5,0x391c0cb3,0x4ed8aa4a,0x5b9cca4f,0x682e6ff3,0x748f82ee,0x78a5636f,0x84c87814,0x8cc70208,0x90befffa,0xa4506ceb,0xbef9a3f7,0xc67178f2];
  function rotr(x,n){return(x>>>n)|(x<<(32-n));}
  const len=data.length,bitLen=len*8;
  const blocks=Math.ceil((len+9)/64);
  const w=new Array(blocks*16).fill(0);
  for(let i=0;i<len;i++) w[i>>2]|=data[i]<<(24-(i%4)*8);
  w[len>>2]|=0x80<<(24-(len%4)*8);
  w[blocks*16-2]=(bitLen/0x100000000)|0; w[blocks*16-1]=bitLen>>>0;
  const h=[...H];
  for(let b=0;b<blocks;b++){
    const m=w.slice(b*16,b*16+16),s=new Array(64);
    for(let i=0;i<16;i++) s[i]=m[i];
    for(let i=16;i<64;i++){const s0=rotr(s[i-15],7)^rotr(s[i-15],18)^(s[i-15]>>>3);const s1=rotr(s[i-2],17)^rotr(s[i-2],19)^(s[i-2]>>>10);s[i]=(s[i-16]+s0+s[i-7]+s1)>>>0;}
    let [a,b2,c,d,e,f,g,hh]=h;
    for(let i=0;i<64;i++){const S1=rotr(e,6)^rotr(e,11)^rotr(e,25);const ch=(e&f)^(~e&g);const t1=(hh+S1+ch+K[i]+s[i])>>>0;const S0=rotr(a,2)^rotr(a,13)^rotr(a,22);const maj=(a&b2)^(a&c)^(b2&c);const t2=(S0+maj)>>>0;hh=g;g=f;f=e;e=(d+t1)>>>0;d=c;c=b2;b2=a;a=(t1+t2)>>>0;}
    h[0]=(h[0]+a)>>>0;h[1]=(h[1]+b2)>>>0;h[2]=(h[2]+c)>>>0;h[3]=(h[3]+d)>>>0;h[4]=(h[4]+e)>>>0;h[5]=(h[5]+f)>>>0;h[6]=(h[6]+g)>>>0;h[7]=(h[7]+hh)>>>0;
  }
  return h;
}
function strToBytes(s){const b=[];for(let i=0;i<s.length;i++){const c=s.charCodeAt(i);if(c<128)b.push(c);else if(c<2048){b.push(192|(c>>6));b.push(128|(c&63));}else{b.push(224|(c>>12));b.push(128|((c>>6)&63));b.push(128|(c&63));}}return b;}
function hmacHex(msg,key){
  let kb=strToBytes(key);
  if(kb.length>64) kb=sha256(kb).reduce((a,v)=>{a.push((v>>24)&0xff,(v>>16)&0xff,(v>>8)&0xff,v&0xff);return a;},[]);
  const ip=kb.map(v=>v^0x36),op=kb.map(v=>v^0x5c);
  while(ip.length<64)ip.push(0x36); while(op.length<64)op.push(0x5c);
  const inner=sha256([...ip,...strToBytes(msg)]);
  const ib=inner.reduce((a,v)=>{a.push((v>>24)&0xff,(v>>16)&0xff,(v>>8)&0xff,v&0xff);return a;},[]);
  return sha256([...op,...ib]).map(v=>v.toString(16).padStart(8,'0')).join('');
}

const d = $json;
const flowOrder = d.flow_order_id || "";

const flowApiKey = $env.FLOW_API_KEY || "";
const flowSecretKey = $env.FLOW_SECRET_KEY || "";
const flowApiUrl = $env.FLOW_API_URL || "https://www.flow.cl/api";

const statusParams = { apiKey: flowApiKey, flowOrder: String(flowOrder) };
const sortedKeys = Object.keys(statusParams).sort();
const sigString = sortedKeys.map(k => k + statusParams[k]).join("");
const signature = hmacHex(sigString, flowSecretKey);

return [{
  ...d,
  flow_status_url: flowApiUrl + "/payment/getStatusByFlowOrder",
  status_params: { apiKey: flowApiKey, flowOrder: String(flowOrder), s: signature }
}];
