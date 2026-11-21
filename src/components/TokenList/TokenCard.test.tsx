import { create } from '../../i18n/testRenderer';
import { createElement, type ReactNode } from 'react';
import { act, type ReactTestRenderer } from 'react-test-renderer';
import { describe, expect, it, vi } from 'vitest';
import type { WalletToken } from '../../lib/solana/accounts';
import { TokenCard } from './TokenCard';

// 单元测试只验证权限、禁用态与回调；真实 Chakra 布局/Portal 另做浏览器验收。
vi.mock('@chakra-ui/icons', () => ({ ChevronDownIcon: () => null, CopyIcon: () => null }));
vi.mock('@chakra-ui/react', async () => {
    const { createElement } = await import('react');
    return Object.fromEntries([
        'Avatar', 'Badge', 'Box', 'Button', 'Flex', 'HStack', 'IconButton', 'Menu',
        'MenuButton', 'MenuDivider', 'MenuGroup', 'MenuItem', 'MenuList', 'Portal', 'Text', 'Wrap',
    ].map(name => [name, ({ children, isDisabled, onClick }: { children?: ReactNode; isDisabled?: boolean; onClick?: () => void }) =>
        createElement('div', { 'data-ui': name, disabled: isDisabled, onClick }, children)]));
});

const token: WalletToken = { mint: 'mint', name: '测试代币', symbol: 'TEST', rawAmount: '1000000', amount: '1', decimals: 6 };
function render(overrides: Partial<WalletToken> = {}, isBusy = false) {
    const onAction = vi.fn();
    const onCopy = vi.fn();
    let view: ReactTestRenderer;
    act(() => { view = create(createElement(TokenCard, { token: { ...token, ...overrides }, walletAddress: 'owner', isBusy, onAction, onCopy })); });
    const items = () => view.root.findAllByProps({ 'data-ui': 'MenuItem' });
    return { onAction, onCopy, items, root: view!.root, labels: () => items().map(item => item.children.join('')) };
}

describe('代币卡片操作分组', () => {
    it('普通持币者只有公共操作，无权限撤销入口', () => {
        const view = render();
        expect(view.labels()).toEqual(['创建流动性池', '增加流动性', '销毁代币']);
        expect(view.root.findAllByProps({ 'data-ui': 'Button' })).toHaveLength(1);
    });
    it('按铸币权限展示铸币、元数据和永久撤销入口', () => {
        const view = render({ mintAuthority: 'owner' });
        expect(view.labels()).toContain('设置元数据');
        expect(view.labels()).toContain('永久撤销铸币权限…');
        expect(view.labels()).not.toContain('永久撤销冻结权限…');
        expect(view.root.findAllByProps({ 'data-ui': 'Button' })).toHaveLength(2);
    });
    it('按冻结和元数据权限分别展示管理入口', () => {
        expect(render({ freezeAuthority: 'owner' }).labels()).toEqual(['冻结 / 解冻账户', '创建流动性池', '增加流动性', '销毁代币', '永久撤销冻结权限…']);
        expect(render({ metadataUpdateAuthority: 'owner' }).labels()).toEqual(['设置元数据', '创建流动性池', '增加流动性', '销毁代币']);
    });
    it('零余额禁用转账，忙碌时禁用快捷按钮及菜单', () => {
        const empty = render({ rawAmount: '0', amount: '0' });
        expect(empty.root.findByProps({ 'data-ui': 'Button' }).props.disabled).toBe(true);
        const busy = render({ mintAuthority: 'owner' }, true);
        expect(busy.root.findAllByProps({ 'data-ui': 'Button' }).every(button => button.props.disabled)).toBe(true);
        expect(busy.root.findByProps({ 'data-ui': 'MenuButton' }).props.disabled).toBe(true);
    });
    it('永久撤销仅通知父级打开确认流程，不直接执行交易', () => {
        const view = render({ mintAuthority: 'owner' });
        const item = view.items().find(item => item.children.join('') === '永久撤销铸币权限…')!;
        act(() => { item.props.onClick(); });
        expect(view.onAction).toHaveBeenCalledExactlyOnceWith('revokeMint', { ...token, mintAuthority: 'owner' });
    });
    it('快捷操作和复制携带正确代币', () => {
        const view = render();
        act(() => { view.root.findByProps({ 'data-ui': 'Button' }).props.onClick(); });
        expect(view.onAction).toHaveBeenCalledWith('transfer', token);
        act(() => { view.root.findByProps({ 'data-ui': 'IconButton' }).props.onClick(); });
        expect(view.onCopy).toHaveBeenCalledWith(token.mint);
    });
});
