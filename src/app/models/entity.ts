import type { AccountID, TokenID } from '@bugbytes/hapi-proto';
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