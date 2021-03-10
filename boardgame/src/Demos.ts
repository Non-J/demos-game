import type { Game } from 'boardgame.io';
import { INVALID_MOVE, PlayerView } from 'boardgame.io/core';
import { arrayShuffle } from './ArrayShuffle';

export const DefaultVictoryConditionPoints = 150;
export const InvestmentSellPenalty = 0.75;
export const FactoryProcessingCapacity = 2;
export const StartingGold = 50;

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
  [InvestmentTypes.Factory]: 34,
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
    minimumPrice: 1.00,
    maximumPrice: 4.00,
    demandConstant: 15,
  },
  [ResourceTypes.Wine]: {
    minimumPrice: 1.00,
    maximumPrice: 4.00,
    demandConstant: 15,
  },
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
}

export interface GameState {
  players: Record<string, PlayerState>,

  victoryConditionPoints: number,
  points: Array<number>,
  cycle_count: number,
  soldResourcesHistory: Array<Partial<Record<ResourceTypes, number>>>,
  marketPrice: Partial<Record<ResourceTypes, number>>,
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
      onEnd: (G, _ctx) => {
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

        // Player update (cycle)
        for (const p of Object.keys(G.players)) {
          let player = G.players[p];

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
      };
    }

    return {
      players: players,
      victoryConditionPoints: (setupData && Number(setupData['victoryConditionPoints'])) || DefaultVictoryConditionPoints,
      points: Array(ctx.numPlayers).fill(0),
      cycle_count: 0,
      soldResourcesHistory: [],
      marketPrice: Object.fromEntries(Object.entries(ResourceMarkets).map(resource => [resource[0], resource[1].maximumPrice])),
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
