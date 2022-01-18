import { ethers, BigNumber } from "ethers";
import { addresses } from "../constants";
import { abi as ierc20Abi } from "../abi/IERC20.json";
import { abi as OlympusStaking } from "../abi/OlympusStakingv2.json";
import { abi as StakingHelper } from "../abi/StakingHelper.json";
import { clearPendingTxn, fetchPendingTxns, getStakingTypeText } from "./PendingTxnsSlice";
import { createAsyncThunk } from "@reduxjs/toolkit";
import { fetchAccountSuccess, getBalances, loadAccountDetails } from "./AccountSlice";
import { error, info } from "../slices/MessagesSlice";
import { IActionValueAsyncThunk, IChangeApprovalAsyncThunk, IJsonRPCError } from "./interfaces";
import { segmentUA } from "../helpers/userAnalyticHelpers";
import { abi as ConvertAbi } from "../abi/PALtoPDconversion.json";

interface IUAData {
  address: string;
  value: string;
  approved: boolean;
  txHash: string | null;
  type: string | null;
}

function alreadyApprovedToken(token: string, stakeAllowance: BigNumber, unstakeAllowance: BigNumber, presaleAllowance: BigNumber) {
  // set defaults
  let bigZero = BigNumber.from("0");
  let applicableAllowance = bigZero;
  // determine which allowance to check
  if (token === "ohm") {
    applicableAllowance = stakeAllowance;
  } else if (token === "sohm") {
    applicableAllowance = unstakeAllowance;
  }
  else if(token === "presalePD") {
    applicableAllowance = presaleAllowance;
  }
  
  // check if allowance exists
  if (applicableAllowance.gt(bigZero)) return true;
  
  return false;
}

export const changeApproval = createAsyncThunk(
  "stake/changeApproval",
  async ({ token, provider, address, networkID }: IChangeApprovalAsyncThunk, { dispatch }) => {
    if (!provider) {
      dispatch(error("Please connect your wallet!"));
      return;
    }
    
    const signer = provider.getSigner();
    const ohmContract = new ethers.Contract(addresses[networkID].PAL_ADDRESS as string, ierc20Abi, signer);
    const sohmContract = new ethers.Contract(addresses[networkID].SPAL_ADDRESS as string, ierc20Abi, signer);

    const presaleTokenContract = new ethers.Contract(addresses[networkID].PD_ADDRESS as string, ierc20Abi, signer);
    let approveTx;
    let stakeAllowance = await ohmContract.allowance(address, addresses[networkID].STAKING_HELPER_ADDRESS);
    let unstakeAllowance = await sohmContract.allowance(address, addresses[networkID].STAKING_ADDRESS);

    let presaleAllowance = await presaleTokenContract.allowance(address, addresses[networkID].CONVERSION_ADDRESS);
    // return early if approval has already happened
    if (alreadyApprovedToken(token, stakeAllowance, unstakeAllowance, presaleAllowance)) {
      dispatch(info("Approval completed."));
      return dispatch(
        fetchAccountSuccess({
          staking: {
            ohmStake: +stakeAllowance,
            ohmUnstake: +unstakeAllowance,
            presaleAllow: +presaleAllowance,
          },
        }),
      );
    }

    try {
      if (token === "ohm") {
        // won't run if stakeAllowance > 0
        
        approveTx = await ohmContract.approve(
          addresses[networkID].STAKING_HELPER_ADDRESS,
          ethers.utils.parseUnits("1000000000", "gwei").toString(),
        );
      } else if (token === "sohm") {
        approveTx = await sohmContract.approve(
          addresses[networkID].STAKING_ADDRESS,
          ethers.utils.parseUnits("1000000000", "gwei").toString(),
        );
      }else if (token === "presalePD") {
        approveTx = await presaleTokenContract.approve(
          addresses[networkID].CONVERSION_ADDRESS,
          ethers.utils.parseUnits("1000000000", "gwei").toString(),
        );
      } 

      const text = "Approve " + (token === "presalePD" ? "Converting" :(token === "ohm" ? "Staking" : "Unstaking"));

      const pendingTxnType = token === "ohm" ? "approve_staking" : "approve_unstaking";
      dispatch(fetchPendingTxns({ txnHash: approveTx.hash, text, type: pendingTxnType }));

      await approveTx.wait();
    } catch (e: unknown) {
      dispatch(error((e as IJsonRPCError).message));
      return;
    } finally {
      if (approveTx) {
        dispatch(clearPendingTxn(approveTx.hash));
      }
    }

    // go get fresh allowances
    stakeAllowance = await ohmContract.allowance(address, addresses[networkID].STAKING_HELPER_ADDRESS);
    unstakeAllowance = await sohmContract.allowance(address, addresses[networkID].STAKING_ADDRESS);
    presaleAllowance = await presaleTokenContract.allowance(address, addresses[networkID].CONVERSION_ADDRESS);
    return dispatch(
      fetchAccountSuccess({
        staking: {
          ohmStake: +stakeAllowance,
          ohmUnstake: +unstakeAllowance,
          presaleAllow: +presaleAllowance,
        },
      }),
    );
  },
);

export const changeStake = createAsyncThunk(
  "stake/changeStake",
  async ({ action, value, provider, address, networkID, callback, isOld }: IActionValueAsyncThunk, { dispatch }) => {
    if (!provider) {
      dispatch(error("Please connect your wallet!"));
      return;
    }

    const signer = provider.getSigner();
    let staking, stakingHelper;
    // if (isOld) {
    //   staking = new ethers.Contract(addresses[networkID].OLD_STAKING_ADDRESS as string, OlympusStaking, signer);
    //   stakingHelper = new ethers.Contract(
    //     addresses[networkID].OLD_STAKING_HELPER_ADDRESS as string,
    //     StakingHelper,
    //     signer,
    //   );
    // } else {
      staking = new ethers.Contract(addresses[networkID].STAKING_ADDRESS as string, OlympusStaking, signer);
      stakingHelper = new ethers.Contract(addresses[networkID].STAKING_HELPER_ADDRESS as string, StakingHelper, signer);
    // }

    let stakeTx;
    let uaData: IUAData = {
      address: address,
      value: value,
      approved: true,
      txHash: null,
      type: null,
    };

    try {
      if (action === "stake") {
        uaData.type = "stake";
        stakeTx = await stakingHelper.stake(ethers.utils.parseUnits(value, "gwei"), address);
      } else {
        uaData.type = "unstake";
        stakeTx = await staking.unstake(ethers.utils.parseUnits(value, "gwei"), true);
      }
      const pendingTxnType = action === "stake" ? "staking" : "unstaking";
      uaData.txHash = stakeTx.hash;
      dispatch(fetchPendingTxns({ txnHash: stakeTx.hash, text: getStakingTypeText(action), type: pendingTxnType }));
      callback?.();
      await stakeTx.wait();
      await new Promise<void>((resolve, reject) => {
        setTimeout(async () => {
          try {
            await dispatch(loadAccountDetails({ networkID, address, provider }));
            resolve();
          } catch (error) {
            reject(error);
          }
        }, 5000);
      });
    } catch (e: unknown) {
      uaData.approved = false;
      const rpcError = e as IJsonRPCError;
      if (rpcError.code === -32603 && rpcError.message.indexOf("ds-math-sub-underflow") >= 0) {
        dispatch(
          error("You may be trying to stake more than your balance! Error code: 32603. Message: ds-math-sub-underflow"),
        );
      } else {
        dispatch(error(rpcError.message));
      }
      return;
    } finally {
      if (stakeTx) {
        // segmentUA(uaData);

        dispatch(clearPendingTxn(stakeTx.hash));
      }
    }
    dispatch(getBalances({ address, networkID, provider }));
  },
);


export const changeConvert = createAsyncThunk(
  "stake/changeConvert",
  async ({ action, value, provider, address, networkID, callback, isOld }: IActionValueAsyncThunk, { dispatch }) => {
    if (!provider) {
      dispatch(error("Please connect your wallet!"));
      return;
    }

    const signer = provider.getSigner();
    let converting = new ethers.Contract(addresses[networkID].CONVERSION_ADDRESS as string, ConvertAbi, signer);

    let convertTx;
    let uaData: IUAData = {
      address: address,
      value: value,
      approved: true,
      txHash: null,
      type: null,
    };
    console.log('debug converting', converting)
    try {
      uaData.type = "convert";
      convertTx = await converting.conversion(ethers.utils.parseUnits(value, "gwei"));

      const pendingTxnType = "converting"
      uaData.txHash = convertTx.hash;
      dispatch(fetchPendingTxns({ txnHash: convertTx.hash, text: getStakingTypeText(action), type: pendingTxnType }));
      callback?.();
      await convertTx.wait();
      await new Promise<void>((resolve, reject) => {
        setTimeout(async () => {
          try {
            await dispatch(loadAccountDetails({ networkID, address, provider }));
            resolve();
          } catch (error) {
            reject(error);
          }
        }, 5000);
      });
    } catch (e: unknown) {
      uaData.approved = false;
      const rpcError = e as IJsonRPCError;
      if (rpcError.code === -32603 && rpcError.message.indexOf("ds-math-sub-underflow") >= 0) {
        dispatch(
          error("You may be trying to convert more than your balance! Error code: 32603. Message: ds-math-sub-underflow"),
        );
      } else {
        dispatch(error(rpcError.message));
      }
      return;
    } finally {
      if (convertTx) {
        dispatch(clearPendingTxn(convertTx.hash));
      }
    }
    dispatch(getBalances({ address, networkID, provider }));
  },
);