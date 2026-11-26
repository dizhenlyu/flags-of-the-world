import { readFileSync, readdirSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { FLAGS } from '../src/catalog/flags';
import { generateRound, RoundConfigurationError } from '../src/game/generateRound';
import { createRng } from '../src/game/random';

describe('round generation', () => {
  it('preserves the study, board and equivalence constraints over 1,000 seeds', () => {
    const groups = new Map(FLAGS.map(flag => [flag.id, flag.equivalenceGroup]));
    for (let seed = 0; seed < 1_000; seed++) {
      const round = generateRound(FLAGS, createRng(String(seed)));
      expect(new Set(round.study).size).toBe(10);
      expect(round.study).toHaveLength(10);
      expect(new Set(round.board).size).toBe(25);
      expect(round.board).toHaveLength(25);
      expect(round.targets).toHaveLength(5);
      expect(round.board.filter(id => round.study.includes(id)).sort())
        .toEqual([...round.targets].sort());
      const union = new Set([...round.study, ...round.board]);
      expect([...union].every(id => groups.has(id))).toBe(true);
      expect(new Set([...union].map(id => groups.get(id))).size).toBe(30);
    }
  });

  it('repeats the same seeded round across separate generators', () => {
    const first = generateRound(FLAGS, createRng('same-seed'));
    expect(generateRound(FLAGS, createRng('same-seed'))).toEqual(first);
    expect(generateRound(FLAGS, createRng('another-seed'))).not.toEqual(first);
  });

  it('rejects duplicate IDs and catalogs with fewer than 30 distinct groups', () => {
    expect(() => generateRound([...FLAGS, FLAGS[0]], createRng('duplicate')))
      .toThrow(RoundConfigurationError);
    expect(() => generateRound(FLAGS.map(flag => ({ ...flag, equivalenceGroup: 'shared' })), createRng('small')))
      .toThrow(RoundConfigurationError);
  });

  it('has at least 60 registered SVGs with distinct visual descriptions and intrinsic dimensions', () => {
    expect(FLAGS.length).toBeGreaterThanOrEqual(60);
    expect(new Set(FLAGS.map(flag => flag.description)).size).toBe(FLAGS.length);
    expect(readdirSync('public/flags').sort()).toEqual(FLAGS.map(flag => `${flag.id}.svg`).sort());
    for (const flag of FLAGS) {
      const svg = readFileSync(`public/${flag.assetPath}`, 'utf8');
      expect(svg).toMatch(/<svg\b[^>]*(viewBox|width)=/);
    }
  });
});
