import { createElement } from 'react';
import { renderToStaticMarkup } from '../../i18n/testRenderer';
import { ChakraProvider } from '@chakra-ui/react';
import { describe, expect, it, vi } from 'vitest';
import { WelcomePanel } from './WelcomePanel';

vi.mock('../WalletButton', () => ({ WalletButton: ({ label }: { label: string }) => createElement('button', null, label) }));

describe('未连接钱包欢迎区', () => {
    it('显示真实学习阶段、连接入口及安全边界', () => {
        const html = renderToStaticMarkup(createElement(ChakraProvider, null, createElement(WelcomePanel)));
        for (const text of ['创建你的第一枚代币', '掌握资产与权限', '探索 DeFi 进阶', '连接钱包，开始实验', '应用不需要你的私钥', '支持的钱包（如 Phantom）', '不可逆']) {
            expect(html).toContain(text);
        }
        expect(html).toContain('href="#learning-path"');
        expect(html).toContain('id="learning-path"');
    });
});
