import { create } from '../../i18n/testRenderer';
import React, { type ReactNode } from 'react';
import { act, type ReactTestInstance } from 'react-test-renderer';
import { describe, expect, it, vi } from 'vitest';
import { MetadataView, type MetadataViewProps } from '../TokenMetadata/MetadataView';
import { FreezeTokenView, type FreezeTokenViewProps, type TargetState } from '../FreezeToken/FreezeTokenView';
import { BurnTokenView, canBurnAmount, type BurnTokenViewProps } from '../BurnToken/BurnTokenView';
import { MintTokenView, type MintTokenViewProps } from '../MintToken/MintTokenView';
import { LiquidityView, type LiquidityViewProps } from '../AddLiquidity/LiquidityView';
import { SwapConfirmModal } from '../TokenSwap/SwapConfirmModal';

vi.mock('@chakra-ui/icons', () => Object.fromEntries(['ArrowBackIcon', 'ArrowForwardIcon', 'CheckIcon', 'CopyIcon', 'ExternalLinkIcon'].map(name => [name, () => null])));
vi.mock('@chakra-ui/react', async () => {
    const { createElement, forwardRef } = await import('react');
    const names = ['Alert', 'AlertIcon', 'AlertDialog', 'AlertDialogBody', 'AlertDialogContent', 'AlertDialogFooter', 'AlertDialogHeader', 'AlertDialogOverlay', 'Badge', 'Box', 'Button', 'Checkbox', 'Flex', 'FormControl', 'FormErrorMessage', 'FormHelperText', 'FormLabel', 'Grid', 'Heading', 'HStack', 'Input', 'Text', 'VStack', 'IconButton', 'Link', 'Modal', 'ModalBody', 'ModalCloseButton', 'ModalContent', 'ModalFooter', 'ModalHeader', 'ModalOverlay'];
    return {
        ...Object.fromEntries(names.map(name => [name, forwardRef((props: { children?: ReactNode }, ref) => createElement(`mock-${name.toLowerCase()}`, { ...props, ref, 'data-ui': name }, props.children))])),
        useClipboard: () => ({ hasCopied: false, onCopy: vi.fn() }),
    };
});
const text = (node: ReactTestInstance): string => node.children.map(child => typeof child === 'string' ? child : text(child)).join('');
function render(element: React.ReactElement) {
    const view = create(element);
    return { view, root: view.root, text: () => text(view.root), button: (label: string) => view.root.findAllByProps({ 'data-ui': 'Button' }).find(node => text(node) === label)! };
}
const metadata = (): MetadataViewProps => ({ mint: 'So11111111111111111111111111111111111111112', name: '学习币', symbol: 'LEARN', uri: '', mode: 0, allowUpdate: true, busy: false, error: '', result: null, updates: [], onMintChange: vi.fn(), onNameChange: vi.fn(), onSymbolChange: vi.fn(), onUriChange: vi.fn(), onModeChange: vi.fn(), onAllowUpdateChange: vi.fn(), onSubmit: vi.fn() });
const freeze = (targetState: TargetState = 'idle'): FreezeTokenViewProps => ({ mint: 'mint', target: 'owner', mintLoading: false, authority: null, targetState, targetAta: '', operation: null, error: '', refreshWarning: '', updates: [], onMintChange: vi.fn(), onTargetChange: vi.fn(), onLoadMint: vi.fn(), onCheckTarget: vi.fn(), onSubmit: vi.fn() });
const burn = (): BurnTokenViewProps => ({ mint: 'mint', amount: '0.000000001', info: { balance: '1', decimals: 9, frozen: false, ata: 'ata' }, loading: false, busy: false, error: '', warning: '', result: null, updates: [], onMintChange: vi.fn(), onAmountChange: vi.fn(), onLoad: vi.fn(), onSubmit: vi.fn() });

describe('全站教学状态与不可逆操作', () => {
    it('元数据按 UTF-8 计数，并说明 JSON 不是上传功能', () => {
        const view = render(<MetadataView {...metadata()} />);
        expect(view.text()).toContain('9 / 32 字节');
        expect(view.text()).toContain('不是图片本身的地址');
        expect(view.text()).toContain('本应用不上传文件');
        expect(view.root.findByProps({ id: 'metadata-uri' }).props.value).toBe('');
    });
    it('永久锁定先确认，不会在第一次点击时直接提交', () => {
        const props = { ...metadata(), allowUpdate: false };
        const view = render(<MetadataView {...props} />);
        act(() => { view.button('确认创建元数据').props.onClick(); });
        expect(props.onSubmit).not.toHaveBeenCalled();
        expect(view.root.findByProps({ 'data-ui': 'AlertDialog' }).props.isOpen).toBe(true);
        act(() => { view.button('确认永久锁定并提交').props.onClick(); });
        expect(props.onSubmit).toHaveBeenCalledOnce();
    });
    it('允许后续修改时按正常流程提交，忙碌时表单语义禁用', () => {
        const props = metadata();
        const view = render(<MetadataView {...props} />);
        act(() => { view.button('确认创建元数据').props.onClick(); });
        expect(props.onSubmit).toHaveBeenCalledOnce();
        act(() => { view.view.update(<MetadataView {...props} busy />); });
        expect(view.root.findByProps({ as: 'fieldset' }).props.disabled).toBe(true);
    });
    it('未读取权限、未检查目标，不冒充无权限或账户不存在', () => {
        const view = render(<FreezeTokenView {...freeze()} />);
        expect(view.text()).toContain('尚未读取，不能判断');
        expect(view.text()).toContain('尚未检查目标 ATA');
        expect(view.text()).not.toContain('目标 ATA 不存在');
        expect(view.text()).not.toContain('当前钱包没有冻结权限');
        expect(view.button('冻结这个 ATA').props.isDisabled).toBe(true);
    });
    it.each([['missing', true, true], ['active', false, true], ['frozen', true, false], ['error', true, true]] as const)('目标 %s 的冻结/解冻按钮符合真实状态', (state, freezeDisabled, thawDisabled) => {
        const view = render(<FreezeTokenView {...freeze(state)} authority />);
        expect(view.button('冻结这个 ATA').props.isDisabled).toBe(freezeDisabled);
        expect(view.button('解冻这个 ATA').props.isDisabled).toBe(thawDisabled);
    });
    it('冻结有目标摘要的二次确认；解冻回调方向正确', () => {
        const props = { ...freeze('active'), authority: true };
        const view = render(<FreezeTokenView {...props} />);
        act(() => { view.button('冻结这个 ATA').props.onClick(); });
        expect(props.onSubmit).not.toHaveBeenCalled();
        act(() => { view.button('确认冻结并请求签名').props.onClick(); });
        expect(props.onSubmit).toHaveBeenCalledWith(false);
        act(() => { view.view.update(<FreezeTokenView {...props} targetState="frozen" />); });
        act(() => { view.button('解冻这个 ATA').props.onClick(); });
        expect(props.onSubmit).toHaveBeenCalledWith(true);
    });
    it('销毁精确比较余额，拒绝零、超精度、超余额和冻结账户', () => {
        const info = { balance: '18446744073.709551615', decimals: 9, frozen: false, ata: 'ata' };
        expect(canBurnAmount('18446744073.709551615', info)).toBe(true);
        expect(canBurnAmount('18446744073.709551615', { ...info, balance: '18446744073.709551614' })).toBe(false);
        for (const value of ['0', '-1', '1e3', '0.0000000001']) expect(canBurnAmount(value, info)).toBe(false);
        expect(canBurnAmount('1', { ...info, frozen: true })).toBe(false);
        expect(canBurnAmount('1', null)).toBe(false);
    });
    it('销毁先核对再提交，不舍入输入；已确认与刷新失败同时可见', () => {
        const props = burn();
        const view = render(<BurnTokenView {...props} />);
        expect(view.root.findByProps({ id: 'burn-amount' }).props.value).toBe('0.000000001');
        act(() => { view.button('检查并确认销毁').props.onClick(); });
        expect(props.onSubmit).not.toHaveBeenCalled();
        act(() => { view.button('确认永久销毁并签名').props.onClick(); });
        expect(props.onSubmit).toHaveBeenCalledOnce();
        act(() => { view.view.update(<BurnTokenView {...props} info={null} result={{ mint: 'mint', amount: '0.000000001' }} warning="余额刷新失败，不要重复提交" />); });
        expect(view.text()).toContain('销毁交易已确认');
        expect(view.text()).toContain('余额刷新失败');
    });
    it('增发数量是新增量，接收留空默认自己，保留原样字符串', () => {
        const props: MintTokenViewProps = { mint: 'So11111111111111111111111111111111111111112', recipient: '', amount: '123.000001', walletAddress: 'wallet', busy: false, error: '', updates: [], result: null, onMintChange: vi.fn(), onRecipientChange: vi.fn(), onAmountChange: vi.fn(), onSubmit: vi.fn() };
        const view = render(<MintTokenView {...props} />);
        expect(view.text()).toContain('不是');
        expect(view.root.findByProps({ id: 'mint-token-amount' }).props.value).toBe('123.000001');
        expect(view.text()).toContain('当前钱包');
    });
    it('增加流动性先读池，未查不冒充无池，不提供虚构报价', () => {
        const props: LiquidityViewProps = { poolId: '', mintA: '', mintB: '', amount: '', pool: null, quote: null, loading: false, submitting: false, error: '', confirmed: false, updates: [], onPoolIdChange: vi.fn(), onMintAChange: vi.fn(), onMintBChange: vi.fn(), onAmountChange: vi.fn(), onLoad: vi.fn(), onSubmit: vi.fn() };
        const view = render(<LiquidityView {...props} />);
        expect(view.text()).toContain('未查询或查询失败，不代表链上没有任何池');
        expect(view.button('读取并校验池').props.isDisabled).toBe(true);
        expect(view.root.findAllByProps({ id: 'liquidity-base-amount' })).toHaveLength(0);
        act(() => { view.button('按交易对查询').props.onClick(); });
        expect(view.root.findAllByProps({ id: 'liquidity-mint-a', 'data-ui': 'Input' })).toHaveLength(1);
    });
    it('兑换未知价格影响不显示零，不输出未计算的比率，提交期间不能关弹窗', () => {
        const onClose = vi.fn();
        const view = render(<SwapConfirmModal isOpen onClose={onClose} tokenA={{ mint: 'a', symbol: 'A', decimals: 9 }} tokenB={{ mint: 'b', symbol: 'B', decimals: 6 }} amountIn="1" amountOut="2" minAmountOut="1.98" exchangeRate={null} priceImpact={null} slippage={1} isSwapping onConfirm={vi.fn()} />);
        expect(view.text()).toContain('未提供');
        expect(view.text()).not.toContain('兑换比率');
        expect(view.root.findByProps({ 'data-ui': 'Modal' }).props.closeOnEsc).toBe(false);
        act(() => { view.root.findByProps({ 'data-ui': 'Modal' }).props.onClose(); });
        expect(onClose).not.toHaveBeenCalled();
        expect(view.button('确认兑换并请求签名').props.isDisabled).toBe(true);
    });
});

it('明显非法输入就地解释、禁用提交且不改写原值', () => {
    const metadataProps = { ...metadata(), name: '中'.repeat(11), uri: 'javascript:bad' };
    const meta = render(<MetadataView {...metadataProps} />);
    expect(meta.text()).toContain('名称不能为空且不能超过 32 字节');
    expect(meta.text()).toContain('URI 必须为有效');
    expect(meta.button('确认创建元数据').props.isDisabled).toBe(true);
    expect(meta.root.findByProps({ id: 'metadata-name' }).props.value).toBe('中'.repeat(11));
    const props: MintTokenViewProps = { mint: 'bad-mint', recipient: '', amount: '1e3', walletAddress: 'wallet', busy: false, error: '', updates: [], result: null, onMintChange: vi.fn(), onRecipientChange: vi.fn(), onAmountChange: vi.fn(), onSubmit: vi.fn() };
    const mint = render(<MintTokenView {...props} />);
    expect(mint.text()).toContain('完整、有效的 Solana 地址');
    expect(mint.text()).toContain('科学计数法');
    expect(mint.button('核对并增发代币').props.isDisabled).toBe(true);
    expect(mint.root.findByProps({ id: 'mint-token-amount' }).props['aria-describedby']).toContain('mint-token-amount-error');
    meta.view.unmount(); mint.view.unmount();
});
