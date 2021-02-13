import { Server } from 'boardgame.io/server';
import { CountingGame } from '../src/game/Counting';

const server = Server({ games: [CountingGame] });

server.run(9000);
