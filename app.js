
const STORAGE_KEY='healthLabData';
const THEME_KEY='healthLabTheme';
const $=id=>document.getElementById(id);
function clone(v){return JSON.parse(JSON.stringify(v))}
const defaults={
  schemaVersion:3,
  profile:{name:'Luis'},
  symptoms:[],
  supplements:[],
  medications:[],
  trainingTypes:[
    {id:'rest',name:'Descanso',enabled:true,order:1},
    {id:'easyRun',name:'Carrera suave',enabled:true,order:2},
    {id:'trail',name:'Trail / desnivel',enabled:true,order:3},
    {id:'hardRun',name:'Carrera intensa',enabled:true,order:4},
    {id:'strength',name:'Fuerza',enabled:true,order:5},
    {id:'bike',name:'Spinning / bici',enabled:true,order:6},
    {id:'mobility',name:'Movilidad / yoga',enabled:true,order:7},
    {id:'race',name:'Competición',enabled:true,order:8}
  ],
  entries:[],
  events:[]
};
function loadData(){
  try{
    const raw=localStorage.getItem(STORAGE_KEY);
    if(raw){
      const d=JSON.parse(raw);
      d.entries=d.entries||[];
      d.trainingTypes=d.trainingTypes?.length?d.trainingTypes:clone(defaults.trainingTypes);
      return d;
    }
  }catch{}
  localStorage.setItem(STORAGE_KEY,JSON.stringify(defaults));
  return clone(defaults);
}
function saveData(){localStorage.setItem(STORAGE_KEY,JSON.stringify(data))}
let data=loadData();

function go(screen){
  document.querySelectorAll('.screen').forEach(x=>x.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(x=>x.classList.toggle('active',x.dataset.go===screen));
  $(screen).classList.add('active');
  window.scrollTo({top:0,behavior:'smooth'});
  if(screen==='record')prepareForm();
  if(screen==='calendar')renderCalendar();
  if(screen==='stats')renderStats();
}
document.querySelectorAll('[data-go]').forEach(btn=>btn.addEventListener('click',()=>go(btn.dataset.go)));

const now=new Date();
$('todayText').textContent=new Intl.DateTimeFormat('es-ES',{weekday:'long',day:'numeric',month:'long'}).format(now);

function applyTheme(theme){document.documentElement.dataset.theme=theme;localStorage.setItem(THEME_KEY,theme)}
applyTheme(localStorage.getItem(THEME_KEY)||'light');
$('themeToggle').onclick=()=>applyTheme(document.documentElement.dataset.theme==='dark'?'light':'dark');

document.querySelectorAll('input[type=range]').forEach(r=>{
  const out=r.parentElement.querySelector('output');
  const sync=()=>out.textContent=r.value;
  r.addEventListener('input',sync);sync();
});

function todayISO(){return new Date().toISOString().slice(0,10)}
function prepareForm(){
  $('entryDate').value=todayISO();
  $('trainingType').innerHTML=data.trainingTypes.filter(x=>x.enabled!==false).sort((a,b)=>(a.order||0)-(b.order||0)).map(x=>`<option value="${x.id}">${x.name}</option>`).join('');
}
$('trainedYesterday').onchange=()=>$('trainingFields').classList.toggle('hidden',!$('trainedYesterday').checked);

$('quickForm').onsubmit=e=>{
  e.preventDefault();
  const date=$('entryDate').value||todayISO();
  const entry={
    id:Date.now(),date,
    fatigue:Number($('fatigue').value),
    legFatigue:Number($('legFatigue').value),
    handSwelling:Number($('handSwelling').value),
    handPain:Number($('handPain').value),
    handStiffness:Number($('handStiffness').value),
    peeling:Number($('peeling').value),
    sleepQuality:Number($('sleepQuality').value),
    trainedYesterday:$('trainedYesterday').checked,
    trainingType:$('trainedYesterday').checked?$('trainingType').value:'',
    trainingMinutes:$('trainedYesterday').checked?Number($('trainingMinutes').value||0):0,
    rpeLegs:$('trainedYesterday').checked?Number($('rpeLegs').value):0,
    rpeCardio:$('trainedYesterday').checked?Number($('rpeCardio').value):0,
    supplementRoutine:(document.querySelector('input[name="suppRoutine"]:checked')||{}).value||'yes',
    notes:$('notes').value.trim()
  };
  const idx=data.entries.findIndex(x=>x.date===date);
  if(idx>=0){
    if(!confirm('Ya hay un registro para esa fecha. ¿Sustituirlo?'))return;
    entry.id=data.entries[idx].id;
    data.entries.splice(idx,1);
  }
  data.entries.push(entry);
  data.entries.sort((a,b)=>a.date.localeCompare(b.date));
  saveData();
  alert('Registro guardado.');
  resetForm();
  go('home');
  updateHome();
};
function resetForm(){
  $('quickForm').reset();
  document.querySelectorAll('input[type=range]').forEach(r=>{r.value=0;r.dispatchEvent(new Event('input'))});
  $('trainingFields').classList.add('hidden');
  $('entryDate').value=todayISO();
}

function updateHome(){
  const e=data.entries.find(x=>x.date===todayISO());
  const cards=document.querySelectorAll('.metric-card strong');
  if(cards[0])cards[0].textContent=e?e.handSwelling:0;
  if(cards[1])cards[1].textContent=e?e.fatigue:0;
  const pill=document.querySelector('.hero-card .pill');
  if(pill)pill.textContent=e?'Registro completado':'Registro pendiente';
}
updateHome();

let calendarDate=new Date();
$('prevMonth').onclick=()=>{calendarDate.setMonth(calendarDate.getMonth()-1);renderCalendar()};
$('nextMonth').onclick=()=>{calendarDate.setMonth(calendarDate.getMonth()+1);renderCalendar()};

function renderCalendar(){
  const year=calendarDate.getFullYear(),month=calendarDate.getMonth();
  $('calendarTitle').textContent=new Intl.DateTimeFormat('es-ES',{month:'long',year:'numeric'}).format(calendarDate);
  const first=new Date(year,month,1),last=new Date(year,month+1,0);
  const start=(first.getDay()+6)%7;
  const cells=[];
  for(let i=0;i<start;i++)cells.push('<div class="day empty"></div>');
  for(let d=1;d<=last.getDate();d++){
    const iso=`${year}-${String(month+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
    const e=data.entries.find(x=>x.date===iso);
    let severity=0;
    if(e){
      const max=Math.max(e.handSwelling,e.handPain,e.handStiffness,e.fatigue,e.legFatigue);
      severity=max>=7?3:max>=4?2:1;
    }
    const today=iso===todayISO()?' today':'';
    cells.push(`<button class="day ${e?'has-entry severity-'+severity:''}${today}" data-date="${iso}">${d}${e?'<span class="day-dot"></span>':''}</button>`);
  }
  $('calendarGrid').innerHTML=cells.join('');
  document.querySelectorAll('.day[data-date]').forEach(b=>b.onclick=()=>showDay(b.dataset.date));
}
function showDay(date){
  const e=data.entries.find(x=>x.date===date);
  $('dayDetail').innerHTML=e?`
    <div class="day-detail-card">
      <strong>${formatDate(date)}</strong>
      <p>Inflamación ${e.handSwelling}/10 · Dolor ${e.handPain}/10 · Rigidez ${e.handStiffness}/10</p>
      <p>Cansancio ${e.fatigue}/10 · Piernas ${e.legFatigue}/10 · Sueño ${e.sleepQuality}/10</p>
      ${e.trainedYesterday?`<p>Entrenamiento: ${trainingName(e.trainingType)} · ${e.trainingMinutes} min · RPE piernas ${e.rpeLegs} · cardio ${e.rpeCardio}</p>`:''}
      ${e.notes?`<p>${escapeHtml(e.notes)}</p>`:''}
      <button class="danger" onclick="deleteEntry('${date}')">Eliminar</button>
    </div>`:`<div class="day-detail-card"><strong>${formatDate(date)}</strong><p class="muted">Sin registro.</p></div>`;
}
function deleteEntry(date){
  if(!confirm('¿Eliminar este registro?'))return;
  data.entries=data.entries.filter(x=>x.date!==date);saveData();renderCalendar();$('dayDetail').innerHTML='';updateHome();
}
function trainingName(id){return data.trainingTypes.find(x=>x.id===id)?.name||id}
function formatDate(d){return new Intl.DateTimeFormat('es-ES',{weekday:'long',day:'numeric',month:'long',year:'numeric'}).format(new Date(d+'T12:00:00'))}
function escapeHtml(s){return String(s||'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]))}

$('statsPeriod').onchange=renderStats;
function filteredEntries(){
  const p=$('statsPeriod').value;
  if(p==='all')return [...data.entries];
  const cut=new Date();cut.setHours(0,0,0,0);cut.setDate(cut.getDate()-(Number(p)-1));
  return data.entries.filter(e=>new Date(e.date+'T12:00:00')>=cut);
}
function avg(arr,key){return arr.length?(arr.reduce((s,e)=>s+Number(e[key]||0),0)/arr.length).toFixed(1):'—'}
function renderStats(){
  const arr=filteredEntries().sort((a,b)=>a.date.localeCompare(b.date));
  const cards=[
    ['Días registrados',arr.length],
    ['Inflamación media',avg(arr,'handSwelling')],
    ['Cansancio medio',avg(arr,'fatigue')],
    ['Días con descamación',arr.filter(e=>e.peeling>0).length]
  ];
  $('statsCards').innerHTML=cards.map(([l,v])=>`<article class="stat-card"><span>${l}</span><strong>${v}</strong></article>`).join('');
  drawChart(arr);
}
function drawChart(arr){
  const c=$('statsChart'),ctx=c.getContext('2d'),dpr=devicePixelRatio||1,w=c.clientWidth||700,h=220;
  c.width=w*dpr;c.height=h*dpr;ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,w,h);
  ctx.strokeStyle='#dfe8e8';ctx.lineWidth=1;
  for(let i=0;i<=5;i++){const y=20+i*(h-40)/5;ctx.beginPath();ctx.moveTo(28,y);ctx.lineTo(w-8,y);ctx.stroke()}
  if(!arr.length){ctx.fillStyle='#74868b';ctx.fillText('Sin datos',w/2-20,h/2);return}
  const plot=(key,color)=>{
    ctx.strokeStyle=color;ctx.lineWidth=3;ctx.beginPath();
    arr.forEach((e,i)=>{const x=30+i*(w-44)/Math.max(1,arr.length-1),y=h-20-(Number(e[key]||0)/10)*(h-40);i?ctx.lineTo(x,y):ctx.moveTo(x,y)});
    ctx.stroke();
  };
  plot('handSwelling','#0f766e');plot('fatigue','#d99a24');
}

if('serviceWorker' in navigator)navigator.serviceWorker.register('sw.js');
prepareForm();
