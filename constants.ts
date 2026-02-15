
import * as THREE from 'three';
import { Preset, Settings } from './types';

const isMobile = typeof window !== 'undefined' ? /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) : false;

export const PRESETS: Record<string, Preset> = {
  holographic: {
    sphereCount: 6,
    ambientIntensity: 0.12,
    diffuseIntensity: 1.2,
    specularIntensity: 2.5,
    specularPower: 3,
    fresnelPower: 0.8,
    backgroundColor: new THREE.Color(0x0a0a15),
    sphereColor: new THREE.Color(0x050510),
    lightColor: new THREE.Color(0xccaaff),
    lightPosition: new THREE.Vector3(0.9, 0.9, 1.2),
    smoothness: 0.8,
    contrast: 1.6,
    fogDensity: 0.06,
    cursorGlowIntensity: 1.2,
    cursorGlowRadius: 2.2,
    cursorGlowColor: new THREE.Color(0xaa77ff)
  },
  minimal: {
    sphereCount: 3,
    ambientIntensity: 0.0,
    diffuseIntensity: 0.25,
    specularIntensity: 1.3,
    specularPower: 11,
    fresnelPower: 1.7,
    backgroundColor: new THREE.Color(0x0a0a0a),
    sphereColor: new THREE.Color(0x000000),
    lightColor: new THREE.Color(0xffffff),
    lightPosition: new THREE.Vector3(1, 0.5, 0.8),
    smoothness: 0.25,
    contrast: 2.0,
    fogDensity: 0.1,
    cursorGlowIntensity: 0.3,
    cursorGlowRadius: 1.0,
    cursorGlowColor: new THREE.Color(0xffffff)
  },
  neon: {
    sphereCount: 7,
    ambientIntensity: 0.04,
    diffuseIntensity: 1.0,
    specularIntensity: 2.0,
    specularPower: 4,
    fresnelPower: 1.0,
    backgroundColor: new THREE.Color(0x000505),
    sphereColor: new THREE.Color(0x000808),
    lightColor: new THREE.Color(0x00ffcc),
    lightPosition: new THREE.Vector3(0.7, 1.3, 0.8),
    smoothness: 0.7,
    contrast: 2.0,
    fogDensity: 0.08,
    cursorGlowIntensity: 0.8,
    cursorGlowRadius: 1.4,
    cursorGlowColor: new THREE.Color(0x00ffaa)
  }
};

export const INITIAL_SETTINGS: Settings = {
  preset: 'holographic',
  ...PRESETS.holographic,
  fixedTopLeftRadius: 0.8,
  fixedBottomRightRadius: 0.9,
  smallTopLeftRadius: 0.3,
  smallBottomRightRadius: 0.35,
  cursorRadiusMin: 0.08,
  cursorRadiusMax: 0.15,
  animationSpeed: 0.6,
  movementScale: 1.2,
  mouseSmoothness: 0.1,
  mergeDistance: 1.5,
  mouseProximityEffect: true,
  minMovementScale: 0.3,
  maxMovementScale: 1.0
};
