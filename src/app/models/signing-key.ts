import * as ed from '@noble/ed25519';
import * as secp from "@noble/secp256k1";
import { SignaturePair } from '../../proto/basic_types';
import { toHex } from './hex'

const derEd25519PrivateKeyPrefix = Uint8Array.from([0x30, 0x2e, 0x02, 0x01, 0x00, 0x30, 0x05, 0x06, 0x03, 0x2b, 0x65, 0x70, 0x04, 0x22, 0x04, 0x20]);
const derEcdsaPrivateKeyPrefix = Uint8Array.from([0x30, 0x30, 0x02, 0x01, 0x00, 0x30, 0x07, 0x06, 0x05, 0x2b, 0x81, 0x04, 0x00, 0x0a, 0x04, 0x22, 0x04, 0x20]);

enum SigningKeyType {
    Ed25519 = 'Ed25519',
    ECDSASecp256K1 = 'ECDSA',
}

export class SigningKey {
    private static unlockConstructor = false;

    readonly publicKeyInHex: string;
    readonly keyType: SigningKeyType;

    private readonly privateKey: Uint8Array;

    private constructor(keyType: SigningKeyType, privateKey: Uint8Array, publicKeyInHex: string) {
        if (!SigningKey.unlockConstructor) {
            throw new Error(`The Signing Key is private, please use one the 'TryParsePrivateKeyFromDerBytes' static method to create an instance.`);
        }
        this.keyType = keyType;
        this.privateKey = privateKey;
        this.publicKeyInHex = publicKeyInHex;
    }

    static async fromDerBytes(privateKey: Uint8Array): Promise<SigningKey | null> {
        const size = privateKey?.length || 0;
        if (size === 48 && sequenceStartsWith(privateKey, derEd25519PrivateKeyPrefix)) {
            return SigningKey.asEd25519(privateKey.slice(16, 48));
        }
        if (size === 50 && sequenceStartsWith(privateKey, derEcdsaPrivateKeyPrefix)) {
            return SigningKey.asEcdsa(privateKey.slice(18, 50));
        }
        if (size === 32 || size === 64) {
            return SigningKey.asEd25519(privateKey) || SigningKey.asEcdsa(privateKey);
        }
        return null;
    }

    async sign(bytes: Uint8Array): Promise<SignaturePair> {
        if (this.keyType === SigningKeyType.Ed25519) {
            const publicKey = await ed.getPublicKey(this.privateKey);
            const signature = await ed.sign(bytes, this.privateKey);
            return SignaturePair.fromPartial({
                pubKeyPrefix: publicKey,
                signature: {
                    $case: 'ed25519',
                    ed25519: signature
                }
            });
        } else if (this.keyType === SigningKeyType.ECDSASecp256K1) {
            const publicKey = secp.getPublicKey(this.privateKey, true);
            const messageHash = await secp.utils.sha256(bytes);
            const signature = await secp.sign(messageHash, this.privateKey, { der: false });
            return SignaturePair.fromPartial({
                pubKeyPrefix: publicKey,
                signature: {
                    $case: 'ECDSASecp256k1',
                    ECDSASecp256k1: signature
                }
            });
        }
        throw new Error(`Signing with Key Type ${this.keyType} not implemented.`);
    }

    private static async asEd25519(privateKey: Uint8Array) {
        const publicKey = await ed.getPublicKey(privateKey);
        const messageHash = await secp.utils.sha256(derEd25519PrivateKeyPrefix);
        const signature = await ed.sign(messageHash, privateKey);
        const isValid = await ed.verify(signature, messageHash, publicKey);
        if (isValid) {
            const publicKeyInHex = toHex(publicKey);
            SigningKey.unlockConstructor = true;
            const signingKey = new SigningKey(SigningKeyType.Ed25519, privateKey, publicKeyInHex);
            SigningKey.unlockConstructor = false;
            return signingKey;
        }
        return null;
    }

    private static async asEcdsa(privateKey: Uint8Array) {
        if (secp.utils.isValidPrivateKey(privateKey)) {
            const publicKey = secp.getPublicKey(privateKey, true);
            const signature = await secp.sign(derEcdsaPrivateKeyPrefix, privateKey, { der: false });
            const isValid = await secp.verify(signature, derEcdsaPrivateKeyPrefix, publicKey);
            if (isValid) {
                const publicKeyInHex = toHex(publicKey);
                SigningKey.unlockConstructor = true;
                const signingKey = new SigningKey(SigningKeyType.ECDSASecp256K1, privateKey, publicKeyInHex);
                SigningKey.unlockConstructor = false;
                return signingKey;
            }
        }
        return null;
    }
}

function sequenceStartsWith(seq: Uint8Array, pattern: Uint8Array): boolean {
    if (pattern.length > seq.length) {
        return false;
    }
    for (let i = 0; i < pattern.length; i++) {
        if (seq[i] !== pattern[i]) {
            return false;
        }
    }
    return true;
}