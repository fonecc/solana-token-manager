import React from 'react';
import { act } from 'react-test-renderer';
import { createTranslator, type AbstractIntlMessages } from 'next-intl';
import { describe, expect, it } from 'vitest';
import en from '../../messages/en.json';
import zhCN from '../../messages/zh-CN.json';
import zhTW from '../../messages/zh-TW.json';
import { getCurriculum, courseOrder } from '../components/learning/curriculum';
import { AppError, describeError, formatMessage, message, type Translate, type MessageKey } from './message';
import { defaultLocale, isLocale, locales } from './config';
import { useMessageState } from './useT';
import { create } from './testRenderer';

const catalogs = { en, 'zh-CN': zhCN, 'zh-TW': zhTW };
function flatten(value: object, prefix = ''): Record<string, string> {
    return Object.fromEntries(Object.entries(value).flatMap(([key, item]) => {
        const full = prefix ? `${prefix}.${key}` : key;
        return typeof item === 'string' ? [[full, item]] : Object.entries(flatten(item, full));
    }));
}

describe('三语消息与课程模型', () => {
    it('默认英文，拒绝未知语言', () => {
        expect(defaultLocale).toBe('en');
        expect(isLocale('zh-TW')).toBe(true);
        expect(isLocale('fr')).toBe(false);
        expect(isLocale(null)).toBe(false);
    });
    it('三份字典同键、同占位参数，所有 ICU 消息都能格式化', () => {
        const base = flatten(en);
        for (const locale of locales) {
            const catalog = flatten(catalogs[locale]);
            expect(Object.keys(catalog).sort()).toEqual(Object.keys(base).sort());
            const t = createTranslator({ locale, messages: catalogs[locale] as AbstractIntlMessages, onError: error => { throw error; } }) as unknown as Translate;
            for (const [key, value] of Object.entries(catalog)) {
                const names = (text: string) => [...text.matchAll(/\{(\w+)\}/g)].map(match => match[1]).sort();
                expect(names(value), `${locale}:${key}`).toEqual(names(base[key]));
                const values = Object.fromEntries(names(value).map(name => [name, 'example']));
                expect(t(key as MessageKey, values), `${locale}:${key}`).not.toBe('');
            }
        }
    });
    it('翻译不会改变课程顺序和分组 ID', () => {
        const courses = locales.map(locale => getCurriculum(createTranslator({ locale, messages: catalogs[locale] as AbstractIntlMessages }) as unknown as Translate));
        expect(courseOrder).toEqual(['overview', 'create', 'metadata', 'mint', 'assets', 'freeze', 'burn', 'pool', 'liquidity', 'swap']);
        for (const course of courses) {
            expect(course.lessons.map(lesson => [lesson.id, lesson.group])).toEqual(courses[0].lessons.map(lesson => [lesson.id, lesson.group]));
            expect(course.lessons.every(lesson => lesson.concepts.length >= 2 && lesson.checks.length >= 2)).toBe(true);
        }
        expect(courses[0].lessonById.create.shortTitle).toBe('Create token');
        expect(courses[1].lessonById.create.shortTitle).toBe('创建代币');
        expect(courses[2].lessonById.create.shortTitle).toBe('建立代幣');
    });
    it('嵌套自有错误按当前语言格式化，保留外部诊断原文', () => {
        const raw = new Error('RPC 429 / request abc');
        const value = message('transactions.outcomePendingCheckTheOriginalTransactionDoNotResubmit', { v0: describeError(raw), v1: 'public-signature' });
        for (const locale of locales) {
            const t = createTranslator({ locale, messages: catalogs[locale] as AbstractIntlMessages }) as unknown as Translate;
            expect(formatMessage(t, value)).toContain(raw.message);
            expect(formatMessage(t, value)).toContain('public-signature');
        }
        expect(describeError(null)).toBe('');
        expect(describeError(new AppError(value))).toEqual(value);
    });
    it('历史错误切语言后重新显示，不重挂载也不改写输入', () => {
        let setError!: (value: unknown) => void;
        let mounts = 0;
        function Probe() {
            const [error, setter] = useMessageState();
            setError = setter;
            const [input, setInput] = React.useState('0.000000001');
            React.useEffect(() => { mounts++; }, []);
            return <input value={input} onChange={event => setInput(event.target.value)} data-error={error} />;
        }
        let view!: ReturnType<typeof create>;
        act(() => { view = create(<Probe />, undefined, 'en'); });
        act(() => { setError(new AppError(message('tokens.thisWalletHasNoMintAuthority'))); });
        expect(view.root.findByType('input').props['data-error']).toBe('This wallet has no mint authority');
        act(() => { view.setLocale('zh-TW'); });
        expect(view.root.findByType('input').props['data-error']).toBe('目前錢包沒有鑄幣權限');
        expect(view.root.findByType('input').props.value).toBe('0.000000001');
        expect(mounts).toBe(1);
        view.unmount();
    });
});
