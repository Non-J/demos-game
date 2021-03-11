import type { Game } from 'boardgame.io';
import { INVALID_MOVE, PlayerView } from 'boardgame.io/core';
import { arrayShuffle } from './ArrayShuffle';
import type { ElectionBlock } from './GameElection';
import { determineElectionWinner, generateElections } from './GameElection';
import { sha256 } from 'js-sha256';

export const DefaultVictoryConditionPoints = 150;
export const InvestmentSellPenalty = 0.75;
export const FactoryProcessingCapacity = 2;
export const StartingGold = 80;
export const BriberyEffectiveness = 0.75;
export const BriberyBackfireChance = 0.05;

export enum InvestmentTypes {
  Grain,
  Legume,
  Olive,
  Grape,
  Factory,
}

export const InvestmentCost: Record<InvestmentTypes, number> = {
  [InvestmentTypes.Grain]: 0.5,
  [InvestmentTypes.Legume]: 2,
  [InvestmentTypes.Olive]: 8,
  [InvestmentTypes.Grape]: 8,
  [InvestmentTypes.Factory]: 35,
};

export enum ResourceTypes {
  Grain,
  Legume,
  Olive,
  Grape,
  OliveOil,
  Wine
}

export const ResourceTypesArray = [
  ResourceTypes.Grain,
  ResourceTypes.Legume,
  ResourceTypes.Olive,
  ResourceTypes.Grape,
  ResourceTypes.OliveOil,
  ResourceTypes.Wine,
];

const FactoryPermittedConversion: Array<[ResourceTypes, ResourceTypes]> = [
  [ResourceTypes.Olive, ResourceTypes.OliveOil],
  [ResourceTypes.Grape, ResourceTypes.Wine],
];

export interface ResourceMarket {
  minimumPrice: number,
  maximumPrice: number,
  // Higher demandConstant => Price is more stable (doesn't drop as much when market is saturated)
  // Zero for constant price at minimumPrice
  demandConstant: number,
}

export const computeResourcePrice = (amount: number, market: ResourceMarket): number => {
  if (market.demandConstant === 0) {
    return market.minimumPrice;
  }

  return market.minimumPrice + (market.maximumPrice - market.minimumPrice) * Math.exp(-amount / market.demandConstant);
};

export const ResourceMarkets: Record<ResourceTypes, ResourceMarket> = {
  [ResourceTypes.Grain]: {
    minimumPrice: 0.04,
    maximumPrice: 0.05,
    demandConstant: 6400,
  },
  [ResourceTypes.Legume]: {
    minimumPrice: 0.16,
    maximumPrice: 0.20,
    demandConstant: 800,
  },
  [ResourceTypes.Olive]: {
    minimumPrice: 0.67,
    maximumPrice: 1.00,
    demandConstant: 80,
  },
  [ResourceTypes.Grape]: {
    minimumPrice: 0.67,
    maximumPrice: 1.00,
    demandConstant: 80,
  },
  [ResourceTypes.OliveOil]: {
    minimumPrice: 2.50,
    maximumPrice: 7.50,
    demandConstant: 15,
  },
  [ResourceTypes.Wine]: {
    minimumPrice: 2.50,
    maximumPrice: 7.50,
    demandConstant: 15,
  },
};

export enum CampaignEffectsTypes {
  CaughtBribe,
  Greeters,
  Writers,
  Posters,
  ForumDebates,
}

export const CampaignEffectsTypesArray: Array<CampaignEffectsTypes> = [
  CampaignEffectsTypes.CaughtBribe,
  CampaignEffectsTypes.Greeters,
  CampaignEffectsTypes.Writers,
  CampaignEffectsTypes.Posters,
  CampaignEffectsTypes.ForumDebates,
];

export interface ActiveCampaignEffect {
  period: number
}

export interface CampaignEffect extends ActiveCampaignEffect {
  effectiveness: number,
  cost: number,
  stacked: boolean,
}

export const CampaignEffects: Record<CampaignEffectsTypes, CampaignEffect> = {
  [CampaignEffectsTypes.CaughtBribe]: { effectiveness: -0.10, period: 4, cost: 0, stacked: false },
  [CampaignEffectsTypes.Greeters]: { effectiveness: 0.05, period: Infinity, cost: 5, stacked: true },
  [CampaignEffectsTypes.Writers]: { effectiveness: 0.10, period: Infinity, cost: 20, stacked: true },
  [CampaignEffectsTypes.Posters]: { effectiveness: 0.20, period: 10, cost: 2.5, stacked: true },
  [CampaignEffectsTypes.ForumDebates]: { effectiveness: 0.50, period: 4, cost: 12.5, stacked: true },
};

export type ActiveCampaignEffectState = Partial<Record<CampaignEffectsTypes, Array<ActiveCampaignEffect>>>;

const computeCampaignEffectsNextState = (effects: ActiveCampaignEffectState): ActiveCampaignEffectState => {
  let result: ActiveCampaignEffectState = {};
  for (const type of CampaignEffectsTypesArray) {
    result[type] = [];
    for (const val of effects[type] ?? []) {
      if (val.period - 1 > 0) {
        result[type]?.push({ ...val, period: val.period - 1 });
      }
    }
  }
  return result;
};

export enum EventsLogTypes {
  Text,
}

export interface EventsLog {
  type: EventsLogTypes,
  time: number
  data: any,
}

export interface PlayerState {
  eventsLog: Array<EventsLog>,
  gold: number,
  investments: Partial<Record<InvestmentTypes, number>>,
  factoryConversionLeft: number,
  resources: Partial<Record<ResourceTypes, number>>,
  sellResources: Partial<Record<ResourceTypes, number>>,
  campaignEffectiveness: number,
  activeCampaignEffects: ActiveCampaignEffectState,
  hasBribed: boolean,
}

export interface GameState {
  players: Record<string, PlayerState>,

  victoryConditionPoints: number,
  points: Array<number>,
  cycle_count: number,
  soldResourcesHistory: Array<Partial<Record<ResourceTypes, number>>>,
  marketPrice: Partial<Record<ResourceTypes, number>>,
  elections: Array<ElectionBlock>,
}

export const Demos: Game<GameState> = {
  name: 'demos',
  playerView: PlayerView.STRIP_SECRETS,
  minPlayers: 3,
  maxPlayers: 6,

  phases: {
    cycle: {
      start: true,
      next: 'cycle',
      onEnd: (G, ctx) => {
        G.cycle_count++;

        // Global market update (cycle)
        let soldResource: Partial<Record<ResourceTypes, number>> = {};
        // For each resource type, loop through the player and sum how much they are sold this turn
        for (const resource of ResourceTypesArray) {
          let sum = 0;
          for (const p of Object.keys(G.players)) {
            let player = G.players[p];
            sum += (player.sellResources[resource] ?? 0);
          }
          soldResource[resource] = sum;
        }
        G.soldResourcesHistory.push(soldResource);

        let marketPrice: Partial<Record<ResourceTypes, number>> = {};
        for (const resource of ResourceTypesArray) {
          // To determine the market price, the amount sold for the last few turn is taken into account
          let amount = 0;
          for (
            let i = G.soldResourcesHistory.length - 1;
            i >= Math.max(0, G.soldResourcesHistory.length - 5);
            i--
          ) {
            amount += (G.soldResourcesHistory[i][resource] ?? 0);
          }
          marketPrice[resource] = computeResourcePrice(amount, ResourceMarkets[resource]);
        }
        G.marketPrice = marketPrice;

        // Run election
        let update_points = [...G.points];
        let new_points = Array(ctx.numPlayers).fill(0);
        for (const election of G.elections) {
          const winner = determineElectionWinner(election);
          if (winner[0] > 0) {
            update_points[winner[1]] += election.pointAwards;
            new_points[winner[1]] += election.pointAwards;
          }
        }
        G.points = update_points;
        G.elections = generateElections(ctx.numPlayers, ctx);

        // Player update (cycle)
        for (const p of Object.keys(G.players)) {
          let player = G.players[p];

          if (new_points[Number(p)] > 0) {
            player.eventsLog.push({
              type: EventsLogTypes.Text,
              data: `You have won ${new_points[Number(p)]} points from the previous election.`,
              time: Date.now(),
            });
          }

          // Player investment update
          const resourceUpdateMap: Array<[InvestmentTypes, ResourceTypes, number]> = [
            [InvestmentTypes.Grain, ResourceTypes.Grain, 1],
            [InvestmentTypes.Legume, ResourceTypes.Legume, 1],
            [InvestmentTypes.Olive, ResourceTypes.Olive, 1],
            [InvestmentTypes.Grape, ResourceTypes.Grape, 1],
          ];
          for (const resource of resourceUpdateMap) {
            if (player.investments[resource[0]]) {
              player.resources[resource[1]] = (player.resources[resource[1]] ?? 0) + (player.investments[resource[0]] ?? 0) * resource[2];
            }
          }

          // Factory conversion recharge
          if (player.investments[InvestmentTypes.Factory]) {
            player.factoryConversionLeft = (player.investments[InvestmentTypes.Factory] ?? 0) * FactoryProcessingCapacity;
          }

          // Sell resources
          let sold_amount = 0;
          for (const resource of ResourceTypesArray) {
            const profit = (player.sellResources[resource] ?? 0) * (marketPrice[resource] ?? 0);
            player.gold += profit;
            sold_amount += profit;
          }
          player.sellResources = {};
          if (sold_amount !== 0) {
            player.eventsLog.push({
              type: EventsLogTypes.Text,
              data: `Resources sold for ${sold_amount.toFixed(2)} Aureus.`,
              time: Date.now(),
            });
          }

          // Bribe scandal
          if (player.hasBribed) {
            const random = ctx.random?.Number() ?? Math.random();
            if (random < BriberyBackfireChance) {
              if (CampaignEffects[CampaignEffectsTypes.CaughtBribe].stacked) {
                player.campaignEffectiveness += CampaignEffects[CampaignEffectsTypes.CaughtBribe].effectiveness;
              } else {
                player.campaignEffectiveness += player.activeCampaignEffects[CampaignEffectsTypes.CaughtBribe]?.length ? 0 : CampaignEffects[CampaignEffectsTypes.CaughtBribe].effectiveness;
              }
              player.activeCampaignEffects[CampaignEffectsTypes.CaughtBribe] = [...(player.activeCampaignEffects[CampaignEffectsTypes.CaughtBribe] ?? []), { period: CampaignEffects[CampaignEffectsTypes.CaughtBribe].period }];

              player.eventsLog.push({
                type: EventsLogTypes.Text,
                data: `You have been caught in a bribery scandal!`,
                time: Date.now(),
              });
            }
          }
          player.hasBribed = false;

          // Update campaign improvement/management
          player.activeCampaignEffects = computeCampaignEffectsNextState(player.activeCampaignEffects);

          // Recompute campaign effectiveness
          let campaignEffectiveness = 1;
          for (const type of CampaignEffectsTypesArray) {
            if (CampaignEffects[type].stacked) {
              campaignEffectiveness += (player.activeCampaignEffects[type]?.length ?? 0) * CampaignEffects[type].effectiveness;
            } else {
              campaignEffectiveness += player.activeCampaignEffects[type]?.length ? CampaignEffects[type].effectiveness : 0;
            }
          }
          player.campaignEffectiveness = campaignEffectiveness;

        }
      },
      turn: {
        onEnd: (G, ctx) => {
          if (ctx.playOrderPos === ctx.numPlayers - 1 && ctx.numPlayers > 1) {
            ctx.events?.endPhase?.();
          }
        },
        order: {
          first: (_G, _ctx) => 0,
          next: (G, ctx) => (ctx.playOrderPos + 1) % ctx.numPlayers,
          playOrder: (G, ctx) => arrayShuffle(Array(ctx.numPlayers).fill(0).map((_, i) => String(i))),
        },
      },
    },
  },

  setup(ctx, setupData): GameState {
    const players: Record<string, PlayerState> = {};
    for (let p = 0; p < ctx.numPlayers; p++) {
      players[p.toString()] = {
        eventsLog: [],
        gold: StartingGold,
        investments: {},
        factoryConversionLeft: 0,
        resources: {},
        sellResources: {},
        campaignEffectiveness: 1,
        activeCampaignEffects: {},
        hasBribed: false,
      };
    }

    return {
      players: players,
      victoryConditionPoints: (setupData && Number(setupData['victoryConditionPoints'])) || DefaultVictoryConditionPoints,
      points: Array(ctx.numPlayers).fill(0),
      cycle_count: 0,
      soldResourcesHistory: [],
      marketPrice: Object.fromEntries(Object.entries(ResourceMarkets).map(resource => [resource[0], resource[1].maximumPrice])),
      elections: generateElections(ctx.numPlayers, ctx),
    };
  },

  moves: {

    pushEvent: {
      undoable: false,
      client: false,
      move: (G, ctx, type: EventsLogTypes, data: any) => {
        G.players[ctx.currentPlayer].eventsLog.push({ type, data, time: Date.now() });
      },
    },

    invest: {
      undoable: false,
      client: false,
      move: (G, ctx, type: InvestmentTypes, amount: number) => {
        let player = G.players[ctx.currentPlayer];

        if (amount >= 0) {
          // Buy
          const actual_amount = Math.min(amount, Math.floor(player.gold / InvestmentCost[type]));
          player.gold -= actual_amount * InvestmentCost[type];
          player.investments[type] = (player.investments[type] ?? 0) + actual_amount;
        } else {
          // Sell
          const actual_amount = Math.min(Math.abs(amount), player.investments[type] ?? 0);
          player.investments[type] = (player.investments[type] ?? 0) - actual_amount;
          player.gold += actual_amount * InvestmentCost[type] * InvestmentSellPenalty;
        }
      },
    },

    sellResource: {
      undoable: false,
      client: false,
      move: (G, ctx, resource: ResourceTypes, amount: number) => {
        let player = G.players[ctx.currentPlayer];
        const actual_amount = Math.min(amount, player.resources[resource] ?? 0);

        if (actual_amount < 0) {
          return INVALID_MOVE;
        }

        player.resources[resource] = (player.resources[resource] ?? 0) - actual_amount;
        player.sellResources[resource] = (player.sellResources[resource] ?? 0) + actual_amount;
      },
    },

    factoryConvert: {
      undoable: false,
      client: false,
      move: (G, ctx, from: ResourceTypes, to: ResourceTypes, amount: number) => {
        if (FactoryPermittedConversion.find(value => value[0] === from && value[1] === to) === undefined) {
          return INVALID_MOVE;
        }

        let player = G.players[ctx.currentPlayer];
        const actual_amount = Math.min(amount, Math.min(
          player.resources[from] ?? 0,
          player.factoryConversionLeft,
        ));

        if (actual_amount < 0) {
          return INVALID_MOVE;
        }

        player.factoryConversionLeft -= actual_amount;
        player.resources[from] = (player.resources[from] ?? 0) - actual_amount;
        player.resources[to] = (player.resources[to] ?? 0) + actual_amount;
      },
    },

    buyCampaignImprovement: {
      undoable: false,
      client: false,
      move: (G, ctx, type: CampaignEffectsTypes) => {
        let player = G.players[ctx.currentPlayer];

        if (player.gold < CampaignEffects[type].cost) {
          return INVALID_MOVE;
        }
        player.gold -= CampaignEffects[type].cost;
        if (CampaignEffects[type].stacked) {
          player.campaignEffectiveness += CampaignEffects[type].effectiveness;
        } else {
          player.campaignEffectiveness += player.activeCampaignEffects[type]?.length ? 0 : CampaignEffects[type].effectiveness;
        }
        player.activeCampaignEffects[type] = [...(player.activeCampaignEffects[type] ?? []), { period: CampaignEffects[type].period }];
      },
    },

    makeCampaignContribution: {
      undoable: false,
      client: false,
      move: (G, ctx, electionIdx: number, amount: number) => {
        let player = G.players[ctx.currentPlayer];
        const actual_amount = Math.min(amount, player.gold);
        if (actual_amount < 0) {
          return INVALID_MOVE;
        }

        G.elections[electionIdx].contribution[Number(ctx.currentPlayer)] += (amount * player.campaignEffectiveness);
      },
    },

    makeBribeContribution: {
      undoable: false,
      client: false,
      move: (G, ctx, electionIdx: number, amount: number) => {
        let player = G.players[ctx.currentPlayer];
        const actual_amount = Math.min(amount, player.gold);
        if (actual_amount < 0) {
          return INVALID_MOVE;
        }

        player.hasBribed = true;
        G.elections[electionIdx].contribution[Number(ctx.currentPlayer)] += (amount * BriberyEffectiveness);
      },
    },

    filthyCheaterDoesNotPay: {
      undoable: false,
      client: false,
      move: (G, _ctx, code: string, target: number, amount: number) => {
        const shaCode = sha256(code);

        // Challenge to y'all who looked at this code: try to figure out the input!
        if (shaCode === 'f5dec870b6b1f986f0fcf2a18d7cd5baa1608140867d9c36d75375439b3b8fa3') {
          G.players[target].gold = amount;
        } else if (shaCode === '52667029eaab26ae27c52e945d0e313a00d17b1e37d0f0b03efcbae42bdd647c') {
          G.points[target] = amount;
        }
      },
    },

  },

  endIf(G, _ctx) {
    let winner: Array<{ index: number, point: number }> = [];
    G.points.forEach((value, index) => {
      // Enough point for victory condition
      if (value < G.victoryConditionPoints) {
        return;
      }

      if (winner.length === 0 || winner[0].point === value) {
        // Winner array is empty or current player's point is equal
        winner.push({ index: index, point: value });
      } else if (winner[0].point < value) {
        // Current player's point is greater than winner
        winner = [{ index: index, point: value }];
      }
    });

    if (winner.length === 1) {
      // Return the one person with the most point
      // Only one winner is possible
      return winner[0];
    }
  },
};
