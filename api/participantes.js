import {handleError,json,requireAdmin} from '../_lib/server.js';
import {listar} from '../_lib/store.js';
export default async function handler(req,res){if(req.method!=='GET')return json(res,405,{error:'Método no permitido.'});if(!requireAdmin(req,res))return;try{return json(res,200,{participantes:await listar()});}catch(error){return handleError(res,error);}}