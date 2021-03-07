import type { Game } from 'boardgame.io';
import * as GameConstant from './GameConstants';

export interface GameState {
  points: Array<number>
}

export const Demos: Game<GameState> = {
  name: 'demos',

  setup(ctx, setupData): GameState {
    return {
      points: Array(ctx.numPlayers).fill(0),
    };
  },

  moves: {
    endTurn: {
      undoable: false,
      client: false,
      move: (G, ctx) => {
        ctx.events?.endTurn?.();
      },
    },
    incrementCount: {
      undoable: true,
      client: true,
      move: (G, ctx) => {
        G.points[Number(ctx.playerID)] += 1;
      },
    },
    decrementCount: {
      undoable: true,
      client: true,
      move: (G, ctx) => {
        G.points[Number(ctx.playerID)] -= 1;
      },
    },
  },

  endIf(G, ctx) {
    const winner = G.points.findIndex(x => (x >= GameConstant.VictoryConditionPoints));
    if (winner !== -1) {
      return { winner: winner };
    }
  },
};
