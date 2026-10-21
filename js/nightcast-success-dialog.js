(function(){
  "use strict";
  let activeResolve = null;
  let previousFocus = null;
  function ensure(){
    let root=document.getElementById("ncSuccessDialog");
    if(root)return root;
    root=document.createElement("div");
    root.id="ncSuccessDialog";
    root.className="nc-success-dialog";
    root.hidden=true;
    root.innerHTML='<section class="nc-success-dialog__panel" role="dialog" aria-modal="true" aria-labelledby="ncSuccessDialogTitle" aria-describedby="ncSuccessDialogMessage"><div class="nc-success-dialog__icon" aria-hidden="true"><span>✓</span></div><h2 class="nc-success-dialog__title" id="ncSuccessDialogTitle">با موفقیت انجام شد</h2><p class="nc-success-dialog__message" id="ncSuccessDialogMessage"></p><button class="nc-success-dialog__close" type="button">متوجه شدم</button></section>';
    document.body.appendChild(root);
    root.querySelector("button").addEventListener("click",close);
    root.addEventListener("click",function(event){if(event.target===root)close();});
    document.addEventListener("keydown",function(event){if(event.key==="Escape"&&root.classList.contains("is-open")){event.preventDefault();close();}});
    return root;
  }
  function close(){
    const root=document.getElementById("ncSuccessDialog");
    if(!root||!root.classList.contains("is-open"))return;
    root.classList.remove("is-open");
    root.setAttribute("aria-hidden","true");
    document.body.classList.remove("nc-success-dialog-open");
    window.setTimeout(function(){root.hidden=true;if(previousFocus&&previousFocus.focus)previousFocus.focus({preventScroll:true});previousFocus=null;},210);
    const resolve=activeResolve;activeResolve=null;if(resolve)resolve();
  }
  function show(options){
    options=options||{};
    const root=ensure();
    const title=root.querySelector("#ncSuccessDialogTitle");
    const message=root.querySelector("#ncSuccessDialogMessage");
    title.textContent=options.title||"با موفقیت انجام شد";
    message.textContent=options.message||"درخواست شما با موفقیت ثبت شد.";
    previousFocus=document.activeElement;
    root.hidden=false;root.setAttribute("aria-hidden","false");
    document.body.classList.add("nc-success-dialog-open");
    requestAnimationFrame(function(){root.classList.add("is-open");root.querySelector("button").focus({preventScroll:true});});
    return new Promise(function(resolve){activeResolve=resolve;});
  }
  window.NightCastSuccessDialog={show:show,close:close};
})();