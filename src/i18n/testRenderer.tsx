import { renderToStaticMarkup as renderStatic } from 'react-dom/server';
import React, { type ReactElement } from 'react';
import { create as createRenderer, type TestRendererOptions } from 'react-test-renderer';
import { NextIntlClientProvider } from 'next-intl';
import en from '../../messages/en.json';
import zhCN from '../../messages/zh-CN.json';
import zhTW from '../../messages/zh-TW.json';
import type { Locale } from './config';

const catalogs = { en, 'zh-CN': zhCN, 'zh-TW': zhTW };

export function renderToStaticMarkup(element: ReactElement, locale: Locale = 'zh-CN') {
    return renderStatic(<NextIntlClientProvider locale={locale} messages={catalogs[locale]} timeZone="UTC">{element}</NextIntlClientProvider>);
}

// Existing behavioral tests explicitly use their original Chinese copy. Locale
// regression tests can pass another locale without mocking the translation API.
export function create(element: ReactElement, options?: TestRendererOptions, initialLocale: Locale = 'zh-CN') {
    let locale = initialLocale;
    const wrap = (child: ReactElement) => <NextIntlClientProvider locale={locale} messages={catalogs[locale]} timeZone="UTC">{child}</NextIntlClientProvider>;
    const renderer = createRenderer(wrap(element), options);
    const update = renderer.update.bind(renderer);
    renderer.update = (next: ReactElement) => { element = next; update(wrap(next)); };
    return Object.assign(renderer, {
        setLocale(next: Locale) { locale = next; update(wrap(element)); },
    });
}
