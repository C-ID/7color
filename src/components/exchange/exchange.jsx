import React, { Component } from "react";
import { withRouter } from "react-router-dom";
import { withStyles } from '@material-ui/core/styles';
import Autocomplete from '@material-ui/lab/Autocomplete';
import * as moment from 'moment';
import config from "../../config/config";
import {
  Typography,
  Tooltip,
  TextField,
  MenuItem,
  Button
} from '@material-ui/core';
import { colors } from '../../theme/theme';

import Loader from '../loader/loader';
import InfoIcon from '@material-ui/icons/Info';

import {
  ERROR,
  CONNECTION_CONNECTED,
  CONNECTION_DISCONNECTED,
  GET_BALANCES,
  BALANCES_RETURNED,
  GET_TOEKEN_DASHBOARD_SNAPSHOT,
  TOEKEN_DASHBOARD_SNAPSHOT_RETURNED,
  SWAP,
  SWAP_RETURNED
} from '../../constants/constants';

import Store from "../../stores/store";

const emitter = Store.emitter
const dispatcher = Store.dispatcher
const store = Store.store

const styles = theme => ({
  root: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    width: '100%',
    justifyContent: 'flex-start',
    alignItems: 'center',
    background: "linear-gradient(to right bottom, #fff, rgba(25, 101, 233, 0.5))",
  },
  swapContainer: {
    display: 'flex',
    flex: 1,
    flexDirection: 'coloum',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '50px 25px 50px 25px',
    // marginBottom: '50px',
    padding: '0px',
    borderRadius: '25px 25px 25px 25px',
    border: '3px solid #E1E1E1',
    background: colors.white,
    [theme.breakpoints.up('md')]: {
      minWidth: '900px',
    }
  },

  inputPanel:{
    display: 'flex',
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '100px 50px 100px 50px',
    border: '3px solid #E1E1E1',
    borderRadius: '50px 50px 50px 50px',
    // [theme.breakpoints.up('sm')]: {
    //   // minWidth: '400px',
    //   minHeight: '50px'
    // }
  },

  Router: {
    display: 'flex',
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '0px',
    borderRadius: '50px 50px 50px 50px',
    [theme.breakpoints.up('md')]: {
      minWidth: '600px',
    }
  },
  


});

class ExchangeDashboard extends Component {

  constructor(props) {
    super()

    const dashboard = store.getStore('tokenDashboard')
    const account = store.getStore('account')
    const currency = localStorage.getItem('token-dashboard-currency')
    this.state = {
      dashboard: dashboard,
      loading: true,
      currency: currency ? currency : 'USD', // USD / ETH,
      sendAsset: null,
      receiveAsset: null,
      sendAmount: "",
      bestPrice: 0
    }

    if(account && account.address) {
      dispatcher.dispatch({ type: GET_TOEKEN_DASHBOARD_SNAPSHOT, content: {} })
      dispatcher.dispatch({ type: GET_BALANCES, content: {} })
    }
  }

  componentWillMount() {
    emitter.on(ERROR, this.errorReturned);
    emitter.on(CONNECTION_CONNECTED, this.connectionConnected);
    emitter.on(CONNECTION_DISCONNECTED, this.connectionDisconnected);
    emitter.on(TOEKEN_DASHBOARD_SNAPSHOT_RETURNED, this.dashboardSnapshotReturned);
  }

  componentWillUnmount() {
    emitter.removeListener(ERROR, this.errorReturned);
    emitter.removeListener(CONNECTION_CONNECTED, this.connectionConnected);
    emitter.removeListener(CONNECTION_DISCONNECTED, this.connectionDisconnected);
    emitter.removeListener(TOEKEN_DASHBOARD_SNAPSHOT_RETURNED, this.dashboardSnapshotReturned);
  };

  dashboardSnapshotReturned = () => {
    this.setState({
      loading: false,
      dashboard: store.getStore('tokenDashboard')
    })
  };

  connectionConnected = () => {
    dispatcher.dispatch({ type: GET_TOEKEN_DASHBOARD_SNAPSHOT, content: {} })
    const { t } = this.props

    this.setState({ account: store.getStore('account') })

    dispatcher.dispatch({ type: GET_BALANCES, content: {} })

  };

  connectionDisconnected = () => {
    this.setState({ account: store.getStore('account') })
  }

  errorReturned = (error) => {
    this.setState({ loading: false })
  };

  render() {
    const { classes } = this.props;
    const {
      loading,
      dashboard,
      currency
    } = this.state

    return (
      <div className={ classes.root }>
        <div className={ classes.swapContainer}>
          <div className={ classes.swapContainer}>
            abc
          </div>
        </div>
      { loading && <Loader /> }
      </div>
    )
  };

  balanceClicked = () => {
    const { currency } = this.state
    this.setState({ currency: (currency === 'USD' ? 'ETH' : 'USD') })

    localStorage.setItem('token-dashboard-currency', (currency === 'USD' ? 'ETH' : 'USD'))
  };

  // for example.
  checkApproval = () => {
    const { account } = this.state
    this.setState({ loading: true })
    const asset = {
      erc20address: "0xc778417E063141139Fce010982780140Aa0cD5Ab",
      decimals: 18,
      symbol: "WETH"
    }
    const amount = '999999999999000000000000000000'
    
    store._checkApprovalWaitForConfirmation(asset, account, amount, config.mulitSwapAddress, (err) => {
      if(err) {
        return emitter.emit(ERROR, err);
      }
    })
  };

  //for example.
  swap = () => {
    const { account } = this.state
    this.setState({ loading: true })
    const swapPairs = {}
    dispatcher.dispatch({ type: SWAP, content: {} })
  };




}

  export default withRouter(withStyles(styles)(ExchangeDashboard));
