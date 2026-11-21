import { ManualProvider, useManual } from '../components/manual/ManualContext';
import { Brand } from '../components/brand/Brand';
import { SiteFooter } from '../components/brand/SiteFooter';
import { ManualLink } from '../components/manual/ManualLink';
import { LanguageSwitcher } from '../i18n/LanguageSwitcher';
import { useT, useMessageState } from '../i18n/useT';
import { message } from '../i18n/message';
import { loadMessages } from '../i18n/config';
import type { GetStaticProps } from 'next';
import { Box, Container, Flex, Badge, Button } from '@chakra-ui/react';
import { useWallet } from '@solana/wallet-adapter-react';
import dynamic from 'next/dynamic';
import Head from 'next/head';
import { useCallback, useRef, useState } from 'react';
import { BurnToken } from '../components/BurnToken';
import { CreateToken } from '../components/CreateToken';
import { FreezeToken } from '../components/FreezeToken';
import { MintToken } from '../components/MintToken';
import { TokenList } from '../components/TokenList';
import { TokenMetadata } from '../components/TokenMetadata';
import { WalletButton } from '../components/WalletButton';
import { WelcomePanel } from '../components/home/WelcomePanel';
import { LearningContext, KeepLesson, type LessonDestination } from '../components/learning/LearningContext';
import { LearningOverview } from '../components/learning/LearningOverview';
import { WorkspaceShell } from '../components/learning/WorkspaceShell';
import { Notice } from '../components/learning/LessonLayout';
import { legacyLessonIds, type LessonId, useCurriculum } from '../components/learning/curriculum';
const ManualWorkspace = dynamic(() => import('../components/manual/ManualWorkspace'));
const CreatePool = dynamic(() => import('../components/CreatePool'));
const TokenSwap = dynamic(() => import('../components/TokenSwap').then(module => module.TokenSwap));
const AddLiquidity = dynamic(() => import('../components/AddLiquidity').then(module => module.AddLiquidity));

export const getStaticProps: GetStaticProps = async ({ locale }) => ({
    props: { messages: await loadMessages(locale) },
});

export default function Home() {
    const { publicKey } = useWallet();
    return <ManualProvider key={publicKey?.toBase58() || 'disconnected'}><Workspace /></ManualProvider>;
}

function Workspace() {
    const t = useT();
    const manual = useManual();
    const closeManual = manual.close;
    const { lessonById } = useCurriculum();
    const { publicKey } = useWallet();
    const [selectedMint, setSelectedMint] = useState('');
    const [metadataMint, setMetadataMint] = useState('');
    const [name, setName] = useState('');
    const [symbol, setSymbol] = useState('');
    const [uri, setUri] = useState('');
    const [metadataTabIndex, setMetadataTabIndex] = useState(0);
    const [mintTokenAddress, setMintTokenAddress] = useState('');
    const [active, setActive] = useState<LessonId>('overview');
    const [visited, setVisited] = useState<Set<LessonId>>(() => new Set(['overview']));

    const poolEntryRevision = useRef(0);
    const operationRef = useRef<{ token: symbol; lesson: LessonId } | null>(null);
    const [operationLesson, setOperationLesson] = useState<LessonId | null>(null);
    const [contextWarning, setContextWarning] = useMessageState();
    const [poolEntry, setPoolEntry] = useState<{ poolId: string; version: number } | null>(null);
    const startOperation = useCallback((token: symbol, lesson: LessonId) => {
        if (operationRef.current) {
            setContextWarning(message("pages.anOperationIsAlreadyInProgressReturnToIts"));
            return false;
        }
        operationRef.current = { token, lesson };
        setOperationLesson(lesson); setContextWarning('');
        return true;
    }, [setContextWarning]);
    const finishOperation = useCallback((token: symbol) => {
        if (operationRef.current?.token !== token) return;
        operationRef.current = null; setOperationLesson(null); setContextWarning('');
    }, [setContextWarning]);
    const selectMint = useCallback((mint: string, ownCreation = false) => {
        if (operationRef.current && !(ownCreation && operationRef.current.lesson === 'create')) {
            setContextWarning(message("pages.theExperimentMintCannotChangeDuringAnOperationYou"));
            return false;
        }
        setSelectedMint(mint); setMetadataMint(mint); setMintTokenAddress(mint);
        setPoolEntry(null); setContextWarning('');
        return true;
    }, [setContextWarning]);
    const navigate = useCallback((id: LessonId, mint?: string, destination?: LessonDestination) => {
        if ((mint || destination?.poolId) && operationRef.current) {
            setContextWarning(message("pages.theExperimentTargetCannotChangeDuringAnOperationReturn"));
            return;
        }
        if (mint && !selectMint(mint)) return;
        if (destination?.poolId) setPoolEntry({ poolId: destination.poolId, version: ++poolEntryRevision.current });
        setVisited(previous => new Set(previous).add(id));
        setActive(id);
        closeManual();
        if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'instant' });
    }, [selectMint, setContextWarning, closeManual]);
    const onCreated = ({ mint }: { mint: string }) => {
        selectMint(mint, true); setName(''); setSymbol(''); setUri(''); setMetadataTabIndex(0);
    };

    if (!publicKey && !manual.isOpen) return <Box minH="100vh" bg="canvas"><Head><title>{t("pages.solanaTokenLabDevnetLearningLab")}</title><meta name="description" content={t("pages.learnTokenAccountsMetadataAssetsAuthoritiesLiquidityAndSwaps")} /></Head><Container maxW="1600px" px={{ base: 4, md: 6, xl: 10 }} py={6}>
        <Flex justify="space-between" align="center" gap={3} wrap="wrap" mb={8}><Brand heading="h1" /><Flex gap={3} align="center" wrap="wrap"><Badge colorScheme="green">Devnet</Badge><ManualLink /><LanguageSwitcher /><WalletButton /></Flex></Flex>
        <WelcomePanel />
        <SiteFooter />
    </Container></Box>;

    return <LearningContext.Provider value={{ selectedMint, navigate, startOperation, finishOperation, operationActive: operationLesson !== null }}>
        <Head><title>{manual.isOpen ? t('manual.title') : active === 'overview' ? t("learning.learningOverview") : lessonById[active].shortTitle} · Solana Token Lab</title></Head>
        <WorkspaceShell active={active} onNavigate={navigate} walletAddress={publicKey?.toBase58() || ''} selectedMint={selectedMint}>
            {operationLesson && <Box mb={4} role="status"><Notice>{t('site.operationInProgress', { lesson: operationLesson === 'overview' ? t("learning.learningOverview") : lessonById[operationLesson].shortTitle })}<Button size="xs" variant="link" ml={2} onClick={() => navigate(operationLesson)}>{t("pages.returnToTheActiveOperation")}</Button></Notice></Box>}
            {contextWarning && <Box mb={4}><Notice tone="warning">{contextWarning}</Notice></Box>}
            <KeepLesson active={!manual.isOpen}>
            <KeepLesson active={active === 'overview'}><LearningOverview /></KeepLesson>
            {visited.has('assets') && <KeepLesson active={active === 'assets'}><TokenList setMintAddress={selectMint} setName={setName} setSymbol={setSymbol} setUri={setUri} setMetadataTabIndex={setMetadataTabIndex} setMintTokenAddress={setMintTokenAddress} onNavigate={index => { const id = legacyLessonIds[index]; if (id) navigate(id); }} /></KeepLesson>}
            {visited.has('create') && <KeepLesson active={active === 'create'}><CreateToken onCreated={onCreated} onNext={(step, created) => {
                if (selectedMint !== created.mint) { setName(''); setSymbol(''); setUri(''); setMetadataTabIndex(0); }
                navigate(step === 'metadata' ? 'metadata' : 'mint', created.mint);
            }} /></KeepLesson>}
            {visited.has('metadata') && <KeepLesson active={active === 'metadata'}><TokenMetadata mintAddress={metadataMint} name={name} symbol={symbol} uri={uri} setMintAddress={setMetadataMint} setName={setName} setSymbol={setSymbol} setUri={setUri} defaultTabIndex={metadataTabIndex} /></KeepLesson>}
            {visited.has('mint') && <KeepLesson active={active === 'mint'}><MintToken mintAddress={mintTokenAddress} setMintAddress={setMintTokenAddress} /></KeepLesson>}
            {visited.has('freeze') && <KeepLesson active={active === 'freeze'}><FreezeToken key={selectedMint} mintAddress={selectedMint} /></KeepLesson>}
            {visited.has('burn') && <KeepLesson active={active === 'burn'}><BurnToken key={selectedMint} mintAddress={selectedMint} /></KeepLesson>}
            {visited.has('pool') && <KeepLesson active={active === 'pool'}><CreatePool key={selectedMint} tokenMint={selectedMint} isActive={active === 'pool'} /></KeepLesson>}
            {visited.has('liquidity') && <KeepLesson active={active === 'liquidity'}><AddLiquidity mintAddress={selectedMint} initialPoolId={poolEntry?.poolId} entryVersion={poolEntry?.version} /></KeepLesson>}
            {visited.has('swap') && <KeepLesson active={active === 'swap'}><TokenSwap /></KeepLesson>}
            </KeepLesson>
            {manual.isOpen && <ManualWorkspace returnLabel={publicKey ? t('manual.returnToLesson', { lesson: active === 'overview' ? t('learning.learningOverview') : lessonById[active].shortTitle }) : t('manual.back')} />}
        </WorkspaceShell>
    </LearningContext.Provider>;
}
