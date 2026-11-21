import { AppError, message as msg, describeError } from '../../i18n/message';
import { useT, useMessageState } from '../../i18n/useT';
import { useWorkspaceOperation } from '../learning/LearningContext';
import { Liquidity, Percent, Token, TxVersion } from '@raydium-io/raydium-sdk';
import { TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { useEffect, useRef, useState } from 'react';
import { tokenAmount, walletTokenAccounts } from '../../lib/solana/defi';
import { getPoolInfo, type LoadedPool } from '../../lib/solana/pools';
import { executeInstructionBatches } from '../../lib/solana/transactions';
import { useTransactionFeedback } from '../common/TransactionFeedback';
import { LiquidityView } from './LiquidityView';

interface AddLiquidityProps { mintAddress?: string; initialPoolId?: string; entryVersion?: number; onClose?: () => void; }
export const AddLiquidity = ({ mintAddress = '', initialPoolId = '', entryVersion, onClose }: AddLiquidityProps) => {
    const t = useT();
    const { connection } = useConnection();
    const wallet = useWallet();
    const { updates, onUpdate } = useTransactionFeedback();
    const workspaceOperation = useWorkspaceOperation('liquidity');
    const [ammId, setAmmId] = useState('');
    const [mintA, setMintA] = useState(mintAddress);
    const [mintB, setMintB] = useState('');
    const [pool, setPool] = useState<LoadedPool | null>(null);
    const [amountA, setAmountA] = useState('');
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [quote, setQuote] = useState<{ input: string; output: string; max: string } | null>(null);
    const [error, setError] = useMessageState();
    const [confirmed, setConfirmed] = useState(false);
    const requestId = useRef(0);
    useEffect(() => {
        const requests = requestId;
        requests.current++; setMintA(mintAddress); setMintB(''); setAmmId(initialPoolId); setPool(null); setQuote(null); setLoading(false); setAmountA(''); setError(''); setConfirmed(false);
        return () => { requests.current++; };
    }, [mintAddress, initialPoolId, entryVersion, connection, setError]);
    const invalidatePool = () => { requestId.current++; setPool(null); setQuote(null); setAmountA(''); setError(''); setConfirmed(false); };
    const load = async (byPair: boolean) => {
        const id = ++requestId.current;
        setPool(null); setQuote(null); setAmountA(''); setLoading(true); setError(''); setConfirmed(false);
        try {
            const loaded = await getPoolInfo(connection, byPair ? { tokenPair: [mintA, mintB] } : { ammId });
            if (id !== requestId.current) return;
            setPool(loaded); setAmmId(loaded.poolKeys.id.toBase58());
        } catch (cause) { if (id === requestId.current) setError(cause); }
        finally { if (id === requestId.current) setLoading(false); }
    };
    const updateAmount = (value: string) => {
        setAmountA(value); setQuote(null); setError('');
        if (!pool || !value) return;
        try {
            const amount = tokenAmount(pool.poolKeys.baseMint.toBase58(), pool.poolKeys.baseDecimals, value);
            const computed = Liquidity.computeAnotherAmount({ poolKeys: pool.poolKeys, poolInfo: pool.poolInfo, amount, anotherCurrency: new Token(TOKEN_PROGRAM_ID, pool.poolKeys.quoteMint, pool.poolKeys.quoteDecimals), slippage: new Percent(1, 100) });
            setQuote({ input: value, output: computed.anotherAmount.toExact(), max: computed.maxAnotherAmount.toExact() });
        } catch (cause) { setError(cause); }
    };
    const submit = async () => {
        if (!pool || !quote || !wallet.publicKey || submitting) return;
        if (!workspaceOperation.begin()) return;
        setSubmitting(true); setError(''); setConfirmed(false);
        try {
            const fresh = await getPoolInfo(connection, { ammId: pool.poolKeys.id.toBase58() });
            if (!Liquidity.getEnabledFeatures(fresh.poolInfo).addLiquidity) throw new AppError(msg("AddLiquidity.thisPoolIsNotCurrentlyOpenForLiquidityDeposits"));
            const amount = tokenAmount(fresh.poolKeys.baseMint.toBase58(), fresh.poolKeys.baseDecimals, quote.input);
            const maximum = tokenAmount(fresh.poolKeys.quoteMint.toBase58(), fresh.poolKeys.quoteDecimals, quote.max);
            const required = Liquidity.computeAnotherAmount({ poolKeys: fresh.poolKeys, poolInfo: fresh.poolInfo, amount, anotherCurrency: maximum.token, slippage: new Percent(1, 100) });
            if (required.maxAnotherAmount.raw.gt(maximum.raw)) { setPool(fresh); setQuote(null); throw new AppError(msg("AddLiquidity.thePoolRatioChangedReEnterTheAmountAnd")); }
            const accounts = await walletTokenAccounts(connection, wallet.publicKey);
            const { innerTransactions } = await Liquidity.makeAddLiquidityInstructionSimple({ connection, poolKeys: fresh.poolKeys, userKeys: { owner: wallet.publicKey, payer: wallet.publicKey, tokenAccounts: accounts }, amountInA: amount, amountInB: maximum, fixedSide: 'a', makeTxVersion: TxVersion.LEGACY, config: { checkCreateATAOwner: true } });
            await executeInstructionBatches(connection, wallet, innerTransactions, onUpdate);
            setConfirmed(true); setQuote(null); setAmountA('');
            const id = ++requestId.current;
            try { const refreshed = await getPoolInfo(connection, { ammId: pool.poolKeys.id.toBase58() }); if (id === requestId.current) setPool(refreshed); }
            catch { if (id === requestId.current) { setPool(null); setError(msg("AddLiquidity.transactionConfirmedButRefreshingThePoolFailedReloadThe")); } }
        } catch (cause) { setError(cause); }
        finally { setSubmitting(false); workspaceOperation.end(); }
    };
    return <LiquidityView poolId={ammId} mintA={mintA} mintB={mintB} amount={amountA} pool={pool && { id: pool.poolKeys.id.toBase58(), baseMint: pool.poolKeys.baseMint.toBase58(), quoteMint: pool.poolKeys.quoteMint.toBase58(), baseDecimals: pool.poolKeys.baseDecimals, quoteDecimals: pool.poolKeys.quoteDecimals }} quote={quote} loading={loading} submitting={submitting} error={error} confirmed={confirmed} updates={updates} onPoolIdChange={value => { setAmmId(value); invalidatePool(); }} onMintAChange={value => { setMintA(value); invalidatePool(); }} onMintBChange={value => { setMintB(value); invalidatePool(); }} onAmountChange={updateAmount} onLoad={load} onSubmit={submit} onClose={onClose} />;
};
