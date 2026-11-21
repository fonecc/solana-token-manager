import { create } from '../../i18n/testRenderer';
import React, { type ReactNode } from 'react';
import { act} from 'react-test-renderer';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PublicKey } from '@solana/web3.js';
import { getAccount, getMint, TokenAccountNotFoundError } from '@solana/spl-token';
import { FreezeToken } from '../FreezeToken';
import { BurnToken } from '../BurnToken';
import { executeTransaction } from '../../lib/solana/transactions';

const state = vi.hoisted(() => ({ connection: {}, wallet: {} as { publicKey?: PublicKey; signTransaction?: ReturnType<typeof vi.fn> } }));
vi.mock('@solana/wallet-adapter-react', () => ({ useConnection: () => ({ connection: state.connection }), useWallet: () => state.wallet }));
vi.mock('@solana/spl-token', async original => ({ ...await original<typeof import('@solana/spl-token')>(), getMint: vi.fn(), getAccount: vi.fn() }));
vi.mock('../../lib/solana/tokens', () => ({ buildFreezeTransaction: vi.fn(), buildBurnTransaction: vi.fn() }));
vi.mock('../../lib/solana/transactions', () => ({ executeTransaction: vi.fn() }));
vi.mock('../common/TransactionFeedback', () => ({ useTransactionFeedback: () => ({ updates: [], onUpdate: vi.fn() }) }));
vi.mock('../FreezeToken/FreezeTokenView', () => ({ FreezeTokenView: (props: object) => React.createElement('freeze-view', props) }));
vi.mock('../BurnToken/BurnTokenView', async original => ({ ...await original<typeof import('../BurnToken/BurnTokenView')>(), BurnTokenView: (props: object) => React.createElement('burn-view', props) }));
vi.stubGlobal('React', React);
const mint = 'So11111111111111111111111111111111111111112';
const wallet = new PublicKey('11111111111111111111111111111111');
function deferred<T>() { let resolve!: (value: T) => void; const promise = new Promise<T>(done => { resolve = done; }); return { promise, resolve }; }
function render(element: React.ReactElement, tag: string) {
    let view: ReturnType<typeof create>;
    act(() => { view = create(element); });
    return { view: view!, props: () => view!.root.findByType(tag as React.ElementType).props };
}
beforeEach(() => {
    vi.resetAllMocks();
    state.wallet = { publicKey: wallet, signTransaction: vi.fn() };
});

describe('读取结果的真实性与请求失效', () => {
    it('冻结初始状态未知；Mint 输入变更后丢弃旧权限响应', async () => {
        const response = deferred<Awaited<ReturnType<typeof getMint>>>();
        vi.mocked(getMint).mockReturnValueOnce(response.promise);
        const page = render(<FreezeToken mintAddress={mint} />, 'freeze-view');
        expect(page.props().authority).toBeNull();
        expect(page.props().targetState).toBe('idle');
        let work: Promise<void>;
        act(() => { work = page.props().onLoadMint(); });
        act(() => { page.props().onMintChange(wallet.toBase58()); });
        await act(async () => { response.resolve({ freezeAuthority: wallet } as Awaited<ReturnType<typeof getMint>>); await work; });
        expect(page.props().authority).toBeNull();
        expect(page.props().mintLoading).toBe(false);
        page.view.unmount();
    });
    it('RPC 错误不是不存在；只有账户缺失异常才显示 missing', async () => {
        vi.mocked(getMint).mockResolvedValue({ freezeAuthority: wallet } as Awaited<ReturnType<typeof getMint>>);
        const page = render(<FreezeToken mintAddress={mint} />, 'freeze-view');
        await act(async () => { await page.props().onLoadMint(); });
        act(() => { page.props().onTargetChange(wallet.toBase58()); });
        vi.mocked(getAccount).mockRejectedValueOnce(new Error('RPC unavailable'));
        await act(async () => { page.props().onCheckTarget(); });
        expect(page.props().targetState).toBe('error');
        expect(page.props().error).toContain('RPC unavailable');
        vi.mocked(getAccount).mockRejectedValueOnce(new TokenAccountNotFoundError());
        await act(async () => { page.props().onCheckTarget(); });
        expect(page.props().targetState).toBe('missing');
        page.view.unmount();
    });
    it('目标输入改变后旧 ATA 响应不能覆盖新目标', async () => {
        const response = deferred<Awaited<ReturnType<typeof getAccount>>>();
        vi.mocked(getAccount).mockReturnValueOnce(response.promise);
        const page = render(<FreezeToken mintAddress={mint} />, 'freeze-view');
        act(() => { page.props().onTargetChange(wallet.toBase58()); });
        act(() => { page.props().onCheckTarget(); });
        act(() => { page.props().onTargetChange('new-target'); });
        await act(async () => { response.resolve({ isFrozen: true } as Awaited<ReturnType<typeof getAccount>>); });
        expect(page.props().targetState).toBe('idle');
        expect(page.props().targetAta).toBe('');
        page.view.unmount();
    });
    it('冻结确认后刷新失败单独警告，不误称链上交易失败', async () => {
        vi.mocked(getMint).mockResolvedValue({ freezeAuthority: wallet } as Awaited<ReturnType<typeof getMint>>);
        vi.mocked(getAccount).mockResolvedValueOnce({ isFrozen: false } as Awaited<ReturnType<typeof getAccount>>).mockRejectedValueOnce(new Error('refresh failed'));
        vi.mocked(executeTransaction).mockResolvedValue('signature');
        const page = render(<FreezeToken mintAddress={mint} />, 'freeze-view');
        await act(async () => { await page.props().onLoadMint(); });
        act(() => { page.props().onTargetChange(wallet.toBase58()); });
        await act(async () => { page.props().onCheckTarget(); });
        await act(async () => { await page.props().onSubmit(false); });
        expect(executeTransaction).toHaveBeenCalledOnce();
        expect(page.props().error).toBe('');
        expect(page.props().refreshWarning).toContain('交易已确认');
        expect(page.props().operation).toBeNull();
        page.view.unmount();
    });
    it('销毁读取保持大整数精度，输入改变后旧余额不能覆盖', async () => {
        vi.mocked(getMint).mockResolvedValue({ decimals: 9 } as Awaited<ReturnType<typeof getMint>>);
        vi.mocked(getAccount).mockResolvedValueOnce({ amount: 18446744073709551615n, isFrozen: false } as Awaited<ReturnType<typeof getAccount>>);
        const page = render(<BurnToken mintAddress={mint} />, 'burn-view');
        await act(async () => { page.props().onLoad(); });
        expect(page.props().info.balance).toBe('18446744073.709551615');
        const response = deferred<Awaited<ReturnType<typeof getAccount>>>();
        vi.mocked(getAccount).mockReturnValueOnce(response.promise);
        await act(async () => { page.props().onLoad(); });
        act(() => { page.props().onMintChange(wallet.toBase58()); });
        await act(async () => { response.resolve({ amount: 1n, isFrozen: false } as Awaited<ReturnType<typeof getAccount>>); });
        expect(page.props().info).toBeNull();
        expect(page.props().loading).toBe(false);
        page.view.unmount();
    });
    it('销毁确认后刷新失败保留当次结果，禁止拿旧余额再提交', async () => {
        vi.mocked(getMint).mockResolvedValueOnce({ decimals: 9 } as Awaited<ReturnType<typeof getMint>>).mockRejectedValueOnce(new Error('refresh failed'));
        vi.mocked(getAccount).mockResolvedValueOnce({ amount: 10n, isFrozen: false } as Awaited<ReturnType<typeof getAccount>>);
        vi.mocked(executeTransaction).mockResolvedValue('signature');
        const page = render(<BurnToken mintAddress={mint} />, 'burn-view');
        await act(async () => { page.props().onLoad(); });
        act(() => { page.props().onAmountChange('0.000000001'); });
        await act(async () => { await page.props().onSubmit(); });
        expect(page.props().result).toEqual({ mint, amount: '0.000000001' });
        expect(page.props().warning).toContain('销毁交易已确认');
        expect(page.props().error).toBe('');
        expect(page.props().info).toBeNull();
        page.view.unmount();
    });
});
