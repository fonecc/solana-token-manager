import React from 'react';
import { ChakraProvider } from '@chakra-ui/react';
import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from '../../i18n/testRenderer';
import { CreatorLinks } from './CreatorLinks';
import { SiteFooter } from './SiteFooter';

const website = 'https://fone.cc';
const repository = 'https://github.com/fonecc/solana-token-manager';

function expectCreatorLinks(html: string) {
    expect(html).toContain('0xF1');
    expect(html).not.toContain('<h1');
    const links = html.match(/<a\b[^>]*>/g) || [];
    expect(links).toHaveLength(2);
    for (const href of [website, repository]) {
        const link = links.find(value => value.includes(`href="${href}"`));
        expect(link).toBeTruthy();
        expect(link).toContain('target="_blank"');
        expect(link).toContain('rel="noopener noreferrer"');
        expect(link).toMatch(/aria-label="[^"]+"/);
    }
    expect(html).toContain('Star');
    expect(html).toContain('fone.cc');
}

describe('作者品牌与开源入口', () => {
    for (const locale of ['en', 'zh-CN', 'zh-TW'] as const) {
        it(`${locale} 首页署名和引导文案使用真实链接，不添加额外主标题`, () => {
            const html = renderToStaticMarkup(<ChakraProvider><CreatorLinks /></ChakraProvider>, locale);
            expectCreatorLinks(html);
            expect(html).toContain(locale === 'en' ? 'hands-on practice' : locale === 'zh-CN' ? '在实操中掌握' : '在實作中掌握');
        });
        it(`${locale} 共用页尾保留品牌口号和作者入口，不重复长篇邀请`, () => {
            const html = renderToStaticMarkup(<ChakraProvider><SiteFooter /></ChakraProvider>, locale);
            expectCreatorLinks(html);
            expect(html).toContain('<footer');
            expect(html).toContain('Solana Token Lab');
            expect(html).not.toContain('GitHub Star，');
            expect(html).not.toContain('hands-on practice');
        });
    }
});
