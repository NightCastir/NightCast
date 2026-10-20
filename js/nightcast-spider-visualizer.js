/* NightCast compact spider-web audio spectrum.
   Uses real analyser data when available and a subtle playback pulse as fallback. */
(() => {
  'use strict';
  const init = () => {
    const canvas = document.getElementById('ncAudioVisualizer');
    const audio = document.getElementById('audioPlayer');
    const player = document.querySelector('.player');
    if (!canvas || !audio || !player || canvas.dataset.ncSpiderReady) return;
    canvas.dataset.ncSpiderReady = '1';
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const status = document.getElementById('ncVisualizerStatus');
    let analyser = null, bins = null, raf = 0, audioCtx = null, source = null;
    let active = false, phase = 0;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    function connectAnalyser() {
      if (analyser || !window.AudioContext && !window.webkitAudioContext) return;
      try {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        audioCtx = new AudioContext();
        analyser = audioCtx.createAnalyser();
        analyser.fftSize = 128;
        analyser.smoothingTimeConstant = 0.82;
        bins = new Uint8Array(analyser.frequencyBinCount);
        source = audioCtx.createMediaElementSource(audio);
        source.connect(analyser);
        analyser.connect(audioCtx.destination);
      } catch (_) { analyser = null; bins = null; }
    }
    function sizeCanvas() {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = Math.max(1, Math.round(rect.width * dpr));
      const h = Math.max(1, Math.round(rect.height * dpr));
      if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      return { w: rect.width, h: rect.height };
    }
    function draw() {
      raf = 0;
      if (!canvas.isConnected) return;
      const {w,h} = sizeCanvas();
      ctx.clearRect(0,0,w,h);
      const cx=w/2, cy=h/2, radius=Math.max(5,Math.min(h*0.39,w*0.23));
      phase += active && !reduced ? 0.045 : 0.008;
      if (analyser && active) { try { analyser.getByteFrequencyData(bins); } catch (_) {} }
      const count=24, values=[];
      for(let i=0;i<count;i++){
        let v=0.12 + Math.sin(phase*1.7+i*0.72)*0.035;
        if(active && bins && bins.length) v += (bins[Math.floor(i/count*bins.length)]/255)*0.62;
        else if(active) v += (0.5+0.5*Math.sin(phase*2.4+i*1.31))*0.18;
        values.push(Math.max(0.12,Math.min(0.9,v)));
      }
      // Fine spider-web spokes and concentric rings.
      ctx.lineWidth=.65;
      for(let ring=1;ring<=4;ring++){
        ctx.beginPath();
        const rr=radius*ring/4;
        for(let i=0;i<=count;i++){
          const a=(i/count)*Math.PI*2-Math.PI/2;
          const x=cx+Math.cos(a)*rr, y=cy+Math.sin(a)*rr;
          if(i===0)ctx.moveTo(x,y);else ctx.lineTo(x,y);
        }
        ctx.strokeStyle=ring===4?'rgba(128,207,255,.48)':'rgba(133,173,255,.17)';
        ctx.stroke();
      }
      for(let i=0;i<count;i++){
        const a=(i/count)*Math.PI*2-Math.PI/2;
        ctx.beginPath();ctx.moveTo(cx,cy);
        ctx.lineTo(cx+Math.cos(a)*radius,cy+Math.sin(a)*radius);
        ctx.strokeStyle='rgba(141,191,255,.20)';ctx.stroke();
      }
      // Audio-reactive web polygon, with a soft cyan/violet glow.
      ctx.beginPath();
      values.forEach((v,i)=>{
        const a=(i/count)*Math.PI*2-Math.PI/2;
        const rr=radius*(.42+v*.72);
        const x=cx+Math.cos(a)*rr, y=cy+Math.sin(a)*rr;
        if(i===0)ctx.moveTo(x,y);else ctx.lineTo(x,y);
      });
      ctx.closePath();
      const grad=ctx.createLinearGradient(cx-radius,cy-radius,cx+radius,cy+radius);
      grad.addColorStop(0,'rgba(102,231,255,.13)');grad.addColorStop(1,'rgba(166,132,255,.17)');
      ctx.fillStyle=grad;ctx.fill();
      ctx.strokeStyle=active?'rgba(127,232,255,.95)':'rgba(158,177,224,.55)';
      ctx.lineWidth=1.35;ctx.shadowColor=active?'rgba(90,204,255,.55)':'transparent';ctx.shadowBlur=active?8:0;ctx.stroke();ctx.shadowBlur=0;
      ctx.beginPath();ctx.arc(cx,cy,2.1,0,Math.PI*2);ctx.fillStyle=active?'#b8f5ff':'#aab8dc';ctx.fill();
      if(status) status.textContent=active?'نمایش زنده فرکانس صدا':'نمایشگر طیف صوت';
      if(!reduced) raf=window.requestAnimationFrame(draw);
    }
    function start() {
      active=true; connectAnalyser();
      if(audioCtx && audioCtx.state==='suspended') audioCtx.resume().catch(()=>{});
      if(!raf) draw();
    }
    function stop() { active=false; if(!raf) draw(); }
    audio.addEventListener('play',start);
    audio.addEventListener('playing',start);
    audio.addEventListener('pause',stop);
    audio.addEventListener('ended',stop);
    document.addEventListener('visibilitychange',()=>{if(document.hidden){if(raf){cancelAnimationFrame(raf);raf=0;}}else if(!raf)draw();});
    window.addEventListener('resize',()=>{if(!raf)draw();});
    draw();
  };
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',init,{once:true}); else init();
  // The app can render the player asynchronously; retry briefly until its markup exists.
  let attempts=0; const retry=setInterval(()=>{if(document.getElementById('ncAudioVisualizer')){clearInterval(retry);init();}else if(++attempts>30)clearInterval(retry);},250);
})();