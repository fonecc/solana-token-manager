import { AppError, message } from '../../i18n/message';
import { Liquidity,Percent,SPL_ACCOUNT_LAYOUT,Token,TokenAmount,type TokenAccount } from '@raydium-io/raydium-sdk';
import { TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { PublicKey,type Connection } from '@solana/web3.js';
import { positiveTokenAmount } from './amounts';
import { type LoadedPool } from './pools';

export function tokenAmount(mint: string, decimals: number, amount: string) {
    return new TokenAmount(new Token(TOKEN_PROGRAM_ID, new PublicKey(mint), decimals), positiveTokenAmount(amount, decimals).toString(), true);
}

export async function walletTokenAccounts(connection: Connection, owner: PublicKey): Promise<TokenAccount[]> {
    const accounts = await connection.getTokenAccountsByOwner(owner, { programId: TOKEN_PROGRAM_ID });
    return accounts.value.map(item => ({ pubkey: item.pubkey, programId: item.account.owner, accountInfo: SPL_ACCOUNT_LAYOUT.decode(item.account.data) }));
}

export function swapQuote(pool: LoadedPool, input: { mint: string; decimals: number }, output: { mint: string; decimals: number }, amount: string, slippageBps: number) {
    if (!Number.isInteger(slippageBps) || slippageBps < 0 || slippageBps > 500) throw new AppError(message("defi.slippageMustBeBetween0And5"));
    if (!Liquidity.getEnabledFeatures(pool.poolInfo).swap) throw new AppError(message("defi.thisPoolIsNotCurrentlyOpenForSwaps"));
    const mints = [pool.poolKeys.baseMint.toBase58(), pool.poolKeys.quoteMint.toBase58()];
    if (input.mint === output.mint || !mints.includes(input.mint) || !mints.includes(output.mint)) throw new AppError(message("defi.poolMintsDoNotMatchTheSelection"));
    const inputDecimals = input.mint === mints[0] ? pool.poolKeys.baseDecimals : pool.poolKeys.quoteDecimals;
    const outputDecimals = output.mint === mints[0] ? pool.poolKeys.baseDecimals : pool.poolKeys.quoteDecimals;
    if (input.decimals !== inputDecimals || output.decimals !== outputDecimals) throw new AppError(message("defi.tokenDecimalsDoNotMatchThePool"));
    return Liquidity.computeAmountOut({
        poolKeys: pool.poolKeys, poolInfo: pool.poolInfo,
        amountIn: tokenAmount(input.mint, input.decimals, amount),
        currencyOut: new Token(TOKEN_PROGRAM_ID, new PublicKey(output.mint), output.decimals),
        slippage: new Percent(slippageBps, 10000)
    });
}
