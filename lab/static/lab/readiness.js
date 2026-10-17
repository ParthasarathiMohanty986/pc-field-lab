// Browser-local additions. No audio, images, or checklist data leave this page.
export function installReadiness({feature, features, extra, notify}) {
  const $ = (s, root = document) => root.querySelector(s);
  const help = {
    keyboard: 'Key is the interpreted character; Code is the physical key position. Some shortcuts are reserved by the OS. Use Tab to leave the pad.',
    pointer: 'Coordinates are relative to the pad. Pressure ranges from 0 to 1; a fixed value does not prove that your mouse or screen senses pressure.',
    camera: 'Resolution is the video stream size, not necessarily the maximum camera resolution. Check framing, lighting, and clarity with your eyes.',
    microphone: 'RMS is average signal amplitude. dBFS is relative to digital full scale (0 dBFS), not room loudness. More negative values are quieter. Check the chosen OS input and its volume if speaking produces no change.',
    speaker: 'Confirm you actually hear both channels. A successful playback request cannot prove that the speakers produced sound. Check volume, mute, and your output device.',
    screen: 'CSS pixels describe layout size. Pixel ratio relates CSS pixels to device pixels and can change with zoom or display scaling.',
    system: 'Logical processors are the count reported to the browser. RAM is rounded and may be capped for privacy; neither reading measures current CPU or memory usage.',
    battery: 'Charge is the current percentage. This API does not report battery health, wear, or cycle count.',
    network: 'Online means the browser detects a network connection. It does not verify internet access. Downlink is a browser estimate, not a speed test.',
    graphics: 'Maximum texture size is a graphics limit, not a performance score. WebGPU API presence does not prove a usable adapter exists.',
    performance: 'FPS measures animation callbacks in this page. Background tabs, monitor refresh rate, and other work affect the result; it is not a system benchmark.',
    gamepad: 'Press a controller button if it is not listed. Axis values commonly range from -1 to 1; small resting offsets may occur.',
    share: 'Choose a window or tab and inspect its preview. If selection fails, check browser and OS screen-recording permissions. No recording is made here.',
    files: 'Only metadata from your selected file is displayed. The file is not uploaded and its name is omitted from the JSON report.',
    bluetooth: 'Selection alone does not test a peripheral. Reading its sensors requires specific GATT services and a compatible device.',
    serial: 'Selection does not open the port. Actual communication requires the correct baud rate and device protocol.',
    usb: 'This only selects a device. Protected device classes or OS drivers may prevent browser access.',
    location: 'Accuracy is an estimated radius, not a guarantee. PCs may use network-based positioning. Coordinates are excluded from exported reports.',
    patterns: 'Look for fixed bright/dark pixels on solid colors and uneven steps in the gradient. This is manual inspection, not automatic defect detection. Zoom and scaling can affect grid patterns.',
    playback: 'Listen for intelligible speech, interruptions, and distortion. The browser may apply noise suppression. A recording exists only in this tab until deleted or reset; report exports never include it.',
    aim: 'Results measure your interaction with this page, including pointing and clicking time. They do not measure mouse hardware latency. Use the existing pointer test for raw events.'
  };

  feature('patterns','Display test patterns','system','▦','Inspect colors, gradients, and a grid manually. No automatic pixel diagnosis.',true,async f=>{
    const controls=extra(f,'div',{className:'pattern-controls'});
    const stage=extra(f,'div',{className:'pattern-stage',tabIndex:0}); stage.setAttribute('aria-label','Display pattern preview');
    const patterns={White:'#fff',Black:'#000',Red:'#f00',Green:'#0f0',Blue:'#00f',Gradient:'linear-gradient(90deg,#000,#fff)',Grid:'repeating-linear-gradient(0deg,transparent 0 19px,#222 19px 20px),repeating-linear-gradient(90deg,#fff 0 19px,#222 19px 20px)'};
    let selected='White';
    for(const [name,background] of Object.entries(patterns)) {const button=document.createElement('button');button.textContent=name;button.setAttribute('aria-pressed',String(name===selected));button.onclick=()=>{selected=name;stage.style.background=background;for(const b of controls.querySelectorAll('button'))b.setAttribute('aria-pressed',String(b===button));f.show(`Pattern: ${name}. Inspect visually; no automatic diagnosis.`);};controls.append(button);}
    stage.style.background=patterns.White;
    // Keep an exit control inside the full-screen element for touch and keyboard users.
    const exit=document.createElement('button');exit.textContent='Exit fullscreen (Esc)';exit.className='exit-pattern';exit.onclick=()=>document.exitFullscreen?.();stage.append(exit);
    const full=extra(f,'button',{textContent:'View pattern fullscreen'});full.disabled=!stage.requestFullscreen;
    full.onclick=async()=>{try{await stage.requestFullscreen();exit.focus();}catch{notify('Fullscreen was not available. You can inspect the inline pattern.');}};
    f.cleanup.push(async()=>{if(document.fullscreenElement===stage)await document.exitFullscreen();});f.show('Pattern: White. Choose a color, then optionally enter fullscreen.');
  },'Open patterns');

  feature('playback','Record & listen','media','●','Record up to 10 seconds after permission, then listen locally. Nothing is uploaded.',navigator.mediaDevices?.getUserMedia && window.MediaRecorder,async(f,active)=>{
    const stream=await navigator.mediaDevices.getUserMedia({audio:true});if(!active()){stream.getTracks().forEach(t=>t.stop());return;}
    const chunks=[];let objectURL=null,timer=null,ticker=null,audio=null;
    f.cleanup.push(()=>stream.getTracks().forEach(t=>t.stop()));
    const recorder=new MediaRecorder(stream);
    f.cleanup.push(()=>{clearTimeout(timer);clearInterval(ticker);recorder.ondataavailable=null;recorder.onstop=null;recorder.onerror=null;if(recorder.state!=='inactive')recorder.stop();stream.getTracks().forEach(t=>t.stop());if(audio){audio.pause();audio.removeAttribute('src');audio.load();}if(objectURL)URL.revokeObjectURL(objectURL);chunks.length=0;});
    const finish=extra(f,'button',{textContent:'Finish recording & review'});
    const finishRecording=()=>{if(recorder.state!=='inactive')recorder.stop();finish.disabled=true;clearTimeout(timer);clearInterval(ticker);stream.getTracks().forEach(t=>t.stop());};
    finish.onclick=finishRecording;
    recorder.ondataavailable=e=>{if(active()&&e.data.size)chunks.push(e.data);};
    recorder.onerror=async()=>{if(!active())return;await f.stop();f.show('Recording failed. Check microphone permissions and try again.');f.set('error');};
    recorder.onstop=()=>{clearTimeout(timer);clearInterval(ticker);stream.getTracks().forEach(t=>t.stop());if(!active())return;finish.remove();if(!chunks.length){f.show('No audio was captured. Stop and try again.');return;}objectURL=URL.createObjectURL(new Blob(chunks,{type:recorder.mimeType}));chunks.length=0;audio=extra(f,'audio',{controls:true,src:objectURL});audio.setAttribute('aria-label','Your local microphone recording');const remove=extra(f,'button',{textContent:'Delete recording'});remove.onclick=async()=>{await f.stop(true);notify('Local recording deleted.');};f.show('Recording ready. Microphone released. Press Play to listen; Stop or Reset deletes the audio.');f.set('done');$('.stop',f.card).disabled=false;};
    recorder.start();const start=performance.now();f.show('Recording… 0 / 10 seconds');ticker=setInterval(()=>{if(active())f.show(`Recording… ${Math.min(10,Math.floor((performance.now()-start)/1000))} / 10 seconds`);},250);timer=setTimeout(finishRecording,10000);
  },'Record 10-second sample');

  feature('aim','Mouse accuracy challenge','inputs','⊙','Click 10 targets to measure task accuracy and response time. Not a hardware latency test.',true,async f=>{
    const arena=extra(f,'div',{className:'aim-arena'});arena.setAttribute('aria-label','Mouse accuracy target area');const target=document.createElement('button');target.className='aim-target';target.textContent='1';target.setAttribute('aria-label','Target 1');arena.append(target);let hits=0,misses=0,total=0,start=performance.now();
    const place=()=>{target.style.left=`${10+Math.random()*65}%`;target.style.top=`${10+Math.random()*55}%`;};place();
    f.on(arena,'click',e=>{if(e.target!==target){misses++;f.show({Hits:hits,Misses:misses});return;}total+=performance.now()-start;hits++;if(hits===10){f.show({Targets:hits,Misses:misses,Accuracy:`${Math.round(hits/(hits+misses)*100)}%`,'Mean time per target':`${Math.round(total/hits)} ms`});arena.remove();f.set('done');return;}target.textContent=hits+1;target.setAttribute('aria-label',`Target ${hits+1}`);place();start=performance.now();f.show({Hits:hits,Misses:misses});});f.show('Click each numbered target. Misses are counted inside the pad.');
  },'Start challenge');

  // Put the framing guide directly on the existing webcam preview.
  const camera=features.find(f=>f.id==='camera');const originalCamera=camera.run;
  camera.run=async(f,active)=>{await originalCamera(f,active);if(!active())return;const video=$('video',f.card);if(!video)return;const wrap=document.createElement('div');wrap.className='camera-frame';video.before(wrap);wrap.append(video);const grid=document.createElement('div');grid.className='framing-grid';grid.setAttribute('aria-hidden','true');wrap.append(grid);const toggle=extra(f,'button',{textContent:'Hide framing guide'});toggle.setAttribute('aria-pressed','true');toggle.onclick=()=>{grid.hidden=!grid.hidden;toggle.textContent=grid.hidden?'Show framing guide':'Hide framing guide';toggle.setAttribute('aria-pressed',String(!grid.hidden));};};

  for(const f of features){const details=document.createElement('details');details.className='reading-help';const summary=document.createElement('summary');summary.textContent='Explain this test';const p=document.createElement('p');p.textContent=help[f.id]||'Support depends on your browser, operating system, and hardware.';details.append(summary,p);$('.actions',f.card).before(details);}

  const section=document.createElement('section');section.className='readiness';section.id='readiness';section.innerHTML=`<div class="section-heading"><div><p class="eyebrow">FROM READINGS TO READINESS</p><h2>Check your setup for a real task.</h2></div><button id="summary-download">↓ Save checklist summary</button></div><p class="check-intro">Run a test, then record what you observed. A working API alone is not a pass. Checklists stay in this tab and never start sensors automatically.</p><div class="check-tools"><label>Choose a checklist <select id="check-preset"><option value="meeting">Before a meeting</option><option value="laptop">New laptop</option><option value="peripherals">External peripherals</option><option value="custom">Custom checklist</option></select></label><button id="check-clear">Clear checklist results</button></div><div id="custom-tests" hidden></div><p id="check-progress" role="status"></p><div id="check-steps"></div>`;$('#explore').before(section);
  const presets={meeting:['camera','playback','speaker','share'],laptop:['keyboard','pointer','patterns','camera','playback','speaker','battery'],peripherals:['gamepad','bluetooth','serial','usb']};
  const instructions={camera:'Check that you can see yourself clearly and that framing works.',playback:'Record your voice, play it back, and confirm that speech is intelligible.',speaker:'Confirm you hear both left and right tones.',share:'Choose a window and confirm its preview is the one you intended.',patterns:'Inspect solid colors, gradients, and the grid for visible issues.',keyboard:'Try the keys you need and confirm they appear correctly.',pointer:'Move and click in the pad; check the readings.',battery:'Check charge and charging status. This cannot assess battery health.',gamepad:'Press buttons and move sticks; compare the displayed readings.',bluetooth:'Confirm your peripheral appears in the chooser. This is selection only.',serial:'Confirm the intended port is selectable. Communication is not tested.',usb:'Confirm the intended USB device is selectable. Functionality is not tested.'};
  let preset='meeting';const selections=new Set(['keyboard','patterns']);const observations=new Map();
  function selected(){return preset==='custom'?features.filter(f=>selections.has(f.id)).map(f=>f.id):presets[preset];}
  function snapshot(){return {checklist:$('#check-preset').selectedOptions[0].textContent,steps:selected().map(id=>({id,title:features.find(f=>f.id===id).title,observation:observations.get(`${preset}:${id}`)||'not-tested'}))};}
  function progress(){const steps=snapshot().steps;const count=value=>steps.filter(s=>s.observation===value).length;$('#check-progress').textContent=`${count('confirmed')} confirmed · ${count('issue')} need attention · ${count('skipped')} skipped · ${count('not-tested')} not tested. User observations, not an automatic certification.`;}
  function render(){const container=$('#check-steps');container.replaceChildren();$('#custom-tests').hidden=preset!=='custom';for(const id of selected()){const f=features.find(x=>x.id===id);const row=document.createElement('div');row.className='check-row';const copy=document.createElement('div');const strong=document.createElement('strong');strong.textContent=f.title;const p=document.createElement('p');p.textContent=(instructions[id]||'Run this test and review the readings.')+(!f.supported?' This API is unavailable in this browser.':'');copy.append(strong,p);const open=document.createElement('button');open.textContent='Open test ↗';open.onclick=()=>{$('#search').value='';$('#filters button[data-filter="all"]').click();f.card.scrollIntoView({behavior:'smooth',block:'center'});$('.start',f.card).focus({preventScroll:true});};const choice=document.createElement('select');choice.setAttribute('aria-label',`${f.title} observation`);for(const [value,label] of [['not-tested','Not tested'],['confirmed','Confirmed by me'],['issue','Needs attention'],['skipped','Skipped']]){const option=document.createElement('option');option.value=value;option.textContent=label;choice.append(option);}choice.value=observations.get(`${preset}:${id}`)||'not-tested';choice.onchange=()=>{observations.set(`${preset}:${id}`,choice.value);progress();};row.append(copy,open,choice);container.append(row);}if(!selected().length)container.textContent='Select at least one test for your custom checklist.';progress();}
  for(const f of features){const label=document.createElement('label');const input=document.createElement('input');input.type='checkbox';input.checked=selections.has(f.id);input.onchange=()=>{input.checked?selections.add(f.id):selections.delete(f.id);render();};label.append(input,document.createTextNode(f.title));$('#custom-tests').append(label);}
  $('#check-preset').onchange=e=>{preset=e.target.value;render();};$('#check-clear').onclick=()=>{for(const id of selected())observations.delete(`${preset}:${id}`);render();};
  $('#summary-download').onclick=()=>{const report=snapshot();const text=['PC Field Lab — Readiness checklist',new Date().toISOString(),report.checklist,'',...report.steps.map(s=>`${s.title}: ${s.observation}`),'','These are user observations, not an automatic hardware diagnosis.','No recordings, coordinates, filenames, or device identifiers are included.'].join('\n');const url=URL.createObjectURL(new Blob([text],{type:'text/plain;charset=utf-8'}));const a=document.createElement('a');a.href=url;a.download='pc-readiness-summary.txt';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);notify('Summary saved locally. Review it before sharing.');};render();
  return {snapshot,reset:()=>{observations.clear();render();}};
}
