import React from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Container,
  createStyles,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Divider,
  Grid,
  makeStyles,
  Typography,
} from '@material-ui/core';
import type { BoardProps } from 'boardgame.io/react';
import type { GameState, PlayerState } from './Demos';
import { EventsLogTypes, InvestmentCost, InvestmentSellPenalty, InvestmentTypes, ResourceTypes } from './Demos';
import useClientState from './ClientState';

const InvestmentTypesText: Array<[InvestmentTypes, string, string]> = [
  [InvestmentTypes.Grain, 'Grain Farm', '‍🌾🚜'],
  [InvestmentTypes.Legume, 'Legume Farm', '‍🥜🚜'],
  [InvestmentTypes.Grape, 'Grape Farm', '🍇🚜'],
  [InvestmentTypes.Olive, 'Olive Farm', '🚜'],
  [InvestmentTypes.Factory, 'Factory', '🏭'],
];

const ResourceTypesText: Array<[ResourceTypes, string, string]> = [
  [ResourceTypes.Grain, 'Grain', '🌾'],
  [ResourceTypes.Legume, 'Legume', '🥜'],
  [ResourceTypes.Grape, 'Grape', '🍇'],
  [ResourceTypes.Wine, 'Wine', '🍷'],
  [ResourceTypes.Olive, 'Olive', ''],
  [ResourceTypes.OliveOil, 'Olive Oil', ''],
];

const useStyles = makeStyles((theme) => createStyles({}));

const GameBoard: React.FunctionComponent<BoardProps<GameState>> = (game) => {
  const styles = useStyles();
  const roomData = useClientState(state => state.cacheRoomData);
  const playerID = useClientState(state => state.playerID);
  const [isGameOver, setIsGameOver] = React.useState<boolean>(false);
  const [alertOpen, setAlertOpen] = React.useState<boolean>(false);
  const [alertTitle, setAlertTitle] = React.useState<string>('');
  const [alertContent, setAlertContent] = React.useState<string>('');
  const [investDialog, setInvestDialog] = React.useState<boolean>(false);
  const [factoryConvertDialog, setFactoryConvertDialog] = React.useState<boolean>(false);
  const [sellDialog, setSellDialog] = React.useState<boolean>(false);

  if (!isGameOver && game.ctx.gameover) {
    setIsGameOver(true);
    setAlertTitle('Game Over');
    setAlertContent(`${roomData?.players[game.ctx.gameover.index].name} has won the game.`);
    setAlertOpen(true);
  }

  const playerState: PlayerState = game.G.players[playerID ?? 0];
  const isPlayerTurn = game.ctx.currentPlayer === playerID?.toString();

  const Alert = (
    <Dialog open={alertOpen}>
      <DialogTitle>{alertTitle}</DialogTitle>
      <DialogContent>
        <DialogContentText>
          {alertContent}
        </DialogContentText>
      </DialogContent>
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
        <Typography variant='h5'>Turn {game.G.cycle_count + 1}</Typography>
        {
          roomData?.players.map((player, index) => {
            return (
              <React.Fragment>
                <Divider />
                <Box paddingY={1} overflow='hidden'>
                  <Typography variant='body1'>
                    {index === Number(game.ctx.currentPlayer) && !isGameOver && '🔴'}{player.name}
                  </Typography>
                  <Typography variant='body2' color='textSecondary'>Points: {game.G.points[index]}</Typography>
                </Box>
              </React.Fragment>
            );
          })
        }
        {isPlayerTurn && <Button
          variant='contained'
          color='secondary'
          fullWidth
          onClick={() => {
            game.events.endTurn?.();
          }}
        >
          End Your Turn
        </Button>
        }
      </CardContent>
    </Card>
  );

  const Resources = (
    <React.Fragment>
      <Dialog open={factoryConvertDialog}>
        <DialogTitle>Factory Processing</DialogTitle>
        <DialogContent>
          <Typography variant='body2' color='textSecondary'>
            Factories can add value to your resources. <br />
            Factory capacity limits the amount of resource that can be processed per turn. <br />
            Remaining factory capacity: {playerState.factoryConversionLeft}.
          </Typography>
          <Box paddingY={1} />
          <Grid container spacing={2}>
            <Grid item xs={12} sm={8}>
              <Typography variant='body1'>Ferment Wine from Grape.</Typography>
            </Grid>
            <Grid item xs={12} sm={2}>
              <Button
                variant='contained'
                color='primary'
                fullWidth
                onClick={() => {
                  game.moves.factoryConvert(ResourceTypes.Grape, ResourceTypes.Wine, 1);
                }}
              >1</Button>
            </Grid>
            <Grid item xs={12} sm={2}>
              <Button
                variant='contained'
                color='primary'
                fullWidth
                onClick={() => {
                  game.moves.factoryConvert(ResourceTypes.Grape, ResourceTypes.Wine, 100000);
                }}
              >All</Button>
            </Grid>
            <Grid item xs={12} sm={8}>
              <Typography variant='body1'>Press Olive Oil from Olive.</Typography>
            </Grid>
            <Grid item xs={12} sm={2}>
              <Button
                variant='contained'
                color='primary'
                fullWidth
                onClick={() => {
                  game.moves.factoryConvert(ResourceTypes.Olive, ResourceTypes.OliveOil, 1);
                }}
              >1</Button>
            </Grid>
            <Grid item xs={12} sm={2}>
              <Button
                variant='contained'
                color='primary'
                fullWidth
                onClick={() => {
                  game.moves.factoryConvert(ResourceTypes.Olive, ResourceTypes.OliveOil, 100000);
                }}
              >All</Button>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setFactoryConvertDialog(false);
          }} variant='contained' color='primary' fullWidth>OK</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={sellDialog}>
        <DialogTitle>Sell Resources</DialogTitle>
        <DialogContent>
          <Typography variant='body2' color='textSecondary'>
            Sell your resources for profit. <br />
            You will only gain Aureus when sales are finalized at the end of the turn. <br />
            Item prices may change based on supply sold by players. <br />
            Hold 'Ctrl' to sell 10 at a time. <br />
            Hold 'Shift' to sell 100 at a time.
          </Typography>
          <Box paddingY={1} />
          <Grid container spacing={2}>
            {
              ResourceTypesText.map(resource => (
                <React.Fragment>
                  <Grid item xs={12} sm={8}>
                    <Typography variant='body1'>
                      {resource[1]} {resource[2]} ×{playerState.resources[resource[0]] ?? 0}
                    </Typography>
                    <Typography variant='body2' color='textSecondary'>
                      Price: {(game.G.marketPrice[resource[0]] ?? 0).toFixed(2)}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <Button
                      variant='contained'
                      color='primary'
                      fullWidth
                      onClick={(event) => {
                        if (event.ctrlKey) {
                          game.moves.sellResource(resource[0], 10);
                        } else if (event.shiftKey) {
                          game.moves.sellResource(resource[0], 100);
                        } else {
                          game.moves.sellResource(resource[0], 1);
                        }
                      }}
                    >
                      Sell
                    </Button>
                  </Grid>
                </React.Fragment>
              ))
            }
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setSellDialog(false);
          }} variant='contained' color='primary' fullWidth>OK</Button>
        </DialogActions>
      </Dialog>

      <Card variant='outlined'>
        <CardContent>
          <Typography variant='h5'>Your Resources</Typography>
          <Grid container direction='column' spacing={1}>
            <Grid item>
              <Typography variant='body1'>Aureus / Gold Coin 🥇 ×{playerState.gold.toFixed(2)}</Typography>
            </Grid>
            {
              ResourceTypesText.map(resource => {
                if (playerState.resources[resource[0]]) {
                  return (
                    <Grid item>
                      <Typography variant='body1'>
                        {resource[1]} {resource[2]} ×{playerState.resources[resource[0]] ?? 0}
                      </Typography>
                    </Grid>
                  );
                }
              })
            }
            <Grid item>
              <Button
                variant='contained'
                color='primary'
                fullWidth
                disabled={!isPlayerTurn}
                onClick={() => {
                  setFactoryConvertDialog(true);
                }}
              >Process</Button>
            </Grid>

            <Grid item>
              <Button
                variant='contained'
                color='primary'
                fullWidth
                disabled={!isPlayerTurn}
                onClick={() => {
                  setSellDialog(true);
                }}
              >Sell</Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    </React.Fragment>
  );

  const Investments = (
    <React.Fragment>
      <Dialog open={investDialog}>
        <DialogTitle>Investments Opportunities</DialogTitle>

        <DialogContent>
          <Typography variant='body2' color='textSecondary'>
            Buy/Sell your investments using Aureus. <br />
            Hold 'Ctrl' to buy/sell 10 at a time. <br />
            Hold 'Shift' to buy/sell 100 at a time. <br />
            You have {playerState.gold.toFixed(2)}🥇 Aureus.
          </Typography>
          <Box paddingX={25} paddingY={1} />
          {
            InvestmentTypesText.map((investment, index, array) => {
              return (
                <React.Fragment>
                  <Box paddingY={1}>
                    <Grid container>
                      <Grid item xs={12} sm={2}>
                        <Button
                          variant='contained'
                          color='primary'
                          fullWidth
                          onClick={(event) => {
                            if (event.ctrlKey) {
                              game.moves.invest(investment[0], -10);
                            } else if (event.shiftKey) {
                              game.moves.invest(investment[0], -100);
                            } else {
                              game.moves.invest(investment[0], -1);
                            }
                          }}
                        >-</Button>
                      </Grid>
                      <Grid item xs={12} sm={8}>
                        <Typography variant='body1' align='center'>
                          {investment[1]} ×{playerState.investments[investment[0]] ?? 0}
                        </Typography>
                        <Typography variant='body2' color='textSecondary' align='center'>
                          Buy: {InvestmentCost[investment[0]].toFixed(2)}/Sell: {(InvestmentCost[investment[0]] * InvestmentSellPenalty).toFixed(2)}
                        </Typography>
                      </Grid>
                      <Grid item xs={12} sm={2}>
                        <Button
                          variant='contained'
                          color='primary'
                          fullWidth
                          onClick={(event) => {
                            if (event.ctrlKey) {
                              game.moves.invest(investment[0], +10);
                            } else if (event.shiftKey) {
                              game.moves.invest(investment[0], +100);
                            } else {
                              game.moves.invest(investment[0], +1);
                            }
                          }}
                        >+</Button>
                      </Grid>
                    </Grid>
                  </Box>

                  {index !== array.length - 1 && <Divider />}
                </React.Fragment>
              );
            })
          }
        </DialogContent>

        <DialogActions>
          <Button onClick={() => {
            setInvestDialog(false);
          }} variant='contained' color='primary' fullWidth>OK</Button>
        </DialogActions>
      </Dialog>

      <Card variant='outlined'>
        <CardContent>
          <Typography variant='h5'>Your Investments</Typography>
          <Typography variant='body2' color='textSecondary'>Your investments generate resources which can be sold for
            profit.</Typography>
          <Box paddingY={0.5} />
          {
            InvestmentTypesText.map(investment => {
              if (playerState.investments[investment[0]]) {
                return (
                  <Typography variant='body1'>
                    {investment[1]} {investment[2]} ×{playerState.investments[investment[0]] ?? 0}
                  </Typography>
                );
              }
            })
          }
          <Box paddingY={0.5} />
          <Button
            variant='contained'
            color='primary'
            fullWidth
            disabled={!isPlayerTurn}
            onClick={() => {
              setInvestDialog(true);
            }}
          >Invest</Button>
        </CardContent>
      </Card>

    </React.Fragment>
  );

  const EventsLog = (
    <Card variant='outlined'>
      <CardContent>
        <Typography variant='h5'>Events</Typography>
        {
          playerState.eventsLog.slice(-10).reverse().map(event => {
            return (
              <React.Fragment>
                <Divider />
                <Box paddingY={1}>
                  {event.type === EventsLogTypes.Text
                    ? <Typography variant='body1'>
                      {event.data}
                    </Typography>
                    : <Typography variant='body1'>
                      {JSON.stringify(event.data)}
                    </Typography>}
                  <Typography variant='body2'
                              color='textSecondary'>{new Date(event.time).toLocaleTimeString()}</Typography>
                </Box>
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

            {/*Main Content*/}
            <Grid item xs={12} sm={12} md={9}>

              <Grid container spacing={1}>
                <Grid item xs={12} sm={6}>
                  {Resources}
                </Grid>
                <Grid item xs={12} sm={6}>
                  {Investments}
                </Grid>
              </Grid>
            </Grid>

            {/*Side Content (Players/Events)*/}
            <Grid item xs={12} sm={12} md={3}>
              <Grid container spacing={1}>
                <Grid item xs={12} sm={6} md={12}>
                  {PlayerList}
                </Grid>
                <Grid item xs={12} sm={6} md={12}>
                  {EventsLog}
                </Grid>
              </Grid>
            </Grid>

          </Grid>
        </Container>
      </Box>

    </React.Fragment>
  );
};

export default GameBoard;