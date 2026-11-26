import { readFileSync, readdirSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { FLAGS } from '../src/catalog/flags';
import { generateRound, RoundConfigurationError } from '../src/game/generateRound';
import { createRng } from '../src/game/random';

// ISO alpha-2 codes for the UN member-state roster.
const memberIds = `
ad ae af ag al am ao ar at au az ba bb bd be bf bg bh bi bj bn bo br bs bt bw by bz
ca cd cf cg ch ci cl cm cn co cr cu cv cy cz de dj dk dm do dz ec ee eg er es et
fi fj fm fr ga gb gd ge gh gm gn gq gr gt gw gy hn hr ht hu id ie il in iq ir is it
jm jo jp ke kg kh ki km kn kp kr kw kz la lb lc li lk lr ls lt lu lv ly
ma mc md me mg mh mk ml mm mn mr mt mu mv mw mx my mz na ne ng ni nl no np nr nz
om pa pe pg ph pk pl pt pw py qa ro rs ru rw sa sb sc sd se sg si sk sl sm sn so sr
ss st sv sy sz td tg th tj tl tm tn to tr tt tv tz ua ug us uy uz vc ve vn vu ws
ye za zm zw
`.trim().split(/\s+/);

describe('round generation', () => {
  it('preserves the study, board and equivalence constraints over 1,000 seeds', () => {
    const groups = new Map(FLAGS.map(flag => [flag.id, flag.equivalenceGroup]));
    const seen = new Set<string>();
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
      union.forEach(id => seen.add(id));
    }
    expect([...seen].sort()).toEqual(memberIds);
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

  it('has exactly the 193 UN member flags, with distinct descriptions and local artwork', () => {
    expect(FLAGS).toHaveLength(193);
    expect(FLAGS.map(flag => flag.id).sort()).toEqual(memberIds);
    expect(new Set(FLAGS.map(flag => flag.description)).size).toBe(FLAGS.length);
    expect(readdirSync('public/flags').sort()).toEqual(FLAGS.map(flag => `${flag.id}.svg`).sort());
    for (const flag of FLAGS) {
      const svg = readFileSync(`public/${flag.assetPath}`, 'utf8');
      expect(svg).toMatch(/<svg\b[^>]*(viewBox|width)=/);
    }
  });

  it.each([['td', 'ro'], ['id', 'mc'], ['lu', 'nl'], ['ni', 'sv']])(
    'treats the visually similar %s and %s as one selection group', (first, second) => {
      const firstFlag = FLAGS.find(flag => flag.id === first);
      const secondFlag = FLAGS.find(flag => flag.id === second);
      expect(firstFlag).toBeDefined();
      expect(secondFlag).toBeDefined();
      expect(firstFlag?.equivalenceGroup).toBe(secondFlag?.equivalenceGroup);
    },
  );
});
