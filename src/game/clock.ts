interface ClockOptions {
  now: () => number;
  requestFrame: (callback: FrameRequestCallback) => number;
  cancelFrame: (id: number) => void;
  onTick: (nowMs: number) => void;
}

export function createClock({ now, requestFrame, cancelFrame, onTick }: ClockOptions) {
  let running = false;
  let generation = 0;
  let frame: number | null = null;

  function schedule(current: number) {
    frame = requestFrame(() => {
      if (current !== generation) return;
      frame = null;
      onTick(now());
      if (current === generation) schedule(current);
    });
  }

  return {
    start() {
      if (running) return;
      running = true;
      schedule(++generation);
    },
    stop() {
      if (!running) return;
      running = false;
      generation++;
      if (frame !== null) cancelFrame(frame);
      frame = null;
    },
  };
}
