/* Search surfaces. All result content is a local interaction fixture. */
(function(){
 'use strict';
 const still='assets/figma/e06a7.svg';
 const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 let session=null, serial=0;
 const photos=['b0786.jpg','37541.jpg','01f07.jpg','53045.jpg'];
 const titles=['北京周末｜原来这里藏着这么美的湖','北京最大的湖泊，金海湖怎么玩？','周末不出京，去湖边吹吹风','收藏这条金海湖环湖自驾路线'];
 const authors=['糖醋小排','一只喜欢旅行的猫','去有风的地方','今天也在路上'];
 function render(route,host,deps){
  let alive=true, timers=[], observer, scrollTimer, holdTimer;
  const later=(fn,ms)=>{const t=setTimeout(()=>{if(alive)fn();},ms);timers.push(t);return t;};
  const status=text=>{if(alive)deps.status?.(text);};
  const fresh=route!=='search-start';
  if(fresh&&(!deps.resume||!session||session.kind!==route))session={id:++serial,query:deps.query||'北京附近最大的湖',kind:route,clicked:false,consumed:route==='search',complete:route!=='search'};
  const s=session;
  const back='<img src="assets/search/d49d1.svg" alt="">';
  const header=`<form class="sr-search-form"><button type="button" class="sr-back" aria-label="返回首页">${back}</button><label class="sr-input-wrap"><input aria-label="搜索内容" placeholder="搜索你感兴趣的内容" value="${route==='search-start'?'':esc(s.query)}"><button type="button" class="sr-clear" aria-label="清空搜索">×</button></label><button class="sr-submit">搜索</button></form>`;
  host.innerHTML=`<section class="search-screen">${header}${route==='search-start'?`<div class="sr-discover"><h3>历史记录 <button aria-label="清空历史">⌫</button></h3><div class="sr-history"><button>北京附近最大的湖</button><button>周末去哪儿</button><button>苏州三日游</button></div><h3>猜你想搜</h3><div class="sr-suggestions"><button>金海湖周末游玩攻略</button><button>北京周末出游</button><button>北京附近的湖泊</button><button>秋天去哪里散步</button></div></div><button class="sr-hold"><img src="${still}" alt="点点">按住问点点<span>⌁</span></button><div class="scene-safe"></div>`:`<div class="sr-tabs"><button class="selected">全部</button><button>用户</button><button>商品</button><button>图片</button><button>地点</button><button class="sr-ask" aria-label="问点点"><span class="sr-avatar"></span><b>问点点</b></button></div><div class="sr-results" tabindex="0" aria-label="搜索结果"><section class="sr-onebox ${!s.complete?'loading':''}"><div class="sr-summary-loading"><img class="sr-loading-indicator" src="assets/search/summary-loading.svg" alt=""><span>点点 正在总结</span></div><div class="sr-skeleton"><i></i><i></i></div><div class="sr-summary-body"><h2>金海湖</h2><p class="sr-first-text">北京附近最大的湖泊是金海湖，位于北京市平谷区东北侧，水域面积达6.5平方公里，是北京地区水域面积最大的综合性水上娱乐场所。</p><h3>玩法推荐</h3><p>• 环湖自驾路线：沿着湖岸慢慢开，走走停停，感受不同角度的湖光山色。<br>• 湖畔散步：找一处安静的位置，享受周末的慢时光。</p><div class="sr-summary-fade"></div><button class="sr-summary-link"><span>ai 总结129篇笔记</span><img src="assets/search/b9f97.png" alt=""><img src="assets/search/61250.png" alt=""><i>↗</i></button></div></section><div class="sr-filters"><button class="selected">综合⌄</button><button>游玩攻略</button><button>环湖路线</button><button>拍照打卡</button></div><div class="sr-grid">${Array.from({length:18},(_,i)=>`<button class="sr-card" aria-label="打开笔记：${titles[i%4]}"><img class="sr-cover" src="assets/search/${photos[i%4]}" alt="金海湖风景" loading="${i<4?'eager':'lazy'}" style="height:${[230,189,240,212][i%4]}px"><b>${titles[i%4]}</b><div><img src="assets/search/${['132b8.jpg','d4a9c.png','9b4d7.png'][i%3]}" alt=""><span>${authors[i%4]}</span><span>♡ ${[428,1024,356,892][i%4]}</span></div></button>`).join('')}</div><p class="sr-end">暂时就看到这里啦</p></div><div class="scene-safe"></div>`}</section>`;
  const q=sel=>host.querySelector(sel);
  function open(query){if(s)s.clicked=true;deps.openChat(query||s?.query||'北京附近最大的湖');}
  q('.sr-back').onclick=()=>deps.navigate('home');
  q('.sr-clear').onclick=()=>{q('input').value='';q('input').focus();};
  q('form').onsubmit=e=>{e.preventDefault();const query=q('input').value.trim();if(query)deps.navigate('search',{query});};
  if(route==='search-start'){
   host.querySelectorAll('.sr-history button,.sr-suggestions button').forEach(b=>b.onclick=()=>deps.navigate('search',{query:b.textContent}));
   q('.sr-discover h3 button').onclick=()=>{q('.sr-history').innerHTML='<span>暂无历史记录</span>';};
   const hold=q('.sr-hold');let held=false;
   hold.onpointerdown=e=>{hold.setPointerCapture(e.pointerId);held=false;hold.classList.add('holding');holdTimer=later(()=>{held=true;open(q('input').value.trim()||'北京附近最大的湖');},500);};
   hold.onpointerup=()=>{clearTimeout(holdTimer);hold.classList.remove('holding');if(!held)deps.toast('按住即可向点点提问');};
   hold.onpointercancel=()=>{clearTimeout(holdTimer);hold.classList.remove('holding');};
   hold.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();open(q('input').value.trim());}};
   status('搜索中间页：绿色静态入口，按住问点点。');
  }else{
   const icon=q('.sr-avatar'),list=q('.sr-results'),card=q('.sr-onebox');
   window.DotsMotion.play(icon,'idle',{freeze:true});
   function entryVisible(){const r=icon.getBoundingClientRect(),h=host.getBoundingClientRect();return r.width>0&&r.top>=h.top&&r.bottom<=h.bottom;}
   function loadAio(){if(s.complete)return;s.complete=true;card.classList.remove('loading');status('在线总结完成：点点保持静止。');}
   observer=new IntersectionObserver(entries=>{
    for(const e of entries){
     if(!e.isIntersecting)continue;
     if(e.target===card&&!s.complete&&!s.loadingStarted){s.loadingStarted=true;status('在线总结生成中：点点保持静止。');later(loadAio,3000);}
    }
   },{root:list,threshold:0.1});observer.observe(card);
   if(route==='search')status(s.complete?'在线总结完成：点点保持静止。':'在线总结生成中：点点保持静止。');
   if(route!=='search')status(route==='search-scroll'?'向下滑约两屏并停留 600ms：本次搜索可触发一次默认眨眼。':'离线总结：绿色静态入口；继续下滑可体验搜索触发规则。');
   q('.sr-ask').onclick=()=>open();q('.sr-summary-link').onclick=()=>open();
   host.querySelectorAll('.sr-card').forEach((b,i)=>b.onclick=()=>{window.CommunityDemo.setExternalNote({id:'lake-'+i,title:titles[i%4],description:'周末去金海湖吹吹风。环湖走走停停，从不同角度看湖面和远处的山，找一片草地坐下来，把时间留给风景。\n这次整理了沿湖自驾和散步的路线，出发前记得确认开放安排和天气。',tags:'#北京周末  #金海湖  #湖畔散步',author:authors[i%4],photo:'assets/search/'+photos[i%4],avatar:'assets/search/'+['132b8.jpg','d4a9c.png','9b4d7.png'][i%3],likes:'428',video:false});deps.navigate('note');});
   host.querySelectorAll('.sr-tabs>button:not(.sr-ask),.sr-filters button').forEach(b=>b.onclick=()=>{b.parentElement.querySelectorAll('.selected').forEach(x=>x.classList.remove('selected'));b.classList.add('selected');deps.toast('已切换到'+b.textContent.replace('⌄',''));});
   list.addEventListener('scroll',()=>{
    clearTimeout(scrollTimer);
    if(!deps.flags.scroll||s.clicked||s.consumed||list.scrollTop<list.clientHeight*2||!entryVisible())return;
    scrollTimer=later(()=>{if(s.clicked||s.consumed||!entryVisible())return;s.consumed=true;status('已下滑两屏并停留 600ms：播放一次默认眨眼，结束后恢复静态。');window.DotsMotion.play(icon,'idle',{loop:false,returnTo:'idle',returnOptions:{freeze:true},onComplete:()=>status('下滑眨眼已完成：恢复静态；同一次搜索不会重复播放。')});},600);
   },{passive:true});
   if(route==='search-scroll')card.remove();
   if(deps.resume&&s.scrollTop)list.scrollTop=s.scrollTop;
  }
  return()=>{alive=false;if(s&&route!=='search-start'){s.scrollTop=q('.sr-results')?.scrollTop||0;s.loadingStarted=false;}timers.forEach(clearTimeout);clearTimeout(scrollTimer);clearTimeout(holdTimer);observer?.disconnect();window.DotsMotion.destroyWithin(host);};
 }
 window.SearchDemo={render};
})();
