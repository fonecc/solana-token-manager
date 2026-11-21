import { create } from '../../i18n/testRenderer';
import { createElement, type ReactNode } from 'react';
import { act, type ReactTestRenderer, type ReactTestInstance } from 'react-test-renderer';
import { describe, expect, it, vi } from 'vitest';
import { CreateTokenView, type CreateTokenViewProps } from './CreateTokenView';

// 展示层单元测试；实际 Chakra 布局与交互另以隔离夹具在浏览器验证。
vi.mock('@chakra-ui/icons', () => Object.fromEntries(['ArrowBackIcon', 'ArrowForwardIcon', 'CheckCircleIcon', 'InfoOutlineIcon', 'RepeatIcon', 'CheckIcon', 'CopyIcon', 'ExternalLinkIcon'].map(name => [name, () => null])));
vi.mock('@chakra-ui/react', async () => {
    const { createElement } = await import('react');
    return {
        ...Object.fromEntries(['Alert', 'AlertIcon', 'Badge', 'Box', 'Button', 'Flex', 'FormControl', 'FormErrorMessage', 'FormHelperText', 'FormLabel', 'Grid', 'Heading', 'HStack', 'NumberInput', 'NumberInputField', 'SimpleGrid', 'Text', 'VStack', 'IconButton', 'Link'].map(name => [name, (props: { children?: ReactNode }) => createElement(`mock-${name.toLowerCase()}`, { ...props, 'data-ui': name }, props.children)])),
        useClipboard: () => ({ hasCopied: false, onCopy: vi.fn() }),
    };
});

const result = { mint: 'mint-address', ata: 'ata-address', signature: 'test-signature', decimals: 9 };
function render(overrides: Partial<CreateTokenViewProps> = {}) {
    const props: CreateTokenViewProps = {
        decimals: '9', onDecimalsChange: vi.fn(), balance: 19.267157628, isRefreshing: false,
        operation: null, walletReady: true, result: null, updates: [], onRefresh: vi.fn(),
        onAirdrop: vi.fn(), onCreate: vi.fn(), onNext: vi.fn(), ...overrides,
    };
    let view: ReactTestRenderer;
    act(() => { view = create(createElement(CreateTokenView, props)); });
    const root = view!.root;
    const text = (node: ReactTestInstance): string => node.children.map(child => typeof child === 'string' ? child : text(child)).join('');
    const button = (label: string) => root.findAllByProps({ 'data-ui': 'Button' }).find(node => text(node) === label)!;
    return { props, root, text: text(root), button };
}

describe('创建代币教学展示', () => {
    it.each([
        ['0', '1 个最小单位', '只能转移整数枚'],
        ['6', '1,000,000 个最小单位', '0.000001 枚'],
        ['9', '1,000,000,000 个最小单位', '0.000000001 枚'],
    ])('%s 位精度给出最小单位与数量区别', (decimals, units, example) => {
        const view = render({ decimals });
        expect(view.text).toContain(units);
        expect(view.text).toContain(example);
        expect(view.text).toContain('不代表发行数量');
        expect(view.text).toContain('供应量为 0');
        expect(view.text).toContain('精度不能再修改');
    });
    it.each(['', '10', '1.5'])('非法精度 %s 阻止创建并显示错误', decimals => {
        const view = render({ decimals });
        expect(view.text).toContain('请输入 0–9 的整数');
        expect(view.button('创建 Mint 与 ATA').props.isDisabled).toBe(true);
    });
    it('零精度的前导零不会导致示例计算错误', () => {
        expect(render({ decimals: '00' }).text).toContain('只能转移整数枚');
    });
    it('未读取余额不冒充零余额，读取失败可刷新', () => {
        const view = render({ balance: null, balanceError: '余额读取失败' });
        expect(view.text).toContain('—');
        expect(view.text).toContain('请刷新重试');
        act(() => { view.button('刷新').props.onClick(); });
        expect(view.props.onRefresh).toHaveBeenCalledOnce();
        expect(render().text).toContain('19.2672');
    });
    it('区分创建、空投与刷新忙碌态', () => {
        const creating = render({ operation: 'create' });
        expect(creating.button('创建 Mint 与 ATA').props.isLoading).toBe(true);
        expect(creating.button('获取测试 SOL').props.isLoading).toBe(false);
        const airdrop = render({ operation: 'airdrop' });
        expect(airdrop.button('获取测试 SOL').props.isLoading).toBe(true);
        expect(airdrop.button('创建 Mint 与 ATA').props.isDisabled).toBe(true);
        expect(render({ isRefreshing: true }).button('创建 Mint 与 ATA').props.isDisabled).toBe(true);
    });
    it('成功后说明账户用途，下一步传递对应 Mint，不直接提交交易', () => {
        const view = render({ result });
        expect(view.text).toContain('Mint 地址');
        expect(view.text).toContain('ATA 地址');
        expect(view.text).toContain('再次创建会生成新的 Mint');
        act(() => { view.button('下一步：设置名称与符号').props.onClick(); });
        expect(view.props.onNext).toHaveBeenCalledWith('metadata', result);
        act(() => { view.button('前往增发代币').props.onClick(); });
        expect(view.props.onNext).toHaveBeenCalledWith('mint', result);
        expect(view.props.onCreate).not.toHaveBeenCalled();
        // 签名由共享反馈负责，结果区不再重复输出。
        expect(view.text).not.toContain(result.signature);
    });
});
