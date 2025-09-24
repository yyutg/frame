const STORAGE_KEY = 'defects_demo_v1';
const state = loadState();

if(!state._initialized){
  state.users = [
    {id:uid(),name:'Иван Менеджер',email:'manager@demo',role:'manager',passwordHash:'$demo'},
    {id:uid(),name:'Андрей Инженер',email:'eng@demo',role:'engineer',passwordHash:'$demo'},
    {id:uid(),name:'Пётр Наблюдатель',email:'obs@demo',role:'observer',passwordHash:'$demo'}
  ];
  state.projects = [{id:uid(),name:'Стройплощадка А',stages:['Фундамент','Коробка','Отделка'],created:Date.now()}];
  state.defects = [];
  state._initialized = true;
  saveState();
}

let session = {userId:null};

function uid(){return 'id_'+Math.random().toString(36).slice(2,10)}
function nowDate(ts){const d = ts?new Date(ts):new Date(); return d.toLocaleString('ru-RU')}
function saveState(){localStorage.setItem(STORAGE_KEY, JSON.stringify(state))}
function loadState(){return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}')}
function toast(msg,delay=2500){const t=document.getElementById('toast');t.innerText=msg;t.style.display='block';setTimeout(()=>t.style.display='none',delay)}

document.getElementById('btn-login').addEventListener('click',()=>openAuth())
document.getElementById('auth-cancel').addEventListener('click',()=>closeAuth())

const views = ['dashboard','projects','defects','reports']
views.forEach(v=>document.getElementById('nav-'+v).addEventListener('click',()=>showView(v)))

function showView(v){
  views.forEach(x=>document.getElementById('nav-'+x).classList.toggle('active', x===v));
  document.getElementById('view-dashboard').style.display = (v==='dashboard')? 'grid':'none';
  document.getElementById('view-projects').style.display = (v==='projects')? 'block':'none';
  document.getElementById('view-defects').style.display = (v==='defects')? 'grid':'none';
  document.getElementById('view-reports').style.display = (v==='reports')? 'block':'none';
  if(v==='dashboard') renderDashboard();
  if(v==='projects') renderProjects();
  if(v==='defects') renderDefects();
  if(v==='reports') renderReports();
}

function openAuth(){document.getElementById('modal-auth').style.display='flex'}
function closeAuth(){document.getElementById('modal-auth').style.display='none'}

document.getElementById('form-auth').addEventListener('submit',function(e){e.preventDefault();
  const name=document.getElementById('auth-name').value.trim();
  const email=document.getElementById('auth-email').value.trim();
  const pass=document.getElementById('auth-pass').value;
  const role=document.getElementById('auth-role').value;
  if(!email||!pass){toast('Введите email и пароль');return}
  const user = state.users.find(u=>u.email===email);
  if(user){
    session.userId = user.id;
    toast('Вход выполнен как '+user.name);
    closeAuth();renderUserArea();
  } else {
    const u={id:uid(),name:name||email.split('@')[0],email,role,passwordHash:'$demo'};
    state.users.push(u); saveState(); session.userId=u.id; toast('Пользователь зарегистрирован'); closeAuth(); renderUserArea();
  }
})

function renderUserArea(){
  const u = state.users.find(x=>x.id===session.userId);
  if(u){
    document.getElementById('user-role').innerText = u.name + ' ('+u.role+')';
    document.getElementById('btn-login').innerText='Выйти';
    document.getElementById('btn-login').onclick = ()=>{session.userId=null; renderUserArea(); toast('Вы вышли'); renderDefects();}
  } else {
    document.getElementById('user-role').innerText = 'Гость';
    document.getElementById('btn-login').innerText='Войти';
    document.getElementById('btn-login').onclick = ()=>openAuth();
  }
}

renderUserArea(); showView('dashboard');

document.getElementById('btn-new-project').addEventListener('click',()=>{
  const name = prompt('Название объекта'); if(!name) return; const p={id:uid(),name,stages:[],created:Date.now()}; state.projects.push(p); saveState(); renderProjects(); toast('Объект создан');
})
function renderProjects(){const tbody=document.querySelector('#tbl-projects tbody');tbody.innerHTML='';
  (state.projects||[]).forEach(p=>{
    const tr=document.createElement('tr');
    tr.innerHTML=`<td>${escapeHtml(p.name)}</td><td>${(p.stages||[]).join(', ')}</td><td>${nowDate(p.created)}</td><td><button data-id="${p.id}" class="btn small">Открыть</button></td>`;
    tbody.appendChild(tr);
    tr.querySelector('button').addEventListener('click',()=>{alert('Детали объекта:\n'+JSON.stringify(p,null,2))});
  })
}

document.getElementById('form-defect').addEventListener('submit',async function(e){e.preventDefault();
  const id = document.getElementById('defect-id').value;
  const title = document.getElementById('d-title').value.trim();
  const desc = document.getElementById('d-desc').value.trim();
  const priority = document.getElementById('d-priority').value;
  const assignee = document.getElementById('d-assignee').value.trim();
  const due = document.getElementById('d-due').value ? new Date(document.getElementById('d-due').value).getTime() : null;
  const files = document.getElementById('d-attach').files;
  const attachments = [];
  for(const f of files){attachments.push(await fileToDataURL(f));}

  if(!title){toast('Укажите заголовок');return}

  if(id){
    const d = state.defects.find(x=>x.id===id);
    d.title=title; d.description=desc; d.priority=priority; d.assignee=assignee; d.due=due; if(attachments.length) d.attachments = d.attachments.concat(attachments);
    d.history.push({at:Date.now(),by:getCurrentUserName(),msg:'Обновлён'});
    toast('Дефект обновлён');
  } else {
    const d={id:uid(),title,description:desc,priority,assignee,status:'Новая',created:Date.now(),due,attachments,history:[{at:Date.now(),by:getCurrentUserName(),msg:'Создан'}]};
    state.defects.push(d); toast('Дефект создан');
  }
  saveState(); renderDefects(); document.getElementById('form-defect').reset(); document.getElementById('defect-id').value='';
})

document.getElementById('btn-reset-defect').addEventListener('click',()=>{document.getElementById('form-defect').reset(); document.getElementById('defect-id').value='';})

function renderDefects(){
  const tbody=document.querySelector('#tbl-defects tbody'); tbody.innerHTML='';
  const q = document.getElementById('global-search').value.trim().toLowerCase();
  const statusFilter = document.getElementById('filter-status').value;
  const prFilter = document.getElementById('filter-priority').value;
  const list = (state.defects||[]).filter(d=>{
    if(statusFilter!=='all' && statusFilter!==d.status) return false;
    if(prFilter!=='all' && prFilter!==d.priority) return false;
    if(!q) return true;
    return (d.title+d.description+d.assignee).toLowerCase().includes(q);
  }).sort((a,b)=>b.created-a.created);

  list.forEach(d=>{
    const tr=document.createElement('tr');
    const overdue = d.due && d.due < Date.now() && d.status!=='Закрыта' && d.status!=='Отменена';
    tr.innerHTML = `<td>${escapeHtml(d.title)}<div class="meta">${escapeHtml(d.description || '')}</div></td>
      <td><span class="pill ${d.priority==='Высокий'? 'priority-high' : d.priority==='Средний' ? 'priority-med' : 'priority-low'}">${d.priority}</span></td>
      <td>${escapeHtml(d.assignee || '—')}</td>
      <td>${d.due? new Date(d.due).toLocaleDateString('ru-RU') : '—'} ${overdue?'<div class="meta" style="color:'+ 'var(--danger)' +'">(просрочено)</div>':''}</td>
      <td>${escapeHtml(d.status)}</td>
      <td><button data-id="${d.id}" class="btn small">Открыть</button></td>`;
    tbody.appendChild(tr);
    tr.querySelector('button').addEventListener('click',()=>openDetail(d.id));
  })

  document.getElementById('stat-total').innerText = (state.defects||[]).length;
  document.getElementById('stat-inprogress').innerText = (state.defects||[]).filter(x=>x.status==='В работе').length;
  document.getElementById('stat-overdue').innerText = (state.defects||[]).filter(x=>x.due && x.due < Date.now() && x.status!=='Закрыта' && x.status!=='Отменена').length;

  renderChartsQuick();
}

function openDetail(id){
  const d = state.defects.find(x=>x.id===id); if(!d) return;
  document.getElementById('defect-id').value=d.id; document.getElementById('d-title').value=d.title; document.getElementById('d-desc').value=d.description||''; document.getElementById('d-priority').value=d.priority; document.getElementById('d-assignee').value=d.assignee||''; document.getElementById('d-due').value=d.due? new Date(d.due).toISOString().slice(0,10):'';
  const hist = document.getElementById('detail-history'); hist.innerHTML=''; d.history.slice().reverse().forEach(h=>{const el=document.createElement('div');el.innerHTML=`<div class="meta">${nowDate(h.at)} — <b>${escapeHtml(h.by||'система')}</b></div><div>${escapeHtml(h.msg)}</div><hr/>`; hist.appendChild(el)})
  const canAssign = can('manager');
  const canEdit = can('manager') || can('engineer');
  const histControls = document.createElement('div'); histControls.style.marginTop='8px';
  if(canEdit){
    ['Новая','В работе','На проверке','Закрыта','Отменена'].forEach(s=>{
      const b=document.createElement('button'); b.className='small btn ghost'; b.innerText=s; b.addEventListener('click',()=>{d.status=s; d.history.push({at:Date.now(),by:getCurrentUserName(),msg:'Статус → '+s}); saveState(); renderDefects(); openDetail(id); toast('Статус изменён: '+s)}); histControls.appendChild(b)
    })
  }
  if(canAssign){
    const assignButton = document.createElement('button'); assignButton.className='small btn'; assignButton.innerText='Назначить исполнителя'; assignButton.addEventListener('click',()=>{const name=prompt('Имя исполнителя'); if(name){d.assignee=name; d.history.push({at:Date.now(),by:getCurrentUserName(),msg:'Назначен исполнитель: '+name}); saveState(); renderDefects(); openDetail(id);}}); histControls.appendChild(assignButton)
  }
  hist.appendChild(histControls);
}

document.getElementById('btn-add-comment').addEventListener('click',()=>{
  const id = document.getElementById('defect-id').value; if(!id){toast('Выберите дефект в списке');return}
  const txt = document.getElementById('comment-text').value.trim(); if(!txt){toast('Введите текст');return}
  const d = state.defects.find(x=>x.id===id); d.history.push({at:Date.now(),by:getCurrentUserName(),msg:txt}); saveState(); document.getElementById('comment-text').value=''; openDetail(id);
})

document.getElementById('quick-new').addEventListener('click',()=>{showView('defects'); document.getElementById('d-title').focus()})
document.getElementById('quick-export').addEventListener('click',()=>exportCSV())
document.getElementById('quick-backup').addEventListener('click',()=>{
  const blob = new Blob([JSON.stringify(state, null, 2)],{type:'application/json'});
  const url = URL.createObjectURL(blob);
  const a=document.createElement('a'); a.href=url; a.download='defects-backup-'+new Date().toISOString().slice(0,10)+'.json'; a.click(); URL.revokeObjectURL(url);
})

document.getElementById('global-search').addEventListener('input',()=>renderDefects())
document.getElementById('filter-status').addEventListener('change',()=>renderDefects())
document.getElementById('filter-priority').addEventListener('change',()=>renderDefects())
document.getElementById('btn-clear-filters').addEventListener('click',()=>{document.getElementById('global-search').value='';document.getElementById('filter-status').value='all';document.getElementById('filter-priority').value='all';renderDefects()})

function exportCSV(){
  const rows = [['id','title','description','priority','assignee','status','created','due']];
  (state.defects||[]).forEach(d=>rows.push([d.id, d.title.replace(/\n/g,' '), d.description?d.description.replace(/\n/g,' '):'', d.priority, d.assignee || '', new Date(d.created).toISOString(), d.due? new Date(d.due).toISOString(): '']));
  const csv = rows.map(r=>r.map(c=>`"${String(c).replace(/"/g,'""')}"`).join(',')).join('\n');
  const blob = new Blob([csv],{type:'text/csv;charset=utf-8;'});
  const url = URL.createObjectURL(blob); const a=document.createElement('a'); a.href=url; a.download='defects-export-'+new Date().toISOString().slice(0,10)+'.csv'; a.click(); URL.revokeObjectURL(url);
}
document.getElementById('btn-export-csv').addEventListener('click',exportCSV)

function renderReports(){
  const byStatus = countBy(state.defects||[], d=>d.status||'Неизвестно');
  const byPriority = countBy(state.defects||[], d=>d.priority||'Неизвестный');
  drawBar('chart-status-report', Object.keys(byStatus), Object.values(byStatus));
  drawBar('chart-priority-report', Object.keys(byPriority), Object.values(byPriority));
}

function renderChartsQuick(){
  const byStatus = countBy(state.defects||[], d=>d.status||'Неизвестно');
  drawBar('chart-status', Object.keys(byStatus), Object.values(byStatus));
}

function drawBar(canvasId, labels, data){
  const c = document.getElementById(canvasId); if(!c) return; const ctx=c.getContext('2d'); ctx.clearRect(0,0,c.width,c.height);
  const w=c.width, h=c.height; const padding=40; const max=Math.max(...data,1); const barW = (w-2*padding) / data.length * 0.6;
  labels.forEach((lab,i)=>{
    const val = data[i]; const x = padding + i*((w-2*padding)/data.length) + ((w-2*padding)/data.length - barW)/2; const barH = (h-2*padding) * (val/max);
    ctx.fillStyle = 'rgba(15,97,255,0.8)'; ctx.fillRect(x, h-padding-barH, barW, barH);
    ctx.fillStyle='#001428'; ctx.font='12px sans-serif'; ctx.fillText(lab, x, h-padding+14);
    ctx.fillText(val, x, h-padding-barH-6);
  })
}

function countBy(arr, fn){const m={}; arr.forEach(x=>{const k=fn(x); m[k]= (m[k]||0)+1}); return m}
function fileToDataURL(file){return new Promise((res)=>{const r=new FileReader();r.onload=()=>res({name:file.name,size:file.size,type:file.type,data:r.result}); r.readAsDataURL(file)})}

function getCurrentUser(){return state.users.find(u=>u.id===session.userId) || null}
function getCurrentUserName(){const u=getCurrentUser(); return u?u.name:'(гость)'}
function can(role){const u=getCurrentUser(); if(!u) return false; if(u.role===role) return true; if(u.role==='manager') return true; return false}

function escapeHtml(s){if(!s) return ''; return String(s).replace(/[&<>"']/g, function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":"&#39;"}[c]})}

document.addEventListener('keydown',e=>{ if(e.key==='/' && document.activeElement.tagName!=='INPUT' && document.activeElement.tagName!=='TEXTAREA'){ e.preventDefault(); document.getElementById('global-search').focus(); }})

window.addEventListener('storage',()=>{ Object.assign(state, loadState()); renderDefects(); renderProjects(); renderUserArea(); })
