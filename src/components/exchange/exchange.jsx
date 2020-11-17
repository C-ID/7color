import React, { Component } from "react";
import { withRouter } from "react-router-dom";
import { withStyles } from '@material-ui/core/styles';
import Autocomplete from '@material-ui/lab/Autocomplete';
import * as moment from 'moment';
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
    maxWidth: '1200px',
    width: '100%',
    justifyContent: 'flex-start',
    alignItems: 'center',
  },
  investedContainerLoggedOut: {
    display: 'flex',
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: '100%',
    marginTop: '40px',
    [theme.breakpoints.up('md')]: {
      minWidth: '900px',
    }
  },
  iHaveContainer: {
    flex: 1,
    display: 'flex',
    flexWrap: 'wrap',
    padding: '42px 30px',
    borderRadius: '50px',
    maxWidth: '500px',
    justifyContent: 'center',
    border: '1px solid '+colors.borderBlue,
  },
  iWantContainer: {
    flex: 1,
    display: 'flex',
    flexWrap: 'wrap',
    padding: '24px'
  },
  conversionRatioContainer: {
    width: '100%',
    display: 'flex'
  },
  sendingContainer: {
    flex: 1,
    display: 'flex',
  },
  receivingContainer: {
    flex: 1,
    display: 'flex',
  },
  feesContainer: {
    display: 'flex'
  },
  card: {
    width: '100%',
    display: 'flex',
    flexWrap: 'wrap',
    maxWidth: '400px',
    justifyContent: 'center',
    minWidth: '100%',
    flexDirection: 'column',
    alignItems: 'center',
    marginTop: '40px'
  },
  intro: {
    width: '100%',
    position: 'relative',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: '32px',
    maxWidth: '500px'
  },
  actualIntro: {
    paddingBottom: '32px',
  },
  introCenter: {
    minWidth: '100%',
    textAlign: 'center',
    padding: '24px 0px'
  },
  investedContainer: {
    display: 'flex',
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '12px',
    minWidth: '100%',
    [theme.breakpoints.up('md')]: {
      minWidth: '800px',
    }
  },
  connectContainer: {
    padding: '12px',
    display: 'flex',
    justifyContent: 'center',
    width: '100%',
    maxWidth: '450px',
    [theme.breakpoints.up('md')]: {
      width: '450',
    }
  },
  actionButton: {
    '&:hover': {
      backgroundColor: "#2F80ED",
    },
    padding: '12px',
    backgroundColor: "#2F80ED",
    borderRadius: '1rem',
    border: '1px solid #E1E1E1',
    fontWeight: 500,
    [theme.breakpoints.up('md')]: {
      padding: '15px',
    }
  },
  buttonText: {
    fontWeight: '700',
    color: 'white',
  },
  sepperator: {
    borderBottom: '1px solid #E1E1E1',
    minWidth: '100%',
    marginBottom: '24px',
    marginTop: '24px'
  },
  addressContainer: {
    display: 'flex',
    justifyContent: 'space-between',
    overflow: 'hidden',
    flex: 1,
    whiteSpace: 'nowrap',
    fontSize: '0.83rem',
    textOverflow:'ellipsis',
    cursor: 'pointer',
    padding: '28px 30px',
    borderRadius: '50px',
    border: '1px solid '+colors.borderBlue,
    alignItems: 'center',
    [theme.breakpoints.up('md')]: {
      width: '100%'
    }
  },
  disaclaimer: {
    padding: '12px',
    border: '1px solid rgb(174, 174, 174)',
    borderRadius: '0.75rem',
    marginBottom: '24px',
    background: colors.white
  },
  walletAddress: {
    padding: '0px 12px'
  },
  walletTitle: {
    flex: 1,
    color: colors.darkGray
  },
  grey: {
    color: colors.darkGray
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
        <div className={ classes.investedContainer}>
          <Autocomplete 
          id="country-select-demo"
          style={{ width: 150}}
          options={dashboard.tokenList}
          classes={{
            option: classes.option,
          }}
          getOptionLabel={(option) => option.symbol}
          onChange={this.selectToken}
          renderOption={(option) => ( 
            <React.Fragment> <img alt="" src={option.iconUrl} height="30px" width="30px" />{option.symbol}</React.Fragment>
          )}
          renderInput={(params) => (
            <TextField
              {...params}
              label="From Tokens"
              variant="outlined"
            />
          )}/>
        <TextField 
          id="number" 
          label="Balance"
          type={Number}
          style={{width: 180, marginLeft: "15px"}}
          variant="outlined"
          onChange={this._handleTextFieldChange}/>
        <Button
          className={ classes.buttons }
          variant='outlined'
          disabled={ loading }
          style={{width: 120, marginLeft: "15px"}}
          color="primary"
          onClick={this.checkApproval}>
          <Typography color={'secondary'}>Check approve</Typography>
        </Button>

        
        <Button
          className={ classes.buttons }
          variant='outlined'
          disabled={ loading }
          style={{width: 120, marginLeft: "15px"}}
          color="primary"
          onClick={this.getexceptedReturn}>
          <Typography color={'secondary'}>Get Excepted Return</Typography>
        </Button>
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

  checkApproval = () => {
    const { account } = this.state
    this.setState({ loading: true })
    store._checkIfApprovalIsNeeded()
    
  }

  renderBaseModal = () => {
    const { classes } = this.props;
    const {
      loading,
      dashboard,
      currency
    } = this.state

    return (
        <div className={ classes.portfolioContainer }>
        </div>
    )
  };
}

  export default withRouter(withStyles(styles)(ExchangeDashboard));
