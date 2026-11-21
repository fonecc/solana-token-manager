import { create } from '../../i18n/testRenderer';
import React from 'react';
import { act} from 'react-test-renderer';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PublicKey, Transaction, TransactionInstruction } from '@solana/web3.js';
import { MintToken } from '../MintToken';
import { TokenMetadata } from '../TokenMetadata';

const mocks = vi.hoisted(() => ({ build: vi.fn(), execute: vi.fn(), getMint: vi.fn(), metadata: vi.fn(), create: vi.fn(), update: vi.fn() }));
const wallet = new PublicKey('11111111111111111111111111111111');
const mint = new PublicKey('So11111111111111111111111111111111111111112');
vi.mock('@solana/wallet-adapter-react', () => ({ useConnection: () => ({ connection: {} }), useWallet: () => ({ publicKey: wallet, signTransaction: vi.fn() }) }));
vi.mock('../../lib/solana/tokens', () => ({ buildMintTransaction: (...args: unknown[]) => mocks.build(...args) }));
vi.mock('../../lib/solana/transactions', () => ({ executeTransaction: (...args: unknown[]) => mocks.execute(...args) }));
vi.mock('@solana/spl-token', () => ({ getMint: (...args: unknown[]) => mocks.getMint(...args) }));
vi.mock('@metaplex-foundation/mpl-token-metadata', async importOriginal => ({ ...await importOriginal<object>(), Metadata: { fromAccountAddress: (...args: unknown[]) => mocks.metadata(...args) }, createCreateMetadataAccountV3Instruction: (...args: unknown[]) => mocks.create(...args), createUpdateMetadataAccountV2Instruction: (...args: unknown[]) => mocks.update(...args) }));
vi.mock('../MintToken/MintTokenView', () => ({ MintTokenView: (props: object) => React.createElement('mint-view', props) }));
vi.mock('../TokenMetadata/MetadataView', () => ({ MetadataView: (props: object) => React.createElement('metadata-view', props) }));
vi.stubGlobal('React', React);
const instruction = () => new TransactionInstruction({ programId: wallet, keys: [], data: Buffer.alloc(0) });
const metadataProps = () => ({ mintAddress: mint.toBase58(), name: '学习币', symbol: 'LEARN', uri: '', defaultTabIndex: 0, setMintAddress: vi.fn(), setName: vi.fn(), setSymbol: vi.fn(), setUri: vi.fn() });
beforeEach(() => {
    vi.clearAllMocks(); mocks.build.mockResolvedValue(new Transaction()); mocks.execute.mockResolvedValue('signature');
    mocks.getMint.mockResolvedValue({ mintAuthority: wallet }); mocks.create.mockImplementation(instruction); mocks.update.mockImplementation(instruction);
    mocks.metadata.mockResolvedValue({ updateAuthority: wallet, isMutable: true, data: { sellerFeeBasisPoints: 125, creators: [{ address: wallet, verified: true, share: 100 }] }, collection: { verified: true, key: mint }, uses: { useMethod: 0, remaining: 2, total: 3 } });
});
function mintSetup() {
    const view = create(<MintToken mintAddress={mint.toBase58()} setMintAddress={vi.fn()} />);
    const props = () => view.root.findByType('mint-view' as React.ElementType).props;
    act(() => { props().onAmountChange('0.000000001'); });
    return { view, props };
}
describe('增发控制层', () => {
    it.each([false, true])('默认自己 / 指定接收者 %s，数量不转换为 Number', async specified => {
        const { view, props } = mintSetup();
        if (specified) act(() => { props().onRecipientChange(mint.toBase58()); });
        await act(async () => { await props().onSubmit(); });
        expect(mocks.build.mock.calls[0][3].toBase58()).toBe(specified ? mint.toBase58() : wallet.toBase58());
        expect(mocks.build.mock.calls[0][4]).toBe('0.000000001');
        expect(props().result).toEqual({ mint: mint.toBase58(), recipient: specified ? mint.toBase58() : wallet.toBase58(), amount: '0.000000001' });
        view.unmount();
    });
    it('同 tick 重复提交只准备一次，失败后可重试', async () => {
        const { view, props } = mintSetup();
        mocks.build.mockRejectedValueOnce(new Error('构造失败'));
        await act(async () => { const submit = props().onSubmit; await Promise.all([submit(), submit()]); });
        expect(mocks.build).toHaveBeenCalledOnce(); expect(mocks.execute).not.toHaveBeenCalled();
        expect(props().error).toContain('构造失败'); expect(props().busy).toBe(false);
        await act(async () => { await props().onSubmit(); });
        expect(props().result).not.toBeNull(); view.unmount();
    });
    it('拒签保留输入与错误，不伪造成功', async () => {
        const { view, props } = mintSetup(); mocks.execute.mockRejectedValueOnce(new Error('用户拒签'));
        await act(async () => { await props().onSubmit(); });
        expect(props().result).toBeNull(); expect(props().amount).toBe('0.000000001'); expect(props().error).toContain('拒签'); expect(props().busy).toBe(false); view.unmount();
    });
});
describe('元数据控制层', () => {
    it('首次创建检查权限，成功保留真实结果', async () => {
        const view = create(<TokenMetadata {...metadataProps()} />); const props = () => view.root.findByType('metadata-view' as React.ElementType).props;
        await act(async () => { await props().onSubmit(); });
        expect(mocks.create).toHaveBeenCalledOnce(); expect(props().result.mutable).toBe(true); view.unmount();
    });
    it('无铸币权限不构造或签名', async () => {
        mocks.getMint.mockResolvedValue({ mintAuthority: mint });
        const view = create(<TokenMetadata {...metadataProps()} />); const props = () => view.root.findByType('metadata-view' as React.ElementType).props;
        await act(async () => { await props().onSubmit(); });
        expect(mocks.create).not.toHaveBeenCalled(); expect(mocks.execute).not.toHaveBeenCalled(); expect(props().error).toContain('没有铸币权限'); view.unmount();
    });
    it('更新保留已有费用、创作者、collection 和 uses，永久锁定按用户选择', async () => {
        const view = create(<TokenMetadata {...metadataProps()} defaultTabIndex={1} />); const props = () => view.root.findByType('metadata-view' as React.ElementType).props;
        act(() => { props().onAllowUpdateChange(false); });
        await act(async () => { await props().onSubmit(); });
        const args = mocks.update.mock.calls[0][1].updateMetadataAccountArgsV2;
        expect(args.data.sellerFeeBasisPoints).toBe(125); expect(args.data.creators).toHaveLength(1); expect(args.data.collection.key).toEqual(mint); expect(args.data.uses.remaining).toBe(2); expect(args.primarySaleHappened).toBeNull(); expect(args.isMutable).toBe(false); expect(props().result.mutable).toBe(false); view.unmount();
    });
    it.each(['authority', 'immutable'])('更新保护 %s，不请求签名', async kind => {
        mocks.metadata.mockResolvedValue({ updateAuthority: kind === 'authority' ? mint : wallet, isMutable: kind !== 'immutable' });
        const view = create(<TokenMetadata {...metadataProps()} defaultTabIndex={1} />); const props = () => view.root.findByType('metadata-view' as React.ElementType).props;
        await act(async () => { await props().onSubmit(); });
        expect(mocks.execute).not.toHaveBeenCalled(); expect(props().error).toContain(kind === 'authority' ? '更新权限' : '永久锁定'); view.unmount();
    });
    it('字节超限在 RPC 前拒绝；拒签后释放操作保护', async () => {
        const base = metadataProps(); const view = create(<TokenMetadata {...base} name={'中'.repeat(11)} />); const props = () => view.root.findByType('metadata-view' as React.ElementType).props;
        await act(async () => { await props().onSubmit(); }); expect(mocks.getMint).not.toHaveBeenCalled();
        act(() => { view.update(<TokenMetadata {...base} />); }); mocks.execute.mockRejectedValueOnce(new Error('拒签'));
        await act(async () => { await props().onSubmit(); }); expect(props().result).toBeNull(); expect(props().busy).toBe(false);
        await act(async () => { await props().onSubmit(); }); expect(props().result).not.toBeNull(); view.unmount();
    });
});
