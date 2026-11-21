import React from 'react';
import { Button } from '@chakra-ui/react';
import type { ManualTopic } from '../../content/manual/types';
import { useT } from '../../i18n/useT';
import { useManual } from './ManualContext';

export function ManualLink({ topic }: { topic?: ManualTopic }) {
    const t = useT();
    const manual = useManual();
    return <Button size="sm" variant="ghost" onClick={() => manual.open(topic)} aria-label={topic ? t('manual.guide') : t('manual.title')}>
        {topic ? t('manual.guide') : t('manual.title')}
    </Button>;
}
