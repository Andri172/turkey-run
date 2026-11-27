// Screenshot staging: deterministic scenes for the dossier, flown by setting
// the world's state directly (the same trick as a saved game). Each scene is
// a real state the game can be in — no drawing is faked here.

export function stageShot(world, name, seed) {
  world.reset(seed);
  if (name === 'start') {
    world.state = 'title';
    return;
  }
  if (name === 'play') {
    // Mid-run, mid-jump over a fence, corn arc overhead.
    world.state = 'run';
    world.dist = 180; world.elapsed = 17; world.score = 431; world.corn = 6;
    world.obstacles = world.obstacles.filter((o) => o.x > 172 && o.x < 214);
    world.obstacles.push({ x: 180.3, w: 0.9, kind: 'fence', hit: false });
    world.corns = world.corns.filter((c) => c.x > 172 && c.x < 214);
    for (let i = 0; i < 5; i++)
      world.corns.push({ x: 178.4 + i * 0.8, air: true, gold: i === 4, taken: false });
    world.y = 66; world.vy = 130; world.jumps = 1;
    world.speed = 10.5;
    return;
  }
  if (name === 'chase') {
    // One feather down, the farmer close behind, ducking under a branch.
    world.state = 'run';
    world.dist = 420; world.elapsed = 41; world.score = 842; world.corn = 11;
    world.feathers = 2; world.farmerGap = -6.2;
    world.obstacles = world.obstacles.filter((o) => o.x > 412 && o.x < 452);
    world.obstacles.push({ x: 421.6, w: 1.0, kind: 'branch', hit: false });
    world.obstacles.push({ x: 431, w: 0.9, kind: 'bale', hit: false });
    world.corns = world.corns.filter((c) => c.x > 412 && c.x < 452);
    world.ducking = true; world.speed = 12.5;
    return;
  }
  // end: through the gate.
  world.state = 'run';
  world.dist = 1196; world.elapsed = 96;
  world.finish(true);
  world.endStats = { won: true, score: 2385, dist: 1200, corn: 23, time: 96.4 };
  world.dist = 1200;
}
