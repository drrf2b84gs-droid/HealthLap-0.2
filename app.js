const APP_VERSION='1.3.0';
const CURRENT_SCHEMA_VERSION=16;
const EXPORT_FORMAT_VERSION=4;
const EXPORT_FORMAT='healthlab-json';
const STORAGE_KEY='healthLabData';
const THEME_KEY='healthLabTheme';
const $=id=>document.getElementById(id);
const clone=v=>JSON.parse(JSON.stringify(v));
function makeUuid(){if(globalThis.crypto?.randomUUID)return crypto.randomUUID();return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g,c=>{const r=Math.random()*16|0,v=c==='x'?r:(r&3|8);return v.toString(16)})}
function getInstallationId(){
 try{
  const id=localStorage.getItem('healthLabInstallationId');
  if(id)return id;
  const newId=makeUuid();
  localStorage.setItem('healthLabInstallationId',newId);
  return newId;
 }catch{return makeUuid()}
}
function detectSource(){const standalone=window.matchMedia?.('(display-mode: standalone)').matches||navigator.standalone===true;const ua=navigator.userAgent||'';let device='navegador';if(/iPad/i.test(ua)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1))device='iPad';else if(/iPhone/i.test(ua))device='iPhone';else if(/Android/i.test(ua))device='Android';return {installationId:getInstallationId(),platform:/iP(hone|ad|od)/i.test(ua)||device==='iPad'?'iOS':(/Android/i.test(ua)?'Android':'Web'),device,mode:standalone?'standalone-pwa':'browser'}}
const SOURCE=detectSource();
const defaults={
 schemaVersion:CURRENT_SCHEMA_VERSION,profile:{name:'Luis'},entries:[],trainings:[],events:[],processingLog:[],
 trainingTypes:[
  {id:'run',name:'🏃 Carrera',enabled:true,order:1,kind:'run'},
  {id:'bike',name:'🚴 Bici / spinning',enabled:true,order:2,kind:'bike'},
  {id:'strength',name:'🏋️ Fuerza',enabled:true,order:3,kind:'strength'},
  {id:'functional',name:'🤸 Fuerza funcional / gomas',enabled:true,order:4,kind:'functional'},
  {id:'mobility',name:'🧘 Movilidad / yoga',enabled:true,order:5,kind:'mobility'},
  {id:'trekking',name:'🥾 Trekking / senderismo',enabled:true,order:6,kind:'trekking'},
  {id:'other',name:'⚽ Otros',enabled:true,order:7,kind:'other'}],
 dailySupplements:[
  {id:'multi',name:'Multivitamínico',dose:2,unit:'cápsulas',composition:'Vitamina C 200 mg (250% VRN)\nVitamina B3 32 mg (200% VRN)\nCalcio 120 mg (15% VRN)\nÁcido pantoténico 12 mg (200% VRN)\nVitamina E 12 mg (100% VRN)\nVitamina B6 4,2 mg (300% VRN)\nVitamina B2 2,8 mg (200% VRN)\nVitamina B1 2,2 mg (200% VRN)\nVitamina A 800 µg (100% VRN)\nÁcido fólico 400 µg (200% VRN; L-metilfolato cálcico)\nBiotina 100 µg (200% VRN)\nVitamina K2 (menaquinona-7) 75 µg (100% VRN)\nVitamina D3 10 µg (200% VRN)\nVitamina B12 10 µg (400% VRN)\nMagnesio 124 mg (33% VRN; citrato)\nZinc 10 mg (100% VRN)\nSilicio 5 mg\nBoro 2 mg\nCobre 1 mg (100% VRN)\nCromo 80 µg (200% VRN)\nSelenio 55 µg (100% VRN; L-seleniometionina)\nFosfatidilserina 75 mg\nCoenzima Q10 50 mg\nColina 0,7 mg',enabled:true,order:1,defaultTaken:true},
  {id:'omega3',name:'Omega-3',dose:1,unit:'cápsula',composition:'EPA/DHA',enabled:true,order:2,defaultTaken:true},
  {id:'magnesium',name:'Magnesio',dose:1,unit:'cápsula',composition:'',enabled:true,order:3,defaultTaken:true},
  {id:'coq10',name:'CoQ10',dose:1,unit:'cápsula',composition:'Incluida en el multivitamínico',enabled:false,order:4,defaultTaken:false},
  {id:'vitd',name:'Vitamina D / Hidroferol',dose:1,unit:'dosis',composition:'Según pauta mensual',enabled:true,order:5,defaultTaken:false}],
 sportSupplements:[
  {id:'protein',name:'Proteína',dose:25,unit:'g',composition:'Whey isolate',enabled:true,order:1,defaultTaken:true},
  {id:'creatine',name:'Creatina',dose:5,unit:'g',composition:'Monohidrato',enabled:true,order:2,defaultTaken:true}],
 medications:[]
};
const hiddenSportItems=new Set(['caffeine','carbsPre','carbsDuring','carbsPost']);
const respiratoryGroups=[
 ['Nariz y senos paranasales',[
  ['nasalIrritation','Irritación o sequedad nasal'],['nasalCrusts','Costras nasales'],
  ['bloodyNasalCrusts','Costras con sangre'],['wateryRunnyNose','Rinorrea acuosa'],
  ['sinusPressure','Presión facial o sinusal'],['postNasalDrip','Goteo posnasal'],['sneezing','Estornudos']
 ]],
 ['Garganta y paladar',[
  ['soreThroat','Dolor de garganta'],['throatIrritation','Irritación o sequedad de garganta'],
  ['palateIrritation','Irritación o sequedad del paladar posterior'],['throatMucus','Mucosidad en garganta']
 ]],
 ['Tos y respiración',[
  ['cough','Tos'],['dryCough','Tos seca'],['productiveCough','Tos con mucosidad'],
  ['barkingCough','Tos de perro'],['dailyBreathlessness','Falta de aire cotidiana']
 ]]
];
const respiratoryFields=respiratoryGroups.flatMap(([,fields])=>fields);
const episodeTypes={chest:'Torácico',respiratory:'Respiratorio',digestive:'Digestivo',musculoskeletal:'Musculoesquelético',other:'Otro'};
function migrate9To10(d){
 d.schemaVersion=10;
 for(const e of d.entries||[]){
  e.dayContexts=Array.isArray(e.dayContexts)?e.dayContexts:(e.dayContext?[e.dayContext]:['routine']);
  e.foodChanges=Array.isArray(e.foodChanges)?e.foodChanges:(e.foodChange?[e.foodChange]:[]);
  e.respiratorySymptoms=!!(e.respiratorySymptoms||e.hasRespiratorySymptoms);
  e.nasalCongestion=Number(e.nasalCongestion||0);e.mucus=Number(e.mucus||0);
  e.postNasalDrip=!!(e.postNasalDrip||e.nasalDrip);e.sneezing=!!e.sneezing;e.cough=!!e.cough;
  e.dailyBreathlessness=!!(e.dailyBreathlessness||e.shortnessOfBreath);e.respiratoryNotes=e.respiratoryNotes||'';
 }
 return d;
}
function migrate10To11(d){
 d.schemaVersion=11;
 for(const e of d.entries||[]){
  e.uuid=e.uuid||makeUuid();e.revision=Number(e.revision||1);e.history=Array.isArray(e.history)?e.history:[];
  e.source=e.source||{...SOURCE};if(e.aiAnalysis===undefined)e.aiAnalysis=null;
  for(const t of e.trainings||[]){t.uuid=t.uuid||makeUuid()}
 }
 for(const ev of d.events||[]){ev.uuid=ev.uuid||makeUuid();ev.revision=Number(ev.revision||1);ev.history=Array.isArray(ev.history)?ev.history:[];ev.source=ev.source||{...SOURCE};if(ev.aiAnalysis===undefined)ev.aiAnalysis=null}
 return d;
}

function migrate11To12(d){
 d.schemaVersion=12;
 return d;
}
function migrate12To13(d){
 const processedAt=new Date().toISOString();
 d.processingLog=Array.isArray(d.processingLog)?d.processingLog:[];
 d.processingLog.push({origin:'schema-migration',fromSchema:12,toSchema:13,processedAt});
 for(const e of d.entries||[]){
  e.history=(Array.isArray(e.history)?e.history:[]).filter(h=>h?.origin!=='schema-migration'&&h?.origin!=='automatic-correction');
  for(const h of e.history)if(!h.origin)h.origin='legacy-unknown';
  for(const t of e.trainings||[]){
   for(const field of ['averagePowerW','avgPower','averageCadenceRpm','avgCadence','averageHeartRateBpm','avgHeartRate']){
    if(t[field]===0||t[field]==='0'){
     t[field]='';
     d.processingLog.push({origin:'automatic-correction',entryUuid:e.uuid||null,trainingUuid:t.uuid||null,field,action:'converted-zero-to-null',processedAt});
    }
   }
  }
  for(const group of ['dailySupplements','sportSupplements','medicationsTaken'])for(const x of e[group]||[]){
   x.productVersionId=stableProductVersionId(x);
   const snapshot=String(x.compositionSnapshot??x.composition??'');
   x.compositionSnapshot=snapshot;
   x.legacyIncomplete=x.legacyIncomplete===true||isLegacyCompositionIncomplete(snapshot);
  }
 }
 for(const group of ['dailySupplements','sportSupplements','medications'])for(const x of d[group]||[])x.productVersionId=stableProductVersionId(x);
 d.schemaVersion=13;
 return d;
}
function migrate13To14(d){
 d.schemaVersion=14;
 for(const e of d.entries||[]){
  if(e.abdominalInflammation===undefined||e.abdominalInflammation===null)e.abdominalInflammation=0;
  if(e.weightKg===undefined||e.weightKg==='')e.weightKg=null;
 }
 return d;
}
function migrate14To15(d){
 d.schemaVersion=15;
 for(const e of d.entries||[]){
  if(e.waistCm===undefined||e.waistCm==='')e.waistCm=null;
  if(e.hipCm===undefined||e.hipCm==='')e.hipCm=null;
  if(e.throatMucus===undefined)e.throatMucus=false;
  if(e.bowelFrequency==='4+')e.bowelFrequency=4;
 }
 return d;
}
function migrate15To16(d){
 d.schemaVersion=16;
 const creatine=Array.isArray(d.sportSupplements)?d.sportSupplements.find(item=>item.id==='creatine'):null;
 if(creatine)creatine.defaultTaken=true;
 return d;
}
const migrations={9:migrate9To10,10:migrate10To11,11:migrate11To12,12:migrate12To13,13:migrate13To14,14:migrate14To15,15:migrate15To16};
function migrate(d){
 d=d||{};d.entries=Array.isArray(d.entries)?d.entries:[];d.events=Array.isArray(d.events)?d.events:[];d.trainings=Array.isArray(d.trainings)?d.trainings:[];
 let version=Number(d.schemaVersion||9);if(version>CURRENT_SCHEMA_VERSION)throw new Error(`Este archivo usa el esquema ${version}, más nuevo que el compatible (${CURRENT_SCHEMA_VERSION}).`);
 while(version<CURRENT_SCHEMA_VERSION){const fn=migrations[version];if(!fn)throw new Error(`No existe migración desde el esquema ${version}.`);d=fn(d);version=Number(d.schemaVersion)}
 d.processingLog=Array.isArray(d.processingLog)?d.processingLog:[];
 d.trainingTypes=Array.isArray(d.trainingTypes)&&d.trainingTypes.length?d.trainingTypes:clone(defaults.trainingTypes);
 if(!d.trainingTypes.some(x=>x.id==='functional')){d.trainingTypes.push({id:'functional',name:'🤸 Fuerza funcional / gomas',enabled:true,order:4,kind:'functional'});d.trainingTypes.forEach((x,i)=>{if(x.id!=='functional'&&(x.order||0)>=4)x.order=(x.order||0)+1})}
 d.trainingTypes.sort((a,b)=>(Number(a.order)||999)-(Number(b.order)||999)||String(a.name).localeCompare(String(b.name))).forEach((x,i)=>x.order=i+1);
 d.dailySupplements=Array.isArray(d.dailySupplements)&&d.dailySupplements.length?d.dailySupplements:clone(defaults.dailySupplements);
 d.sportSupplements=Array.isArray(d.sportSupplements)&&d.sportSupplements.length?d.sportSupplements:clone(defaults.sportSupplements);d.medications=Array.isArray(d.medications)?d.medications:[];
 d.dailySupplements=d.dailySupplements.filter(x=>x.id!=='coq10');
 for(const x of d.dailySupplements){if(x.defaultTaken===undefined)x.defaultTaken=['multi','omega3','magnesium'].includes(x.id)}
 for(const x of d.sportSupplements)if(x.defaultTaken===undefined)x.defaultTaken=['protein','creatine'].includes(x.id);
 for(const training of d.trainings)migrateTraining(training);
 for(const e of d.entries){
  if(!Array.isArray(e.trainings)){e.trainings=e.training?[e.training]:[];delete e.training}
  e.uuid=e.uuid||makeUuid();e.revision=Number(e.revision||1);e.history=Array.isArray(e.history)?e.history:[];e.source=e.source||{...SOURCE};if(e.aiAnalysis===undefined)e.aiAnalysis=null;
  if(!e.sleepDuration&&e.sleepHours!==undefined)e.sleepDuration=minutesText(Math.round(Number(e.sleepHours||0)*60));
  e.legFatigue=!!e.legFatigue;e.eyeTic=!!e.eyeTic;e.waistCm=e.waistCm??null;e.hipCm=e.hipCm??null;e.throatMucus=!!e.throatMucus;
  if(e.sleepDurationMinutes!==undefined&&e.sleepDurationMinutes!==null&&e.sleepMinutes===undefined){e.sleepMinutes=Number(e.sleepDurationMinutes);e.sleepDuration=minutesText(e.sleepMinutes)}
  e.appleRestingHeartRate=e.appleRestingHeartRate??e.appleRestingHeartRateBpm??'';e.appleHrvAverage=e.appleHrvAverage??e.appleHrvAverageMs??'';
  for(const training of e.trainings)migrateTraining(training);
  for(const group of ['dailySupplements','sportSupplements','medicationsTaken'])for(const x of e[group]||[]){if(!x.id&&x.supplementId)x.id=x.supplementId;if(x.composition===undefined&&x.compositionSnapshot!==undefined)x.composition=x.compositionSnapshot}
  if(!e.handDetails){const old=e.handDetail||{},blank=()=>({fingers:[],joint:'',mobilityLimited:false});e.handDetails={right:blank(),left:blank(),notes:old.notes||'',photos:old.photo?[old.photo]:[]}}
  if(!Array.isArray(e.handDetails.photos))e.handDetails.photos=[];
  e.appleRestingHeartRate=e.appleRestingHeartRate??e.restingHeartRate??'';e.appleHrvAverage=e.appleHrvAverage??'';e.hrv4TrainingScore=e.hrv4TrainingScore??'';e.hrv4TrainingStatus=e.hrv4TrainingStatus||'';
  e.bowelFrequency=e.bowelFrequency==='4+'?4:(e.bowelFrequency??0);e.bristolType=e.bristolType??'';e.bowelUrgency=!!e.bowelUrgency;e.bowelPain=!!e.bowelPain;e.bowelBlood=!!e.bowelBlood;e.bowelNotes=e.bowelNotes||'';
  e.dayContexts=Array.isArray(e.dayContexts)?e.dayContexts:(e.dayContext?[e.dayContext]:['routine']);if(!e.dayContexts.length)e.dayContexts=['routine'];e.foodChanges=Array.isArray(e.foodChanges)?e.foodChanges:(e.foodChange?[e.foodChange]:[]);
  e.respiratorySymptoms=!!e.respiratorySymptoms;e.nasalCongestion=Number(e.nasalCongestion||0);e.mucus=Number(e.mucus||0);e.throatMucus=!!e.throatMucus;e.postNasalDrip=!!e.postNasalDrip;e.sneezing=!!e.sneezing;e.cough=!!e.cough;e.dailyBreathlessness=!!e.dailyBreathlessness;e.respiratoryNotes=e.respiratoryNotes||'';
 }
 delete d.supplements;delete d.symptoms;delete d.appVersion;
 return {...clone(defaults),...d,schemaVersion:CURRENT_SCHEMA_VERSION};
}
function migrateTraining(t){
 t.uuid=t.uuid||makeUuid();
 const canonicalSeconds=nullableNumber(t.durationSeconds);
 const minutes=canonicalSeconds===null
  ?parseDuration(t.duration||'')??nullableNumber(t.durationMinutes)
  :Math.round(canonicalSeconds/60);
 if(minutes!==null){t.durationMinutes=minutes;t.duration=minutesText(minutes)}
 const fields={
  elevGain:'elevationGainM',elevLoss:'elevationLossM',tssValue:'tss',ifValue:'intensityFactor',
  avgPower:'averagePowerW',avgCadence:'averageCadenceRpm',avgHeartRate:'averageHeartRateBpm'
 };
 for(const [input,stored] of Object.entries(fields)){
  if(t[input]===undefined&&t[stored]!==undefined)t[input]=t[stored]??'';
 }
 if(t.avgPace==null&&t.paceSecondsPerKm!=null){
  const seconds=Math.round(Number(t.paceSecondsPerKm));
  t.avgPace=`${Math.floor(seconds/60)}:${String(seconds%60).padStart(2,'0')}`;
 }
}
let storedSnapshot=null;
let storageLoadFailed=false;
function loadData(){
 try{
  storedSnapshot=localStorage.getItem(STORAGE_KEY);
  if(storedSnapshot===null)return clone(defaults);
  const saved=JSON.parse(storedSnapshot);
  if(!Array.isArray(saved?.entries))throw new Error('Historial local no válido.');
  return migrate(saved);
 }catch{
  storageLoadFailed=true;
  return clone(defaults);
 }
}
let data=loadData();
function saveData(nextData,{replaceUnreadable=false}={}){
 try{
  if(storageLoadFailed&&!replaceUnreadable){
   alert('No se ha podido leer el historial local. Se ha conservado la copia que había guardada.');
   return false;
  }
  if(localStorage.getItem(STORAGE_KEY)!==storedSnapshot){
   alert('El historial ha cambiado desde que abriste esta pantalla. Conserva lo que has escrito antes de volver a abrir HealthLab.');
   return false;
  }
  const snapshot=JSON.stringify(nextData);
  localStorage.setItem(STORAGE_KEY,snapshot);
  if(localStorage.getItem(STORAGE_KEY)!==snapshot){
   alert('No se ha podido verificar el guardado. Conserva lo que has escrito antes de cerrar HealthLab.');
   return false;
  }
  storedSnapshot=snapshot;
  storageLoadFailed=false;
  data=nextData;
  return true;
 }catch(error){
  alert(error?.name==='QuotaExceededError'
   ?'No hay espacio suficiente para guardar en HealthLab. Conserva lo que has escrito y exporta una copia del historial.'
   :'No se ha podido acceder al almacenamiento de HealthLab. Conserva lo que has escrito antes de cerrar la app.');
  return false;
 }
}
function localTime(date=new Date()){return [date.getHours(),date.getMinutes()].map(value=>String(value).padStart(2,'0')).join(':')}
function localISO(date=new Date()){return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`}
function esc(s){return String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]))}
function fmtDate(d){return new Intl.DateTimeFormat('es-ES',{weekday:'long',day:'numeric',month:'long',year:'numeric'}).format(new Date(d+'T12:00:00'))}
function parseDuration(v){v=String(v??'').trim().replace(',', '.');if(!v)return 0;if(/^\d+$/.test(v)){if(v.length<=2)return Number(v);if(v.length<=4){const h=Number(v.slice(0,-2)),m=Number(v.slice(-2));return m<60?h*60+m:null}return null}if(!/^\d{1,3}:\d{1,2}$/.test(v))return null;const [h,m]=v.split(':').map(Number);if(m>59)return null;return h*60+m}
function minutesText(m=0){return `${String(Math.floor(m/60)).padStart(2,'0')}:${String(m%60).padStart(2,'0')}`}
function formatDurationField(el){if(!el)return true;const raw=String(el.value||'').trim();if(!raw)return true;const mins=parseDuration(raw);if(mins===null)return false;el.value=minutesText(mins);return true}
function formatPaceField(el){if(!el)return true;const raw=String(el.value||'').trim();if(!raw)return true;const sec=paceToSeconds(raw);if(sec===null)return false;el.value=`${Math.floor(sec/60)}:${String(sec%60).padStart(2,'0')}`;return true}
function bindSmartNumericTimeFields(root=document){root.querySelectorAll('.smart-duration').forEach(el=>{el.onblur=()=>formatDurationField(el)});root.querySelectorAll('.smart-pace').forEach(el=>{el.onblur=()=>formatPaceField(el)});root.querySelectorAll('input[type=number]:not([inputmode])').forEach(el=>{
 el.inputMode=el.step==='any'||el.step.includes('.')?'decimal':'numeric';
 });
 root.querySelectorAll('input,textarea,select').forEach(el=>{if(el.dataset.iosFocusBound)return;el.dataset.iosFocusBound='1';el.addEventListener('focus',()=>{if(/iPhone|iPad|iPod/.test(navigator.userAgent)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1))setTimeout(()=>el.scrollIntoView({block:'center',behavior:'smooth'}),180)})})}
function go(screen){stopActiveDictation();closeTextEditor(false);document.querySelectorAll('.screen').forEach(x=>x.classList.remove('active'));document.querySelectorAll('.nav-item').forEach(x=>x.classList.toggle('active',x.dataset.go===screen));$(screen).classList.add('active');window.scrollTo({top:0,behavior:'smooth'});if(screen==='record')prepareNewRecord();if(screen==='home')updateHome();if(screen==='calendar')renderCalendar();if(screen==='training')prepareTraining();if(screen==='episodes')prepareEpisodes();if(screen==='stats')renderStats();if(screen==='settings')renderSettings()}
document.querySelectorAll('[data-go]').forEach(b=>b.onclick=()=>go(b.dataset.go));
$('todayText').textContent=new Intl.DateTimeFormat('es-ES',{weekday:'long',day:'numeric',month:'long'}).format(new Date());
try{document.documentElement.dataset.theme=localStorage.getItem(THEME_KEY)||'light'}catch{document.documentElement.dataset.theme='light'}
$('themeToggle').onclick=()=>{
 const theme=document.documentElement.dataset.theme==='dark'?'light':'dark';
 document.documentElement.dataset.theme=theme;
 try{localStorage.setItem(THEME_KEY,theme)}catch{}
};
const scaleGuides={
 fatigue:{title:'Cansancio · 0–10',levels:['0 · Sin cansancio','1–2 · Muy leve; no condiciona el día','3–4 · Perceptible; algo menos de energía','5–6 · Moderado; condiciona parte de la actividad','7–8 · Alto; limita claramente','9–10 · Extremo o incapacitante']},
 handSwelling:{title:'Inflamación de manos · 0–10',levels:['0 · Ninguna','1–2 · Leve; sensación acolchada o cierre algo más difícil','3–4 · Clara; visible o dificulta el cierre','5–6 · Moderada; limita movimientos o tareas','7–8 · Importante','9–10 · Muy intensa o casi impide mover']},
 handPain:{title:'Dolor de manos · 0–10',levels:['0 · Sin dolor','1–2 · Leve','3–4 · Molesto pero tolerable','5–6 · Moderado; condiciona tareas','7–8 · Intenso','9–10 · Muy intenso o incapacitante']},
 abdominalInflammation:{title:'Inflamación abdominal · 0–4',levels:['0 · Ninguna; abdomen habitual','1 · Leve; ligera sensación de hinchazón o tensión','2 · Moderada; hinchazón claramente perceptible','3 · Importante; distensión evidente durante buena parte del día','4 · Muy intensa; distensión marcada con molestias claras']},
 waistMeasurement:{title:'Cómo medir la cintura',levels:['Una vez por semana, de pie y con el abdomen completamente relajado.','Pasa la cinta horizontalmente a la altura del ombligo.','Mide al final de una espiración normal, sin meter barriga ni vaciar los pulmones a propósito.','No aprietes la cinta y procura hacerlo siempre en condiciones parecidas.']},
 hipMeasurement:{title:'Cómo medir la cadera',levels:['Una vez por semana, de pie.','Pasa la cinta horizontalmente por el punto de mayor perímetro de los glúteos (la parte más salida).','No comprimas la piel y usa siempre el mismo punto.']},
 routineContext:{title:'Qué significa “Rutina habitual”',levels:['Día normal de trabajo: combinación habitual de oficina (3 días) y teletrabajo (2 días).','En casa, con entrenamiento prácticamente diario.','Sueño habitual alrededor de 7 horas, aproximadamente de 23:30–00:00 a 07:00–07:45.','Si el día se sale de este patrón, selecciona además el contexto correspondiente en vez de Rutina.']},
 stress:{title:'Estrés percibido · 0–10',levels:['0 · Ninguno','1–2 · Bajo','3–4 · Leve a moderado','5–6 · Moderado','7–8 · Alto','9–10 · Extremo']},
 peeling:{title:'Descamación · 0–3',levels:['0 · Ninguna','1 · Leve o localizada','2 · Clara en varias zonas','3 · Intensa o extensa']},
 nasalCongestion:{title:'Congestión nasal · 0–5',levels:['0 · Ninguna','1 · Apenas perceptible','2 · Leve','3 · Moderada','4 · Intensa','5 · Muy intensa; respirar por la nariz resulta difícil']},
 mucus:{title:'Mucosidad · 0–5',levels:['0 · Ninguna','1 · Muy poca','2 · Leve','3 · Moderada','4 · Abundante','5 · Muy abundante o muy molesta']},
 rpeGlobal:{title:'RPE global · 0–10',levels:['0 · Reposo','1–2 · Muy suave','3–4 · Suave a moderado','5–6 · Exigente','7–8 · Muy exigente','9–10 · Máximo']},
 rpeLegs:{title:'RPE muscular · 0–10',levels:['0 · Sin esfuerzo muscular','1–2 · Muy leve','3–4 · Moderado','5–6 · Exigente','7–8 · Muy exigente','9–10 · Máximo']},
 rpeCardio:{title:'RPE cardiovascular · 0–10',levels:['0 · Sin esfuerzo respiratorio','1–2 · Muy leve','3–4 · Moderado','5–6 · Exigente','7–8 · Muy exigente','9–10 · Máximo']}
};
function scaleText(key,value){const guide=scaleGuides[key];if(!guide)return '';const v=Number(value||0);if(key==='peeling')return guide.levels[Math.max(0,Math.min(3,v))];if(key==='abdominalInflammation')return guide.levels[Math.max(0,Math.min(4,v))];if(key==='nasalCongestion'||key==='mucus')return guide.levels[Math.max(0,Math.min(5,v))];if(v===0)return guide.levels[0];if(v<=2)return guide.levels[1];if(v<=4)return guide.levels[2];if(v<=6)return guide.levels[3];if(v<=8)return guide.levels[4];return guide.levels[5]}
function bindRanges(root=document){root.querySelectorAll('input[type=range]').forEach(r=>{const o=r.closest('.scale-control')?.querySelector('output');const key=r.dataset.scaleKey||r.dataset.field;const f=()=>{if(o)o.textContent=r.value;const d=r.closest('.scale-card')?.querySelector('.scale-description');if(d)d.textContent=scaleText(key,r.value)};r.oninput=f;f()})}
function openScaleInfo(key){const g=scaleGuides[key];if(!g)return;$('scaleInfoTitle').textContent=g.title;$('scaleInfoBody').innerHTML=g.levels.map(x=>`<div class="scale-info-row">${esc(x)}</div>`).join('');$('scaleInfoBackdrop').classList.add('open');$('scaleInfoBackdrop').setAttribute('aria-hidden','false')}
function closeScaleInfo(){$('scaleInfoBackdrop').classList.remove('open');$('scaleInfoBackdrop').setAttribute('aria-hidden','true')}
function bindScaleInfo(root=document){root.querySelectorAll('[data-scale-info]').forEach(b=>b.onclick=e=>{e.preventDefault();e.stopPropagation();openScaleInfo(b.dataset.scaleInfo)})}
bindRanges();bindScaleInfo();$('scaleInfoClose').onclick=closeScaleInfo;$('scaleInfoBackdrop').addEventListener('click',e=>{if(e.target===$('scaleInfoBackdrop'))closeScaleInfo()});
$('usualSchedule').onchange=()=>$('sleepException').classList.toggle('hidden',$('usualSchedule').checked);
$('usualFood').onchange=()=>$('foodException').classList.toggle('hidden',$('usualFood').checked);
let trainingDrafts=[];
function enabledTrainingTypes(){return data.trainingTypes.filter(x=>x.enabled!==false).sort((a,b)=>(a.order||0)-(b.order||0))}
function newTraining(){
 const type=enabledTrainingTypes()[0]||{id:'other',name:'⚽ Otros',kind:'other'};
 return {
  typeId:type.id,typeName:type.name,kind:type.kind,competition:false,poles:null,bikeMode:'indoor',
  duration:'',temperature:'',notes:'',terrain:'Camino',distanceKm:'',elevGain:'',elevLoss:'',
  avgPace:'',tssValue:'',tssType:'hrTSS',ifValue:'',avgPower:'',avgCadence:'',avgHeartRate:'',
  rpeGlobal:0,rpeLegs:0,rpeCardio:0
 };
}
function syncTrainingDraft(card,draft){
 for(const field of card.querySelectorAll('[data-field]')){
  draft[field.dataset.field]=field.type==='checkbox'?field.checked:field.value;
 }
 const type=data.trainingTypes.find(item=>item.id===draft.typeId);
 if(type){draft.typeName=type.name;draft.kind=type.kind}
}
function typeOptions(draft){
 const types=enabledTrainingTypes();
 if(!types.some(item=>item.id===draft.typeId))types.push({id:draft.typeId,name:draft.typeName||'Otros'});
 return types.map(item=>`<option value="${esc(item.id)}" ${item.id===draft.typeId?'selected':''}>${esc(item.name)}</option>`).join('');
}
function rangeField(label,field,val=0){return `<label class="scale-card mini-scale"><span>${label} <button type="button" class="info-button" data-scale-info="${field}" aria-label="Ayuda de ${esc(label)}">ⓘ</button></span><div class="scale-control"><input type="range" min="0" max="10" value="${Number(val)||0}" data-field="${field}" data-scale-key="${field}"><output>${Number(val)||0}</output></div><small class="scale-description" data-scale-description="${field}"></small></label>`}
function trainingNumber(label,field,value,step='1',max=''){
 return `<label>${label}<input data-field="${field}" type="number" min="0" ${max?'max="'+max+'"':''} step="${step}" value="${esc(value??'')}"></label>`;
}
function dynamicFields(d){
 const hr=trainingNumber('Frecuencia cardíaca media (ppm)','avgHeartRate',d.avgHeartRate,'1',240);
 const load=`<div class="grid three">${trainingNumber('Carga','tssValue',d.tssValue,'any')}<label>Tipo TSS<select data-field="tssType">${['hrTSS','TSS','rTSS','Otro'].map(type=>`<option ${d.tssType===type?'selected':''}>${type}</option>`).join('')}</select></label>${trainingNumber('IF','ifValue',d.ifValue,'any',2)}</div>`;
 const rpes=`<div class="metric-form-grid training-rpes">${rangeField('RPE global','rpeGlobal',d.rpeGlobal)}${rangeField('RPE piernas','rpeLegs',d.rpeLegs)}${rangeField('RPE cardio','rpeCardio',d.rpeCardio)}</div>`;
 const distance=trainingNumber('Kilómetros','distanceKm',d.distanceKm,'any');
 const elevation=trainingNumber('Desnivel + (m)','elevGain',d.elevGain)+trainingNumber('Desnivel − (m)','elevLoss',d.elevLoss);
 let fields='';
 if(d.kind==='run'){
  fields=`<div class="grid two"><label>Terreno<select data-field="terrain">${['Asfalto','Pista','Camino','Montaña','Mixto'].map(type=>`<option ${d.terrain===type?'selected':''}>${type}</option>`).join('')}</select></label>${distance}${elevation}<label>Ritmo medio<input data-field="avgPace" class="smart-pace" inputmode="numeric" maxlength="6" placeholder="Ej. 632 → 6:32" value="${esc(d.avgPace)}"></label><label>Bastones<select data-field="poles"><option value="">Sin indicar</option><option value="yes" ${d.poles===true||d.poles==='yes'?'selected':''}>Sí</option><option value="no" ${d.poles===false||d.poles==='no'?'selected':''}>No</option></select></label></div>`;
 }
 if(d.kind==='trekking')fields=`<div class="grid two">${distance}${elevation}</div>`;
 if(d.kind==='bike'){
  const outdoors=d.bikeMode==='outdoor';
  fields=`<label>Modalidad<select data-field="bikeMode"><option value="indoor">Indoor / spinning</option><option value="outdoor" ${outdoors?'selected':''}>Exterior</option></select></label>`;
  if(outdoors)fields+=`<div class="grid three">${distance}${trainingNumber('Potencia media (W)','avgPower',d.avgPower)}${trainingNumber('Cadencia media','avgCadence',d.avgCadence)}</div>`;
 }
 if(d.kind==='functional')fields=`<label>Zona trabajada<input data-field="terrain" value="${esc(d.terrain==='Camino'?'':d.terrain)}"></label>`;
 return fields+hr+load+rpes;
}
function renderTrainingCards(list,drafts,{standalone=false}={}){
 list.innerHTML=drafts.map((draft,index)=>{
  const id=list.id+'-notes-'+index;
  const indoor=draft.kind==='bike'&&draft.bikeMode!=='outdoor';
  const temperatures=['Frío','Templado','Calor','Calor intenso'];
  if(draft.temperature&&!temperatures.includes(draft.temperature))temperatures.push(draft.temperature);
  return `<div class="training-card" data-index="${index}">
   ${standalone?'':`<div class="training-card-head"><strong>Entrenamiento ${index+1}</strong><button type="button" class="icon-mini danger-text" data-remove-training="${index}">Eliminar</button></div>`}
   <div class="grid two"><label>Tipo<select data-field="typeId">${typeOptions(draft)}</select></label>
   <label>Duración (minutos o h:mm)<input data-field="duration" class="smart-duration" inputmode="numeric" maxlength="6" placeholder="Ej. 125 → 01:25" value="${esc(draft.duration)}"></label></div>
   <div class="inline-options">
   ${draft.kind==='run'? `<label class="tick-card small-tick"><input type="checkbox" data-field="competition" ${draft.competition?'checked':''}><span>🏁 Competición</span></label>`:''}
   ${indoor?'':`<label>Temperatura (opcional)<select data-field="temperature"><option value="">Sin registrar</option>${temperatures.map(t=>`<option ${draft.temperature===t?'selected':''}>${esc(t)}</option>`).join('')}</select></label>`}
   </div><div class="training-dynamic">${dynamicFields(draft)}</div>
   <label>Comentario<div class="voice-field"><textarea id="${id}" class="auto-grow" data-field="notes" rows="3">${esc(draft.notes)}</textarea>
   <div class="field-actions"><button type="button" class="voice-button" data-voice-target="${id}">🎙️ Dictar</button><button type="button" class="expand-button" data-expand-target="${id}">⛶ Ampliar</button></div></div></label>
   </div>`;
 }).join('')||'<div class="empty-config">Sin entrenamiento registrado.</div>';
 for(const card of list.querySelectorAll('.training-card')){
  const index=Number(card.dataset.index),draft=drafts[index];
  const gain=card.querySelector('[data-field="elevGain"]');
  const loss=card.querySelector('[data-field="elevLoss"]');
  if(gain){
   gain.oninput=()=>{
    if(!draft.manualDescent)loss.value=gain.value;
   };
   loss.oninput=()=>{
    draft.manualDescent=loss.value!=='';
    if(!draft.manualDescent)loss.value=gain.value;
   };
  }
  for(const select of card.querySelectorAll('[data-field="typeId"],[data-field="bikeMode"]')){
   select.onchange=()=>{
    list.querySelectorAll('.training-card').forEach((item,i)=>syncTrainingDraft(item,drafts[i]));
    renderTrainingCards(list,drafts,{standalone});
   };
  }
  const remove=card.querySelector('[data-remove-training]');
  if(remove)remove.onclick=()=>{
   list.querySelectorAll('.training-card').forEach((item,i)=>syncTrainingDraft(item,drafts[i]));
   drafts.splice(index,1);
   renderTrainingCards(list,drafts,{standalone});
  };
 }
 bindRanges(list);
 bindScaleInfo(list);
 bindVoiceButtons(list);
 bindExpandableTextareas(list);
 bindSmartNumericTimeFields(list);
}
function renderTrainingList(){
 $('historicalTrainingBlock').classList.toggle('hidden',trainingDrafts.length===0);
 renderTrainingCards($('trainingList'),trainingDrafts);
}
function makeTrainingDraft(training){
 return {...newTraining(),...training,
  bikeMode:training.bikeMode||((training.distanceKm||training.avgPower||training.avgCadence)?'outdoor':'indoor'),
  manualDescent:training.manualDescent??(training.elevLoss!==''&&training.elevLoss!=null)
 };
}
function collectTraining(card,draft){
 syncTrainingDraft(card,draft);
 const mins=parseDuration(draft.duration);
 if(mins===null)throw new Error('La duración no es válida. Ejemplos: 45 = 00:45 y 125 = 01:25.');
 const training={...draft};
 if(!mins&&(Number(training.distanceKm)>0||String(training.avgPace||'').trim())&&!draft.uuid){
  throw new Error('Introduce la duración si has indicado distancia o ritmo.');
 }
 const oldSeconds=nullableNumber(training.durationSeconds);
 training.durationSeconds=oldSeconds!==null&&mins===Math.round(oldSeconds/60)?oldSeconds:mins*60;
 training.durationMinutes=mins;
 training.duration=minutesText(mins);
 training.uuid=training.uuid||makeUuid();
 const canonicalInputs={
  elevationGainM:'elevGain',elevationLossM:'elevLoss',paceSecondsPerKm:'avgPace',
  tss:'tssValue',intensityFactor:'ifValue',averagePowerW:'avgPower',
  averageCadenceRpm:'avgCadence',averageHeartRateBpm:'avgHeartRate'
 };
 for(const [stored,input] of Object.entries(canonicalInputs)){
  if(card.querySelector(`[data-field="${input}"]`))delete training[stored];
 }
 if(!draft.uuid){
  if(training.kind!=='run'){training.competition=false;training.poles=null}
  if(training.kind!=='bike')delete training.bikeMode;
  if(training.kind!=='run'&&training.kind!=='trekking'){
   training.elevGain='';training.elevLoss='';
  }
  if(training.kind!=='run')training.avgPace='';
  if(training.kind==='bike'&&training.bikeMode==='indoor'){
   training.distanceKm='';training.avgPower='';training.avgCadence='';training.temperature='';
  }
  if(!['run','trekking','bike'].includes(training.kind))training.distanceKm='';
 }
 return training;
}
let standaloneTrainingDraft=null;
let editingTrainingId=null;
let trainingReturnDate='';
function prepareTraining(){
 if(standaloneTrainingDraft)return;
 openTrainingForm();
}
function openTrainingForm(training=null){
 const now=new Date();
 standaloneTrainingDraft=training?makeTrainingDraft(training):newTraining();
 editingTrainingId=training?.uuid??null;
 trainingReturnDate=training?.date??'';
 $('trainingDate').value=training?.date??localISO(now);
 $('trainingTime').value=training?training.time||'':localTime(now);
 $('trainingFormTitle').textContent=training?'Editar entrenamiento':'Registrar entrenamiento';
 renderTrainingCards($('standaloneTrainingList'),[standaloneTrainingDraft],{standalone:true});
}
function closeTrainingForm(date){
 standaloneTrainingDraft=null;
 editingTrainingId=null;
 if(date)showCalendarDate(date);
 else go('home');
}
$('cancelTraining').onclick=()=>closeTrainingForm(trainingReturnDate);
$('trainingForm').onsubmit=event=>{
 event.preventDefault();
 stopActiveDictation();
 let training;
 try{
  training=collectTraining($('standaloneTrainingList').querySelector('.training-card'),standaloneTrainingDraft);
 }catch(error){return alert(error.message)}
 const date=getVal('trainingDate');
 if(!date)return alert('Indica la fecha del entrenamiento.');
 const now=new Date().toISOString();
 const record={
  ...training,date,time:getVal('trainingTime')||null,
  createdAt:training.createdAt||now,updatedAt:now
 };
 const trainings=editingTrainingId
  ?data.trainings.map(item=>item.uuid===editingTrainingId?record:item)
  :[...data.trainings,record];
 if(!saveData({...data,trainings}))return;
 closeTrainingForm(date);
};

function renderRespiratoryFields(){
 $('respiratoryMarkers').innerHTML=respiratoryGroups.map(([title,fields])=>
  `<fieldset class="respiratory-group"><legend>${title}</legend><div class="marker-row">${fields.map(([id,label])=>
   `<label class="tick-card"><input id="${id}" type="checkbox"><span>${label}</span></label>`).join('')}</div></fieldset>`).join('');
}
function collectRespiratory(){
 const active=$('respiratorySymptoms').checked;
 return {
  ...Object.fromEntries(respiratoryFields.map(([id])=>[id,$(id).checked])),
  respiratorySymptoms:active,nasalCongestion:getNum('nasalCongestion'),mucus:getNum('mucus'),
  respiratoryIntensity:nullableNumber(getVal('respiratoryIntensity')),
  respiratoryNotes:getVal('respiratoryNotes').trim()
 };
}
function restoreRespiratory(entry){
 $('respiratorySymptoms').checked=!!entry.respiratorySymptoms;
 $('respiratoryDetail').classList.toggle('hidden',!entry.respiratorySymptoms);
 $('nasalCongestion').value=entry.nasalCongestion||0;
 $('mucus').value=entry.mucus||0;
 $('respiratoryIntensity').value=entry.respiratoryIntensity??'';
 $('respiratoryNotes').value=entry.respiratoryNotes||'';
 for(const [id] of respiratoryFields)$(id).checked=!!entry[id];
}
let editingEpisodeId=null;
const episodeInputs={
 type:'episodeType',symptom:'episodeSymptom',date:'episodeDate',time:'episodeTime',
 duration:'episodeDuration',intensity:'episodeIntensity',location:'episodeLocation',side:'episodeSide',
 context:'episodeContext',trainingId:'episodeTraining',endDate:'episodeEndDate',
 endTime:'episodeEndTime',notes:'episodeNotes'
};
function episodeTrainingOptions(){
 const historical=data.entries.flatMap(entry=>(entry.trainings||[]).map(training=>({
  ...training,date:training.date||previousISO(entry.date)
 })));
 return [...data.trainings,...historical].sort((a,b)=>b.date.localeCompare(a.date));
}
function prepareEpisodes(){
 const select=$('episodeTraining');
 const selected=select.value;
 select.innerHTML='<option value="">Sin vincular</option>'+episodeTrainingOptions().map(training=>
  `<option value="${esc(training.uuid)}">${esc(training.date)} · ${esc(training.typeName)}</option>`).join('');
 if(selected&&!Array.from(select.options).some(option=>option.value===selected)){
  select.add(new Option('Entrenamiento eliminado',selected));
 }
 select.value=selected;
 if(!editingEpisodeId&&!$('episodeType').value&&!$('episodeSymptom').value.trim())resetEpisodeForm();
 renderEpisodeList();
}
function resetEpisodeForm(){
 const now=new Date();
 editingEpisodeId=null;
 $('episodeForm').reset();
 $('episodeDate').value=localISO(now);
 $('episodeTime').value=localTime(now);
 $('episodeFormTitle').textContent='Registrar episodio';
 $('episodeDetails').open=false;
 $('cancelEpisode').classList.add('hidden');
}
function openEpisode(episode){
 go('episodes');
 editingEpisodeId=episode.uuid;
 if(episode.trainingId&&!Array.from($('episodeTraining').options).some(option=>option.value===episode.trainingId)){
  $('episodeTraining').add(new Option('Entrenamiento eliminado',episode.trainingId));
 }
 for(const [key,id] of Object.entries(episodeInputs))$(id).value=episode[key]??'';
 $('episodeFormTitle').textContent='Editar episodio';
 $('episodeDetails').open=Object.keys(episodeInputs).slice(4).some(key=>episode[key]!=null&&episode[key]!=='');
 $('cancelEpisode').classList.remove('hidden');
}
function episodeSummary(episode){
 const linked=episode.trainingId?episodeTrainingOptions().find(training=>training.uuid===episode.trainingId):null;
 const details=[
  episode.location,episode.side,episode.duration,episode.intensity==null?'':`${episode.intensity}/10`,
  episode.context,episode.endDate?`Fin: ${episode.endDate} ${episode.endTime||''}`:'',
  linked?`Entrenamiento: ${linked.typeName} (${linked.date})`:''
 ].filter(Boolean);
 return `<article class="card episode-card"><h4>${esc(episodeTypes[episode.type]||'Episodio')}${episode.symptom?' · '+esc(episode.symptom):''}</h4>
 <p>${esc(episode.date)}${episode.time?' · '+esc(episode.time):''}</p>
 ${details.length?`<p>${details.map(esc).join(' · ')}</p>`:''}
 ${episode.notes?`<p class="episode-notes">${esc(episode.notes)}</p>`:''}
 <div class="button-row"><button type="button" class="secondary-button" data-edit-episode="${esc(episode.uuid)}">Editar</button>
 <button type="button" class="danger" data-delete-episode="${esc(episode.uuid)}">Eliminar</button></div></article>`;
}
function renderEpisodeList(){
 const episodes=data.events.filter(item=>item.kind==='episode').sort((a,b)=>
  (b.date+(b.time||'')).localeCompare(a.date+(a.time||'')));
 $('episodeList').innerHTML=episodes.map(episodeSummary).join('');
}
$('cancelEpisode').onclick=resetEpisodeForm;
$('episodeForm').onsubmit=event=>{
 event.preventDefault();
 const fields=Object.fromEntries(Object.entries(episodeInputs).map(([key,id])=>[key,getVal(id).trim()]));
 if(!fields.date||(!fields.type&&!fields.symptom))return alert('Indica la fecha y el tipo o una descripción del episodio.');
 if(fields.endTime&&!fields.endDate)fields.endDate=fields.date;
 if(fields.endDate&&(fields.endDate<fields.date||
    (fields.endDate===fields.date&&fields.time&&fields.endTime&&fields.endTime<fields.time))){
  return alert('El fin del episodio debe ser posterior al inicio.');
 }
 const previous=data.events.find(item=>item.uuid===editingEpisodeId);
 const now=new Date().toISOString();
 const episode={
  ...previous,...fields,kind:'episode',uuid:previous?.uuid||makeUuid(),
  createdAt:previous?.createdAt||now,updatedAt:now,intensity:nullableNumber(fields.intensity)
 };
 const events=previous?data.events.map(item=>item.uuid===episode.uuid?episode:item):[...data.events,episode];
 if(!saveData({...data,events}))return;
 resetEpisodeForm();
 showCalendarDate(episode.date);
};
function renderItemInputs(arr,id){$(id).innerHTML=arr.filter(x=>x.enabled!==false).sort((a,b)=>(a.order||0)-(b.order||0)).map(x=>`<div class="supp-entry"><label class="switch-row"><input type="checkbox" data-item-check="${x.id}" data-group="${id}" ${x.defaultTaken?'checked':''}><span><strong>${esc(x.name)}</strong><small>${esc(x.composition||'')}</small></span></label><div class="supp-dose"><input type="number" min="0" step="0.1" value="${x.dose??0}" data-item-dose="${x.id}" data-group="${id}"><span>${esc(x.unit||'')}</span></div></div>`).join('')||'<div class="empty-config">Sin elementos configurados.</div>'}
function renderRecordItems(){
 renderItemInputs(data.dailySupplements,'dailySupplements');
 renderItemInputs(data.sportSupplements.filter(item=>!hiddenSportItems.has(item.id)),'sportSupplements');
 renderItemInputs(data.medications,'medications');
 const protein=document.querySelector('[data-item-check="protein"][data-group="sportSupplements"]');
 const creatine=document.querySelector('[data-item-check="creatine"][data-group="sportSupplements"]');
 const config=data.sportSupplements.find(item=>item.id==='creatine');
 if(protein&&creatine&&config?.defaultTaken){
  creatine.checked=protein.checked;
  protein.onchange=()=>creatine.checked=protein.checked;
 }
 bindSmartNumericTimeFields($('quickForm'));
}
function isLegacyCompositionIncomplete(v){const x=String(v??'').trim().toLowerCase().replace(/\s+/g,' ');return !x||['epa/dha','vitaminas y minerales','según pauta',''].includes(x)}
function stableProductVersionId(x={}){const id=String(x.supplementId||x.id||'supplement');const current=String(x.productVersionId||'');return current.includes('-product-')?current:`${id}-product-001`}
function collectItems(group){const arr=data[group]||[];return arr.filter(x=>document.querySelector(`[data-item-check="${x.id}"][data-group="${group}"]`)?.checked).map(x=>{const composition=String(x.composition||'');return {id:x.id,supplementId:x.id,productVersionId:stableProductVersionId(x),name:x.name,amount:Number(document.querySelector(`[data-item-dose="${x.id}"][data-group="${group}"]`)?.value||0),unit:x.unit,composition,compositionSnapshot:composition,legacyIncomplete:isLegacyCompositionIncomplete(composition)}})}
function getNum(id){return $(id)?Number($(id).value||0):0}function getVal(id){return $(id)?$(id).value:''}
let editingDate=null;let handPhotoData=[];let recordSaveFailed=false;
function prepareNewRecord(){
 if(editingDate||recordSaveFailed)return;
 $('entryDate').value=localISO();
 renderRecordItems();
 renderTrainingList();
 updateTemporalLabels();
}
function resetForm(){
 editingDate=null;
 recordSaveFailed=false;
 $('quickForm').reset();
 $('anthropometrySection').open=false;
 $('entryDate').value=localISO();
 document.querySelectorAll('#quickForm input[type=range]').forEach(r=>{r.value=0;r.dispatchEvent(new Event('input'))});
 $('usualSchedule').checked=true;$('usualFood').checked=true;$('handSymptoms').checked=false;$('handSymptomsDetail').classList.add('hidden');$('stressSymptoms').checked=false;$('stressDetail').classList.add('hidden');
 $('sleepException').classList.add('hidden');$('foodException').classList.add('hidden');
 document.querySelectorAll('[name=dayContext]').forEach(x=>x.checked=x.value==='routine');
 document.querySelectorAll('[name=foodChange]').forEach(x=>x.checked=false);
 $('customContext').value='';$('customContextWrap').classList.add('hidden');
 $('respiratorySymptoms').checked=false;$('respiratoryDetail').classList.add('hidden');
 $('nasalCongestion').value=0;$('mucus').value=0;
 for(const [id] of respiratoryFields)$(id).checked=false;
 $('respiratoryNotes').value='';
 for(const side of ['right','left']){$(side+'Joint').value='';$(side+'MobilityLimited').checked=false;document.querySelectorAll(`[name=${side}Finger]`).forEach(x=>x.checked=false)}
 $('handNotes').value='';handPhotoData=[];renderHandPhoto();toggleHandDetail(false);
 $('weightKg').value='';$('waistCm').value='';$('hipCm').value='';updateAnthropometryHints();$('appleRestingHeartRate').value='';$('appleHrvAverage').value='';$('appleHrvMin').value='';$('appleHrvMax').value='';
 $('bowelFrequency').value='0';$('bristolType').value='';$('bowelUrgency').checked=false;$('bowelPain').checked=false;$('bowelBlood').checked=false;$('bowelNotes').value='';toggleBowelDetail();updateCompactSummaries();
 trainingDrafts=[];renderTrainingList();renderRecordItems();bindExpandableTextareas();bindRanges();bindScaleInfo();updateTemporalLabels();
}
function previousISO(date){const d=new Date(date+'T12:00:00');d.setDate(d.getDate()-1);return localISO(d)}
function updateTemporalLabels(){const date=$('entryDate').value||localISO(),prev=previousISO(date);document.querySelectorAll('.kicker').forEach(()=>{});const labels=document.querySelectorAll('#record .kicker');if(labels[0])labels[0].textContent=`AL DESPERTAR · ${date.split('-').reverse().slice(0,2).join('/')}`}
function latestMeasurement(field,beforeDate='9999-12-31'){return [...data.entries].filter(e=>e.date<=beforeDate&&nullableNumber(e[field])!==null).sort((a,b)=>a.date.localeCompare(b.date)).at(-1)||null}
function measurementHint(field,unit,beforeDate){const e=latestMeasurement(field,beforeDate||($('entryDate')?.value||localISO()));if(!e)return 'Sin mediciones previas';return `Último: ${Number(e[field]).toFixed(1).replace('.',',')} ${unit} · ${fmtDate(e.date)}`}
function updateAnthropometryHints(){const d=$('entryDate')?.value||localISO();if($('lastWeightHint'))$('lastWeightHint').textContent=measurementHint('weightKg','kg',d);if($('lastWaistHint'))$('lastWaistHint').textContent=measurementHint('waistCm','cm',d);if($('lastHipHint'))$('lastHipHint').textContent=measurementHint('hipCm','cm',d)}
function hasHandSymptoms(e){const hd=e?.handDetails||{};return !!e?.paddedHands||Number(e?.handSwelling||0)>0||Number(e?.handPain||0)>0||Number(e?.peeling||0)>0||(hd.right?.fingers||[]).length>0||(hd.left?.fingers||[]).length>0||!!hd.right?.joint||!!hd.left?.joint||!!hd.notes||(hd.photos||[]).length>0}
function toggleHandSymptoms(show){$('handSymptomsDetail').classList.toggle('hidden',!show);if(!show)toggleHandDetail(false)}
function toggleStressDetail(){const show=$('stressSymptoms').checked;$('stressDetail').classList.toggle('hidden',!show);updateCompactSummaries()}
function toggleBowelDetail(){const n=Number($('bowelFrequency').value||0);$('bowelDetail').classList.toggle('hidden',n===0);if(n===0){$('bristolType').value='';$('bowelUrgency').checked=false;$('bowelPain').checked=false;$('bowelBlood').checked=false;$('bowelNotes').value=''}updateCompactSummaries()}
function updateCompactSummaries(){if($('stressSummary')){const bits=[];if($('stressSymptoms')?.checked){const s=getNum('stress');if(s)bits.push(`estrés ${s}/10`);if($('jawTension').checked)bits.push('mandíbula');if($('calfTension').checked)bits.push('gemelos');if($('eyeTic').checked)bits.push('tic ocular')}$('stressSummary').textContent=bits.length?bits.join(' · '):'Sin señales'}if($('respiratorySummary'))$('respiratorySummary').textContent=$('respiratorySymptoms')?.checked?'Con síntomas':'Sin síntomas';if($('bowelSummary')){const n=Number($('bowelFrequency')?.value||0);$('bowelSummary').textContent=n===0?'0 deposiciones':(n>=4?'4 o más deposiciones':`${n} deposición${n===1?'':'es'}`)}if($('foodSummary'))$('foodSummary').textContent=$('usualFood')?.checked?'Habitual':'Distinta de lo habitual';if($('contextSummary')){const vals=[...document.querySelectorAll('[name=dayContext]:checked')].map(x=>x.parentElement?.innerText?.trim()||x.value);$('contextSummary').textContent=vals.length?vals.join(' · '):'Sin contexto'}}
function toggleHandDetail(force){const show=force!==undefined?force:(getNum('handSwelling')>=2||getNum('handPain')>=2);$('handDetail').classList.toggle('hidden',!show);$('toggleHandDetail').textContent=show?'− Ocultar detalle de manos':'＋ Añadir detalle de manos'}
async function compressImage(file){return new Promise((resolve,reject)=>{const r=new FileReader();r.onerror=reject;r.onload=()=>{const img=new Image();img.onload=()=>{const max=1200,scale=Math.min(1,max/Math.max(img.width,img.height)),c=document.createElement('canvas');c.width=Math.round(img.width*scale);c.height=Math.round(img.height*scale);c.getContext('2d').drawImage(img,0,0,c.width,c.height);resolve(c.toDataURL('image/jpeg',.78))};img.src=r.result};r.readAsDataURL(file)})}
function renderHandPhoto(){const box=$('handPhotoPreview');box.innerHTML=handPhotoData.map((src,i)=>`<div class="hand-photo-item"><img class="hand-photo-preview" src="${src}" alt="Foto de manos ${i+1}"><button type="button" class="small-button" data-remove-photo="${i}">Quitar</button></div>`).join('');box.querySelectorAll('[data-remove-photo]').forEach(b=>b.onclick=()=>{handPhotoData.splice(Number(b.dataset.removePhoto),1);renderHandPhoto()})}
async function addHandPhotos(files){for(const file of [...files]){if(file.type.startsWith('image/'))handPhotoData.push(await compressImage(file))}renderHandPhoto()}
let activeRecognition=null,activeVoiceButton=null,dictationTimer=null;
function isStandaloneApp(){return window.matchMedia('(display-mode: standalone)').matches||window.navigator.standalone===true}
function resetVoiceButton(button){if(!button)return;button.textContent=isStandaloneApp()?'⌨️ Usar teclado':'🎙️ Dictar';button.classList.remove('listening')}
function stopActiveDictation(){if(dictationTimer){clearTimeout(dictationTimer);dictationTimer=null}if(activeRecognition){const r=activeRecognition;activeRecognition=null;try{r.stop()}catch{try{r.abort()}catch{}}}resetVoiceButton(activeVoiceButton);activeVoiceButton=null}
function bindVoiceButtons(root=document){root.querySelectorAll('[data-voice-target]').forEach(b=>{resetVoiceButton(b);b.onclick=()=>startDictation(b.dataset.voiceTarget,b)})}
function autoGrow(el){el.style.height='auto';el.style.height=Math.min(el.scrollHeight,420)+'px'}
let activeTextTarget=null;
function openTextEditor(target){const t=typeof target==='string'?$(target):target;if(!t)return;activeTextTarget=t;$('textEditorArea').value=t.value||'';$('textEditorTitle').textContent=t.closest('label')?.childNodes?.[0]?.textContent?.trim()||'Editar observaciones';$('textEditorBackdrop').classList.add('open');$('textEditorBackdrop').setAttribute('aria-hidden','false');document.body.classList.add('text-editor-open');setTimeout(()=>$('textEditorArea').focus(),50)}
function closeTextEditor(apply=false){const back=$('textEditorBackdrop');if(!back||!back.classList.contains('open'))return;if(apply&&activeTextTarget){activeTextTarget.value=$('textEditorArea').value;activeTextTarget.dispatchEvent(new Event('input',{bubbles:true}));autoGrow(activeTextTarget)}back.classList.remove('open');back.setAttribute('aria-hidden','true');document.body.classList.remove('text-editor-open');activeTextTarget=null}
function bindExpandableTextareas(root=document){root.querySelectorAll('textarea.auto-grow').forEach(t=>{t.oninput=()=>autoGrow(t);autoGrow(t)});root.querySelectorAll('[data-expand-target]').forEach(b=>b.onclick=()=>openTextEditor(b.dataset.expandTarget))}
$('textEditorClose').onclick=()=>closeTextEditor(true);$('textEditorApply').onclick=()=>closeTextEditor(true);$('textEditorCancel').onclick=()=>closeTextEditor(false);$('textEditorBackdrop').addEventListener('click',e=>{if(e.target===$('textEditorBackdrop'))closeTextEditor(true)});document.addEventListener('keydown',e=>{if(e.key==='Escape')closeTextEditor(true)});
function startDictation(targetId,button){const target=$(targetId);if(!target)return;if(isStandaloneApp()){target.focus();alert('En la aplicación instalada, usa el micrófono del teclado de iPhone o iPad. El dictado web directo solo está disponible al abrir HealthLab en Safari.');return}if(activeRecognition){stopActiveDictation();return}const SR=window.SpeechRecognition||window.webkitSpeechRecognition;if(!SR){target.focus();return alert('El dictado web no está disponible aquí. Usa el micrófono del teclado.')}const r=new SR();activeRecognition=r;activeVoiceButton=button;r.lang='es-ES';r.interimResults=false;r.continuous=false;r.maxAlternatives=1;button.textContent='⏹ Detener';button.classList.add('listening');dictationTimer=setTimeout(()=>stopActiveDictation(),12000);r.onresult=e=>{const text=e.results?.[0]?.[0]?.transcript?.trim();if(text)target.value=(target.value?target.value.trim()+' ':'')+text;stopActiveDictation()};r.onerror=e=>{const harmless=['aborted','no-speech'].includes(e.error);stopActiveDictation();if(!harmless)alert('No se pudo completar el dictado. Revisa el permiso del micrófono o usa el micrófono del teclado.')};r.onend=()=>{if(activeRecognition===r){activeRecognition=null;if(dictationTimer){clearTimeout(dictationTimer);dictationTimer=null}resetVoiceButton(button);activeVoiceButton=null}};try{r.start()}catch{stopActiveDictation();alert('No se pudo activar el micrófono. Revisa el permiso de Safari.')}}
window.addEventListener('pagehide',stopActiveDictation);document.addEventListener('visibilitychange',()=>{if(document.hidden)stopActiveDictation()});

function comparableEntry(e){const x=normalizeEntry(clone(e));delete x.updatedAt;delete x.revision;delete x.history;delete x.id;delete x.date;delete x.uuid;delete x.source;if(x.handDetails?.photos)x.handDetails.photos=x.handDetails.photos.map((_,i)=>`photo-${i+1}`);return x}
function diffFields(oldEntry,newEntry){const a=comparableEntry(oldEntry),b=comparableEntry(newEntry),changes={};for(const key of new Set([...Object.keys(a),...Object.keys(b)])){if(JSON.stringify(a[key])!==JSON.stringify(b[key]))changes[key]={from:a[key]??null,to:b[key]??null}}return changes}
function nullableNumber(v){if(v===null||v===undefined||v==='')return null;const n=Number(String(v).replace(',','.'));return Number.isFinite(n)?n:null}
function paceToSeconds(v){if(v===null||v===undefined||v==='')return null;if(typeof v==='number'&&Number.isFinite(v)){const m=Math.floor(v),sec=Math.round((v-m)*100);return sec<60?m*60+sec:null}let x=String(v).trim().replace(',', '.');if(/^\d+$/.test(x)){if(x.length<=2)return Number(x)*60;if(x.length<=4){const m=Number(x.slice(0,-2)),sec=Number(x.slice(-2));return sec<60?m*60+sec:null}return null}x=x.replace('.',':');if(!/^\d{1,3}:\d{1,2}$/.test(x))return null;const [m,sec]=x.split(':').map(Number);return sec<60?m*60+sec:null}
function normalizeSupplementConfig(list=[]){return list.map((x,i)=>({id:String(x.id||`supplement-${i+1}`),productVersionId:stableProductVersionId(x),name:String(x.name||''),dose:nullableNumber(x.dose)??0,unit:String(x.unit||''),composition:String(x.composition||''),enabled:x.enabled!==false,order:i+1,defaultTaken:!!x.defaultTaken}))}
function normalizeTakenSupplement(x={}){const snapshot=String(x.compositionSnapshot??x.composition??'');return {supplementId:String(x.supplementId||x.id||''),productVersionId:stableProductVersionId(x),name:String(x.name||''),amount:nullableNumber(x.amount),unit:String(x.unit||''),compositionSnapshot:snapshot,legacyIncomplete:x.legacyIncomplete===true||isLegacyCompositionIncomplete(snapshot)}}
function normalizeTraining(t={}){const durationSeconds=nullableNumber(t.durationSeconds)??((nullableNumber(t.durationMinutes)??parseDuration(t.duration||'')??0)*60);const paceSecondsPerKm=nullableNumber(t.paceSecondsPerKm)??paceToSeconds(t.avgPace);return {uuid:t.uuid||makeUuid(),typeId:String(t.typeId||''),typeName:String(t.typeName||''),kind:String(t.kind||'other'),...(t.date?{date:t.date,time:t.time||null,createdAt:t.createdAt||null,updatedAt:t.updatedAt||null}:{}),poles:t.poles===true||t.poles==='yes'?true:(t.poles===false||t.poles==='no'?false:null),bikeMode:t.bikeMode||null,manualDescent:t.manualDescent??null,competition:!!t.competition,durationSeconds:Math.round(durationSeconds),temperature:t.temperature?String(t.temperature):null,notes:String(t.notes||''),terrain:t.terrain?String(t.terrain):null,distanceKm:nullableNumber(t.distanceKm),elevationGainM:nullableNumber(t.elevationGainM??t.elevGain),elevationLossM:nullableNumber(t.elevationLossM??t.elevLoss),paceSecondsPerKm,tss:nullableNumber(t.tss??t.tssValue),tssType:t.tssType?String(t.tssType):null,intensityFactor:nullableNumber(t.intensityFactor??t.ifValue),averagePowerW:(nullableNumber(t.averagePowerW??t.avgPower)===0?null:nullableNumber(t.averagePowerW??t.avgPower)),averageCadenceRpm:(nullableNumber(t.averageCadenceRpm??t.avgCadence)===0?null:nullableNumber(t.averageCadenceRpm??t.avgCadence)),averageHeartRateBpm:(nullableNumber(t.averageHeartRateBpm??t.avgHeartRate)===0?null:nullableNumber(t.averageHeartRateBpm??t.avgHeartRate)),rpeGlobal:nullableNumber(t.rpeGlobal),rpeLegs:nullableNumber(t.rpeLegs),rpeCardio:nullableNumber(t.rpeCardio),bodyArea:t.bodyArea?String(t.bodyArea):null}}
function normalizeEntry(e={}){const hd=e.handDetails||{};const side=x=>({fingers:Array.isArray(x?.fingers)?x.fingers.map(String):[],joint:x?.joint?String(x.joint):null,mobilityLimited:!!x?.mobilityLimited});return {id:`entry-${e.date}`,uuid:e.uuid||makeUuid(),date:String(e.date||''),createdAt:e.createdAt||null,updatedAt:e.updatedAt||null,revision:Number(e.revision||1),sleepQuality:nullableNumber(e.sleepQuality),sleepDurationMinutes:nullableNumber(e.sleepDurationMinutes)??nullableNumber(e.sleepMinutes)??parseDuration(e.sleepDuration||''),usualSchedule:e.usualSchedule!==false,sleepNotes:String(e.sleepNotes||''),fatigue:nullableNumber(e.fatigue),legFatigue:!!e.legFatigue,calfTension:!!e.calfTension,jawTension:!!e.jawTension,handSwelling:nullableNumber(e.handSwelling),handPain:nullableNumber(e.handPain),peeling:nullableNumber(e.peeling),abdominalInflammation:nullableNumber(e.abdominalInflammation)??0,paddedHands:e.paddedHands??null,wakeNotes:String(e.wakeNotes||''),weightKg:nullableNumber(e.weightKg),waistCm:nullableNumber(e.waistCm),hipCm:nullableNumber(e.hipCm),handDetails:{right:side(hd.right),left:side(hd.left),notes:String(hd.notes||''),photos:Array.isArray(hd.photos)?hd.photos:[]},appleRestingHeartRateBpm:nullableNumber(e.appleRestingHeartRateBpm??e.appleRestingHeartRate),appleHrvAverageMs:nullableNumber(e.appleHrvAverageMs??e.appleHrvAverage),appleHrvMinMs:nullableNumber(e.appleHrvMinMs),appleHrvMaxMs:nullableNumber(e.appleHrvMaxMs),hrv4TrainingScore:nullableNumber(e.hrv4TrainingScore),hrv4TrainingStatus:e.hrv4TrainingStatus?String(e.hrv4TrainingStatus):null,bowelFrequency:nullableNumber(e.bowelFrequency),bristolType:nullableNumber(e.bristolType),bowelUrgency:!!e.bowelUrgency,bowelPain:!!e.bowelPain,bowelBlood:!!e.bowelBlood,bowelNotes:String(e.bowelNotes||''),dayContexts:Array.isArray(e.dayContexts)?e.dayContexts.map(String):(e.dayContext?[String(e.dayContext)]:['routine']),customContext:String(e.customContext||''),stress:nullableNumber(e.stress),eyeTic:!!e.eyeTic,respiratorySymptoms:!!(e.respiratorySymptoms||e.hasRespiratorySymptoms),nasalCongestion:nullableNumber(e.nasalCongestion)??0,mucus:nullableNumber(e.mucus)??0,throatMucus:!!e.throatMucus,postNasalDrip:!!(e.postNasalDrip||e.nasalDrip),sneezing:!!e.sneezing,cough:!!e.cough,dailyBreathlessness:!!(e.dailyBreathlessness||e.shortnessOfBreath),respiratoryNotes:String(e.respiratoryNotes||''),respiratoryIntensity:nullableNumber(e.respiratoryIntensity),...Object.fromEntries(respiratoryFields.filter(([id])=>!['throatMucus','postNasalDrip','sneezing','cough','dailyBreathlessness'].includes(id)).map(([id])=>[id,e[id]??null])),usualFood:e.usualFood!==false,foodChanges:Array.isArray(e.foodChanges)?e.foodChanges.map(String):(e.foodChange?[String(e.foodChange)]:[]),foodNotes:String(e.foodNotes||''),trainings:(e.trainings||[]).map(normalizeTraining),dailySupplements:(e.dailySupplements||[]).map(normalizeTakenSupplement),sportSupplements:(e.sportSupplements||[]).map(normalizeTakenSupplement),medicationsTaken:(e.medicationsTaken||[]).map(normalizeTakenSupplement),notes:String(e.notes||''),aiAnalysis:e.aiAnalysis??null,source:e.source||{...SOURCE},history:Array.isArray(e.history)?e.history:[]}}
function normalizedPayload(input){const d=clone(input);return {schemaVersion:CURRENT_SCHEMA_VERSION,profile:{name:String(d.profile?.name||'')},entries:(d.entries||[]).map(normalizeEntry).sort((a,b)=>a.date.localeCompare(b.date)),trainings:(d.trainings||[]).map(normalizeTraining).sort((a,b)=>a.date.localeCompare(b.date)),events:(d.events||[]).map(x=>({...x,uuid:x.uuid||makeUuid()})),trainingTypes:(d.trainingTypes||[]).slice().sort((a,b)=>(Number(a.order)||999)-(Number(b.order)||999)).map((x,i)=>({...x,order:i+1})),dailySupplements:normalizeSupplementConfig(d.dailySupplements||[]),sportSupplements:normalizeSupplementConfig(d.sportSupplements||[]),medications:normalizeSupplementConfig(d.medications||[]),processingLog:Array.isArray(d.processingLog)?d.processingLog:[]}}
function validateData(obj){
 const warnings=[],errors=[],uuids=new Set(),dates=new Set();
 function validateTraining(training,label){
  const duration=nullableNumber(training.durationSeconds)??((nullableNumber(training.durationMinutes)??0)*60);
  const distance=nullableNumber(training.distanceKm);
  const pace=nullableNumber(training.paceSecondsPerKm)??paceToSeconds(training.avgPace);
  if(duration<0)errors.push(`${label}: duración negativa.`);
  if(duration>86400)warnings.push(`${label}: duración superior a 24 h.`);
  if(duration===0&&(distance>0||pace!==null))warnings.push(`${label}: hay distancia o ritmo y falta la duración.`);
  if(distance!==null&&distance<0)errors.push(`${label}: distancia negativa.`);
  const hr=nullableNumber(training.averageHeartRateBpm??training.avgHeartRate);
  if(hr!==null&&(hr<20||hr>250))warnings.push(`${label}: FC media fuera de rango razonable.`);
  const factor=nullableNumber(training.intensityFactor??training.ifValue);
  if(factor!==null&&(factor<0||factor>2))warnings.push(`${label}: IF fuera de rango razonable.`);
 }
 for(const [index,entry] of (obj.entries||[]).entries()){
  if(!/^\d{4}-\d{2}-\d{2}$/.test(entry.date||''))errors.push(`Registro ${index+1}: fecha no válida.`);
  if(!entry.uuid)errors.push(`${entry.date||index+1}: falta UUID.`);
  else if(uuids.has(entry.uuid))errors.push(`UUID duplicado: ${entry.uuid}`);
  uuids.add(entry.uuid);
  if(dates.has(entry.date))errors.push(`Fecha duplicada: ${entry.date}`);
  dates.add(entry.date);
  for(const [i,training] of (entry.trainings||[]).entries())validateTraining(training,`${entry.date}, entrenamiento ${i+1}`);
 }
 for(const training of obj.trainings||[]){
  if(!/^\d{4}-\d{2}-\d{2}$/.test(training.date||''))errors.push('Hay un entrenamiento independiente sin fecha válida.');
  if(!training.uuid||uuids.has(training.uuid))errors.push('Hay un entrenamiento independiente sin identificador único.');
  uuids.add(training.uuid);
  validateTraining(training,`${training.date}, entrenamiento`);
 }
 for(const episode of (obj.events||[]).filter(item=>item.kind==='episode')){
  if(!/^\d{4}-\d{2}-\d{2}$/.test(episode.date||''))errors.push('Hay un episodio sin fecha válida.');
  if(!episode.uuid||uuids.has(episode.uuid))errors.push('Hay un episodio sin identificador único.');
  uuids.add(episode.uuid);
 }
 return {errors,warnings};
}
function buildSummary(payload){
 const entries=[...(payload.entries||[])].sort((a,b)=>a.date.localeCompare(b.date));
 const trainings=[...entries.flatMap(entry=>entry.trainings||[]),...(payload.trainings||[])];
 const counts={};
 let totalKm=0,totalSeconds=0;
 for(const training of trainings){
  const kind=training.kind||training.typeId||'other';
  counts[kind]=(counts[kind]||0)+1;
  totalKm+=nullableNumber(training.distanceKm)||0;
  totalSeconds+=nullableNumber(training.durationSeconds)||0;
 }
 const missing=[];
 if(entries.length){
  const date=new Date(entries[0].date+'T12:00:00'),last=new Date(entries.at(-1).date+'T12:00:00');
  const dates=new Set(entries.map(entry=>entry.date));
  while(date<=last){
   const iso=localISO(date);
   if(!dates.has(iso))missing.push(iso);
   date.setDate(date.getDate()+1);
  }
 }
 return {
  totalEntries:entries.length,firstEntryDate:entries[0]?.date||null,lastEntryDate:entries.at(-1)?.date||null,
  missingDates:missing,totalTrainings:trainings.length,totalTrainingHours:Number((totalSeconds/3600).toFixed(2)),
  totalDistanceKm:Number(totalKm.toFixed(2)),trainingSessions:counts,
  totalEpisodes:(payload.events||[]).filter(item=>item.kind==='episode').length
 };
}
function canonicalize(v){if(Array.isArray(v))return v.map(canonicalize);if(v&&typeof v==='object'){const o={};for(const k of Object.keys(v).sort())o[k]=canonicalize(v[k]);return o}return v}
async function sha256(text){const bytes=new TextEncoder().encode(text),hash=await crypto.subtle.digest('SHA-256',bytes);return [...new Uint8Array(hash)].map(b=>b.toString(16).padStart(2,'0')).join('')}
$('quickForm').onsubmit=event=>{
 event.preventDefault();
 stopActiveDictation();
 const date=$('entryDate').value||localISO();
 const sleepMinutes=parseDuration(getVal('sleepDuration'));
 if(sleepMinutes===null)return alert('Duración de sueño no válida. Ejemplos: 45 = 00:45 y 730 = 07:30.');
 const hrvMin=nullableNumber(getVal('appleHrvMin')),hrvMax=nullableNumber(getVal('appleHrvMax'));
 if(hrvMin!==null&&hrvMax!==null&&hrvMin>hrvMax)return alert('La HRV mínima debe ser igual o inferior a la máxima.');
 let trainings;
 try{
  trainings=[...$('trainingList').querySelectorAll('.training-card')].map((card,index)=>collectTraining(card,trainingDrafts[index]));
 }catch(error){return alert(error.message)}
 const handsOn=$('handSymptoms').checked,stressOn=$('stressSymptoms').checked;
 const entry={id:`entry-${date}`,uuid:makeUuid(),date,updatedAt:new Date().toISOString(),revision:1,history:[],source:{...SOURCE},aiAnalysis:null,fatigue:getNum('fatigue'),legFatigue:$('legFatigue')?.checked??(editingDate?!!data.entries.find(x=>x.date===editingDate)?.legFatigue:false),handSwelling:handsOn?getNum('handSwelling'):0,handPain:handsOn?getNum('handPain'):0,abdominalInflammation:getNum('abdominalInflammation'),weightKg:nullableNumber(getVal('weightKg')),waistCm:nullableNumber(getVal('waistCm')),hipCm:nullableNumber(getVal('hipCm')),stress:stressOn?getNum('stress'):0,eyeTic:stressOn&&$('eyeTic').checked,peeling:handsOn?getNum('peeling'):0,calfTension:stressOn&&$('calfTension').checked,jawTension:stressOn&&$('jawTension').checked,handDetails:{right:{fingers:handsOn?[...document.querySelectorAll('[name=rightFinger]:checked')].map(x=>x.value):[],joint:handsOn?getVal('rightJoint'):'',mobilityLimited:handsOn&&$('rightMobilityLimited').checked},left:{fingers:handsOn?[...document.querySelectorAll('[name=leftFinger]:checked')].map(x=>x.value):[],joint:handsOn?getVal('leftJoint'):'',mobilityLimited:handsOn&&$('leftMobilityLimited').checked},notes:handsOn?getVal('handNotes').trim():'',photos:handsOn?clone(handPhotoData):[]},appleRestingHeartRate:getVal('appleRestingHeartRate'),appleHrvAverage:getVal('appleHrvAverage'),appleHrvMinMs:hrvMin,appleHrvMaxMs:hrvMax,wakeNotes:getVal('wakeNotes').trim(),paddedHands:handsOn&&$('paddedHands').checked,bowelFrequency:getVal('bowelFrequency'),bristolType:getVal('bristolType'),bowelUrgency:$('bowelUrgency').checked,bowelPain:$('bowelPain').checked,bowelBlood:$('bowelBlood').checked,bowelNotes:getVal('bowelNotes').trim(),dayContexts:[...document.querySelectorAll('[name=dayContext]:checked')].map(x=>x.value),customContext:document.querySelector('[name=dayContext][value=custom]')?.checked?getVal('customContext').trim():'',respiratorySymptoms:$('respiratorySymptoms').checked,nasalCongestion:getNum('nasalCongestion'),mucus:getNum('mucus'),...collectRespiratory(),sleepQuality:getNum('sleepQuality'),sleepDuration:minutesText(sleepMinutes||0),sleepMinutes:sleepMinutes||0,usualSchedule:$('usualSchedule').checked,sleepNotes:$('usualSchedule').checked?'':getVal('sleepNotes').trim(),usualFood:$('usualFood').checked,foodChanges:$('usualFood').checked?[]:[...document.querySelectorAll('[name=foodChange]:checked')].map(x=>x.value),foodNotes:$('usualFood').checked?'':getVal('foodNotes').trim(),trainings,dailySupplements:collectItems('dailySupplements'),sportSupplements:collectItems('sportSupplements'),medicationsTaken:collectItems('medications'),notes:getVal('notes').trim()};
 const entries=[...data.entries];
 const targetIndex=entries.findIndex(x=>x.date===date);
 const index=editingDate?entries.findIndex(x=>x.date===editingDate):targetIndex;
 const previous=entries[index];
 if(editingDate&&editingDate!==date){
  if(targetIndex>=0)return alert(`Ya hay un registro del ${fmtDate(date)}. Elige otra fecha para mover este registro.`);
  if(!confirm(`¿Mover el registro del ${fmtDate(editingDate)} al ${fmtDate(date)}?`))return;
 }else if(previous&&!confirm(`Ya existe un registro del ${fmtDate(date)}. ¿Quieres actualizarlo?`))return;
 if(previous){
  entry.uuid=previous.uuid||entry.uuid;
  entry.createdAt=previous.createdAt||previous.updatedAt;
  entry.revision=Number(previous.revision||1)+1;
  entry.source=previous.source||entry.source;
  entry.aiAnalysis=previous.aiAnalysis??null;
  entry.hrv4TrainingScore=previous.hrv4TrainingScore??null;
  entry.hrv4TrainingStatus=previous.hrv4TrainingStatus??null;
  if(!editingDate)entry.trainings=previous.trainings||[];
  entry.sportSupplements.push(...(previous.sportSupplements||[]).filter(item=>hiddenSportItems.has(item.id)));

  entry.history=[...(previous.history||[])];
  const changes=diffFields(previous,entry);
  if(Object.keys(changes).length)entry.history.push({origin:'user-edit',changedAt:entry.updatedAt,revision:entry.revision,changes});
  entry.history=entry.history.slice(-20);
  entries[index]=entry;
 }else{
  entry.createdAt=entry.updatedAt;
  entries.push(entry);
 }
 entries.sort((a,b)=>a.date.localeCompare(b.date));
 if(!saveData({...data,entries})){
  recordSaveFailed=true;
  return;
 }
 resetForm();
 showCalendarDate(date);
 alert(`Registro del ${fmtDate(date)} guardado correctamente.`);
};
function updateHome(){
 const today=data.entries.find(x=>x.date===localISO());
 const cards=document.querySelectorAll('.metric-card strong');
 cards[0].textContent=today?.handSwelling??0;
 cards[1].textContent=today?.fatigue??0;
 document.querySelector('.hero-card .pill').textContent=storageLoadFailed?'Historial no disponible':(today?'Registro completado':'Registro pendiente');
 $('homeRecord').textContent=today?'Ver registro de hoy':'Registrar ahora';
}
$('homeRecord').onclick=()=>{
 const today=localISO();
 if(data.entries.some(entry=>entry.date===today))showCalendarDate(today);
 else go('record');
};
let calendarDate=new Date();
let selectedCalendarDate=localISO();
function showCalendarDate(date){
 calendarDate=new Date(date+'T12:00:00');
 selectedCalendarDate=date;
 go('calendar');
}
function changeCalendarMonth(offset){
 calendarDate=new Date(calendarDate.getFullYear(),calendarDate.getMonth()+offset,1);
 selectedCalendarDate='';
 renderCalendar();
}
$('prevMonth').onclick=()=>changeCalendarMonth(-1);
$('nextMonth').onclick=()=>changeCalendarMonth(1);
function renderCalendar(){
 const year=calendarDate.getFullYear(),month=calendarDate.getMonth();
 const today=localISO();
 $('calendarTitle').textContent=new Intl.DateTimeFormat('es-ES',{month:'long',year:'numeric'}).format(calendarDate);
 const first=new Date(year,month,1),last=new Date(year,month+1,0);
 const cells=Array((first.getDay()+6)%7).fill('<div class="day empty"></div>');
 for(let day=1;day<=last.getDate();day++){
  const date=localISO(new Date(year,month,day));
  const entry=data.entries.find(x=>x.date===date);
  const hasActivity=data.trainings.some(item=>item.date===date)||data.events.some(item=>item.kind==='episode'&&item.date===date);
  let severity=0;
  if(entry){
   const max=Math.max(entry.handSwelling||0,entry.handPain||0,entry.fatigue||0,entry.legFatigue||0,(entry.abdominalInflammation||0)*2.5);
   severity=max>=7?3:max>=4?2:1;
  }
  cells.push(`<button class="day ${entry||hasActivity?'has-entry severity-'+(severity||1):''}${date===today?' today':''}${date===selectedCalendarDate?' selected':''}" data-date="${date}">${day}${entry||hasActivity?'<span class="day-dot"></span>':''}</button>`);
 }
 $('calendarGrid').innerHTML=cells.join('');
 document.querySelectorAll('.day[data-date]').forEach(button=>button.onclick=()=>{
  selectedCalendarDate=button.dataset.date;
  renderCalendar();
 });
 if(selectedCalendarDate)showDay(selectedCalendarDate);
 else $('dayDetail').innerHTML='';
}
function trainingSummary(training){
 const t=normalizeTraining(training);
 const metrics=[
  training.duration||minutesText(Math.round(t.durationSeconds/60)),
  t.distanceKm==null?'':`${t.distanceKm} km`,t.elevationGainM==null?'':`+${t.elevationGainM} m`,
  t.elevationLossM==null?'':`−${t.elevationLossM} m`,
  t.tss==null?'':`${t.tss} ${t.tssType||'TSS'}`,t.intensityFactor==null?'':`IF ${t.intensityFactor}`,
  t.temperature,t.averageHeartRateBpm==null?'':`FC ${t.averageHeartRateBpm} ppm`,
  t.poles==null?'':`Bastones: ${t.poles?'sí':'no'}`
 ].filter(Boolean);
 const rpe=[['global',t.rpeGlobal],['piernas',t.rpeLegs],['cardio',t.rpeCardio]]
  .filter(([,value])=>value!=null).map(([label,value])=>`${label} ${value}`);
 return `<div class="training-summary"><b>${esc(t.typeName||'Entrenamiento')}${t.competition?' · 🏁 Competición':''}${t.time?' · '+esc(t.time):''}</b>
 <span>${metrics.map(esc).join(' · ')}</span>${rpe.length?`<span>RPE ${rpe.join(' · ')}</span>`:''}
 ${t.notes?`<p>${esc(t.notes)}</p>`:''}</div>`;
}
function activityForDate(date){
 const trainings=data.trainings.filter(item=>item.date===date).sort((a,b)=>(a.time||'').localeCompare(b.time||''));
 const episodes=data.events.filter(item=>item.kind==='episode'&&item.date===date)
  .sort((a,b)=>(a.time||'').localeCompare(b.time||''));
 return [
  trainings.length?`<article class="card"><h3>Entrenamientos del día</h3>${trainings.map(training=>`
  <div class="activity-training">${trainingSummary(training)}
  <div class="button-row"><button class="secondary-button" data-edit-training="${esc(training.uuid)}">Editar</button>
  <button class="danger" data-delete-training="${esc(training.uuid)}">Eliminar</button></div></div>`).join('')}</article>`:'',
  episodes.length?`<h3>Episodios del día</h3>${episodes.map(episodeSummary).join('')}`:''
 ].join('');
}
function handleActivityAction(event){
 const button=event.target.closest('button');
 if(!button)return;
 const {editTraining,deleteTraining,editEpisode,deleteEpisode}=button.dataset;
 if(editTraining){
  const training=data.trainings.find(item=>item.uuid===editTraining);
  if(training){openTrainingForm(training);go('training')}
 }
 if(editEpisode){
  const episode=data.events.find(item=>item.uuid===editEpisode);
  if(episode)openEpisode(episode);
 }
 if(deleteTraining&&confirm('¿Eliminar este entrenamiento?')){
  const trainings=data.trainings.filter(item=>item.uuid!==deleteTraining);
  if(saveData({...data,trainings}))renderCalendar();
 }
 if(deleteEpisode&&confirm('¿Eliminar este episodio?')){
  const events=data.events.filter(item=>item.uuid!==deleteEpisode);
  if(saveData({...data,events})){
   if(editingEpisodeId===deleteEpisode)resetEpisodeForm();
   renderCalendar();
   renderEpisodeList();
  }
 }
}
$('dayDetail').addEventListener('click',handleActivityAction);
$('episodeList').addEventListener('click',handleActivityAction);
function recoverySummary(entry){
 const min=nullableNumber(entry.appleHrvMinMs),max=nullableNumber(entry.appleHrvMaxMs);
 const bits=[
  entry.appleRestingHeartRate?`FC en reposo ${entry.appleRestingHeartRate} ppm`:'',
  min!==null&&max!==null?`HRV ${min}–${max} ms`:'',
  min!==null&&max===null?`HRV mínima ${min} ms`:'',
  max!==null&&min===null?`HRV máxima ${max} ms`:'',
  entry.appleHrvAverage?`HRV media ${entry.appleHrvAverage} ms`:''
 ].filter(Boolean);
 const score=nullableNumber(entry.hrv4TrainingScore);
 if(score!==null)bits.push(`HRV4Training histórico ${score}${entry.hrv4TrainingStatus?` (${{normal:'normal',below:'por debajo',above:'por encima'}[entry.hrv4TrainingStatus]||entry.hrv4TrainingStatus})`:''}`);
 return bits.length?`<p><b>❤️ Recuperación:</b> ${bits.map(esc).join(' · ')}</p>`:'';
}
function respiratorySummary(entry){
 if(!entry.respiratorySymptoms&&!entry.respiratoryNotes&&!respiratoryFields.some(([id])=>entry[id]))return '';
 const symptoms=respiratoryFields.filter(([id])=>entry[id]).map(([,label])=>label);
 if(entry.nasalCongestion)symptoms.unshift(`Congestión ${entry.nasalCongestion}/5`);
 if(entry.mucus)symptoms.unshift(`Mucosidad nasal ${entry.mucus}/5`);
 if(entry.respiratoryIntensity!=null)symptoms.push(`Intensidad general ${entry.respiratoryIntensity}/5`);
 return `<p><b>🤧 Respiratorio:</b> ${symptoms.map(esc).join(' · ')}</p>${entry.respiratoryNotes?`<p>${esc(entry.respiratoryNotes)}</p>`:''}`;
}
function handSideSummary(label,h){if(!h)return '';const bits=[];if(h.fingers?.length)bits.push(h.fingers.join(', '));if(h.joint)bits.push(h.joint);if(h.mobilityLimited)bits.push('movilidad limitada');return bits.length?`<p><b>${label}:</b> ${esc(bits.join(' · '))}</p>`:''}
function showDay(date){const e=data.entries.find(x=>x.date===date),activity=activityForDate(date);if(!e){$('dayDetail').innerHTML=`<div class="day-detail-card"><strong>${fmtDate(date)}</strong><p class="muted">Sin registro diario.</p></div>${activity}`;return}const prev=previousISO(date),supp=[...(e.dailySupplements||[]),...(e.sportSupplements||[])],hd=e.handDetails||{},ctxMap={routine:'🏠 Rutina habitual',vacation:'🌴 Vacaciones',travel:'✈️ Viaje',hotel:'🏨 Hotel',competition:'🏃 Competición',work:'💼 Mucho trabajo',illness:'🤒 Enfermedad',family:'🎉 Evento familiar',custom:e.customContext||'Otro'},ctx=(e.dayContexts||[e.dayContext||'routine']).map(x=>ctxMap[x]||x).join(' · ');const bowel=e.bowelFrequency!==''||e.bristolType?`<p><b>🚽 Tránsito:</b> ${e.bowelFrequency!==''?`${esc(e.bowelFrequency)} deposiciones`:''}${e.bowelFrequency!==''&&e.bristolType?' · ':''}${e.bristolType?`Bristol ${esc(e.bristolType)}`:''}${e.bowelUrgency?' · urgencia':''}${e.bowelPain?' · dolor':''}${e.bowelBlood?' · sangre visible':''}</p>${e.bowelNotes?`<p>${esc(e.bowelNotes)}</p>`:''}`:'';$('dayDetail').innerHTML=`<div class="day-detail-card"><strong>Registro realizado para ${fmtDate(date)}</strong><p class="muted temporal-note">Este registro combina el cierre del ${fmtDate(prev)} con el sueño ${prev} → ${date} y tu estado al despertar del ${fmtDate(date)}.</p><div class="detail-section"><h4>🌙 Noche ${prev} → ${date}</h4><p><b>Sueño:</b> ${e.sleepQuality??0}/100 · ${esc(e.sleepDuration||minutesText(e.sleepMinutes||0))}${e.usualSchedule===false?' · horario no habitual':''}</p>${e.sleepNotes?`<p>${esc(e.sleepNotes)}</p>`:''}</div><div class="detail-section"><h4>🌅 Al despertar · ${date}</h4><p><b>Estado:</b> cansancio ${e.fatigue}/10${e.legFatigue?' · piernas cargadas (dato histórico)':''}</p><p><b>Manos:</b> inflamación ${e.handSwelling}/10 · dolor ${e.handPain}/10 · descamación ${e.peeling}/3</p><p><b>🫃 Inflamación abdominal:</b> ${e.abdominalInflammation??0}/4${e.weightKg!=null?` · <b>⚖️ Peso:</b> ${e.weightKg} kg`:''}${e.waistCm!=null?` · <b>Cintura:</b> ${e.waistCm} cm`:''}${e.hipCm!=null?` · <b>Cadera:</b> ${e.hipCm} cm`:''}</p>${handSideSummary('Derecha',hd.right)}${handSideSummary('Izquierda',hd.left)}${hd.notes?`<p>${esc(hd.notes)}</p>`:''}${(hd.photos||[]).map((x,i)=>`<img class="history-hand-photo" src="${x}" alt="Foto de manos ${i+1}">`).join('')}${e.paddedHands?'<p>Sensación de manos acolchadas</p>':''}${e.wakeNotes?`<p><b>Observaciones al despertar:</b> ${esc(e.wakeNotes)}</p>`:''}</div><div class="detail-section"><h4>📆 Día cerrado · ${prev}</h4><p><b>Contexto:</b> ${esc(ctx)}</p><p><b>Estrés:</b> ${e.stress||0}/10${e.jawTension?' · tensión mandibular':''}${e.calfTension?' · tensión gemelos':''}${e.eyeTic?' · tic ocular':''}</p>${recoverySummary(e)}${respiratorySummary(e)}${bowel}${(e.trainings||[]).map(trainingSummary).join('')}${supp.length?`<p><b>💊 Suplementos:</b> ${supp.map(s=>`${esc(s.name)} ${s.amount} ${esc(s.unit)}`).join(' · ')}</p>`:''}${(e.medicationsTaken||[]).length?`<p><b>💉 Medicación:</b> ${e.medicationsTaken.map(s=>`${esc(s.name)} ${s.amount} ${esc(s.unit)}`).join(' · ')}</p>`:''}${e.usualFood===false?`<p><b>🍽️ Alimentación:</b> ${esc((e.foodChanges||[e.foodChange].filter(Boolean)).join(' · '))}${e.foodNotes?` · ${esc(e.foodNotes)}`:''}</p>`:''}${e.notes?`<p><b>Observaciones:</b> ${esc(e.notes)}</p>`:''}</div></div><div class="button-row"><button class="secondary-button" onclick="editEntry('${date}')">Editar</button><button class="danger" onclick="deleteEntry('${date}')">Eliminar</button></div></div>${activity}`}
window.deleteEntry=date=>{
 if(!confirm('¿Eliminar este registro?'))return;
 const entries=data.entries.filter(entry=>entry.date!==date);
 if(saveData({...data,entries})){renderCalendar();updateHome()}
};
function restoreItemGroup(group,taken){document.querySelectorAll(`[data-group="${group}"][data-item-check]`).forEach(cb=>cb.checked=false);for(const x of taken||[]){const cb=document.querySelector(`[data-item-check="${x.id}"][data-group="${group}"]`),dose=document.querySelector(`[data-item-dose="${x.id}"][data-group="${group}"]`);if(cb)cb.checked=true;if(dose)dose.value=x.amount}}
window.editEntry=date=>{const e=data.entries.find(x=>x.date===date);if(!e)return;editingDate=date;go('record');$('entryDate').value=e.date;updateTemporalLabels();for(const id of ['fatigue','handSwelling','handPain','abdominalInflammation','stress','peeling']){$(id).value=e[id]||0;$(id).dispatchEvent(new Event('input'))}if($('legFatigue'))$('legFatigue').checked=!!e.legFatigue;$('paddedHands').checked=!!e.paddedHands;$('wakeNotes').value=e.wakeNotes||'';const handsOn=hasHandSymptoms(e);$('handSymptoms').checked=handsOn;toggleHandSymptoms(handsOn);const stressOn=Number(e.stress||0)>0||!!e.eyeTic||!!e.calfTension||!!e.jawTension;$('stressSymptoms').checked=stressOn;toggleStressDetail();$('eyeTic').checked=!!e.eyeTic;$('calfTension').checked=!!e.calfTension;$('jawTension').checked=!!e.jawTension;$('weightKg').value=e.weightKg??'';$('waistCm').value=e.waistCm??'';$('hipCm').value=e.hipCm??'';updateAnthropometryHints();$('sleepQuality').value=e.sleepQuality||0;$('sleepDuration').value=e.sleepDuration||minutesText(e.sleepMinutes||0);$('usualSchedule').checked=e.usualSchedule!==false;$('sleepNotes').value=e.sleepNotes||'';$('sleepException').classList.toggle('hidden',$('usualSchedule').checked);$('usualFood').checked=e.usualFood!==false;document.querySelectorAll('[name=foodChange]').forEach(x=>x.checked=(e.foodChanges||[e.foodChange].filter(Boolean)).includes(x.value));$('foodNotes').value=e.foodNotes||'';$('foodException').classList.toggle('hidden',$('usualFood').checked);const contexts=e.dayContexts||[e.dayContext||'routine'];document.querySelectorAll('[name=dayContext]').forEach(x=>x.checked=contexts.includes(x.value));$('customContext').value=e.customContext||'';$('customContextWrap').classList.toggle('hidden',!contexts.includes('custom'));restoreRespiratory(e);const hd=e.handDetails||{};for(const side of ['right','left']){const h=hd[side]||{};$(side+'Joint').value=h.joint||'';$(side+'MobilityLimited').checked=!!h.mobilityLimited;document.querySelectorAll(`[name=${side}Finger]`).forEach(x=>x.checked=(h.fingers||[]).includes(x.value))}$('handNotes').value=hd.notes||'';handPhotoData=clone(hd.photos||[]);renderHandPhoto();toggleHandDetail(!!((hd.right?.fingers||[]).length||(hd.left?.fingers||[]).length||hd.right?.joint||hd.left?.joint||hd.notes||(hd.photos||[]).length||e.handSwelling>=2||e.handPain>=2));$('appleRestingHeartRate').value=e.appleRestingHeartRate??'';$('appleHrvAverage').value=e.appleHrvAverage??'';$('appleHrvMin').value=e.appleHrvMinMs??'';$('appleHrvMax').value=e.appleHrvMaxMs??'';$('bowelFrequency').value=e.bowelFrequency??0;$('bristolType').value=e.bristolType??'';$('bowelUrgency').checked=!!e.bowelUrgency;$('bowelPain').checked=!!e.bowelPain;$('bowelBlood').checked=!!e.bowelBlood;$('bowelNotes').value=e.bowelNotes||'';toggleBowelDetail();updateCompactSummaries();$('notes').value=e.notes||'';trainingDrafts=clone(e.trainings||[]).map(makeTrainingDraft);renderTrainingList();renderRecordItems();restoreItemGroup('dailySupplements',e.dailySupplements||[]);restoreItemGroup('sportSupplements',e.sportSupplements||[]);restoreItemGroup('medications',e.medicationsTaken||[]);bindExpandableTextareas();bindRanges();bindScaleInfo()};
function renderStats(){const arr=[...data.entries].sort((a,b)=>a.date.localeCompare(b.date));const avg=k=>arr.length?(arr.reduce((s,e)=>s+Number(e[k]||0),0)/arr.length).toFixed(1):'—';const weights=arr.filter(e=>e.weightKg!=null&&Number.isFinite(Number(e.weightKg)));const lastWeight=weights.length?`${Number(weights.at(-1).weightKg).toFixed(1)} kg`:'—';const waists=arr.filter(e=>e.waistCm!=null&&Number.isFinite(Number(e.waistCm))),hips=arr.filter(e=>e.hipCm!=null&&Number.isFinite(Number(e.hipCm)));const lastWaist=waists.length?`${Number(waists.at(-1).waistCm).toFixed(1)} cm`:'—',lastHip=hips.length?`${Number(hips.at(-1).hipCm).toFixed(1)} cm`:'—';$('statsCards').innerHTML=[['Días registrados',arr.length],['Inflamación manos media',avg('handSwelling')],['Inflamación abdominal media',avg('abdominalInflammation')],['Último peso',lastWeight],['Última cintura',lastWaist],['Última cadera',lastHip],['Cansancio medio',avg('fatigue')],['Entrenamientos',data.trainings.length+arr.reduce((s,e)=>s+(e.trainings?.length||0),0)]].map(([l,v])=>`<article class="stat-card"><span>${l}</span><strong>${v}</strong></article>`).join('');drawChart(arr)}
function drawChart(arr){const c=$('statsChart'),ctx=c.getContext('2d'),dpr=devicePixelRatio||1,w=c.clientWidth||700,h=220;c.width=w*dpr;c.height=h*dpr;ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,w,h);ctx.strokeStyle='#dfe8e8';for(let i=0;i<=5;i++){const y=20+i*(h-40)/5;ctx.beginPath();ctx.moveTo(28,y);ctx.lineTo(w-8,y);ctx.stroke()}if(!arr.length){ctx.fillStyle='#74868b';ctx.fillText('Sin datos',w/2-20,h/2);return}for(const [k,col] of [['handSwelling','#0f766e'],['fatigue','#d99a24']]){ctx.strokeStyle=col;ctx.lineWidth=3;ctx.beginPath();arr.forEach((e,i)=>{const x=30+i*(w-44)/Math.max(1,arr.length-1),y=h-20-(Number(e[k]||0)/10)*(h-40);i?ctx.lineTo(x,y):ctx.moveTo(x,y)});ctx.stroke()}}
const configMeta={dailySupplements:{title:'Suplemento diario'},sportSupplements:{title:'Suplemento deportivo'},medications:{title:'Medicación'},trainingTypes:{title:'Tipo de entrenamiento'}};
function renderSettings(){for(const key of ['dailySupplements','sportSupplements','medications','trainingTypes']){const list=$(key+'List'),arr=data[key]||[];list.innerHTML=arr.filter(item=>key!=='sportSupplements'||!hiddenSportItems.has(item.id)).sort((a,b)=>(a.order||0)-(b.order||0)).map(x=>`<div class="config-item"><span class="config-grip">⋮⋮</span><div class="config-main"><strong>${esc(x.name)}</strong><small>${key==='trainingTypes'?esc(x.kind||'otro'):`${x.dose??0} ${esc(x.unit||'')} ${x.defaultTaken?'· marcado por defecto':''} ${x.composition?`· ${esc(x.composition)}`:''}`}</small></div><button class="config-toggle ${x.enabled!==false?'on':''}" data-toggle="${key}" data-id="${x.id}"></button><button class="icon-mini" data-edit="${key}" data-id="${x.id}">✎</button><button class="icon-mini danger-text" data-del="${key}" data-id="${x.id}">×</button></div>`).join('')||'<div class="empty-config">Sin elementos.</div>'}bindConfigButtons()}
function bindConfigButtons(){
 document.querySelectorAll('[data-toggle]').forEach(button=>button.onclick=()=>{
  const {toggle:key,id}=button.dataset;
  const items=data[key].map(item=>item.id===id?{...item,enabled:!item.enabled}:item);
  if(saveData({...data,[key]:items}))renderSettings();
 });
 document.querySelectorAll('[data-edit]').forEach(button=>button.onclick=()=>openConfigModal(button.dataset.edit,button.dataset.id));
 document.querySelectorAll('[data-del]').forEach(button=>button.onclick=()=>{
  if(!confirm('¿Eliminar este elemento?'))return;
  const {del:key,id}=button.dataset;
  const items=data[key].filter(item=>item.id!==id);
  if(saveData({...data,[key]:items}))renderSettings();
 });
}
document.querySelectorAll('[data-add]').forEach(b=>b.onclick=()=>openConfigModal(b.dataset.add));let modalState=null;
function openConfigModal(key,id=''){const item=id?data[key].find(x=>x.id===id):null;modalState={key,id};$('modalTitle').textContent=(item?'Editar ':'Añadir ')+(configMeta[key]?.title||'elemento');const isTrain=key==='trainingTypes';$('modalBody').innerHTML=`<label>Nombre<input id="cfgName" value="${esc(item?.name||'')}"></label>${isTrain?`<label>Tipo de formulario<select id="cfgKind"><option value="run">Carrera</option><option value="bike">Bici</option><option value="strength">Fuerza</option><option value="functional">Fuerza funcional / gomas</option><option value="mobility">Movilidad</option><option value="trekking">Trekking</option><option value="other">Otros</option></select></label>`:`<div class="grid two"><label>Dosis habitual<input id="cfgDose" type="number" step="0.1" value="${item?.dose??0}"></label><label>Unidad<input id="cfgUnit" value="${esc(item?.unit||'')}"></label></div><label class="tick-card"><input id="cfgDefault" type="checkbox" ${item?.defaultTaken?'checked':''}><span>Marcado por defecto en Registro</span></label><label>Composición / detalle<textarea id="cfgComposition" rows="3">${esc(item?.composition||'')}</textarea></label>`}`;$('modalBackdrop').classList.add('open');if(isTrain&&item)$('cfgKind').value=item.kind||'other'}
$('modalCancel').onclick=()=>$('modalBackdrop').classList.remove('open');
$('modalSave').onclick=()=>{
 const {key,id}=modalState;
 const name=$('cfgName').value.trim();
 if(!name)return alert('Escribe un nombre.');
 const items=[...data[key]];
 const index=items.findIndex(x=>x.id===id);
 const item=index>=0?{...items[index]}:{id:`${key}-${Date.now()}`,enabled:true,order:items.length+1};
 item.name=name;
 if(key==='trainingTypes')item.kind=$('cfgKind').value;
 else{
  item.productVersionId=stableProductVersionId(item);
  item.dose=Number($('cfgDose').value||0);
  item.unit=$('cfgUnit').value.trim();
  item.composition=$('cfgComposition').value.trim();
  item.defaultTaken=$('cfgDefault').checked;
 }
 if(index>=0)items[index]=item;
 else items.push(item);
 if(!saveData({...data,[key]:items}))return;
 $('modalBackdrop').classList.remove('open');
 renderSettings();
};
async function buildJsonExport({includePhotos=true,exportType='full'}={}){
 const payload=normalizedPayload(data);
 if(!includePhotos)for(const entry of payload.entries)entry.handDetails.photos=[];
 const report=validateData(payload);if(report.errors.length)throw new Error('No se puede exportar hasta corregir:\n'+report.errors.join('\n'));
 const canonical=JSON.stringify(canonicalize(payload));
 return {exportFormat:EXPORT_FORMAT,exportFormatVersion:EXPORT_FORMAT_VERSION,appVersion:APP_VERSION,schemaVersion:CURRENT_SCHEMA_VERSION,exportedAt:new Date().toISOString(),exportType,photosIncluded:includePhotos,exportSource:{...SOURCE},summary:buildSummary(payload),integrity:{algorithm:'SHA-256',scope:'data',checksum:await sha256(canonical)},data:payload};
}
$('exportAll').onclick=async()=>{try{download(JSON.stringify(await buildJsonExport({includePhotos:true,exportType:'full'}),null,2),`healthlab_backup_${localISO()}.json`,'application/json')}catch(err){alert(err.message)}};
$('exportAnalysis').onclick=async()=>{try{download(JSON.stringify(await buildJsonExport({includePhotos:false,exportType:'analysis'}),null,2),`healthlab_analysis_${localISO()}.json`,'application/json')}catch(err){alert(err.message)}};
$('exportCsv').onclick=()=>{
 const payload=normalizedPayload(data);
 const entryFields=[
  'sleepQuality','sleepDurationMinutes','fatigue','legFatigue','handSwelling','handPain','paddedHands','peeling',
  'wakeNotes','abdominalInflammation','weightKg','waistCm','hipCm','stress','eyeTic','calfTension','jawTension',
  'trainings','dailySupplements','sportSupplements','medicationsTaken','dayContexts','customContext','handDetails',
  'appleRestingHeartRateBpm','appleHrvAverageMs','appleHrvMinMs','appleHrvMaxMs','hrv4TrainingScore','hrv4TrainingStatus',
  'bowelFrequency','bristolType','bowelUrgency','bowelPain','bowelBlood','bowelNotes','respiratorySymptoms',
  'nasalCongestion','mucus','respiratoryIntensity',...respiratoryFields.map(([id])=>id),'respiratoryNotes','foodChanges','notes'
 ];
 const rows=[['date','recordType','time',...entryFields,'activity']];
 for(const entry of payload.entries)rows.push([entry.date,'daily','',...entryFields.map(field=>entry[field]),null]);
 for(const training of payload.trainings)rows.push([training.date,'training',training.time,...entryFields.map(()=>null),training]);
 for(const episode of payload.events.filter(item=>item.kind==='episode'))rows.push([episode.date,'episode',episode.time,...entryFields.map(()=>null),episode]);
 const csv=rows.map(row=>row.map(value=>{
  const text=value&&typeof value==='object'?JSON.stringify(value):String(value??'');
  return '"'+text.replaceAll('"','""')+'"';
 }).join(',')).join('\n');
 download(csv,`healthlab_${localISO()}.csv`,'text/csv;charset=utf-8');
};
function download(content,name,type){const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([content],{type}));a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),500)}
$('importAll').onchange=async e=>{try{const obj=JSON.parse(await e.target.files[0].text());const payload=obj?.data&&Array.isArray(obj.data.entries)?obj.data:obj;if(!payload||!Array.isArray(payload.entries))throw new Error('No contiene entries.');if(obj.integrity?.checksum&&crypto.subtle){const actual=await sha256(JSON.stringify(canonicalize(payload)));if(actual!==obj.integrity.checksum&&!confirm('El checksum no coincide. El archivo pudo modificarse o corromperse. ¿Continuar de todos modos?'))return}const migrated=migrate(payload),report=validateData(migrated);if(report.errors.length)throw new Error(report.errors.join('\n'));const warningText=report.warnings.length?'\n\nAdvertencias:\n'+report.warnings.slice(0,10).join('\n'):'';if(confirm(`Se importarán ${migrated.entries.length} registros y se migrarán al esquema ${CURRENT_SCHEMA_VERSION}.${warningText}\n\nEsto sustituirá todos los datos actuales. ¿Continuar?`)&&saveData(migrated,{replaceUnreadable:true})){alert('Datos importados y validados.');renderSettings();updateHome()}}catch(err){alert('Archivo JSON no válido: '+(err?.message||'error desconocido'))}finally{e.target.value=''}};
$('resetDemo').onclick=()=>{if(confirm('¿Restablecer toda la aplicación?')&&saveData(clone(defaults),{replaceUnreadable:true}))location.reload()};

$('handSwelling').addEventListener('input',()=>toggleHandDetail());$('handPain').addEventListener('input',()=>toggleHandDetail());$('toggleHandDetail').onclick=()=>toggleHandDetail($('handDetail').classList.contains('hidden'));$('handSymptoms').onchange=()=>{toggleHandSymptoms($('handSymptoms').checked);updateCompactSummaries()};$('stressSymptoms').onchange=toggleStressDetail;$('respiratorySymptoms').onchange=()=>{$('respiratoryDetail').classList.toggle('hidden',!$('respiratorySymptoms').checked);updateCompactSummaries()};$('bowelFrequency').onchange=toggleBowelDetail;$('usualFood').onchange=()=>{$('foodException').classList.toggle('hidden',$('usualFood').checked);updateCompactSummaries()};document.querySelectorAll('[name=dayContext]').forEach(x=>x.onchange=()=>{if(x.value==='routine'&&x.checked)document.querySelectorAll('[name=dayContext]').forEach(y=>{if(y!==x)y.checked=false});else if(x.checked){const r=document.querySelector('[name=dayContext][value=routine]');if(r)r.checked=false}const custom=document.querySelector('[name=dayContext][value=custom]')?.checked;$('customContextWrap').classList.toggle('hidden',!custom);updateCompactSummaries()});$('entryDate').onchange=()=>{updateTemporalLabels();updateAnthropometryHints()};$('handCamera').onchange=async e=>{await addHandPhotos(e.target.files||[]);e.target.value=''};$('handGallery').onchange=async e=>{await addHandPhotos(e.target.files||[]);e.target.value=''};bindVoiceButtons();bindExpandableTextareas();
if('serviceWorker' in navigator)navigator.serviceWorker.register(`sw.js?v=${APP_VERSION}`);
renderRespiratoryFields();
resetForm();
renderSettings();
bindSmartNumericTimeFields();
updateHome();
