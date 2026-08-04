import { PhysicsEngine } from "./PhysicsEngine";

let engine: PhysicsEngine | null = null;

self.onmessage = (e: MessageEvent) => {
  const { type, maxBalls, ballState, input, maxIter, id } = e.data;

  switch (type) {
    case "init": {
      engine = new PhysicsEngine(maxBalls);
      self.postMessage({ type: "initDone", id });
      break;
    }
    case "initialSeparation": {
      if (!engine) engine = new PhysicsEngine(Math.floor(ballState.length / 128));
      engine.initialSeparation(ballState, input, maxIter || 100);
      self.postMessage({ type: "initialSeparationDone", ballState, input, id });
      break;
    }
    case "step": {
      if (!engine) engine = new PhysicsEngine(Math.floor(ballState.length / 128));
      engine.step(ballState, input);
      self.postMessage({ type: "stepDone", ballState, input, id });
      break;
    }
  }
};
