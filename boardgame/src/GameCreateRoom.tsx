import React, { useState } from 'react';
import { Button, Container, createStyles, Grid, makeStyles, Typography } from '@material-ui/core';
import { Redirect } from 'react-router-dom';
import useClientState from './ClientState';

const useStyles = makeStyles((theme) => createStyles({
  container: {
    padding: theme.spacing(4),
  },
  buttonContainer: {
    marginTop: theme.spacing(2),
  },
  button: {
    padding: theme.spacing(2),
  },
}));

interface CreateButtonProps {
  numPlayers: number,
  buttonLock: boolean,
  setButtonLock: (lock: boolean) => void,
}

const CreateButton: React.FunctionComponent<CreateButtonProps> = ({
                                                                    numPlayers,
                                                                    buttonLock,
                                                                    setButtonLock,
                                                                  }: CreateButtonProps) => {
  const styles = useStyles();
  const createRoom = useClientState(state => state.createRoom);

  return (
    <Grid item xs={12} sm={6}>
      <Button
        variant='contained'
        color='primary'
        fullWidth
        className={styles.button}
        disabled={buttonLock}
        onClick={
          () => {
            setButtonLock(true);
            createRoom(numPlayers)
              .catch(e => {
                window.alert('Unable to create a new room.\nThe server maybe offline at the moment.');
                console.error(e);
              })
              .finally(() => {
                setButtonLock(false);
              });
          }
        }>
        {numPlayers} Players
      </Button>
    </Grid>
  );
};

const GameCreateRoom: React.FunctionComponent = () => {
  const styles = useStyles();
  const roomID = useClientState(state => state.roomID);
  const [buttonLock, setButtonLock] = useState<boolean>(false);

  if (roomID) {
    return (
      <Redirect to={`/room/${roomID}`} />
    );
  }

  return (
    <React.Fragment>
      <Container maxWidth='md' className={styles.container}>
        <Typography variant='h3'>Create New Room</Typography>
        <Typography variant='body1'>Select the number of players for this room.</Typography>
        <Typography variant='body1'>To join existing room, use the link shared by your friend!</Typography>

        <Grid container spacing={2} className={styles.buttonContainer}>
          <CreateButton numPlayers={3} buttonLock={buttonLock} setButtonLock={setButtonLock} />
          <CreateButton numPlayers={4} buttonLock={buttonLock} setButtonLock={setButtonLock} />
          <CreateButton numPlayers={5} buttonLock={buttonLock} setButtonLock={setButtonLock} />
          <CreateButton numPlayers={6} buttonLock={buttonLock} setButtonLock={setButtonLock} />
          <CreateButton numPlayers={7} buttonLock={buttonLock} setButtonLock={setButtonLock} />
          <CreateButton numPlayers={8} buttonLock={buttonLock} setButtonLock={setButtonLock} />
        </Grid>

      </Container>
    </React.Fragment>
  );
};

export default GameCreateRoom;