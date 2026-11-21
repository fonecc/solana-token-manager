import { useCallback, useState } from 'react';
import { useTranslations } from 'next-intl';
import { describeError, formatMessage, type MessageValue, type Translate } from './message';

export function useT(): Translate {
    const translations = useTranslations();
    return useCallback((key, values) => translations(key, values), [translations]);
}
export function useErrorMessage() {
    const t = useT();
    return useCallback((error: unknown) => formatMessage(t, describeError(error)), [t]);
}
export function useMessageState(initial: MessageValue = '') {
    const [value, setValue] = useState<MessageValue>(initial);
    const t = useT();
    const setMessage = useCallback((next: unknown) => setValue(describeError(next)), []);
    return [formatMessage(t, value), setMessage, value] as const;
}
