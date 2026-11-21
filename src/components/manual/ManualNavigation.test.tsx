import React, { type ReactNode } from 'react';
import { act } from 'react-test-renderer';
import { beforeEach, expect, it, vi } from 'vitest';
import { create } from '../../i18n/testRenderer';
import { ManualContext, ManualProvider, useManual } from './ManualContext';
import { ManualLink } from './ManualLink';
import { CourseMenu } from '../learning/WorkspaceShell';

const mocks = vi.hoisted(() => ({ query: {} as Record<string, string>, push: vi.fn(), toast: vi.fn() }));
vi.mock('next/router', () => ({ useRouter: () => ({ query: mocks.query, push: mocks.push }) }));
vi.mock('@chakra-ui/react', () => ({ useToast: () => mocks.toast, VStack: 'section', Box: 'div', Text: 'span', Button: 'button' }));
beforeEach(() => { vi.clearAllMocks(); mocks.query = {}; mocks.push.mockResolvedValue(true); });

it('手册导航只浅切换首页 query，保留其他参数；未知章节回目录', async () => {
    let manual!: ReturnType<typeof useManual>;
    function Probe() { manual = useManual(); return null; }
    mocks.query = { manual: 'create', keep: 'draft' };
    const view = create(<ManualProvider><Probe /></ManualProvider>);
    expect(manual.isOpen).toBe(true);
    expect(manual.topic).toBe('create');
    await act(async () => { manual.open('mint'); });
    expect(mocks.push).toHaveBeenLastCalledWith({ pathname: '/', query: { manual: 'mint', keep: 'draft' } }, undefined, { shallow: true, scroll: false });
    await act(async () => { manual.close(); });
    expect(mocks.push).toHaveBeenLastCalledWith({ pathname: '/', query: { keep: 'draft' } }, undefined, { shallow: true, scroll: false });
    mocks.query = { manual: 'unknown' };
    act(() => view.update(<ManualProvider><Probe /></ManualProvider>));
    expect(manual.isOpen).toBe(true);
    expect(manual.topic).toBeUndefined();
    view.unmount();
});

it('浅路由失败有提示，不产生未处理拒绝', async () => {
    mocks.push.mockRejectedValue(new Error('offline'));
    let manual!: ReturnType<typeof useManual>;
    function Probe() { manual = useManual(); return null; }
    const view = create(<ManualProvider><Probe /></ManualProvider>);
    await act(async () => { manual.open(); });
    expect(mocks.toast).toHaveBeenCalledWith({ title: '暂时无法打开此视图，请重试。', status: 'error' });
    view.unmount();
});

it('页头与逐课指南不打开新页，调用同一手册上下文', () => {
    const open = vi.fn();
    const view = create(<ManualContext.Provider value={{ isOpen: false, open, close: vi.fn() }}><ManualLink /><ManualLink topic="burn" /></ManualContext.Provider>);
    const buttons = view.root.findAllByType('button');
    act(() => { buttons[0].props.onClick(); buttons[1].props.onClick(); });
    expect(open.mock.calls).toEqual([[undefined], ['burn']]);
    expect(buttons.every(button => !button.props.target && !button.props.href)).toBe(true);
    view.unmount();
});

it('课程主菜单底部显示手册选中态并关闭手机抽屉，课程不重复选中', () => {
    const open = vi.fn(), onManualOpen = vi.fn();
    const view = create(<ManualContext.Provider value={{ isOpen: true, open, close: vi.fn() }}><CourseMenu active="create" onNavigate={vi.fn()} onManualOpen={onManualOpen} /></ManualContext.Provider>);
    const buttons = view.root.findAllByType('button');
    const last = buttons[buttons.length - 1];
    expect(last.props['aria-current']).toBe('page');
    expect(buttons.filter(button => button.props['aria-current'] === 'page')).toHaveLength(1);
    act(() => last.props.onClick());
    expect(open).toHaveBeenCalledWith();
    expect(onManualOpen).toHaveBeenCalledTimes(1);
    view.unmount();
});
