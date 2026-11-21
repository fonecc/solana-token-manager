import React from 'react';
import { act } from 'react-test-renderer';
import { beforeEach, expect, it, vi } from 'vitest';
import { create } from './testRenderer';
import { LanguageSwitcher } from './LanguageSwitcher';

const mocks = vi.hoisted(() => ({ replace: vi.fn(), toast: vi.fn() }));
vi.mock('next/router', () => ({ useRouter: () => ({ locale: 'en', pathname: '/manual/[topic]', query: { topic: 'pool', example: 'keep' }, asPath: '/manual/pool?example=keep#step-3', replace: mocks.replace }) }));
vi.mock('@chakra-ui/react', () => ({ FormControl: 'form-control', FormLabel: 'form-label', Select: 'select', useToast: () => mocks.toast }));
beforeEach(() => { vi.clearAllMocks(); });

it('切语言保留路由参数和章节锚点，拒绝非法语言及重复选择', async () => {
    mocks.replace.mockResolvedValue(true);
    const view = create(<LanguageSwitcher />, undefined, 'en');
    const select = () => view.root.findByType('select');
    await act(async () => { await select().props.onChange({ target: { value: 'zh-TW' } }); });
    expect(mocks.replace).toHaveBeenCalledWith({ pathname: '/manual/[topic]', query: { topic: 'pool', example: 'keep' } }, '/manual/pool?example=keep#step-3', { locale: 'zh-TW', scroll: false });
    await act(async () => { await select().props.onChange({ target: { value: 'invalid' } }); await select().props.onChange({ target: { value: 'en' } }); });
    expect(mocks.replace).toHaveBeenCalledTimes(1);
    expect(select().props.isDisabled).toBe(false);
    view.unmount();
});

it('路由失败显示当前语言提示并恢复选择器，不产生未处理拒绝', async () => {
    mocks.replace.mockRejectedValue(new Error('network offline'));
    const view = create(<LanguageSwitcher />, undefined, 'zh-TW');
    await act(async () => { await view.root.findByType('select').props.onChange({ target: { value: 'zh-CN' } }); });
    expect(mocks.toast).toHaveBeenCalledWith({ title: '切換語言失敗。目前頁面未變更，請重試。', status: 'error' });
    expect(view.root.findByType('select').props.isDisabled).toBe(false);
    view.unmount();
});

it('使用浏览器当前章节锚点，而不是路由缓存中的旧 hash', async () => {
    vi.stubGlobal('window', { location: { hash: '#step-4' } });
    mocks.replace.mockResolvedValue(true);
    const view = create(<LanguageSwitcher />, undefined, 'en');
    try {
        await act(async () => { await view.root.findByType('select').props.onChange({ target: { value: 'zh-TW' } }); });
        expect(mocks.replace.mock.calls[0][1]).toBe('/manual/pool?example=keep#step-4');
    } finally {
        view.unmount();
        vi.unstubAllGlobals();
    }
});
