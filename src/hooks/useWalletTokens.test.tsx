import { create } from '../i18n/testRenderer';
import React from 'react';
import { act, type ReactTestRenderer } from 'react-test-renderer';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Keypair, type Connection } from '@solana/web3.js';
import { loadWalletTokens, type WalletToken } from '../lib/solana/accounts';
import { useWalletTokens } from './useWalletTokens';
vi.mock('../lib/solana/accounts', () => ({ loadWalletTokens: vi.fn() }));

function deferred<T>() {
    let resolve!: (value: T) => void;
    const promise = new Promise<T>(done => { resolve = done; });
    return { promise, resolve };
}
const token = (name: string): WalletToken => ({ mint: name, name, symbol: name, decimals: 0, amount: '1', rawAmount: '1' });
let renderer: ReactTestRenderer | undefined;
afterEach(() => { act(() => renderer?.unmount()); renderer = undefined; vi.useRealTimers(); vi.resetAllMocks(); });

describe('钱包查询生命周期', () => {
    it('切换钱包后旧请求不能覆盖新钱包', async () => {
        const old = deferred<WalletToken[]>();
        const fresh = deferred<WalletToken[]>();
        vi.mocked(loadWalletTokens).mockReturnValueOnce(old.promise).mockReturnValueOnce(fresh.promise);
        const connection = { getBalance: vi.fn().mockResolvedValue(0) } as unknown as Connection;
        let result!: ReturnType<typeof useWalletTokens>;
        function Harness({ owner }: { owner: import('@solana/web3.js').PublicKey }) { result = useWalletTokens(connection, owner); return null; }
        await act(async () => { renderer = create(<Harness owner={Keypair.generate().publicKey} />); });
        await act(async () => { renderer!.update(<Harness owner={Keypair.generate().publicKey} />); });
        await act(async () => { fresh.resolve([token('new')]); });
        expect(result.tokens[0].mint).toBe('new');
        await act(async () => { old.resolve([token('old')]); });
        expect(result.tokens[0].mint).toBe('new');
    });
    it('超时后迟到的数据不会修改结果', async () => {
        vi.useFakeTimers();
        const query = deferred<WalletToken[]>();
        vi.mocked(loadWalletTokens).mockReturnValue(query.promise);
        const connection = { getBalance: vi.fn().mockResolvedValue(0) } as unknown as Connection;
        const owner = Keypair.generate().publicKey;
        let result!: ReturnType<typeof useWalletTokens>;
        function Harness() { result = useWalletTokens(connection, owner); return null; }
        await act(async () => { renderer = create(<Harness />); });
        await act(async () => { await vi.advanceTimersByTimeAsync(30001); });
        expect(result.error).toContain('超时');
        expect(result.isLoading).toBe(false);
        await act(async () => { query.resolve([token('late')]); });
        expect(result.tokens).toEqual([]);
    });
    it('未连接钱包不请求 RPC', async () => {
        const getBalance = vi.fn();
        const connection = { getBalance } as unknown as Connection;
        function Harness() { useWalletTokens(connection, null); return null; }
        await act(async () => { renderer = create(<Harness />); });
        expect(loadWalletTokens).not.toHaveBeenCalled();
        expect(getBalance).not.toHaveBeenCalled();
    });
});
