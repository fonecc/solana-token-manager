import { useMessageState } from '../../i18n/useT';
import { useWorkspaceOperation } from '../learning/LearningContext';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { PublicKey } from '@solana/web3.js';
import { useState } from 'react';
import { buildMintTransaction } from '../../lib/solana/tokens';
import { executeTransaction } from '../../lib/solana/transactions';
import { useTransactionFeedback } from '../common/TransactionFeedback';
import { MintTokenView } from './MintTokenView';

interface MintTokenProps { mintAddress: string; setMintAddress: (value: string) => void; }
export const MintToken = ({ mintAddress, setMintAddress }: MintTokenProps) => {
    const { connection } = useConnection();
    const { publicKey, signTransaction } = useWallet();
    const [recipient, setRecipient] = useState('');
    const [amount, setAmount] = useState('');
    const [busy, setBusy] = useState(false);
    const [error, setError] = useMessageState();
    const [result, setResult] = useState<{ mint: string; recipient: string; amount: string } | null>(null);
    const { updates, onUpdate } = useTransactionFeedback();
    const workspaceOperation = useWorkspaceOperation('mint');
    const submit = async () => {
        if (!publicKey || !signTransaction || busy) return;
        if (!workspaceOperation.begin()) return;
        setBusy(true); setError('');
        try {
            const mint = new PublicKey(mintAddress);
            const target = recipient ? new PublicKey(recipient) : publicKey;
            const transaction = await buildMintTransaction(connection, mint, publicKey, target, amount);
            await executeTransaction(connection, { publicKey, signTransaction }, transaction, [], onUpdate);
            setResult({ mint: mint.toBase58(), recipient: target.toBase58(), amount });
        } catch (cause) { setError(cause); }
        finally { setBusy(false); workspaceOperation.end(); }
    };
    return <MintTokenView mint={mintAddress} recipient={recipient} amount={amount} walletAddress={publicKey?.toBase58() || ''} busy={busy} error={error} result={result} updates={updates} onMintChange={setMintAddress} onRecipientChange={setRecipient} onAmountChange={setAmount} onSubmit={submit} />;
};
