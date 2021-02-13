import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import { createMuiTheme, CssBaseline, ThemeProvider } from '@material-ui/core';
import { HashRouter as Router } from 'react-router-dom';
import App from './App';

// Global theme
const theme = createMuiTheme({
  typography: {
    fontFamily: '\'Merriweather Sans\', sans-serif',
  },
  palette: {
    type: 'dark',
    background: {
      default: '#29202A',
      paper: '#453647',
    },
  },
});

/**
 * AppRoot components is the main global react app.
 * Handles routing and taking over from static HTML
 */
class AppRoot extends React.Component {
  componentDidMount() {
    // Remove the static loading text upon react take over
    document.getElementById('loading-text')?.remove();
  }

  render() {
    return (
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Router>
          <App />
        </Router>
      </ThemeProvider>
    );
  }
}

ReactDOM.render(
  <React.StrictMode>
    <AppRoot />
  </React.StrictMode>,
  document.getElementById('app-root'),
);

if (import.meta.hot) {
  import.meta.hot.accept();
}
