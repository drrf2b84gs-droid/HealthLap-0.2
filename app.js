
const STORAGE_KEY='healthLabData';
const LEGACY_KEY='atlasHealthData';
const THEME_KEY='healthLabTheme';
const $=id=>document.getElementById(id);

const defaults={
  schemaVersion:2,
  profile:{name:'Luis'},
  symptoms:[
    {id:'fatigue',name:'Cansancio al despertar',type:'scale',min:0,max:10,enabled:true,order:1,description:'Sensación general de cansancio'},
    {id:'legFatigue',name:'Piernas cargadas',type:'scale',min:0,max:10,enabled:true,order:2,description:'Sensación de llevar muchos kilómetros'},
    {id:'handSwelling',name:'Inflamación de manos',type:'scale',min:0,max:10,enabled:true,order:3,description:'Hinchazón visible o sensación de inflamación'},
    {id:'handPain',name:'Dolor en manos',type:'scale',min:0,max:10,enabled:true,order:4,description:'Dolor articular o de tejidos blandos'},
    {id:'handStiffness',name:'Rigidez de manos',type:'scale',min:0,max:10,enabled:true,order:5,description:'Dificultad para mover o cerrar la mano'},
    {id:'peeling',name:'Descamación',type:'scale',min:0,max:3,enabled:true,order:6,description:'Descamación de palmas o dedos'},
    {id:'sleepQuality',name:'Calidad del sueño',type:'scale',min:0,max:10,enabled:true,order:7,description:'Percepción subjetiva del descanso'}
  ],
  supplements:[
    {id:'multivitamin',name:'Multivitamínico',enabled:true,order:1,description:'Composición pendiente de completar',composition:[]},
    {id:'omega3',name:'Omega-3',enabled:true,order:2,description:'EPA + DHA',composition:[]},
    {id:'magnesium',name:'Magnesio',enabled:true,order:3,description:'Magnesio elemental',composition:[]},
    {id:'creatine',name:'Creatina',enabled:true,order:4,description:'5 g',composition:[{nutrient:'Creatina',amount:5,unit:'g'}]},
    {id:'protein',name:'Proteína whey',enabled:true,order:5,description:'Cantidad de polvo y % de proteína',composition:[]},
    {id:'coq10',name:'CoQ10',enabled:true,order:6,description:'Con B2 y selenio',composition:[]},
    {id:'hydroferol',name:'Hidroferol 0,266 mg',enabled:true,order:7,description:'Pauta mensual',composition:[{nutrient:'Calcifediol',amount:0.266,unit:'mg'}]}
  ],
  medications:[],
  trainingTypes:[
    {id:'rest',name:'Descanso',enabled:true,order:1,description:''},
    {id:'easyRun',name:'Carrera suave',enabled:true,order:2,description:''},
    {id:'trail',name:'Trail / desnivel',enabled:true,order:3,description:''},
    {id:'hardRun',name:'Carrera intensa',enabled:true,order:4,description:''},
    {id:'strength',name:'Fuerza',enabled:true,order:5,description:''},
    {id:'bike',name:'Spinning / bici',enabled:true,order:6,description:''},
    {id:'mobility',name:'Movilidad / yoga',enabled:true,order:7,description:''},
    {id:'race',name:'Competición',enabled:true,order:8,description:''}
  ],
  entries:[],
  events:[]
};

function clone(v){return JSON.parse(JSON.stringify(v))}
function loadData(){
  try{
    const current=localStorage.getItem(STORAGE_KEY);
    if(current)return JSON.parse(current);
    const legacy=localStorage.getItem(LEGACY_KEY);
    if(legacy){
      const old=JSON.parse(legacy);
      const merged={...clone(defaults),...old,schemaVersion:2};
      localStorage.setItem(STORAGE_KEY,JSON.stringify(merged));
      return merged;
    }
  }catch{}
  const d=clone(defaults);saveData(d);return d;
}
function saveData(data){localStorage.setItem(STORAGE_KEY,JSON.stringify(data))}
let data=loadData();

function go(screen){
  document.querySelectorAll('.screen').forEach(x=>x.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(x=>x.classList.toggle('active',x.dataset.go===screen));
  $(screen).classList.add('active');
  window.scrollTo({top:0,behavior:'smooth'});
  if(screen==='settings')renderSettings();
}
document.querySelectorAll('[data-go]').forEach(btn=>btn.addEventListener('click',()=>go(btn.dataset.go)));

const now=new Date();
$('todayText').textContent=new Intl.DateTimeFormat('es-ES',{weekday:'long',day:'numeric',month:'long'}).format(now);

function applyTheme(theme){
  document.documentElement.dataset.theme=theme;
  localStorage.setItem(THEME_KEY,theme);
}
applyTheme(localStorage.getItem(THEME_KEY)||'light');
$('themeToggle').onclick=()=>applyTheme(document.documentElement.dataset.theme==='dark'?'light':'dark');

const listMap={
  symptoms:'symptomsList',
  supplements:'supplementsList',
  medications:'medicationsList',
  trainingTypes:'trainingTypesList'
};

function renderSettings(){
  Object.keys(listMap).forEach(type=>renderConfigList(type));
}

function renderConfigList(type){
  const container=$(listMap[type]);
  const items=[...(data[type]||[])].sort((a,b)=>(a.order||0)-(b.order||0));
  if(!items.length){
    container.innerHTML='<div class="empty-config">Todavía no hay elementos.</div>';
    return;
  }
  container.innerHTML=items.map((item,index)=>`
    <div class="config-item" draggable="true" data-type="${type}" data-id="${item.id}">
      <span class="config-grip">☰</span>
      <div class="config-main">
        <strong>${escapeHtml(item.name)}</strong>
        <small>${escapeHtml(item.description||'Sin descripción')}</small>
      </div>
      <button class="config-toggle ${item.enabled!==false?'on':''}" data-toggle="${item.id}" data-type="${type}" aria-label="Activar o desactivar"></button>
      <button class="icon-mini" data-edit="${item.id}" data-type="${type}" aria-label="Editar">✎</button>
      <button class="icon-mini danger-text" data-delete="${item.id}" data-type="${type}" aria-label="Eliminar">×</button>
    </div>
  `).join('');

  container.querySelectorAll('[data-toggle]').forEach(btn=>btn.onclick=()=>{
    const item=data[type].find(x=>x.id===btn.dataset.toggle);
    item.enabled=!item.enabled;saveData(data);renderConfigList(type);
  });
  container.querySelectorAll('[data-edit]').forEach(btn=>btn.onclick=()=>openEditor(type,btn.dataset.edit));
  container.querySelectorAll('[data-delete]').forEach(btn=>btn.onclick=()=>deleteItem(type,btn.dataset.delete));
  enableDrag(container,type);
}

function enableDrag(container,type){
  let dragged=null;
  container.querySelectorAll('.config-item').forEach(el=>{
    el.addEventListener('dragstart',()=>{dragged=el;el.classList.add('dragging')});
    el.addEventListener('dragend',()=>{el.classList.remove('dragging');dragged=null;saveOrder(container,type)});
    el.addEventListener('dragover',e=>{
      e.preventDefault();
      const target=e.currentTarget;
      if(!dragged||target===dragged)return;
      const rect=target.getBoundingClientRect();
      container.insertBefore(dragged,e.clientY<rect.top+rect.height/2?target:target.nextSibling);
    });
  });
}
function saveOrder(container,type){
  [...container.querySelectorAll('.config-item')].forEach((el,i)=>{
    const item=data[type].find(x=>x.id===el.dataset.id);
    if(item)item.order=i+1;
  });
  saveData(data);
}

function openEditor(type,id=null){
  const item=id?data[type].find(x=>x.id===id):null;
  const isSupplement=type==='supplements';
  const modal=document.createElement('div');
  modal.className='modal-backdrop open';
  modal.innerHTML=`
    <div class="modal">
      <h3>${item?'Editar':'Añadir'} ${labelFor(type)}</h3>
      <div class="modal-grid">
        <label>Nombre
          <input id="modalName" value="${escapeAttr(item?.name||'')}" placeholder="Nombre">
        </label>
        <label>Descripción
          <textarea id="modalDescription" rows="2" placeholder="Información útil">${escapeHtml(item?.description||'')}</textarea>
        </label>
        ${type==='symptoms'?`
          <label>Tipo
            <select id="modalSymptomType">
              <option value="scale" ${(item?.type||'scale')==='scale'?'selected':''}>Escala</option>
              <option value="boolean" ${item?.type==='boolean'?'selected':''}>Sí / No</option>
              <option value="text" ${item?.type==='text'?'selected':''}>Texto</option>
            </select>
          </label>
          <label>Máximo de escala
            <input id="modalMax" type="number" min="1" max="100" value="${item?.max||10}">
          </label>`:''}
        ${isSupplement?`
          <label>Composición
            <textarea id="modalComposition" rows="5" placeholder="Una línea por nutriente: Vitamina D|25|µg">${compositionToText(item?.composition||[])}</textarea>
          </label>
          <small class="muted">Formato: Nutriente|cantidad|unidad</small>`:''}
      </div>
      <div class="modal-actions">
        <button class="secondary-button" id="modalCancel">Cancelar</button>
        <button class="primary" id="modalSave">Guardar</button>
      </div>
    </div>`;
  document.body.appendChild(modal);
  modal.onclick=e=>{if(e.target===modal)modal.remove()};
  modal.querySelector('#modalCancel').onclick=()=>modal.remove();
  modal.querySelector('#modalSave').onclick=()=>{
    const name=modal.querySelector('#modalName').value.trim();
    if(!name)return alert('Pon un nombre.');
    const baseItem=item||{
      id:crypto.randomUUID?crypto.randomUUID():Date.now().toString(),
      enabled:true,
      order:(data[type]?.length||0)+1
    };
    baseItem.name=name;
    baseItem.description=modal.querySelector('#modalDescription').value.trim();
    if(type==='symptoms'){
      baseItem.type=modal.querySelector('#modalSymptomType').value;
      baseItem.min=0;
      baseItem.max=Number(modal.querySelector('#modalMax').value||10);
    }
    if(isSupplement)baseItem.composition=textToComposition(modal.querySelector('#modalComposition').value);
    if(!item)data[type].push(baseItem);
    saveData(data);modal.remove();renderConfigList(type);
  };
}

function deleteItem(type,id){
  const item=data[type].find(x=>x.id===id);
  if(!confirm(`¿Eliminar "${item?.name||'este elemento'}"?`))return;
  data[type]=data[type].filter(x=>x.id!==id);
  saveData(data);renderConfigList(type);
}

function labelFor(type){
  return ({symptoms:'síntoma',supplements:'suplemento',medications:'medicación',trainingTypes:'tipo de entrenamiento'})[type];
}
function compositionToText(comp){
  return (comp||[]).map(x=>`${x.nutrient}|${x.amount}|${x.unit}`).join('\n');
}
function textToComposition(text){
  return text.split('\n').map(x=>x.trim()).filter(Boolean).map(line=>{
    const [nutrient,amount,unit]=line.split('|').map(x=>x?.trim());
    return {nutrient:nutrient||'',amount:Number(amount)||0,unit:unit||''};
  });
}
function escapeHtml(s){return String(s||'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]))}
function escapeAttr(s){return escapeHtml(s).replace(/"/g,'&quot;')}

document.querySelectorAll('[data-add]').forEach(btn=>btn.addEventListener('click',()=>openEditor(btn.dataset.add)));

$('exportConfig').onclick=()=>{
  const payload={schemaVersion:data.schemaVersion,profile:data.profile,symptoms:data.symptoms,supplements:data.supplements,medications:data.medications,trainingTypes:data.trainingTypes};
  download(JSON.stringify(payload,null,2),'healthlab_config.json','application/json');
};
$('importConfig').onchange=async e=>{
  try{
    const imported=JSON.parse(await e.target.files[0].text());
    ['symptoms','supplements','medications','trainingTypes'].forEach(k=>{
      if(Array.isArray(imported[k]))data[k]=imported[k];
    });
    saveData(data);renderSettings();alert('Configuración importada.');
  }catch{alert('Archivo no válido.')}
};
function download(content,name,type){
  const a=document.createElement('a');
  a.href=URL.createObjectURL(new Blob([content],{type}));
  a.download=name;a.click();URL.revokeObjectURL(a.href);
}

$('resetDemo').onclick=()=>{
  if(confirm('¿Borrar toda la configuración y los futuros registros locales de HealthLab?')){
    data=clone(defaults);saveData(data);renderSettings();alert('HealthLab restablecido.');
  }
};

if('serviceWorker' in navigator)navigator.serviceWorker.register('sw.js');
