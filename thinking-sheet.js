/* Pointer and keyboard resizing is limited to the sheet's drag handle/header. */
(function(){
 'use strict';
 function create({overlay,sheet,handle,header,onClose}){
  let enabled=false,size='medium',drag=null,suppressClick=false;
  handle.setAttribute('role','button');handle.tabIndex=0;
  handle.setAttribute('aria-controls','sheetContent');
  const highRatio=798/852,mediumRatio=639/852;
  function announce(){
   handle.setAttribute('aria-expanded',String(size==='high'));
   handle.setAttribute('aria-label',size==='high'?'收起思考面板':'展开思考面板');
   handle.setAttribute('aria-keyshortcuts','ArrowUp ArrowDown Enter Space Escape');
  }
  function clearDrag(){
   if(drag?.zone.hasPointerCapture?.(drag.pointerId))drag.zone.releasePointerCapture(drag.pointerId);
   drag=null;sheet.classList.remove('is-dragging');sheet.style.removeProperty('height');sheet.style.removeProperty('transform');
  }
  function resize(next){clearDrag();size=next;sheet.dataset.sheetSize=size;announce();}
  function open({thinking=false}={}){
   enabled=thinking;suppressClick=false;clearDrag();sheet.classList.toggle('thinking-sheet',enabled);
   handle.tabIndex=enabled?0:-1;handle.setAttribute('aria-hidden',String(!enabled));
   resize('medium');
  }
  function close(){clearDrag();enabled=false;suppressClick=false;}
  function pointerDown(event){
   if(!enabled||overlay.hidden||event.isPrimary===false||(event.button!==undefined&&event.button!==0))return;
   if(event.target.closest('button,a,input,summary')&&event.target!==handle)return;
   const scale=overlay.getBoundingClientRect().height/overlay.clientHeight||1;
   drag={pointerId:event.pointerId,zone:event.currentTarget,startY:event.clientY,dy:0,scale,initialSize:size,
    startHeight:sheet.getBoundingClientRect().height/scale,maxHeight:overlay.clientHeight*highRatio};
   suppressClick=false;event.currentTarget.setPointerCapture?.(event.pointerId);sheet.classList.add('is-dragging');
  }
  function pointerMove(event){
   if(!drag||event.pointerId!==drag.pointerId)return;
   drag.dy=(event.clientY-drag.startY)/drag.scale;
   if(Math.abs(drag.dy)>4)event.preventDefault();
   if(drag.dy<0){sheet.style.height=Math.min(drag.maxHeight,drag.startHeight-drag.dy)+'px';sheet.style.transform='translateY(0)';}
   else{sheet.style.height=drag.startHeight+'px';sheet.style.transform=`translateY(${drag.dy}px)`;}
  }
  function pointerUp(event){
   if(!drag||event.pointerId!==drag.pointerId)return;
   const {dy,initialSize}=drag;suppressClick=Math.abs(dy)>4;clearDrag();
   if(dy>=96)onClose();else resize(dy<=-40?'high':initialSize);
  }
  for(const zone of [handle,header]){
   zone.addEventListener('pointerdown',pointerDown);zone.addEventListener('pointermove',pointerMove);
   zone.addEventListener('pointerup',pointerUp);zone.addEventListener('pointercancel',clearDrag);
  }
  handle.addEventListener('click',event=>{
   if(!enabled)return;if(suppressClick){suppressClick=false;event.preventDefault();return;}
   resize(size==='high'?'medium':'high');
  });
  handle.addEventListener('keydown',event=>{
   if(!enabled)return;
   if(['Enter',' ','ArrowUp','ArrowDown','Home','End','Escape'].includes(event.key)){
    event.preventDefault();event.stopPropagation();
    if(event.key==='Escape')onClose();
    else resize(event.key==='ArrowUp'||event.key==='End'?'high':event.key==='ArrowDown'||event.key==='Home'?'medium':size==='high'?'medium':'high');
   }
  });
  announce();
  return {open,close,expand:()=>resize('high'),collapse:()=>resize('medium'),getSize:()=>size,
   ratios:{medium:mediumRatio,high:highRatio}};
 }
 window.DotsThinkingSheet={create};
}());
