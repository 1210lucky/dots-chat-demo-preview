/* Shared Lottie lifecycle for every Dots surface. */
(function () {
 'use strict';
 const records = new Map();
 const preference = matchMedia('(prefers-reduced-motion: reduce)');
 const stillFrames = {idle:0,think:30,happy:40,sad:45};
 let requestId = 0;
 const stateKey = state => state === 'think-long' ? 'think' : state;
 const isCurrent = (record, id) => records.get(record.el) === record && record.id === id;
 function reflect(record){
  record.el.dataset.motionState=record.state;
  record.el.dataset.motionFinishing=String(Boolean(record.finishing));
  record.el.dataset.motionFrozen=String(Boolean(record.frozen));
 }

 function cancelPending(record) {
  record.id = ++requestId;
  if (record.completeListener) record.animation.removeEventListener('complete',record.completeListener);
  record.completeListener = null;
  clearTimeout(record.timer);
  record.timer = null;
  record.finishing = false;
  if (record.resolveFinish) record.resolveFinish(false);
  record.resolveFinish = null;
 }

 function destroy(el) {
  const record = records.get(el);
  if (!record) return;
  cancelPending(record);
  records.delete(el);
  record.animation.removeEventListener('DOMLoaded',record.readyListener);
  record.animation.destroy();
  delete el.dataset.motionState;delete el.dataset.motionFinishing;delete el.dataset.motionFrozen;
 }

 function completePlayback(record, id) {
  if (!isCurrent(record,id) || record.completed) return;
  record.completed = true;
  const options = record.options;
  options.onComplete?.();
  // A completion callback may already have requested a different animation.
  if (isCurrent(record,id) && options.returnTo) play(record.el,options.returnTo,options.returnOptions || {});
 }

 function configure(record) {
  if (records.get(record.el) !== record) return;
  const animation = record.animation;
  const options = record.options;
  const frozen = Boolean(options.freeze) || preference.matches;
  record.frozen = frozen;
  reflect(record);
  if (!record.ready) return;
  animation.loop = !frozen && !record.finishing && options.loop !== false;
  if (frozen) {
   const requestedFrame = options.frame ?? (preference.matches ? stillFrames[record.state] ?? 0 : 0);
   animation.goToAndStop(Math.max(0,Math.min(requestedFrame,animation.totalFrames-1)),true);
   if (preference.matches && !options.freeze && options.loop === false && !record.finishing) {
    const id = record.id;
    clearTimeout(record.timer);
    record.timer = setTimeout(() => completePlayback(record,id),options.hold ?? 1200);
   }
  } else if (!document.hidden && !record.completed) {
   animation.play();
  }
 }

 function play(el, state, options = {}) {
  if (!el) return null;
  state = stateKey(state);
  const data = window.DOTS_ANIMATIONS[state];
  if (!data) { destroy(el); el.textContent = '·'; return null; }
  let record = records.get(el);
  if (record && record.state !== state) { destroy(el); record = null; }
  if (!record) {
   el.textContent = '';
   const animation = lottie.loadAnimation({container:el,renderer:'svg',loop:false,autoplay:false,
    animationData:JSON.parse(JSON.stringify(data)),rendererSettings:{preserveAspectRatio:'xMidYMid meet'}});
   record = {el,state,animation,id:0,options:{},ready:Boolean(animation.isLoaded),completed:false,frozen:false};
   records.set(el,record);
   record.readyListener = () => { record.ready = true; configure(record); };
   animation.addEventListener('DOMLoaded',record.readyListener);
  }
  const restart = Boolean(options.restart) || record.completed;
  cancelPending(record);
  record.options = {...options};
  record.completed = false;
  const id = record.id;
  record.completeListener = () => completePlayback(record,id);
  record.animation.addEventListener('complete',record.completeListener);
  if (restart) record.animation.goToAndStop(0,true);
  configure(record);
  options.onStart?.();
  return record.animation;
 }

 function finishAtBoundary(record, id) {
  if (!isCurrent(record,id)) return;
  const resolve = record.resolveFinish;
  const state = record.nextState;
  const options = record.nextOptions;
  record.resolveFinish = null;
  record.completed = true;
  play(record.el,state,options);
  resolve?.(true);
 }

 function finish(el, next = 'idle', options = {}) {
  if (!el) return Promise.resolve(false);
  const record = records.get(el);
  if (!record || record.frozen || preference.matches || record.completed) {
   return Promise.resolve(Boolean(play(el,next,options)));
  }
  cancelPending(record);
  const id = record.id;
  record.finishing = true;
  record.nextState = next;
  record.nextOptions = {...options};
  // Lottie completes at the end of its CURRENT iteration when loop becomes false.
  // No frame seek, animation recreation, or duration-based timeout is involved.
  record.animation.loop = false;
  record.completeListener = () => finishAtBoundary(record,id);
  record.animation.addEventListener('complete',record.completeListener);
  const completion = new Promise(resolve => { record.resolveFinish = resolve; });
  configure(record);
  return completion;
 }

 function destroyWithin(root) {
  if (!root) return;
  for (const el of records.keys()) if (el === root || root.contains(el)) destroy(el);
 }

 document.addEventListener('visibilitychange',() => {
  for (const record of records.values()) {
   if (document.hidden) record.animation.pause();
   else if (!record.completed) configure(record);
  }
 });
 preference.addEventListener?.('change',() => {
  for (const record of [...records.values()]) {
   if (preference.matches && record.finishing) finishAtBoundary(record,record.id);
   else configure(record);
  }
 });
 window.DotsMotion = {play,finish,destroy,destroyWithin,
  getState:el => {const record=records.get(el);return record?{state:record.state,finishing:record.finishing,frozen:record.frozen,loop:record.animation.loop}:null;}
 };
}());
