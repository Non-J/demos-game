import type { Game } from 'boardgame.io';

export interface GameState {
    counter: number
}

export const CountingGame: Game<GameState> = {
    name: 'counting-game',

    setup(ctx, setupData): GameState {
        return {
            counter: 0,
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
                G.counter += 1;
            },
        },
        decrementCount: {
            undoable: true,
            client: true,
            move: (G, ctx) => {
                G.counter -= 1;
            },
        },
    },
};
