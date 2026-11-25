// Reversible presentation-only HUD layout. No gameplay/render/health changes.
const qs=new URLSearchParams(location.search);
const button=document.getElementById('cinema-hud-toggle');
function setEnabled(on){
 const enabled=Boolean(on);
 document.body.classList.toggle('cinematic-hud',enabled);
 button?.setAttribute('aria-pressed',String(enabled));
 if(button)button.textContent=enabled?'◱ Full HUD (H)':'🎬 Cinematic HUD (H)';
 return enabled;
}
const defaultMode=qs.get('hud')==='cinematic'||(qs.get('hud')!=='full'&&qs.get('qa')!=='1');
setEnabled(defaultMode);
button?.addEventListener('click',()=>setEnabled(!document.body.classList.contains('cinematic-hud')));
document.addEventListener('keydown',event=>{
 if(event.code!=='KeyH'||event.repeat||event.altKey||event.ctrlKey||event.metaKey)return;
 const target=event.target;
 if(target?.isContentEditable||['INPUT','SELECT','TEXTAREA'].includes(target?.tagName))return;
 event.preventDefault();setEnabled(!document.body.classList.contains('cinematic-hud'));
});
window.__DD_CINEMA_HUD={setEnabled,snapshot:()=>({
 enabled:document.body.classList.contains('cinematic-hud'),
 toggleVisible:button?getComputedStyle(button).display!=='none':false,
 version:document.getElementById('game-build')?.textContent||''
})};
