const $=s=>document.querySelector(s);
const canvas=$('#wheel-canvas'),ctx=canvas.getContext('2d'),TWO_PI=Math.PI*2;
const colors=['#17447f','#f6c15b','#147d83','#e67e55','#6d60ac','#75bda6','#e6a6b0','#2b6896'];
let participants=[],rotation=0,spinning=false,timer=null;
const visible=(selector,enabled)=>$(selector).classList.toggle('hidden',!enabled);
async function api(path,data){
 const response=await fetch('/api/'+path,data===undefined?{cache:'no-store'}:{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data)});
 const result=await response.json();
 if(!response.ok)throw Object.assign(new Error(result.error||'Error inesperado.'),{status:response.status});
 return result;
}
function drawWheel(){
 const eligible=participants.filter(p=>!p.sorteado),count=eligible.length;
 const middle=canvas.width/2,radius=middle-18;
 ctx.clearRect(0,0,canvas.width,canvas.height);ctx.save();ctx.translate(middle,middle);ctx.rotate(rotation);
 if(!count){
  ctx.beginPath();ctx.arc(0,0,radius,0,TWO_PI);ctx.fillStyle='#183b73';ctx.fill();
  ctx.fillStyle='#fff';ctx.font='bold 31px system-ui';ctx.textAlign='center';ctx.fillText('Sin participantes',0,12);
 }else{
  const arc=TWO_PI/count;
  eligible.forEach((p,index)=>{
   const start=index*arc-Math.PI/2,end=start+arc;
   ctx.beginPath();ctx.moveTo(0,0);ctx.arc(0,0,radius,start,end);ctx.closePath();
   ctx.fillStyle=colors[index%colors.length];ctx.fill();ctx.lineWidth=2;ctx.strokeStyle='#fff';ctx.stroke();
   ctx.save();ctx.rotate(start+arc/2);ctx.translate(Math.max(90,radius*.53),0);ctx.rotate(Math.PI/2);
   const display=`${p.nombre} ${p.apellido}`,fontSize=count>25?11:count>14?14:count>8?18:22;
   ctx.font=`700 ${fontSize}px system-ui`;ctx.textAlign='center';ctx.textBaseline='middle';
   ctx.fillStyle=index%colors.length===1?'#183156':'#fff';
   let label=display;
   while(ctx.measureText(label).width>Math.max(84,radius*.58)&&label.length>3)label=label.slice(0,-2)+'…';
   ctx.fillText(label,0,0);ctx.restore();
  });
 }
 ctx.restore();ctx.beginPath();ctx.arc(middle,middle,36,0,TWO_PI);ctx.fillStyle='#fff';ctx.fill();ctx.lineWidth=6;ctx.strokeStyle='#ecc16c';ctx.stroke();
 ctx.beginPath();ctx.arc(middle,middle,14,0,TWO_PI);ctx.fillStyle='#183b73';ctx.fill();
}
function renderList(){
 const eligible=participants.filter(p=>!p.sorteado);
 $('#total-count').textContent=participants.length;
 $('#pending-count').textContent=eligible.length;
 $('#picked-count').textContent=participants.length-eligible.length;
 const list=$('#participants');list.replaceChildren();
 participants.forEach(p=>{
  const li=document.createElement('li'),name=document.createElement('strong'),church=document.createElement('span');
  name.textContent=`${p.nombre} ${p.apellido}`;church.textContent=p.iglesia;li.append(name,church);
  if(p.sorteado){li.classList.add('was-picked');const badge=document.createElement('em');badge.textContent='Elegido';li.append(badge);}
  list.append(li);
 });
 if(!participants.length){const li=document.createElement('li');li.className='empty-list';li.textContent='Esperando los primeros registros…';list.append(li);}
 $('#spin').disabled=!eligible.length||spinning;
 $('#wheel-status').textContent=!eligible.length?'Esperando participantes disponibles.':`${eligible.length} participantes listos para el sorteo.`;
 if(!spinning)drawWheel();
}
async function refresh(){
 if(spinning)return;
 try{const result=await api('participantes');participants=result.participantes;renderList();}
 catch(error){if(error.status===401)return showLogin();$('#wheel-status').textContent='Error al actualizar. Usá el botón Actualizar.';}
}
function showLogin(){clearInterval(timer);timer=null;spinning=false;visible('#login-panel',true);visible('#wheel-panel',false);visible('#logout',false);}
function showWheel(){visible('#login-panel',false);visible('#wheel-panel',true);visible('#logout',true);refresh();clearInterval(timer);timer=setInterval(refresh,4000);}
$('#login-form').addEventListener('submit',async event=>{
 event.preventDefault();const button=event.target.querySelector('button');button.disabled=true;$('#login-status').textContent='';
 try{await api('login',{password:$('#password').value});$('#password').value='';showWheel();}
 catch(error){$('#login-status').textContent=error.message;}finally{button.disabled=false;}
});
$('#logout').addEventListener('click',async()=>{await api('logout',{}).catch(()=>{});showLogin();});
$('#refresh').addEventListener('click',refresh);
$('#reset').addEventListener('click',async()=>{
 if(spinning||!confirm('¿Querés habilitar nuevamente a TODOS para otro sorteo?'))return;
 try{await api('reiniciar',{confirmacion:'REINICIAR'});visible('#winner-panel',false);rotation=0;await refresh();}
 catch(error){alert(error.message);}
});
$('#spin').addEventListener('click',async()=>{
 if(spinning)return;const eligible=participants.filter(p=>!p.sorteado);if(!eligible.length)return;
 spinning=true;$('#spin').disabled=true;visible('#winner-panel',false);$('#wheel-status').textContent='¡La ruleta está girando!';
 try{
  const {ganador}=await api('sortear',{}),index=eligible.findIndex(p=>p.id===ganador.id);
  if(index<0){showWinner(ganador);spinning=false;await refresh();return;}
  const arc=TWO_PI/eligible.length,desired=-(index+.5)*arc;
  const currentNormalized=((rotation%TWO_PI)+TWO_PI)%TWO_PI,finalNormalized=((desired%TWO_PI)+TWO_PI)%TWO_PI;
  const extra=(finalNormalized-currentNormalized+TWO_PI)%TWO_PI,start=rotation,end=rotation+TWO_PI*6+extra,startTime=performance.now();
  await new Promise(resolve=>{
   function frame(now){const t=Math.min((now-startTime)/5200,1),eased=1-Math.pow(1-t,4);rotation=start+(end-start)*eased;drawWheel();if(t<1)requestAnimationFrame(frame);else resolve();}
   requestAnimationFrame(frame);
  });
  showWinner(ganador);spinning=false;await refresh();
 }catch(error){spinning=false;$('#wheel-status').textContent=error.message;await refresh();}
});
function showWinner(ganador){
 $('#winner-name').textContent=`${ganador.nombre} ${ganador.apellido}`;
 $('#winner-church').textContent=ganador.iglesia;visible('#winner-panel',true);
 $('#winner-panel').scrollIntoView({behavior:'smooth',block:'nearest'});
}
drawWheel();
api('participantes').then(({participantes:data})=>{participants=data;showWheel();}).catch(showLogin);