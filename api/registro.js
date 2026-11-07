import {dbRpc,handleError,json,normalize,requirePost} from '../_lib/server.js';
export default async function handler(req,res){
 if(!requirePost(req,res))return;
 const {nombre,apellido,iglesia,contacto}=req.body||{};
 if(contacto)return json(res,200,{ok:true});
 const n=normalize(nombre,60),a=normalize(apellido,60),i=normalize(iglesia,100);
 if(!n||!a||!i)return json(res,400,{error:'Completá nombre, apellido e iglesia (mínimo 2 caracteres).'});
 try{await dbRpc('registrar_participante',{p_nombre:n,p_apellido:a,p_iglesia:i});return json(res,201,{ok:true});}catch(error){return handleError(res,error);}
}