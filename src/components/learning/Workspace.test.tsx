import { create } from '../../i18n/testRenderer';
import React from 'react';
import { act} from 'react-test-renderer';
import { describe, expect, it, vi } from 'vitest';
import { PublicKey } from '@solana/web3.js';
import Home from '../../pages/index';
import { useLearning } from './LearningContext';

const state = vi.hoisted(() => ({ wallet: { publicKey: null as PublicKey | null }, manual: { isOpen: false, open: vi.fn(), close: vi.fn() } }));
vi.mock('../manual/ManualContext', () => ({ ManualProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>, useManual: () => state.manual }));
vi.stubGlobal('React', React);
vi.mock('@solana/wallet-adapter-react', () => ({ useWallet: () => state.wallet }));
vi.mock('../../i18n/LanguageSwitcher', () => ({ LanguageSwitcher: () => null }));
vi.mock('next/head', () => ({ default: () => null }));
vi.mock('next/dynamic', () => ({ default: () => (props: object) => React.createElement('dynamic-lesson', props) }));
vi.mock('@chakra-ui/react', () => Object.fromEntries(['Box', 'Container', 'Flex', 'Heading', 'HStack', 'Badge', 'Text', 'Button'].map(name => [name, `ui-${name}`])));
vi.mock('../WalletButton', () => ({ WalletButton: () => null }));
vi.mock('../home/WelcomePanel', () => ({ WelcomePanel: () => React.createElement('welcome') }));
vi.mock('../learning/WorkspaceShell', () => ({ WorkspaceShell: (props: { children?: React.ReactNode }) => React.createElement('workspace', props, props.children) }));
vi.mock('../learning/LessonLayout', () => ({ Notice: (props: { children?: React.ReactNode }) => React.createElement('notice', props, props.children) }));
vi.mock('../learning/LearningOverview', () => ({ LearningOverview: () => React.createElement('overview', useLearning()) }));
vi.mock('../CreateToken', () => ({ CreateToken: (props: object) => React.createElement('create-lesson', props) }));
vi.mock('../TokenList', () => ({ TokenList: (props: object) => React.createElement('assets-lesson', props) }));
vi.mock('../TokenMetadata', () => ({ TokenMetadata: (props: object) => React.createElement('metadata-lesson', props) }));
vi.mock('../MintToken', () => ({ MintToken: (props: object) => React.createElement('mint-lesson', props) }));
vi.mock('../FreezeToken', () => ({ FreezeToken: (props: object) => React.createElement('freeze-lesson', props) }));
vi.mock('../BurnToken', () => ({ BurnToken: (props: object) => React.createElement('burn-lesson', props) }));
const first = new PublicKey('11111111111111111111111111111111');
const second = new PublicKey('So11111111111111111111111111111111111111112');
function setup() {
    state.manual.isOpen = false;
    state.wallet.publicKey = first;
    const view = create(<Home />);
    const node = (tag: string) => view.root.findByType(tag as React.ElementType);
    const navigate = (id: string) => act(() => { node('workspace').props.onNavigate(id); });
    return { view, node, navigate };
}
describe('工作区课程衔接', () => {
    it('连接后从总览开始，未访问课程不提前挂载', () => {
        const { view, node } = setup();
        expect(node('workspace').props.active).toBe('overview');
        expect(view.root.findAllByType('create-lesson' as React.ElementType)).toHaveLength(0);
        view.unmount();
    });
    it('创建结果下一步携带真实 Mint；手动草稿不广播到实验上下文', () => {
        const { view, node, navigate } = setup();
        navigate('create');
        act(() => { node('create-lesson').props.onCreated({ mint: second.toBase58() }); });
        act(() => { node('create-lesson').props.onNext('metadata', { mint: second.toBase58() }); });
        expect(node('workspace').props.active).toBe('metadata');
        expect(node('metadata-lesson').props.mintAddress).toBe(second.toBase58());
        act(() => { node('metadata-lesson').props.setMintAddress('manual-draft'); });
        expect(node('workspace').props.selectedMint).toBe(second.toBase58());
        navigate('mint');
        expect(node('mint-lesson').props.mintAddress).toBe(second.toBase58());
        navigate('metadata');
        expect(node('metadata-lesson').props.mintAddress).toBe('manual-draft');
        view.unmount();
    });
    it('旧资产入口映射到正确课程，切课保留已访问组件实例', () => {
        const { view, node, navigate } = setup();
        navigate('assets');
        const assets = node('assets-lesson');
        act(() => { assets.props.setMintAddress(second.toBase58()); assets.props.onNavigate(6); });
        expect(node('workspace').props.active).toBe('freeze');
        expect(node('freeze-lesson').props.mintAddress).toBe(second.toBase58());
        expect(node('assets-lesson')).toBe(assets);
        navigate('assets');
        expect(node('assets-lesson')).toBe(assets);
        view.unmount();
    });
    it('钱包切换重置草稿、当前 Mint 和已访问课程', () => {
        const { view, node, navigate } = setup();
        navigate('create');
        act(() => { node('create-lesson').props.onCreated({ mint: second.toBase58() }); });
        navigate('metadata');
        act(() => { state.wallet.publicKey = second; view.update(<Home />); });
        expect(node('workspace').props.active).toBe('overview');
        expect(node('workspace').props.selectedMint).toBe('');
        expect(view.root.findAllByType('metadata-lesson' as React.ElementType)).toHaveLength(0);
        act(() => { state.wallet.publicKey = null; view.update(<Home />); });
        expect(view.root.findAllByType('welcome' as React.ElementType)).toHaveLength(1);
        view.unmount();
    });
});

describe('同步工作区操作保护', () => {
    it('准备中可切课但不能替换 Mint，其他 token 不会误释放，结束后可恢复', () => {
        const { view, node, navigate } = setup();
        const owner = Symbol('owner'); const other = Symbol('other');
        act(() => { expect(node('overview').props.startOperation(owner, 'freeze')).toBe(true); });
        act(() => { expect(node('overview').props.startOperation(other, 'mint')).toBe(false); });
        navigate('assets');
        act(() => { node('assets-lesson').props.setMintAddress(second.toBase58()); });
        expect(node('workspace').props.selectedMint).toBe('');
        expect(node('workspace').props.active).toBe('assets');
        act(() => { node('overview').props.finishOperation(other); });
        expect(node('overview').props.operationActive).toBe(true);
        act(() => { node('overview').props.finishOperation(owner); });
        act(() => { node('assets-lesson').props.setMintAddress(second.toBase58()); });
        expect(node('workspace').props.selectedMint).toBe(second.toBase58());
        view.unmount();
    });
    it('创建自己的成功结果可交接；重复 Pool ID 交接有新版本但不自动提交', () => {
        const { view, node, navigate } = setup();
        const owner = Symbol('create');
        navigate('create');
        act(() => { node('overview').props.startOperation(owner, 'create'); });
        act(() => { node('create-lesson').props.onCreated({ mint: second.toBase58() }); });
        expect(node('workspace').props.selectedMint).toBe(second.toBase58());
        act(() => { node('overview').props.finishOperation(owner); });
        act(() => { node('overview').props.navigate('liquidity', second.toBase58(), { poolId: 'real-pool' }); });
        const entry = node('dynamic-lesson').props.entryVersion;
        expect(node('dynamic-lesson').props.initialPoolId).toBe('real-pool');
        act(() => { node('overview').props.navigate('liquidity', second.toBase58(), { poolId: 'real-pool' }); });
        expect(node('dynamic-lesson').props.entryVersion).toBeGreaterThan(entry);
        view.unmount();
    });
});

it('切换三语保留草稿、当前课程与同步操作所有权', () => {
    const { view, node, navigate } = setup();
    navigate('metadata');
    act(() => { node('metadata-lesson').props.setName('User name 原样'); node('metadata-lesson').props.setMintAddress('manual-draft'); });
    const metadata = node('metadata-lesson');
    const owner = Symbol('owner'); const other = Symbol('other');
    act(() => { expect(node('overview').props.startOperation(owner, 'metadata')).toBe(true); });
    for (const locale of ['en', 'zh-TW', 'zh-CN'] as const) {
        act(() => { view.setLocale(locale); });
        expect(node('workspace').props.active).toBe('metadata');
        expect(node('metadata-lesson')).toBe(metadata);
        expect(node('metadata-lesson').props.name).toBe('User name 原样');
        expect(node('metadata-lesson').props.mintAddress).toBe('manual-draft');
        expect(node('overview').props.operationActive).toBe(true);
        act(() => { node('overview').props.finishOperation(other); });
        expect(node('overview').props.operationActive).toBe(true);
    }
    act(() => { node('overview').props.finishOperation(owner); });
    expect(node('overview').props.operationActive).toBe(false);
    view.unmount();
});

it('同页阅读手册不卸载课程草稿、不释放同步操作所有权', () => {
    const { view, node, navigate } = setup();
    navigate('metadata');
    act(() => { node('metadata-lesson').props.setName('My token 原样'); node('metadata-lesson').props.setMintAddress('draft-mint'); });
    const instance = node('metadata-lesson');
    const owner = Symbol('owner');
    act(() => { node('overview').props.startOperation(owner, 'metadata'); });
    state.manual.isOpen = true;
    act(() => view.setLocale('en'));
    expect(node('metadata-lesson')).toBe(instance);
    expect(node('metadata-lesson').props.name).toBe('My token 原样');
    expect(node('metadata-lesson').props.mintAddress).toBe('draft-mint');
    expect(node('overview').props.operationActive).toBe(true);
    expect(instance.parent?.parent).toBeTruthy();
    state.manual.isOpen = false;
    act(() => view.setLocale('zh-TW'));
    expect(node('workspace').props.active).toBe('metadata');
    expect(node('metadata-lesson')).toBe(instance);
    expect(node('overview').props.operationActive).toBe(true);
    act(() => node('overview').props.finishOperation(owner));
    expect(node('overview').props.operationActive).toBe(false);
    view.unmount();
});

it('未连接钱包仍在同一主菜单外壳阅读手册，不挂载可执行课程', () => {
    state.wallet.publicKey = null;
    state.manual.isOpen = true;
    const view = create(<Home />);
    expect(view.root.findAllByType('workspace' as React.ElementType)).toHaveLength(1);
    expect(view.root.findAllByType('create-lesson' as React.ElementType)).toHaveLength(0);
    expect(view.root.findAllByType('welcome' as React.ElementType)).toHaveLength(0);
    view.unmount();
    state.manual.isOpen = false;
});
