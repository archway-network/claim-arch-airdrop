import { SigningArchwayClient } from "npm:@archwayhq/arch3.js";
import { StdFee } from "npm:@cosmjs/amino";
import { ExecuteInstruction, MsgExecuteContractEncodeObject } from "npm:@cosmjs/cosmwasm-stargate";
import { toUtf8 } from "npm:@cosmjs/encoding";

import { MsgExecuteContract } from "npm:cosmjs-types/cosmwasm/wasm/v1/tx.js";

const airdropContractAddress = "archway1qw38y45nkyhdvmlz6kfle074hg55untt6sc378k400p0lyhfzeyqtk4hta";
const feeGranterAddress = "archway1rev2n7edzn6l84k37dhnhs0m9wqlveezvwjj38";

export enum AirdropAction {
  Connect = "connect",
  Stake = "stake",
  GovVote = "gov_vote",
  CreateDomain = "create_domain",
  Ibc = "ibc",
}

export async function prepareAirdropClaim(
  client: SigningArchwayClient,
  sender: string,
  action: AirdropAction
): Promise<{ messages: readonly MsgExecuteContractEncodeObject[]; fee: StdFee }> {
  const executeMsg = buildMsgExecuteContract(sender, {
    contractAddress: airdropContractAddress,
    msg: {
      [`claim_${action}_action`]: {},
    },
  });

  const messages = [executeMsg];
  const fee =
    action == AirdropAction.Connect
      ? await client.calculateFee(sender, messages, undefined, undefined, feeGranterAddress)
      : await client.calculateFee(sender, messages);

  return { messages, fee };
}

function buildMsgExecuteContract(sender: string, instruction: ExecuteInstruction): MsgExecuteContractEncodeObject {
  return {
    typeUrl: "/cosmwasm.wasm.v1.MsgExecuteContract",
    value: MsgExecuteContract.fromPartial({
      sender,
      contract: instruction.contractAddress,
      msg: toUtf8(JSON.stringify(instruction.msg)),
      funds: [],
    }),
  };
}
