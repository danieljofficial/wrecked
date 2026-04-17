import {
  Contract,
  rpc,
  TransactionBuilder,
  BASE_FEE,
  xdr,
  Address,
  nativeToScVal,
  scValToNative,
} from "@stellar/stellar-sdk";
import { signTransaction } from "@stellar/freighter-api";
import { RPC_URL, NETWORK_PASSPHRASE } from "../lib/constants";

export const server = new rpc.Server(RPC_URL, { allowHttp: true });

export const invokeContract = async (
  contractId: string,
  method: string,
  args: xdr.ScVal[],
  signerAddress: string,
): Promise<unknown> => {
  const account = await server.getAccount(signerAddress);
  const contract = new Contract(contractId);

  const tx = new TransactionBuilder(account, {
    fee: BASE_FEE,
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addOperation(contract.call(method, ...args))
    .setTimeout(30)
    .build();

  const preparedTx = await server.prepareTransaction(tx);
  const txXdr = preparedTx.toXDR();

  const { signedTxXdr } = await signTransaction(txXdr, {
    networkPassphrase: NETWORK_PASSPHRASE,
  });

  const signedTx = TransactionBuilder.fromXDR(signedTxXdr, NETWORK_PASSPHRASE);
  const sendResponse = await server.sendTransaction(signedTx);

  if (sendResponse.status === "ERROR") {
    throw new Error(`Transaction failed: ${JSON.stringify(sendResponse)}`);
  }

  let getResponse = await server.getTransaction(sendResponse.hash);
  let attempts = 0;

  while (
    getResponse.status === rpc.Api.GetTransactionStatus.NOT_FOUND &&
    attempts < 20
  ) {
    await new Promise((resolve) => setTimeout(resolve, 1000));
    getResponse = await server.getTransaction(sendResponse.hash);
    attempts++;
  }

  if (getResponse.status === rpc.Api.GetTransactionStatus.SUCCESS) {
    if (getResponse.returnValue) {
      return scValToNative(getResponse.returnValue);
    }
    return null;
  }

  throw new Error(`Transaction failed with status: ${getResponse.status}`);
};

export const readContract = async (
  contractId: string,
  method: string,
  args: xdr.ScVal[],
  signerAddress: string,
): Promise<unknown> => {
  const account = await server.getAccount(signerAddress);
  const contract = new Contract(contractId);

  const tx = new TransactionBuilder(account, {
    fee: BASE_FEE,
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addOperation(contract.call(method, ...args))
    .setTimeout(30)
    .build();

  const result = await server.simulateTransaction(tx);

  if (rpc.Api.isSimulationError(result)) {
    throw new Error(`Simulation failed: ${result.error}`);
  }

  const simSuccess = result as rpc.Api.SimulateTransactionSuccessResponse;
  if (simSuccess.result?.retval) {
    return scValToNative(simSuccess.result.retval);
  }

  return null;
};

export { nativeToScVal, Address, xdr };
