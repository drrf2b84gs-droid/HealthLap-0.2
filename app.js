'use strict';
const STORAGE_KEY='healthLabData';
const THEME_KEY='healthLabTheme';
const $=id=>document.getElementById(id);
const clone=v=>JSON.parse(JSON.stringify(v));
const uid=prefix=>`${prefix}_${Date.now()}_${Math.random().toString(36).slice(2,7)}`;

const defaults={
  schemaVersion:4,
  appVersion:'1.0-rc1',
  profile:{name:'Luis'},
  supplements:[
    {id:'multi',name:'Multivitamínico',emoji:'💊',category:'health',enabled:true,order:1},
    {id:'omega3',name:'Omega-3',emoji:'🐟',category:'health',enabled:true,order:2},
    {id:'magnesium',name:'Magnesio',emoji:'🌙',category:'health',enabled:true,order:3},
    {id:'coq10',name:'CoQ10',emoji:'⚡',category:'health',enabled:true,order:4},
    {id:'creatine',name:'Creatina',emoji:'🏋️',category:'sport',enabled:true,order:5},
    {id:'whey',name:'Proteína whey',emoji:'🥛',category:'sport',enabled:true,order:6}
  ],
  medications:[
    {id:'hidroferol',name:'Hidroferol',emoji:'☀️',category:'health',enabled:true,order:1}
  ],
  trainingTypes:[
    {id:'run',name:'Carrera',emoji:'🏃',enabled:true,order:1,system:true},
    {id:'bike',name:'Bici / spinning',emoji:'🚴',enabled:true,order:2,system:true},
    {id:'strength',name:'Fuerza',emoji:'🏋️',enabled:true,order:3,system:true},
    {id:'mobility',name:'Movilidad / yoga',emoji:'🧘',enabled:true,order:4,system:true},
    {id:'trekking',name:'Trekking / senderismo',emoji:'🥾',enabled:true,order:5,system:true},
    {id:'other',name:'Otros',emoji:'⚽',enabled:true,order:6,system:true}
  ],
  entries:[],events:[]
};

function migrate(raw){
  const d={...clone(defaults),...raw};
  d.entries=Array.isArray(raw?.entries)?raw.entries:[];
  d.supplements=Array.isArray(raw?.supplements)&&raw.supplements.length?raw.supplements:clone(defaults.supplements);
  d.medications=Array.isArray(raw?.medications)&&raw.medications.length?raw.medications:clone(defaults.medications);
  const validTrainingIds=new Set(defaults.trainingTypes.map(x=>x.id));
  const old=Array.isArray(raw?.trainingTypes)?raw.trainingTypes:[];
  const hasNew=old.some(x=>validTrainingIds.has(x.id));
  d.trainingTypes=hasNew?old:clone(defaults.trainingTypes);
  d.schemaVersion=4;d.appVersion='1.0-rc1';
  return d;
}
function loadData(){
  try{const raw=localStorage.getItem(STORAGE_KEY);if(raw)return migrate(JSON.parse(raw));}catch(err){console.error(err)}
  return clone(defaults);
}
let data=loadData();
function saveData(){localStorage.setItem(STORAGE_KEY,JSON.stringify(data))}
saveData();

function localISO(date=new Date()){
  const y=date.getFullYear(),m=String(date.getMonth()+1).padStart(2,'0'),d=String(date.getDate()).padStart(2,'0');
  return `${y}-${m}-${d}`;
}
function num(id){const el=$(id);return el&&el.value!==''?Number(el.value):0}
function str(id){return ($(id)?.value||'').trim()}
function checkedValues(container){return [...container.querySelectorAll('input[type="checkbox"]:checked')].map(x=>x.value)}
function escapeHtml(s){return String(s||'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]))}

function go(screen){
  document.querySelectorAll('.screen').forEach(x=>x.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(x=>x.classList.toggle('active',x.dataset.go===screen));
  $(screen).classList.add('active');window.scrollTo({top:0,behavior:'smooth'});
  if(screen==='record')prepareForm();if(screen==='calendar')renderCalendar();if(screen==='stats')renderStats();if(screen==='settings')renderSettings();
}
document.querySelectorAll('[data-go]').forEach(btn=>btn.addEventListener('click',()=>go(btn.dataset.go)));

const now=new Date();
$('todayText').textContent=new Intl.DateTimeFormat('es-ES',{weekday:'long',day:'numeric',month:'long'}).format(now);
function applyTheme(theme){document.documentElement.dataset.theme=theme;localStorage.setItem(THEME_KEY,theme)}
applyTheme(localStorage.getItem(THEME_KEY)||'light');
$('themeToggle').onclick=()=>applyTheme(document.documentElement.dataset.theme==='dark'?'light':'dark');

function syncRanges(){
  document.querySelectorAll('input[type=range]').forEach(r=>{
    const out=r.parentElement.querySelector('output');
    const sync=()=>{if(out)out.textContent=r.value};
    if(!r.dataset.bound){r.addEventListener('input',sync);r.dataset.bound='1'}
    sync();
  });
}
syncRanges();

function compressImage(file){
  if(!file)return Promise.resolve('');
  return new Promise((resolve,reject)=>{
    const reader=new FileReader(),img=new Image();
    reader.onload=e=>img.src=e.target.result;reader.onerror=reject;
    img.onload=()=>{const max=1100,scale=Math.min(1,max/Math.max(img.width,img.height));const c=document.createElement('canvas');c.width=Math.round(img.width*scale);c.height=Math.round(img.height*scale);c.getContext('2d').drawImage(img,0,0,c.width,c.height);resolve(c.toDataURL('image/jpeg',.72))};
    reader.readAsDataURL(file);
  });
}

function renderDailyItems(){
  const build=(items,title)=>{
    const enabled=items.filter(x=>x.enabled!==false).sort((a,b)=>(a.order||0)-(b.order||0));
    if(!enabled.length)return '';
    return `<h4>${title}</h4><div class="check-grid">${enabled.map(x=>`<label class="check-chip"><input type="checkbox" value="${escapeHtml(x.id)}" checked><span>${escapeHtml(x.emoji||'')} ${escapeHtml(x.name)}</span></label>`).join('')}</div>`;
  };
  $('dailySupplements').innerHTML=build(data.supplements,'Suplementos tomados');
  $('dailyMedications').innerHTML=build(data.medications,'Medicación tomada');
}
function prepareForm(){
  if(!$('entryDate').value)$('entryDate').value=localISO();
  const types=data.trainingTypes.filter(x=>x.enabled!==false).sort((a,b)=>(a.order||0)-(b.order||0));
  $('trainingType').innerHTML=types.map(x=>`<option value="${escapeHtml(x.id)}">${escapeHtml(x.emoji||'')} ${escapeHtml(x.name)}</option>`).join('');
  renderDailyItems();updateTrainingFields();
}

$('usualSleepSchedule').onchange=()=>$('sleepExceptionFields').classList.toggle('hidden',$('usualSleepSchedule').checked);
$('trainedYesterday').onchange=()=>{
  $('trainingFields').classList.toggle('hidden',!$('trainedYesterday').checked);
  if($('trainedYesterday').checked)updateTrainingFields();
};
$('trainingType').onchange=updateTrainingFields;
function updateTrainingFields(){
  document.querySelectorAll('.training-specific').forEach(x=>x.classList.add('hidden'));
  const id=$('trainingType').value;
  if(id==='run')$('runningFields').classList.remove('hidden');
  else if(id==='bike')$('bikeFields').classList.remove('hidden');
  else if(id==='trekking')$('trekkingFields').classList.remove('hidden');
  else if(id==='strength'||id==='other')$('simpleRpeFields').classList.remove('hidden');
  // mobility deliberately has only duration + notes
}
['handSwelling','handPain','handStiffness','peeling'].forEach(id=>$(id).addEventListener('input',()=>{
  const abnormal=['handSwelling','handPain','handStiffness','peeling'].some(k=>num(k)>0);
  $('symptomDetail').classList.toggle('hidden',!abnormal);
}));

function duration(prefix='duration'){
  return {hours:num(prefix+'Hours'),minutes:num(prefix+'Minutes'),seconds:num(prefix+'Seconds')};
}
function commonTraining(){return {duration:duration(),competition:$('isCompetition').checked,notes:str('trainingNotes')}}
function collectTraining(){
  if(!$('trainedYesterday').checked)return {trained:false,type:'rest'};
  const type=$('trainingType').value;const base={trained:true,type,...commonTraining()};
  if(type==='run')return {...base,terrain:str('runningTerrain'),distanceKm:num('distanceKm'),elevationGain:num('elevationGain'),elevationLoss:num('elevationLoss'),pace:{minutes:num('paceMinutes'),seconds:num('paceSeconds')},tss:{type:str('tssType')||'hrTSS',value:num('tssValue')},intensityFactor:num('intensityFactor'),rpeGlobal:num('rpeGlobal'),rpeLegs:num('rpeLegs'),rpeCardio:num('rpeCardio')};
  if(type==='bike')return {...base,distanceKm:num('bikeDistanceKm'),avgPower:num('avgPower'),avgCadence:num('avgCadence'),tss:{type:str('bikeTssType')||'hrTSS',value:num('bikeTssValue')},intensityFactor:num('bikeIntensityFactor'),rpeGlobal:num('bikeRpeGlobal'),rpeLegs:num('bikeRpeLegs'),rpeCardio:num('bikeRpeCardio')};
  if(type==='trekking')return {...base,distanceKm:num('trekDistanceKm'),elevationGain:num('trekElevationGain'),elevationLoss:num('trekElevationLoss'),rpeGlobal:num('trekRpeGlobal')};
  if(type==='strength'||type==='other')return {...base,rpeGlobal:num('simpleRpeGlobal')};
  return base;
}

$('quickForm').onsubmit=async e=>{
  e.preventDefault();
  const date=$('entryDate').value||localISO();
  const photo=await compressImage($('symptomPhoto').files[0]);
  const existing=data.entries.find(x=>x.date===date);
  const entry={
    id:existing?.id||Date.now(),date,updatedAt:new Date().toISOString(),
    sleep:{score:num('sleepScore'),hours:num('sleepHours'),minutes:num('sleepMinutes'),usualSchedule:$('usualSleepSchedule').checked,exceptionType:$('usualSleepSchedule').checked?'':str('sleepExceptionType'),notes:$('usualSleepSchedule').checked?'':str('sleepNotes')},
    symptoms:{fatigue:num('fatigue'),legFatigue:num('legFatigue'),handSwelling:num('handSwelling'),handPain:num('handPain'),handStiffness:num('handStiffness'),peeling:num('peeling'),notes:str('symptomNotes'),photo:photo||existing?.symptoms?.photo||''},
    training:collectTraining(),
    supplements:checkedValues($('dailySupplements')),
    medications:checkedValues($('dailyMedications')),
    notes:str('notes')
  };
  if(existing&&!confirm('Ya hay un registro para esa fecha. ¿Sustituirlo?'))return;
  data.entries=data.entries.filter(x=>x.date!==date);data.entries.push(entry);data.entries.sort((a,b)=>a.date.localeCompare(b.date));saveData();
  alert('Registro guardado.');resetForm();updateHome();go('home');
};
function resetForm(){
  $('quickForm').reset();$('entryDate').value=localISO();$('usualSleepSchedule').checked=true;$('sleepExceptionFields').classList.add('hidden');$('trainingFields').classList.add('hidden');$('symptomDetail').classList.add('hidden');
  document.querySelectorAll('input[type=range]').forEach(r=>{r.value=0;r.dispatchEvent(new Event('input'))});renderDailyItems();
}

function entryValue(e,key){return e.symptoms?.[key]??e[key]??0}
function updateHome(){
  const e=data.entries.find(x=>x.date===localISO());const cards=document.querySelectorAll('.metric-card strong');
  if(cards[0])cards[0].textContent=e?entryValue(e,'handSwelling'):0;if(cards[1])cards[1].textContent=e?entryValue(e,'fatigue'):0;
  const pill=document.querySelector('.hero-card .pill');if(pill)pill.textContent=e?'Registro completado':'Registro pendiente';
}
updateHome();

let calendarDate=new Date();
$('prevMonth').onclick=()=>{calendarDate.setMonth(calendarDate.getMonth()-1);renderCalendar()};
$('nextMonth').onclick=()=>{calendarDate.setMonth(calendarDate.getMonth()+1);renderCalendar()};
function renderCalendar(){
  const year=calendarDate.getFullYear(),month=calendarDate.getMonth();$('calendarTitle').textContent=new Intl.DateTimeFormat('es-ES',{month:'long',year:'numeric'}).format(calendarDate);
  const first=new Date(year,month,1),last=new Date(year,month+1,0),start=(first.getDay()+6)%7,cells=[];
  for(let i=0;i<start;i++)cells.push('<div class="day empty"></div>');
  for(let d=1;d<=last.getDate();d++){
    const iso=`${year}-${String(month+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`,e=data.entries.find(x=>x.date===iso);let severity=0;
    if(e){const max=Math.max(entryValue(e,'handSwelling'),entryValue(e,'handPain'),entryValue(e,'handStiffness'),entryValue(e,'fatigue'),entryValue(e,'legFatigue'));severity=max>=7?3:max>=4?2:1}
    cells.push(`<button class="day ${e?'has-entry severity-'+severity:''}${iso===localISO()?' today':''}" data-date="${iso}">${d}${e?'<span class="day-dot"></span>':''}</button>`);
  }
  $('calendarGrid').innerHTML=cells.join('');document.querySelectorAll('.day[data-date]').forEach(b=>b.onclick=()=>showDay(b.dataset.date));
}
function fmtDuration(d){if(!d)return '0 min';const parts=[];if(d.hours)parts.push(`${d.hours} h`);if(d.minutes)parts.push(`${d.minutes} min`);if(d.seconds)parts.push(`${d.seconds} s`);return parts.join(' ')||'0 min'}
function trainingName(id){const t=data.trainingTypes.find(x=>x.id===id);return t?`${t.emoji||''} ${t.name}`.trim():id}
function trainingSummary(t){
  if(!t?.trained)return '😴 Descanso';
  const bits=[trainingName(t.type),fmtDuration(t.duration)];
  if(t.distanceKm)bits.push(`${t.distanceKm} km`);if(t.elevationGain)bits.push(`+${t.elevationGain} m`);if(t.tss?.value)bits.push(`${t.tss.value} ${t.tss.type}`);if(t.competition)bits.push('🏁 Competición');return bits.join(' · ');
}
function showDay(date){
  const e=data.entries.find(x=>x.date===date);if(!e){$('dayDetail').innerHTML=`<div class="day-detail-card"><strong>${formatDate(date)}</strong><p class="muted">Sin registro.</p></div>`;return}
  const s=e.sleep||{},sy=e.symptoms||e;
  $('dayDetail').innerHTML=`<div class="day-detail-card"><strong>${formatDate(date)}</strong>
    <p>😴 Sueño: ${s.score??e.sleepQuality??0}/100 · ${s.hours||0} h ${s.minutes||0} min${s.usualSchedule===false?' · horario no habitual':''}</p>
    <p>🤲 Inflamación ${sy.handSwelling||0}/10 · Dolor ${sy.handPain||0}/10 · Rigidez ${sy.handStiffness||0}/10 · Descamación ${sy.peeling||0}/3</p>
    <p>🔋 Cansancio ${sy.fatigue||0}/10 · Piernas ${sy.legFatigue||0}/10</p>
    <p>🏃 ${escapeHtml(trainingSummary(e.training||legacyTraining(e)))}</p>
    ${e.training?.notes?`<p><b>Entrenamiento:</b> ${escapeHtml(e.training.notes)}</p>`:''}
    ${sy.notes?`<p><b>Síntomas:</b> ${escapeHtml(sy.notes)}</p>`:''}${e.notes?`<p><b>Observaciones:</b> ${escapeHtml(e.notes)}</p>`:''}
    ${sy.photo?`<img class="history-photo" src="${sy.photo}" alt="Foto del registro">`:''}
    <button class="danger" onclick="deleteEntry('${date}')">Eliminar</button></div>`;
}
function legacyTraining(e){return {trained:e.trainedYesterday,type:e.trainingType,duration:{hours:0,minutes:e.trainingMinutes||0,seconds:0},rpeLegs:e.rpeLegs,rpeCardio:e.rpeCardio}}
function deleteEntry(date){if(confirm('¿Eliminar este registro?')){data.entries=data.entries.filter(x=>x.date!==date);saveData();renderCalendar();$('dayDetail').innerHTML='';updateHome()}}
function formatDate(d){return new Intl.DateTimeFormat('es-ES',{weekday:'long',day:'numeric',month:'long',year:'numeric'}).format(new Date(d+'T12:00:00'))}

$('statsPeriod').onchange=renderStats;
function filteredEntries(){const p=$('statsPeriod').value;if(p==='all')return [...data.entries];const cut=new Date();cut.setHours(0,0,0,0);cut.setDate(cut.getDate()-(Number(p)-1));return data.entries.filter(e=>new Date(e.date+'T12:00:00')>=cut)}
function avg(arr,key){return arr.length?(arr.reduce((s,e)=>s+Number(entryValue(e,key)||0),0)/arr.length).toFixed(1):'—'}
function renderStats(){const arr=filteredEntries().sort((a,b)=>a.date.localeCompare(b.date));const cards=[['Días registrados',arr.length],['Inflamación media',avg(arr,'handSwelling')],['Cansancio medio',avg(arr,'fatigue')],['Días con descamación',arr.filter(e=>entryValue(e,'peeling')>0).length]];$('statsCards').innerHTML=cards.map(([l,v])=>`<article class="stat-card"><span>${l}</span><strong>${v}</strong></article>`).join('');drawChart(arr)}
function drawChart(arr){const c=$('statsChart'),ctx=c.getContext('2d'),dpr=devicePixelRatio||1,w=c.clientWidth||700,h=220;c.width=w*dpr;c.height=h*dpr;ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,w,h);ctx.strokeStyle='#dfe8e8';ctx.lineWidth=1;for(let i=0;i<=5;i++){const y=20+i*(h-40)/5;ctx.beginPath();ctx.moveTo(28,y);ctx.lineTo(w-8,y);ctx.stroke()}if(!arr.length){ctx.fillStyle='#74868b';ctx.fillText('Sin datos',w/2-20,h/2);return}const plot=(key,color)=>{ctx.strokeStyle=color;ctx.lineWidth=3;ctx.beginPath();arr.forEach((e,i)=>{const x=30+i*(w-44)/Math.max(1,arr.length-1),y=h-20-(Number(entryValue(e,key)||0)/10)*(h-40);i?ctx.lineTo(x,y):ctx.moveTo(x,y)});ctx.stroke()};plot('handSwelling','#0f766e');plot('fatigue','#d99a24')}

let modalState={type:null,id:null};
function renderSettings(){renderConfigList('supplements');renderConfigList('medications');renderConfigList('trainingTypes')}
function renderConfigList(type){
  const target=$(type+'List'),items=data[type].slice().sort((a,b)=>(a.order||0)-(b.order||0));
  target.innerHTML=items.length?items.map((x,i)=>`<div class="config-item"><span class="config-grip">↕</span><div class="config-main"><strong>${escapeHtml(x.emoji||'')} ${escapeHtml(x.name)}</strong><small>${type==='trainingTypes'?'Tipo de entrenamiento':escapeHtml(x.category||'')}</small></div><button type="button" class="config-toggle ${x.enabled!==false?'on':''}" data-action="toggle" data-type="${type}" data-id="${x.id}" aria-label="Activar o desactivar"></button><button type="button" class="icon-mini" data-action="up" data-type="${type}" data-id="${x.id}" ${i===0?'disabled':''}>↑</button><button type="button" class="icon-mini" data-action="edit" data-type="${type}" data-id="${x.id}">✎</button><button type="button" class="icon-mini danger-text" data-action="delete" data-type="${type}" data-id="${x.id}">×</button></div>`).join(''):'<div class="empty-config">No hay elementos.</div>';
}
document.querySelectorAll('[data-add]').forEach(b=>b.onclick=()=>openModal(b.dataset.add));
$('settings').addEventListener('click',e=>{const b=e.target.closest('[data-action]');if(!b)return;configAction(b.dataset.action,b.dataset.type,b.dataset.id)});
function configAction(action,type,id){const arr=data[type],idx=arr.findIndex(x=>x.id===id);if(idx<0)return;if(action==='toggle')arr[idx].enabled=arr[idx].enabled===false;else if(action==='up'&&idx>0){[arr[idx-1],arr[idx]]=[arr[idx],arr[idx-1]];arr.forEach((x,i)=>x.order=i+1)}else if(action==='edit'){openModal(type,id);return}else if(action==='delete'){if(!confirm('¿Eliminar este elemento?'))return;arr.splice(idx,1)}saveData();renderSettings();prepareForm()}
function openModal(type,id=null){modalState={type,id};const item=id?data[type].find(x=>x.id===id):null;$('modalTitle').textContent=item?'Editar elemento':'Añadir elemento';$('configName').value=item?.name||'';$('configEmoji').value=item?.emoji||'';$('configCategory').value=item?.category||'health';$('configCategoryLabel').classList.toggle('hidden',type==='trainingTypes');$('configModal').classList.add('open');$('configModal').setAttribute('aria-hidden','false')}
function closeModal(){$('configModal').classList.remove('open');$('configModal').setAttribute('aria-hidden','true')}
$('modalCancel').onclick=closeModal;
$('modalSave').onclick=()=>{const {type,id}=modalState,name=str('configName'),emoji=str('configEmoji');if(!name)return alert('Escribe un nombre.');const arr=data[type];if(id){const item=arr.find(x=>x.id===id);Object.assign(item,{name,emoji,category:type==='trainingTypes'?'':str('configCategory')})}else arr.push({id:uid(type),name,emoji,category:type==='trainingTypes'?'':str('configCategory'),enabled:true,order:arr.length+1});saveData();closeModal();renderSettings();prepareForm()};
$('configModal').onclick=e=>{if(e.target===$('configModal'))closeModal()};

function downloadBlob(content,name,type){const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([content],{type}));a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000)}
$('exportAll').onclick=()=>downloadBlob(JSON.stringify({...data,exportedAt:new Date().toISOString()},null,2),`healthlab_backup_${localISO()}.json`,'application/json');
$('importAll').onchange=async e=>{try{const raw=JSON.parse(await e.target.files[0].text());if(!raw||!Array.isArray(raw.entries))throw new Error();if(confirm('Esto sustituirá los datos y la configuración actuales. ¿Continuar?')){data=migrate(raw);saveData();renderSettings();prepareForm();updateHome();alert('Copia importada.')}}catch{alert('El archivo no es una copia válida de HealthLab.')}finally{e.target.value=''}};
$('resetDemo').onclick=()=>{if(confirm('¿Restablecer HealthLab? Se borrarán todos los registros y ajustes.')){data=clone(defaults);saveData();renderSettings();prepareForm();updateHome();alert('HealthLab restablecido.')}};

if('serviceWorker' in navigator)navigator.serviceWorker.register('sw.js');
prepareForm();renderSettings();
