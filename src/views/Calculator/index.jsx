import { useSelector, useDispatch } from "react-redux";
import React, { useEffect, useState } from "react";
import "./calculator.scss";
import { useWeb3Context } from "../../hooks";
import store from "src/store";
import { Grid, InputAdornment, OutlinedInput, Zoom, Slider, Paper, Box, Typography } from "@material-ui/core";
import { trim } from "../../helpers";
import { Skeleton } from "@material-ui/lab";

function Calculator() {
    const isAppLoading = useSelector(state => state.app.loading);
    const marketPrice = useSelector(state => {
        return state.app.marketPrice;
    });
    const stakingAPY = useSelector(state => {
        return state.app.stakingAPY;
    });
    const shecBalance = useSelector(state => {
        console.log('debug->stoken',state.account.balances);
        return state.account.balances && state.account.balances.sPAL;
    });

   

    const trimmedStakingAPY = trim(stakingAPY * 100, 1);
    const trimmedsHecBalance = trim(Number(shecBalance), 4);
    const trimeMarketPrice = trim(marketPrice, 2);

    const [shecAmount, setsHecAmount] = useState(trimmedsHecBalance);
    const [rewardYield, setRewardYield] = useState(trimmedStakingAPY);
    const [priceAtPurchase, setPriceAtPurchase] = useState(trimeMarketPrice);
    const [futureMarketPrice, setFutureMarketPrice] = useState(trimeMarketPrice);
    const [days, setDays] = useState(30);

    const [rewardsEstimation, setRewardsEstimation] = useState("0");
    const [potentialReturn, setPotentialReturn] = useState("0");

    const calcInitialInvestment = () => {
        const shec = Number(shecAmount) || 0;
        const price = parseFloat(priceAtPurchase) || 0;
        const amount = shec * price;
        return trim(amount, 2);
    };

    const calcCurrentWealth = () => {
        const shec = Number(shecAmount) || 0;
        const price = parseFloat(trimeMarketPrice);
        const amount = shec * price;
        return trim(amount, 2);
    };

    const [initialInvestment, setInitialInvestment] = useState(calcInitialInvestment());

    useEffect(() => {
        const newInitialInvestment = calcInitialInvestment();
        setInitialInvestment(newInitialInvestment);
    }, [shecAmount, priceAtPurchase]);

    const calcNewBalance = () => {
        let value = parseFloat(rewardYield) / 100;
        value = Math.pow(value - 1, 1 / (365 * 3)) - 1 || 0;
        let balance = Number(shecAmount);
        for (let i = 0; i < days * 3; i++) {
            balance += balance * value;
        }
        return balance;
    };

    useEffect(() => {
        const newBalance = calcNewBalance();
        setRewardsEstimation(trim(newBalance, 6));
        const newPotentialReturn = newBalance * (parseFloat(futureMarketPrice) || 0);
        setPotentialReturn(trim(newPotentialReturn, 2));
    }, [days, rewardYield, futureMarketPrice, shecAmount]);

    return (
        <div className="calculator-view">
            <Zoom in={true}>
                <Paper className="ohm-card calculator-card">
                    <Grid className="calculator-card-grid" container direction="column" spacing={2}>
                        <Grid item>
                            <Box className="calculator-card-header">
                                <Typography variant="h5">Calculator</Typography>
                                <Typography variant="body2">Estimate your returns</Typography>
                            </Box>
                        </Grid>
                        <Grid item>
                            <Box className="calculator-card-metrics">
                                <Grid container spacing={2}>
                                    <Grid item xs={12} sm={4} md={4} lg={4}>
                                        <Box className="calculator-card-apy">
                                            <Typography variant="h5" color="textSecondary">PAL Price</Typography>
                                            <Typography variant="h4">{isAppLoading ? <Skeleton width="100px" /> : `$${trimeMarketPrice}`}</Typography>
                                        </Box>
                                    </Grid>
                                    <Grid item xs={6} sm={4} md={4} lg={4}>
                                        <Box className="calculator-card-tvl">
                                            <Typography variant="h5" color="textSecondary">Current APY</Typography>
                                            <Typography variant="h4">
                                                {isAppLoading ? <Skeleton width="100px" /> : <>{new Intl.NumberFormat("en-US").format(Number(trimmedStakingAPY))}%</>}
                                            </Typography>
                                        </Box>
                                    </Grid>
                                    <Grid item xs={6} sm={4} md={4} lg={4}>
                                        <Box className="calculator-card-index">
                                            <Typography variant="h5" color="textSecondary">Your sPAL Balance</Typography>
                                            <Typography variant="h4">{isAppLoading ? <Skeleton width="100px" /> : <>{trimmedsHecBalance} sPAL</>}</Typography>
                                        </Box>
                                    </Grid>
                                </Grid>
                            </Box>
                        </Grid>

                        <Box className="calculator-card-area">
                            <Box>
                                <Box className="calculator-card-action-area">
                                    <Grid container spacing={3}>
                                        <Grid item xs={12} sm={6}>
                                            <Box className="calculator-card-action-area-inp-wrap">
                                                <Typography variant="h6">sPAL Amount</Typography>
                                                <OutlinedInput
                                                    type="number"
                                                    placeholder="Amount"
                                                    className="calculator-card-action-input"
                                                    value={shecAmount}
                                                    onChange={e => setsHecAmount(e.target.value)}
                                                    labelWidth={0}
                                                    endAdornment={
                                                        <InputAdornment position="end">
                                                            <div onClick={() => setsHecAmount(trimmedsHecBalance)} className="stake-card-action-input-btn">
                                                                <Typography>Max</Typography>
                                                            </div>
                                                        </InputAdornment>
                                                    }
                                                />
                                            </Box>
                                        </Grid>
                                        <Grid item xs={12} sm={6}>
                                            <Box className="calculator-card-action-area-inp-wrap">
                                                <Typography variant="h6">APY (%)</Typography>
                                                <OutlinedInput
                                                    type="number"
                                                    placeholder="Amount"
                                                    className="calculator-card-action-input"
                                                    value={rewardYield}
                                                    onChange={e => setRewardYield(e.target.value)}
                                                    labelWidth={0}
                                                    endAdornment={
                                                        <InputAdornment position="end">
                                                            <div onClick={() => setRewardYield(trimmedStakingAPY)} className="stake-card-action-input-btn">
                                                                <Typography>Current</Typography>
                                                            </div>
                                                        </InputAdornment>
                                                    }
                                                />
                                            </Box>
                                        </Grid>
                                        <Grid item xs={12} sm={6}>
                                            <Box className="calculator-card-action-area-inp-wrap">
                                                <Typography variant="h6">PAL price at purchase ($)</Typography>
                                                <OutlinedInput
                                                    type="number"
                                                    placeholder="Amount"
                                                    className="calculator-card-action-input"
                                                    value={priceAtPurchase}
                                                    onChange={e => setPriceAtPurchase(e.target.value)}
                                                    labelWidth={0}
                                                    endAdornment={
                                                        <InputAdornment position="end">
                                                            <div onClick={() => setPriceAtPurchase(trimeMarketPrice)} className="stake-card-action-input-btn">
                                                                <Typography>Current</Typography>
                                                            </div>
                                                        </InputAdornment>
                                                    }
                                                />
                                            </Box>
                                        </Grid>
                                        <Grid item xs={12} sm={6}>
                                            <Box className="calculator-card-action-area-inp-wrap">
                                                <Typography variant="h6">Future PAL market price ($)</Typography>
                                                <OutlinedInput
                                                    type="number"
                                                    placeholder="Amount"
                                                    className="calculator-card-action-input"
                                                    value={futureMarketPrice}
                                                    onChange={e => setFutureMarketPrice(e.target.value)}
                                                    labelWidth={0}
                                                    endAdornment={
                                                        <InputAdornment position="end">
                                                            <div onClick={() => setFutureMarketPrice(trimeMarketPrice)} className="stake-card-action-input-btn">
                                                                <Typography>Current</Typography>
                                                            </div>
                                                        </InputAdornment>
                                                    }
                                                />
                                            </Box>
                                        </Grid>
                                    </Grid>
                                </Box>
                                <Box className="calculator-days-slider-wrap">
                                    <Typography >{`${days} day${days > 1 ? "s" : ""}`}</Typography>
                                    <Slider className="calculator-days-slider" min={1} max={365} value={days} onChange={(e, newValue) => setDays(newValue)} />
                                </Box>
                                <Box className="calculator-user-data">
                                    <Box className="data-row">
                                        <Typography>Your initial investment</Typography>
                                        <Typography>{isAppLoading ? <Skeleton width="80px" /> : <>${initialInvestment}</>}</Typography>
                                    </Box>
                                    <Box className="data-row">
                                        <Typography>Current wealth</Typography>
                                        <Typography>{isAppLoading ? <Skeleton width="80px" /> : <>${calcCurrentWealth()}</>}</Typography>
                                    </Box>
                                    <Box className="data-row">
                                        <Typography>PAL rewards estimation</Typography>
                                        <Typography>{isAppLoading ? <Skeleton width="80px" /> : <>{rewardsEstimation} PAL</>}</Typography>
                                    </Box>
                                    <Box className="data-row">
                                        <Typography>Potential return</Typography>
                                        <Typography>{isAppLoading ? <Skeleton width="80px" /> : <>${potentialReturn}</>}</Typography>
                                    </Box>
                                    <Box className="data-row">
                                        <Typography>Potential number of Tesla Roadsters</Typography>
                                        <Typography>{isAppLoading ? <Skeleton width="80px" /> : <>{Math.floor(Number(potentialReturn) / 220000)}</>}</Typography>
                                    </Box>
                                </Box>
                            </Box>
                        </Box>
                    </Grid>
                </Paper>
            </Zoom>
        </div>
    );
}

export default Calculator;