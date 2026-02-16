import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { Pane } from 'tweakpane';
import { INITIAL_SETTINGS, PRESETS } from '../constants';
import { Settings } from '../types';

interface MetaballsSceneProps {
  onUpdateStats: (x: number, y: number, radius: number, merges: number, fps: number) => void;
  onUpdateSettings: (settings: Settings) => void;
}

const MetaballsScene: React.FC<MetaballsSceneProps> = ({ onUpdateStats, onUpdateSettings }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const tpRef = useRef<HTMLDivElement>(null);
  const settingsRef = useRef<Settings>({ ...INITIAL_SETTINGS });
  const statsRef = useRef({ fps: 0 });

  useEffect(() => {
    if (!canvasRef.current || !tpRef.current) return;

    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 10);
    camera.position.z = 1;

    const renderer = new THREE.WebGLRenderer({
      canvas: canvasRef.current,
      antialias: !isMobile,
      alpha: true,
      powerPreference: "high-performance",
    });

    renderer.setPixelRatio(dpr);
    renderer.setSize(window.innerWidth, window.innerHeight);

    const shaderMaterial = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uResolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
        uActualResolution: { value: new THREE.Vector2(window.innerWidth * dpr, window.innerHeight * dpr) },
        uCursorSphere: { value: new THREE.Vector3(0, 0, 0) },
        uCursorRadius: { value: settingsRef.current.cursorRadiusMin },
        uSphereCount: { value: settingsRef.current.sphereCount },
        uFixedTopLeftRadius: { value: settingsRef.current.fixedTopLeftRadius },
        uFixedBottomRightRadius: { value: settingsRef.current.fixedBottomRightRadius },
        uSmallTopLeftRadius: { value: settingsRef.current.smallTopLeftRadius },
        uSmallBottomRightRadius: { value: settingsRef.current.smallBottomRightRadius },
        uSmoothness: { value: settingsRef.current.smoothness },
        uAmbientIntensity: { value: settingsRef.current.ambientIntensity },
        uDiffuseIntensity: { value: settingsRef.current.diffuseIntensity },
        uSpecularIntensity: { value: settingsRef.current.specularIntensity },
        uSpecularPower: { value: settingsRef.current.specularPower },
        uFresnelPower: { value: settingsRef.current.fresnelPower },
        uBackgroundColor: { value: settingsRef.current.backgroundColor },
        uSphereColor: { value: settingsRef.current.sphereColor },
        uLightColor: { value: settingsRef.current.lightColor },
        uLightPosition: { value: settingsRef.current.lightPosition },
        uContrast: { value: settingsRef.current.contrast },
        uFogDensity: { value: settingsRef.current.fogDensity },
        uAnimationSpeed: { value: settingsRef.current.animationSpeed },
        uMovementScale: { value: settingsRef.current.movementScale },
        uCursorGlowIntensity: { value: settingsRef.current.cursorGlowIntensity },
        uCursorGlowRadius: { value: settingsRef.current.cursorGlowRadius },
        uCursorGlowColor: { value: settingsRef.current.cursorGlowColor }
      },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        precision highp float;
        uniform float uTime;
        uniform vec2 uResolution;
        uniform vec2 uActualResolution;
        uniform vec3 uCursorSphere;
        uniform float uCursorRadius;
        uniform int uSphereCount;
        uniform float uFixedTopLeftRadius;
        uniform float uFixedBottomRightRadius;
        uniform float uSmallTopLeftRadius;
        uniform float uSmallBottomRightRadius;
        uniform float uSmoothness;
        uniform float uAmbientIntensity;
        uniform float uDiffuseIntensity;
        uniform float uSpecularIntensity;
        uniform float uSpecularPower;
        uniform float uFresnelPower;
        uniform vec3 uBackgroundColor;
        uniform vec3 uSphereColor;
        uniform vec3 uLightColor;
        uniform vec3 uLightPosition;
        uniform float uContrast;
        uniform float uFogDensity;
        uniform float uAnimationSpeed;
        uniform float uMovementScale;
        uniform float uCursorGlowIntensity;
        uniform float uCursorGlowRadius;
        uniform vec3 uCursorGlowColor;
        varying vec2 vUv;

        float smin(float a, float b, float k) {
          float h = max(k - abs(a - b), 0.0) / k;
          return min(a, b) - h * h * k * 0.25;
        }

        float sdSphere(vec3 p, float r) {
          return length(p) - r;
        }

        vec3 screenToWorld(vec2 normalizedPos) {
          vec2 uv = normalizedPos * 2.0 - 1.0;
          uv.x *= uResolution.x / uResolution.y;
          return vec3(uv * 2.0, 0.0);
        }

        float sceneSDF(vec3 pos) {
          float result = 10.0;
          
          vec3 topLeftPos = screenToWorld(vec2(0.08, 0.92));
          float topLeft = sdSphere(pos - topLeftPos, uFixedTopLeftRadius);
          vec3 smallTopLeftPos = screenToWorld(vec2(0.25, 0.72));
          float smallTopLeft = sdSphere(pos - smallTopLeftPos, uSmallTopLeftRadius);
          vec3 bottomRightPos = screenToWorld(vec2(0.92, 0.08));
          float bottomRight = sdSphere(pos - bottomRightPos, uFixedBottomRightRadius);
          vec3 smallBottomRightPos = screenToWorld(vec2(0.72, 0.25));
          float smallBottomRight = sdSphere(pos - smallBottomRightPos, uSmallBottomRightRadius);
          
          float t = uTime * uAnimationSpeed;
          for (int i = 0; i < 10; i++) {
            if (i >= uSphereCount) break;
            float fi = float(i);
            float speed = 0.4 + fi * 0.12;
            float radius = 0.12 + mod(fi, 3.0) * 0.06;
            float orbitRadius = (0.3 + mod(fi, 3.0) * 0.15) * uMovementScale;
            float phaseOffset = fi * 1.5;
            vec3 offset = vec3(sin(t * speed + phaseOffset) * orbitRadius, cos(t * speed * 0.8 + phaseOffset * 1.2) * orbitRadius * 0.6, sin(t * speed * 0.5 + phaseOffset) * 0.3);
            result = smin(result, sdSphere(pos - offset, radius), uSmoothness);
          }

          float cursorBall = sdSphere(pos - uCursorSphere, uCursorRadius);
          result = smin(result, topLeft, 0.4);
          result = smin(result, smallTopLeft, 0.3);
          result = smin(result, bottomRight, 0.4);
          result = smin(result, smallBottomRight, 0.3);
          result = smin(result, cursorBall, uSmoothness);
          return result;
        }

        vec3 calcNormal(vec3 p) {
          vec2 e = vec2(1.0, -1.0) * 0.001;
          return normalize(e.xyy * sceneSDF(p + e.xyy) + e.yyx * sceneSDF(p + e.yyx) + e.yxy * sceneSDF(p + e.yxy) + e.xxx * sceneSDF(p + e.xxx));
        }

        void main() {
          vec2 uv = (gl_FragCoord.xy * 2.0 - uActualResolution.xy) / uActualResolution.xy;
          uv.x *= uResolution.x / uResolution.y;
          vec3 ro = vec3(uv * 2.0, -2.0);
          vec3 rd = vec3(0.0, 0.0, 1.0);
          float t = 0.0;
          float hit = -1.0;
          for(int i = 0; i < 32; i++) {
            float d = sceneSDF(ro + rd * t);
            if(d < 0.001) { hit = t; break; }
            if(t > 6.0) break;
            t += d;
          }
          vec3 color = uBackgroundColor;
          if(hit > 0.0) {
            vec3 p = ro + rd * hit;
            vec3 n = calcNormal(p);
            vec3 lp = normalize(uLightPosition);
            float diff = max(dot(n, lp), 0.0);
            float spec = pow(max(dot(-rd, reflect(-lp, n)), 0.0), uSpecularPower);
            float fresnel = pow(1.0 - max(dot(-rd, n), 0.0), uFresnelPower);
            color = uSphereColor + uLightColor * diff * uDiffuseIntensity;
            color += uLightColor * spec * uSpecularIntensity * fresnel;
            color = mix(color, uBackgroundColor, 1.0 - exp(-hit * uFogDensity));
          } else {
             float dist = length(uv * 2.0 - uCursorSphere.xy);
             color += uCursorGlowColor * (exp(-dist * uCursorGlowRadius) * uCursorGlowIntensity);
          }
          gl_FragColor = vec4(pow(color, vec3(uContrast)), 1.0);
        }
      `,
      transparent: true
    });

    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), shaderMaterial);
    scene.add(mesh);

    const targetMouse = new THREE.Vector2(0.5, 0.5);
    const currentMouse = new THREE.Vector2(0.5, 0.5);
    window.addEventListener('mousemove', (e) => {
      targetMouse.x = e.clientX / window.innerWidth;
      targetMouse.y = 1.0 - (e.clientY / window.innerHeight);
    });

    const pane = new Pane({ title: "Nexus Control", container: tpRef.current, expanded: !isMobile });
    
    pane.addBinding(settingsRef.current, 'preset', {
      options: { Holographic: 'holographic', Minimal: 'minimal', Neon: 'neon' }
    }).on('change', (ev) => {
      const p = PRESETS[ev.value];
      if (p) {
        Object.assign(settingsRef.current, p);
        onUpdateSettings({ ...settingsRef.current });
        pane.refresh();
      }
    });

    const f1 = pane.addFolder({ title: "Morphology" });
    f1.addBinding(settingsRef.current, 'sphereCount', { min: 2, max: 10, step: 1 }).on('change', v => shaderMaterial.uniforms.uSphereCount.value = v.value);
    f1.addBinding(settingsRef.current, 'smoothness', { min: 0.1, max: 1.0 }).on('change', v => shaderMaterial.uniforms.uSmoothness.value = v.value);
    f1.addBinding(settingsRef.current, 'animationSpeed', { min: 0.1, max: 2.0 }).on('change', v => shaderMaterial.uniforms.uAnimationSpeed.value = v.value);
    f1.addBinding(settingsRef.current, 'movementScale', { min: 0.5, max: 2.5 }).on('change', v => shaderMaterial.uniforms.uMovementScale.value = v.value);

    const f2 = pane.addFolder({ title: "Lighting & Shading" });
    f2.addBinding(settingsRef.current, 'diffuseIntensity', { min: 0, max: 5 }).on('change', v => shaderMaterial.uniforms.uDiffuseIntensity.value = v.value);
    f2.addBinding(settingsRef.current, 'specularIntensity', { min: 0, max: 10 }).on('change', v => shaderMaterial.uniforms.uSpecularIntensity.value = v.value);
    f2.addBinding(settingsRef.current, 'specularPower', { min: 1, max: 64 }).on('change', v => shaderMaterial.uniforms.uSpecularPower.value = v.value);
    f2.addBinding(settingsRef.current, 'fresnelPower', { min: 0.1, max: 10 }).on('change', v => shaderMaterial.uniforms.uFresnelPower.value = v.value);
    f2.addBinding(settingsRef.current, 'lightColor', { view: 'color' }).on('change', v => shaderMaterial.uniforms.uLightColor.value.copy(v.value));

    const f3 = pane.addFolder({ title: "Chromatics" });
    f3.addBinding(settingsRef.current, 'backgroundColor', { view: 'color' }).on('change', v => shaderMaterial.uniforms.uBackgroundColor.value.copy(v.value));
    f3.addBinding(settingsRef.current, 'sphereColor', { view: 'color' }).on('change', v => shaderMaterial.uniforms.uSphereColor.value.copy(v.value));
    f3.addBinding(settingsRef.current, 'contrast', { min: 0.5, max: 3.0 }).on('change', v => shaderMaterial.uniforms.uContrast.value = v.value);
    f3.addBinding(settingsRef.current, 'fogDensity', { min: 0, max: 0.5 }).on('change', v => shaderMaterial.uniforms.uFogDensity.value = v.value);

    const f4 = pane.addFolder({ title: "Cursor & Glow" });
    f4.addBinding(settingsRef.current, 'cursorRadiusMin', { min: 0.01, max: 0.4 }).on('change', v => shaderMaterial.uniforms.uCursorRadius.value = v.value);
    f4.addBinding(settingsRef.current, 'cursorGlowIntensity', { min: 0, max: 10 }).on('change', v => shaderMaterial.uniforms.uCursorGlowIntensity.value = v.value);
    f4.addBinding(settingsRef.current, 'cursorGlowRadius', { min: 0.5, max: 10.0 }).on('change', v => shaderMaterial.uniforms.uCursorGlowRadius.value = v.value);
    f4.addBinding(settingsRef.current, 'cursorGlowColor', { view: 'color' }).on('change', v => shaderMaterial.uniforms.uCursorGlowColor.value.copy(v.value));

    const f5 = pane.addFolder({ title: "SDF Radii" });
    f5.addBinding(settingsRef.current, 'fixedTopLeftRadius', { min: 0.1, max: 2.0 }).on('change', v => shaderMaterial.uniforms.uFixedTopLeftRadius.value = v.value);
    f5.addBinding(settingsRef.current, 'fixedBottomRightRadius', { min: 0.1, max: 2.0 }).on('change', v => shaderMaterial.uniforms.uFixedBottomRightRadius.value = v.value);
    f5.addBinding(settingsRef.current, 'smallTopLeftRadius', { min: 0.1, max: 1.0 }).on('change', v => shaderMaterial.uniforms.uSmallTopLeftRadius.value = v.value);
    f5.addBinding(settingsRef.current, 'smallBottomRightRadius', { min: 0.1, max: 1.0 }).on('change', v => shaderMaterial.uniforms.uSmallBottomRightRadius.value = v.value);

    let lastTime = performance.now();
    let frameCount = 0;
    const clock = new THREE.Clock();

    const animate = () => {
      const currentTime = performance.now();
      frameCount++;
      if (currentTime - lastTime >= 1000) {
        statsRef.current.fps = Math.round((frameCount * 1000) / (currentTime - lastTime));
        frameCount = 0;
        lastTime = currentTime;
      }
      currentMouse.x += (targetMouse.x - currentMouse.x) * settingsRef.current.mouseSmoothness;
      currentMouse.y += (targetMouse.y - currentMouse.y) * settingsRef.current.mouseSmoothness;
      const aspect = window.innerWidth / window.innerHeight;
      shaderMaterial.uniforms.uTime.value = clock.getElapsedTime();
      shaderMaterial.uniforms.uCursorSphere.value.set((currentMouse.x * 2.0 - 1.0) * aspect * 2.0, (currentMouse.y * 2.0 - 1.0) * 2.0, 0);
      onUpdateStats(0, 0, 0, 0, statsRef.current.fps);
      renderer.render(scene, camera);
      requestAnimationFrame(animate);
    };
    animate();

    const handleResize = () => {
      renderer.setSize(window.innerWidth, window.innerHeight);
      shaderMaterial.uniforms.uResolution.value.set(window.innerWidth, window.innerHeight);
      shaderMaterial.uniforms.uActualResolution.value.set(window.innerWidth * dpr, window.innerHeight * dpr);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      pane.dispose();
      renderer.dispose();
    };
  }, []);

  return (
    <>
      <div id="tweakpane-container" ref={tpRef}></div>
      <canvas ref={canvasRef} className="fixed inset-0 z-0 pointer-events-none" />
    </>
  );
};

export default MetaballsScene;
