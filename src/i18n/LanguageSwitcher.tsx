import React from 'react';
import { FormControl, FormLabel, Select, useToast } from '@chakra-ui/react';
import { useRouter } from 'next/router';
import { useId, useState } from 'react';
import { isLocale, languageNames, locales } from './config';
import { useT } from './useT';

export function LanguageSwitcher() {
    const router = useRouter();
    const t = useT();
    const id = useId();
    const toast = useToast();
    const [changing, setChanging] = useState(false);
    return <FormControl w="auto" minW="130px">
        <FormLabel htmlFor={id} srOnly>{t('site.language')}</FormLabel>
        <Select id={id} aria-label={t('site.language')} size="sm" borderRadius="lg" value={router.locale || 'en'} isDisabled={changing}
            onChange={async event => {
                const locale = event.target.value;
                if (!isLocale(locale) || locale === router.locale) return;
                setChanging(true);
                try {
                    const asPath = typeof window === 'undefined' ? router.asPath : `${router.asPath.split('#')[0]}${window.location.hash}`;
                    await router.replace({ pathname: router.pathname, query: router.query }, asPath, { locale, scroll: false });
                } catch {
                    toast({ title: t('site.languageChangeFailed'), status: 'error' });
                } finally { setChanging(false); }
            }}>
            {locales.map(locale => <option key={locale} value={locale} lang={locale}>{languageNames[locale]}</option>)}
        </Select>
    </FormControl>;
}
