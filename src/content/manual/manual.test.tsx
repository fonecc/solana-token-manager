import React from 'react';
import { ChakraProvider } from '@chakra-ui/react';
import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from '../../i18n/testRenderer';
import { locales } from '../../i18n/config';
import { loadManual } from './load';
import { manualSources, manualTopics } from './types';
import { ManualContent } from '../../components/manual/ManualContent';
import config from '../../../next.config';

describe('三语站内操作手册', () => {
    it.each(locales)('%s 覆盖全部功能、编号步骤、验证和来源', async locale => {
        const chapters = await loadManual(locale);
        expect(chapters.map(chapter => chapter.id)).toEqual([...manualTopics]);
        expect(chapters.reduce((count, chapter) => count + chapter.steps.length, 0)).toBe(57);
        for (const chapter of chapters) {
            expect(chapter.title.length).toBeGreaterThanOrEqual(3);
            expect(chapter.summary.length).toBeGreaterThan(10);
            expect(chapter.steps.length).toBeGreaterThanOrEqual(4);
            expect(chapter.steps.every(step => step.title.trim() && step.text.trim().length > 10)).toBe(true);
            for (const key of ['prerequisites', 'review', 'verify', 'troubleshooting', 'terms', 'sources'] as const) expect(chapter[key].length, chapter.id + ':' + key).toBeGreaterThan(0);
            for (const source of chapter.sources) expect(manualSources[source].url).toMatch(/^https:\/\//);
        }
    });
    it('旧独立手册 URL 重定向至同页工作区，保持 Next locale 路由', async () => {
        expect(await config.redirects!()).toEqual([
            { source: '/manual', destination: '/?manual=contents', permanent: false },
            { source: '/manual/:topic', destination: '/?manual=:topic', permanent: false },
        ]);
        expect(config.i18n!.locales).toEqual([...locales]);
    });
    it.each(locales)('%s 内容无需钱包即可展示，章节锚点、来源和切章控件可读', async locale => {
        const chapters = await loadManual(locale);
        const chapter = chapters.find(item => item.id === 'create')!;
        const html = renderToStaticMarkup(<ChakraProvider><ManualContent chapters={chapters} topic="create" onSelect={() => undefined} /></ChakraProvider>, locale);
        expect(html).toContain(chapter.title);
        for (const id of ['prerequisites', 'steps', 'review', 'verify', 'troubleshooting', 'terms', 'sources', 'step-1']) expect(html).toContain(`id="${id}"`);
        expect(html).toContain(manualSources.ata.url);
        expect(html).toContain('value="metadata"');
        expect(html).not.toContain('Connect wallet');
        expect(html).not.toContain('href="/manual/');
    });
});
