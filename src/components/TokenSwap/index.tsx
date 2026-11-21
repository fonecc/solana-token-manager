import { AppError, message as msg, describeError } from '../../i18n/message';
import { useT, useMessageState, useErrorMessage } from '../../i18n/useT';
import { useWorkspaceOperation } from '../learning/LearningContext';
import { useToast } from '@chakra-ui/react';
import { Liquidity,TxVersion } from '@raydium-io/raydium-sdk';
import { useConnection,useWallet } from '@solana/wallet-adapter-react';
import { useEffect,useRef,useState } from 'react';
import { swapQuote,tokenAmount,walletTokenAccounts } from '../../lib/solana/defi';

import { getPoolInfo,type LoadedPool } from '../../lib/solana/pools';
import { executeInstructionBatches } from '../../lib/solana/transactions';
import { useTransactionFeedback } from '../common/TransactionFeedback';
import { SwapView } from './SwapView';
import { SwapConfirmModal } from './SwapConfirmModal';
import { TokenSelectModal } from './TokenSelectModal';
import { type TokenInfo } from './types';

interface Quote {
    pool: LoadedPool;
    inputMint: string;
    outputMint: string;
    amount: string;
    bps: number;
    output: string;
    minimum: string;
    minimumRaw: string;
    priceImpact: string;
    time: number;
}

export const TokenSwap = () => {
    const t = useT();
    const errorMessage = useErrorMessage();
    const { connection } = useConnection();
    const wallet = useWallet();
    const toast = useToast();
    const { updates, onUpdate } = useTransactionFeedback();
    const workspaceOperation = useWorkspaceOperation('swap');
    const [tokenA, setTokenA] = useState<TokenInfo | null>(null);
    const [tokenB, setTokenB] = useState<TokenInfo | null>(null);
    const [amountIn, setAmountIn] = useState('');
    const [slippage, setSlippage] = useState('0.5');
    const [selecting, setSelecting] = useState<'a' | 'b' | null>(null);
    const [quote, setQuote] = useState<Quote | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useMessageState();
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [swapping, setSwapping] = useState(false);
    const generation = useRef(0);

    const createQuote = async (pool?: LoadedPool): Promise<Quote> => {
        if (!tokenA || !tokenB) throw new AppError(msg("TokenSwap.selectTwoTokens"));
        if (!/^\d+(?:\.\d{1,2})?$/.test(slippage) || Number(slippage) > 5) throw new AppError(msg("TokenSwap.enterSlippageFrom0To5WithAtMost"));
        const bps = Math.round(Number(slippage) * 100);
        const loaded = pool || await getPoolInfo(connection, { tokenPair: [tokenA.mint, tokenB.mint] });
        const computed = swapQuote(loaded, tokenA, tokenB, amountIn, bps);
        return { pool: loaded, inputMint: tokenA.mint, outputMint: tokenB.mint, amount: amountIn, bps,
            output: computed.amountOut.toExact(), minimum: computed.minAmountOut.toExact(), minimumRaw: computed.minAmountOut.raw.toString(),
            priceImpact: computed.priceImpact.toFixed(2), time: Date.now() };
    };

    useEffect(() => {
        const id = ++generation.current;
        setQuote(null);
        setConfirmOpen(false);
        setError('');
        setLoading(false);
        if (!tokenA || !tokenB || !amountIn) return;
        setLoading(true);
        const timer = setTimeout(() => {
            createQuote().then(value => { if (generation.current === id) setQuote(value); })
                .catch(reason => { if (generation.current === id) setError(reason); })
                .finally(() => { if (generation.current === id) setLoading(false); });
        }, 350);
        return () => { clearTimeout(timer); generation.current = id + 1; };
        // Quote depends only on these input values; stale requests are discarded.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [tokenA?.mint, tokenA?.decimals, tokenB?.mint, tokenB?.decimals, amountIn, slippage, connection]);

    const confirmSwap = async () => {
        if (!quote || !tokenA || !tokenB || !wallet.publicKey || swapping) return;
        if (!workspaceOperation.begin()) return;
        setSwapping(true); setError('');
        try {
            if (quote.inputMint !== tokenA.mint || quote.outputMint !== tokenB.mint || quote.amount !== amountIn) throw new AppError(msg("TokenSwap.quoteInputsChangedGetANewQuote"));
            const freshPool = await getPoolInfo(connection, { ammId: quote.pool.poolKeys.id.toBase58() });
            const freshQuote = await createQuote(freshPool);
            // 任何影响用户接收金额的变化都要求再次确认，不静默替换已显示的报价。
            if (freshQuote.minimumRaw !== quote.minimumRaw || Date.now() - quote.time > 30000) {
                setQuote(freshQuote);
                toast({ title: t("TokenSwap.quoteUpdated"), description: t("TokenSwap.reviewTheLatestMinimumReceivedAndConfirmAgain"), status: 'info' });
                return;
            }
            const accounts = await walletTokenAccounts(connection, wallet.publicKey);
            const { innerTransactions } = await Liquidity.makeSwapInstructionSimple({
                connection, poolKeys: freshPool.poolKeys,
                userKeys: { owner: wallet.publicKey, tokenAccounts: accounts },
                amountIn: tokenAmount(tokenA.mint, tokenA.decimals, quote.amount),
                amountOut: tokenAmount(tokenB.mint, tokenB.decimals, quote.minimum),
                fixedSide: 'in', makeTxVersion: TxVersion.LEGACY, config: { checkCreateATAOwner: true }
            });
            await executeInstructionBatches(connection, wallet, innerTransactions, onUpdate);
            toast({ title: t("TokenSwap.swapConfirmed"), status: 'success' });
            setConfirmOpen(false);
            setAmountIn('');
            setQuote(null);
        } catch (reason) {
            setError(reason);
            toast({ title: t("TokenSwap.swapNotCompleted"), description: errorMessage(reason), status: 'error', duration: 10000 });
        } finally { setSwapping(false); workspaceOperation.end(); }
    };

    return <>
        <SwapView tokenA={tokenA} tokenB={tokenB} amount={amountIn} slippage={slippage} loading={loading} swapping={swapping} error={error} walletReady={Boolean(wallet.publicKey)} quote={quote && { output: quote.output, minimum: quote.minimum, priceImpact: quote.priceImpact, poolId: quote.pool.poolKeys.id.toBase58() }} updates={updates} onAmountChange={setAmountIn} onSlippageChange={setSlippage} onSelect={setSelecting} onReverse={() => { setTokenA(tokenB); setTokenB(tokenA); setAmountIn(''); }} onPreview={() => setConfirmOpen(true)} />
        <TokenSelectModal isOpen={selecting !== null} onClose={() => setSelecting(null)} excludeToken={(selecting === 'a' ? tokenB : tokenA)?.mint} onSelect={token => { if (selecting === 'a') setTokenA(token); else setTokenB(token); setSelecting(null); }} />
        <SwapConfirmModal isOpen={confirmOpen} onClose={() => { if (!swapping) setConfirmOpen(false); }} tokenA={tokenA} tokenB={tokenB} amountIn={amountIn} amountOut={quote?.output || ''} minAmountOut={quote?.minimum || ''} poolId={quote?.pool.poolKeys.id.toBase58()} exchangeRate={null} priceImpact={quote?.priceImpact || null} slippage={Number(slippage)} onConfirm={confirmSwap} isSwapping={swapping} />
    </>;
};
