import { expect, it } from 'vitest';
import { createClock } from '../src/game/clock';

it('cancels a pending frame and ignores its callback after a restart', () => {
  const callbacks: FrameRequestCallback[] = [];
  const canceled: number[] = [];
  const ticks: number[] = [];
  const clock = createClock({
    now: () => 42,
    requestFrame: callback => callbacks.push(callback),
    cancelFrame: id => { canceled.push(id); },
    onTick: now => { ticks.push(now); },
  });
  clock.start();
  clock.start();
  expect(callbacks).toHaveLength(1);
  clock.stop();
  clock.start();
  callbacks[0](0);
  expect(canceled).toEqual([1]);
  expect(ticks).toEqual([]);
  callbacks[1](0);
  expect(ticks).toEqual([42]);
  expect(callbacks).toHaveLength(3);
});

it('schedules no new frame if a tick stops the clock', () => {
  const callbacks: FrameRequestCallback[] = [];
  const clock = createClock({
    now: () => 42,
    requestFrame: callback => callbacks.push(callback),
    cancelFrame: () => {},
    onTick: () => { clock.stop(); },
  });
  clock.start();
  callbacks[0](0);
  expect(callbacks).toHaveLength(1);
});
