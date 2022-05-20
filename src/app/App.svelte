<header>Hashgraph Transaction Signing Tool</header>
<section class="keys">
    {#if signingKeys.length === 0 && transaction === null }
        <div>Waiting for input.</div>
    {:else if signingKeys.length === 0}
        <div>Waiting for signing keys.</div>
    {:else}
        {#if signingKeys.length > 1}
            <div class="keyheader">Signing Keys <span>(Showing Public)</span></div>
        {:else}
            <div class="keyheader">Signing Key <span>(Showing Public)</span></div>
        {/if}
        <div class="keylist">
            {#each signingKeys as { keyType, publicKeyInHex }}
                <div class="keytype">{keyType}</div>
                <div class="keyvalue">{publicKeyInHex}</div>
                <button type="button" class="delete" on:click={() => removeKey(publicKeyInHex)}></button>
            {/each}
        </div>        
    {/if}
</section>
{#if transaction}
    <section class="transaction">
        <h1>{transaction.transactionType}</h1>
        {#if remainingSeconds > 1}
            <div class="countdown">Transaction expires in <span>{remainingSeconds}</span> seconds...</div>
        {:else if remainingSeconds > 0}
            <div class="countdown">Transaction expires in <span>one</span> second...</div>
        {:else}
            <div class="countdown"><span>Transaction has Expired,</span> it will no longer be accepted by the network.</div>
        {/if}
        <dl class="transaction-props">
            <dt>Transaction Id</dt>
            <dd>{transaction.transactionId}</dd>
            <dt>Submit to Node</dt>
            <dd>{transaction.node}</dd>
            <dt>Max Allowed Fee</dt>
            <dd>{transaction.maxTransactionFee}</dd>
            <dt>Transaction Duration</dt>
            <dd>{transaction.validDuration} (sec)</dd>
            <dt>Transaction Memo</dt>
            {#if transaction.memo}
                <dd>{transaction.memo}</dd>
            {:else}
                <dd class="none">None</dd>                
            {/if}
        </dl>
        {#if transaction.parsedTransaction.data.$case === 'cryptoTransfer'}
            <TransferDetails value={transaction.parsedTransaction.data.cryptoTransfer} />
        {:else}
            <h2>Details</h2>
            <div>
                <DetailsDisplay value={transaction.payload} />
            </div>
        {/if}
    </section>
{:else if signingKeys.length > 0}
    <section class="transaction">        
        <div>Waiting for transaction ...</div>
    </section>
{:else}
    <section></section>
{/if}
<div 
    class="feedback"
    class:info={message.type === MessageType.Information}
    class:error={message.type === MessageType.Error}
    class:success={message.type === MessageType.Success}>
    {message.text}
</div>
<footer>
    <button type="button" on:click={onPaste}>
        <h3>Paste</h3>
        <div>Transaction or Key</div>
    </button>
    <button type="button" on:click={onSign} disabled={!(transaction && remainingSeconds > 0)}>
        <h3>Sign</h3>
        <div>and Copy to Clipboard</div>
    </button>
</footer>

<script lang="ts">
    import { MessageType, type FeedbackMessage } from "./models/feedback-message";
    import { fromHex, toHex } from "./models/hex";
    import { PendingTransaction } from "./models/pending-transaction";
    import { SigningKey } from "./models/signing-key";
    import DetailsDisplay from "./components/DetailsDisplay.svelte";
    import TransferDetails from "./components/TransferDetails.svelte";
    import { SignatureMap } from "@bugbytes/hapi-proto";

    let message: FeedbackMessage = { type: MessageType.Information, text: '' };
    let signingKeys: Array<SigningKey> = [];
    let transaction: PendingTransaction | null = null;
    let remainingSeconds = 0;

    async function onPaste() {
        message = {
            type: MessageType.Information, 
            text: 'Examining Clipboard'
        };
        const text = await navigator.clipboard.readText();
        if(text) {
            const bytes = fromHex(text);
            const signingKey = await SigningKey.fromDerBytes(bytes);
            if(signingKey) {
                if(signingKeys.find(k => k.publicKeyInHex === signingKey.publicKeyInHex)) {
                    message =  { 
                        type: MessageType.Error, 
                        text: `${signingKey.keyType} Key is already included in the list.` 
                    };
                    return;
                } else {
                    signingKeys.push(signingKey);
                    signingKeys = signingKeys;
                    message =  { 
                        type: MessageType.Success, 
                        text: `${signingKey.keyType} Key Added.` 
                    };
                    return;
                }
            }
            const pendingTransaction = PendingTransaction.fromBytes(bytes);
            if(pendingTransaction) {
                transaction = pendingTransaction;
                startCountdown();
                message =  { 
                    type: MessageType.Success, 
                    text: `${pendingTransaction.transactionType} Transaction Loaded.` 
                };
                return;
            }
        }
        message = {
            type: MessageType.Error, 
            text: 'Cliboard contents not recognized as a private key or transaction bytes.'
        };
    }

    async function onSign() {
        if (transaction && signingKeys.length > 0)
        {
            message = {
                type: MessageType.Information, 
                text: 'Signing...'
            };            
            var signatureMap = await transaction.sign(signingKeys);
            var bytes = SignatureMap.encode(signatureMap).finish();
            navigator.clipboard.writeText(toHex(bytes));
            message = {
                type: MessageType.Success, 
                text: signatureMap.sigPair.length === 1 ? 'Signature Copied to Clipboard' : 'Signatures Copied to Clipboard'
            };            
        }
    }

    function removeKey(publicKeyInHex:string) {
        const index = signingKeys.findIndex(k => k.publicKeyInHex === publicKeyInHex);
        if(index > -1) {
            const removed = signingKeys.splice(index, 1);
            signingKeys = signingKeys;
            message =  { 
                    type: MessageType.Success, 
                    text: `${removed[0].keyType} Key Removed.` 
            };
        }
    }

    function startCountdown() {
        const remaining = ~~((transaction.expiration.getTime() - new Date().getTime())/1000);
        if(remaining > 0) {
            remainingSeconds = remaining;
            setTimeout(startCountdown,1000);
        } else {
            remainingSeconds = 0;
            message = {
                type: MessageType.Error, 
                text: 'Transaction has expired.'
            };
        }
    }
</script>
