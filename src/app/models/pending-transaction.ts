import { TransactionBody, SignaturePair, SignatureMap, TransactionID, ConsensusCreateTopicTransactionBody, ConsensusDeleteTopicTransactionBody, ConsensusSubmitMessageTransactionBody, ConsensusUpdateTopicTransactionBody, ContractCreateTransactionBody, ContractDeleteTransactionBody, ContractUpdateTransactionBody, CryptoCreateTransactionBody, CryptoDeleteTransactionBody, CryptoTransferTransactionBody, CryptoUpdateTransactionBody, FileAppendTransactionBody, FileCreateTransactionBody, FileDeleteTransactionBody, FileUpdateTransactionBody, FreezeTransactionBody, ScheduleCreateTransactionBody, ScheduleDeleteTransactionBody, ScheduleSignTransactionBody, SystemDeleteTransactionBody, SystemUndeleteTransactionBody, TokenAssociateTransactionBody, TokenBurnTransactionBody, TokenCreateTransactionBody, TokenDeleteTransactionBody, TokenDissociateTransactionBody, TokenFeeScheduleUpdateTransactionBody, TokenFreezeAccountTransactionBody, TokenGrantKycTransactionBody, TokenMintTransactionBody, TokenPauseTransactionBody, TokenUnfreezeAccountTransactionBody, TokenUnpauseTransactionBody, TokenUpdateTransactionBody, TokenWipeAccountTransactionBody, UncheckedSubmitBody } from '@bugbytes/hapi-proto';
import { stringifyAccountId } from "./entity";
import { stringifyHbar } from "./hbar";
import { toHex } from "./hex";
import type { SigningKey } from "./signing-key";

export class PendingTransaction {
    private static unlockConstructor = false;

    private readonly bodyBytes: Uint8Array;

    readonly parsedTransaction: TransactionBody;
    readonly transactionId: string;
    readonly transactionType: string;
    readonly expiration: Date;
    readonly node: string;
    readonly maxTransactionFee: string;
    readonly validDuration: number;
    readonly memo: string;
    readonly payload: any;

    private constructor(bodyBytes: Uint8Array) {
        if (!PendingTransaction.unlockConstructor) {
            throw new Error(`The PendingTransaction constructor is private, please use one the 'fromBytes' static method to create an instance.`);
        }
        this.bodyBytes = bodyBytes;
        this.parsedTransaction = TransactionBody.decode(bodyBytes);
        this.expiration = computeExpiration(this.parsedTransaction);
        ({ type: this.transactionType, message: this.payload } = computeTypeAndPayload(this.parsedTransaction));
        this.transactionId = computeTransactionIdString(this.parsedTransaction.transactionID);
        this.node = stringifyAccountId(this.parsedTransaction.nodeAccountID);
        this.maxTransactionFee = stringifyHbar(this.parsedTransaction.transactionFee);
        this.validDuration = this.parsedTransaction.transactionValidDuration.seconds;
        this.memo = this.parsedTransaction.memo;
    }

    static fromBytes(txBytes: Uint8Array): PendingTransaction | null {
        try {
            PendingTransaction.unlockConstructor = true;
            return new PendingTransaction(txBytes);
        } catch {
            // noop
        } finally {
            PendingTransaction.unlockConstructor = false;
        }
    }

    public async sign(keys: SigningKey[]): Promise<SignatureMap> {
        const sigPair: SignaturePair[] = [];
        for (let key of keys) {
            sigPair.push(await key.sign(this.bodyBytes));
        }
        return { sigPair };
    }
}

function computeExpiration(parsedTransaction: TransactionBody): Date {
    const seconds = parsedTransaction.transactionID.transactionValidStart.seconds;
    const nanos = parsedTransaction.transactionID.transactionValidStart.nanos;
    const duration = parsedTransaction.transactionValidDuration.seconds;
    return new Date((seconds + duration) * 1000 + nanos / 1000000.0);
}

function computeTypeAndPayload(parsedTransaction: TransactionBody): { type: string, message: any } {
    const data = parsedTransaction.data;
    switch (data.$case) {
        case 'contractCall': return { type: "Call Contract", message: data.contractCall };
        case 'contractCreateInstance': return { type: "Create Contract", message: ContractCreateTransactionBody.toJSON(data.contractCreateInstance) };
        case 'contractUpdateInstance': return { type: "Update Contract", message: ContractUpdateTransactionBody.toJSON(data.contractUpdateInstance) };
        case 'contractDeleteInstance': return { type: "Delete Contract", message: ContractDeleteTransactionBody.toJSON(data.contractDeleteInstance) };
        case 'cryptoCreateAccount': return { type: "Create Account", message: CryptoCreateTransactionBody.toJSON(data.cryptoCreateAccount) };
        case 'cryptoDelete': return { type: "Delete Account", message: CryptoDeleteTransactionBody.toJSON(data.cryptoDelete) };
        case 'cryptoTransfer': return { type: computeTransferTransactionTitle(data.cryptoTransfer), message: CryptoTransferTransactionBody.toJSON(data.cryptoTransfer) };
        case 'cryptoUpdateAccount': return { type: "Update Account", message: CryptoUpdateTransactionBody.toJSON(data.cryptoUpdateAccount) };
        case 'fileAppend': return { type: "Append to File", message: FileAppendTransactionBody.toJSON(data.fileAppend) };
        case 'fileCreate': return { type: "Create File", message: FileCreateTransactionBody.toJSON(data.fileCreate) };
        case 'fileDelete': return { type: "Delete File", message: FileDeleteTransactionBody.toJSON(data.fileDelete) };
        case 'fileUpdate': return { type: "Update File", message: FileUpdateTransactionBody.toJSON(data.fileUpdate) };
        case 'systemDelete': return { type: "System Delete", message: SystemDeleteTransactionBody.toJSON(data.systemDelete) };
        case 'systemUndelete': return { type: "System Undelete", message: SystemUndeleteTransactionBody.toJSON(data.systemUndelete) };
        case 'freeze': return { type: "Feeze System", message: FreezeTransactionBody.toJSON(data.freeze) };
        case 'consensusCreateTopic': return { type: "Create Consensus Topic", message: ConsensusCreateTopicTransactionBody.toJSON(data.consensusCreateTopic) };
        case 'consensusUpdateTopic': return { type: "Update Consensus Topic", message: ConsensusUpdateTopicTransactionBody.toJSON(data.consensusUpdateTopic) };
        case 'consensusDeleteTopic': return { type: "Delete Consensus Topic", message: ConsensusDeleteTopicTransactionBody.toJSON(data.consensusDeleteTopic) };
        case 'consensusSubmitMessage': return { type: "Submit Consensus Message", message: ConsensusSubmitMessageTransactionBody.toJSON(data.consensusSubmitMessage) };
        case 'uncheckedSubmit': return { type: "Submit Generic Transaction", message: UncheckedSubmitBody.toJSON(data.uncheckedSubmit) };
        case 'tokenCreation': return { type: "Create Token", message: TokenCreateTransactionBody.toJSON(data.tokenCreation) };
        case 'tokenFreeze': return { type: "Freeze Account's Token", message: TokenFreezeAccountTransactionBody.toJSON(data.tokenFreeze) };
        case 'tokenUnfreeze': return { type: "Unfreeze Account's Token", message: TokenUnfreezeAccountTransactionBody.toJSON(data.tokenUnfreeze) };
        case 'tokenGrantKyc': return { type: "Grant Token KYC", message: TokenGrantKycTransactionBody.toJSON(data.tokenGrantKyc) };
        case 'tokenRevokeKyc': return { type: "Revoke Token KYC", message: TokenDeleteTransactionBody.toJSON(data.tokenRevokeKyc) };
        case 'tokenDeletion': return { type: "Delete Token", message: TokenDeleteTransactionBody.toJSON(data.tokenDeletion) };
        case 'tokenUpdate': return { type: "Update Token", message: TokenUpdateTransactionBody.toJSON(data.tokenUpdate) };
        case 'tokenMint': return { type: "Mint Token to Treasury", message: TokenMintTransactionBody.toJSON(data.tokenMint) };
        case 'tokenBurn': return { type: "Burn Token from Treasury", message: TokenBurnTransactionBody.toJSON(data.tokenBurn) };
        case 'tokenWipe': return { type: "Wipe Token from Account", message: TokenWipeAccountTransactionBody.toJSON(data.tokenWipe) };
        case 'tokenAssociate': return { type: "Associate Token with Account", message: TokenAssociateTransactionBody.toJSON(data.tokenAssociate) };
        case 'tokenDissociate': return { type: "Unassociate Token from Account", message: TokenDissociateTransactionBody.toJSON(data.tokenDissociate) };
        case 'tokenFeeScheduleUpdate': return { type: "Update Token Fee Schedule", message: TokenFeeScheduleUpdateTransactionBody.toJSON(data.tokenFeeScheduleUpdate) };
        case 'tokenPause': return { type: "Pause Token Trading", message: TokenPauseTransactionBody.toJSON(data.tokenPause) };
        case 'tokenUnpause': return { type: "Resume Token Trading", message: TokenUnpauseTransactionBody.toJSON(data.tokenUnpause) };
        case 'scheduleCreate': return { type: "Create Pending/Scheduled Transaction", message: ScheduleCreateTransactionBody.toJSON(data.scheduleCreate) };
        case 'scheduleDelete': return { type: "Delete Pending/Scheduled Transaction", message: ScheduleDeleteTransactionBody.toJSON(data.scheduleDelete) };
        case 'scheduleSign': return { type: "Sign Pending/Scheduled Transaction", message: ScheduleSignTransactionBody.toJSON(data.scheduleSign) };
    }
    return { type: data.$case, message: parsedTransaction };
}

function computeTransferTransactionTitle(body: CryptoTransferTransactionBody): string {
    if (body) {
        const crypto = body.transfers.accountAmounts.length > 0;
        const tokens = body.tokenTransfers.findIndex(t => t.transfers.length > 0) > -1;
        const assets = body.tokenTransfers.findIndex(t => t.nftTransfers.length > 0) > -1;
        if (crypto && tokens && assets) {
            return "Crypto, Token and Asset Transfers";
        }
        else if (crypto && tokens) {
            return "Crypto and Token Transfers";
        }
        else if (crypto && assets) {
            return "Crypto and Asset Transfers";
        }
        else if (tokens && assets) {
            return "Token and Asset Transfers";
        }
        else if (crypto) {
            return "Crypto Transfer";
        }
        else if (tokens) {
            return "Token Transfer";
        }
        else if (assets) {
            return "Asset Transfer";
        }
    }
    return "Transfer";
}

function computeTransactionIdString(txId: TransactionID): string {
    if (txId.accountID.account.$case === 'accountNum') {
        return `${txId.accountID.shardNum}.${txId.accountID.realmNum}.${txId.accountID.account.accountNum}@${txId.transactionValidStart.seconds}.${txId.transactionValidStart.nanos.toFixed(0).padStart(9, '0')}`;
    } else {
        return `${txId.accountID.shardNum}.${txId.accountID.realmNum}.${toHex(txId.accountID.account.alias)}@${txId.transactionValidStart.seconds}.${txId.transactionValidStart.nanos.toFixed(0).padStart(9, '0')}`;
    }
}