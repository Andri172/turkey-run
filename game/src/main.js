// Free Range — boot, the fixed-step loop, sound, and screenshot mode.

import { World } from './world.js';
import { Renderer } from './render.js';
import { Input } from './input.js';
import { stageShot } from './shots.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const status = document.getElementById('status');
const input = new Input(canvas);
const renderer = new Renderer(ctx);

const params = new URLSearchParams(location.search);
const shotName = params.get('shot');
const seed = Number(params.get('seed') ?? '1') || 1;

let W = 0, H = 0;
function resize() {
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  W = window.innerWidth; H = window.innerHeight;
  canvas.width = Math.round(W * dpr);
  canvas.height = Math.round(H * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}
window.addEventListener('resize', resize);
resize();

// --- tiny WebAudio synth ---------------------------------------------------
let audio = null;
function beep(freq, dur, type = 'square', vol = 0.05, slide = 0) {
  if (!audio) return;
  const t = audio.currentTime;
  const o = audio.createOscillator(), g = audio.createGain();
  o.type = type; o.frequency.setValueAtTime(freq, t);
  if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(30, freq + slide), t + dur);
  g.gain.setValueAtTime(vol, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g).connect(audio.destination);
  o.start(t); o.stop(t + dur);
}
function playEvents(events) {
  for (const e of events) {
    if (e === 'start') { if (!audio) audio = new (window.AudioContext || window.webkitAudioContext)(); beep(520, 0.09, 'square', 0.05, 260); }
    else if (e === 'jump') beep(300, 0.1, 'square', 0.04, 220);
    else if (e === 'flap') { beep(420, 0.07, 'square', 0.04, 160); setTimeout(() => beep(460, 0.07, 'square', 0.035, 140), 55); }
    else if (e === 'corn') beep(880, 0.07, 'sine', 0.06, 120);
    else if (e === 'gold') { beep(880, 0.07, 'sine', 0.06, 120); setTimeout(() => beep(1320, 0.12, 'sine', 0.06, 60), 60); }
    else if (e === 'hit') beep(160, 0.22, 'sawtooth', 0.07, -90);
    else if (e === 'mud') beep(120, 0.16, 'sine', 0.06, -50);
    else if (e === 'win') { [523, 659, 784, 1046].forEach((f, i) => setTimeout(() => beep(f, 0.16, 'square', 0.05), i * 110)); }
    else if (e === 'lose') { [392, 330, 262, 196].forEach((f, i) => setTimeout(() => beep(f, 0.18, 'square', 0.05), i * 120)); }
  }
}

// --- game ------------------------------------------------------------------
let world = new World(seed);
Object.defineProperty(window, '__world', { get: () => world });
let lastStatus = '';
function announce() {
  const s = world.state === 'title' ? 'Free Range. Press space to run.'
    : world.state === 'run' ? `Running. ${Math.floor(world.dist)} metres, score ${Math.floor(world.score)}.`
    : world.state === 'won' ? `Escaped! Final score ${world.endStats.score}.`
    : `Caught at ${world.endStats.dist} metres. Score ${world.endStats.score}.`;
  if (s !== lastStatus) { status.textContent = s; lastStatus = s; }
}

if (shotName) {
  stageShot(world, shotName, seed);
  // Let layout and fonts settle, then present one staged frame.
  requestAnimationFrame(() => requestAnimationFrame(() => {
    renderer.draw(world, W, H);
    window.__shotReady = true;
  }));
} else {
  let last = performance.now(), acc = 0;
  const STEP = 1 / 120;
  function frame(now) {
    requestAnimationFrame(frame);
    let dt = (now - last) / 1000; last = now;
    if (dt > 0.25) dt = 0.25;
    acc += dt;
    while (acc >= STEP) {
      if (world.state === 'title' && input.pressed.any) world.start();
      else if ((world.state === 'won' || world.state === 'caught') && input.pressed.any) {
        world = new World((Math.random() * 1e9) | 0);
        world.start();
      }
      world.step(STEP, input);
      input.endFrame();
      acc -= STEP;
    }
    if (world.events.length) { playEvents(world.events); world.events.length = 0; }
    announce();
    renderer.draw(world, W, H);
  }
  requestAnimationFrame(frame);
}
