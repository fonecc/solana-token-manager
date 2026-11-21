import { AppError, message as msg, describeError, formatMessage } from '../../i18n/message';
import { useT, useMessageState } from '../../i18n/useT';
import { useWorkspaceOperation } from '../learning/LearningContext';
import { getAccount, getAssociatedTokenAddressSync, getMint, TokenAccountNotFoundError } from '@solana/spl-token';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { PublicKey } from '@solana/web3.js';
import { useEffect, useRef, useState } from 'react';
import { formatTokenAmount } from '../../lib/solana/amounts';
import { buildBurnTransaction } from '../../lib/solana/tokens';
import { executeTransaction } from '../../lib/solana/transactions';
import { useTransactionFeedback } from '../common/TransactionFeedback';
import { BurnTokenView, canBurnAmount, type BurnInfo } from './BurnTokenView';

export const BurnToken = ({ mintAddress }: { mintAddress: string }) => {
    const t = useT();
    const { connection } = useConnection();
    const { publicKey, signTransaction } = useWallet();
    const [mint, setMint] = useState(mintAddress);
    const [amount, setAmount] = useState('');
    const [info, setInfo] = useState<BurnInfo | null>(null);
    const [loading, setLoading] = useState(false);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useMessageState();
    const [warning, setWarning] = useMessageState();
    const [result, setResult] = useState<{ mint: string; amount: string } | null>(null);
    const { updates, onUpdate } = useTransactionFeedback();
    const workspaceOperation = useWorkspaceOperation('burn');
    const generation = useRef(0);
    useEffect(() => {
        const requests = generation;
        setMint(mintAddress); setInfo(null); setLoading(false); setAmount(''); generation.current++;
        return () => { requests.current++; };
    }, [mintAddress, publicKey, connection]);
    const changeMint = (value: string) => { generation.current++; setMint(value); setInfo(null); setLoading(false); setAmount(''); setError(''); };
    const load = async (refresh = false) => {
        if (!publicKey || !mint) return;
        const id = ++generation.current;
        setLoading(true); setInfo(null);
        if (!refresh) { setError(''); setWarning(''); }
        try {
            const mintKey = new PublicKey(mint);
            const mintInfo = await getMint(connection, mintKey);
            const ata = getAssociatedTokenAddressSync(mintKey, publicKey);
            const account = await getAccount(connection, ata);
            if (id === generation.current) setInfo({ balance: formatTokenAmount(account.amount, mintInfo.decimals), decimals: mintInfo.decimals, frozen: account.isFrozen, ata: ata.toBase58() });
        } catch (cause) {
            if (id !== generation.current) return;
            const detail = cause instanceof TokenAccountNotFoundError ? msg("BurnToken.yourWalletSAtaDoesNotExistSoThere") : describeError(cause);
            if (refresh) setWarning(msg("BurnToken.burnConfirmedButRefreshingTheBalanceFailedReadIt", { v0: detail }));
            else setError(detail);
        } finally { if (id === generation.current) setLoading(false); }
    };
    const submit = async () => {
        if (!publicKey || busy || !canBurnAmount(amount, info)) return;
        if (!workspaceOperation.begin()) return;
        setBusy(true); setError(''); setWarning('');
        try {
            const transaction = await buildBurnTransaction(connection, new PublicKey(mint), publicKey, amount);
            await executeTransaction(connection, { publicKey, signTransaction }, transaction, [], onUpdate);
            setResult({ mint, amount }); setAmount('');
            await load(true);
        } catch (cause) { setError(cause); }
        finally { setBusy(false); workspaceOperation.end(); }
    };
    return <BurnTokenView mint={mint} amount={amount} info={info} loading={loading} busy={busy} error={error} warning={warning} result={result} updates={updates} onMintChange={changeMint} onAmountChange={setAmount} onLoad={() => void load()} onSubmit={submit} />;
};
