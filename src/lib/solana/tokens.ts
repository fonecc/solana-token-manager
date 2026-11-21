import { AppError, message } from '../../i18n/message';
import { createAssociatedTokenAccountIdempotentInstruction, createBurnCheckedInstruction, createMintToCheckedInstruction, createTransferCheckedInstruction, createFreezeAccountInstruction, createThawAccountInstruction, getAccount, getAssociatedTokenAddressSync, getMint, TokenAccountNotFoundError } from '@solana/spl-token';
import { PublicKey,Transaction,type Connection } from '@solana/web3.js';
import { positiveTokenAmount } from './amounts';

export async function buildMintTransaction(connection: Connection, mint: PublicKey, authority: PublicKey, recipient: PublicKey, input: string) {
    const info = await getMint(connection, mint);
    if (!info.mintAuthority?.equals(authority)) throw new AppError(message("tokens.thisWalletHasNoMintAuthority"));
    const amount = positiveTokenAmount(input, info.decimals);
    const ata = getAssociatedTokenAddressSync(mint, recipient);
    return new Transaction().add(
        createAssociatedTokenAccountIdempotentInstruction(authority, ata, recipient, mint),
        createMintToCheckedInstruction(mint, ata, authority, amount, info.decimals)
    );
}

export async function buildTransferTransaction(connection: Connection, mint: PublicKey, owner: PublicKey, recipient: PublicKey, input: string) {
    const info = await getMint(connection, mint);
    const amount = positiveTokenAmount(input, info.decimals);
    const source = getAssociatedTokenAddressSync(mint, owner);
    const sourceInfo = await getAccount(connection, source);
    if (sourceInfo.isFrozen) throw new AppError(message("tokens.theSendingAtaIsFrozen"));
    if (amount > sourceInfo.amount) throw new AppError(message("tokens.amountExceedsTheSendingAtaBalanceTheListAggregates"));
    const destination = getAssociatedTokenAddressSync(mint, recipient);
    return new Transaction().add(
        createAssociatedTokenAccountIdempotentInstruction(owner, destination, recipient, mint),
        createTransferCheckedInstruction(source, mint, destination, owner, amount, info.decimals)
    );
}

export async function buildBurnTransaction(connection: Connection, mint: PublicKey, owner: PublicKey, input: string) {
    const info = await getMint(connection, mint);
    const amount = positiveTokenAmount(input, info.decimals);
    const ata = getAssociatedTokenAddressSync(mint, owner);
    const sourceInfo = await getAccount(connection, ata);
    if (sourceInfo.isFrozen) throw new AppError(message("tokens.ataIsFrozenThawItFirst"));
    if (amount > sourceInfo.amount) throw new AppError(message("tokens.burnAmountExceedsTheAtaBalance"));
    return new Transaction().add(createBurnCheckedInstruction(ata, mint, owner, amount, info.decimals));
}


export async function buildFreezeTransaction(connection: Connection, mint: PublicKey, authority: PublicKey, targetOwner: PublicKey, thaw: boolean) {
    const info = await getMint(connection, mint);
    if (!info.freezeAuthority?.equals(authority)) throw new AppError(message("tokens.thisWalletHasNoFreezeThawAuthority"));
    const ata = getAssociatedTokenAddressSync(mint, targetOwner);
    const transaction = new Transaction();
    try {
        const account = await getAccount(connection, ata);
        if (!account.mint.equals(mint) || !account.owner.equals(targetOwner)) throw new AppError(message("tokens.targetAtaDoesNotMatchTheMintOwner"));
        if (thaw && !account.isFrozen) throw new AppError(message("tokens.targetAtaIsNotFrozen"));
        if (!thaw && account.isFrozen) throw new AppError(message("tokens.targetAtaIsAlreadyFrozen"));
    } catch (error) {
        if (!(error instanceof TokenAccountNotFoundError)) throw error;
        if (thaw) throw new AppError(message("FreezeToken.targetAtaDoesNotExist"));
        transaction.add(createAssociatedTokenAccountIdempotentInstruction(authority, ata, targetOwner, mint));
    }
    return transaction.add(thaw ? createThawAccountInstruction(ata, mint, authority) : createFreezeAccountInstruction(ata, mint, authority));
}
