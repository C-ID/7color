import React, { Component } from "react";
import { withRouter } from "react-router-dom";
import { withStyles } from '@material-ui/core/styles';
import { ArrowRight, AlertTriangle } from 'react-feather'
import * as moment from 'moment';
import {
  Typography,
  Tooltip,
  TextField,
  MenuItem
} from '@material-ui/core';
import { colors } from '../../theme'

import Loader from '../loader'
import InfoIcon from '@material-ui/icons/Info';

import {
  ERROR,
  CONNECTION_CONNECTED,
  CONNECTION_DISCONNECTED,
  GET_TOEKEN_DASHBOARD_SNAPSHOT,
  TOEKEN_DASHBOARD_SNAPSHOT_RETURNED,
} from '../../constants'

import Store from "../../stores";

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
    alignItems: 'center'
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
  investedContainer: {
    display: 'flex',
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'flex-start',
    minWidth: '100%',
    marginTop: '40px',
    [theme.breakpoints.up('md')]: {
      minWidth: '900px',
    }
  },
  disaclaimer: {
    padding: '12px',
    border: '1px solid rgb(174, 174, 174)',
    borderRadius: '0.75rem',
    marginBottom: '24px',
    background: colors.white
  },
  portfolioContainer: {
    width: '100%',
    display: 'flex',
    justifyContent: 'space-between',
  },
  vaultContainer: {
    padding: '28px 30px',
    borderRadius: '50px',
    border: '1px solid '+colors.borderBlue,
    background: colors.white,
    display: 'flex',
    flexDirection: 'column',
    width: '100%',
  },
  earnContainer: {
    marginTop: '40px',
    padding: '28px 30px',
    borderRadius: '50px',
    border: '1px solid '+colors.borderBlue,
    background: colors.white,
    display: 'flex',
    flexDirection: 'column',
    width: '100%',
  },
  gray: {
    color: colors.darkGray
  },
  between: {
    width: '40px',
    height: '40px'
  },
  titleBalance: {
    padding: '28px 30px',
    borderRadius: '50px',
    border: '1px solid '+colors.borderBlue,
    background: colors.white,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    cursor: 'pointer'
  },
  prettyAlign: {
    display: 'flex',
    alignItems: 'center'
  },
  infoIcon: {
    fontSize: '1em',
    marginRight: '6px'
  },
  assetSummary: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    flex: 1,
    flexWrap: 'wrap',
    [theme.breakpoints.up('sm')]: {
      flexWrap: 'nowrap'
    }
  },
  assetIcon: {
    display: 'flex',
    alignItems: 'center',
    verticalAlign: 'middle',
    borderRadius: '20px',
    height: '30px',
    width: '30px',
    textAlign: 'center',
    cursor: 'pointer',
    marginRight: '12px',
  },
  heading: {
    display: 'none',
    [theme.breakpoints.up('md')]: {
      display: 'flex',
      flexDirection: 'column',
      minWidth: '200px',
      alignItems: 'flex-end'
    }
  },
  headingName: {
    display: 'flex',
    alignItems: 'center',
    width: '325px',
    [theme.breakpoints.down('sm')]: {
      width: 'auto',
      flex: 1
    }
  },
  flexy: {
    display: 'flex',
    alignItems: 'center'
  },
  vault: {
    borderBottom: '1px solid rgba(25, 101, 233, 0.2)',
    padding: '12px',
    '&:last-child': {
      borderBottom: 'none'
    }
  },
  sectionHeading: {
    color: colors.darkGray,
    width: '100%',
    marginLeft: '54px'
  },
  inline: {
    display: 'flex',
    alignItems: 'baseline'
  },
  symbol: {
    paddingLeft: '6px'
  },
  symbolAt: {
    paddingLeft: '6px',
    color: colors.darkGray
  },
  basedOnContainer: {
    display: 'flex',
    width: '100%',
    justifyContent: 'flex-end',
    alignItems: 'center'
  }
});

class ExchangeDashboard extends Component {

  constructor(props) {
    super()

    const dashboard = store.getStore('dashboard')
    const account = store.getStore('account')
    const currency = localStorage.getItem('token-dashboard-currency')

    this.state = {
      dashboard: dashboard,
      loading: true,
      currency: currency ? currency : 'USD', // USD / ETH,
    }

    if(account && account.address) {
      dispatcher.dispatch({ type: GET_TOEKEN_DASHBOARD_SNAPSHOT, content: {} })
    }
  }

  componentWillMount() {
    emitter.on(ERROR, this.errorReturned);
    emitter.on(CONNECTION_CONNECTED, this.connectionConnected);
    emitter.on(TOEKEN_DASHBOARD_SNAPSHOT_RETURNED, this.dashboardSnapshotReturned);
  }

  componentWillUnmount() {
    emitter.removeListener(ERROR, this.errorReturned);
    emitter.removeListener(CONNECTION_CONNECTED, this.connectionConnected);
    emitter.removeListener(TOEKEN_DASHBOARD_SNAPSHOT_RETURNED, this.dashboardSnapshotReturned);
  };

  dashboardSnapshotReturned = () => {
    this.setState({
      loading: false,
      dashboard: store.getStore('dashboard')
    })
  };

  connectionConnected = () => {
    dispatcher.dispatch({ type: GET_TOEKEN_DASHBOARD_SNAPSHOT, content: {} })
  };

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
          <div className={ classes.portfolioContainer }>
            <div className={ classes.titleBalance } onClick={ this.balanceClicked }>
              { currency === 'USD' && <Typography variant={ 'h2' }>$ { "100000" }</Typography> }
              { currency === 'ETH' &&
                <div className={ classes.inline }>
                  <Typography className={ classes.symbol } variant={ 'h3' }>ETH</Typography>
                </div>
              }
              <Typography variant={ 'h4' } className={ classes.gray }>Portfolio Balance</Typography>
            </div>
            <ArrowRight size="50" color={colors.black} style={{ marginLeft: '4px', minWidth: '16px' }}></ArrowRight>
            <div className={ classes.titleBalance } onClick={ this.balanceClicked }>
              { currency === 'USD' && <Typography variant={ 'h2' }>$ { "30000" }</Typography> }
              { currency === 'ETH' &&
                <div className={ classes.inline }>
                  <Typography variant={ 'h2' } noWrap>{ "20000" }</Typography >
                  <Typography className={ classes.symbol } variant={ 'h3' }>ETH</Typography>
                </div>
              }
            <Typography variant={ 'h4' } className={ `${classes.gray} ${classes.prettyAlign}` }>
                Daily Growth
            </Typography>
            </div>
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
