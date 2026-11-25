(function(){
 'use strict';
 const groups=[
  ['社区入口',[['home','双列流首页'],['note','图文笔记'],['video','视频笔记'],['drag','拖拽问笔记']]],
  ['分享与消息',[['share','图文分享'],['share-video','视频分享'],['messages','消息页'],['comments','评论 @点点'],['comment-sheet','评论回复半层']]],
  ['搜索',[['search-start','搜索中间页'],['search','在线总结等待'],['search-offline','离线总结'],['search-scroll','下滑触发放大镜']]],
  ['点点容器',[['chat','主站对话'],['chat-standalone','独立端对话'],['shared-answer','共享答案'],['settings','设置页'],['fallback','兜底页']]]
 ];
 const routes=Object.fromEntries(groups.flatMap(g=>g[1]));
 const host=document.querySelector('#communityHost'),phone=document.querySelector('#phone');
 const flags={scroll:true};
 let route='home',cleanup=null,returnTo='home',query='北京附近最大的湖';
 const status=t=>{document.querySelector('#journeyStatus').textContent=t;};
 window.DotsContext={
  getSources(text){
   if(/北京旅游|北京有哪些|北京旅行/.test(text))return null;
   const note=/笔记|视频/.test(text),n=window.CommunityDemo.getSelectedNote(),topic=note?n.title:/苏州/.test(text)?'苏州三日游':'金海湖周末游';
   return[{type:'note',emoji:'📝',title:topic,author:note?n.author+' · 演示笔记':'旅行体验 · 演示笔记'},{type:'note',emoji:'💬',title:note?'笔记评论中的讨论与常见问题':topic+'：路线与出游体验',author:'内容整理 · 演示笔记'},{type:'note',emoji:'📌',title:note?'同主题内容的经验整理':'慢慢走，发现路上的风景',author:'经验分享 · 演示笔记'},{type:'web',emoji:'🌐',title:note?'相关背景信息示例':'地点信息与开放安排示例',author:'网页来源 · 演示内容'}];
  },
  getAnswer(text,version){
   if(/笔记|视频/.test(text)){const n=window.CommunityDemo.getSelectedNote();return{intro:`这篇${n.video?'视频':'笔记'}主要分享了「${n.title}」。我把内容里的重点整理成了几个部分，方便你继续了解。`,heading:version?'💡 换个角度看这篇内容':'📝 笔记重点',items:[['内容概览：',n.description.replace(/\n/g,' ')],['作者分享：',`${n.author}围绕自己的体验记录了这篇内容，相关话题是${n.tags.replace(/#/g,'')}。`],['评论里的问题：','可以进一步关注具体的使用场景、体验差异和细节，结合原文理解大家的讨论。'],['还可以继续问：','告诉我你更想了解哪一部分，我可以帮你提炼重点、整理对比，或把内容变成清单。']]};}
   if(/湖|金海/.test(text))return{intro:'北京附近的金海湖适合安排一趟放慢节奏的周末旅行。我把搜索结果里的地点信息和游玩方式整理好了。',heading:'🏞️ 金海湖游玩思路',items:[['地点信息：','金海湖位于北京市平谷区东北侧，水域面积约6.5平方公里。'],['沿湖自驾：','可以沿湖岸走走停停，在不同角度看看湖面和周围的山景。'],['湖畔散步：','不赶行程的话，就找一段喜欢的湖岸慢慢走，把时间留给拍照和休息。'],['出发前：','查看当日开放安排和天气，结合自己的出行方式安排路线。']]};
   if(/苏州/.test(text))return{intro:'三天可以把苏州的古典园林、小巷烟火和湖边风景串起来，留一点时间给慢慢走。',heading:'🗺️ 三天安排',items:[['Day 1 · 古典苏州：','拙政园 → 苏州博物馆 → 平江路。从园林到街巷，认识江南的日常。'],['Day 2 · 小巷烟火：','留园 → 山塘街 → 虎丘。沿河散步，傍晚看看灯火和街边的小店。'],['Day 3 · 湖畔落日：','金鸡湖 → 李公堤。最后一天放慢节奏，用一场日落结束旅行。'],['行程准备：','提前核对预约和开放时间，每天留一点自由安排的空间。']]};
   return null;
  },
  getSteps(text){
   if(/北京旅游|北京有哪些|北京旅行/.test(text))return null;
   const note=/笔记|视频/.test(text),title=note?'笔记内容':/苏州/.test(text)?'苏州旅行':'湖畔出游';
   return[{icon:'cloud',title:note?'理解这篇笔记':'梳理你的出游需求',detail:note?'先读一读这篇内容的主题、描述和重点，确认你想了解的信息。':'先确认目的地和出游节奏，整理需要关注的信息。'},
    {icon:'glass',title:note?'整理笔记与评论的线索':'搜索相关的真实经验',detail:`围绕${title}整理相关信息，把细节和常见问题放在一起。`,sources:true},
    {icon:'book',title:note?'核对内容里的重点':'核对路线与行程安排',detail:'比较不同信息的侧重点，整理对这个问题有帮助的内容。'},
    {icon:'pen',title:'整理成容易浏览的回答',detail:'提炼重点，分成几个清楚的部分，保留可以继续追问的方向。'}];
  }
 };
 const routeNav=document.querySelector('#routeNav');
 routeNav.innerHTML=groups.map(([label,items])=>`<section class="route-group"><h2>${label}</h2><div>${items.map(([id,title])=>`<button data-route="${id}">${title}</button>`).join('')}</div></section>`).join('');
 const select=document.querySelector('#mobileRoute');
 select.innerHTML=groups.map(([label,items])=>`<optgroup label="${label}">${items.map(([id,title])=>`<option value="${id}">${title}</option>`).join('')}</optgroup>`).join('');
 function go(next,options={}){
  if(!routes[next])next='home';
  cleanup?.();cleanup=null;
  if(route.startsWith('chat')&&!next.startsWith('chat')){if(running)stop();closeSheet();window.DotsMotion.destroy(document.querySelector('#headerAvatar'));}
  if(!route.startsWith('chat')&&next.startsWith('chat'))returnTo=route;
  route=next;if(options.query)query=options.query;
  const chat=route.startsWith('chat');
  phone.dataset.route=route;phone.classList.toggle('community-mode',!chat);phone.classList.toggle('standalone-chat',route==='chat-standalone');
  host.hidden=chat;host.innerHTML='';document.querySelector('#chatLab').hidden=!chat;
  document.querySelector('#searchRules').hidden=!route.startsWith('search');
  document.querySelector('#shareReplay').hidden=!route.startsWith('share');
  document.querySelectorAll('[data-route]').forEach(b=>{b.classList.toggle('active',b.dataset.route===route);b.setAttribute('aria-current',b.dataset.route===route?'page':'false');});
  select.value=route;document.querySelector('#stageName').textContent=routes[route];
  document.querySelector('#mobileSceneName').textContent=routes[route];
  const deps={navigate:go,openChat:open,toast,motion,finishMotion:(el,key='idle')=>window.DotsMotion.finish(el,key),flags,query,status,resume:options.resume};
  if(chat){restore();if(options.query)start(options.query);status('顶部常态眨眼；思考结束会播完当前轮，赞/踩各回应一次。');}
  else if(route.startsWith('search'))cleanup=window.SearchDemo.render(route,host,deps);
  else if(['settings','fallback','shared-answer'].includes(route))cleanup=renderExtra(route,host,deps);
  else{status({home:'点击左上角描边点点进入对话，也可打开笔记或搜索。',note:'图文笔记：底部描边入口；分享面板含首次引导。',video:'视频笔记：Ask Dots 入口与视频分享首次引导。',drag:'长按或拖动笔记到下方点点；点点保持常态眨眼。',share:'第三行首位为描边入口；首次引导“总结笔记”。','share-video':'视频首次引导“总结视频”，与图文分别计次。',messages:'消息页使用静态点点头像，点击进入对话。',comments:'评论区 @点点 提问，回复可打开半层答案。','comment-sheet':'评论回复半层：静态头像与底部“我也问点点”。'}[route]);cleanup=window.CommunityDemo.render(route,host,deps);}
 }
 function open(text){go('chat',text?{query:text}:{});}
 const still='assets/figma/e06a7.svg';
 function renderExtra(page,el,deps){
  const back='<img src="assets/figma/dfe8c.svg" alt="">';
  el.innerHTML=`<section class="extra-screen"><nav class="extra-nav"><button class="extra-back" aria-label="返回">${back}</button><b>${page==='settings'?'设置':`<img src="${still}" alt="">点点`}</b><span></span></nav>${page==='settings'?`<div class="settings-profile"><span id="settingsDots"></span><h2>点点</h2><p>你的 AI 生活搜索助手</p></div><div class="settings-list"><button>个人信息 <span>›</span></button><button>通知设置 <span>›</span></button><button>隐私设置 <span>›</span></button></div><div class="settings-list"><button>帮助与反馈 <span>›</span></button><button>关于点点 <span>›</span></button></div><div class="settings-footer">点点，生活里的好伙伴</div>`:page==='fallback'?`<div class="fallback-body"><img src="${still}" alt="点点"><h2>网络开小差了</h2><p>别着急，稍后再试一次吧</p><button class="fallback-retry">重新加载</button></div>`:`<div class="shared-scroll"><article class="shared-copy"><h2>🗺️ 三天安排</h2><h3>Day 1｜古典苏州 · 走进江南画卷</h3><p>拙政园 → 苏州博物馆 → 平江路</p><p><b>上午：拙政园</b><br>从园林开始认识苏州。沿着曲折的回廊慢慢走，看看借景、漏窗和水面，把节奏放慢一点。</p><div class="shared-garden"><img src="assets/shared/garden.jpg" alt="苏州园林"></div><p>建议提前预约，留出两三个小时。走累了，就在园中找一处窗景，坐下来感受江南。</p><h3>Day 2｜小巷烟火 · 山塘街慢游</h3><p>留园 → 山塘街 → 虎丘</p><p>上午看园林，下午沿河散步。傍晚的山塘街亮起灯，找一家小店尝尝苏式面和糕团。</p><h3>Day 3｜湖畔散步 · 收集落日</h3><p>金鸡湖 → 李公堤</p><p>最后一天不用赶路，沿湖走走，用一场日落结束这趟苏州旅行。</p><small>内容由 AI 生成</small></article></div><button class="shared-ask"><img src="${still}" alt="">我也问点点 <span>›</span></button>`}<div class="scene-safe"></div></section>`;
  el.querySelector('.extra-back').onclick=()=>deps.navigate('home');
  if(page==='settings'){window.DotsMotion.play(el.querySelector('#settingsDots'),'idle');el.querySelectorAll('.settings-list button').forEach(b=>b.onclick=()=>deps.toast(b.textContent.replace('›','').trim()+' · 演示入口'));status('设置页：绿色常态点点持续眨眼。');}
  if(page==='fallback'){el.querySelector('.fallback-retry').onclick=()=>deps.navigate('chat');status('兜底页：静态点点切图；重试返回对话容器。');}
  if(page==='shared-answer'){el.querySelector('.shared-ask').onclick=()=>deps.openChat('帮我安排一次苏州三日游');status('共享答案页：静态标题头像，底部浮动“我也问点点”。');}
  return()=>window.DotsMotion.destroyWithin(el);
 }
 routeNav.addEventListener('click',e=>{const b=e.target.closest('[data-route]');if(b)go(b.dataset.route);});
 select.onchange=()=>go(select.value);
 document.querySelector('#backButton').addEventListener('click',e=>{e.stopImmediatePropagation();go(returnTo,{resume:true});},true);
 document.querySelector('#scrollToggle').onchange=e=>{flags.scroll=e.target.checked;if(route.startsWith('search')&&route!=='search-start')go(route);};
 document.querySelector('#shareReplay').onclick=()=>{window.CommunityDemo.replayShareGuide();go(route);};
 document.querySelector('#mobileReplay').onclick=()=>{if(route.startsWith('chat'))start();else if(route.startsWith('share')){window.CommunityDemo.replayShareGuide();go(route);}else go(route);};
 document.addEventListener('click',e=>{if(e.target.closest('#playDemo,[data-emotion]')){if(!route.startsWith('chat'))go('chat');}},true);
 window.DotsJourney={navigate:go,openChat:open,getRoute:()=>route};
 go('home');
})();
