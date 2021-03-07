import React  from 'react';
import {
  Box,
  Button, Card, CardContent, Container,
  createStyles,
  Dialog,
  DialogActions,
  DialogTitle, Divider, Grid,
  makeStyles, Paper,
  Typography,
} from '@material-ui/core';
import type { BoardProps } from 'boardgame.io/react';
import type { GameState } from './Demos';
import useClientState from './ClientState';

const useStyles = makeStyles((theme) => createStyles({}));

const GameBoard: React.FunctionComponent<BoardProps<GameState>> = (game) => {
  const styles = useStyles();
  const roomData = useClientState(state => state.cacheRoomData);
  const [isGameOver, setIsGameOver] = React.useState<boolean>(false);
  const [alertOpen, setAlertOpen] = React.useState<boolean>(false);
  const [alertTitle, setAlertTitle] = React.useState<string>('');
  const [alertContent, setAlertContent] = React.useState<string>('');

  if (!isGameOver && game.ctx.gameover) {
    setIsGameOver(true);
    setAlertTitle('Game Over');
    setAlertContent(`${roomData?.players[game.ctx.gameover.winner].name} has won the game.`);
    setAlertOpen(true);
  }

  const Alert = (
    <Dialog open={alertOpen}>
      <DialogTitle>{alertTitle}</DialogTitle>
      <Box m={2}>
        <Typography variant='body2'>{alertContent}</Typography>
      </Box>
      <DialogActions>
        <Button onClick={() => {
          setAlertOpen(false);
        }} variant='contained' color='primary'>OK</Button>
      </DialogActions>
    </Dialog>
  );

  const PlayerList = (
    <Card variant='outlined'>
      <CardContent>
        <Typography variant='h5'>Players</Typography>
        <Divider />
        {
          roomData?.players.map((player, index) => {
            return (
              <React.Fragment>
                <Box paddingY={1}>
                  <Typography variant='body1'>{player.name}</Typography>
                  <Typography variant='body2' color="textSecondary">Points: {game.G.points[index]}</Typography>
                </Box>
                {index !== roomData?.players.length - 1 && <Divider />}
              </React.Fragment>
            );
          })
        }
      </CardContent>
    </Card>
  );

  return (
    <React.Fragment>
      {Alert}

      <Box paddingTop={3}>
        <Container maxWidth='xl'>
          <Grid container spacing={1}>
            <Grid item sm={12} md>
              {PlayerList}
            </Grid>
            <Grid item sm={12} md={7}>
              <Paper>
                <h1>HI</h1>
              </Paper>
            </Grid>
            <Grid item sm={12} md>
              <Paper>
                <h1>HI</h1>
              </Paper>
            </Grid>
          </Grid>
        </Container>
      </Box>


      {/*{JSON.stringify(game.isActive)}*/}
      {/*{JSON.stringify(game.G)}*/}

    </React.Fragment>
  );
};

export default GameBoard;