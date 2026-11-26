import * as THREE from 'three';

export const craterHolesUniform = {
  value: Array.from({ length: 8 }, () => new THREE.Vector4(0, 0, 0, 0))
};

export function patchCraterDiscardShader(mat, id = 'crater-discard') {
  if (!mat) return mat;
  mat.customProgramCacheKey = () => id;
  const prevCompile = mat.onBeforeCompile;
  mat.onBeforeCompile = (shader) => {
    if (prevCompile) prevCompile(shader);
    shader.uniforms.uCraterHoles = craterHolesUniform;
    shader.vertexShader = 'varying vec3 vCraterWorldPos;\n' + shader.vertexShader;
    shader.vertexShader = shader.vertexShader.replace(
      '#include <begin_vertex>',
      `#include <begin_vertex>
      vec4 craterLocal = vec4(transformed, 1.0);
      #ifdef USE_INSTANCING
      craterLocal = instanceMatrix * craterLocal;
      #endif
      vCraterWorldPos = (modelMatrix * craterLocal).xyz;`
    );
    shader.fragmentShader = 'uniform vec4 uCraterHoles[8];\nvarying vec3 vCraterWorldPos;\n' + shader.fragmentShader;
    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <clipping_planes_fragment>',
      `#include <clipping_planes_fragment>
      for (int i = 0; i < 8; i++) {
        if (uCraterHoles[i].z > 0.01) {
          float dx = vCraterWorldPos.x - uCraterHoles[i].x;
          float dz = vCraterWorldPos.z - uCraterHoles[i].y;
          if (dx * dx + dz * dz < uCraterHoles[i].z) {
            discard;
          }
        }
      }`
    );
  };
  return mat;
}
