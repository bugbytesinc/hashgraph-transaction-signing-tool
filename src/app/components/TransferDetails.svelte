<template>
    {#if cryptoTransfers.length > 0}
        <h2>Crypto (ℏ)</h2>
        <dl>
        {#each cryptoTransfers as xfer }
            <dt>{xfer.account}</dt>
            <dd>{xfer.amount} {xfer.approval}</dd>
        {/each}
        </dl>
    {/if}
    {#each tokenTransfers as tokenXfers}
        <h2>Token {tokenXfers.token}</h2>
        <dl>
            {#each tokenXfers.transfers as xfer }
                <dt>{xfer.account}</dt>
                <dd>{xfer.amount} {xfer.approval}</dd>
            {/each}
        </dl>    
    {/each}
    {#each assetTransfers as assetXfers}
        <h2>Asset {assetXfers.token}</h2>
        <dl>
            {#each assetXfers.transfers as xfer }
                <dt>{xfer.sender}</dt>
                <dd> #{xfer.serial} to {xfer.receiver} {xfer.approval}</dd>
            {/each}
        </dl>    
    {/each}
</template>

<script lang="ts">
    import type { CryptoTransferTransactionBody } from '../../proto/crypto_transfer';
    import { stringifyAccountId, stringifyTokenId } from '../models/entity';
    import { stringifyHbar } from '../models/hbar';

    export let value: CryptoTransferTransactionBody;

    $:cryptoTransfers = value?.transfers?.accountAmounts?.map(a => { return {
        account: stringifyAccountId(a.accountID),
        amount: stringifyHbar(a.amount),
        approval: a.isApproval ? 'Approved' : ''
    };}) || [];

    $:tokenTransfers = value?.tokenTransfers?.filter(l => l.transfers?.length > 0).map(l=>{
        return {
            token: stringifyTokenId(l.token),
            transfers: l.transfers.map(a => {return {
                account: stringifyAccountId(a.accountID),
                amount: a.amount.toFixed(0),
                approval: a.isApproval ? 'Approved' : ''
            };})
        }
    }) || [];

    $:assetTransfers = value?.tokenTransfers?.filter(l => l.nftTransfers?.length > 0).map(l=>{
        return {
            token: stringifyTokenId(l.token),
            transfers: l.nftTransfers.map(a => {return {
                sender: stringifyAccountId(a.senderAccountID),
                receiver: stringifyAccountId(a.receiverAccountID),
                serial: a.serialNumber.toFixed(0),
                approval: a.isApproval ? '(Approved)' : ''
            };})
        }
    }) || [];
</script>