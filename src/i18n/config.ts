export const locales = ['en', 'zh-CN', 'zh-TW'] as const;
export type Locale = typeof locales[number];
export const defaultLocale: Locale = 'en';
export const languageNames: Record<Locale, string> = { en: 'English', 'zh-CN': '简体中文', 'zh-TW': '繁體中文' };
export function isLocale(value: unknown): value is Locale {
    return typeof value === 'string' && locales.includes(value as Locale);
}
export async function loadMessages(locale: unknown) {
    const selected = isLocale(locale) ? locale : defaultLocale;
    const loaders = {
        en: () => import('../../messages/en.json'),
        'zh-CN': () => import('../../messages/zh-CN.json'),
        'zh-TW': () => import('../../messages/zh-TW.json'),
    };
    return (await loaders[selected]()).default;
}
