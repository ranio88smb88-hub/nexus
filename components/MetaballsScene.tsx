
import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { Pane } from 'tweakpane';
import { INITIAL_SETTINGS, PRESETS } from '../constants';
import { Settings } from '../types';

interface MetaballsSceneProps {
  onUpdateStats: (x: number, y: number, radius: number, merges: number, fps: number) => void;
}

const MetaballsScene: React.FC<MetaballsSceneProps> = ({ onUpdateStats }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const settingsRef = useRef<Settings>({ ...INITIAL_SETTINGS });
  const statsRef = useRef({ x: 0, y: 0, radius: 0.1, merges: 0, fps: 0 });

  useEffect(() => {
    if (!containerRef.current || !canvasRef.current) return;

    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
    const dpr = Math.min(window.devicePixelRatio || 1, isMobile ? 1.5 : 2);

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
    renderer.setClearColor(0x000000, 0);

    const shaderMaterial = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uResolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
        uActualResolution: { value: new THREE.Vector2(window.innerWidth * dpr, window.innerHeight * dpr) },
        uPixelRatio: { value: dpr },
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

        const float PI = 3.14159265359;
        const float EPSILON = 0.001;
        const float MAX_DIST = 10.0;

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
          float result = MAX_DIST;
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
            float phaseOffset = fi * PI * 0.35;
            
            vec3 offset = vec3(
              sin(t * speed + phaseOffset) * orbitRadius,
              cos(t * speed * 0.85 + phaseOffset * 1.3) * orbitRadius * 0.6,
              sin(t * speed * 0.5 + phaseOffset) * 0.3
            );
            
            float movingSphere = sdSphere(pos - offset, radius);
            result = smin(result, movingSphere, uSmoothness);
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
          for(int i = 0; i < 40; i++) {
            vec3 p = ro + rd * t;
            float d = sceneSDF(p);
            if(d < EPSILON) { hit = t; break; }
            if(t > 6.0) break;
            t += d;
          }

          vec3 color = uBackgroundColor;
          if(hit > 0.0) {
            vec3 p = ro + rd * hit;
            vec3 n = calcNormal(p);
            vec3 lp = normalize(uLightPosition);
            float diff = max(dot(n, lp), 0.0);
            vec3 viewDir = -rd;
            vec3 reflectDir = reflect(-lp, n);
            float spec = pow(max(dot(viewDir, reflectDir), 0.0), uSpecularPower);
            float fresnel = pow(1.0 - max(dot(viewDir, n), 0.0), uFresnelPower);
            
            color = uSphereColor + uLightColor * diff * uDiffuseIntensity;
            color += uLightColor * spec * uSpecularIntensity * fresnel;
            color = mix(color, uBackgroundColor, 1.0 - exp(-hit * uFogDensity));
          } else {
             float distToCursor = length(uv * 2.0 - uCursorSphere.xy);
             float glow = exp(-distToCursor * uCursorGlowRadius) * uCursorGlowIntensity;
             color += uCursorGlowColor * glow;
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

    const updateWorldCursor = (clientX: number, clientY: number) => {
      targetMouse.x = clientX / window.innerWidth;
      targetMouse.y = 1.0 - (clientY / window.innerHeight);
    };

    const handlePointerMove = (e: MouseEvent) => updateWorldCursor(e.clientX, e.clientY);
    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches[0]) updateWorldCursor(e.touches[0].clientX, e.touches[0].clientY);
    };

    window.addEventListener('mousemove', handlePointerMove);
    window.addEventListener('touchmove', handleTouchMove);

    // Tweakpane Integration matching the requested UI
    const pane = new Pane({ title: "Metaball Controls", expanded: !isMobile });
    
    pane.addBinding(settingsRef.current, 'preset', {
      options: { Holographic: 'holographic', Minimal: 'minimal', Neon: 'neon' }
    }).on('change', (ev) => {
      const p = PRESETS[ev.value];
      Object.assign(settingsRef.current, p);
      Object.keys(p).forEach(k => {
        if (shaderMaterial.uniforms[k]) shaderMaterial.uniforms[k].value = (p as any)[k];
      });
      pane.refresh();
    });

    const mFolder = pane.addFolder({ title: "Metaballs" });
    mFolder.addBinding(settingsRef.current, 'fixedTopLeftRadius', { label: 'Top Left Size', min: 0.1, max: 1.5 }).on('change', v => shaderMaterial.uniforms.uFixedTopLeftRadius.value = v.value);
    mFolder.addBinding(settingsRef.current, 'fixedBottomRightRadius', { label: 'Bottom Right Size', min: 0.1, max: 1.5 }).on('change', v => shaderMaterial.uniforms.uFixedBottomRightRadius.value = v.value);
    mFolder.addBinding(settingsRef.current, 'smallTopLeftRadius', { label: 'Small Top Left', min: 0.1, max: 1.0 }).on('change', v => shaderMaterial.uniforms.uSmallTopLeftRadius.value = v.value);
    mFolder.addBinding(settingsRef.current, 'smallBottomRightRadius', { label: 'Small Bottom Right', min: 0.1, max: 1.0 }).on('change', v => shaderMaterial.uniforms.uSmallBottomRightRadius.value = v.value);
    mFolder.addBinding(settingsRef.current, 'sphereCount', { label: 'Moving Count', min: 2, max: 10, step: 1 }).on('change', v => shaderMaterial.uniforms.uSphereCount.value = v.value);
    mFolder.addBinding(settingsRef.current, 'smoothness', { label: 'Blend Smoothness', min: 0.1, max: 1.0 }).on('change', v => shaderMaterial.uniforms.uSmoothness.value = v.value);

    const iFolder = pane.addFolder({ title: "Mouse Interaction" });
    iFolder.addBinding(settingsRef.current, 'mouseProximityEffect');
    iFolder.addBinding(settingsRef.current, 'minMovementScale', { min: 0.1, max: 1.0 });
    iFolder.addBinding(settingsRef.current, 'maxMovementScale', { min: 0.5, max: 2.0 });
    iFolder.addBinding(settingsRef.current, 'mouseSmoothness', { label: 'Mouse Smoothness', min: 0.01, max: 0.5 });

    const cFolder = pane.addFolder({ title: "Cursor" });
    cFolder.addBinding(settingsRef.current, 'cursorRadiusMin', { label: 'Min Radius', min: 0.01, max: 0.2 });
    cFolder.addBinding(settingsRef.current, 'cursorRadiusMax', { label: 'Max Radius', min: 0.1, max: 0.5 });

    const aFolder = pane.addFolder({ title: "Animation" });
    aFolder.addBinding(settingsRef.current, 'animationSpeed', { min: 0.1, max: 2.0 }).on('change', v => shaderMaterial.uniforms.uAnimationSpeed.value = v.value);
    aFolder.addBinding(settingsRef.current, 'movementScale', { min: 0.1, max: 3.0 }).on('change', v => shaderMaterial.uniforms.uMovementScale.value = v.value);

    const lFolder = pane.addFolder({ title: "Lighting" });
    lFolder.addBinding(settingsRef.current, 'ambientIntensity', { min: 0, max: 1 }).on('change', v => shaderMaterial.uniforms.uAmbientIntensity.value = v.value);
    lFolder.addBinding(settingsRef.current, 'diffuseIntensity', { min: 0, max: 3 }).on('change', v => shaderMaterial.uniforms.uDiffuseIntensity.value = v.value);
    lFolder.addBinding(settingsRef.current, 'specularIntensity', { min: 0, max: 10 }).on('change', v => shaderMaterial.uniforms.uSpecularIntensity.value = v.value);
    lFolder.addBinding(settingsRef.current, 'specularPower', { min: 1, max: 50, step: 1 }).on('change', v => shaderMaterial.uniforms.uSpecularPower.value = v.value);
    lFolder.addBinding(settingsRef.current, 'fresnelPower', { min: 0.1, max: 10 }).on('change', v => shaderMaterial.uniforms.uFresnelPower.value = v.value);
    lFolder.addBinding(settingsRef.current, 'contrast', { min: 0.5, max: 3.0 }).on('change', v => shaderMaterial.uniforms.uContrast.value = v.value);

    const gFolder = pane.addFolder({ title: "Cursor Glow" });
    gFolder.addBinding(settingsRef.current, 'cursorGlowIntensity', { min: 0, max: 5 }).on('change', v => shaderMaterial.uniforms.uCursorGlowIntensity.value = v.value);
    gFolder.addBinding(settingsRef.current, 'cursorGlowRadius', { min: 0.1, max: 5.0 }).on('change', v => shaderMaterial.uniforms.uCursorGlowRadius.value = v.value);
    gFolder.addBinding(settingsRef.current, 'fogDensity', { min: 0, max: 0.5 }).on('change', v => shaderMaterial.uniforms.uFogDensity.value = v.value);

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
      const wx = (currentMouse.x * 2.0 - 1.0) * aspect * 2.0;
      const wy = (currentMouse.y * 2.0 - 1.0) * 2.0;

      // Dynamic Proximity Scaling
      let currentRadius = settingsRef.current.cursorRadiusMin;
      if (settingsRef.current.mouseProximityEffect) {
        const distFromCenter = Math.sqrt(wx * wx + wy * wy);
        const factor = Math.min(distFromCenter / 2.0, 1.0);
        currentRadius = THREE.MathUtils.lerp(settingsRef.current.cursorRadiusMax, settingsRef.current.cursorRadiusMin, factor);
      }
      shaderMaterial.uniforms.uCursorRadius.value = currentRadius;

      // Interaction stats calculation
      let merges = 0;
      const fixedPoints = [[0.08, 0.92], [0.25, 0.72], [0.92, 0.08], [0.72, 0.25]];
      fixedPoints.forEach(([nx, ny]) => {
        const px = (nx * 2.0 - 1.0) * aspect * 2.0;
        const py = (ny * 2.0 - 1.0) * 2.0;
        const d = Math.sqrt((wx - px) ** 2 + (wy - py) ** 2);
        if (d < settingsRef.current.mergeDistance) merges++;
      });

      shaderMaterial.uniforms.uTime.value = clock.getElapsedTime();
      shaderMaterial.uniforms.uCursorSphere.value.set(wx, wy, 0);
      
      onUpdateStats(wx, wy, currentRadius, merges, statsRef.current.fps);

      renderer.render(scene, camera);
      requestAnimationFrame(animate);
    };

    animate();

    const handleResize = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      renderer.setSize(w, h);
      shaderMaterial.uniforms.uResolution.value.set(w, h);
      shaderMaterial.uniforms.uActualResolution.value.set(w * dpr, h * dpr);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('mousemove', handlePointerMove);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('resize', handleResize);
      pane.dispose();
      renderer.dispose();
    };
  }, []);

  return (
    <div ref={containerRef} className="fixed inset-0 z-0 pointer-events-none">
      <canvas ref={canvasRef} className="block w-full h-full" />
    </div>
  );
};

export default MetaballsScene;
