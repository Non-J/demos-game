import React, { FormEventHandler } from 'react';
import useClientState from './ClientState';
import { useHistory } from 'react-router-dom';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Button,
  createStyles,
  Grid,
  makeStyles,
  TextField,
  Typography,
} from '@material-ui/core';

const useStyles = makeStyles((theme) => createStyles({
  container: {
    padding: theme.spacing(4),
  },
  initText: {
    marginTop: theme.spacing(1),
  },
  form: {
    marginTop: theme.spacing(2),
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

  const clientStates = useClientState(state => state);

  const formSubmit: FormEventHandler = (event) => {
    clientStates.setState({
      initState: false,
    });
    history.replace('/');
  };

  return (
    <React.Fragment>
      <Box className={styles.container}>

        {clientStates.initState
          ? <Typography className={styles.initText} variant='h6'>Before we begin, please enter some basic information
            below.</Typography>
          : null}

        <form className={styles.form} autoComplete='off' onSubmit={formSubmit}>

          <TextField
            className={styles.input}
            label='Name'
            helperText={'This name will be displayed to others.'}
            value={clientStates.username}
            onChange={(e) => {
              clientStates.setState({ username: e.target.value });
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
                  value={clientStates.server}
                  onChange={(e) => {
                    clientStates.setState({ server: e.target.value });
                  }}
                  required
                  type='url'
                  variant='outlined'
                  fullWidth />
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

      </Box>
    </React.Fragment>
  );
};
export default ClientSettings;