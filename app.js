const form=document.querySelector('#registration-form');
const button=document.querySelector('#registration-button');
const status=document.querySelector('#registration-status');
const success=document.querySelector('#registration-success');
form.addEventListener('submit',async event=>{
 event.preventDefault();status.textContent='';
 if(!form.reportValidity())return;
 button.disabled=true;button.textContent='Registrando…';
 try{
  const data=Object.fromEntries(new FormData(form));
  const response=await fetch('/api/registro',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data)});
  const result=await response.json();
  if(!response.ok)throw new Error(result.error||'No se pudo completar el registro.');
  form.classList.add('hidden');success.classList.remove('hidden');
 }catch(error){status.textContent=error.message;}
 finally{button.disabled=false;button.textContent='¡Quiero participar! →';}
});