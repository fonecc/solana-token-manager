# Solana Token Lab

English · [简体中文](README.zh-CN.md)

A Solana token app built with Next.js, React, and TypeScript. Create a mint, manage balances and authorities, set metadata, then work through liquidity pools and swaps. Each operation includes an explanation of the accounts involved and what to check on-chain afterward.

The app calls existing Solana programs. There is no custom Rust or Anchor program in this repo. Transactions are signed and paid for by the connected wallet.

Built by **[0xF1](https://fone.cc)**. More projects and writing at **[fone.cc](https://fone.cc)**. If you find this useful, a [Star on GitHub](https://github.com/fonecc/solana-token-manager) is appreciated.

## What's included

| Area | Implementation | Notes |
| --- | --- | --- |
| Wallet | Phantom adapter and Wallet Standard discovery | Available wallets depend on the browser and installed extensions. |
| Token creation | Create a mint and your ATA in one transaction | Classic SPL Token; the UI accepts 0–9 decimals. Initial supply is zero. |
| Assets | Aggregate balances across token accounts; read metadata and authorities | Discovers mints through the connected wallet's token accounts, not a global authority index. |
| Minting | Check Mint Authority; create the recipient ATA if needed | An additional issuance, not a target total supply. |
| Transfers | SPL tokens and SOL | SPL transfers use the sender's ATA. An aggregated balance may include other accounts. |
| Burning | Checked instructions using the mint's actual decimals | Reduces supply; does not close the account or reclaim rent. |
| Freeze / thaw | Check Freeze Authority and operate on the target wallet's ATA | Freezes a token account, not the wallet. Arbitrary non-ATA inputs are not supported. |
| Authority revocation | Permanently revoke mint or freeze authority | Irreversible. Thaw affected accounts before revoking freeze authority. |
| Metadata | Create/update Metaplex metadata; accept IPFS URIs; lock metadata | Bring your own public JSON and image. No file upload service. |
| DeFi | OpenBook markets, Raydium AMM V4 pools, liquidity deposits, swaps | Pool creation uses a mint/WSOL pair. No CLMM, CPMM, or automatic routing. |

The current network is **Devnet**. Token-2022, liquidity removal, custom programs, and mainnet writes are not implemented.

## Run locally

Use Node.js 24 and npm. `.nvmrc` pins the Node major version; use a current security patch within that version. Solana CLI is optional.

```bash
nvm use
npm ci
npm run dev
```

Open [localhost:3000](http://localhost:3000). To use another port:

```bash
npm run dev -- --port 3100
```

You can read the manual without connecting a wallet. To send transactions, use a separate wallet with some Devnet SOL for fees and account rent.

### RPC configuration

The default is the public Solana Devnet RPC. For a different Devnet endpoint, set this in `.env.local`; see [`.env.example`](.env.example):

```dotenv
NEXT_PUBLIC_SOLANA_RPC_URL=https://api.devnet.solana.com
```

`NEXT_PUBLIC_` values are shipped to the browser. Do not put private keys or server-only secrets there. Apply your RPC provider's domain and quota restrictions to browser-facing credentials.

Before signing transactions or requesting an airdrop, the app checks the RPC's genesis hash. Changing this URL does not enable mainnet support.

**Upgrading from an older version:** `NEXT_PUBLIC_MINT_AUTHORITY_PRIVATE_KEY` is no longer used. Remove it from your local configuration. If that key was included in a public build, retire it and review the account's assets and authorities.

## Using the app

A reasonable order for the first run:

1. Connect a wallet and check the network indicator.
2. Get Devnet SOL from the Create token screen. Airdrops can be rate-limited; check the balance after confirmation.
3. Create a mint with 6 decimals. Save the mint address, ATA, and transaction signature.
4. Set metadata, then mint a small amount to yourself and a second wallet.
5. Try a transfer, freeze/thaw, and a burn. Check the account balances and supply after each operation.
6. Leave authority revocation until last, using a mint you can discard.
7. Move on to markets, pools, and swaps once the token-account model makes sense.

Desktop navigation uses a course sidebar; mobile uses the course drawer. Visited lessons stay mounted, so switching lessons or opening the manual keeps the current draft and transaction feedback. Switching wallets resets the workspace. Refreshing the page may lose drafts and in-memory records—save public addresses and signatures separately.

### Languages and manual

The UI supports English, Simplified Chinese, and Traditional Chinese. English is the default; the URL determines the language rather than browser-language detection.

| Language | App | Manual |
| --- | --- | --- |
| English | `/` | `/?manual=contents` |
| 简体中文 | `/zh-CN` | `/zh-CN?manual=contents` |
| 繁體中文 | `/zh-TW` | `/zh-TW?manual=contents` |

Open the manual from the header, the bottom of the course menu, or a lesson's guide button. It appears in the same workspace, with the main menu still available. Each language has 12 chapters covering setup, operations, pre-signing checks, verification, troubleshooting, terms, and sources.

Chapter links use queries such as `/?manual=create`. Language switches preserve the chapter and its anchors. Older `/manual` and `/manual/:topic` links redirect to the workspace view.

User-entered names, symbols, URIs, addresses, and exact amounts are not translated. Raw RPC/SDK diagnostics remain as returned; wallet-extension language is controlled by the extension.

## Developer notes

- **Amounts:** keep decimal input as strings; use `bigint` or SDK `BN` for on-chain units. Do not convert through `Number` before building an instruction.
- **Transactions:** the shared executor handles the current legacy-transaction flow, additional SDK signers, confirmation, and per-step signatures. Submitted is not the same as confirmed.
- **Pending results:** check the original signature before retrying. The executor does not automatically replace the blockhash and repeat an operation with an unknown outcome. Same-tab pending protection is not a cross-tab lock or an on-chain idempotency guarantee.
- **Multi-step operations:** a failed later step does not undo confirmed transactions. Keep market addresses and step signatures when recovering.
- **UI and services:** components handle forms and feedback; instruction construction, account validation, and protocol checks live in `src/lib/solana`.

```text
src/
├── pages/                 # Pages Router entry points
├── components/
│   ├── learning/          # Workspace, lessons, shared context
│   ├── manual/            # In-workspace manual
│   ├── brand/             # Brand, author links, footer
│   └── common/            # Addresses and transaction feedback
├── content/manual/        # Manual content in three languages
├── i18n/                  # Typed messages and language switching
├── hooks/                 # Asset reads and async lifecycles
├── theme/                 # Chakra theme
└── lib/solana/             # Amounts, accounts, instructions, execution, DeFi
messages/                  # UI translations
```

### Checks and production build

```bash
npm run typecheck
npm run lint
npm test
npm run build
npm start
```

Tests use mocked wallets/RPC responses and do not broadcast transactions. CI runs installation, type checking, lint, tests, and the build. Passing these checks does not verify a live wallet flow.

## Common issues

**The balance looks sufficient, but a transfer fails.** The asset list combines accounts for the same mint. Transfers and burns use the ATA; check its balance and frozen state.

**The token has no image.** Both the metadata URI and its `image` URL must be publicly readable by the browser. See [`public/token-metadata.example.json`](public/token-metadata.example.json) and replace the example image URL.

**No pool was found.** Creating a mint does not create liquidity. Check the network, token pair, protocol, and pool state. The app does not fall back to an unrelated pool.

**Confirmation timed out.** Look up the original signature in Explorer or through a trusted RPC. Do not refresh, switch wallets, or open tabs just to bypass pending protection.

## Contributing and license

Bug reports and fixes are welcome on [GitHub](https://github.com/fonecc/solana-token-manager). Include the steps to reproduce, the expected result, and any public transaction signatures that help explain the issue. Never attach private keys, seed phrases, or RPC credentials.

Some legacy protocol SDK dependencies still have unresolved advisories. This repo has not passed a security audit.

There is no `LICENSE` file yet. Licensing terms have not been specified.
