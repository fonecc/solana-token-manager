import { AppError, message as msg, describeError } from '../../i18n/message';
import { useT, useMessageState, useErrorMessage } from '../../i18n/useT';
import { useWorkspaceOperation } from '../learning/LearningContext';
import { useToast } from '@chakra-ui/react';
import { ACCOUNT_SIZE, MINT_SIZE, TOKEN_PROGRAM_ID, createAssociatedTokenAccountIdempotentInstruction, createInitializeMint2Instruction, getAssociatedTokenAddressSync } from '@solana/spl-token';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { Keypair, LAMPORTS_PER_SOL, SystemProgram, Transaction } from '@solana/web3.js';
import React, { useEffect, useState } from 'react';
import { assertDevnet } from '../../lib/solana/config';

import { executeTransaction } from '../../lib/solana/transactions';
import { useTransactionFeedback } from '../common/TransactionFeedback';
import { CreateTokenView } from './CreateTokenView';

export interface CreatedToken {
    mint: string;
    ata: string;
    signature: string;
    decimals: number;
}

export const CreateToken = ({ onCreated, onNext }: {
    onCreated?: (result: CreatedToken) => void;
    onNext?: (step: 'metadata' | 'mint', result: CreatedToken) => void;
}) => {
    const t = useT();
    const errorMessage = useErrorMessage();
    const { connection } = useConnection();
    const { publicKey, signTransaction } = useWallet();
    const [decimals, setDecimals] = useState('9');
    const [operation, setOperation] = useState<'create' | 'airdrop' | null>(null);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [balance, setBalance] = useState<number | null>(null);
    const [balanceError, setBalanceError] = useMessageState();
    const [result, setResult] = useState<CreatedToken | null>(null);
    const toast = useToast();
    const workspaceOperation = useWorkspaceOperation('create');
    const { updates, onUpdate } = useTransactionFeedback();

    const getBalance = async () => {
        if (!publicKey) return;
        setIsRefreshing(true);
        setBalanceError('');
        try {
            setBalance(await connection.getBalance(publicKey) / LAMPORTS_PER_SOL);
        } catch (error) {
            setBalanceError(msg("CreateToken.balanceReadFailed", { v0: describeError(error) }));
            throw error;
        } finally { setIsRefreshing(false); }
    };

    useEffect(() => {
        let active = true;
        setResult(null);
        setBalance(null);
        setBalanceError('');
        setIsRefreshing(Boolean(publicKey));
        if (publicKey) connection.getBalance(publicKey).then(value => {
            if (active) setBalance(value / LAMPORTS_PER_SOL);
        }).catch(error => {
            if (active) setBalanceError(msg("CreateToken.balanceReadFailed", { v0: describeError(error) }));
        }).finally(() => {
            if (active) setIsRefreshing(false);
        });
        return () => { active = false; };
    }, [publicKey, connection, setBalanceError]);

    const requestAirdrop = async () => {
        if (!publicKey || operation) return;
        if (!workspaceOperation.begin()) return;
        setOperation('airdrop');
        try {
            await assertDevnet(connection);
            const signature = await connection.requestAirdrop(publicKey, 2 * LAMPORTS_PER_SOL);
            // Faucet 交易不是本地构造的，按原 signature 查询，不重复请求。
            const status = await connection.getSignatureStatuses([signature], { searchTransactionHistory: true });
            if (status.value[0]?.err) throw new AppError(msg("CreateToken.airdropExecutionFailed"));
            toast({ title: t("CreateToken.airdropRequested"), description: t("CreateToken.refreshYourBalanceLaterTransaction", { v0: signature }), status: 'info', duration: 8000 });
            await getBalance().catch(() => {});
        } catch (error) {
            toast({ title: t("CreateToken.airdropRequestFailed"), description: errorMessage(error), status: 'error' });
        } finally { setOperation(null); workspaceOperation.end(); }
    };

    const handleCreateToken = async () => {
        if (!publicKey || !signTransaction || operation) return;
        if (!workspaceOperation.begin()) return;
        setOperation('create');
        setResult(null);
        try {
            if (!/^\d+$/.test(decimals) || Number(decimals) > 9) throw new AppError(msg("CreateToken.decimalsMustBeAnIntegerFrom0To9"));
            const mint = Keypair.generate();
            const ata = getAssociatedTokenAddressSync(mint.publicKey, publicKey);
            const [mintRent, ataRent, lamports] = await Promise.all([
                connection.getMinimumBalanceForRentExemption(MINT_SIZE),
                connection.getMinimumBalanceForRentExemption(ACCOUNT_SIZE),
                connection.getBalance(publicKey)
            ]);
            const transaction = new Transaction().add(
                SystemProgram.createAccount({ fromPubkey: publicKey, newAccountPubkey: mint.publicKey, space: MINT_SIZE, lamports: mintRent, programId: TOKEN_PROGRAM_ID }),
                createInitializeMint2Instruction(mint.publicKey, Number(decimals), publicKey, publicKey),
                createAssociatedTokenAccountIdempotentInstruction(publicKey, ata, publicKey, mint.publicKey)
            );
            const latest = await connection.getLatestBlockhash('confirmed');
            transaction.recentBlockhash = latest.blockhash;
            transaction.feePayer = publicKey;
            const fee = await connection.getFeeForMessage(transaction.compileMessage(), 'confirmed');
            if (fee.value === null) throw new AppError(msg("CreateToken.cannotEstimateTheFeeTryAgainLater"));
            if (lamports < mintRent + ataRent + fee.value) throw new AppError(msg("CreateToken.insufficientBalanceForMintAndAtaRentPlusTransaction"));
            const signature = await executeTransaction(connection, { publicKey, signTransaction }, transaction, [mint], onUpdate);
            const created = { mint: mint.publicKey.toBase58(), ata: ata.toBase58(), signature, decimals: Number(decimals) };
            setResult(created);
            onCreated?.(created);
            await getBalance().catch(() => {});
            toast({ title: t("CreateToken.mintAndAtaCreated"), status: 'success' });
        } catch (error) {
            toast({ title: t("CreateToken.creationNotCompleted"), description: errorMessage(error), status: 'error', duration: 8000 });
        } finally { setOperation(null); workspaceOperation.end(); }
    };

    return <CreateTokenView decimals={decimals} onDecimalsChange={setDecimals} balance={balance} balanceError={balanceError}
        isRefreshing={isRefreshing} operation={operation} walletReady={Boolean(publicKey && signTransaction)} result={result} updates={updates}
        onRefresh={() => { void getBalance().catch(() => {}); }} onAirdrop={() => { void requestAirdrop(); }}
        onCreate={() => { void handleCreateToken(); }} onNext={onNext} />;
};
