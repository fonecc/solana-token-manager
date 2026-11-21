import { create } from '../../i18n/testRenderer';
import React from 'react';
import { act} from 'react-test-renderer';
import { describe, expect, it, vi } from 'vitest';
import { PublicKey } from '@solana/web3.js';
import { MarketCreator } from './MarketCreator';
import { PROGRAM_IDS } from '../../lib/solana/protocol';

const mocks = vi.hoisted(() => ({ account: vi.fn(), execute: vi.fn(), build: vi.fn(), decode: vi.fn() }));
const owner = new PublicKey('11111111111111111111111111111111');
const mint = new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA');
vi.stubGlobal('React', React);
vi.mock('@chakra-ui/react', () => ({ useToast: () => vi.fn() }));
vi.mock('@solana/wallet-adapter-react', () => ({ useConnection: () => ({ connection: { getAccountInfo: mocks.account } }), useWallet: () => ({ publicKey: owner }) }));
vi.mock('@solana/spl-token', async importOriginal => ({ ...await importOriginal<object>(), getMint: async () => ({ decimals: 6 }) }));
vi.mock('@raydium-io/raydium-sdk', async importOriginal => ({ ...await importOriginal<object>(), TxVersion: { LEGACY: 0 }, MARKET_STATE_LAYOUT_V3: { span: 10, decode: (...args: unknown[]) => mocks.decode(...args) }, MarketV2: { makeCreateMarketInstructionSimple: (...args: unknown[]) => mocks.build(...args) } }));
vi.mock('../../lib/solana/transactions', () => ({ executeInstructionBatches: (...args: unknown[]) => mocks.execute(...args) }));
vi.mock('./MarketSetup', () => ({ MarketSetup: (props: object) => React.createElement('market-view', props) }));

describe('市场确认与只读恢复', () => {
    it('已确认后读取失败不诱导重建，保留 Market ID 并可只读恢复', async () => {
        mocks.account.mockResolvedValueOnce({ executable: true }).mockRejectedValueOnce(new Error('RPC 暂不可用'));
        mocks.build.mockResolvedValue({ innerTransactions: [], address: { marketId: owner } }); mocks.execute.mockResolvedValue([]);
        const onCreated = vi.fn(); const busy = vi.fn(); const view = create(<MarketCreator tokenMint={mint.toBase58()} onBusyChange={busy} onMarketCreated={onCreated} />);
        const props = () => view.root.findByType('market-view' as React.ElementType).props;
        await act(async () => { await props().onCreate(); });
        expect(props().error).toContain('市场交易已确认'); expect(props().error).toContain('不要重新创建'); expect(props().manualId).toBe(owner.toBase58()); expect(props().canCreate).toBe(false); expect(props().canLoad).toBe(true); expect(busy).toHaveBeenLastCalledWith(false);
        await act(async () => { await props().onCreate(); }); expect(mocks.build).toHaveBeenCalledOnce();
        mocks.account.mockResolvedValueOnce({ owner: PROGRAM_IDS.OPENBOOK_MARKET, data: Buffer.alloc(10) });
        mocks.decode.mockReturnValue({ baseMint: mint, quoteMint: new PublicKey('So11111111111111111111111111111111111111112'), baseVault: owner, quoteVault: mint });
        await act(async () => { await props().onLoad(); }); expect(onCreated).toHaveBeenCalledOnce(); expect(mocks.execute).toHaveBeenCalledOnce(); expect(props().error).toBe(''); view.unmount();
    });
});
