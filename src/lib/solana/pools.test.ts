import { describe, expect, it, vi } from 'vitest';
import { Keypair, PublicKey, type Connection } from '@solana/web3.js';
import BN from 'bn.js';
import { findPool, getPoolInfo, type LoadedPool } from './pools';
import { swapQuote } from './defi';

const base = { mint: Keypair.generate().publicKey.toBase58(), decimals: 6 };
const quote = { mint: Keypair.generate().publicKey.toBase58(), decimals: 9 };
function pool(): LoadedPool {
    return {
        poolKeys: { version: 4, baseMint: new PublicKey(base.mint), quoteMint: new PublicKey(quote.mint), baseDecimals: 6, quoteDecimals: 9 },
        poolInfo: { baseReserve: new BN('1000000000'), quoteReserve: new BN('2000000000000'), status: new BN(1), startTime: new BN(0) }
    } as LoadedPool;
}

describe('池选择与报价边界', () => {
    it('找不到池时拒绝，不退回固定测试池', async () => {
        const getProgramAccounts = vi.fn().mockResolvedValue([]);
        await expect(findPool({ getProgramAccounts } as unknown as Connection, new PublicKey(base.mint), new PublicKey(quote.mint))).rejects.toThrow('pools.noDevnetAmmV4PoolFoundForThisPair');
        expect(getProgramAccounts).toHaveBeenCalledTimes(2);
        expect(getProgramAccounts.mock.calls[0][1].filters).toHaveLength(3);
    });
    it('RPC 错误原样暴露，不伪装成池不存在', async () => {
        const getProgramAccounts = vi.fn().mockRejectedValue(new Error('429 limited'));
        await expect(findPool({ getProgramAccounts } as unknown as Connection, Keypair.generate().publicKey, Keypair.generate().publicKey)).rejects.toThrow('429');
    });
    it('非 AMM owner 的账户不能被解析成池', async () => {
        const getAccountInfo = vi.fn().mockResolvedValue({ owner: Keypair.generate().publicKey, data: Buffer.alloc(752) });
        await expect(getPoolInfo({ getAccountInfo } as unknown as Connection, { ammId: Keypair.generate().publicKey.toBase58() })).rejects.toThrow('pools.notASupportedDevnetAmmV4PoolAccount');
    });
    it('6/9 精度正反向报价与滑点均使用原始整数', () => {
        const forward = swapQuote(pool(), base, quote, '1', 100);
        const reverse = swapQuote(pool(), quote, base, '1', 100);
        expect(forward.amountOut.raw.gt(new BN(0))).toBe(true);
        expect(reverse.amountOut.raw.gt(new BN(0))).toBe(true);
        expect(forward.minAmountOut.raw.lt(forward.amountOut.raw)).toBe(true);
        expect(forward.amountOut.toExact()).not.toBe(reverse.amountOut.toExact());
    });
    it('拒绝不匹配的 Mint、精度和超范围滑点', () => {
        expect(() => swapQuote(pool(), { ...base, mint: Keypair.generate().publicKey.toBase58() }, quote, '1', 50)).toThrow('defi.poolMintsDoNotMatchTheSelection');
        expect(() => swapQuote(pool(), { ...base, decimals: 9 }, quote, '1', 50)).toThrow('defi.tokenDecimalsDoNotMatchThePool');
        expect(() => swapQuote(pool(), base, quote, '1', 501)).toThrow('defi.slippageMustBeBetween0And5');
    });
});
