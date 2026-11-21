import { defaultLocale, isLocale } from '../../i18n/config';
import type { ManualChapter } from './types';

export async function loadManual(locale: unknown): Promise<ManualChapter[]> {
    const selected = isLocale(locale) ? locale : defaultLocale;
    const loaders = {
        en: () => import('./en.json'),
        'zh-CN': () => import('./zh-CN.json'),
        'zh-TW': () => import('./zh-TW.json'),
    };
    return (await loaders[selected]()).default as ManualChapter[];
}
