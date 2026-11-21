import React from 'react';
import { act } from 'react-test-renderer';
import { beforeEach, expect, it, vi } from 'vitest';
import { create } from '../../i18n/testRenderer';
import { ManualContext } from './ManualContext';
import ManualWorkspace from './ManualWorkspace';
import type { ManualChapter } from '../../content/manual/types';

const mocks = vi.hoisted(() => ({ load: vi.fn() }));
vi.mock('../../content/manual/load', () => ({ loadManual: mocks.load }));
vi.mock('next/head', () => ({ default: () => null }));
vi.mock('@chakra-ui/react', () => ({ Box: 'div', Button: 'button', Flex: 'section', Spinner: 'span', Text: 'p' }));
vi.mock('./ManualContent', () => ({ ManualContent: ({ chapters }: { chapters: ManualChapter[] }) => <article>{chapters[0]?.title}</article> }));
const chapter = (title: string) => [{ id: 'create', title }] as ManualChapter[];
beforeEach(() => { vi.clearAllMocks(); });

it('切语言隐藏旧译文，忽略迟到加载结果，不混用章节', async () => {
    let resolveEn!: (chapters: ManualChapter[]) => void;
    let resolveTw!: (chapters: ManualChapter[]) => void;
    mocks.load.mockImplementation((locale: string) => new Promise(resolve => { if (locale === 'en') resolveEn = resolve; else resolveTw = resolve; }));
    let view!: ReturnType<typeof create>;
    act(() => { view = create(<ManualWorkspace returnLabel="Return" />, undefined, 'en'); });
    expect(view.root.findByProps({ role: 'status' })).toBeTruthy();
    act(() => view.setLocale('zh-TW'));
    await act(async () => resolveTw(chapter('繁體章節')));
    expect(view.root.findByType('article').children).toEqual(['繁體章節']);
    await act(async () => resolveEn(chapter('English chapter')));
    expect(view.root.findByType('article').children).toEqual(['繁體章節']);
    view.unmount();
});

it('加载失败可以重试，返回入口只关闭手册而不提交操作', async () => {
    mocks.load.mockRejectedValueOnce(new Error('offline')).mockResolvedValueOnce(chapter('恢复后内容'));
    const close = vi.fn();
    let view!: ReturnType<typeof create>;
    await act(async () => { view = create(<ManualContext.Provider value={{ isOpen: true, topic: 'create', open: vi.fn(), close }}><ManualWorkspace returnLabel="Return" /></ManualContext.Provider>); });
    expect(view.root.findByProps({ role: 'alert' })).toBeTruthy();
    await act(async () => view.root.findAllByType('button')[1].props.onClick());
    expect(view.root.findByType('article').children).toEqual(['恢复后内容']);
    act(() => view.root.findAllByType('button')[0].props.onClick());
    expect(close).toHaveBeenCalledTimes(1);
    view.unmount();
});
