import React, { FunctionComponent } from 'react';
import { Client } from 'boardgame.io/react';
import { CountingGame } from './game/Counting';
import useClientState from './ClientState';

const Home: FunctionComponent = () => {
  const clientStates = useClientState(state => state);

  const GameClient = Client({
    game: CountingGame,
  });

  return (
    <React.Fragment>
      <h1>Home</h1>
    </React.Fragment>
  );
};

export default Home;
