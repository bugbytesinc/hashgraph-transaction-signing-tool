import type { AccountID, TokenID } from "../../proto/basic_types";
import { toHex } from "./hex";

export function stringifyAccountId(accountId: AccountID): string {
    if (accountId.account.$case === 'accountNum') {
        return `${accountId.shardNum}.${accountId.realmNum}.${accountId.account.accountNum}`;
    } else {
        return `${accountId.shardNum}.${accountId.realmNum}.${toHex(accountId.account.alias)}`;
    }
}

export function stringifyTokenId(tokenId: TokenID): string {
    return `${tokenId.shardNum}.${tokenId.realmNum}.${tokenId.tokenNum}`;
}