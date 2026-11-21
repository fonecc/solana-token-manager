import { create } from '../../i18n/testRenderer';
import { createElement, type ReactNode } from 'react';
import { act, type ReactTestInstance, type ReactTestRenderer } from 'react-test-renderer';
import { describe, expect, it, vi } from 'vitest';
import { AmountInputs, isPositiveAmount } from './AmountInputs';
import { MarketSetup, type MarketSetupProps } from './MarketSetup';
import { PoolConfirmation, type PoolConfirmationProps } from './PoolConfirmation';
import { MarketDetails } from './MarketDetails';
import { PoolDetails } from './PoolDetails';
import { PoolGuide } from './PoolGuide';
import { LearningContext } from '../learning/LearningContext';

// 单元测试验证语义和回调；真实 Chakra 布局另外用浏览器夹具检查。
vi.mock('@chakra-ui/icons', () => Object.fromEntries(['ArrowBackIcon', 'ArrowForwardIcon', 'CheckCircleIcon', 'CheckIcon', 'CopyIcon', 'ExternalLinkIcon'].map(name => [name, () => null])));
vi.mock('@chakra-ui/react', async () => {
    const { createElement } = await import('react');
    return {
        ...Object.fromEntries(['Accordion', 'AccordionButton', 'AccordionIcon', 'AccordionItem', 'AccordionPanel', 'Alert', 'AlertIcon', 'Badge', 'Box', 'Button', 'Flex', 'FormControl', 'FormErrorMessage', 'FormHelperText', 'FormLabel', 'Grid', 'Heading', 'HStack', 'Input', 'SimpleGrid', 'Text', 'VStack', 'IconButton', 'Link'].map(name => [name, (props: { children?: ReactNode }) => createElement(`mock-${name.toLowerCase()}`, { ...props, 'data-ui': name }, props.children)])),
        useClipboard: () => ({ hasCopied: false, onCopy: vi.fn() }),
    };
});

function render(element: ReturnType<typeof createElement>) {
    let view: ReactTestRenderer;
    act(() => { view = create(element); });
    const root = view!.root;
    const text = (node: ReactTestInstance): string => node.children.map(child => typeof child === 'string' ? child : text(child)).join('');
    return { root, text: text(root), button: (label: string) => root.findAllByProps({ 'data-ui': 'Button' }).find(node => text(node) === label)! };
}
const market = { marketId: 'market-address', baseMint: 'base-mint', quoteMint: 'wsol-mint', baseVault: 'market-base-vault', quoteVault: 'market-quote-vault' };
const pool = { marketId: market.marketId, poolId: 'pool-address', lpMint: 'lp-mint', baseVault: 'pool-base-vault', quoteVault: 'pool-quote-vault', baseAmount: '100', quoteAmount: '0.1' };
const updates = [{ stage: 'pending' as const, message: '原交易待确认', signature: 'original-signature' }];
function setup(overrides: Partial<MarketSetupProps> = {}) {
    const props: MarketSetupProps = { ready: false, operation: null, canCreate: true, canLoad: true, manualId: market.marketId, error: '', updates: [], onManualIdChange: vi.fn(), onCreate: vi.fn(), onLoad: vi.fn(), ...overrides };
    return { ...render(createElement(MarketSetup, props)), props };
}
function confirmation(overrides: Partial<PoolConfirmationProps> = {}) {
    const props: PoolConfirmationProps = { baseAmount: '100', quoteAmount: '0.1', busy: false, walletReady: true, done: false, error: '', updates: [], onCreate: vi.fn(), ...overrides };
    return { ...render(createElement(PoolConfirmation, props)), props };
}

describe('建池全流程教学展示', () => {
    it.each([['market', '创建 / 加载市场'], ['deposit', '投入资产并建池'], ['done', '核对链上结果']] as const)('阶段 %s 不混淆市场与池', (stage, label) => {
        const view = render(createElement(PoolGuide, { tokenMint: market.baseMint, stage }, null));
        const current = view.root.findAll(node => node.props['aria-current'] === 'step' && node.props['data-ui'] === 'HStack');
        expect(current).toHaveLength(1);
        expect(current[0].findAllByProps({ 'data-ui': 'Text' })[0].children).toEqual([label]);
        expect(view.text).toContain(label);
        if (stage !== 'done') {
            expect(view.text).toContain('创建 Mint 不会自动产生余额');
            expect(view.text).toContain('本页不提供完整费用预估');
        } else {
            expect(view.text).not.toContain('创建 Mint 不会自动产生余额');
        }
    });
    it('未选择 Mint 时说明入口，不生成空地址链接', () => {
        const view = render(createElement(PoolGuide, { tokenMint: '', stage: 'market' }));
        expect(view.text).toContain('尚未选择代币');
        expect(view.root.findAllByProps({ 'data-ui': 'Link' })).toHaveLength(0);
    });
    it('创建和只读加载分开，解释地址预生成、固定参数与部分失败', () => {
        const view = setup();
        expect(view.text).toContain('有地址不代表市场已创建成功');
        expect(view.text).toContain('加载只读取和校验');
        expect(view.text).toContain('不是池的初始价格');
        act(() => { view.button('校验并加载已有市场').props.onClick(); });
        expect(view.props.onLoad).toHaveBeenCalledOnce();
        expect(view.props.onCreate).not.toHaveBeenCalled();
    });
    it('区分创建和加载忙碌态，错误和原签名持续可见', () => {
        const view = setup({ operation: 'load', error: 'RPC 失败', updates });
        expect(view.button('校验并加载已有市场').props.isLoading).toBe(true);
        expect(view.button('创建新的 OpenBook 市场').props.isLoading).toBe(false);
        expect(view.button('创建新的 OpenBook 市场').props.isDisabled).toBe(true);
        expect(view.text).toContain('RPC 失败');
        expect(view.text).toContain('不要重复签名');
    });
    it('市场就绪后隐藏创建操作但保留原交易链接', () => {
        const view = setup({ ready: true, updates });
        expect(view.root.findAllByProps({ 'data-ui': 'Button' })).toHaveLength(0);
        expect(view.root.findAllByProps({ href: 'https://explorer.solana.com/tx/original-signature?cluster=devnet' }).length).toBeGreaterThan(0);
    });
    it('市场结果只讲市场，不含 Pool ID 和 LP', () => {
        const view = render(createElement(MarketDetails, { details: market }));
        expect(view.text).toContain('现在还没有完成建池');
        expect(view.text).toContain('市场基础代币金库');
        expect(view.text).not.toContain('LP Mint');
        expect(render(createElement(MarketDetails, { details: market, poolCreated: true })).text).not.toContain('现在还没有完成建池');
    });
    it('输入保留多位小数，不用 NumberInput 静默舍入，并支持忙碌禁用', () => {
        const onChange = vi.fn();
        const view = render(createElement(AmountInputs, { baseAmount: '0.000001', quoteAmount: '0.000000001', onBaseAmountChange: onChange, onQuoteAmountChange: vi.fn(), isDisabled: true }));
        const input = view.root.findAllByProps({ 'data-ui': 'Input' })[0];
        expect(input.props.value).toBe('0.000001');
        expect(input.props.isDisabled).toBe(true);
        expect(input.props.precision).toBeUndefined();
        act(() => { input.props.onChange({ target: { value: '123.123456' } }); });
        expect(onChange).toHaveBeenCalledWith('123.123456');
        expect(view.text).toContain('不是当前输入的动态报价');
        expect(view.text).toContain('无需先手动包装');
    });
    it('非法数量禁止提交，最终精度与余额仍由交易层校验', () => {
        for (const amount of ['', '0', '-1', '1e3', '1.']) {
            expect(isPositiveAmount(amount)).toBe(false);
            expect(confirmation({ baseAmount: amount }).button('确认投入并创建流动性池').props.isDisabled).toBe(true);
        }
        expect(isPositiveAmount('0.000000001')).toBe(true);
        expect(confirmation({ busy: true }).button('确认投入并创建流动性池').props.isDisabled).toBe(true);
        expect(confirmation({ walletReady: false }).button('确认投入并创建流动性池').props.isDisabled).toBe(true);
    });
    it('确认区复述实际数量，失败时保留反馈且不自动重试', () => {
        const view = confirmation({ baseAmount: '2.123456', quoteAmount: '0.002', error: '余额不足', updates });
        expect(view.text).toContain('2.123456 枚基础代币 + 0.002 SOL');
        expect(view.text).toContain('余额不足');
        expect(view.text).toContain('市场不会因此被撤销');
        expect(view.props.onCreate).not.toHaveBeenCalled();
        act(() => { view.button('确认投入并创建流动性池').props.onClick(); });
        expect(view.props.onCreate).toHaveBeenCalledOnce();
    });
    it('池完成后只保留交易记录，不再出现可重复提交的按钮', () => {
        const view = confirmation({ done: true, updates });
        expect(view.root.findAllByProps({ 'data-ui': 'Button' })).toHaveLength(0);
        expect(view.text).toContain('交易记录');
    });
    it('成功说明初始投入不是实时储备，LP Mint不是实际到账数量', () => {
        const view = render(createElement(PoolDetails, { details: pool }));
        expect(view.text).toContain('不是实时池储备');
        expect(view.text).toContain('不是你的 LP 账户地址');
        expect(view.text).toContain('检查实际收到的 LP 数量');
        expect(view.text).toContain('没有移除流动性功能');
        expect(view.text).not.toContain('market-address');
        expect(view.root.findAllByProps({ href: 'https://explorer.solana.com/address/pool-address?cluster=devnet' }).length).toBeGreaterThan(0);
    });
});

it('下一步传真实 Pool ID 和该次基础 Mint，而非 Market ID 或 LP Mint', () => {
    const navigate = vi.fn();
    const view = render(createElement(LearningContext.Provider, { value: { selectedMint: 'unrelated-mint', navigate } }, createElement(PoolDetails, { details: pool, tokenMint: market.baseMint })));
    act(() => { view.button('带此 Pool ID 前往增加流动性').props.onClick(); });
    expect(navigate).toHaveBeenCalledWith('liquidity', market.baseMint, { poolId: pool.poolId });
    expect(view.text).toContain('不自动投入或签名');
});
