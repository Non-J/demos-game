import { Server } from 'boardgame.io/server';
import { Demos } from '../src/Demos';

const server = Server({ games: [Demos] });

server.run(9000);
