# Hashgraph Transaction Signing Tool

> Note: This project is presently considered a proof of concept and the author makes no commitments to future maintenance or support of this code base.

The **Hashgraph Transaction Signing Tool** is a portable desktop application that can sign (HAPI) encoded Hedera transactions producing a (HAPI) encoded signature map that can then be transmitted to the Hedera Network using other systems (since this app holds private keys, it is designed to not talk to the network, and is clipboard-gapped per se.)  

Transactions are created using cooperating software systems, the user copies a transaction from this external system thru the clipboard to this utility.  This utility (holding private keys in memory) signs the transaction and places the signature(s) onto the clipboard.  From there, the signature(s) can be pasted back to the originating system to be submitted to the network.  This way the system talking to the network holds no private keys and this utility holding private keys does not talk to the network.

## Technologies

- [TypeScript](https://www.typescriptlang.org)
- [Node.js](https://nodejs.org/en/)
- [Electron](https://www.electronjs.org)
- [Svelte](https://svelte.dev)
- [rollup.js](https://rollupjs.org/guide/en/)


## Quick Start for the Impatient 
```bash
git clone https://github.com/bugbytesinc/hashgraph-transaction-signing-tool.git
cd hashgraph-transaction-signing-tool
npm ci
npm run generate
npm run dev
```
**For mac M1**:  You may need to substitute `npm ci --target_arch=x64` for `npm ci` to get around grpc tooling issues with the Mac M1

At the present time we are not producing os specific executables.

The code in this project is presently considered a minimally viable proof of concept.  Please read the code and decide for yourself if it meets your security and quality requirements before running.  This code has not been audited or peer reviewed, use at your own risk. 
