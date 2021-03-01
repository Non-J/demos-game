import React, { useState } from 'react';
import useClientState from './ClientState';
import {
  Box,
  CircularProgress,
  Container,
  createStyles,
  Divider,
  List,
  ListItem,
  ListItemText,
  makeStyles,
  Paper,
  Typography,
} from '@material-ui/core';
import { useParams } from 'react-router-dom';
import type { LobbyAPI } from 'boardgame.io';
import { Client } from 'boardgame.io/react';
import { Demos } from './Demos';
import { SocketIO } from 'boardgame.io/multiplayer';
import GameBoard from './GameBoard';

const useStyles = makeStyles((theme) => createStyles({
  container: {
    padding: theme.spacing(4),
  },
  statusText: {
    margin: theme.spacing(4, 0),
  },
  roomStatusText: {
    margin: theme.spacing(4, 0, 2, 0),
  },
  leaveButton: {
    margin: theme.spacing(2, 0, 0, 0),
  },
}));

const GameLobby: React.FunctionComponent = () => {
  const [isGameRunning, setGameRunning] = useState(false);

  return isGameRunning ? (
    <GameLobbyClient />
  ) : (
    <GameLobbySetup startGame={() => {
      setGameRunning(true);
    }} />
  );

};

export default GameLobby;

const GameLobbyClientLoading: React.FunctionComponent = () => {
  return (
    <React.Fragment>
      <Box display='flex' m={6} justifyContent='center'>
        <CircularProgress />
      </Box>
    </React.Fragment>
  );
};

const GameLobbyClient: React.FunctionComponent = () => {
  const { roomID } = useParams() as { roomID: string };
  const server = useClientState(state => state.server);
  const playerID = useClientState(state => state.playerID);
  const credentials = useClientState(state => state.credentials);

  const GameClient = Client({
    game: Demos,
    board: GameBoard,
    loading: GameLobbyClientLoading,
    multiplayer: SocketIO({ server: server }),
    debug: true,
  });

  return (
    <GameClient
      matchID={roomID}
      playerID={playerID?.toString()}
      credentials={credentials}
    />
  );
};

enum RoomSearchingStatus {
  Initializing,
  Found,
  InvalidRoomID,
  RoomFull,
}

interface GameLobbySetupProps {
  startGame(): void
}

const GameLobbySetup: React.FunctionComponent<GameLobbySetupProps> = ({ startGame }) => {
  const styles = useStyles();
  const joinRoom = useClientState(state => state.joinRoom);
  const getRoomData = useClientState(state => state.getRoomData);
  const [roomData, setRoomData] = useState<LobbyAPI.Match | undefined>(undefined);
  const [roomSearchingStatus, setRoomSearchingStatus] = useState<RoomSearchingStatus>(RoomSearchingStatus.Initializing);
  const { roomID } = useParams() as { roomID: string };

  React.useEffect(() => {
    // Try to join room when this component is rendered
    setRoomSearchingStatus(RoomSearchingStatus.Initializing);
    joinRoom(roomID);
  }, [roomID]);

  React.useEffect(() => {
    const intervalID = setInterval(() => {
      getRoomData(roomID)
        .then(data => {
          if (data) {
            setRoomData(data);

            if (data.isAlreadyJoined === true && data.nextEmptySeat === undefined) {
              // Already joined and room is full
              startGame();
            } else if (data.isAlreadyJoined === false && data.nextEmptySeat === undefined) {
              // Not joined and room is full
              setRoomSearchingStatus(RoomSearchingStatus.RoomFull);
              clearInterval(intervalID);
            } else {
              // Room is not full
              setRoomSearchingStatus(RoomSearchingStatus.Found);
            }
          } else {
            // Invalid room id
            setRoomSearchingStatus(RoomSearchingStatus.InvalidRoomID);
            clearInterval(intervalID);
          }
        });
    }, 2000);

    return () => clearInterval(intervalID);
  }, [roomID]);


  return (
    <React.Fragment>
      <Container maxWidth='md' className={styles.container}>
        <Typography variant='h3'>Joining Game</Typography>
        <Typography variant='body1'>
          To invite others, just send the link: <i><u>{window.location.toString()}</u></i>
        </Typography>

        {
          roomSearchingStatus === RoomSearchingStatus.Initializing &&
          <Box display='flex' m={6} justifyContent='center' alignItems='center' flexDirection='column'>
            <CircularProgress />
            <Typography
              variant='subtitle2'
              className={styles.statusText}>
              Please wait a moment while we're looking for your room.
            </Typography>
          </Box>
        }
        {
          roomSearchingStatus === RoomSearchingStatus.InvalidRoomID &&
          <Box display='flex' m={6} justifyContent='center' alignItems='center' flexDirection='column'>
            <Typography
              variant='subtitle2'
              className={styles.statusText}>
              Cannot join as the room ID is invalid. If you've been sent a link, make sure it is correct.
            </Typography>
          </Box>
        }
        {
          roomSearchingStatus === RoomSearchingStatus.RoomFull &&
          <Box display='flex' m={6} justifyContent='center' alignItems='center' flexDirection='column'>
            <Typography
              variant='subtitle2'
              className={styles.statusText}>
              Cannot join this room as it is already full.
            </Typography>
          </Box>
        }
        {
          roomSearchingStatus === RoomSearchingStatus.Found &&
          <React.Fragment>
            <Typography
              variant='subtitle2'
              className={styles.roomStatusText}>
              Waiting for {roomData?.players.filter(p => !p.name).length} more players.
              The game will start as soon as the room is full.
            </Typography>
            <Paper>
              <List>
                {
                  roomData?.players.map((p) => {
                    return (
                      <React.Fragment>
                        <ListItem>
                          <ListItemText
                            primary={p.name ? `[ ${p.id + 1} ] ${p.name}` : `[ Player ${p.id + 1} has not joined ]`} />
                        </ListItem>
                        {p.id !== roomData?.players.length - 1 && <Divider />}
                      </React.Fragment>
                    );
                  })
                }
              </List>
            </Paper>
          </React.Fragment>
        }
      </Container>
    </React.Fragment>
  );
};

