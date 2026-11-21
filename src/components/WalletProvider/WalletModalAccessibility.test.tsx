import { create } from '../../i18n/testRenderer';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createElement } from 'react';
import { act} from 'react-test-renderer';
import { enhanceWalletModal, WalletModalAccessibility } from './WalletModalAccessibility';

const modal = vi.hoisted(() => ({ visible: true }));
vi.mock('@solana/wallet-adapter-react-ui', () => ({ useWalletModal: () => modal }));

class ElementStub {
    id = '';
    isConnected = true;
    focus = vi.fn();
    setAttribute = vi.fn();
    children = new Map<string, ElementStub>();
    querySelector(selector: string) { return this.children.get(selector) ?? null; }
}

let dialog: ElementStub;
let close: ElementStub;
let title: ElementStub;
let trigger: ElementStub;

beforeEach(() => {
    dialog = new ElementStub();
    close = new ElementStub();
    title = new ElementStub();
    trigger = new ElementStub();
    dialog.children.set('.wallet-adapter-modal-title', title);
    dialog.children.set('.wallet-adapter-modal-button-close', close);
    vi.stubGlobal('HTMLElement', ElementStub);
    vi.stubGlobal('document', { activeElement: trigger, querySelector: vi.fn(() => dialog) });
    modal.visible = true;
});
afterEach(() => { vi.unstubAllGlobals(); });

describe('钱包弹窗可访问性兼容', () => {
    it('补齐标题和关闭名称，将焦点移入弹窗并在关闭后返回', () => {
        const restore = enhanceWalletModal('关闭钱包选择');
        expect(title.id).toBe('wallet-adapter-modal-title');
        expect(dialog.setAttribute).toHaveBeenCalledWith('aria-labelledby', title.id);
        expect(close.setAttribute).toHaveBeenCalledWith('aria-label', '关闭钱包选择');
        expect(close.focus).toHaveBeenCalledOnce();
        restore();
        expect(trigger.focus).toHaveBeenCalledOnce();
    });
    it('保留已有标题 ID，不聚焦已卸载的触发元素', () => {
        title.id = 'existing-title';
        const restore = enhanceWalletModal();
        expect(dialog.setAttribute).toHaveBeenCalledWith('aria-labelledby', 'existing-title');
        trigger.isConnected = false;
        restore();
        expect(trigger.focus).not.toHaveBeenCalled();
    });
    it('弹窗不存在时安全退出', () => {
        vi.mocked(document.querySelector).mockReturnValueOnce(null);
        enhanceWalletModal()();
        expect(close.focus).not.toHaveBeenCalled();
    });
    it('挂载后处理 portal，关闭时取消回调并恢复焦点', () => {
        let frame: FrameRequestCallback | undefined;
        const cancel = vi.fn();
        vi.stubGlobal('requestAnimationFrame', vi.fn((callback: FrameRequestCallback) => { frame = callback; return 1; }));
        vi.stubGlobal('cancelAnimationFrame', cancel);
        let renderer: ReturnType<typeof create>;
        act(() => { renderer = create(createElement(WalletModalAccessibility)); });
        expect(close.focus).not.toHaveBeenCalled();
        act(() => { frame?.(0); });
        expect(close.focus).toHaveBeenCalledOnce();
        modal.visible = false;
        act(() => { renderer.update(createElement(WalletModalAccessibility)); });
        expect(cancel).toHaveBeenCalledWith(1);
        expect(trigger.focus).toHaveBeenCalledOnce();
        act(() => { renderer.unmount(); });
    });
});
