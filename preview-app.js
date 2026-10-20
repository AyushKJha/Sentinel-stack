const $ = selector => document.querySelector(selector);
const safeText = value => String(value ?? '');
function statusClass(status){ return status === 'DOWN' ? 'down' : status === 'UP' ? 'up' : status === 'STALE' ? 'partial' : 'off'; }
function esc(value){ return safeText(value).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#39;'); }
function safeHref(value){ try{const parsed=new URL(value);return parsed.protocol==='https:'?parsed.href:'#';}catch{return '#';} }

function renderRepos(repos, siteHealth){
  const query = $('#search').value.trim().toLowerCase();
  const filter = $('#filter').value;
  const items = repos.filter(repo => {
    const matches = `${repo.name} ${repo.kind} ${repo.visibility}`.toLowerCase().includes(query);
    const group = filter === 'all' || repo.tier === filter || (filter === 'private' && repo.visibility === 'private');
    return matches && group;
  });
  $('#inventory-count').textContent = String(items.length).padStart(2,'0');
  $('#repo-rows').innerHTML = items.length ? items.map(repo => {
    const latest = siteHealth?.results?.filter(check=>check.repo===repo.name).sort((a,b)=>b.checkedAt.localeCompare(a.checkedAt))[0];
    const age = latest ? Date.now()-Date.parse(latest.checkedAt) : Infinity;
    const status = !repo.live ? 'NO LIVE URL' : !latest ? 'NOT CHECKED' : age>60*60*1000 ? 'STALE' : latest.ok ? 'UP' : 'DOWN';
    const repoHref=safeHref(repo.url);
    let liveHost='';try{const parsed=new URL(repo.live);if(parsed.protocol==='https:')liveHost=parsed.hostname;}catch{}
    return `<tr><td><a class="repo-name" href="${repoHref}" ${repoHref!=='#' ? 'target="_blank" rel="noreferrer"' : ''}>${esc(repo.name)}</a><span class="repo-sub">${repo.tier === 'external' ? 'PARTNER REPOSITORY' : esc(repo.tier.toUpperCase())}</span></td><td class="kind-cell">${esc(repo.kind)}</td><td><span class="visibility ${esc(repo.visibility === 'public' ? '' : repo.visibility)}">${esc(repo.visibility.toUpperCase())}</span></td><td>${liveHost ? `<a class="live-link" href="${safeHref(repo.live)}" target="_blank" rel="noreferrer">${esc(liveHost)} ↗</a>` : '<span class="muted-cell">— NOT SET —</span>'}</td><td><span class="monitor ${statusClass(status)}">${esc(status)}</span></td><td><a class="row-arrow" aria-label="Open repository" href="${repoHref}">↗</a></td></tr>`;
  }).join('') : '<tr><td class="empty" colspan="6">NO PROJECTS MATCH THIS VIEW</td></tr>';
}

function renderProviders(providers, releases){
  const definitions = [
    ['github','GitHub · inventory & posture','Repo discovery, security settings and traffic summaries.'],
    ['hosting','Hosting · health & capacity','Provider health, resource use, WAF status and deploy events.'],
    ['usage','Usage · aggregate only','Privacy-friendly counts; no identity tracking.'],
    ['firewall','Edge / firewall · per host','Current WAF policies and protection events.'],
    ['scanners','Local scanners · source & APK','Gitleaks, Trivy, Semgrep and MobSF on this machine.']
  ];
  $('#provider-list').innerHTML = definitions.map(([key,title,description]) => {
    const item=providers[key];const active=item.status==='connected';
    return `<div class="provider-row"><b>${title}</b><span class="provider-state ${active?'connected':''}">${esc(item.status.replaceAll('-',' ').toUpperCase())}</span><small>${description} ${esc(item.detail)}</small></div>`;
  }).join('');
  $('#release-list').innerHTML = releases.map(release=>`<div class="release-row"><a href="${safeHref(release.url)}" target="_blank" rel="noreferrer">${esc(release.repo)} · ${esc(release.version)} ↗</a><span class="release-state">HASH + SIGNATURE TODO</span><small>${esc(release.platform)} · LINK CHECKED ${esc(release.linkChecked)}</small></div>`).join('');
}

function renderExposure(repos){
  const groups = [
    { key:'public', label:'PUBLIC', color:'public' },
    { key:'private', label:'PRIVATE', color:'private' },
    { key:'external collaboration', label:'PARTNER', color:'partner' }
  ];
  const counts = groups.map(group => ({...group, count:repos.filter(repo=>repo.visibility===group.key).length}));
  const total = Math.max(1, repos.length);
  $('#exposure-bar').innerHTML = counts.map(group=>`<span class="exposure-segment ${group.color}" style="width:${group.count/total*100}%" title="${group.label}: ${group.count}"></span>`).join('');
  $('#exposure-legend').innerHTML = counts.map(group=>`<div class="exposure-key"><i class="key-${group.color}"></i><span>${group.label}</span><b>${String(group.count).padStart(2,'0')}</b></div>`).join('');
}

async function boot(){
  try{
    const response=await fetch('./preview-data.json',{headers:{Accept:'application/json'}});
    if(!response.ok) throw new Error('Inventory service unavailable');
    const {repos,providers,snapshot,releases,siteHealth}=await response.json();
    const owned=repos.filter(x=>x.visibility==='public'||x.visibility==='private');
    $('#owned-count').textContent=String(owned.length).padStart(2,'0');
    const privateCount=$('#private-count');if(privateCount)privateCount.textContent='—';
    $('#project-count').textContent=String(owned.length).padStart(2,'0');
    $('#endpoint-count').innerHTML=`${new Set(repos.filter(x=>x.live).map(x=>x.live)).size}<span class="metric-unit"> configured</span>`;
    $('#audit-date').textContent=new Date(snapshot.capturedAt).toLocaleDateString('en-GB',{day:'2-digit',month:'short'}).toUpperCase();
    $('#snapshot-date').textContent=new Date(snapshot.capturedAt).toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'numeric'}).toUpperCase();
    $('#posture-date').textContent=`${new Date(snapshot.capturedAt).toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'numeric'}).toUpperCase()} · LOCAL AUDIT`;
    renderExposure(repos);
    renderRepos(repos,siteHealth);renderProviders(providers,releases);
    $('#search').addEventListener('input',()=>renderRepos(repos,siteHealth));$('#filter').addEventListener('change',()=>renderRepos(repos,siteHealth));
  }catch(error){$('#repo-rows').innerHTML=`<tr><td class="empty" colspan="6">${esc(error.message)}</td></tr>`;}
}
boot();
