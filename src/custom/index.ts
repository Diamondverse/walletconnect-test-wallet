import { IJsonRpcRequest } from "@walletconnect/types";
import { CF_PATH } from "@connext/types";

import connextLogo from "./assets/connext-logo.svg";

import { IAppState } from "../App";
import { RINKEBY_CHAIN_ID, MAINNET_CHAIN_ID } from "../helpers/constants";
import { handleChannelRequests, createChannel } from "./helpers/connext";
import supportedChains from "../helpers/chains";
import { ICustomSettings } from "../helpers/types";

export const CHANNEL_SUPPORTED_CHAIN_IDS = [MAINNET_CHAIN_ID, RINKEBY_CHAIN_ID];

const custom: ICustomSettings = {
  name: "Connext",
  logo: connextLogo,
  chainId: RINKEBY_CHAIN_ID,
  derivationPath: CF_PATH,
  numberOfAccounts: 1,
  colors: {
    defaultColor: "12, 12, 13",
    backgroundColor: "231, 171, 75",
  },
  chains: supportedChains.filter(x => CHANNEL_SUPPORTED_CHAIN_IDS.includes(x.chain_id)),
  styleOpts: {
    showPasteUri: true,
    showVersion: true,
  },
  rpcController: {
    condition: payload => payload.method.startsWith("chan_"),
    handler: (payload, state, setState) => onRpcRequest(payload, state, setState),
  },
  onInit: (state, setState) => onCreateChannel(state, setState),
  onUpdate: (state, setState) => onCreateChannel(state, setState),
};

async function onRpcRequest(payload: IJsonRpcRequest, state: IAppState, setState: any) {
  if (!state.connector) {
    return;
  }
  try {
    const result = await handleChannelRequests(payload);
    state.connector.approveRequest({
      id: payload.id,
      result,
    });
  } catch (e) {
    state.connector.rejectRequest({
      id: payload.id,
      error: { message: e.message },
    });
  }
}

async function onCreateChannel(state: IAppState, setState: any) {
  const { chainId } = state;

  await setState({ loading: true });

  try {
    await createChannel(chainId);
  } catch (e) {
    console.error(e.toString());
    await setState({ loading: false });
    return;
  }

  await setState({ loading: false });
}

export default custom;