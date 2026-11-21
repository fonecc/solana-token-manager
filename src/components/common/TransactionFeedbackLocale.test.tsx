import React from 'react';
import { act } from 'react-test-renderer';
import { expect, it, vi } from 'vitest';
import { create } from '../../i18n/testRenderer';
import { message } from '../../i18n/message';
import { TransactionFeedback } from './TransactionFeedback';
import type { TransactionUpdate } from '../../lib/solana/transactions';

vi.mock('@chakra-ui/react', () => ({ Box: 'div', Text: 'p', VStack: 'section', Alert: 'aside', AlertIcon: 'span' }));
vi.mock('./AccountAddress', () => ({ AccountAddress: ({ value }: { value: string }) => <a href={`https://explorer.solana.com/tx/${value}?cluster=devnet`}>{value}</a> }));

it('已有待确认记录切语言重新显示消息且保留原签名', () => {
    const signature = '5'.repeat(88);
    const updates: TransactionUpdate[] = [{ stage: 'pending', signature, message: message('transactions.step', { current: 2, total: 3 }) }];
    const view = create(<TransactionFeedback updates={updates} />, undefined, 'en');
    const text = () => JSON.stringify(view.toJSON());
    expect(text()).toContain('Step 2/3');
    for (const locale of ['zh-TW', 'zh-CN', 'en'] as const) {
        act(() => view.setLocale(locale));
        expect(text()).toContain(signature);
        expect(view.root.findByType(TransactionFeedback).props.updates).toBe(updates);
        expect(updates[0].stage).toBe('pending');
        if (locale !== 'en') expect(text()).not.toContain('Step 2/3');
    }
    view.unmount();
});
