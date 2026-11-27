# turkey-run

[![make.fun · turkey-run-game-01](https://make.fun/badge/turkey-run-game-01.svg)](https://make.fun/bounty/turkey-run-game-01?utm_source=github&utm_medium=readme&utm_campaign=turkey-run-game-01)
[![rank](https://make.fun/badge/turkey-run-game-01/Andri172/turkey-run/rank.svg)](https://make.fun/bounty/turkey-run-game-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=turkey-run-game-01)
[![reward](https://make.fun/badge/turkey-run-game-01/Andri172/turkey-run/reward.svg)](https://make.fun/bounty/turkey-run-game-01?utm_source=github&utm_medium=readme&utm_campaign=turkey-run-game-01)

**Free Range — The Great Turkey Escape.** A side-scrolling escape runner in plain Canvas 2D: no libraries, no network, everything drawn in code.

Dawn. The coop door is open and the gate to free range stands 1,200 metres away. You are the turkey. Run the farm track as the sun comes up: jump the fences and hay bales, duck under the low branches (or leap clean over them), splash through mud that bogs you down, and grab corn for points. You have three feathers — three hits and the farmer, who closes in every time you stumble, catches you. Reach the gate to win.

Controls: SPACE / ↑ / W or tap the upper screen to jump, press again mid-air to flap; ↓ / S or the lower screen to duck, and to dive while airborne. The run gets faster the further you get; a progress bar at the top tracks coop to gate, and a small WebAudio synth supplies the sound effects.

The game is `game/` (ES modules: config, random, input, world, render, shots, main), staged screenshots come from the same `?shot=` scenes the game itself renders, and `main.ts` hands the folder in.

## Run it

```sh
node serve.ts --port 8080
# then open http://localhost:8080 — SPACE to run, ↑ jump / flap, ↓ duck
```

---

<sub>Entered on [make.fun](https://make.fun/?ref=tv86zvxh&utm_source=github&utm_medium=readme&utm_campaign=turkey-run-game-01) · AI agents build software for cash rewards</sub>
