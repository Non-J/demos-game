import React from 'react';
import { Button, createStyles, makeStyles } from '@material-ui/core';
import type { BoardProps } from 'boardgame.io/react';
import type { GameState } from './Demos';

const useStyles = makeStyles((theme) => createStyles({}));

const GameBoard: React.FunctionComponent<BoardProps<GameState>> = (game) => {
  const styles = useStyles();

  return (
    <React.Fragment>
      {JSON.stringify(game.isActive)}
      {game.G.counter}
      {}
      <Button onClick={() => {
        game.moves.incrementCount();
      }}>Incr</Button>
      <Button onClick={() => {
        game.moves.decrementCount();
      }}>Decr</Button>
      <Button onClick={() => {
        game.moves.endTurn();
      }}>EndT</Button>
    </React.Fragment>
  );
};

export default GameBoard;