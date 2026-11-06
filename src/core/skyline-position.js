// Position a far backdrop on the camera's projected center ray.
// Orthographic perspective still has an angled view direction: placing a
// skyline at world X=0 while moving it far back in Z shifts it dramatically
// across the screen. This pure calculation keeps the city in the camera view.
export function skylineCameraRayX({cameraX=25,cameraZ=81,targetX=0,targetZ=-12,skylineZ=-172,visualCenterX=0}={}){
  if(!Number.isFinite(cameraZ-targetZ)||Math.abs(cameraZ-targetZ)<.00001)
    throw new RangeError('Camera and target Z must differ');
  return targetX+(cameraX-targetX)*(skylineZ-targetZ)/(cameraZ-targetZ)-visualCenterX;
}
// Stable, subtle horizontal parallax: skyline translates slightly less than
// the main street when the player travels. No smoothing/trailing interpolation.
export function skylineParallaxX(anchor,scroll,ratio=.90){
  return anchor+scroll*ratio;
}
