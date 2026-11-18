// Screenshot scenes behind ?shot=start|play|chase|mission. Each one drives the
// real simulation forward from a fresh world with a scripted autopilot, so the
// frame is what real play looks like and the same seed always gives the same
// frame. Sets window.__shotReady when painted.
import { STEP } from './config.js';
import { SCREEN_PLAY, SCREEN_TITLE } from './render.js';

function driveToward(world, tx, ty, seconds) {
  const steps = Math.round(seconds / STEP);
  let stuck = 0; let reversing = 0;
  for (let i = 0; i < steps; i++) {
    const p = world.player;
    // Steer the car (or walk) toward the target with a simple controller.
    let steer = { x: 0, y: 0 };
    if (p.inCar) {
      const car = p.inCar;
      if (Math.abs(car.speed) < 25) stuck += 1; else stuck = 0;
      if (stuck > 20) { reversing = 45; stuck = 0; } // wedged: back out
      if (reversing > 0) { reversing -= 1; steer = { x: -1, y: 1 }; }
      else {
        const want = Math.atan2(ty - car.y, tx - car.x);
        let d = want - car.angle;
        while (d > Math.PI) d -= Math.PI * 2;
        while (d < -Math.PI) d += Math.PI * 2;
        steer = { x: d > 0.15 ? 1 : d < -0.15 ? -1 : 0, y: -1 };
      }
    } else {
      const dx = tx - p.x; const dy = ty - p.y;
      steer = { x: Math.abs(dx) > 20 ? Math.sign(dx) : 0, y: Math.abs(dy) > 20 ? Math.sign(dy) : 0 };
    }
    world.step(STEP, steer, { enter: false, attack: false, run: false });
  }
}

export function stageShot(name, world) {
  world.reset();
  if (name === 'play') {
    // Enter the nearest parked car, then drive along a road with traffic.
    const car = world.nearestCar(4000);
    if (car) world.enterCar(car);
    driveToward(world, 2700, 540, 12);
    return { screen: SCREEN_PLAY, best: 0 };
  }
  if (name === 'chase') {
    const car = world.nearestCar(4000);
    if (car) world.enterCar(car);
    world.addWanted(3);
    driveToward(world, 900, 1260, 10);
    return { screen: SCREEN_PLAY, best: 0 };
  }
  if (name === 'mission') {
    // Mission 2 in progress: steal the blue sedan, drive toward the garage.
    world.missions.setIndex(1, 0);
    const blue = world.cars.find((c) => c.missionCar);
    if (blue) { world.player.x = blue.x - 30; world.player.y = blue.y; world.enterCar(blue); }
    // Drive along the roads, not diagonally through blocks: west on the
    // northern road, then south on the garage's road.
    driveToward(world, 540, 180, 5);
    driveToward(world, 480, 480, 5);
    return { screen: SCREEN_PLAY, best: 0 };
  }
  // start (default): title screen over a living city backdrop.
  for (let i = 0; i < Math.round(5 / STEP); i++) world.step(STEP, { x: 0, y: 0 }, { enter: false, attack: false, run: false });
  return { screen: SCREEN_TITLE, best: 0 };
}
