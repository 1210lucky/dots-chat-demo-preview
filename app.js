/* Dots interaction demo. Content and sources are simulated, no model or search API. */
const $ = (s, root=document) => root.querySelector(s);
const $$ = (s, root=document) => [...root.querySelectorAll(s)];
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const escapeHTML = s => String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const delay = ms => new Promise(r=>setTimeout(r,ms));
const names = {idle:'常态',think:'思考','think-long':'思考',happy:'开心',sad:'绞尽脑汁'};
let scenario='full', running=false, runId=0, currentStage='done', feedback=null, versions=1, version=0, skipped=false, lastQuery='北京旅游攻略', sheetReturnFocus;
let titleEmotion='idle';
let currentSteps=[];
let sheetKind='';
const thinkingSheetState={expanded:new Map(),source:'all'};
const sheetGestures=window.DotsThinkingSheet.create({overlay:$('#sheetOverlay'),sheet:$('.sheet'),handle:$('.sheet-handle'),header:$('.sheet-header'),onClose:closeSheet});
function resetThinkingSheetState(){thinkingSheetState.expanded.clear();thinkingSheetState.source='all';}
const answerData=[
  {intro:'这是一份帮你梳理好的北京旅游攻略，涵盖了经典路线、必体验项目和实用避坑建议，让你省心玩转帝都。',heading:'🏛️ 必打卡景点精选',items:[['故宫博物院：','建议至少留出半天时间。可以只逛中轴线，体力好的再逛东西六宫。神武门出来后，一定要去对面的景山公园，登上万春亭可以俯瞰故宫全景，非常壮观。'],['天安门广场：','看升旗仪式需要极早到达，凌晨三四点去排队才可能站前排。参观广场、纪念堂、大会堂和天安门城楼的路线要规划好，天安门城楼往故宫方向是单行道，走过就不能返回广场了，否则要绕路半小时。'],['八达岭长城：','如果带老人孩子，推荐选择南线，坡度较缓，也可以坐地面缆车，会轻松很多。'],['颐和园：','园子非常大，可以坐船游昆明湖，体验“舟行碧波上”的感觉，重点游览长廊、佛香阁和十七孔桥等核心景点就够了。']]},
  {intro:'也可以按区域把北京串起来玩。这份三日路线把节奏放慢，给吃饭、散步和临时发现留一点时间。',heading:'🗺️ 三天，慢慢逛北京',items:[['第一天 · 中轴线：','从故宫出发，下午到景山看一眼紫禁城全景，再往北海公园走走。把主要景点放在同一片区域，减少来回折返。'],['第二天 · 颐和园：','留大半天给昆明湖和长廊，不用赶着打卡所有景点。傍晚回到市区，找一家喜欢的馆子吃饭。'],['第三天 · 胡同漫步：','从鼓楼走到什刹海，看看小店，在湖边坐坐。如果更想看长城，可以把这一天单独留给八达岭。'],['出发前：','提前确认各景点的开放安排与预约要求，穿舒适的鞋。每天选一两个重点，比一路赶场更舒服。']]}
];
function getAnswerData(){return window.DotsContext?.getAnswer?.(lastQuery,version)||answerData[version%answerData.length];}
const defaultSteps=[
 {icon:'cloud',title:'梳理北京旅行的重点',detail:'把经典景点、交通衔接和游玩节奏放在一起，先整理一条不绕路的路线。'},
 {icon:'glass',title:'搜索北京旅行的真实经验',detail:'查看景点游览顺序、亲子出行建议与游客分享的避坑经验。',sources:true},
 {icon:'book',title:'核对景点与路线安排',detail:'结合景点分布，整理故宫、长城与颐和园的游玩重点，减少重复往返。'},
 {icon:'pen',title:'整理一份省心的旅行攻略',detail:'把信息整理成容易浏览的景点清单，补充不同体力和出行方式的选择。'}
];
let steps=defaultSteps;
function motion(el,key,loop=true,onComplete){
 return window.DotsMotion.play(el,key,{loop,onComplete});
}
function cleanupWithin(root){window.DotsMotion.destroyWithin(root);}
function avatar(key,once=false,immediate=false){
 const el=$('#headerAvatar');
 const options={loop:!once,onStart:()=>{
  titleEmotion=key;
  $('#stateLabel').textContent=names[key];
  $$('.emotion').forEach(b=>b.classList.toggle('selected',b.dataset.emotion===key||((key==='think'||key==='think-long')&&b.dataset.emotion==='think-long')));
 },onComplete:once?()=>avatar(running&&['judge','short','long','quick'].includes(currentStage)?'think':'idle'):undefined};
 if(immediate)window.DotsMotion.destroy(el);
 if(key==='idle'&&window.DotsMotion.getState(el)?.state==='think')window.DotsMotion.finish(el,'idle',options);
 else window.DotsMotion.play(el,key,options);
}
function progress(text){$('#progressText').textContent=text;}
function toast(text){$('#toast').textContent=text;$('#toast').classList.add('visible');clearTimeout(toast.timer);toast.timer=setTimeout(()=>$('#toast').classList.remove('visible'),2200);}
function bottom(force=false){const el=$('#chatScroll');if(force||el.scrollHeight-el.clientHeight-el.scrollTop<130){el.scrollTo({top:el.scrollHeight,behavior:reduced?'instant':'smooth'});}updateScrollButton();}
function updateScrollButton(){$('#scrollBottom').hidden=$('#chatScroll').scrollHeight-$('#chatScroll').scrollTop-$('#chatScroll').clientHeight<65;}
function composerState(){const typed=$('#messageInput').value.trim().length>0;$('#sendButton').hidden=running||!typed;$('#stopButton').hidden=!running;$('#addButton').hidden=running||typed;$('#cameraButton').hidden=running||typed;$('#messageInput').disabled=running;$('#voiceButton').disabled=running;}
function userMarkup(query){return `<div class="user-row"><div class="user-bubble">${escapeHTML(query)}</div></div>`;}
function summaryMarkup(){return `<button class="answer-summary" data-action="sources" aria-label="查看思考过程与参考来源"><span>${skipped?'参考小红书与全网 24 篇内容':'思考完成，参考小红书与全网 24 篇'}</span><span class="source-avatars"><img src="assets/figma/b9f97.png" alt=""><img src="assets/figma/61250.png" alt=""></span><img src="assets/figma/624c8.svg" alt=""></button>`;}
function actionsMarkup(){return `<div class="actions"><div class="action-group"><button class="action like ${feedback==='like'?'selected':''}" data-action="like" aria-label="点赞" aria-pressed="${feedback==='like'}"><img src="assets/answer-actions/${feedback==='like'?'thumb-selected':'like'}.svg" alt=""></button><button class="action dislike ${feedback==='dislike'?'selected':''}" data-action="dislike" aria-label="点踩" aria-pressed="${feedback==='dislike'}"><img src="assets/answer-actions/${feedback==='dislike'?'thumb-selected':'dislike'}.svg" alt=""></button><button class="action" data-action="share" aria-label="分享回答"><img src="assets/answer-actions/share.svg" alt=""></button></div><div class="action-group">${versions>1?`<button class="action" data-action="previous" aria-label="上一版回答" ${version===0?'disabled':''}><i class="chevron left"></i></button><span class="version-label">${version+1}/${versions}</span><button class="action" data-action="next" aria-label="下一版回答" ${version===versions-1?'disabled':''}><i class="chevron"></i></button>`:`<button class="action" data-action="regenerate" aria-label="重新生成"><img src="assets/answer-actions/regenerate.svg" alt=""></button>`}</div></div>`;}
function listMarkup(data){return data.items.map(([title,body])=>`<li><img class="bullet" src="assets/figma/a125d.svg" alt=""><span><b>${title}</b> ${body}</span></li>`).join('');}
function answerMarkup(){const d=getAnswerData();return `<article class="answer" id="answer">${summaryMarkup()}<p class="intro-text">${d.intro}</p><h3>${d.heading}</h3><ul>${listMarkup(d)}</ul>${actionsMarkup()}</article>`;}
function restore(){runId++;running=false;currentStage='done';feedback=null;versions=1;version=0;skipped=false;steps=defaultSteps;currentSteps=steps.map((s,i)=>i);lastQuery='北京旅游攻略';resetThinkingSheetState();cleanupWithin($('#conversation'));$('#conversation').innerHTML=userMarkup(lastQuery)+answerMarkup();closeSheet();avatar('idle',false,true);composerState();progress('回答已就绪，可以开始互动');requestAnimationFrame(()=>bottom(true));}
function selectScenario(value){scenario=value;$$('.scenario').forEach(b=>b.classList.toggle('selected',b.dataset.scenario===value));$('#playDemo span').textContent={full:'播放完整演示',short:'播放短思考',long:'播放长思考'}[value];}
function setShort(title,icon='cloud'){
 let box=$('#thinking');if(box){cleanupWithin(box);box.remove();}
 box=document.createElement('div');box.id='thinking';box.className='short-thinking';box.innerHTML=`<span class="process-icon"></span><span>${escapeHTML(title)}</span>`;$('#conversation').append(box);motion($('.process-icon',box),'process-'+icon);bottom(true);
}
function setLong(){let old=$('#thinking');if(old){cleanupWithin(old);old.remove();}const box=document.createElement('div');box.id='thinking';box.className='thinking-card';box.innerHTML='<div class="thinking-top"><button class="thinking-title" data-action="sources"><span class="shimmer">正在思考</span><i class="chevron"></i></button><button class="skip" data-action="skip" aria-label="跳过思考，获得快速回答">跳过</button></div><div class="thinking-rows"></div>';$('#conversation').append(box);bottom(true);}
async function addStep(i,id){
 const box=$('.thinking-rows');if(!box)return;
 const previous=$('.think-row.active',box);
 if(previous){previous.classList.remove('active');previous.classList.add('complete');await delay(reduced?0:620);if(id!==runId)return;const icon=$('.process-icon',previous);cleanupWithin(icon);icon.innerHTML='<img src="assets/think-check-complete.svg" alt="完成">';}
 const s=steps[i],row=document.createElement('div');row.className='think-row active';row.innerHTML=`<span class="process-icon"></span><div class="row-title">${s.title}</div><div class="row-detail">${s.detail}${s.sources?'<div class="source-counts"><span><img src="assets/think-note-single.svg" alt="">小红书 · 18</span><span><img src="assets/think-internet.svg" alt="">全网 · 6</span></div>':''}</div>`;box.append(row);motion($('.process-icon',row),'process-'+s.icon);currentSteps.push(i);if(box.scrollHeight>156)box.classList.add('scrolled');box.scrollTo({top:box.scrollHeight,behavior:reduced?'instant':'smooth'});bottom(true);progress(s.title);if(!$('#sheetOverlay').hidden&&sheetKind==='thinking')renderThinkingSheet();
}
async function start(query='北京旅游攻略',regenerate=false){
 const mode=scenario;const id=++runId;running=true;currentStage='judge';feedback=null;skipped=false;currentSteps=[];lastQuery=query;resetThinkingSheetState();
 const contextSteps=window.DotsContext?.getSteps?.(query);steps=Array.isArray(contextSteps)&&contextSteps.length?contextSteps:defaultSteps;
 if(regenerate){versions=Math.min(versions+1,2);version=versions-1;}else{versions=1;version=0;}
 closeSheet();cleanupWithin($('#conversation'));$('#conversation').innerHTML=userMarkup(query);$('#messageInput').value='';composerState();avatar('think');setShort('','eyes');progress('正在理解你的问题');bottom(true);
 await delay(1100);if(id!==runId)return;
 currentStage='short';setShort(steps[0].title);progress('短思考 · 轻量判断');
 await delay(mode==='short'?2600:2200);if(id!==runId)return;
 if(mode==='short'){currentSteps=[0];await finishAnswer(id);return;}
 if(mode==='full'){cleanupWithin($('#thinking'));$('#thinking').remove();const p=document.createElement('div');p.className='preface';p.textContent='我来把相关信息和实用建议整理一下。';$('#conversation').append(p);await delay(700);if(id!==runId)return;}
 currentStage='long';avatar('think-long');setLong();
 for(let i=0;i<steps.length;i++){if(id!==runId)return;await addStep(i,id);await delay(i===1?3200:2400);}
 if(id!==runId)return;await finishAnswer(id);
}
async function finishAnswer(id){
 if(id!==runId)return;currentStage='answer';const old=$('#thinking');if(old){old.classList.add('collapsing');await delay(reduced?0:560);if(id!==runId)return;cleanupWithin(old);old.remove();}
 avatar('idle');progress('思考完成 · 正在生成回答');
 const a=document.createElement('article');a.className='answer';a.id='answer';a.innerHTML=summaryMarkup();$('#conversation').append(a);
 const d=getAnswerData();const chunks=[`<p class="intro-text streaming-block">${d.intro}</p>`,`<h3 class="streaming-block">${d.heading}</h3><ul></ul>`,...d.items.map(item=>listMarkup({items:[item]}))];
 for(let i=0;i<chunks.length;i++){if(id!==runId)return;const scroll=$('#chatScroll');const follow=scroll.scrollHeight-scroll.clientHeight-scroll.scrollTop<130;if(i<2)a.insertAdjacentHTML('beforeend',chunks[i]);else $('ul',a).insertAdjacentHTML('beforeend',chunks[i]);if(follow)bottom(true);await delay(reduced?0:350);}
 if(id!==runId)return;a.insertAdjacentHTML('beforeend',actionsMarkup());running=false;currentStage='done';composerState();progress('回答已完成，试试点赞或点踩');bottom();if(!$('#sheetOverlay').hidden&&sheetKind==='thinking')renderThinkingSheet();
}
async function skip(){if(!running)return;const id=++runId;skipped=true;currentSteps=[];currentStage='quick';avatar('think');setShort('正在整理搜索结果','glass');progress('已跳过长思考，正在快速回答');if(!$('#sheetOverlay').hidden&&sheetKind==='thinking')renderThinkingSheet();await delay(1100);if(id!==runId)return;await finishAnswer(id);}
function stop(){if(!running)return;runId++;running=false;currentStage='stopped';const box=$('#thinking');if(box){cleanupWithin(box);box.remove();}const answer=$('#answer');if(answer&&!$('.actions',answer))answer.insertAdjacentHTML('beforeend',actionsMarkup());$('#conversation').insertAdjacentHTML('beforeend','<p class="interrupted">已停止生成</p>');avatar('idle');composerState();progress('已停止生成，可以重新演示');bottom(true);if(!$('#sheetOverlay').hidden&&sheetKind==='thinking')renderThinkingSheet();}
function openSheet(title,html,thinking=false){sheetReturnFocus=document.activeElement;sheetKind=thinking?'thinking':'generic';$('#sheetTitle').textContent=title;cleanupWithin($('#sheetContent'));$('#sheetContent').innerHTML=html;$('#sheetContent').scrollTop=0;$('#sheetOverlay').hidden=false;sheetGestures.open({thinking});$('#closeSheet').focus();}
function closeSheet(){if($('#sheetOverlay').hidden)return;$('#sheetOverlay').hidden=true;sheetGestures.close();sheetKind='';cleanupWithin($('#sheetContent'));sheetReturnFocus?.focus?.();}
const sources=[{type:'note',emoji:'🏛️',title:'第一次去北京，这条中轴线慢慢走',author:'旅行体验 · 演示笔记'},{type:'note',emoji:'🌳',title:'颐和园半日游，留一点时间给湖边',author:'周末散步 · 演示笔记'},{type:'note',emoji:'⛰️',title:'带家人去长城，路线怎么选',author:'出行记录 · 演示笔记'},{type:'web',emoji:'🌐',title:'景点游览与预约信息示例',author:'网页来源 · 演示内容'}];
function sourceMarkup(type='all'){return (window.DotsContext?.getSources?.(lastQuery)||sources).filter(s=>type==='all'||s.type===type).map(s=>`<div class="source-item"><div class="source-thumb">${s.emoji}</div><div><b>${s.title}</b><small>${s.author}</small></div></div>`).join('');}
function thinkingSheetHTML(){
 const active=['judge','short','long','quick'].includes(currentStage);
 const stepsHTML=skipped?'':currentSteps.map((idx,i)=>{
  const latest=active&&i===currentSteps.length-1;
  const expanded=thinkingSheetState.expanded.has(idx)?thinkingSheetState.expanded.get(idx):latest;
  return `<details data-step-index="${idx}" ${expanded?'open':''}><summary><span class="step-check">${latest?'◌':'✓'}</span>${steps[idx].title}</summary><p>${steps[idx].detail}</p></details>`;
 }).join('');
 const tabs=[['all','全部'],['note','笔记 18'],['web','全网 6']].map(([type,label])=>`<button class="source-tab ${thinkingSheetState.source===type?'selected':''}" data-source="${type}" aria-pressed="${thinkingSheetState.source===type}">${label}</button>`).join('');
 return `<p class="source-disclaimer">以下是预设的过程与来源，用于演示交互。</p>${stepsHTML}<div class="sources-heading">参考来源 · 24</div><div class="source-tabs">${tabs}</div><div id="sourceList">${sourceMarkup(thinkingSheetState.source)}</div>`;
}
function renderThinkingSheet(){
 if(sheetKind!=='thinking')return;
 const active=['judge','short','long','quick'].includes(currentStage),content=$('#sheetContent'),focused=document.activeElement;
 const title=active?'正在思考':currentStage==='stopped'?'思考已停止':'思考完成';$('#sheetTitle').textContent=skipped?'参考来源':title;
 const stepFocus=focused?.closest?.('[data-step-index]')?.dataset.stepIndex;
 const sourceFocus=focused?.dataset?.source;
 const wasFocused=content.contains(focused),scrollTop=content.scrollTop;
 content.innerHTML=thinkingSheetHTML();
 if(wasFocused){const target=stepFocus!==undefined?$(`[data-step-index="${stepFocus}"] summary`,content):sourceFocus?$(`[data-source="${sourceFocus}"]`,content):null;(target||$('#closeSheet')).focus({preventScroll:true});}
 content.scrollTop=scrollTop;
}
function showSources(){if(currentStage==='short'||currentStage==='judge')return;openSheet(skipped?'参考来源':currentStage==='long'?'正在思考':currentStage==='stopped'?'思考已停止':'思考完成',thinkingSheetHTML(),true);}
function showProfile(){openSheet('关于点点','<div class="profile-avatar" id="profileAvatar"></div><div class="profile-title">点点</div><div class="profile-desc">认真想一想，也认真回应你。</div><button class="sheet-option" data-action="new">开始新的演示</button><button class="sheet-option" data-action="regenerate">重新生成当前回答</button><p class="source-disclaimer" style="margin-top:20px">此页面为交互 Demo，内容与反馈均保存在本次演示中。</p>');motion($('#profileAvatar'),'idle');}
function vote(type){if(running)return;const wasFocused=document.activeElement?.dataset?.action===type;if(feedback===type){feedback=null;avatar('idle');progress('已取消反馈');}else{feedback=type;avatar(type==='like'?'happy':'sad',true);progress(type==='like'?'收到点赞 · 点点开心了一下':'收到反馈 · 点点会继续努力');}const a=$('.actions');if(a)a.outerHTML=actionsMarkup();if(wasFocused)document.querySelector('[data-action='+type+']')?.focus({preventScroll:true});}
function showShare(){const d=getAnswerData();openSheet('分享回答',`<div class="profile-avatar" id="shareAvatar" style="width:58px;height:58px"></div><div class="share-preview"><b>点点 · ${escapeHTML(lastQuery)}</b>${d.intro}<br><br>${d.heading}</div><button class="sheet-primary" data-action="copy">复制回答</button><p class="source-disclaimer" style="margin-top:12px;text-align:center">分享卡片预览 · 不会自动发布</p>`);motion($('#shareAvatar'),'idle');}
async function copyAnswer(){const d=getAnswerData();const text=[lastQuery,d.intro,d.heading,...d.items.map(x=>x.join(''))].join('\n\n');try{if(navigator.clipboard&&window.isSecureContext)await navigator.clipboard.writeText(text);else{const t=document.createElement('textarea');t.value=text;document.body.append(t);t.select();if(!document.execCommand('copy'))throw Error();t.remove();}toast('回答已复制');}catch{toast('当前浏览器不支持复制，请选择正文复制');}}
function pageVersion(delta){version=Math.max(0,Math.min(versions-1,version+delta));feedback=null;const a=$('#answer');if(a)a.outerHTML=answerMarkup();avatar('idle');bottom(true);progress(`正在查看第 ${version+1} 版回答`);}
document.addEventListener('click',e=>{
 const action=e.target.closest('[data-action]')?.dataset.action;if(action){({like:()=>vote('like'),dislike:()=>vote('dislike'),share:showShare,sources:showSources,skip,regenerate:()=>start(lastQuery,true),previous:()=>pageVersion(-1),next:()=>pageVersion(1),new:restore,copy:copyAnswer})[action]?.();}
 const scen=e.target.closest('[data-scenario]');if(scen)selectScenario(scen.dataset.scenario);
 const emot=e.target.closest('[data-emotion]');if(emot){avatar(emot.dataset.emotion,emot.dataset.emotion!=='idle');progress(`预览${names[emot.dataset.emotion]}表情 · 播放后回到当前状态`);}
 const detail=e.target.closest('#sheetContent details[data-step-index]');if(detail&&e.target.closest('summary'))thinkingSheetState.expanded.set(Number(detail.dataset.stepIndex),!detail.open);
 const tab=e.target.closest('[data-source]');if(tab&&$('#sheetContent').contains(tab)){thinkingSheetState.source=tab.dataset.source;$$('.source-tab',$('#sheetContent')).forEach(t=>{t.classList.toggle('selected',t===tab);t.setAttribute('aria-pressed',String(t===tab));});$('#sourceList').innerHTML=sourceMarkup(thinkingSheetState.source);}
 const example=e.target.closest('[data-example]');if(example){selectScenario(example.dataset.example);start(example.textContent.trim());}
});
$('#playDemo').addEventListener('click',()=>start('北京旅游攻略'));
$('#resetDemo').addEventListener('click',restore);
$('#backButton').addEventListener('click',restore);
$('#avatarButton').addEventListener('click',showProfile);
$('#moreButton').addEventListener('click',showProfile);
$('#closeSheet').addEventListener('click',closeSheet);
$('#closeScrim').addEventListener('click',closeSheet);
$('#scrollBottom').addEventListener('click',()=>bottom(true));
$('#chatScroll').addEventListener('scroll',updateScrollButton,{passive:true});
$('#stopButton').addEventListener('click',stop);
$('#messageInput').addEventListener('input',composerState);
$('#composer').addEventListener('submit',e=>{e.preventDefault();const query=$('#messageInput').value.trim();if(!query||running)return;start(query);});
$('#addButton').addEventListener('click',()=>openSheet('试着问点点','<p class="source-disclaimer">选择一个问题，体验对应的思考过程。</p><button class="sheet-option" data-example="full">北京旅游攻略</button><button class="sheet-option" data-example="short">北京有哪些经典景点？</button><button class="sheet-option" data-example="long">帮我规划一次不赶路的北京旅行</button>'));
$('#voiceButton').addEventListener('click',()=>{openSheet('语音输入演示','<div class="profile-avatar" id="voiceAvatar"></div><p class="profile-desc">点击下方，模拟说出一个问题。</p><button class="sheet-primary" data-example="full">北京旅游攻略</button><p class="source-disclaimer" style="text-align:center;margin-top:12px">演示使用预设语音文本，不启用麦克风。</p>');motion($('#voiceAvatar'),'idle');});
$('#cameraButton').addEventListener('click',()=>$('#imageInput').click());
$('#imageInput').addEventListener('change',e=>{const file=e.target.files?.[0];if(!file)return;const reader=new FileReader();reader.onload=()=>{openSheet('图片已添加',`<img class="image-preview" style="margin:0 auto 16px" src="${reader.result}" alt="本地选择的图片"><p class="source-disclaimer">图片仅在本地预览，本演示未接入图片理解。</p><button class="sheet-primary" data-example="full">体验北京旅行对话</button>`);};reader.readAsDataURL(file);e.target.value='';});
document.addEventListener('keydown',e=>{if(e.key==='Escape')closeSheet();if(e.key==='Tab'&&!$('#sheetOverlay').hidden){const list=$$('button:not(:disabled),summary,[tabindex="0"]',$('.sheet'));const first=list[0],last=list[list.length-1];if(!$('.sheet').contains(document.activeElement)){e.preventDefault();first.focus();}else if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}}});
$$('[data-motion]').forEach(el=>motion(el,el.dataset.motion));
restore();
