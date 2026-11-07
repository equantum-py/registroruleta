import {handleError,json,makeSession,passwordMatches,requirePost,sessionCookie} from '../_lib/server.js';
export default async function handler(req,res){
 if(!requirePost(req,res))return;
 const password=req.body?.password;
 if(typeof password!=='string'||password.length>300)return json(res,400,{error:'Contraseña inválida.'});
 try{if(!passwordMatches(password))return json(res,401,{error:'Contraseña incorrecta.'});res.setHeader('Set-Cookie',sessionCookie(makeSession(),req));return json(res,200,{ok:true});}catch(error){return handleError(res,error);}
}