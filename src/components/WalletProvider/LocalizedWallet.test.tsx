import React from 'react';
import { act } from 'react-test-renderer';
import { beforeEach, expect, it, vi } from 'vitest';
import { WalletReadyState } from '@solana/wallet-adapter-base';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';
import { create } from '../../i18n/testRenderer';
import { LocalizedWalletModalProvider } from './LocalizedWalletModalProvider';
import { WalletButton } from '../WalletButton';

const mocks = vi.hoisted(() => ({ select: vi.fn(), connect: vi.fn(), disconnect: vi.fn(), toast: vi.fn(), connected: false, selected: false }));
vi.mock('@solana/wallet-adapter-react', () => ({ useWallet: () => ({
    connected: mocks.connected, connecting: false, wallet: mocks.selected ? {} : null,
    connect: mocks.connect, disconnect: mocks.disconnect, select: mocks.select,
    wallets: [
        { adapter: { name: 'Loadable wallet', icon: '' }, readyState: 'Loadable' },
        { adapter: { name: 'Installed wallet', icon: '' }, readyState: 'Installed' },
        { adapter: { name: 'Unsupported wallet', icon: '' }, readyState: 'Unsupported' },
    ],
}) }));
vi.mock('@chakra-ui/react', () => ({ Button: 'button', HStack: 'h-stack', Image: 'image', Modal: 'dialog', ModalBody: 'modal-body', ModalCloseButton: 'close-button', ModalContent: 'modal-content', ModalHeader: 'modal-header', ModalOverlay: 'modal-overlay', Text: 'text', VStack: 'v-stack', useToast: () => mocks.toast }));

beforeEach(() => { vi.clearAllMocks(); mocks.connected = false; mocks.selected = false; });

it('三语钱包选择保留品牌、优先已安装并过滤不支持钱包；选择不主动连接或签名', () => {
    let modal!: ReturnType<typeof useWalletModal>;
    function Probe() { modal = useWalletModal(); return null; }
    const view = create(<LocalizedWalletModalProvider><Probe /></LocalizedWalletModalProvider>, undefined, 'en');
    expect(WalletReadyState.Installed).toBe('Installed');
    act(() => modal.setVisible(true));
    expect(view.root.findByType('dialog').props.isOpen).toBe(true);
    expect(view.root.findAllByType('button').map(button => button.findAllByType('text')[0].children.join(''))).toEqual(['Installed wallet', 'Loadable wallet']);
    for (const locale of ['en', 'zh-CN', 'zh-TW'] as const) {
        act(() => view.setLocale(locale));
        expect(view.root.find(node => node.type === ('close-button' as React.ElementType)).props['aria-label']).toBeTruthy();
        expect(view.root.findByType('dialog').props.isOpen).toBe(true);
    }
    act(() => view.root.findAllByType('button')[0].props.onClick());
    expect(mocks.select).toHaveBeenCalledWith('Installed wallet');
    expect(view.root.findByType('dialog').props.isOpen).toBe(false);
    expect(mocks.connect).not.toHaveBeenCalled();
    expect(mocks.disconnect).not.toHaveBeenCalled();
    view.unmount();
});

it('钱包按钮只按明确点击选择、连接或断开，切语言不调用钱包动作', async () => {
    const element = <LocalizedWalletModalProvider><WalletButton /></LocalizedWalletModalProvider>;
    const view = create(element, undefined, 'en');
    const button = () => view.root.findAllByType('button')[0];
    await act(async () => { await button().props.onClick(); });
    expect(view.root.findByType('dialog').props.isOpen).toBe(true);
    expect(mocks.connect).not.toHaveBeenCalled();
    mocks.selected = true;
    act(() => view.update(element));
    // Change locale to force the mocked wallet state to be read again.
    act(() => view.setLocale('zh-TW'));
    expect(mocks.connect).not.toHaveBeenCalled();
    await act(async () => { await button().props.onClick(); });
    expect(mocks.connect).toHaveBeenCalledTimes(1);
    mocks.connected = true;
    act(() => view.setLocale('zh-CN'));
    await act(async () => { await button().props.onClick(); });
    expect(mocks.disconnect).toHaveBeenCalledTimes(1);
    view.unmount();
});
