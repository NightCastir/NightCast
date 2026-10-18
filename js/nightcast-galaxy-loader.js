/* Shared transparent galaxy loading veil. It only runs on navigation, never during scroll. */
(()=>{"use strict";
if(document.getElementById("ncGalaxyLoader"))return;
const loader=document.createElement("div");
loader.id="ncGalaxyLoader";loader.setAttribute("role","status");loader.setAttribute("aria-label","در حال آماده‌سازی NightCast");loader.setAttribute("aria-live","polite");
loader.innerHTML='<div class="nc-galaxy-stars" aria-hidden="true"></div><div class="nc-galaxy-orbit" aria-hidden="true"><span class="nc-galaxy-core"></span></div><div class="nc-galaxy-label">NIGHTCAST · آماده‌سازی فضا</div>';
document.documentElement.appendChild(loader);
let dismissed=false;
function dismiss(){if(dismissed)return;dismissed=true;loader.classList.add("nc-galaxy-leaving");window.setTimeout(()=>loader.remove(),480)}
const start=performance.now();
function finish(){window.setTimeout(dismiss,Math.max(180,520-(performance.now()-start)))}
if(document.readyState==="complete")finish();else window.addEventListener("load",finish,{once:true});
window.setTimeout(dismiss,4500);
window.addEventListener("pageshow",dismiss,{once:true});
document.addEventListener("click",event=>{const a=event.target.closest&&event.target.closest("a[href]");if(!a||event.defaultPrevented||event.button!==0||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey||a.target==="_blank"||a.hasAttribute("download"))return;const href=a.getAttribute("href");if(!href||href[0]==="#"||/^javascript:|^mailto:|^tel:/i.test(href))return;let url;try{url=new URL(href,location.href)}catch{return}if(url.origin!==location.origin||url.pathname===location.pathname&&url.search===location.search)return;dismissed=false;if(!loader.isConnected)document.documentElement.appendChild(loader);loader.classList.remove("nc-galaxy-leaving");loader.style.display="grid";window.setTimeout(()=>{if(!dismissed){loader.classList.add("nc-galaxy-leaving");window.setTimeout(()=>{loader.style.display="none";},480)}},3500)},true);
})();