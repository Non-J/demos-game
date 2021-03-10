import React from 'react';
import useClientState from './ClientState';
import { useHistory } from 'react-router-dom';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Button,
  Container,
  createStyles,
  FormControlLabel,
  Grid,
  makeStyles,
  Switch,
  TextField,
  Typography,
} from '@material-ui/core';

const useStyles = makeStyles((theme) => createStyles({
  container: {
    padding: theme.spacing(4),
  },
  initText: {
    margin: theme.spacing(1, 0),
  },
  input: {
    margin: theme.spacing(2, 0, 0),
  },
  submit: {
    margin: theme.spacing(2, 0, 0),
  },
}));

const ClientSettings: React.FunctionComponent = () => {
  const styles = useStyles();
  const history = useHistory();

  const username = useClientState(state => state.username);
  const setUsername = useClientState(state => state.setUsername);
  const debugFlag = useClientState(state => state.debugFlag);
  const setDebugFlag = useClientState(state => state.setDebugFlag);
  const server = useClientState(state => state.server);
  const setServer = useClientState(state => state.setServer);
  const initState = useClientState(state => state.initState);
  const clearInitStateFlag = useClientState(state => state.clearInitStateFlag);

  const formSubmit: React.FormEventHandler = () => {
    clearInitStateFlag();
    if (history.location.pathname === '/settings') {
      history.replace('/');
    }
  };

  return (
    <React.Fragment>
      <Container maxWidth='md' className={styles.container}>

        {initState
          ? <Typography className={styles.initText} variant='h6'>
            Before we begin, please enter some basic information below.
          </Typography>
          : null}

        <form autoComplete='off' onSubmit={formSubmit}>

          <TextField
            className={styles.input}
            label='Name'
            helperText={'This name will be displayed to others.'}
            value={username}
            onChange={(e) => {
              setUsername(e.target.value);
            }}
            required
            variant='outlined'
            fullWidth />

          <Accordion className={styles.input}>
            <AccordionSummary>
              <Typography>Advanced Settings</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Grid
                container
                direction='column'
              >
                <Typography variant='body2'>You probably don't need to change these.</Typography>

                <TextField
                  className={styles.input}
                  label='Server'
                  value={server}
                  onChange={(e) => {
                    setServer(e.target.value);
                  }}
                  required
                  type='url'
                  variant='outlined'
                  fullWidth />

                <FormControlLabel
                  control={
                    <Switch
                      checked={debugFlag}
                      onChange={() => {
                        setDebugFlag(!debugFlag);
                      }}
                    />
                  }
                  label='Debug Game Board'
                />
              </Grid>
            </AccordionDetails>
          </Accordion>

          <Button
            className={styles.submit}
            type='submit'
            variant='contained'
            color='primary'
            fullWidth>
            OK
          </Button>

        </form>

      </Container>
    </React.Fragment>
  );
};
export default ClientSettings;