import type { Ctx } from 'boardgame.io';

export enum ElectionBlockPolicy {
  Private,
  Public,
  PublicWithBribe,
}

export interface ElectionBlock {
  name: string,
  policy: ElectionBlockPolicy,
  pointAwards: number,
  contribution: Array<number>,
}

export const generateElections = (amount: number, ctx: Ctx): Array<ElectionBlock> => {
  let result: Array<ElectionBlock> = [];

  for (let i = 0; i < amount; i++) {
    const random_policy = ctx.random?.Number() ?? Math.random();
    const policy = random_policy < 0.5 ? ElectionBlockPolicy.Private : ElectionBlockPolicy.Public;
    const pointAwards = random_policy < (8 / 15) ? 1 : random_policy < (12 / 15) ? 2 : random_policy < (14 / 15) ? 3 : 4;
    const contribution = Array(ctx.numPlayers).fill(0);

    let name = '';
    while (name === '' || result.find(value => value.name === name) !== undefined) {
      const random = ctx.random?.Number() ?? Math.random();
      name = ElectionBlockNames[Math.floor(random * ElectionBlockNames.length)];
    }

    result.push({ name, policy, pointAwards, contribution });
  }

  return result;
};

/**
 * Return tuple of [ max contribution, index ]
 */
export const determineElectionWinner = (election: ElectionBlock): [number, number] => {
  return election.contribution.reduce((acc, val, idx) => acc[0] < val ? [val, idx] : acc, [Number.NEGATIVE_INFINITY, -1]);
};

export const ElectionBlockNames = [
  'A',
  'B',
  'C',
  'D',
  'E',
  'F',
  'G',
];
