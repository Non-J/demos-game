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
      name = generateName(ctx);
    }

    result.push({ name, policy, pointAwards, contribution });
  }

  return result;
};

/**
 * Generate Voting Block Name
 */
export const generateName = (ctx: Ctx): string => {
  const random_name_type = ctx.random?.Number() ?? Math.random();
  if (random_name_type < (1 / 373)) {
    return 'Capite Censi';
  } else if (random_name_type < (23 / 373)) {
    const random = ctx.random?.Number() ?? Math.random();
    return NameTribes[Math.floor(random * NameTribes.length)];
  } else {
    const random_age = ctx.random?.Number() ?? Math.random();
    const random_class = ctx.random?.Number() ?? Math.random();
    const random_unit = ctx.random?.Number() ?? Math.random();
    return `${NameAges[Math.floor(random_age * NameAges.length)]} ${NameClasses[Math.floor(random_class * NameClasses.length)]} ${NameUnits[Math.floor(random_unit * NameUnits.length)]}`;
  }
};

/**
 * Return tuple of [ max contribution, index ]
 */
export const determineElectionWinner = (election: ElectionBlock): [number, number] => {
  return election.contribution.reduce((acc, val, idx) => acc[0] < val ? [val, idx] : acc, [Number.NEGATIVE_INFINITY, -1]);
};

export const NameAges = [
  'Senior', 'Junior',
];

export const NameClasses = [
  'Patrician', 'Equite', 'Plebeian', 'Freedman', 'Slave',
];

export const NameUnits = [
  'Technicians I',
  'Technicians II',
  'Technicians III',
  'Technicians IV',
  'Cavalries I',
  'Cavalries II',
  'Cavalries III',
  'Cavalries IV',
  'Cavalries V',
  'Cavalries VI',
  'Cavalries VII',
  'Cavalries VIII',
  'Cavalries IX',
  'Cavalries X',
  'Cavalries XI',
  'Cavalries XII',
  'Cavalries XIII',
  'Cavalries XIV',
  'Cavalries XV',
  'Cavalries XVI',
  'Cavalries XVII',
  'Cavalries XVIII',
];

export const NameTribes = [
  // Urban
  'Collina Tribe',
  'Esquilina Tribe',
  'Palatina Tribe',
  'Suburana Tribe',
  // Rural
  'Aemilia Tribe',
  'Aniensis Tribe',
  'Arniensis Tribe',
  'Camilia Tribe',
  'Claudia Tribe',
  'Crustumina Tribe',
  'Cornelia Tribe',
  'Fabia Tribe',
  'Falerina Tribe',
  'Galeria Tribe',
  'Horatia Tribe',
  'Lemonia Tribe',
  'Maecia Tribe',
  'Menenia Tribe',
  'Papiria Tribe',
  'Pollia Tribe',
  'Pomptina Tribe',
  'Publilia Tribe',
  'Pupinia Tribe',
  'Quirina Tribe',
  'Romilia Tribe',
  'Sabatina Tribe',
  'Scaptia Tribe',
  'Sergia Tribe',
  'Stellatina Tribe',
  'Terentina Tribe',
  'Tromentina Tribe',
  'Ufentina Tribe',
  'Velina Tribe',
  'Veturia Tribe',
  'Voltinia Tribe',
];
