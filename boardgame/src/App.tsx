import React from 'react';
import { Link as RouterLink, Route, Switch } from 'react-router-dom';
import useClientState from './ClientState';
import ClientSettings from './ClientSettings';
import GameLobby from './GameLobby';
import { AppBar, Button, createStyles, Link, makeStyles, Toolbar, Typography } from '@material-ui/core';
import About from './About';
import GameCreateRoom from './GameCreateRoom';

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
            <Link component={RouterLink} to='/' color='inherit'>Demos: The Civic Life</Link>
          </Typography>
          <Button component={RouterLink} to='/settings' className={styles.menuButton}>Settings</Button>
          <Button component={RouterLink} to='/about' className={styles.menuButton}>About</Button>
        </Toolbar>
      </AppBar>

      <Switch>

        <Route exact path='/about'>
          <About />
        </Route>

        <Route exact path='/settings'>
          <ClientSettings />
        </Route>

        <Route exact path='/room/:roomID'>
          {clientInitState
            ? <ClientSettings />
            : <GameLobby />}
        </Route>

        <Route path='*'>
          {clientInitState
            ? <ClientSettings />
            : <GameCreateRoom />}
        </Route>

      </Switch>

    </React.Fragment>
  );
};

export default App;
