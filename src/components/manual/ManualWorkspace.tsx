import Head from 'next/head';
import React, { useEffect, useState } from 'react';
import { Box, Button, Flex, Spinner, Text } from '@chakra-ui/react';
import { useLocale } from 'next-intl';
import { loadManual } from '../../content/manual/load';
import type { ManualChapter } from '../../content/manual/types';
import { useT } from '../../i18n/useT';
import { ManualContent } from './ManualContent';
import { useManual } from './ManualContext';

export default function ManualWorkspace({ returnLabel }: { returnLabel: string }) {
    const t = useT();
    const locale = useLocale();
    const manual = useManual();
    const [data, setData] = useState<{ locale: string; chapters: ManualChapter[] } | null>(null);
    const [failed, setFailed] = useState(false);
    const [revision, setRevision] = useState(0);
    useEffect(() => {
        let current = true;
        setFailed(false);
        void loadManual(locale).then(chapters => { if (current) setData({ locale, chapters }); }).catch(() => { if (current) setFailed(true); });
        return () => { current = false; };
    }, [locale, revision]);
    useEffect(() => {
        if (typeof window === 'undefined' || data?.locale !== locale || !window.location.hash) return;
        const target = document.getElementById(window.location.hash.slice(1));
        target?.scrollIntoView();
    }, [data, locale, manual.topic]);
    return <Box minW={0}>
        <Head><title>{(data?.locale === locale && data.chapters.find(chapter => chapter.id === manual.topic)?.title) || t('manual.title')} · Solana Token Lab</title></Head>
        <Flex justify="space-between" align="center" gap={3} wrap="wrap" mb={6}>
            <Text fontSize="xs" fontWeight="semibold" color="purple.600">{t('manual.title')}</Text>
            <Button variant="outline" size="sm" onClick={manual.close}>← {returnLabel}</Button>
        </Flex>
        {data?.locale === locale ? <ManualContent chapters={data.chapters} topic={manual.topic} onSelect={manual.open} /> : failed ? <Box role="alert"><Text mb={3}>{t('manual.loadFailed')}</Text><Button onClick={() => setRevision(value => value + 1)}>{t('manual.retry')}</Button></Box> : <Flex role="status" align="center" gap={3} py={10}><Spinner size="sm" /><Text>{t('manual.loading')}</Text></Flex>}
    </Box>;
}
