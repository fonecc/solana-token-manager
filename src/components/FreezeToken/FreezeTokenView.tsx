import { useT } from '../../i18n/useT';
import React, { useRef, useState } from 'react';
import { AlertDialog, AlertDialogBody, AlertDialogContent, AlertDialogFooter, AlertDialogHeader, AlertDialogOverlay, Box, Button, Flex, FormControl, FormHelperText, FormLabel, Input, Text, VStack } from '@chakra-ui/react';
import type { TransactionUpdate } from '../../lib/solana/transactions';
import { TransactionFeedback } from '../common/TransactionFeedback';
import { AccountAddress } from '../common/AccountAddress';
import { LessonLayout, Notice, Panel } from '../learning/LessonLayout';

export type TargetState = 'idle' | 'loading' | 'missing' | 'active' | 'frozen' | 'error';
export interface FreezeTokenViewProps {
    mint: string; target: string; mintLoading: boolean; authority: boolean | null; targetState: TargetState; targetAta: string;
    operation: 'freeze' | 'thaw' | null; error: string; refreshWarning: string; updates: TransactionUpdate[];
    onMintChange: (value: string) => void; onTargetChange: (value: string) => void; onLoadMint: () => void; onCheckTarget: () => void; onSubmit: (thaw: boolean) => void;
}
export function FreezeTokenView(props: FreezeTokenViewProps) {
    const t = useT();
    const [confirmOpen, setConfirmOpen] = useState(false);
    const cancelRef = useRef<HTMLButtonElement>(null);
    const busy = props.operation !== null;
    const stateText: Record<TargetState, string> = { idle: t("FreezeToken.targetAtaNotCheckedYet"), loading: t("FreezeToken.readingTargetAta"), missing: t("FreezeToken.targetAtaDoesNotExist"), active: t("FreezeToken.checkedActiveNotFrozen"), frozen: t("FreezeToken.checkedFrozen"), error: t("FreezeToken.checkFailedStateUnknown") };
    return <LessonLayout id="freeze" feedback={<TransactionFeedback updates={props.updates} />}>
        <VStack align="stretch" spacing={4}>
            {props.error && <Notice tone="error">{props.error}</Notice>}
            {props.refreshWarning && <Notice tone="warning">{props.refreshWarning}</Notice>}
            <Panel title={t("FreezeToken.1ReadTheTokenAndAuthority")} description={t("FreezeToken.readingDoesNotRequireASignatureCheckYourFreeze")}>
                <Box as="fieldset" disabled={busy}>
                    <FormControl><FormLabel htmlFor="freeze-mint">{t("BurnToken.tokenIdentifierMintAddress")}</FormLabel><Input id="freeze-mint" value={props.mint} onChange={e => props.onMintChange(e.target.value)} placeholder={t("FreezeToken.mintAddressToManage")} /></FormControl>
                    <Button size="sm" variant="outline" mt={3} onClick={props.onLoadMint} isLoading={props.mintLoading} isDisabled={!props.mint || busy}>{t("FreezeToken.readMintAndAuthority")}</Button>
                    <Text fontSize="sm" color={props.authority === false ? 'orange.700' : 'gray.500'} mt={4}>{props.mintLoading ? t("FreezeToken.readingAuthority") : props.authority === null ? t("FreezeToken.notReadYetYourAuthorityIsUnknown") : props.authority ? t("FreezeToken.readThisWalletHasFreezeAndThawAuthority") : t("FreezeToken.readThisWalletHasNoFreezeAuthorityAndCannot")}</Text>
                </Box>
            </Panel>
            <Panel title={t("FreezeToken.2CheckTheTargetWalletSAta")} description={t("FreezeToken.enterAWalletAddressTheAppDerivesItsAssociated")}>
                <VStack as="fieldset" disabled={busy} align="stretch" spacing={4}>
                    <FormControl><FormLabel htmlFor="freeze-target">{t("FreezeToken.targetWalletAddress")}</FormLabel><Input id="freeze-target" value={props.target} onChange={e => props.onTargetChange(e.target.value)} placeholder={t("FreezeToken.notAMintOrAtaAddress")} aria-describedby="freeze-target-help" /><FormHelperText id="freeze-target-help">{t("FreezeToken.onlyThisWalletSAtaForTheSelectedMint")}</FormHelperText></FormControl>
                    <Button size="sm" variant="outline" alignSelf="start" onClick={props.onCheckTarget} isLoading={props.targetState === 'loading'} isDisabled={!props.target || props.authority === null || props.mintLoading || busy}>{t("FreezeToken.checkTargetAta")}</Button>
                    <Notice tone={props.targetState === 'frozen' ? 'warning' : 'info'}>{stateText[props.targetState]}{props.targetState === 'missing' && t("FreezeToken.thisInterfaceDoesNotFreezeANonexistentAtaHave")}</Notice>
                    {props.targetAta && <AccountAddress label={t("FreezeToken.validatedTargetAta")} value={props.targetAta} compact />}
                    <Flex gap={3} wrap="wrap"><Button onClick={() => setConfirmOpen(true)} isLoading={props.operation === 'freeze'} loadingText={t("FreezeToken.freezing")} isDisabled={!props.authority || props.targetState !== 'active' || busy}>{t("FreezeToken.freezeThisAta")}</Button><Button variant="outline" onClick={() => props.onSubmit(true)} isLoading={props.operation === 'thaw'} loadingText={t("FreezeToken.thawing")} isDisabled={!props.authority || props.targetState !== 'frozen' || busy}>{t("FreezeToken.thawThisAta")}</Button></Flex>
                    <Text fontSize="xs" color="gray.500">{t("FreezeToken.freezingRestrictsTokenMovementFromThisAtaWithoutChanging")}</Text>
                </VStack>
            </Panel>
        </VStack>
        <AlertDialog isOpen={confirmOpen} leastDestructiveRef={cancelRef} onClose={() => setConfirmOpen(false)} isCentered><AlertDialogOverlay /><AlertDialogContent><AlertDialogHeader>{t("FreezeToken.freezeThisTokenAccount")}</AlertDialogHeader><AlertDialogBody><VStack align="stretch" spacing={3}><AccountAddress label={t("FreezeToken.tokenMint")} value={props.mint} compact /><AccountAddress label={t("FreezeToken.targetWallet")} value={props.target} compact /><Notice tone="warning">{t("FreezeToken.thisFreezesTheWalletSAtaForTheMint")}</Notice></VStack></AlertDialogBody><AlertDialogFooter><Button ref={cancelRef} variant="ghost" onClick={() => setConfirmOpen(false)}>{t("BurnToken.backToReview")}</Button><Button onClick={() => { setConfirmOpen(false); props.onSubmit(false); }}>{t("FreezeToken.confirmFreezeAndRequestSignature")}</Button></AlertDialogFooter></AlertDialogContent></AlertDialog>
    </LessonLayout>;
}
