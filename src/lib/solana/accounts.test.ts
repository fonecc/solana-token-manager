import { describe, expect, it, vi } from 'vitest';
import { Keypair, type Connection } from '@solana/web3.js';
import { loadWalletTokens } from './accounts';
import { TOKEN_PROGRAM_ID } from '@solana/spl-token';
vi.mock('@solana/spl-token', async importOriginal => ({ ...await importOriginal<typeof import('@solana/spl-token')>(), unpackMint: vi.fn(() => ({ mintAuthority: null, freezeAuthority: null })) }));

describe('资产批量加载', () => {
    it('同 Mint 的账户合并为精确余额，每种 Mint 只查询一次', async () => {
        const mint = Keypair.generate().publicKey.toBase58();
        const getParsedTokenAccountsByOwner = vi.fn().mockResolvedValue({ value: ['9007199254740993', '7'].map(amount => ({ account: { data: { parsed: { info: { mint, tokenAmount: { amount, decimals: 6 } } } } } })) });
        const getMultipleAccountsInfo = vi.fn().mockImplementation(async keys => keys.map(() => ({ owner: TOKEN_PROGRAM_ID, data: Buffer.alloc(82) })));
        const connection = { rpcEndpoint: 'mock-devnet', getParsedTokenAccountsByOwner, getMultipleAccountsInfo } as unknown as Connection;
        const tokens = await loadWalletTokens(connection, Keypair.generate().publicKey);
        expect(tokens).toHaveLength(1);
        expect(tokens[0].rawAmount).toBe('9007199254741000');
        expect(tokens[0].amount).toBe('9007199254.741');
        expect(getMultipleAccountsInfo).toHaveBeenCalledTimes(2);
        expect(getMultipleAccountsInfo.mock.calls[0][0]).toHaveLength(1);
        expect(tokens[0].symbol).toBe('');
        expect(tokens[0].hasMetadata).toBe(false);
    });
    it('空钱包不发起无意义的批量账户查询', async () => {
        const getMultipleAccountsInfo = vi.fn();
        const connection = { rpcEndpoint: 'mock-devnet', getParsedTokenAccountsByOwner: vi.fn().mockResolvedValue({ value: [] }), getMultipleAccountsInfo } as unknown as Connection;
        await expect(loadWalletTokens(connection, Keypair.generate().publicKey)).resolves.toEqual([]);
        expect(getMultipleAccountsInfo).not.toHaveBeenCalled();
    });
});
