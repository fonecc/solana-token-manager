import { useT } from '../../i18n/useT';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';
import { useEffect } from 'react';

// 兼容当前钱包 UI 库缺失的初始焦点、返回焦点和可访问名称；Tab/Escape 仍由库处理。
export function enhanceWalletModal(closeLabel = 'Close wallet selection') {
    const dialog = document.querySelector<HTMLElement>('.wallet-adapter-modal[role="dialog"]');
    if (!dialog) return () => {};
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const title = dialog.querySelector<HTMLElement>('.wallet-adapter-modal-title');
    const close = dialog.querySelector<HTMLButtonElement>('.wallet-adapter-modal-button-close');
    if (title) {
        if (!title.id) title.id = 'wallet-adapter-modal-title';
        dialog.setAttribute('aria-labelledby', title.id);
    }
    if (close) {
        close.setAttribute('aria-label', closeLabel);
        close.focus();
    }
    return () => {
        if (previousFocus?.isConnected) previousFocus.focus();
    };
}

export function WalletModalAccessibility() {
    const t = useT();
    const { visible } = useWalletModal();
    useEffect(() => {
        if (!visible) return;
        // 等库的 portal 挂载完成，不在渲染阶段读取 DOM。
        let restoreFocus: (() => void) | undefined;
        const frame = requestAnimationFrame(() => { restoreFocus = enhanceWalletModal(t('wallet.close')); });
        return () => {
            cancelAnimationFrame(frame);
            restoreFocus?.();
        };
    }, [visible, t]);
    return null;
}
