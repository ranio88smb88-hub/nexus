
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
  // UI Customization
  uiTheme: 'darkness' | 'neon' | 'sunset' | 'frost';
  sliderImage: string;
  // Dynamic Slider Content
  sliderHeading: string;
  slide1Title: string;
  slide1Bg: string;
  slide2Title: string;
  slide2Bg: string;
  slide3Title: string;
  slide3Bg: string;
  slide4Title: string;
  slide4Bg: string;
  slide5Title: string;
  slide5Bg: string;
}
