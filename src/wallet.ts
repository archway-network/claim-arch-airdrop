import { HdPath, Slip10RawIndex } from "npm:@cosmjs/crypto";
import { AccountData, DirectSecp256k1HdWallet } from "npm:@cosmjs/proto-signing";

export function makeTerraPath(a: number): HdPath {
  return [
    Slip10RawIndex.hardened(44),
    Slip10RawIndex.hardened(330),
    Slip10RawIndex.hardened(0),
    Slip10RawIndex.normal(0),
    Slip10RawIndex.normal(a),
  ];
}

export async function getWalletWithAccount(
  mnemonic: string,
  prefix: string
): Promise<[DirectSecp256k1HdWallet, readonly AccountData[]]> {
  const wallet = await DirectSecp256k1HdWallet.fromMnemonic(mnemonic, {
    hdPaths: [makeTerraPath(0)],
    prefix,
  });
  const accounts = await wallet.getAccounts();
  return [wallet, accounts];
}
