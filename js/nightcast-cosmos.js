/* NightCast — lightweight, responsive starfield and cinematic transitions. */
(()=>{"use strict";
const reduced=window.matchMedia&&window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const canvas=document.createElement("canvas");canvas.className="nc-cosmos-canvas";canvas.setAttribute("aria-hidden","true");
const mount=()=>{if(!document.body||document.querySelector(".nc-cosmos-canvas"))return;document.body.prepend(canvas);};
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",mount,{once:true});else mount();
const ctx=canvas.getContext("2d",{alpha:true});let w=0,h=0,dpr=1,stars=[],raf=0,px=0,py=0;
function resize(){if(!ctx)return;dpr=Math.min(window.devicePixelRatio||1,1.7);w=window.innerWidth;h=window.innerHeight;canvas.width=Math.round(w*dpr);canvas.height=Math.round(h*dpr);canvas.style.width=w+"px";canvas.style.height=h+"px";ctx.setTransform(dpr,0,0,dpr,0,0);const count=Math.min(220,Math.max(65,Math.round(w*h/6500)));stars=Array.from({length:count},()=>({x:Math.random()*w,y:Math.random()*h,z:.25+Math.random()*.75,r:.35+Math.random()*1.2,a:.2+Math.random()*.68,p:Math.random()*6.28,s:.05+Math.random()*.22}));}
function draw(t){if(!ctx||!canvas.isConnected)return;ctx.clearRect(0,0,w,h);for(const s of stars){const twinkle=reduced?1:.68+Math.sin(t*.0006*s.s*10+s.p)*.3;s.y+=reduced?0:s.s*s.z*.25;if(s.y>h+2)s.y=-2;const x=s.x+px*s.z*10;ctx.beginPath();ctx.arc(x,s.y,s.r*s.z,0,Math.PI*2);ctx.fillStyle="rgba(190,225,255,"+(s.a*twinkle)+")";ctx.fill();if(s.r>1.15&&s.z>.72){ctx.strokeStyle="rgba(150,205,255,"+(s.a*.25*twinkle)+")";ctx.lineWidth=.5;ctx.beginPath();ctx.moveTo(x-3,s.y);ctx.lineTo(x+3,s.y);ctx.moveTo(x,s.y-3);ctx.lineTo(x,s.y+3);ctx.stroke();}}if(!reduced)raf=requestAnimationFrame(draw);}
function start(){resize();if(!reduced)raf=requestAnimationFrame(draw);else draw(0);}
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
    document.querySelectorAll(".nc-nav .nav-link").forEach(a=>{const active=a.getAttribute("href")==="#"+id;a.classList.toggle("active",active);if(active)a.setAttribute("aria-current","location");else a.removeAttribute("aria-current")});
   });
  },{rootMargin:"-25% 0px -60% 0px",threshold:0});
  sections.forEach(s=>navObserver.observe(s));
 }
 links.forEach(a=>a.addEventListener("click",()=>{const drawer=document.querySelector("#ncMobileDrawer");if(drawer&&a.closest(".nc-drawer-links")){drawer.classList.remove("open","is-open");drawer.setAttribute("aria-hidden","true");drawer.inert=true;document.body.classList.remove("nc-drawer-open");const backdrop=document.querySelector("#ncDrawerBackdrop");if(backdrop){backdrop.hidden=true}const toggle=document.querySelector("#ncMenuToggle");if(toggle)toggle.setAttribute("aria-expanded","false")}}));
}
function revealPodcastCards(){
 const grid=document.querySelector("#podcastGrid,.podcast-grid");
 if(!grid)return;
 const cards=grid.children;
 [...cards].forEach((card,index)=>{if(card.dataset.ncCosmosEnhanced)return;card.dataset.ncCosmosEnhanced="1";card.style.setProperty("--nc-card-index",index%8);card.setAttribute("data-cosmic-card","");if(!reduced&&"IntersectionObserver"in window){card.classList.add("nc-reveal");card.style.transitionDelay=(index%6)*45+"ms";const obs=new IntersectionObserver(entries=>entries.forEach(e=>{if(e.isIntersecting){e.target.classList.add("nc-revealed");obs.unobserve(e.target)}}),{threshold:.08});obs.observe(card)}});
}
function watchPodcastUpdates(){
 revealPodcastCards();
 const grid=document.querySelector("#podcastGrid,.podcast-grid");
 if(grid)new MutationObserver(()=>requestAnimationFrame(revealPodcastCards)).observe(grid,{childList:true});
}

document.addEventListener("click",e=>{const a=e.target.closest('a[href^="#"]');if(!a)return;const id=a.getAttribute("href");if(!id||id==="#")return;const target=document.querySelector(id);if(target){target.classList.add("nc-navigation-arrival");setTimeout(()=>target.classList.remove("nc-navigation-arrival"),850);}});
function initCosmosExperience(){enhanceNavigation();watchPodcastUpdates();}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",initCosmosExperience,{once:true});else initCosmosExperience();
})();
