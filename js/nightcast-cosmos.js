/* NightCast — lightweight, responsive starfield and cinematic transitions. */
(()=>{"use strict";
/* Font Awesome CDN fallback: the primary cdnjs URL may be blocked on some networks. */
function ensureFontAwesomeCdn(){
  const icon=document.querySelector(".fa-solid,.fa-regular,.fa-brands");
  if(!icon||!document.head)return;
  const pseudo=getComputedStyle(icon,"::before");
  const family=pseudo.fontFamily||"";
  const glyph=pseudo.content||"";
  if(/Font Awesome/i.test(family)&&glyph&&glyph!=="none"&&glyph!=='""')return;
  if(document.querySelector('link[href*="fontawesome-free@6.7.2"]'))return;
  const fallback=document.createElement("link");
  fallback.rel="stylesheet";
  fallback.href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.7.2/css/all.min.css";
  fallback.crossOrigin="anonymous";
  fallback.dataset.ncFaFallback="true";
  document.head.appendChild(fallback);
}
window.addEventListener("load",()=>setTimeout(ensureFontAwesomeCdn,180));
setTimeout(ensureFontAwesomeCdn,1800);
const reduced=window.matchMedia&&window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const wantsCosmos=()=>{const archive=document.querySelector("#podcasts");if(!archive)return true;try{return (archive.dataset.viewMode||localStorage.getItem("nightcast-podcast-view-mode"))==="galaxy"}catch(_){return archive.dataset.viewMode==="galaxy"}};
const canvas=document.createElement("canvas");canvas.className="nc-cosmos-canvas";canvas.setAttribute("aria-hidden","true");
const mount=()=>{if(!wantsCosmos()||!document.body||document.querySelector(".nc-cosmos-canvas"))return;document.body.prepend(canvas);};
const ctx=canvas.getContext("2d",{alpha:true});let w=0,h=0,dpr=1,stars=[],raf=0,px=0,py=0;
function resize(){if(!ctx)return;dpr=Math.min(window.devicePixelRatio||1,1.7);w=window.innerWidth;h=window.innerHeight;canvas.width=Math.round(w*dpr);canvas.height=Math.round(h*dpr);canvas.style.width=w+"px";canvas.style.height=h+"px";ctx.setTransform(dpr,0,0,dpr,0,0);const count=Math.min(220,Math.max(65,Math.round(w*h/6500)));stars=Array.from({length:count},()=>({x:Math.random()*w,y:Math.random()*h,z:.25+Math.random()*.75,r:.35+Math.random()*1.2,a:.2+Math.random()*.68,p:Math.random()*6.28,s:.05+Math.random()*.22}));}
function draw(t){if(!ctx||!canvas.isConnected)return;ctx.clearRect(0,0,w,h);for(const s of stars){const twinkle=reduced?1:.68+Math.sin(t*.0006*s.s*10+s.p)*.3;s.y+=reduced?0:s.s*s.z*.25;if(s.y>h+2)s.y=-2;const x=s.x+px*s.z*10;ctx.beginPath();ctx.arc(x,s.y,s.r*s.z,0,Math.PI*2);ctx.fillStyle="rgba(190,225,255,"+(s.a*twinkle)+")";ctx.fill();if(s.r>1.15&&s.z>.72){ctx.strokeStyle="rgba(150,205,255,"+(s.a*.25*twinkle)+")";ctx.lineWidth=.5;ctx.beginPath();ctx.moveTo(x-3,s.y);ctx.lineTo(x+3,s.y);ctx.moveTo(x,s.y-3);ctx.lineTo(x,s.y+3);ctx.stroke();}}if(!reduced)raf=requestAnimationFrame(draw);}
function start(){if(!wantsCosmos()){cancelAnimationFrame(raf);canvas.remove();stars=[];return;}mount();resize();if(!reduced)raf=requestAnimationFrame(draw);else draw(0);}
window.addEventListener("nightcast:viewchange",()=>{if(wantsCosmos())start();else{cancelAnimationFrame(raf);canvas.remove();stars=[];} });
window.addEventListener("resize",()=>{cancelAnimationFrame(raf);start()},{passive:true});
if(!reduced&&window.matchMedia("(pointer:fine)").matches)window.addEventListener("pointermove",e=>{px=(e.clientX/w-.5)*.7;py=(e.clientY/h-.5)*.7;},{passive:true});
if(document.readyState==="complete"||document.readyState==="interactive")start();else window.addEventListener("DOMContentLoaded",start,{once:true});
if("IntersectionObserver"in window){const observer=new IntersectionObserver(entries=>entries.forEach(e=>{if(e.isIntersecting){e.target.classList.add("nc-revealed");observer.unobserve(e.target);}}),{threshold:.12,rootMargin:"0px 0px -35px 0px"});const observe=()=>document.querySelectorAll("#about .nc-reveal,#contact .nc-reveal,#podcasts .section-head,#podcasts .stat").forEach(el=>{el.classList.add("nc-reveal");observer.observe(el);});if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",observe,{once:true});else observe();}

/* Immersive navigation and scroll cues; does not replace existing page handlers. */
function enhanceNavigation(){
 const hero=document.querySelector("main#home .hero");
 if(hero&&!hero.querySelector(".nc-scroll-cue")){
  const cue=document.createElement("a");cue.className="nc-scroll-cue";cue.href="#podcasts";cue.innerHTML='<span>کشف جهان NightCast</span><i class="fa-solid fa-arrow-down" aria-hidden="true"></i>';cue.setAttribute("aria-label","رفتن به بخش پادکست‌ها");hero.appendChild(cue);
 }
 const sections=[...document.querySelectorAll("main section[id],main#home")].filter(s=>s.id);
 const links=[...document.querySelectorAll(".nc-nav .nav-link,.nc-drawer-links a")];
 if("IntersectionObserver"in window&&sections.length){
  const navObserver=new IntersectionObserver(entries=>{
   entries.forEach(entry=>{if(!entry.isIntersecting)return;const id=entry.target.id;
    document.querySelectorAll(".nc-nav .nav-link").forEach(a=>{const route=id==="podcasts"?"/":"/"+id;const active=a.getAttribute("href")===route;a.classList.toggle("active",active);if(active)a.setAttribute("aria-current","location");else a.removeAttribute("aria-current")});
   });
  },{rootMargin:"-25% 0px -60% 0px",threshold:0});
  sections.forEach(s=>navObserver.observe(s));
 }
 links.forEach(a=>a.addEventListener("click",()=>{const drawer=document.querySelector("#ncMobileDrawer");if(drawer&&a.closest(".nc-drawer-links")){drawer.classList.remove("open","is-open");drawer.setAttribute("aria-hidden","true");drawer.inert=true;document.body.classList.remove("nc-drawer-open");const backdrop=document.querySelector("#ncDrawerBackdrop");if(backdrop){backdrop.hidden=true}const toggle=document.querySelector("#ncMenuToggle");if(toggle)toggle.setAttribute("aria-expanded","false")}}));
}
function isGalaxyView(){const section=document.querySelector("#podcasts");return !!section&&section.dataset.viewMode==="galaxy";}
function revealPodcastCards(){
 const grid=document.querySelector("#podcastGrid,.podcast-grid");
 if(!grid||!isGalaxyView())return;
 const cards=grid.children;
 [...cards].forEach((card,index)=>{if(card.dataset.ncCosmosEnhanced)return;card.dataset.ncCosmosEnhanced="1";card.style.setProperty("--nc-card-index",index%8);card.setAttribute("data-cosmic-card","");/* Keep catalogue cards continuously visible: scroll-triggered reveal animations caused cards to fade in again after list updates. */card.classList.remove("nc-reveal","nc-revealed","is-visible");card.style.removeProperty("transition-delay");});
}
function watchPodcastUpdates(){
 const grid=document.querySelector("#podcastGrid,.podcast-grid");
 if(!grid||!isGalaxyView())return;
 revealPodcastCards();
 if(grid.dataset.ncRevealObserver)return;
 grid.dataset.ncRevealObserver="1";
 new MutationObserver(()=>requestAnimationFrame(revealPodcastCards)).observe(grid,{childList:true});
}

document.addEventListener("click",e=>{const a=e.target.closest('a[href^="#"]');if(!a)return;const id=a.getAttribute("href");if(!id||id==="#")return;const target=document.querySelector(id);if(target){target.classList.add("nc-navigation-arrival");setTimeout(()=>target.classList.remove("nc-navigation-arrival"),850);}});
function bindConstellationUpdates(){
 const grid=document.querySelector("#podcastGrid");
 if(!grid||grid.dataset.ncConstellationObserver)return;
 grid.dataset.ncConstellationObserver="1";
 new MutationObserver(()=>requestAnimationFrame(()=>{if(!isGalaxyView())return;ensureConstellation();enableCosmicCardMotion();})).observe(grid,{childList:true});
}
function initCosmosExperience(){
 enhanceNavigation();
 if(isGalaxyView()){watchPodcastUpdates();bindConstellationUpdates();ensureConstellation();enableCosmicCardMotion();}
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",initCosmosExperience,{once:true});else initCosmosExperience();
window.addEventListener("nightcast:viewchange",()=>{
 if(isGalaxyView()){watchPodcastUpdates();bindConstellationUpdates();ensureConstellation();enableCosmicCardMotion();}
 else{document.getElementById("ncConstellation")?.remove();}
});

/* Interactive constellation navigator: each orb opens the site's existing podcast detail dialog. */
function ensureConstellation(){
 const grid=document.querySelector("#podcastGrid");
 if(!grid)return;
 if(!isGalaxyView()){document.getElementById("ncConstellation")?.remove();return;}
 let panel=document.getElementById("ncConstellation");
 if(!panel){
  panel=document.createElement("section");panel.id="ncConstellation";panel.className="nc-constellation";panel.setAttribute("aria-labelledby","ncConstellationTitle");
  panel.innerHTML='<div class="nc-constellation-heading"><div><span class="nc-constellation-kicker"><i class="fa-solid fa-orbit" aria-hidden="true"></i> COSMIC DISCOVERY</span><h3 id="ncConstellationTitle">نقشه‌ی <span>جهان شنیداری</span></h3><p>یک سیاره را انتخاب کن و روایت آن را کشف کن.</p></div><span class="nc-constellation-count" aria-live="polite"></span></div><div class="nc-constellation-stage"><div class="nc-constellation-orbit nc-orbit-one"></div><div class="nc-constellation-orbit nc-orbit-two"></div><div class="nc-constellation-orbit nc-orbit-three"></div><div class="nc-constellation-sun" aria-hidden="true"><i class="fa-solid fa-satellite-dish"></i><span>NIGHTCAST</span></div><div class="nc-planet-list"></div></div><p class="nc-constellation-hint"><i class="fa-solid fa-hand-pointer" aria-hidden="true"></i> برای دیدن جزئیات، یکی از سیاره‌ها را لمس کن</p>';
  grid.parentNode.insertBefore(panel,grid);
 }
 const list=panel.querySelector(".nc-planet-list");
 const cards=[...grid.querySelectorAll(".podcast-card")];
 const count=panel.querySelector(".nc-constellation-count");
 if(count)count.textContent=cards.length.toLocaleString("fa-IR")+" سیاره در این صفحه";
 if(!list)return;
 const existing=new Map([...list.querySelectorAll("[data-planet-id]")].map(el=>[el.dataset.planetId,el]));
 const liveIds=new Set(cards.map(c=>String(c.dataset.id)));
 for(const [id,el] of existing){if(!liveIds.has(id))el.remove()}
 cards.forEach((card,index)=>{
  const id=String(card.dataset.id||"");if(!id)return;
  let button=existing.get(id);
  if(!button){
   button=document.createElement("button");button.type="button";button.className="nc-planet";button.dataset.planetId=id;
   const title=card.querySelector(".podcast-title")?.textContent?.trim()||"پادکست NightCast";
   const cover=card.querySelector(".podcast-cover img")?.getAttribute("src")||"";
   button.innerHTML='<span class="nc-planet-body"><span class="nc-planet-glow"></span><span class="nc-planet-ring"></span></span><span class="nc-planet-name"></span><span class="nc-planet-caption">مشاهده روایت <i class="fa-solid fa-arrow-up-left-from-circle" aria-hidden="true"></i></span>';
   button.querySelector(".nc-planet-name").textContent=title;
   if(cover){button.querySelector(".nc-planet-body").style.setProperty("--nc-planet-cover",'url("'+cover.replace(/["\\]/g,"")+'")');button.querySelector(".nc-planet-body").classList.add("has-cover")}
   button.style.setProperty("--nc-planet-index",String(index%9));
   button.addEventListener("click",()=>{
    // Cards are replaced when search, pagination, or the live API refresh re-renders.
    // Resolve the current card at click time instead of keeping a stale DOM reference.
    const currentCard=[...grid.querySelectorAll(".podcast-card")].find(item=>String(item.dataset.id)===id);
    if(!currentCard)return;
    const detail=currentCard.querySelector('[data-action="details"]');
    if(detail){detail.click();return}
    const play=currentCard.querySelector('[data-action="play"]');if(play)play.click();
   });
   list.appendChild(button);
  }
  const currentTitle=card.querySelector(".podcast-title")?.textContent?.trim()||"پادکست NightCast";
  const titleNode=button.querySelector(".nc-planet-name");
  if(titleNode&&titleNode.textContent!==currentTitle)titleNode.textContent=currentTitle;
  button.setAttribute("aria-label","باز کردن پادکست: "+currentTitle);
  button.title=currentTitle;
  const currentCover=card.querySelector(".podcast-cover img")?.getAttribute("src")||"";
  const planetBody=button.querySelector(".nc-planet-body");
  if(planetBody){
   if(currentCover){
    const safeCover=currentCover.replace(/["\\\\]/g,"");
    planetBody.style.setProperty("--nc-planet-cover",'url("'+safeCover+'")');
    planetBody.classList.add("has-cover");
   }else{
    planetBody.style.removeProperty("--nc-planet-cover");
    planetBody.classList.remove("has-cover");
   }
  }
  button.style.setProperty("--nc-planet-index",String(index%9));
 });
}
function enableCosmicCardMotion(){
 if(reduced||!window.matchMedia("(pointer:fine)").matches)return;
 document.querySelectorAll(".podcast-card,.nc-featured-podcast").forEach(card=>{
  if(card.dataset.ncTiltBound)return;card.dataset.ncTiltBound="1";
  card.addEventListener("pointermove",event=>{
   if(event.pointerType!=="mouse")return;
   const rect=card.getBoundingClientRect();const x=(event.clientX-rect.left)/rect.width;const y=(event.clientY-rect.top)/rect.height;
   card.style.setProperty("--nc-pointer-x",(x*100).toFixed(1)+"%");card.style.setProperty("--nc-pointer-y",(y*100).toFixed(1)+"%");
  },{passive:true});
  card.addEventListener("pointerleave",()=>{card.style.removeProperty("--nc-pointer-x");card.style.removeProperty("--nc-pointer-y")},{passive:true});
 });
}


/* Global responsive safeguards: prevent common cards, controls and overlays escaping the viewport. */
function installResponsiveSafeguards(){
 if(document.getElementById("nc-responsive-safeguards"))return;
 const style=document.createElement("style");
 style.id="nc-responsive-safeguards";
 style.textContent=`
 html,body{max-width:100%;overflow-x:clip}
 *,*::before,*::after{box-sizing:border-box}
 img,video,iframe,canvas,svg{max-width:100%}
 input,textarea,select,button{max-width:100%;font:inherit}
 main,section,article,aside,header,footer,nav,form,div,a,button,p,h1,h2,h3,h4,span{min-width:0}
 p,h1,h2,h3,h4,a,button,label,li{overflow-wrap:anywhere}
 .podcast-grid,.podcast-list{grid-template-columns:repeat(auto-fit,minmax(min(100%,280px),1fr))}
 .podcast-card,.podcast-info,.podcast-cover{min-width:0;max-width:100%}
 .nc-detail-dialog,.nc-comments-card,.social-menu{max-width:calc(100vw - 20px)}
 .icon-btn,.nc-comments-close,.nc-detail-close{flex-shrink:0}
 @media(max-width:900px){.nc-nav{gap:10px;padding-inline:12px}.nav-link{padding-inline:8px}.hero{grid-template-columns:minmax(0,1fr);gap:22px}main{padding-inline:14px}}
 @media(max-width:650px){.nc-header{height:auto;min-height:var(--nc-header)}.nc-nav{height:auto;min-height:var(--nc-header);flex-wrap:wrap;padding-block:9px}.nav-links{order:3;width:100%;max-width:100%;margin:0;overflow-x:auto;overscroll-behavior-inline:contain;padding-bottom:2px}.nav-link{flex:0 0 auto;white-space:nowrap}.header-actions{margin-inline-start:auto}.hero{padding-top:28px}.hero h1{font-size:clamp(1.8rem,8vw,2.7rem);letter-spacing:normal}.hero-actions>*{flex:1 1 auto}.podcast-grid,.podcast-list{grid-template-columns:minmax(0,1fr)}.podcast-card{grid-template-columns:minmax(82px,30%) minmax(0,1fr)}.card-footer{flex-wrap:wrap}.nc-detail-dialog{width:100%;max-height:94dvh}.nc-detail-scroll{overflow-wrap:anywhere}}
 @media(max-width:380px){main{padding-inline:10px}.nc-nav{padding-inline:10px}.podcast-card{grid-template-columns:76px minmax(0,1fr)}.hero-actions{flex-direction:column}.hero-actions .btn{width:100%}}
 @media(prefers-reduced-motion:reduce){*,*::before,*::after{scroll-behavior:auto!important;animation-duration:.01ms!important;animation-iteration-count:1!important;transition-duration:.01ms!important}}
 `;
 document.head.appendChild(style);
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",installResponsiveSafeguards,{once:true});
else installResponsiveSafeguards()

})();
