import React, { createContext, useCallback, useContext, useMemo, type ReactNode } from 'react';
import { useRouter } from 'next/router';
import { useToast } from '@chakra-ui/react';
import { manualTopics, type ManualTopic } from '../../content/manual/types';
import { useT } from '../../i18n/useT';

interface ManualNavigation {
    isOpen: boolean;
    topic?: ManualTopic;
    open: (topic?: ManualTopic) => void;
    close: () => void;
}
export const ManualContext = createContext<ManualNavigation>({ isOpen: false, open: () => undefined, close: () => undefined });
export const useManual = () => useContext(ManualContext);

export function ManualProvider({ children }: { children: ReactNode }) {
    const router = useRouter();
    const toast = useToast();
    const t = useT();
    const value = router.query.manual;
    const isOpen = typeof value === 'string';
    const topic = manualTopics.includes(value as ManualTopic) ? value as ManualTopic : undefined;
    const navigate = useCallback((next?: ManualTopic | 'contents') => {
        const query = { ...router.query };
        if (next) query.manual = next;
        else delete query.manual;
        void router.push({ pathname: '/', query }, undefined, { shallow: true, scroll: false }).then(() => {
            if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'instant' });
        }).catch(() => toast({ title: t('manual.navigationFailed'), status: 'error' }));
    }, [router, t, toast]);
    const open = useCallback((next?: ManualTopic) => navigate(next || 'contents'), [navigate]);
    const close = useCallback(() => { if (isOpen) navigate(); }, [isOpen, navigate]);
    const context = useMemo(() => ({ isOpen, topic, open, close }), [isOpen, topic, open, close]);
    return <ManualContext.Provider value={context}>{children}</ManualContext.Provider>;
}
