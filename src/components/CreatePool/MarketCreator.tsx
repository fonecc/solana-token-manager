import { AppError, message as msg, describeError, formatMessage } from '../../i18n/message';
import { useT, useMessageState } from '../../i18n/useT';
import { useWorkspaceOperation } from '../learning/LearningContext';
import { useToast } from '@chakra-ui/react';
import { MARKET_STATE_LAYOUT_V3, MarketV2, TxVersion } from '@raydium-io/raydium-sdk';
import { NATIVE_MINT, getMint } from '@solana/spl-token';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { PublicKey } from '@solana/web3.js';
import { useState } from 'react';
import { PROGRAM_IDS } from '../../lib/solana/protocol';
import { executeInstructionBatches } from '../../lib/solana/transactions';
import { useTransactionFeedback } from '../common/TransactionFeedback';
import { MarketSetup } from './MarketSetup';
import { type MarketDetailsData } from './types';

interface MarketCreatorProps {
    tokenMint: string;
    ready?: boolean;
    onBusyChange: (busy: boolean) => void;
    onMarketCreated: (id: PublicKey, details: MarketDetailsData) => void;
}

export const MarketCreator = ({ tokenMint, ready = false, onBusyChange, onMarketCreated }: MarketCreatorProps) => {
    const t = useT();
    const { connection } = useConnection();
    const wallet = useWallet();
    const toast = useToast();
    const { updates, onUpdate } = useTransactionFeedback();
    const workspaceOperation = useWorkspaceOperation('pool');
    const [operation, setOperation] = useState<'create' | 'load' | null>(null);
    const [manualId, setManualId] = useState('');
    const [error, setError] = useMessageState();
    const [created, setCreated] = useState(false);

    const readMarket = async (id: PublicKey) => {
        const account = await connection.getAccountInfo(id);
        if (!account || !account.owner.equals(PROGRAM_IDS.OPENBOOK_MARKET) || account.data.length !== MARKET_STATE_LAYOUT_V3.span) throw new AppError(msg("CreatePool.notASupportedDevnetOpenbookMarket"));
        const market = MARKET_STATE_LAYOUT_V3.decode(account.data);
        if (!market.baseMint.equals(new PublicKey(tokenMint)) || !market.quoteMint.equals(NATIVE_MINT)) throw new AppError(msg("CreatePool.theMarketMustMatchTheCurrentMintWsolPair"));
        onMarketCreated(id, { marketId: id.toBase58(), baseMint: market.baseMint.toBase58(), quoteMint: market.quoteMint.toBase58(), baseVault: market.baseVault.toBase58(), quoteVault: market.quoteVault.toBase58() });
    };

    const create = async () => {
        if (!wallet.publicKey || !tokenMint || operation || ready || created) return;
        if (!workspaceOperation.begin()) return;
        setOperation('create');
        onBusyChange(true);
        setError('');
        let confirmed = false;
        try {
            const base = new PublicKey(tokenMint);
            if (base.equals(NATIVE_MINT)) throw new AppError(msg("CreatePool.theBaseTokenCannotBeWsol"));
            const [baseMint, quoteMint, program] = await Promise.all([
                getMint(connection, base), getMint(connection, NATIVE_MINT), connection.getAccountInfo(PROGRAM_IDS.OPENBOOK_MARKET)
            ]);
            if (!program?.executable) throw new AppError(msg("CreatePool.theDevnetOpenbookProgramIsUnavailable"));
            const { innerTransactions, address } = await MarketV2.makeCreateMarketInstructionSimple({
                connection, wallet: wallet.publicKey,
                baseInfo: { mint: base, decimals: baseMint.decimals },
                quoteInfo: { mint: NATIVE_MINT, decimals: quoteMint.decimals },
                dexProgramId: PROGRAM_IDS.OPENBOOK_MARKET,
                lotSize: 1, tickSize: 0.01, makeTxVersion: TxVersion.LEGACY
            });
            setManualId(address.marketId.toBase58());
            await executeInstructionBatches(connection, wallet, innerTransactions, onUpdate);
            confirmed = true; setCreated(true);
            await readMarket(address.marketId);
        } catch (cause) {
            const detail = confirmed
                ? msg("CreatePool.marketTransactionsConfirmedButReadingTheMarketFailedValidate", { v0: describeError(cause) })
                : describeError(cause);
            setError(detail);
            toast({ title: confirmed ? t("CreatePool.marketConfirmedReadRecoveryNeeded") : t("CreatePool.marketCreationNotCompleted"), description: formatMessage(t, detail), status: confirmed ? 'warning' : 'error', duration: 10000 });
        } finally { setOperation(null); onBusyChange(false); workspaceOperation.end(); }
    };

    const load = async () => {
        if (operation || ready || !manualId || !tokenMint) return;
        setOperation('load');
        onBusyChange(true);
        setError('');
        try { await readMarket(new PublicKey(manualId)); }
        catch (cause) {
            const detail = describeError(cause);
            setError(detail);
            toast({ title: t("CreatePool.marketValidationFailed"), description: formatMessage(t, detail), status: 'error' });
        } finally { setOperation(null); onBusyChange(false); }
    };

    return <MarketSetup ready={ready} operation={operation} canCreate={Boolean(tokenMint && wallet.publicKey && !created)} canLoad={Boolean(manualId && tokenMint)} manualId={manualId} onManualIdChange={setManualId} error={error} updates={updates} onCreate={create} onLoad={load} />;
};
