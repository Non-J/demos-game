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
  FormControl,
  FormHelperText,
  Grid,
  makeStyles,
  MenuItem,
  Select,
  TextField,
  Typography,
} from '@material-ui/core';
import type { BoardProps } from 'boardgame.io/react';
import type { GameState, PlayerState } from './Demos';
import {
  CampaignEffects,
  CampaignEffectsTypes,
  EventsLogTypes,
  InvestmentCost,
  InvestmentSellPenalty,
  InvestmentTypes,
  ResourceTypes,
} from './Demos';
import useClientState from './ClientState';
import type { ElectionBlock } from './GameElection';
import { determineElectionWinner, ElectionBlockPolicy } from './GameElection';

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

interface CampaignEffectText {
  type: CampaignEffectsTypes,
  text: string,
  description: string,
  displayOnce: boolean,
  maxBuy: number,
}

const CampaignEffectTypesText: Array<CampaignEffectText> = [
  {
    type: CampaignEffectsTypes.Greeters,
    text: 'Greeters',
    description: 'Greeters greet the voters by name, adding personal touch to your campaign.',
    displayOnce: false,
    maxBuy: 3,
  }, {
    type: CampaignEffectsTypes.Writers,
    text: 'Writers',
    description: 'Writers write professional sounding speeches for your public appearances.',
    displayOnce: false,
    maxBuy: 1,
  }, {
    type: CampaignEffectsTypes.Posters,
    text: 'Posters',
    description: 'Post your posters around town so everyone knows your name.',
    displayOnce: false,
    maxBuy: 3,
  }, {
    type: CampaignEffectsTypes.ForumDebates,
    text: 'Public Forum Debate',
    description: 'Organize political debate in a public forum.',
    displayOnce: false,
    maxBuy: 1,
  }, {
    type: CampaignEffectsTypes.CaughtBribe,
    text: 'Caught in Bribery Scandal',
    description: 'A disgrace to your campaign, no one wants to vote for you!',
    displayOnce: true,
    maxBuy: 0,
  },
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
  const [campaignEffectDialog, setCampaignEffectDialog] = React.useState<boolean>(false);
  const [electionDialog, setElectionDialog] = React.useState<boolean>(false);
  const [electionBlockSelection, setElectionBlockSelection] = React.useState<number>(0);
  const [contributionAmount, setContributionAmount] = React.useState<string>('1');

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
        <Typography variant='body2' color='textSecondary'>You need at least {game.G.victoryConditionPoints} points to
          win.</Typography>
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
      <Dialog open={factoryConvertDialog} onClose={() => {
        setFactoryConvertDialog(false);
      }}>
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
                disabled={playerState.factoryConversionLeft === 0}
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
                disabled={playerState.factoryConversionLeft === 0}
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
                disabled={playerState.factoryConversionLeft === 0}
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
                disabled={playerState.factoryConversionLeft === 0}
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

      <Dialog open={sellDialog} onClose={() => {
        setSellDialog(false);
      }}>
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
                      disabled={(playerState.resources[resource[0]] ?? 0) <= 0}
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

            {playerState.investments[InvestmentTypes.Factory] && playerState.investments[InvestmentTypes.Factory] !== 0 &&
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
            }

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
      <Dialog open={investDialog} onClose={() => {
        setInvestDialog(false);
      }}>
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
                          disabled={(playerState.investments[investment[0]] ?? 0) <= 0}
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
                          disabled={InvestmentCost[investment[0]] > playerState.gold}
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

  const CampaignManagement = (
    <React.Fragment>
      <Dialog open={campaignEffectDialog} onClose={() => {
        setCampaignEffectDialog(false);
      }}>
        <DialogTitle>Campaign Management</DialogTitle>
        <DialogContent>
          <Typography variant='body2' color='textSecondary'>
            You have {playerState.gold.toFixed(2)}🥇 Aureus.
          </Typography>
          <Box paddingY={1} />
          <Grid container spacing={2}>
            {CampaignEffectTypesText.map(value => {
              if (value.maxBuy === 0) {
                return;
              }

              return (<React.Fragment>
                <Grid item xs={12} sm={9}>
                  <Typography variant='body1'>{value.text}</Typography>
                  <Typography variant='body2' color='textSecondary'>{value.description}</Typography>
                  <Typography
                    variant='body2'
                    color='textSecondary'>
                    Effect: {(CampaignEffects[value.type].effectiveness * 100).toFixed(0)}%, {Number.isFinite(CampaignEffects[value.type].period) ? `Expire: ${CampaignEffects[value.type].period} turns` : 'Never Expire'},
                    Cost: {CampaignEffects[value.type].cost}🥇,
                    Active: {(playerState.activeCampaignEffects[value.type]?.length ?? 0)} out
                    of {value.maxBuy}</Typography>
                </Grid>
                <Grid item xs={12} sm={3}>
                  <Button
                    variant='contained'
                    color='primary'
                    fullWidth
                    disabled={(playerState.activeCampaignEffects[value.type]?.length ?? 0) >= value.maxBuy || playerState.gold < CampaignEffects[value.type].cost}
                    onClick={() => {
                      game.moves.buyCampaignImprovement(value.type);
                    }}
                  >Buy</Button>
                </Grid>
              </React.Fragment>);
            })}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setCampaignEffectDialog(false);
          }} variant='contained' color='primary' fullWidth>OK</Button>
        </DialogActions>
      </Dialog>

      <Card variant='outlined'>
        <CardContent>
          <Typography variant='h5'>Campaign Management</Typography>
          <Typography variant='body2' color='textSecondary'>Improve the effectiveness of your campaigning.</Typography>
          <Typography variant='body2' color='textSecondary'>Current
            Effectiveness: {(playerState.campaignEffectiveness * 100).toFixed(0)}%</Typography>
          <Box paddingY={0.5} />
          {
            CampaignEffectTypesText.map(effect => {
              if (playerState.activeCampaignEffects[effect.type] && playerState.activeCampaignEffects[effect.type]?.length !== 0) {
                return (
                  <React.Fragment>
                    <Typography variant='body1'>
                      {effect.text} ({(CampaignEffects[effect.type].effectiveness * 100).toFixed(0)}%{effect.displayOnce ? '' : ` × ${playerState.activeCampaignEffects[effect.type]?.length}`})
                    </Typography>
                    {!effect.displayOnce &&
                    playerState.activeCampaignEffects[effect.type]?.map(value =>
                      <Typography variant='body2' color='textSecondary'>{
                        Number.isFinite(value.period) ? `Expires in ${value.period} turns.` : `Does not expire.`
                      }</Typography>,
                    )
                    }
                    {effect.displayOnce &&
                    <Typography variant='body2' color='textSecondary'>Expires in {
                      playerState.activeCampaignEffects[effect.type]
                        ?.reduce((acc, val, idx) => acc[0] < val.period ? [val.period, idx] : acc, [Number.MIN_VALUE, -1])[0]
                    } turns.</Typography>
                    }
                  </React.Fragment>
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
              setCampaignEffectDialog(true);
            }}
          >Manage</Button>
        </CardContent>
      </Card>
    </React.Fragment>
  );

  const Election = (
    <React.Fragment>
      <Dialog open={electionDialog} onClose={() => {
        setElectionDialog(false);
      }}>
        <DialogTitle>Election Campaigning</DialogTitle>
        <DialogContent>
          <Typography variant='body2' color='textSecondary'>
            Make an election campaign for one the voting block. <br />
            Minimum campaign contribution is 1🥇 Aureus.<br />
            You have {playerState.gold.toFixed(2)}🥇 Aureus.
          </Typography>

          <Box paddingY={1} />

          <FormControl fullWidth>
            <Select
              value={electionBlockSelection}
              onChange={(event) => {
                setElectionBlockSelection(Number(event.target.value) || 0);
              }}
              displayEmpty
            >
              {game.G.elections.map((value, index) => <MenuItem value={index}>{value.name}</MenuItem>)}
            </Select>
            <FormHelperText>Election block to campaign to</FormHelperText>
          </FormControl>

          <Box paddingY={1} />

          <Typography variant='body1'>
            Win this block's vote
            for {game.G.elections[electionBlockSelection].pointAwards} point{game.G.elections[electionBlockSelection].pointAwards !== 1 && 's'}.
          </Typography>
          {
            game.G.elections[electionBlockSelection].policy === ElectionBlockPolicy.Private &&
            <Typography variant='body1'>This block doesn't publish its voting information.</Typography>
          }
          {
            (game.G.elections[electionBlockSelection].policy === ElectionBlockPolicy.Public || game.G.elections[electionBlockSelection].policy === ElectionBlockPolicy.PublicWithBribe) && (() => {
              const projected_winner = determineElectionWinner(game.G.elections[electionBlockSelection]);
              if (projected_winner[0] > 0) {
                return (<Typography variant='body1'>
                  Projected winner is {roomData?.players[projected_winner[1]].name}.
                </Typography>);
              } else {
                return (<Typography variant='body1'>
                  No one has campaigned to this voting block so far.
                </Typography>);
              }
            })()
          }
          <Typography variant='body1'>
            Your Contribution: {game.G.elections[electionBlockSelection].contribution[Number(playerID) || 0].toFixed(2)}.
          </Typography>

          <Box paddingY={1} />

          <TextField
            label='Contribution Amount'
            value={contributionAmount}
            onChange={(e) => {
              setContributionAmount(e.target.value);
            }}
            variant='outlined'
            fullWidth />
          {(() => {
            const contributionAmountNumber = Number(contributionAmount.trim());
            return (<Button
              variant='contained'
              color='primary'
              fullWidth
              disabled={
                contributionAmountNumber < 0 ||
                Number.isNaN(contributionAmountNumber) ||
                contributionAmountNumber > playerState.gold ||
                (contributionAmountNumber + game.G.elections[electionBlockSelection].contribution[Number(playerID) || 0]) < 1
              }
              onClick={() => {
                game.moves.makeCampaignContribution(electionBlockSelection, Number(contributionAmount.trim()) || 0);
              }}
            >Make Campaign Contribution</Button>);
          })()}


        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setElectionDialog(false);
          }} variant='contained' color='primary' fullWidth>OK</Button>
        </DialogActions>
      </Dialog>

      <Card variant='outlined'>
        <CardContent>
          <Typography variant='h5'>Elections</Typography>
          <Typography variant='body2' color='textSecondary'>
            Win the popularity among voting blocks to win the game.
          </Typography>
          <Box paddingY={0.5} />
          <Grid container spacing={1}>
            {
              game.G.elections.map((value: ElectionBlock, index, array) => <Grid item xs={12}>
                <Typography variant='body1'>{value.name}</Typography>
                <Typography variant='body2' color='textSecondary'>
                  Win this block's vote for {value.pointAwards} point{value.pointAwards !== 1 && 's'}.
                </Typography>
                {
                  value.policy === ElectionBlockPolicy.Private &&
                  <Typography variant='body2' color='textSecondary'>No Voting Information Available.</Typography>
                }
                {
                  (value.policy === ElectionBlockPolicy.Public || value.policy === ElectionBlockPolicy.PublicWithBribe) && (() => {
                    const projected_winner = determineElectionWinner(value);
                    if (projected_winner[0] > 0) {
                      return (<Typography variant='body2' color='textSecondary'>
                        Projected winner is {roomData?.players[projected_winner[1]].name}.
                      </Typography>);
                    } else {
                      return (<Typography variant='body2' color='textSecondary'>
                        No one has campaigned to this voting block so far.
                      </Typography>);
                    }
                  })()
                }
                {index !== array.length - 1 && <Divider />}
              </Grid>)
            }
          </Grid>
          <Box paddingY={0.5} />
          <Button
            variant='contained'
            color='primary'
            fullWidth
            disabled={!isPlayerTurn}
            onClick={() => {
              setElectionDialog(true);
            }}
          >Campaign</Button>
        </CardContent>
      </Card>
    </React.Fragment>
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

              <Box paddingY={0.5} />

              <Grid container spacing={1}>
                <Grid item xs={12} sm={6}>
                  {CampaignManagement}
                </Grid>
                <Grid item xs={12} sm={6}>
                  {Election}
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