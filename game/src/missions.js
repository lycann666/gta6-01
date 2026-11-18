// Mission state machine: five story jobs in order. The world owns positions
// and pickups; this module owns which job is active, what its target is, and
// when it completes. Pure logic, no drawing.
import { MISSIONS } from './config.js';
import { dist } from './random.js';

export function createMissions() {
  let index = 0; // 0-based into MISSIONS
  let collected = 0;
  let deliveredCar = null; // car id that must be delivered (mission 2)
  let done = false; // all missions finished
  let toast = '';
  let toastTimer = 0;

  function current() { return done ? null : MISSIONS[index]; }
  function setIndex(i, collect) { index = i; collected = collect || 0; deliveredCar = null; }
  function startEscape(wanted) { /* wanted is set by the world */ return wanted; }

  // Called every step with the live world facts; returns 'complete' when the
  // active mission finishes, else null.
  function update(facts) {
    const m = current();
    if (!m) return null;
    if (m.kind === 'goto') {
      if (m.needCar && !facts.inCar) return null;
      if (dist(facts.px, facts.py, m.target.x, m.target.y) < 70) return complete();
    } else if (m.kind === 'steal-deliver') {
      if (deliveredCar && facts.inCar && facts.carId === deliveredCar &&
          dist(facts.px, facts.py, m.target.x, m.target.y) < 80) return complete();
    } else if (m.kind === 'collect') {
      if (collected >= m.count) return complete();
    } else if (m.kind === 'escape') {
      if (dist(facts.px, facts.py, m.target.x, m.target.y) < 80 && facts.wanted >= 1) return complete();
    }
    return null;
  }
  function complete() {
    const m = current();
    toast = `Misi selesai: ${m.title}  +$${m.reward}`;
    toastTimer = 4;
    index += 1;
    collected = 0; deliveredCar = null;
    if (index >= MISSIONS.length) done = true;
    return { reward: m.reward, title: m.title, done };
  }
  function collectOne() {
    collected += 1;
    const m = current();
    if (m && m.kind === 'collect') toast = `Paket diambil (${collected}/${m.count})`;
    toastTimer = 2.5;
    return collected;
  }
  function setDeliveredCar(id) { deliveredCar = id; }
  function tick(dt) { if (toastTimer > 0) toastTimer -= dt; }
  function objectiveText() {
    const m = current();
    if (!m) return 'Semua misi selesai! Teluk Neon milikmu, Rex.';
    if (m.kind === 'collect') return `Misi ${m.id}: ${m.title} — Paket ${collected}/${m.count}`;
    if (m.kind === 'steal-deliver') return deliveredCar
      ? `Misi ${m.id}: Antar mobil ke garasi Om Bowo`
      : `Misi ${m.id}: Curi sedan biru di utara`;
    return `Misi ${m.id}: ${m.title} — ${m.objective}`;
  }
  function targetPos() {
    const m = current();
    if (!m) return null;
    if (m.kind === 'collect') return null; // pickups are drawn individually
    return m.target || null;
  }
  return { current, setIndex, update, collectOne, setDeliveredCar, tick,
    objectiveText, targetPos, startEscape,
    get index() { return index; }, get collected() { return collected; },
    get done() { return done; }, get deliveredCar() { return deliveredCar; },
    get toast() { return toastTimer > 0 ? toast : ''; },
    set toast(v) { toast = v; toastTimer = 3; } };
}
