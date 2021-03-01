import React, { useState } from 'react';
import useClientState from './ClientState';
import { Button, Container, createStyles, makeStyles, Typography } from '@material-ui/core';
import { useHistory, useParams } from 'react-router-dom';
import type { LobbyAPI } from 'boardgame.io';

const useStyles = makeStyles((theme) => createStyles({
  container: {
    padding: theme.spacing(4),
  },
  statusText: {
    margin: theme.spacing(4, 0),
  },
}));

const GameLobby: React.FunctionComponent = () => {
  const [isGameRunning, setGameRunning] = useState(false);

  return isGameRunning ? (
    <h1 />
  ) : (
    <GameLobbySetup startGame={() => {
      setGameRunning(true);
    }} />
  );

};

interface GameLobbySetupProps {
  startGame(): void
}

enum RoomSearchingStatus {
  Initializing,
  Found,
  InvalidRoomID,
  RoomFull,
}

const GameLobbySetup: React.FunctionComponent<GameLobbySetupProps> = ({ startGame }) => {
  const styles = useStyles();
  const history = useHistory();
  const joinRoom = useClientState(state => state.joinRoom);
  const leaveRoom = useClientState(state => state.leaveRoom);
  const getRoomData = useClientState(state => state.getRoomData);
  const [roomData, setRoomData] = useState<LobbyAPI.Match | undefined>(undefined);
  const [roomSearchingStatus, setRoomSearchingStatus] = useState<RoomSearchingStatus>(RoomSearchingStatus.Initializing);
  const { roomID } = useParams() as { roomID: string };

  React.useEffect(() => {
    // Try to join room when this component is rendered
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
    }, 1000);

    return () => clearInterval(intervalID);
  }, [roomID]);


  return (
    <React.Fragment>
      <Container maxWidth='md' className={styles.container}>
        <Typography variant='h3'>Joining Game</Typography>
        <Typography variant='body1'>
          To invite others, just send the link: <i>{window.location.toString()}</i>
        </Typography>

        {
          roomSearchingStatus === RoomSearchingStatus.Initializing &&
          <Typography
            variant='body1'
            className={styles.statusText}>
            Please wait a moment while we're looking for your room.
          </Typography>
        }
        {
          roomSearchingStatus === RoomSearchingStatus.InvalidRoomID &&
          <Typography
            variant='body1'
            className={styles.statusText}>
            Cannot join room as the room ID is invalid. If you've been sent a link, make sure it is correct.
          </Typography>
        }
        {
          roomSearchingStatus === RoomSearchingStatus.RoomFull &&
          <Typography
            variant='body1'
            className={styles.statusText}>
            Cannot join room as the room is already full.
          </Typography>
        }
        {
          roomSearchingStatus === RoomSearchingStatus.Found &&
          <pre>{JSON.stringify(roomData)}</pre>
        }

        <Button variant='contained' color='secondary' fullWidth onClick={
          () => {
            leaveRoom()
              .then(() => {
                history.replace('/');
              });
          }
        }>Leave Room</Button>
      </Container>
    </React.Fragment>
  );
};

export default GameLobby;
