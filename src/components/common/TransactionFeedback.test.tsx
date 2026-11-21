import { create } from 'react-test-renderer';
import { createElement } from 'react';
import { renderToStaticMarkup } from '../../i18n/testRenderer';
import { ChakraProvider } from '@chakra-ui/react';
import { describe, expect, it } from 'vitest';
import type { TransactionUpdate } from '../../lib/solana/transactions';
import { TransactionFeedback, useTransactionFeedback } from './TransactionFeedback';
import { act} from 'react-test-renderer';

const signature = '5'.repeat(88);
const render = (updates: TransactionUpdate[]) => renderToStaticMarkup(createElement(ChakraProvider, null, createElement(TransactionFeedback, { updates })));

describe('交易记录展示', () => {
    it('同一签名仅展示一次，链接和 title 保留完整值', () => {
        const html = render([{ stage: 'submitted', signature }, { stage: 'confirming', signature }, { stage: 'success', signature }]);
        expect(html.match(/href="https:\/\/explorer.solana.com\/tx\//g)).toHaveLength(1);
        expect(html).toContain(signature);
        expect(html).toContain(`${signature.slice(0, 12)}…${signature.slice(-12)}`);
        expect(html).toContain('cluster=devnet');
        expect(html).toContain('链上确认成功');
        expect(html).toContain('复制 交易记录');
    });
    it('多步骤保留全部去重记录', () => {
        const html = render([{ stage: 'success', signature }, { stage: 'failed', signature: '6'.repeat(88), message: '第二步失败' }]);
        expect(html.match(/href="https:\/\/explorer.solana.com\/tx\//g)).toHaveLength(2);
        expect(html).toContain('交易记录 1');
        expect(html).toContain('交易记录 2');
        expect(html).toContain('第二步失败');
    });
    it('提交不当作成功，待确认时保留防重复提示', () => {
        expect(render([{ stage: 'submitted', signature }])).not.toContain('链上确认成功');
        const html = render([{ stage: 'pending', signature, message: 'RPC 超时' }]);
        expect(html).toContain('结果待确认');
        expect(html).toContain('不要重复签名');
        expect(html).toContain('RPC 超时');
        expect(html).toContain('aria-live="polite"');
    });
    it('没有记录时不显示反馈块', () => {
        expect(renderToStaticMarkup(createElement(TransactionFeedback, { updates: [] }))).toBe('');
    });
});

it('长流程保留每个签名的最新状态，不因超过 30 条事件丢记录', () => {
    let feedback!: ReturnType<typeof useTransactionFeedback>;
    function Probe() { feedback = useTransactionFeedback(); return null; }
    const view = create(createElement(Probe));
    act(() => {
        for (let i = 0; i < 45; i++) {
            feedback.onUpdate({ stage: 'awaiting-signature' });
            feedback.onUpdate({ stage: 'submitted', signature: `signature-${i}` });
            feedback.onUpdate({ stage: 'success', signature: `signature-${i}` });
        }
        feedback.onUpdate({ stage: 'pending', signature: 'signature-44' });
    });
    expect(feedback.updates).toHaveLength(45);
    expect(feedback.updates.find(update => update.signature === 'signature-0')?.stage).toBe('success');
    expect(feedback.updates[feedback.updates.length - 1]?.stage).toBe('pending');
    expect(render(feedback.updates)).toContain('signature-0');
    view.unmount();
});
