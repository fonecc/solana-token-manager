import { create } from '../../i18n/testRenderer';
import React from 'react';
import { act} from 'react-test-renderer';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { PublicKey } from '@solana/web3.js';
import BN from 'bn.js';
import { AddLiquidity } from '../AddLiquidity';
import { TokenSwap } from '../TokenSwap';

const mocks = vi.hoisted(() => ({ pool: vi.fn(), execute: vi.fn(), accounts: vi.fn(), compute: vi.fn(), add: vi.fn(), swap: vi.fn(), quote: vi.fn(), connection: {}, toast: vi.fn() }));
const base = 'So11111111111111111111111111111111111111112';
const quoteMint = 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA';
const owner = new PublicKey('11111111111111111111111111111111');
const pool = { poolKeys: { id: owner, baseMint: new PublicKey(base), quoteMint: new PublicKey(quoteMint), baseDecimals: 9, quoteDecimals: 6 }, poolInfo: {} };
const batches = [{ instructions: [], signers: [{ publicKey: owner }] }];
const amount = (value: string, raw = value) => ({ toExact: () => value, raw: new BN(raw) });
vi.stubGlobal('React', React);
vi.mock('@solana/wallet-adapter-react', () => ({ useConnection: () => ({ connection: mocks.connection }), useWallet: () => ({ publicKey: owner, signTransaction: vi.fn() }) }));
vi.mock('@chakra-ui/react', () => ({ useToast: () => mocks.toast }));
vi.mock('../../lib/solana/pools', () => ({ getPoolInfo: (...args: unknown[]) => mocks.pool(...args) }));
vi.mock('../../lib/solana/transactions', () => ({ executeInstructionBatches: (...args: unknown[]) => mocks.execute(...args) }));
vi.mock('../../lib/solana/defi', async importOriginal => ({ ...await importOriginal<object>(), walletTokenAccounts: (...args: unknown[]) => mocks.accounts(...args), swapQuote: (...args: unknown[]) => mocks.quote(...args) }));
vi.mock('@raydium-io/raydium-sdk', async importOriginal => ({ ...await importOriginal<object>(), Liquidity: { computeAnotherAmount: (...args: unknown[]) => mocks.compute(...args), getEnabledFeatures: () => ({ addLiquidity: true }), makeAddLiquidityInstructionSimple: (...args: unknown[]) => mocks.add(...args), makeSwapInstructionSimple: (...args: unknown[]) => mocks.swap(...args) } }));
vi.mock('../AddLiquidity/LiquidityView', () => ({ LiquidityView: (props: object) => React.createElement('liquidity-view', props) }));
vi.mock('../TokenSwap/SwapView', () => ({ SwapView: (props: object) => React.createElement('swap-view', props) }));
vi.mock('../TokenSwap/TokenSelectModal', () => ({ TokenSelectModal: (props: object) => React.createElement('select-view', props) }));
vi.mock('../TokenSwap/SwapConfirmModal', () => ({ SwapConfirmModal: (props: object) => React.createElement('confirm-view', props) }));
beforeEach(() => {
    vi.clearAllMocks(); mocks.pool.mockResolvedValue(pool); mocks.accounts.mockResolvedValue([]); mocks.execute.mockResolvedValue([]);
    mocks.compute.mockReturnValue({ anotherAmount: amount('2', '2000000'), maxAnotherAmount: amount('2.02', '2020000') });
    mocks.quote.mockReturnValue({ amountOut: amount('2'), minAmountOut: amount('1.99', '1990000'), priceImpact: { toFixed: () => '0.10' } });
    mocks.add.mockResolvedValue({ innerTransactions: batches }); mocks.swap.mockResolvedValue({ innerTransactions: batches });
});
afterEach(() => { vi.useRealTimers(); });
function liquidity() {
    let view!: ReturnType<typeof create>; act(() => { view = create(<AddLiquidity initialPoolId={owner.toBase58()} entryVersion={1} />); });
    const props = () => view.root.findByType('liquidity-view' as React.ElementType).props;
    return { view, props };
}
describe('增加流动性控制层', () => {
    it('交接只填地址，重复交接清旧报价不自动读取', async () => {
        const { view, props } = liquidity(); expect(props().poolId).toBe(owner.toBase58()); expect(mocks.pool).not.toHaveBeenCalled();
        await act(async () => { await props().onLoad(false); }); act(() => { props().onAmountChange('1'); }); expect(props().quote).not.toBeNull();
        act(() => { view.update(<AddLiquidity initialPoolId={owner.toBase58()} entryVersion={2} />); });
        expect(props().quote).toBeNull(); expect(props().pool).toBeNull(); expect(mocks.pool).toHaveBeenCalledOnce(); view.unmount();
    });
    it('修改池地址丢弃迟到响应', async () => {
        let resolve!: (value: typeof pool) => void; mocks.pool.mockReturnValueOnce(new Promise(done => { resolve = done; }));
        const { view, props } = liquidity(); let pending!: Promise<void>;
        act(() => { pending = props().onLoad(false); }); act(() => { props().onPoolIdChange(base); });
        await act(async () => { resolve(pool); await pending; }); expect(props().pool).toBeNull(); expect(props().poolId).toBe(base); view.unmount();
    });
    it('同池重检发现最大投入上升，清报价且不签名', async () => {
        const { view, props } = liquidity(); await act(async () => { await props().onLoad(false); }); act(() => { props().onAmountChange('1'); });
        mocks.compute.mockReturnValue({ anotherAmount: amount('3'), maxAnotherAmount: amount('3.03', '3030000') });
        await act(async () => { await props().onSubmit(); }); expect(mocks.pool.mock.calls[1][1]).toEqual({ ammId: owner.toBase58() }); expect(mocks.execute).not.toHaveBeenCalled(); expect(props().quote).toBeNull(); expect(props().error).toContain('池比例已变化'); view.unmount();
    });
    it('SDK 批次和额外 signer 原样传递；刷新失败不抹掉确认结果', async () => {
        const { view, props } = liquidity(); await act(async () => { await props().onLoad(false); }); act(() => { props().onAmountChange('1'); });
        mocks.pool.mockResolvedValueOnce(pool).mockRejectedValueOnce(new Error('刷新 RPC 错误'));
        await act(async () => { await props().onSubmit(); });
        expect(mocks.execute.mock.calls[0][2]).toBe(batches); expect(mocks.add.mock.calls[0][0].fixedSide).toBe('a'); expect(props().confirmed).toBe(true); expect(props().quote).toBeNull(); expect(props().pool).toBeNull(); expect(props().error).toContain('不要重复提交'); view.unmount();
    });
});
async function swapSetup() {
    vi.useFakeTimers(); let view!: ReturnType<typeof create>; act(() => { view = create(<TokenSwap />); });
    const props = () => view.root.findByType('swap-view' as React.ElementType).props;
    const select = () => view.root.findByType('select-view' as React.ElementType).props;
    const confirm = () => view.root.findByType('confirm-view' as React.ElementType).props;
    act(() => { props().onSelect('a'); }); act(() => { select().onSelect({ mint: base, decimals: 9, symbol: 'A' }); });
    act(() => { props().onSelect('b'); }); act(() => { select().onSelect({ mint: quoteMint, decimals: 6, symbol: 'B' }); });
    act(() => { props().onAmountChange('1'); });
    return { view, props, confirm };
}
describe('兑换控制层', () => {
    it('350ms 防抖；金额、滑点和方向改变清旧报价', async () => {
        const { view, props } = await swapSetup(); expect(mocks.pool).not.toHaveBeenCalled();
        await act(async () => { await vi.advanceTimersByTimeAsync(350); }); expect(props().quote.minimum).toBe('1.99');
        act(() => { props().onAmountChange('2'); }); expect(props().quote).toBeNull();
        await act(async () => { await vi.advanceTimersByTimeAsync(350); }); expect(mocks.quote.mock.calls[1][3]).toBe('2');
        act(() => { props().onSlippageChange('1'); }); expect(props().quote).toBeNull();
        await act(async () => { await vi.advanceTimersByTimeAsync(350); }); expect(mocks.quote.mock.calls[2][4]).toBe(100);
        act(() => { props().onReverse(); }); expect(props().quote).toBeNull(); expect(props().amount).toBe(''); view.unmount();
    });
    it('迟到报价不能覆盖新输入', async () => {
        const { view, props } = await swapSetup(); let resolve!: (value: typeof pool) => void;
        mocks.pool.mockReturnValueOnce(new Promise(done => { resolve = done; }));
        await act(async () => { await vi.advanceTimersByTimeAsync(350); }); act(() => { props().onAmountChange('2'); });
        await act(async () => { resolve(pool); await Promise.resolve(); }); expect(props().quote).toBeNull();
        await act(async () => { await vi.advanceTimersByTimeAsync(350); }); expect(props().quote).not.toBeNull(); expect(mocks.quote.mock.calls[mocks.quote.mock.calls.length - 1]?.[3]).toBe('2'); view.unmount();
    });
    it.each(['minimum', 'expired'])('最小输出变化 / 报价过期 %s 必须再次确认', async kind => {
        const { view, props, confirm } = await swapSetup(); await act(async () => { await vi.advanceTimersByTimeAsync(350); }); act(() => { props().onPreview(); });
        if (kind === 'minimum') mocks.quote.mockReturnValue({ amountOut: amount('1.9', '1900000'), minAmountOut: amount('1.8', '1800000'), priceImpact: { toFixed: () => '0.20' } });
        else await act(async () => { await vi.advanceTimersByTimeAsync(31000); });
        await act(async () => { await confirm().onConfirm(); }); expect(mocks.execute).not.toHaveBeenCalled(); expect(confirm().isOpen).toBe(true); expect(confirm().isSwapping).toBe(false); expect(mocks.pool.mock.calls[1][1]).toEqual({ ammId: owner.toBase58() }); view.unmount();
    });
    it('拒签保留报价与输入，重试使用已确认最小数量和同池批次', async () => {
        const { view, props, confirm } = await swapSetup(); await act(async () => { await vi.advanceTimersByTimeAsync(350); }); act(() => { props().onPreview(); });
        mocks.execute.mockRejectedValueOnce(new Error('拒签'));
        await act(async () => { await confirm().onConfirm(); }); expect(props().amount).toBe('1'); expect(props().error).toContain('拒签'); expect(confirm().isSwapping).toBe(false);
        await act(async () => { await confirm().onConfirm(); });
        expect(mocks.swap.mock.calls[1][0].amountOut.toExact()).toBe('1.99'); expect(mocks.swap.mock.calls[1][0].fixedSide).toBe('in'); expect(mocks.execute.mock.calls[1][2]).toBe(batches); expect(props().amount).toBe(''); expect(confirm().isOpen).toBe(false); expect(props().error).toBe(''); view.unmount();
    });
});
