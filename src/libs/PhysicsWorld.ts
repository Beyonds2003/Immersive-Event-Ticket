import { PhysicsEngine, SpatialGrid } from "./PhysicsEngine";

export { SpatialGrid };

export class PhysicsWorld {
  private _maxBalls: number;
  private _worker: Worker | null = null;
  private _fallbackEngine: PhysicsEngine | null = null;
  private _isStepping = false;
  private _activeState: Float32Array | null = null;
  private _activeInput: Float32Array | null = null;
  private _pendingStep: { ballState: Float32Array; input: Float32Array } | null = null;
  private _stepId = 0;
  private _isReady = false;
  private _readyCallbacks: (() => void)[] = [];

  constructor(maxBalls: number, onReady?: () => void) {
    this._maxBalls = maxBalls;
    if (onReady) {
      this._readyCallbacks.push(onReady);
    }

    if (typeof Worker !== "undefined") {
      try {
        this._worker = new Worker(
          new URL("./physics.worker.ts", import.meta.url),
          { type: "module" }
        );

        this._worker.onmessage = (e: MessageEvent) => {
          const { type, ballState, input } = e.data;
          if (type === "initDone") {
            this._isReady = true;
            this._notifyReady();
            return;
          }
          if (type === "stepDone") {
            if (this._activeState && ballState) {
              this._activeState.set(ballState);
            }
            if (this._activeInput && input) {
              // Copy stats / timers back to main thread input buffer
              this._activeInput[23] = input[23];
              this._activeInput[24] = input[24];
              this._activeInput[25] = input[25];
              this._activeInput[26] = input[26];
              this._activeInput[27] = input[27];
            }
            this._isStepping = false;

            if (this._pendingStep && this._worker) {
              const pending = this._pendingStep;
              this._pendingStep = null;
              this._dispatchStep(pending.ballState, pending.input);
            }
          }
        };

        this._worker.postMessage({ type: "init", maxBalls });
      } catch (err) {
        console.warn("Failed to create physics worker, falling back to sync engine", err);
        this._worker = null;
        this._fallbackEngine = new PhysicsEngine(maxBalls);
        this._isReady = true;
        this._notifyReady();
      }
    } else {
      this._fallbackEngine = new PhysicsEngine(maxBalls);
      this._isReady = true;
      this._notifyReady();
    }
  }

  get isReady(): boolean {
    return this._isReady;
  }

  onReady(cb: () => void): void {
    if (this._isReady) {
      cb();
    } else {
      this._readyCallbacks.push(cb);
    }
  }

  private _notifyReady(): void {
    this._readyCallbacks.forEach((cb) => cb());
    this._readyCallbacks = [];
  }

  step(ballState: Float32Array, input: Float32Array): void {
    if (this._fallbackEngine) {
      this._fallbackEngine.step(ballState, input);
      return;
    }

    if (this._worker) {
      if (!this._isStepping) {
        this._dispatchStep(ballState, input);
      } else {
        // Worker is currently busy, queue the latest state/input references
        this._pendingStep = { ballState, input };
      }
    }
  }

  initialSeparation(
    ballState: Float32Array,
    input: Float32Array,
    maxIter = 100
  ): void {
    if (!this._fallbackEngine) {
      this._fallbackEngine = new PhysicsEngine(this._maxBalls);
    }
    this._fallbackEngine.initialSeparation(ballState, input, maxIter);
  }

  terminate(): void {
    if (this._worker) {
      this._worker.terminate();
      this._worker = null;
    }
    this._fallbackEngine = null;
    this._activeState = null;
    this._activeInput = null;
    this._pendingStep = null;
  }

  private _dispatchStep(ballState: Float32Array, input: Float32Array): void {
    if (!this._worker) return;
    this._isStepping = true;
    this._activeState = ballState;
    this._activeInput = input;

    this._worker.postMessage({
      type: "step",
      ballState,
      input,
      id: ++this._stepId,
    });
  }
}
