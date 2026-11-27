// Free Range — tuning constants. Distances are in metres, speeds in m/s,
// heights in pixels relative to the ground line.

export const CFG = {
  gateDistance: 1200,      // metres from the coop to the open gate
  startSpeed: 7.5,         // m/s when the run begins
  maxSpeed: 15.5,          // m/s flat out near the gate
  accelTime: 95,           // seconds to go from start to max speed
  gravity: 2100,           // px/s^2
  jumpVel: 880,            // px/s first jump
  flapVel: 760,            // px/s second jump (the flap)
  duckTime: 0.0,           // ducking is held, not timed
  turkeyX: 0.30,           // turkey's screen position, fraction of width
  groundFrac: 0.78,        // ground line, fraction of height
  feathers: 3,             // hits the turkey can take
  invulnTime: 1.4,         // seconds of grace after a hit
  stumbleTime: 0.85,       // seconds of slow-down after a hit
  cornScore: 25,
  goldScore: 100,
  metreScore: 1,           // points per metre run
};

export const COL = {
  skyTop: '#2e4a7a',
  skyMid: '#7fa8c9',
  skyLow: '#f7c873',
  sun: '#ffd977',
  hillFar: '#5d7a52',
  hillNear: '#476b3d',
  fieldFar: '#8aa653',
  ground: '#6f9e4a',
  groundDark: '#5c8a3e',
  dirt: '#8a6a44',
  fence: '#a9805a',
  fenceDark: '#7d5c3c',
  hay: '#e8c766',
  hayDark: '#c9a43f',
  mud: '#6d5136',
  branch: '#5a4632',
  leaf: '#4d7a38',
  corn: '#ffd83d',
  cornDark: '#e0a81e',
  gold: '#ffb400',
  body: '#8a5a33',
  bodyDark: '#6e4525',
  wing: '#a9713f',
  tail: '#b3814d',
  tailTip: '#e8d9b0',
  neck: '#7a4e2c',
  head: '#8a5a33',
  beak: '#f2a81d',
  wattle: '#d84040',
  eye: '#1c1410',
  leg: '#e08a2e',
  ink: '#2b1c10',
  paper: '#fff6e0',
};
