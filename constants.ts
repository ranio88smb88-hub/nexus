import * as THREE from 'three';
import { Preset, Settings } from './types';

export const SLIDER_ITEMS_DEFAULT = [
  {
    title: "prediksi bola",
    desc: "Update terbaru skor dan peluang.",
    bg: "https://cdn-front.freepik.com/home/anon-rvmp/professionals/designers.webp",
    thumb: "https://cdn-front.freepik.com/home/anon-rvmp/professionals/img-designer.webp?w=480"
  },
  {
    title: "prediksi togel",
    desc: "Analisa angka jitu setiap hari.",
    bg: "https://cdn-front.freepik.com/home/anon-rvmp/professionals/marketers.webp",
    thumb: "https://cdn-front.freepik.com/home/anon-rvmp/professionals/img-marketer.webp?w=480"
  },
  {
    title: "validasi rekening",
    desc: "Keamanan transaksi Anda prioritas kami.",
    bg: "https://cdn-front.freepik.com/home/anon-rvmp/professionals/filmmakers.webp",
    thumb: "https://cdn-front.freepik.com/home/anon-rvmp/professionals/img-film.webp?w=480"
  },
  {
    title: "hadiah bola",
    desc: "Klaim bonus kemenangan Anda.",
    bg: "https://cdn-front.freepik.com/home/anon-rvmp/professionals/content-creators.webp",
    thumb: "https://cdn-front.freepik.com/home/anon-rvmp/professionals/img-content.webp?w=480"
  },
  {
    title: "hadiah togel",
    desc: "Jackpot besar menanti Anda.",
    bg: "https://cdn-front.freepik.com/home/anon-rvmp/professionals/art-directors.webp",
    thumb: "https://cdn-front.freepik.com/home/anon-rvmp/professionals/img-art.webp?w=480"
  }
];

export const PRESETS: Record<string, Preset> = {
  holographic: {
    sphereCount: 6,
    ambientIntensity: 0.12,
    diffuseIntensity: 1.2,
    specularIntensity: 2.5,
    specularPower: 3,
    fresnelPower: 0.8,
    backgroundColor: new THREE.Color(0x07090d),
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
    sphereCount: 4,
    ambientIntensity: 0.05,
    diffuseIntensity: 0.8,
    specularIntensity: 1.0,
    specularPower: 8,
    fresnelPower: 2.0,
    backgroundColor: new THREE.Color(0x050505),
    sphereColor: new THREE.Color(0x111111),
    lightColor: new THREE.Color(0xffffff),
    lightPosition: new THREE.Vector3(-1, 1, 1),
    smoothness: 0.5,
    contrast: 1.2,
    fogDensity: 0.02,
    cursorGlowIntensity: 0.5,
    cursorGlowRadius: 1.5,
    cursorGlowColor: new THREE.Color(0xffffff)
  },
  neon: {
    sphereCount: 8,
    ambientIntensity: 0.2,
    diffuseIntensity: 2.0,
    specularIntensity: 5.0,
    specularPower: 2,
    fresnelPower: 0.5,
    backgroundColor: new THREE.Color(0x000000),
    sphereColor: new THREE.Color(0x0a001a),
    lightColor: new THREE.Color(0x00ffcc),
    lightPosition: new THREE.Vector3(0, 0, 1),
    smoothness: 0.9,
    contrast: 2.0,
    fogDensity: 0.1,
    cursorGlowIntensity: 3.0,
    cursorGlowRadius: 3.0,
    cursorGlowColor: new THREE.Color(0xff00ff)
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
  maxMovementScale: 1.0,
  uiTheme: 'darkness',
  sliderImage: '',
  // Default Slider Values
  sliderHeading: "Sistem Manajemen & Prediksi Terintegrasi",
  slide1Title: "prediksi bola",
  slide1Bg: "https://cdn-front.freepik.com/home/anon-rvmp/professionals/designers.webp",
  slide2Title: "prediksi togel",
  slide2Bg: "https://cdn-front.freepik.com/home/anon-rvmp/professionals/marketers.webp",
  slide3Title: "validasi rekening",
  slide3Bg: "https://cdn-front.freepik.com/home/anon-rvmp/professionals/filmmakers.webp",
  slide4Title: "hadiah bola",
  slide4Bg: "https://cdn-front.freepik.com/home/anon-rvmp/professionals/content-creators.webp",
  slide5Title: "hadiah togel",
  slide5Bg: "https://cdn-front.freepik.com/home/anon-rvmp/professionals/art-directors.webp",
};