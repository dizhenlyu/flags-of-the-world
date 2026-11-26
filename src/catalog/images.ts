import type { FlagId, Round } from '../game/types';
import { FLAGS_BY_ID } from './flags';

export function flagFor(id: FlagId) {
  const flag = FLAGS_BY_ID.get(id);
  if (!flag) throw new Error(`Unknown flag: ${id}`);
  return flag;
}

export function flagUrl(id: FlagId) {
  return `${import.meta.env.BASE_URL}${flagFor(id).assetPath}`;
}

export async function preloadRound(round: Round): Promise<Map<FlagId, HTMLImageElement>> {
  const ids = new Set([...round.study, ...round.board]);
  const images = await Promise.all([...ids].map(async id => {
    const image = new Image();
    image.className = 'flag';
    image.draggable = false;
    image.src = flagUrl(id);
    await image.decode();
    return [id, image] as const;
  }));
  return new Map(images);
}
