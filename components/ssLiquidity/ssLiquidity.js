import React, { useState, useEffect } from 'react';
import { Paper, Typography, Button, CircularProgress, SvgIcon, Grid } from '@material-ui/core';
import BigNumber from 'bignumber.js';

import classes from './ssLiquidity.module.css';

import RewardsTable from './ssLiquidityTable.js'

import stores from '../../stores'
import { ACTIONS, CONTRACTS } from '../../stores/constants';

function NoRewardsIcon(props) {
  const { color, className } = props;
  return (
    <SvgIcon viewBox="0 0 64 64" strokeWidth="1" className={className}>
    <g strokeWidth="2" transform="translate(0, 0)"><path d="M15.029,48.971A24,24,0,0,1,48.971,15.029" fill="none" stroke="#686c7a" strokeMiterlimit="10" strokeWidth="2" data-cap="butt" strokeLinecap="butt" strokeLinejoin="miter"></path><path d="M52.789,20A24.006,24.006,0,0,1,20,52.789" fill="none" stroke="#686c7a" strokeLinecap="square" strokeMiterlimit="10" strokeWidth="2" strokeLinejoin="miter"></path><line x1="60" y1="4" x2="4" y2="60" fill="none" stroke="#686c7a" strokeLinecap="square" strokeMiterlimit="10" strokeWidth="2" data-color="color-2" strokeLinejoin="miter"></line></g>
    </SvgIcon>
  );
}

export default function ssLiquidity() {

  const [ claimLoading, setClaimLoading ] = useState(false)
  const [ claimedAsset, setClaimedAsset ] = useState(null)
  const [ claimable, setClaimable ] = useState([])

  useEffect(() => {
    const forexUpdated = () => {
      getClaimable()
    }

    getClaimable()

    const claimReturned = () => {
      setClaimLoading(false)
    }

    stores.emitter.on(ACTIONS.UPDATED, forexUpdated);
    stores.emitter.on(ACTIONS.FIXED_FOREX_ALL_CLAIMED, claimReturned);
    stores.emitter.on(ACTIONS.ERROR, claimReturned);
    return () => {
      stores.emitter.removeListener(ACTIONS.UPDATED, forexUpdated);
      stores.emitter.removeListener(ACTIONS.FIXED_FOREX_ALL_CLAIMED, claimReturned);
      stores.emitter.removeListener(ACTIONS.ERROR, claimReturned);
    };
  }, []);

  const getClaimable = () => {
    const gauges = stores.stableSwapStore.getStore('assets')
    const rewards = stores.stableSwapStore.getStore('rewards')

    const cl = []

    if(rewards && rewards.feeDistribution && BigNumber(rewards.feeDistribution.earned).gt(0)) {
      cl.push({
        type: 'Solid Swap',
        description: 'Fee Claim',
        earned: rewards.feeDistribution.earned,
        symbol: 'ibEUR'
      })
    }
    if(rewards && rewards.veIBFFDistribution && BigNumber(rewards.veIBFFDistribution.earned).gt(0)) {
      cl.push({
        type: 'Solid Swap',
        description: 'Vesting Rewards',
        earned: rewards.veIBFFDistribution.earned,
        symbol: 'rKP3R'
      })
    }

    if(gauges) {
      for(let i = 0; i < gauges.length; i++) {
        if(gauges[i].gauge && BigNumber(gauges[i].gauge.earned).gt(0)) {
          cl.push({
            type: 'Curve Gauge Rewards',
            description: gauges[i].name,
            earned: gauges[i].gauge.earned,
            symbol: 'CRV',
            address: gauges[i].address,
            gauge: gauges[i]
          })
        }
      }
    }

    setClaimable(cl)
  }

  const onClaim = () => {
    setClaimLoading(true)
    setClaimedAsset(null)
    stores.dispatcher.dispatch({ type: ACTIONS.FIXED_FOREX_CLAIM_ALL, content: { claimable }})
  }

  return (
    <Paper elevation={0} className={ classes.container }>
      {claimable.length>0 ?
        <div className={classes.hasRewards}>
          <RewardsTable claimable={ claimable } />
          <div className={ classes.infoSection }>
          </div>
          <div className={ classes.actionButtons }>
            <Button
              className={ classes.buttonOverride }
              variant='contained'
              size='large'
              color='primary'
              disabled={ claimLoading }
              onClick={ onClaim }
              >
              <Typography className={ classes.actionButtonText }>{ claimLoading ? `Claiming` : `Claim all` }</Typography>
              { claimLoading && <CircularProgress size={10} className={ classes.loadingCircle } /> }
            </Button>
          </div>
        </div>

        :

        <div className={classes.noRewards}>
          <Grid container spacing={0} className={classes.centerGridRows}>
            <Grid item lg={12} md={12} sm={12} xs={12}>
              <NoRewardsIcon className={ classes.overviewIcon } />
            </Grid>
            <Grid item lg={12} md={12} sm={12} xs={12}>
              <Typography variant="h5">You have not provided any liquidity</Typography>
            </Grid>
          </Grid>
        </div>
      }
    </Paper>
  );
}
