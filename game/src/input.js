// Keyboard + mouse input. Held keys steer; one-shot presses (enter car, punch,
// shoot, pause, confirm) are queued as flags and taken once by the loop.
export const ACTION_CONFIRM = 1;
export const ACTION_PAUSE = 2;
export const ACTION_ENTER = 4;
export const ACTION_ATTACK = 8;
export const ACTION_MISSION = 16;

const UP = new Set(['ArrowUp', 'KeyW']);
const DOWN = new Set(['ArrowDown', 'KeyS']);
const LEFT = new Set(['ArrowLeft', 'KeyA']);
const RIGHT = new Set(['ArrowRight', 'KeyD']);
const RUN = new Set(['ShiftLeft', 'ShiftRight']);
const CONFIRM = new Set(['Space', 'Enter']);
const PAUSE = new Set(['KeyP', 'Escape']);
const ENTER = new Set(['KeyE']);
const ATTACK = new Set(['KeyF', 'KeyJ']);
const MISSION = new Set(['KeyM', 'KeyTab']);

export function createInput(canvas) {
  const held = new Set();
  let actions = 0;
  let mouseX = 0; let mouseY = 0; let mouseDown = false;
  const ALL = [...UP, ...DOWN, ...LEFT, ...RIGHT, ...RUN, ...CONFIRM, ...PAUSE, ...ENTER, ...ATTACK, ...MISSION];
  function onKey(e, down) {
    if (ALL.includes(e.code)) e.preventDefault();
    if (down) {
      held.add(e.code);
      if (!e.repeat) {
        if (CONFIRM.has(e.code)) actions |= ACTION_CONFIRM;
        else if (PAUSE.has(e.code)) actions |= ACTION_PAUSE;
        else if (ENTER.has(e.code)) actions |= ACTION_ENTER;
        else if (ATTACK.has(e.code)) actions |= ACTION_ATTACK;
        else if (MISSION.has(e.code)) actions |= ACTION_MISSION;
      }
    } else held.delete(e.code);
  }
  window.addEventListener('keydown', (e) => onKey(e, true));
  window.addEventListener('keyup', (e) => onKey(e, false));
  window.addEventListener('blur', () => held.clear());
  canvas.addEventListener('pointerdown', (e) => { mouseDown = true; mouseX = e.clientX; mouseY = e.clientY; actions |= ACTION_CONFIRM; });
  canvas.addEventListener('pointermove', (e) => { mouseX = e.clientX; mouseY = e.clientY; });
  window.addEventListener('pointerup', () => { mouseDown = false; });
  const has = (set) => [...set].some((c) => held.has(c));
  return {
    steer() {
      return { x: (has(RIGHT) ? 1 : 0) - (has(LEFT) ? 1 : 0), y: (has(DOWN) ? 1 : 0) - (has(UP) ? 1 : 0) };
    },
    running() { return has(RUN); },
    mouse() { return { x: mouseX, y: mouseY, down: mouseDown }; },
    takeActions() { const t = actions; actions = 0; return t; },
  };
}
