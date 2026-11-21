import { AppError, message as msg, describeError, formatMessage } from '../../i18n/message';
import { useT, useMessageState } from '../../i18n/useT';
import { useWorkspaceOperation } from '../learning/LearningContext';
import { useToast } from '@chakra-ui/react';
import { Liquidity,MARKET_STATE_LAYOUT_V3,TxVersion } from '@raydium-io/raydium-sdk';
import { NATIVE_MINT,getMint } from '@solana/spl-token';
import { useConnection,useWallet } from '@solana/wallet-adapter-react';
import { PublicKey } from '@solana/web3.js';
import BN from 'bn.js';
import { useState } from 'react';
import { amountToBN } from '../../lib/solana/amounts';
import { POOL_FEE_DESTINATION,PROGRAM_IDS } from '../../lib/solana/protocol';
import { walletTokenAccounts } from '../../lib/solana/defi';
import { executeInstructionBatches } from '../../lib/solana/transactions';
import { useTransactionFeedback } from '../common/TransactionFeedback';
import { PoolConfirmation } from './PoolConfirmation';
import { type PoolDetailsData } from './types';

interface PoolCreatorProps {
    marketId: PublicKey;
    tokenMint: string;
    baseAmount: string;
    quoteAmount: string;
    done: boolean;
    onBusyChange: (busy: boolean) => void;
    onPoolCreated: (details: PoolDetailsData) => void;
}

export const PoolCreator = ({ marketId, tokenMint, baseAmount, quoteAmount, done, onBusyChange, onPoolCreated }: PoolCreatorProps) => {
    const t = useT();
    const { connection } = useConnection();
    const wallet = useWallet();
    const toast = useToast();
    const { updates, onUpdate } = useTransactionFeedback();
    const workspaceOperation = useWorkspaceOperation('pool');
    const [busy, setBusy] = useState(false);
    const [error, setError] = useMessageState();
    const create = async () => {
        if (!wallet.publicKey || busy || done) return;
        if (!workspaceOperation.begin()) return;
        setBusy(true);
        onBusyChange(true);
        setError('');
        try {
            const base = new PublicKey(tokenMint);
            const [baseInfo, quoteInfo, market, program, accounts] = await Promise.all([
                getMint(connection, base), getMint(connection, NATIVE_MINT), connection.getAccountInfo(marketId),
                connection.getAccountInfo(PROGRAM_IDS.AmmV4), walletTokenAccounts(connection, wallet.publicKey)
            ]);
            if (!program?.executable) throw new AppError(msg("CreatePool.theDevnetAmmV4ProgramIsUnavailable"));
            if (!market || !market.owner.equals(PROGRAM_IDS.OPENBOOK_MARKET) || market.data.length !== MARKET_STATE_LAYOUT_V3.span) throw new AppError(msg("CreatePool.invalidOpenbookMarket"));
            const marketState = MARKET_STATE_LAYOUT_V3.decode(market.data);
            if (!marketState.baseMint.equals(base) || !marketState.quoteMint.equals(NATIVE_MINT)) throw new AppError(msg("CreatePool.theMarketDoesNotMatchTheTokensResetAnd"));
            const baseRaw = amountToBN(baseAmount, baseInfo.decimals);
            const quoteRaw = amountToBN(quoteAmount, quoteInfo.decimals);
            const available = accounts.filter(account => account.accountInfo.mint.equals(base)).reduce((sum, account) => sum.add(account.accountInfo.amount), new BN(0));
            if (baseRaw.gt(available)) throw new AppError(msg("CreatePool.insufficientBaseTokenBalance"));
            // SOL 租金、协议费及账户余额由 SDK 和 preflight 校验，不使用固定余额阈值。
            const { innerTransactions, address } = await Liquidity.makeCreatePoolV4InstructionV2Simple({
                connection, programId: PROGRAM_IDS.AmmV4,
                marketInfo: { programId: PROGRAM_IDS.OPENBOOK_MARKET, marketId },
                associatedOnly: false,
                ownerInfo: { feePayer: wallet.publicKey, wallet: wallet.publicKey, tokenAccounts: accounts, useSOLBalance: true },
                baseMintInfo: { mint: base, decimals: baseInfo.decimals },
                quoteMintInfo: { mint: NATIVE_MINT, decimals: quoteInfo.decimals },
                startTime: new BN(Math.floor(Date.now() / 1000)), baseAmount: baseRaw, quoteAmount: quoteRaw,
                checkCreateATAOwner: true, makeTxVersion: TxVersion.LEGACY,
                feeDestinationId: new PublicKey(POOL_FEE_DESTINATION)
            });
            await executeInstructionBatches(connection, wallet, innerTransactions, onUpdate);
            const created: PoolDetailsData = {
                marketId: marketId.toBase58(), poolId: address.ammId.toBase58(), lpMint: address.lpMint.toBase58(),
                baseVault: address.coinVault.toBase58(), quoteVault: address.pcVault.toBase58(), baseAmount, quoteAmount
            };
            onPoolCreated(created);
            toast({ title: t("CreatePool.liquidityPoolConfirmed"), status: 'success' });
        } catch (cause) {
            const detail = describeError(cause);
            setError(detail);
            toast({ title: t("CreatePool.poolCreationNotCompleted"), description: formatMessage(t, detail), status: 'error', duration: 10000 });
        } finally { setBusy(false); onBusyChange(false); workspaceOperation.end(); }
    };
    return <PoolConfirmation baseAmount={baseAmount} quoteAmount={quoteAmount} busy={busy} walletReady={Boolean(wallet.publicKey)} done={done} error={error} updates={updates} onCreate={create} />;
};
