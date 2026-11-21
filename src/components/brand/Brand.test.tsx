import React from 'react';
import { readFileSync } from 'node:fs';
import { renderToStaticMarkup as renderHtml } from 'react-dom/server';
import { ChakraProvider } from '@chakra-ui/react';
import { describe, expect, it, vi } from 'vitest';
import sharp from 'sharp';
import { renderToStaticMarkup } from '../../i18n/testRenderer';
import { Brand } from './Brand';
import { SiteIcons } from './SiteIcons';

vi.mock('next/head', () => ({ default: ({ children }: { children: React.ReactNode }) => <>{children}</> }));

describe('统一品牌与站点图标', () => {
    it('品牌图形为装饰，文字提供名称，标题层级可由页头决定', () => {
        const html = renderToStaticMarkup(<ChakraProvider><Brand heading="h1" /></ChakraProvider>, 'en');
        expect(html).toContain('src="/brand/token-lab.svg"');
        expect(html).toContain('alt=""');
        expect(html).toContain('aria-hidden="true"');
        expect(html).toMatch(/<h1[^>]*>Solana Token Lab<\/h1>/);
        expect(html).toContain('Understand accounts');
    });
    it('手册使用相同标志，不引入额外主标题或重复副标题', () => {
        const html = renderToStaticMarkup(<ChakraProvider><Brand subtitle={false} /></ChakraProvider>, 'zh-TW');
        expect(html).toContain('Solana Token Lab');
        expect(html).not.toContain('<h1');
        expect(html).not.toContain('理解帳戶');
    });
    it('声明 SVG、兼容 ICO、PNG 与 Apple Touch 图标', () => {
        const html = renderHtml(<SiteIcons />);
        for (const file of ['favicon.svg', 'favicon.ico', 'favicon-32x32.png', 'apple-touch-icon.png']) expect(html).toContain(`href="/${file}"`);
        expect(html).toContain('image/svg+xml');
    });
    it('生成图标尺寸与 ICO 目录有效，SVG 无外部资源', async () => {
        for (const [file, size] of [['favicon-32x32.png', 32], ['icon-192.png', 192], ['icon-512.png', 512], ['apple-touch-icon.png', 180]] as const) {
            const metadata = await sharp(readFileSync(`public/${file}`)).metadata();
            expect([metadata.width, metadata.height]).toEqual([size, size]);
        }
        const ico = readFileSync('public/favicon.ico');
        expect(ico.readUInt16LE(2)).toBe(1);
        expect(ico.readUInt16LE(4)).toBe(3);
        expect([ico[6], ico[22], ico[38]]).toEqual([16, 32, 48]);
        for (const file of ['public/favicon.svg', 'public/brand/token-lab.svg']) {
            const svg = readFileSync(file, 'utf8');
            expect(svg).toContain('viewBox="0 0 64 64"');
            expect(svg).not.toMatch(/<script|<image|href="https?:/);
        }
    });
});
