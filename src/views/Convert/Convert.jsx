import { useCallback, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Box,
  Button,
  FormControl,
  Grid,
  InputAdornment,
  InputLabel,
  Link,
  OutlinedInput,
  Paper,
  Tab,
  Tabs,
  Typography,
  Zoom,
} from "@material-ui/core";
import NewReleases from "@material-ui/icons/NewReleases";
import RebaseTimer from "../../components/RebaseTimer/RebaseTimer";
import TabPanel from "../../components/TabPanel";
import { getOhmTokenImage, getTokenImage, trim } from "../../helpers";
import { changeApproval, changeConvert } from "../../slices/StakeThunk";
import useMediaQuery from "@material-ui/core/useMediaQuery";
import "./convert.scss";
import { useWeb3Context } from "src/hooks/web3Context";
import { isPendingTxn, txnButtonText } from "src/slices/PendingTxnsSlice";
import { Skeleton } from "@material-ui/lab";
import ExternalStakePool from "./ExternalStakePool";
import { error } from "../../slices/MessagesSlice";
import { ethers, BigNumber } from "ethers";

function a11yProps(index) {
  return {
    id: `simple-tab-${index}`,
    "aria-controls": `simple-tabpanel-${index}`,
  };
}

const sOhmImg = getTokenImage("sohm");
const ohmImg = getOhmTokenImage(16, 16);

function Convert() {
  const dispatch = useDispatch();
  const { provider, address, connected, connect, chainID } = useWeb3Context();

  const [zoomed, setZoomed] = useState(false);
  const [view, setView] = useState(0);
  const view1 = 0;
  const [quantity, setQuantity] = useState("");
  const [oldquantity, setOldQuantity] = useState("");

  const isAppLoading = useSelector(state => state.app.loading);

  const ohmBalance = useSelector(state => {
    return state.account.balances && state.account.balances.wand;
  });

  const shecBalance = useSelector(state => {
    return state.account.balances && state.account.balances.swand;
  });
  const oldshecBalance = useSelector(state => {
    return state.account.balances && state.account.balances.oldshec;
  });
  const wsohmBalance = useSelector(state => {
    return state.account.balances && state.account.balances.wswand;
  });
  const stakeAllowance = useSelector(state => {
    return state.account.staking && state.account.staking.wandStake;
  });
  const unstakeAllowance = useSelector(state => {
    return state.account.staking && state.account.staking.wandUnstake;
  });
  const oldunstakeAllowance = useSelector(state => {
    return state.account.staking && state.account.staking.oldhecUnstake;
  });


  const pendingTransactions = useSelector(state => {
    return state.pendingTransactions;
  });

  const presaleBalance = useSelector(state => {
    return state.account.balances && state.account.balances.presb;
  });

  const presalePDAllowance = useSelector(state => {
    return state.account.staking && state.account.staking.presaleAllow;
  });

  const convertIsLive = useSelector(state => {
    return state.account.staking && state.account.staking.convertLive;
  });


  // const testVal = ethers.utils.parseUnits("1", "gwei");
  console.log('debug convert', convertIsLive, presaleBalance)

  const setMax = () => {
    if (view === 0) {
      setQuantity(presaleBalance);
    } else {
      setQuantity(shecBalance);
    }
  };

  const onSeekApproval = async token => {
    await dispatch(changeApproval({ address, token, provider, networkID: chainID }));
  };

  const onChangeConvert = async (action, isOld) => {
    // eslint-disable-next-line no-restricted-globals
    let value = quantity;
    if (isNaN(value) || value === 0 || value === "") {
      // eslint-disable-next-line no-alert
      return dispatch(error("Please enter a value!"));
    }
    
    // 1st catch if quantity > balance
    let gweiValue = ethers.utils.parseUnits(value, "gwei");
    if (action === "convert" && gweiValue.gt(ethers.utils.parseUnits(presaleBalance, "gwei"))) {
      return dispatch(error("You cannot convert more than your PD balance."));
    }

    await dispatch(
      changeConvert({
        address,
        action,
        value: value.toString(),
        provider,
        networkID: chainID,
        callback: () => (setQuantity("")),
        isOld: isOld,
      }),
    );
  };
  
  const hasAllowance = useCallback(
    token => {
      if (token === "ohm") return stakeAllowance > 0;
      if (token === "sohm") return unstakeAllowance > 0;
      if (token === "oldshec") return oldunstakeAllowance > 0;
      if (token === "presalePD") return presalePDAllowance > 0;
      return 0;
    },
    [stakeAllowance, unstakeAllowance, presalePDAllowance],
    );

  const isAllowanceDataLoading = (presalePDAllowance == null && view === 0);
  let modalButton = [];

  modalButton.push(
    <Button variant="contained" color="primary" className="connect-button" onClick={connect} key={1}>
      Connect Wallet
    </Button>,
  );

  const changeView = (event, newView) => {
    setView(newView);
  };

  return (
    <>
      <div id="stake-view">
        <Zoom in={true} onEntered={() => setZoomed(true)}>
          <Paper className={`ohm-card`}>
            <Grid container direction="column" spacing={2}>
              {
                <>
                <Grid item>
                  <div className="card-header">
                    <div className="data-display"> 
                    <Typography variant="h5"> Conversion</Typography>
                    {
                      convertIsLive ? 
                      (
                        <Typography variant="p"> Conversion start</Typography>
                      ) : (
                        <Typography variant="p"> Conversion don't start </Typography>
                      )
                    }
                      
                    </div>
                  </div>
                </Grid>
                <div className="staking-area">
                  {!address ? (
                    <div className="stake-wallet-notification">
                      <div className="wallet-menu" id="wallet-menu">
                        {modalButton}
                      </div>
                      <Typography variant="h6">Please connect your wallet</Typography>
                    </div>
                  ) : (
                    <>
                      <Box className="stake-action-area">
                        {/* <Tabs
                          key={String(zoomed)}
                          centered
                          value={view}
                          textColor="primary"
                          indicatorColor="primary"
                          className="stake-tab-buttons"
                          onChange={changeView}
                          aria-label="stake tabs"
                        >
                          <Tab label="Stake" {...a11yProps(0)} />
                          <Tab label="Unstake" {...a11yProps(1)} />
                        </Tabs> */}
  
                        <Box className="stake-action-row " display="flex" alignItems="center">
                          {address && !isAllowanceDataLoading ? (
                            (!hasAllowance("presalePD") && view === 0) ? (
                              <Box className="help-text">
                                <Typography variant="body1" className="stake-note" color="textSecondary">
                                    <>
                                      First time converting to <b>PAL</b>?
                                      <br />
                                      Please approve PD to convert PAL
                                    </>
                                </Typography>
                              </Box>
                            ) : (
                              <FormControl className="ohm-input" variant="outlined" color="primary">
                                <InputLabel htmlFor="amount-input"></InputLabel>
                                <OutlinedInput
                                  id="amount-input"
                                  type="number"
                                  placeholder="Enter an amount"
                                  className="stake-input"
                                  value={quantity}
                                  onChange={e => setQuantity(e.target.value)}
                                  labelWidth={0}
                                  endAdornment={
                                    <InputAdornment position="end">
                                      <Button variant="text" onClick={setMax} color="inherit">
                                        Max
                                      </Button>
                                    </InputAdornment>
                                  }
                                />
                              </FormControl>
                            )
                          ) : (
                            <Skeleton width="150px" />
                          )}
  
                          <TabPanel value={view} index={0} className="stake-tab-panel">
                            {isAllowanceDataLoading ? (
                              <Skeleton />
                            ) : address && hasAllowance("presalePD") ? (
                              <Button
                                className="stake-button"
                                variant="contained"
                                color="primary"
                                disabled={isPendingTxn(pendingTransactions, "converting")}
                                onClick={() => {
                                  onChangeConvert("convert");
                                }}
                              >
                                {txnButtonText(pendingTransactions, "converting", "Convert")}
                              </Button>
                            ) : (
                              <Button
                                className="stake-button"
                                variant="contained"
                                color="primary"
                                disabled={isPendingTxn(pendingTransactions, "approve_converting")}
                                onClick={() => {
                                  onSeekApproval("presalePD");
                                  console.log('seekApproval');
                                }}
                              >
                                {txnButtonText(pendingTransactions, "approve_converting", "Approve")}
                              </Button>
                            )}
                          </TabPanel>
                        
                        </Box>
                      </Box>
  
                      <div className={`stake-user-data`}>
                        <div className="data-row">
                          <Typography variant="body1">PD Balance</Typography>
                          <Typography variant="body1">
                            {isAppLoading ? <Skeleton width="80px" /> : <>{trim(presaleBalance, 4)} PD</>}
                          </Typography>
                        </div>
  
                        {/* <div className="data-row">
                          <Typography variant="body1">PAL Balance</Typography>
                          <Typography variant="body1">
                            {isAppLoading ? <Skeleton width="80px" /> : <>{trim(ohmBalance, 4)} PAL</>}
                          </Typography>
                        </div> */}
                      </div>
                    </>
                  )}
                </div>
                </>
              }
            </Grid>
          </Paper>
        </Zoom>
      </div>
    </>
  );
}

export default Convert;
