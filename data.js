const STORAGE_KEY = 'cloud-director-cockpit-v2';
const TABLES = ['opportunities','projects'];
const FIELDS = {
  opportunities: ['id','name','clientAlias','kind','stage','amount','deadline','decisionDate','notes'],
  projects: ['id','name','clientAlias','status','progress','startDate','targetDate','notes','sourceOpportunityId']
};
const COLUMN_MAP = { clientAlias:'client_alias', decisionDate:'decision_date', startDate:'start_date', targetDate:'target_date', sourceOpportunityId:'source_opportunity_id' };
const col = field => COLUMN_MAP[field] || field;
export const STAGES = ['Detectada','En estudio','Preparando oferta','Oferta presentada','Negociación','Ganada','Perdida'];
export const KINDS = ['RFP','Pliego','Oportunidad','Otro'];
export const PROJECT_STATUSES = ['En curso','En pausa','Finalizado'];
const uuid = () => globalThis.crypto?.randomUUID?.() || 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {const r=Math.floor(Math.random()*16);return (c==='x'?r:(r&3|8)).toString(16);});
export function today(offset = 0) {
  const date = new Date(); date.setHours(12,0,0,0); date.setDate(date.getDate()+offset);
  return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
}
export function seedData() {
  // EJEMPLOS INVENTADOS. Ninguna cuenta ni proyecto corresponde a información real.
  return {
    opportunities: [
      {id:uuid(),name:'Migración Aurora',clientAlias:'Cliente Alfa',kind:'RFP',stage:'Oferta presentada',amount:220000,deadline:today(5),decisionDate:today(26),notes:'Pendiente de evaluación técnica.'},
      {id:uuid(),name:'Plataforma de datos Polaris',clientAlias:'Cliente Beta',kind:'Pliego',stage:'Preparando oferta',amount:145000,deadline:today(13),decisionDate:today(38),notes:''},
      {id:uuid(),name:'Evolución Cloud Norte',clientAlias:'Cliente Gamma',kind:'Oportunidad',stage:'En estudio',amount:78000,deadline:today(18),decisionDate:today(46),notes:'Validar alcance.'},
      {id:uuid(),name:'Automatización Delta',clientAlias:'Cliente Delta',kind:'RFP',stage:'Ganada',amount:96000,deadline:today(-24),decisionDate:today(-3),notes:'Adjudicada. Pendiente de arranque.'},
      {id:uuid(),name:'Renovación Horizonte',clientAlias:'Cliente Épsilon',kind:'Pliego',stage:'Perdida',amount:118000,deadline:today(-32),decisionDate:today(-12),notes:'Resultado cerrado.'},
      {id:uuid(),name:'Infraestructura Boreal',clientAlias:'Cliente Zeta',kind:'RFP',stage:'Detectada',amount:340000,deadline:today(27),decisionDate:today(65),notes:''}
    ],
    projects: [
      {id:uuid(),name:'Proyecto Atlas',clientAlias:'Cliente Uno',status:'En curso',progress:72,startDate:today(-67),targetDate:today(32),notes:'Modernización Cloud',sourceOpportunityId:null},
      {id:uuid(),name:'Proyecto Mercurio',clientAlias:'Cliente Dos',status:'En curso',progress:38,startDate:today(-21),targetDate:today(63),notes:'Automatización de infraestructura',sourceOpportunityId:null},
      {id:uuid(),name:'Proyecto Cobalto',clientAlias:'Cliente Tres',status:'En pausa',progress:55,startDate:today(-48),targetDate:today(28),notes:'Pendiente de ventana de cambio',sourceOpportunityId:null}
    ]
  };
}
function clone(data){return JSON.parse(JSON.stringify(data));}
function cleanRow(table,row) {
  if (!row || typeof row !== 'object' || Array.isArray(row)) throw Error('Registro JSON no válido.');
  const clean = Object.fromEntries(FIELDS[table].filter(key => Object.hasOwn(row,key)).map(key => [key,row[key]]));
  if (typeof clean.id !== 'string' || typeof clean.name !== 'string' || !clean.name.trim() || clean.name.length > 160) throw Error(`Registro incompleto en ${table}.`);
  if (typeof clean.clientAlias !== 'string' || clean.clientAlias.length > 160) throw Error('Cliente no válido.');
  if (table === 'opportunities') {
    if (!STAGES.includes(clean.stage) || !KINDS.includes(clean.kind) || !Number.isFinite(clean.amount) || clean.amount < 0 || clean.amount > 1e12) throw Error('Oportunidad no válida.');
  } else if (!PROJECT_STATUSES.includes(clean.status) || !Number.isInteger(clean.progress) || clean.progress < 0 || clean.progress > 100) throw Error('Proyecto no válido.');
  for (const key of ['deadline','decisionDate','startDate','targetDate']) if (clean[key] && (typeof clean[key] !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(clean[key]))) throw Error('Fecha no válida.');
  if (typeof clean.notes !== 'string' && clean.notes != null) throw Error('Notas no válidas.');
  if (clean.notes?.length > 2500) throw Error('Notas demasiado largas.');
  if (table === 'projects' && clean.sourceOpportunityId != null && typeof clean.sourceOpportunityId !== 'string') throw Error('Referencia no válida.');
  return clean;
}
export function validateData(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw Error('El archivo debe contener un objeto JSON.');
  const data = {};
  for (const table of TABLES) {
    if (!Array.isArray(input[table]) || input[table].length > 2000) throw Error(`Falta la lista ${table} o es demasiado grande.`);
    data[table] = input[table].map(row => cleanRow(table,row));
    if (new Set(data[table].map(row => row.id)).size !== data[table].length) throw Error(`IDs duplicados en ${table}.`);
  }
  return data;
}
export class CockpitStore {
  mode = 'demo'; data = null; client = null; session = null; onAuthChange = null;
  async init() {
    const config = globalThis.COCKPIT_CONFIG || {};
    if (config.supabaseUrl && config.supabasePublishableKey) {
      this.mode='supabase';
      await new Promise((resolve,reject) => {
        if(globalThis.supabase?.createClient) return resolve();
        const script=document.createElement('script');script.src='https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2';script.onload=resolve;script.onerror=()=>reject(Error('No se puede cargar Supabase JS. Comprueba la conexión.'));document.head.appendChild(script);
      });
      this.client=globalThis.supabase.createClient(config.supabaseUrl,config.supabasePublishableKey);
      const {data,error}=await this.client.auth.getSession(); if(error) throw error;
      this.session=data.session;
      this.client.auth.onAuthStateChange((event,session) => {
        const previous = this.session?.user?.id; this.session=session;
        if(previous !== session?.user?.id) queueMicrotask(()=>this.onAuthChange?.());
      });
      if(this.session) await this.load();
    } else {
      try {const raw=localStorage.getItem(STORAGE_KEY);this.data=raw?validateData(JSON.parse(raw)):seedData();if(!raw)this.persist();}
      catch(error){console.warn('Se reinicia la demo por datos inválidos:',error);this.data=seedData();this.persist();}
    }
    return this;
  }
  persist(){localStorage.setItem(STORAGE_KEY,JSON.stringify(this.data));}
  async load() {
    if(this.mode==='demo') return this.data;
    if(!this.session){this.data=null;return null;}
    const responses=await Promise.all(TABLES.map(table=>this.client.from(table).select('*').order('created_at',{ascending:false})));
    for(const response of responses) if(response.error) throw response.error;
    this.data=Object.fromEntries(TABLES.map((table,i)=>[table,responses[i].data.map(row=>{
      const record={};for(const field of FIELDS[table]) record[field]=row[col(field)]??(field==='sourceOpportunityId'?null:'');
      return cleanRow(table,record);
    })]));
    return this.data;
  }
  async login(email,password) {
    if(this.mode!=='supabase') throw Error('Modo demostración.');
    const {data,error}=await this.client.auth.signInWithPassword({email,password});
    if(error) throw error;
    if(!data.session) throw Error('No se ha podido iniciar sesión.');
    this.session=data.session;
    await this.load();
  }
  async logout(){if(this.client){const {error}=await this.client.auth.signOut();if(error)throw error;this.session=null;this.data=null;}}
  async save(table,record) {
    if(!TABLES.includes(table)) throw Error('Tabla no válida.');
    const row=cleanRow(table,{...record,id:record.id||uuid()});
    if(table==='projects' && row.sourceOpportunityId && this.data.projects.some(p=>p.sourceOpportunityId===row.sourceOpportunityId && p.id!==row.id)) throw Error('Ya existe un proyecto creado desde esta oportunidad.');
    if(this.mode==='supabase') {
      if(!this.session) throw Error('Inicia sesión para guardar.');
      const payload=Object.fromEntries(Object.entries(row).map(([key,value])=>[col(key),value === '' && ['deadline','decisionDate','startDate','targetDate','sourceOpportunityId'].includes(key) ? null:value]));
      payload.owner_id=this.session.user.id;
      const {error}=await this.client.from(table).upsert(payload,{onConflict:'id'});if(error) throw error;
      await this.load();
    } else {
      const next=clone(this.data);
      const index=next[table].findIndex(item=>item.id===row.id);
      if(index<0)next[table].unshift(row);else next[table][index]=row;
      localStorage.setItem(STORAGE_KEY,JSON.stringify(next));this.data=next;
    }
    return row;
  }
  async remove(table,id) {
    if(!TABLES.includes(table)) throw Error('Tabla no válida.');
    if(this.mode==='supabase') {
      const {error}=await this.client.from(table).delete().eq('id',id);if(error) throw error;
      await this.load();
    }else{
      const next=clone(this.data);next[table]=next[table].filter(x=>x.id!==id);
      localStorage.setItem(STORAGE_KEY,JSON.stringify(next));this.data=next;
    }
  }
  export(){return JSON.stringify({version:2,exportedAt:new Date().toISOString(),...this.data},null,2);}
  import(json){if(this.mode!=='demo')throw Error('La importación solo está disponible en demostración.');const data=validateData(json);localStorage.setItem(STORAGE_KEY,JSON.stringify(data));this.data=data;}
  reset(){if(this.mode!=='demo')throw Error('Solo disponible en demostración.');const data=seedData();localStorage.setItem(STORAGE_KEY,JSON.stringify(data));this.data=data;}
}
