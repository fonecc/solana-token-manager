import { create } from '../../i18n/testRenderer';
import { createElement, type ReactNode } from 'react';
import { act, type ReactTestInstance, type ReactTestRenderer } from 'react-test-renderer';
import { describe, expect, it, vi } from 'vitest';
import { PublicKey } from '@solana/web3.js';
import CreatePool from './index';

vi.mock('@chakra-ui/react', async () => {
    const { createElement, useState, forwardRef } = await import('react');
    return {
        Button: forwardRef((props: { children?: ReactNode }, ref) => createElement('mock-button', { ...props, ref, 'data-ui': 'Button' }, props.children)),
        ...Object.fromEntries(['AlertDialog', 'AlertDialogBody', 'AlertDialogContent', 'AlertDialogFooter', 'AlertDialogHeader', 'AlertDialogOverlay', 'Text'].map(name => [name, (props: { children?: ReactNode }) => createElement(`mock-${name.toLowerCase()}`, { ...props, 'data-ui': name }, props.children)])),
        useDisclosure: () => {
            const [isOpen, setOpen] = useState(false);
            return { isOpen, onOpen: () => setOpen(true), onClose: () => setOpen(false) };
        },
    };
});
vi.mock('./MarketCreator', async () => {
    const { createElement, useState } = await import('react');
    return { MarketCreator: (props: object) => {
        const [marker] = useState({});
        return createElement('mock-market', { ...props, marker });
    } };
});
vi.mock('./PoolCreator', async () => {
    const { createElement, useState } = await import('react');
    return { PoolCreator: (props: object) => {
        const [marker] = useState({});
        return createElement('mock-pool', { ...props, marker });
    } };
});
vi.mock('./PoolGuide', async () => {
    const { createElement } = await import('react');
    return { PoolGuide: (props: { children?: ReactNode }) => createElement('mock-guide', props, props.children) };
});
vi.mock('./MarketDetails', async () => ({ MarketDetails: (props: object) => createElement('mock-market-details', props) }));
vi.mock('./PoolDetails', async () => ({ PoolDetails: (props: object) => createElement('mock-pool-details', props) }));
vi.mock('./AmountInputs', async () => ({ AmountInputs: (props: object) => createElement('mock-amounts', props) }));

const mint = 'So11111111111111111111111111111111111111112';
const market = { marketId: mint, baseMint: 'base', quoteMint: mint, baseVault: 'market-base', quoteVault: 'market-quote' };
const pool = { marketId: mint, poolId: 'pool', lpMint: 'lp', baseVault: 'pool-base', quoteVault: 'pool-quote', baseAmount: '100', quoteAmount: '0.1' };
function render() {
    let view: ReactTestRenderer;
    act(() => { view = create(createElement(CreatePool, { tokenMint: mint, isActive: true })); });
    const node = (tag: string) => view!.root.findAll(n => String(n.type) === tag)[0];
    const text = (n: ReactTestInstance): string => n.children.map(c => typeof c === 'string' ? c : text(c)).join('');
    return { node, view: view!, button: (label: string) => view!.root.findAllByProps({ 'data-ui': 'Button' }).find(n => text(n) === label)! };
}

describe('建池阶段状态', () => {
    it('市场和池各有一个结果，跨阶段保持交易控制层挂载', () => {
        const { node, view } = render();
        const marketMarker = node('mock-market').props.marker;
        expect(node('mock-guide').props.stage).toBe('market');
        act(() => { node('mock-market').props.onMarketCreated(new PublicKey(mint), market); });
        expect(node('mock-market').props.marker).toBe(marketMarker);
        expect(node('mock-market').props.ready).toBe(true);
        expect(node('mock-guide').props.stage).toBe('deposit');
        const poolMarker = node('mock-pool').props.marker;
        act(() => { node('mock-pool').props.onBusyChange(true); });
        expect(node('mock-amounts').props.isDisabled).toBe(true);
        act(() => { node('mock-pool').props.onPoolCreated(pool); node('mock-pool').props.onBusyChange(false); });
        expect(node('mock-pool').props.marker).toBe(poolMarker);
        expect(node('mock-pool').props.done).toBe(true);
        expect(node('mock-guide').props.stage).toBe('done');
        expect(view.root.findAll(n => String(n.type) === 'mock-pool-details')).toHaveLength(1);
        expect(node('mock-market-details').props.details).toEqual(market);
        expect(node('mock-market-details').props.details).not.toHaveProperty('poolId');
        expect(view.root.findAll(n => String(n.type) === 'mock-amounts')).toHaveLength(0);
    });
    it('市场处理中不能清空，失败后的记录保留提示不丢失', () => {
        const { node, view, button } = render();
        const marker = node('mock-market').props.marker;
        act(() => { node('mock-market').props.onBusyChange(true); });
        act(() => { view.update(createElement(CreatePool, { tokenMint: mint, isActive: false })); });
        expect(node('mock-alertdialog').props.isOpen).toBe(false);
        expect(node('mock-market').props.marker).toBe(marker);
        act(() => { view.update(createElement(CreatePool, { tokenMint: mint, isActive: true })); });
        act(() => { button('管理本页记录').props.onClick(); });
        expect(node('mock-alertdialog').props.isOpen).toBe(true);
        expect(button('清空页面记录').props.isDisabled).toBe(true);
        act(() => { button('清空页面记录').props.onClick(); });
        expect(node('mock-market').props.marker).toBe(marker);
        act(() => { node('mock-market').props.onBusyChange(false); });
        expect(button('清空页面记录').props.isDisabled).toBe(false);
        act(() => { button('清空页面记录').props.onClick(); });
        expect(node('mock-market').props.marker).not.toBe(marker);
        expect(node('mock-alertdialog').props.isOpen).toBe(false);
    });
});
