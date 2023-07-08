import "https://deno.land/std@0.193.0/dotenv/load.ts";

import chalk from "npm:chalk-template";
import { oraPromise } from "npm:ora";

import { SigningArchwayClient } from "npm:@archwayhq/arch3.js";
import { assertIsDeliverTxSuccess, logs } from "npm:@cosmjs/stargate";

import { AirdropAction, prepareAirdropClaim } from "./airdrop.ts";
import { getWalletWithAccount } from "./wallet.ts";

const archwayd = {
  chainId: "archway-1",
  endpoint: "https://rpc.mainnet.archway.io:443",
  prefix: "archway",
  denom: "aarch",
};

async function claim(action: AirdropAction) {
  const mnemonic = Deno.env.get("MNEMONIC") || "";
  const [wallet, accounts] = await oraPromise(getWalletWithAccount(mnemonic, archwayd.prefix), "Loading accounts...");

  const signerAddress = accounts[0].address;
  console.info(chalk`Signer address: {dim ${signerAddress}}`);

  const client = await oraPromise(
    SigningArchwayClient.connectWithSigner(archwayd.endpoint, wallet, {
      gasAdjustment: 1.3,
    }),
    chalk`Connecting to the chain {magenta ${archwayd.chainId}}...`
  );

  const { messages, fee } = await oraPromise(
    prepareAirdropClaim(client, signerAddress, action),
    `Preparing airdrop claim...`
  );
  console.info(chalk`Gas estimate: {dim ${fee.gas}}`);
  console.info(chalk`Fee estimate: {dim ${fee.amount[0].amount}${fee.amount[0].denom}}`);

  const response = await oraPromise(client.signAndBroadcast(signerAddress, messages, fee), `Claiming...`);
  assertIsDeliverTxSuccess(response);
  console.info(chalk`Transaction: {dim ${response.transactionHash}}`);

  const tx = await oraPromise(client.getTx(response.transactionHash), `Waiting for transaction to be indexed...`);
  const parsedLogs = logs.parseRawLog(tx?.rawLog);

  console.info(chalk`Height: {dim ${tx?.height}}`);
  console.info(chalk`Code: {dim ${tx?.code}}`);
  console.info(chalk`Logs: {dim ${JSON.stringify(parsedLogs, null, 2)}}`);
}

try {
  const action = AirdropAction.Connect;
  await claim(action);
  Deno.exit();
} catch (e) {
  console.error(chalk`{red ${e.message}}`);
  Deno.exit(1);
}
