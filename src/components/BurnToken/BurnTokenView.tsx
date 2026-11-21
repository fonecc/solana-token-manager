import { useT } from '../../i18n/useT';
import React, { useRef, useState } from 'react';
import { AlertDialog, AlertDialogBody, AlertDialogContent, AlertDialogFooter, AlertDialogHeader, AlertDialogOverlay, Box, Button, Flex, FormControl, FormHelperText, FormLabel, Input, Text, VStack } from '@chakra-ui/react';
import { positiveTokenAmount, parseTokenAmount } from '../../lib/solana/amounts';
import type { TransactionUpdate } from '../../lib/solana/transactions';
import { AccountAddress } from '../common/AccountAddress';
import { TransactionFeedback } from '../common/TransactionFeedback';
import { LessonLayout, Notice, Panel } from '../learning/LessonLayout';

export interface BurnInfo { balance: string; decimals: number; frozen: boolean; ata: string; }
export function canBurnAmount(amount: string, info: BurnInfo | null) {
    if (!info || info.frozen) return false;
    try { return positiveTokenAmount(amount, info.decimals) <= parseTokenAmount(info.balance, info.decimals); } catch { return false; }
}
export interface BurnTokenViewProps {
    mint: string; amount: string; info: BurnInfo | null; loading: boolean; busy: boolean; error: string; warning: string;
    result: { mint: string; amount: string } | null; updates: TransactionUpdate[];
    onMintChange: (value: string) => void; onAmountChange: (value: string) => void; onLoad: () => void; onSubmit: () => void;
}
export function BurnTokenView(props: BurnTokenViewProps) {
    const t = useT();
    const [confirmOpen, setConfirmOpen] = useState(false);
    const cancelRef = useRef<HTMLButtonElement>(null);
    const valid = canBurnAmount(props.amount, props.info);
    return <LessonLayout id="burn" feedback={<TransactionFeedback updates={props.updates} />} result={props.result && <Panel title={t("BurnToken.burnTransactionConfirmed")}><Text fontSize="sm" mb={3}>{t("BurnToken.burnResult", { amount: props.result.amount })}</Text><AccountAddress label={t("BurnToken.mintForThisBurn")} value={props.result.mint} compact /></Panel>}>
        <VStack align="stretch" spacing={4}>
            {props.error && <Notice tone="error">{props.error}</Notice>}{props.warning && <Notice tone="warning">{props.warning}</Notice>}
            <Panel title={t("BurnToken.1ReadYourBurnableBalance")} description={t("BurnToken.thisPageBurnsOnlyTokensInYourCurrentWallet")}>
                <Box as="fieldset" disabled={props.busy}>
                    <FormControl><FormLabel htmlFor="burn-mint">{t("BurnToken.tokenIdentifierMintAddress")}</FormLabel><Input id="burn-mint" value={props.mint} onChange={e => props.onMintChange(e.target.value)} placeholder={t("BurnToken.pasteTheMintAddressToBurn")} /></FormControl>
                    <Button variant="outline" size="sm" mt={3} onClick={props.onLoad} isLoading={props.loading} isDisabled={!props.mint || props.busy}>{t("BurnToken.readAtaBalance")}</Button>
                    <Box mt={4} bg="gray.50" p={4} borderRadius="lg"><Text fontSize="xs" color="gray.500">{props.loading ? t("BurnToken.reading") : props.info ? t("BurnToken.loadedDecimals", { v0: props.info.decimals }) : t("BurnToken.availableBalanceNotReadYet")}</Text><Text fontSize="xl" fontWeight="semibold" overflowWrap="anywhere" mt={1}>{props.info ? t("BurnToken.tokens", { v0: props.info.balance }) : '—'}</Text></Box>
                    {props.info?.frozen && <Box mt={3}><Notice tone="warning">{t("BurnToken.yourAtaIsFrozenThawItBeforeBurning")}</Notice></Box>}
                </Box>
            </Panel>
            <Panel title={t("BurnToken.2EnterASmallTestAmount")} description={t("BurnToken.burningIsIrreversibleItDoesNotDeleteTheMint")}>
                <VStack as="fieldset" disabled={props.busy} align="stretch" spacing={4}>
                    <FormControl><FormLabel htmlFor="burn-amount">{t("BurnToken.amountToBurn")}</FormLabel><Input id="burn-amount" value={props.amount} onChange={e => props.onAmountChange(e.target.value)} inputMode="decimal" placeholder={t("BurnToken.startWithASmallTestAmount")} aria-describedby="burn-amount-help" isDisabled={!props.info || props.busy} /><FormHelperText id="burn-amount-help">{props.amount && !valid ? t("BurnToken.enterAPositiveAmountWithinYourBalanceAndThe") : t("BurnToken.yourBalanceAndTotalSupplyDecreaseByTheSame")}</FormHelperText></FormControl>
                    <Flex justify="flex-end"><Button size="xs" variant="ghost" isDisabled={!props.info || props.busy} onClick={() => props.onAmountChange(props.info!.balance)}>{t("BurnToken.useFullBalance")}</Button></Flex>
                    <Button colorScheme="red" variant="outline" onClick={() => setConfirmOpen(true)} isLoading={props.busy} loadingText={t("BurnToken.burningCheckYourWallet")} isDisabled={!valid || props.loading || props.busy}>{t("BurnToken.reviewAndConfirmBurn")}</Button>
                </VStack>
            </Panel>
        </VStack>
        <AlertDialog isOpen={confirmOpen} leastDestructiveRef={cancelRef} onClose={() => setConfirmOpen(false)} isCentered><AlertDialogOverlay /><AlertDialogContent><AlertDialogHeader>{t("BurnToken.burnTitle", { amount: props.amount })}</AlertDialogHeader><AlertDialogBody><AccountAddress label={t("BurnToken.mintToBurn")} value={props.mint} compact /><Box mt={3}><Notice tone="warning">{t("BurnToken.burnWarning", { amount: props.amount })}</Notice></Box></AlertDialogBody><AlertDialogFooter><Button ref={cancelRef} variant="ghost" onClick={() => setConfirmOpen(false)}>{t("BurnToken.backToReview")}</Button><Button colorScheme="red" onClick={() => { setConfirmOpen(false); props.onSubmit(); }} isDisabled={!valid}>{t("BurnToken.confirmPermanentBurnAndSign")}</Button></AlertDialogFooter></AlertDialogContent></AlertDialog>
    </LessonLayout>;
}
