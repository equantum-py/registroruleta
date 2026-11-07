import {randomUUID} from 'node:crypto';
const KEY='conferencia-jovenes-2026:participantes';
const LOCK='conferencia-jovenes-2026:lock';
function credentials(){const url=process.env.KV_REST_API_URL||process.env.UPSTASH_REDIS_REST_URL;const token=process.env.KV_REST_API_TOKEN||process.env.UPSTASH_REDIS_REST_TOKEN;if(!url||!token||!url.startsWith('https://'))throw new Error('Falta configurar Redis REST en Vercel');return {url,token};}
async function command(...args){const {url,token}=credentials();const response=await fetch(url,{method:'POST',headers:{Authorization:'Bearer '+token,'Content-Type':'application/json'},body:JSON.stringify(args),cache:'no-store',signal:AbortSignal.timeout(9000)});if(!response.ok)throw new Error('No se pudo conectar con almacenamiento');const data=await response.json();if(data.error)throw new Error('Error en almacenamiento');return data.result;}
export async function registrar(nombre,apellido,iglesia){
 const participant={id:randomUUID(),nombre,apellido,iglesia,sorteado:false};
 const key=[nombre,apellido,iglesia].map(s=>s.normalize('NFC').trim().toLocaleLowerCase('es')).join('|');
 const result=await command('HSETNX',KEY,key,JSON.stringify(participant));
 if(result===0)return false;return true;
}
export async function listar(){const values=await command('HVALS',KEY);return (values||[]).map(v=>JSON.parse(v)).sort((a,b)=>(a.nombre+' '+a.apellido).localeCompare(b.nombre+' '+b.apellido,'es'));}
async function lock(){const token=randomUUID();for(let i=0;i<15;i++){if(await command('SET',LOCK,token,'NX','EX',8)==='OK')return token;await new Promise(r=>setTimeout(r,90));}throw new Error('Sorteo ocupado');}
async function unlock(token){await command('EVAL',"if redis.call('GET',KEYS[1]) == ARGV[1] then return redis.call('DEL',KEYS[1]) else return 0 end",1,LOCK,token);}
export async function sortear(){
 const token=await lock();
 try{const values=await command('HGETALL',KEY)||[];const entries=[];for(let i=0;i<values.length;i+=2){const p=JSON.parse(values[i+1]);if(!p.sorteado)entries.push({key:values[i],p});}
 if(!entries.length)return null;
 const chosen=entries[Math.floor(Math.random()*entries.length)];chosen.p.sorteado=true;
 await command('HSET',KEY,chosen.key,JSON.stringify(chosen.p));
 return chosen.p;
 }finally{await unlock(token).catch(()=>{});}
}
export async function reiniciar(){const token=await lock();try{const values=await command('HGETALL',KEY)||[];for(let i=0;i<values.length;i+=2){const p=JSON.parse(values[i+1]);if(p.sorteado){p.sorteado=false;await command('HSET',KEY,values[i],JSON.stringify(p));}}}finally{await unlock(token).catch(()=>{});}}
