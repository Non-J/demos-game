import React from 'react';
import { Link as RouterLink, Route, Switch } from 'react-router-dom';
import useClientState from './ClientState';
import ClientSettings from './ClientSettings';
import Home from './Home';
import { AppBar, Button, createStyles, makeStyles, Toolbar, Typography } from '@material-ui/core';

const useStyles = makeStyles((theme) => createStyles({
  menuButton: {
    marginRight: theme.spacing(1),
  },
  title: {
    flexGrow: 1,
  },
}));

const App: React.FunctionComponent = () => {
  const styles = useStyles();
  const clientInitState = useClientState(state => state.initState);

  return (
    <React.Fragment>

      <AppBar position='static'>
        <Toolbar variant='dense'>
          <Typography variant='h6' className={styles.title}>
            Demos: The Civic Life
          </Typography>
          <Button component={RouterLink} to='/settings' className={styles.menuButton}>Settings</Button>
        </Toolbar>
      </AppBar>

      <Switch>

        <Route exact path='/settings'>
          <ClientSettings />
        </Route>

        <Route>
          {clientInitState
            ? <ClientSettings />
            : <Home />}
        </Route>

      </Switch>

    </React.Fragment>
  );
};

export default App;
