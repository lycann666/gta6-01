// Boot and the one loop for Neon Harbor. Fixed 1/60 s steps, screens:
// title, play, paused, game over, win. Save/load via localStorage.
// ?seed=N fixes the city. ?shot=start|play|chase|mission stages a scene
// instead of running the loop and sets window.__shotReady for a screenshot.
import { BEST_KEY, SAVE_KEY, STEP } from './config.js';
import { createRandom } from './random.js';
import { createWorld, EVENT_BUSTED, EVENT_MISSION, EVENT_WASTED } from './world.js';
import { ACTION_CONFIRM, ACTION_PAUSE, ACTION_ENTER, ACTION_ATTACK, createInput } from './input.js';
import { createAudio } from './audio.js';
import { createRenderer, SCREEN_OVER, SCREEN_PAUSED, SCREEN_PLAY, SCREEN_TITLE, SCREEN_WIN } from './render.js';
import { stageShot } from './shots.js';

const MAX_FRAME = 0.25;
const params = new URLSearchParams(window.location.search);
const shot = params.get('shot');
const seedParam = Number.parseInt(params.get('seed') ?? '', 10);
const seed = Number.isInteger(seedParam) ? seedParam : Math.floor(Math.random() * 4294967296);

const canvas = document.getElementById('game');
const status = document.getElementById('status');
const world = createWorld(createRandom(seed));
const renderer = createRenderer(canvas);
const audio = createAudio();
window.__world = world; // exposed for play-tests and debugging only

function readJson(key) {
  try { return JSON.parse(window.localStorage.getItem(key) || 'null'); } catch { return null; }
}
function writeJson(key, value) {
  try { window.localStorage.setItem(key, JSON.stringify(value)); } catch { /* storage may be off */ }
}
function readBest() { const v = readJson(BEST_KEY); return typeof v === 'number' ? v : 0; }

function runShot(name) {
  const scene = stageShot(name, world);
  let painted = 0;
  // Keep repainting: a late window resize clears the canvas, and the shot
  // must still be visible when the screenshot is taken.
  function paint() {
    renderer.draw(world, scene.screen, scene.best);
    painted += 1;
    if (painted === 2) window.__shotReady = true;
    requestAnimationFrame(paint);
  }
  requestAnimationFrame(paint);
}

function runGame() {
  const input = createInput(canvas);
  let screen = SCREEN_TITLE;
  let best = readBest();
  let accumulator = 0;
  let last = performance.now();
  const saved = readJson(SAVE_KEY);
  if (saved) world.applySave(saved);

  function announce(message) { status.textContent = message; }
  function saveAll() {
    writeJson(SAVE_KEY, world.saveData());
    if (world.state.cash > best) { best = world.state.cash; writeJson(BEST_KEY, best); }
  }
  function startGame(fresh) {
    audio.unlock();
    if (fresh) { world.reset(); }
    accumulator = 0; screen = SCREEN_PLAY;
    announce('Bermain. Misi 1: temui Mira di dermaga selatan.');
  }
  function endGame(kind) {
    saveAll();
    screen = kind === 'win' ? SCREEN_WIN : SCREEN_OVER;
    announce(kind === 'win' ? 'Semua misi selesai!' : 'Game over.');
  }
  function handleActions(actions) {
    if (actions & ACTION_CONFIRM) {
      audio.unlock();
      if (screen === SCREEN_TITLE) startGame(false);
      else if (screen === SCREEN_OVER || screen === SCREEN_WIN) startGame(true);
      else if (screen === SCREEN_PAUSED) screen = SCREEN_PLAY;
    }
    if (actions & ACTION_PAUSE) {
      if (screen === SCREEN_PLAY) { screen = SCREEN_PAUSED; saveAll(); announce('Jeda. Progres tersimpan.'); }
      else if (screen === SCREEN_PAUSED) screen = SCREEN_PLAY;
    }
  }
  function step(actions) {
    const steer = input.steer();
    const acts = {
      enter: !!(actions & ACTION_ENTER),
      attack: !!(actions & ACTION_ATTACK),
      run: input.running(),
    };
    const events = world.step(STEP, steer, acts);
    if (events & EVENT_WASTED) { audio.busted(); endGame('over'); return; }
    if (events & EVENT_BUSTED) { audio.busted(); saveAll(); announce('Tertangkap polisi — denda $100.'); }
    if (events & EVENT_MISSION) { audio.mission(); saveAll(); if (world.state.allDone) { endGame('win'); return; } }
    audio.engine(world.player.inCar ? Math.abs(world.player.speed) / 560 : 0);
    audio.siren(world.state.wanted > 0);
    if (screen === SCREEN_TITLE) return;
  }
  function frame(now) {
    requestAnimationFrame(frame);
    accumulator += Math.min((now - last) / 1000, MAX_FRAME);
    last = now;
    const actions = input.takeActions();
    handleActions(actions);
    if (screen === SCREEN_TITLE || screen === SCREEN_PLAY) {
      let first = true;
      while (accumulator >= STEP && (screen === SCREEN_TITLE || screen === SCREEN_PLAY)) {
        if (screen === SCREEN_TITLE) world.step(STEP, { x: 0, y: 0 }, { enter: false, attack: false, run: false });
        else step(first ? actions : 0);
        first = false;
        accumulator -= STEP;
      }
    } else accumulator = 0;
    renderer.draw(world, screen, best);
  }
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && screen === SCREEN_PLAY) { screen = SCREEN_PAUSED; saveAll(); }
  });
  announce('Neon Harbor. Tekan Spasi atau klik untuk mulai.');
  requestAnimationFrame(frame);
}

if (shot) runShot(shot);
else runGame();
