import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';
const cookieName = 'ruleta_sesion';
const sessionSeconds = 60 * 60 * 8;
export function json(res,status,body){res.setHeader('Content-Type','application/json; charset=utf-8');res.setHeader('Cache-Control','no-store');return res.status(status).json(body);}
export function sameOrigin(req){
 const origin=req.headers.origin,host=req.headers['x-forwarded-host']||req.headers.host;
 if(!origin||typeof host!=='string'||!host)return false;
 try{const url=new URL(origin);return url.host===host&&(url.protocol==='https:'||(process.env.VERCEL_ENV!=='production'&&url.protocol==='http:'));}catch{return false;}
}
export function requirePost(req,res){if(req.method!=='POST'){json(res,405,{error:'Método no permitido.'});return false;}if(!sameOrigin(req)){json(res,403,{error:'Origen no permitido.'});return false;}return true;}
function hmac(value){const secret=process.env.SESSION_SECRET;if(!secret||secret.length<32)throw new Error('Falta SESSION_SECRET');return createHmac('sha256',secret).update(value).digest('hex');}
export function makeSession(){const value=`${Date.now()+sessionSeconds*1000}.${randomBytes(20).toString('hex')}`;return `${value}.${hmac(value)}`;}
export function sessionValid(req){
 const token=(req.headers.cookie||'').split(';').map(x=>x.trim()).find(x=>x.startsWith(cookieName+'='))?.slice(cookieName.length+1);
 if(!token)return false;const parts=token.split('.');if(parts.length!==3)return false;
 const [expires,nonce,sig]=parts;
 if(!/^\d{13}$/.test(expires)||!/^[a-f0-9]{40}$/.test(nonce)||!/^[a-f0-9]{64}$/.test(sig)||Number(expires)<Date.now())return false;
 return timingSafeEqual(Buffer.from(hmac(`${expires}.${nonce}`),'hex'),Buffer.from(sig,'hex'));
}
export function sessionCookie(token,req){const secure=process.env.VERCEL_ENV==='production'||req.headers['x-forwarded-proto']==='https';return `${cookieName}=${token}; HttpOnly; SameSite=Strict; Path=/api; Max-Age=${sessionSeconds}${secure?'; Secure':''}`;}
export function clearSessionCookie(req){return sessionCookie('',req).replace(`Max-Age=${sessionSeconds}`,'Max-Age=0');}
export function requireAdmin(req,res){if(!sessionValid(req)){json(res,401,{error:'Debés iniciar sesión como administrador.'});return false;}return true;}
export function passwordMatches(input){const password=process.env.ADMIN_PASSWORD;if(!password||password.length<12)throw new Error('Falta ADMIN_PASSWORD');const hash=s=>createHmac('sha256','ruleta-password-comparison').update(s).digest();return timingSafeEqual(hash(input),hash(password));}
export async function dbRpc(name,params={}){
 const endpoint=process.env.SUPABASE_URL,key=process.env.SUPABASE_SERVICE_ROLE_KEY;
 if(!endpoint||!key||!/^https:\/\//.test(endpoint))throw new Error('Faltan credenciales Supabase');
 const response=await fetch(`${endpoint.replace(/\/$/,'')}/rest/v1/rpc/${name}`,{method:'POST',headers:{apikey:key,Authorization:`Bearer ${key}`,'Content-Type':'application/json'},body:JSON.stringify(params),signal:AbortSignal.timeout(10000)});
 if(!response.ok){const data=await response.json().catch(()=>({}));const error=new Error(data.message||'Error de base de datos');error.code=data.code;throw error;}
 return response.json().catch(()=>null);
}
export function normalize(value,max=80){if(typeof value!=='string')return null;const text=value.normalize('NFC').trim().replace(/\s+/g,' ');if(text.length<2||text.length>max||/[<>\x00-\x1f\x7f]/u.test(text))return null;return text;}
export function handleError(res,error){console.error('Error de API:',error.code||error.name||'internal');if(error.code==='23505')return json(res,409,{error:'Esta persona ya está registrada con esos datos.'});return json(res,500,{error:'No fue posible completar la operación. Intentá de nuevo.'});}
