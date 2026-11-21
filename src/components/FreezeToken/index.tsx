import { AppError, message as msg, describeError } from '../../i18n/message';
import { useT, useMessageState } from '../../i18n/useT';
import { useWorkspaceOperation } from '../learning/LearningContext';
import { getAccount, getAssociatedTokenAddressSync, getMint, TokenAccountNotFoundError } from '@solana/spl-token';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { PublicKey } from '@solana/web3.js';
import { useEffect, useRef, useState } from 'react';
import { buildFreezeTransaction } from '../../lib/solana/tokens';
import { executeTransaction } from '../../lib/solana/transactions';
import { useTransactionFeedback } from '../common/TransactionFeedback';
import { FreezeTokenView, type TargetState } from './FreezeTokenView';

export const FreezeToken = ({ mintAddress }: { mintAddress: string }) => {
    const t = useT();
    const { connection } = useConnection();
    const { publicKey, signTransaction } = useWallet();
    const [mint, setMint] = useState(mintAddress);
    const [target, setTarget] = useState('');
    const [mintLoading, setMintLoading] = useState(false);
    const [authority, setAuthority] = useState<boolean | null>(null);
    const [targetState, setTargetState] = useState<TargetState>('idle');
    const [targetAta, setTargetAta] = useState('');
    const [operation, setOperation] = useState<'freeze' | 'thaw' | null>(null);
    const [error, setError] = useMessageState();
    const [refreshWarning, setRefreshWarning] = useMessageState();
    const { updates, onUpdate } = useTransactionFeedback();
    const workspaceOperation = useWorkspaceOperation('freeze');
    const mintRequest = useRef(0);
    const targetRequest = useRef(0);
    const clearTarget = () => { targetRequest.current++; setTargetState('idle'); setTargetAta(''); };
    useEffect(() => {
        const mintRequests = mintRequest;
        const targetRequests = targetRequest;
        setMint(mintAddress); setAuthority(null); setMintLoading(false); setTargetState('idle'); setTargetAta('');
        mintRequest.current++; targetRequest.current++;
        return () => { mintRequests.current++; targetRequests.current++; };
    }, [mintAddress, publicKey, connection]);
    const changeMint = (value: string) => {
        mintRequest.current++; setMint(value); setMintLoading(false); setAuthority(null); setError(''); setRefreshWarning(''); clearTarget();
    };
    const loadMint = async () => {
        if (!publicKey || operation) return;
        const id = ++mintRequest.current;
        setMintLoading(true); setAuthority(null); setError(''); clearTarget();
        try {
            const info = await getMint(connection, new PublicKey(mint));
            if (id === mintRequest.current) setAuthority(Boolean(info.freezeAuthority?.equals(publicKey)));
        } catch (cause) { if (id === mintRequest.current) setError(cause); }
        finally { if (id === mintRequest.current) setMintLoading(false); }
    };
    const checkTarget = async (refresh = false) => {
        const id = ++targetRequest.current;
        setTargetState('loading'); setTargetAta('');
        if (!refresh) { setError(''); setRefreshWarning(''); }
        try {
            const ata = getAssociatedTokenAddressSync(new PublicKey(mint), new PublicKey(target));
            try {
                const account = await getAccount(connection, ata);
                if (id !== targetRequest.current) return;
                setTargetAta(ata.toBase58()); setTargetState(account.isFrozen ? 'frozen' : 'active');
            } catch (cause) {
                if (!(cause instanceof TokenAccountNotFoundError)) throw cause;
                if (id === targetRequest.current) setTargetState('missing');
            }
        } catch (cause) {
            if (id !== targetRequest.current) return;
            setTargetState('error');
            if (refresh) setRefreshWarning(msg("FreezeToken.transactionConfirmedButRefreshingTheTargetStateFailedCheck", { v0: describeError(cause) }));
            else setError(cause);
        }
    };
    const submit = async (thaw: boolean) => {
        if (!publicKey || !authority || operation || targetState !== (thaw ? 'frozen' : 'active')) return;
        if (!workspaceOperation.begin()) return;
        setOperation(thaw ? 'thaw' : 'freeze'); setError(''); setRefreshWarning('');
        try {
            const transaction = await buildFreezeTransaction(connection, new PublicKey(mint), publicKey, new PublicKey(target), thaw);
            await executeTransaction(connection, { publicKey, signTransaction }, transaction, [], onUpdate);
            await checkTarget(true);
        } catch (cause) { setError(cause); }
        finally { setOperation(null); workspaceOperation.end(); }
    };
    return <FreezeTokenView mint={mint} target={target} mintLoading={mintLoading} authority={authority} targetState={targetState} targetAta={targetAta} operation={operation} error={error} refreshWarning={refreshWarning} updates={updates} onMintChange={changeMint} onTargetChange={value => { setTarget(value); setError(''); setRefreshWarning(''); clearTarget(); }} onLoadMint={loadMint} onCheckTarget={() => void checkTarget()} onSubmit={submit} />;
};
