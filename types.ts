
import * as THREE from 'three';

export interface Preset {
  sphereCount: number;
  ambientIntensity: number;
  diffuseIntensity: number;
  specularIntensity: number;
  specularPower: number;
  fresnelPower: number;
  backgroundColor: THREE.Color;
  sphereColor: THREE.Color;
  lightColor: THREE.Color;
  lightPosition: THREE.Vector3;
  smoothness: number;
  contrast: number;
  fogDensity: number;
  cursorGlowIntensity: number;
  cursorGlowRadius: number;
  cursorGlowColor: THREE.Color;
}

export interface Settings extends Preset {
  preset: string;
  fixedTopLeftRadius: number;
  fixedBottomRightRadius: number;
  smallTopLeftRadius: number;
  smallBottomRightRadius: number;
  cursorRadiusMin: number;
  cursorRadiusMax: number;
  animationSpeed: number;
  movementScale: number;
  mouseSmoothness: number;
  mergeDistance: number;
  mouseProximityEffect: boolean;
  minMovementScale: number;
  maxMovementScale: number;
}
