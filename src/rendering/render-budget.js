// Bound actual shaded pixels, including on large/4K desktop displays.
// CSS size and camera aspect stay native; only the drawing buffer changes.
export function renderPixelRatio(width,height,dpr,preset,adaptive=1){
 const pixels=preset==='cinematic'?1920*1080:preset==='mobile'?960*540:1280*720;
 const cap=preset==='cinematic'?1.12:preset==='mobile'?.83:.96;
 return Math.min(dpr,cap,Math.sqrt(pixels/Math.max(1,width*height)))*adaptive;
}
