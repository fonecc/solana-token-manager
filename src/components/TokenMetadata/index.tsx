import { AppError, message as msg, describeError } from '../../i18n/message';
import { useT, useMessageState } from '../../i18n/useT';
import { useWorkspaceOperation } from '../learning/LearningContext';
import { Metadata, createCreateMetadataAccountV3Instruction, createUpdateMetadataAccountV2Instruction } from '@metaplex-foundation/mpl-token-metadata';
import { getMint } from '@solana/spl-token';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { PublicKey, Transaction } from '@solana/web3.js';
import { useEffect, useState } from 'react';
import { metadataAddress, validateMetadata } from '../../lib/solana/metadata';
import { executeTransaction } from '../../lib/solana/transactions';
import { useTransactionFeedback } from '../common/TransactionFeedback';
import { MetadataView } from './MetadataView';

interface TokenMetadataProps {
    mintAddress: string; name: string; symbol: string; uri: string;
    setMintAddress: (value: string) => void; setName: (value: string) => void;
    setSymbol: (value: string) => void; setUri: (value: string) => void; defaultTabIndex: number;
}
export const TokenMetadata = (props: TokenMetadataProps) => {
    const t = useT();
    const { connection } = useConnection();
    const { publicKey, signTransaction } = useWallet();
    const [busy, setBusy] = useState(false);
    const [allowUpdate, setAllowUpdate] = useState(true);
    const [mode, setMode] = useState(props.defaultTabIndex);
    const [error, setError] = useMessageState();
    const [result, setResult] = useState<{ mint: string; name: string; symbol: string; mutable: boolean } | null>(null);
    const { updates, onUpdate } = useTransactionFeedback();
    const workspaceOperation = useWorkspaceOperation('metadata');
    useEffect(() => { setMode(props.defaultTabIndex); }, [props.defaultTabIndex]);
    const submit = async () => {
        if (!publicKey || !signTransaction || busy) return;
        if (!workspaceOperation.begin()) return;
        setBusy(true); setError('');
        try {
            validateMetadata(props.name, props.symbol, props.uri);
            const mint = new PublicKey(props.mintAddress);
            const metadata = metadataAddress(mint);
            let transaction: Transaction;
            if (mode === 0) {
                const info = await getMint(connection, mint);
                if (!info.mintAuthority?.equals(publicKey)) throw new AppError(msg("TokenMetadata.thisWalletHasNoMintAuthorityAndCannotCreate"));
                transaction = new Transaction().add(createCreateMetadataAccountV3Instruction({ metadata, mint, mintAuthority: publicKey, payer: publicKey, updateAuthority: publicKey }, {
                    createMetadataAccountArgsV3: { data: { name: props.name, symbol: props.symbol, uri: props.uri, sellerFeeBasisPoints: 0, creators: null, collection: null, uses: null }, isMutable: allowUpdate, collectionDetails: null }
                }));
            } else {
                const existing = await Metadata.fromAccountAddress(connection, metadata);
                if (!existing.updateAuthority.equals(publicKey)) throw new AppError(msg("TokenMetadata.thisWalletHasNoMetadataUpdateAuthority"));
                if (!existing.isMutable) throw new AppError(msg("TokenMetadata.metadataIsPermanentlyLocked"));
                transaction = new Transaction().add(createUpdateMetadataAccountV2Instruction({ metadata, updateAuthority: publicKey }, {
                    updateMetadataAccountArgsV2: { data: { name: props.name, symbol: props.symbol, uri: props.uri, sellerFeeBasisPoints: existing.data.sellerFeeBasisPoints, creators: existing.data.creators, collection: existing.collection, uses: existing.uses }, updateAuthority: publicKey, primarySaleHappened: null, isMutable: allowUpdate }
                }));
            }
            await executeTransaction(connection, { publicKey, signTransaction }, transaction, [], onUpdate);
            setResult({ mint: mint.toBase58(), name: props.name, symbol: props.symbol, mutable: allowUpdate });
        } catch (cause) { setError(cause); }
        finally { setBusy(false); workspaceOperation.end(); }
    };
    return <MetadataView mint={props.mintAddress} name={props.name} symbol={props.symbol} uri={props.uri} mode={mode} allowUpdate={allowUpdate} busy={busy} error={error} result={result} updates={updates} onMintChange={props.setMintAddress} onNameChange={props.setName} onSymbolChange={props.setSymbol} onUriChange={props.setUri} onModeChange={setMode} onAllowUpdateChange={setAllowUpdate} onSubmit={submit} />;
};
