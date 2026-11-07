import {handleError,json,normalize,requirePost} from '../_lib/server.js';
import {registrar} from '../_lib/store.js';
export default async function handler(req,res){
 if(!requirePost(req,res))return;
 const {nombre,apellido,iglesia,contacto}=req.body||{};
 if(contacto)return json(res,200,{ok:true});
 const n=normalize(nombre,60),a=normalize(apellido,60),i=normalize(iglesia,100);
 if(!n||!a||!i)return json(res,400,{error:'Completá nombre, apellido e iglesia (mínimo 2 caracteres).'});
 try{const ok=await registrar(n,a,i);return ok?json(res,201,{ok:true}):json(res,409,{error:'Esta persona ya está registrada con esos datos.'});}catch(error){return handleError(res,error);}
}