import { AppError, message } from '../../i18n/message';
import { TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { LIQUIDITY_STATE_LAYOUT_V4,Liquidity,MARKET_STATE_LAYOUT_V3,Market,SPL_MINT_LAYOUT,jsonInfo2PoolKeys,type ApiPoolInfoV4 } from '@raydium-io/raydium-sdk';
import { PublicKey,type Connection } from '@solana/web3.js';
import { PROGRAM_IDS } from './protocol';

export type PoolQuery = { ammId: string } | { tokenPair: [string, string] };

export async function findPool(connection: Connection, mintA: PublicKey, mintB: PublicKey): Promise<PublicKey> {
    if (mintA.equals(mintB)) throw new AppError(message("pools.selectDifferentTokens"));
    const query = (base: PublicKey, quote: PublicKey) => connection.getProgramAccounts(PROGRAM_IDS.AmmV4, {
        filters: [
            { dataSize: LIQUIDITY_STATE_LAYOUT_V4.span },
            { memcmp: { offset: LIQUIDITY_STATE_LAYOUT_V4.offsetOf('baseMint'), bytes: base.toBase58() } },
            { memcmp: { offset: LIQUIDITY_STATE_LAYOUT_V4.offsetOf('quoteMint'), bytes: quote.toBase58() } }
        ]
    });
    const matches = (await Promise.all([query(mintA, mintB), query(mintB, mintA)])).flat();
    if (!matches.length) throw new AppError(message("pools.noDevnetAmmV4PoolFoundForThisPair"));
    // 稳定选择；仍在读取时验证程序和 Mint，禁止默认池兜底。
    matches.sort((a, b) => a.pubkey.toBase58().localeCompare(b.pubkey.toBase58()));
    return matches[0].pubkey;
}

export async function getPoolInfo(connection: Connection, params: PoolQuery) {
    const id = 'ammId' in params ? new PublicKey(params.ammId) : await findPool(connection, new PublicKey(params.tokenPair[0]), new PublicKey(params.tokenPair[1]));
    const account = await connection.getAccountInfo(id);
    if (!account || !account.owner.equals(PROGRAM_IDS.AmmV4) || account.data.length !== LIQUIDITY_STATE_LAYOUT_V4.span) throw new AppError(message("pools.notASupportedDevnetAmmV4PoolAccount"));
    const state = LIQUIDITY_STATE_LAYOUT_V4.decode(account.data);
    if (!state.marketProgramId.equals(PROGRAM_IDS.OPENBOOK_MARKET)) throw new AppError(message("pools.thisPoolSMarketProgramIsNotSupported"));
    if ('tokenPair' in params) {
        const actual = [state.baseMint.toBase58(), state.quoteMint.toBase58()].sort().join(':');
        if (actual !== [...params.tokenPair].sort().join(':')) throw new AppError(message("pools.thePoolTokenPairDoesNotMatchTheSelection"));
    }
    const [marketAccount, lpAccount] = await connection.getMultipleAccountsInfo([state.marketId, state.lpMint]);
    if (!marketAccount || !marketAccount.owner.equals(PROGRAM_IDS.OPENBOOK_MARKET) || marketAccount.data.length !== MARKET_STATE_LAYOUT_V3.span) throw new AppError(message("pools.invalidMarketAccount"));
    if (!lpAccount || !lpAccount.owner.equals(TOKEN_PROGRAM_ID) || lpAccount.data.length !== SPL_MINT_LAYOUT.span) throw new AppError(message("pools.invalidLpMint"));
    const market = MARKET_STATE_LAYOUT_V3.decode(marketAccount.data);
    if (!market.baseMint.equals(state.baseMint) || !market.quoteMint.equals(state.quoteMint)) throw new AppError(message("pools.marketAndPoolMintsDoNotMatch"));
    const lp = SPL_MINT_LAYOUT.decode(lpAccount.data);
    const api: ApiPoolInfoV4 = {
        id: id.toBase58(), baseMint: state.baseMint.toBase58(), quoteMint: state.quoteMint.toBase58(), lpMint: state.lpMint.toBase58(),
        baseDecimals: state.baseDecimal.toNumber(), quoteDecimals: state.quoteDecimal.toNumber(), lpDecimals: lp.decimals,
        version: 4, programId: account.owner.toBase58(), authority: Liquidity.getAssociatedAuthority({ programId: account.owner }).publicKey.toBase58(),
        openOrders: state.openOrders.toBase58(), targetOrders: state.targetOrders.toBase58(), baseVault: state.baseVault.toBase58(), quoteVault: state.quoteVault.toBase58(),
        withdrawQueue: state.withdrawQueue.toBase58(), lpVault: state.lpVault.toBase58(), marketVersion: 3, marketProgramId: state.marketProgramId.toBase58(),
        marketId: state.marketId.toBase58(), marketAuthority: Market.getAssociatedAuthority({ programId: state.marketProgramId, marketId: state.marketId }).publicKey.toBase58(),
        marketBaseVault: market.baseVault.toBase58(), marketQuoteVault: market.quoteVault.toBase58(), marketBids: market.bids.toBase58(), marketAsks: market.asks.toBase58(), marketEventQueue: market.eventQueue.toBase58(),
        lookupTableAccount: PublicKey.default.toBase58()
    };
    const poolKeys = jsonInfo2PoolKeys(api);
    // SDK 计算有效储备（含 OpenOrders 和 PnL），不以 vault 的余额覆盖。
    const poolInfo = await Liquidity.fetchInfo({ connection, poolKeys });
    if (poolInfo.baseReserve.isZero() || poolInfo.quoteReserve.isZero()) throw new AppError(message("pools.insufficientPoolReservesForAQuote"));
    return { poolKeys, poolInfo, poolData: { version: 4, poolKeys, poolInfo } };
}

export type LoadedPool = Awaited<ReturnType<typeof getPoolInfo>>;
