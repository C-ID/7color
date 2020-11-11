import React, { Component } from 'react';
import CssBaseline from '@material-ui/core/CssBaseline';
import { createMuiTheme, MuiThemeProvider } from '@material-ui/core/styles';
import {
  Switch,
  Route
} from "react-router-dom";
import IpfsRouter from 'ipfs-react-router'
import SevenColorsTheme from './theme';
import { injected } from "./stores/connectors";
import Store from "./stores";

import Header from './components/header';

const emitter = Store.emitter
const store = Store.store


class App extends Component {
  state = {};

  componentWillMount() {
    injected.isAuthorized().then(isAuthorized => {
      if (isAuthorized) {
        injected.activate()
        .then((a) => {
          store.setStore({ account: { address: a.account }, web3context: { library: { provider: a.provider } } })
          console.log(a)
        })
        .catch((e) => {
          console.log(e)
        })
      } else {
      }
    });
  }
  render() {
    return (
      <MuiThemeProvider theme={ createMuiTheme(SevenColorsTheme) }>
        <CssBaseline />
        <IpfsRouter>
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              minHeight: '100vh',
              alignItems: 'center',
              background: "#f9fafb"
            }}>
                <Route path='/'>
                  <Header />
                </Route>
            </div>
        </IpfsRouter>
      </MuiThemeProvider>
    );
  }
}

export default App;
