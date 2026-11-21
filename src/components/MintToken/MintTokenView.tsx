import { useT } from '../../i18n/useT';
import { addressError, positiveDecimalError } from '../learning/inputValidation';
import React from 'react';
import { Button, FormControl, FormErrorMessage, FormHelperText, FormLabel, Input, Text, VStack } from '@chakra-ui/react';
import type { TransactionUpdate } from '../../lib/solana/transactions';
import { AccountAddress } from '../common/AccountAddress';
import { TransactionFeedback } from '../common/TransactionFeedback';
import { LessonLayout, Notice, Panel } from '../learning/LessonLayout';
import { useLearning } from '../learning/LearningContext';

export interface MintTokenViewProps {
    mint: string; recipient: string; amount: string; walletAddress: string; busy: boolean; error: string;
    updates: TransactionUpdate[];
    result: { mint: string; recipient: string; amount: string } | null;
    onMintChange: (value: string) => void; onRecipientChange: (value: string) => void; onAmountChange: (value: string) => void; onSubmit: () => void;
}
export function MintTokenView(props: MintTokenViewProps) {
    const t = useT();
    const { navigate } = useLearning();
    const errors = { mint: addressError(props.mint, t), recipient: addressError(props.recipient, t), amount: positiveDecimalError(props.amount, t) };
    return <LessonLayout id="mint" feedback={<TransactionFeedback updates={props.updates} />} result={props.result && <Panel title={t("MintToken.mintTransactionConfirmed")}>
        <Text fontSize="sm" color="gray.500" mb={3}>{t("MintToken.issuanceResult", { amount: props.result.amount })}</Text>
        <VStack align="stretch" spacing={3}><AccountAddress label={t("MintToken.mintUsedForThisIssuance")} value={props.result.mint} compact /><AccountAddress label={t("MintToken.recipientWallet")} value={props.result.recipient} compact /></VStack>
        <Button mt={4} size="sm" variant="outline" onClick={() => navigate('assets', props.result!.mint)}>{t("MintToken.viewAssetsAndPracticeATransfer")}</Button>
    </Panel>}>
        <Panel title={t("MintToken.enterTheNewIssuanceAmount")} description={t("MintToken.theDefaultRecipientIsYouThisIsAnAdditional")}>
            <VStack as="fieldset" disabled={props.busy} align="stretch" spacing={5} minW={0}>
                {props.error && <Notice tone="error">{props.error}</Notice>}
                <FormControl isRequired isInvalid={Boolean(errors.mint)}><FormLabel htmlFor="mint-token-mint">{t("BurnToken.tokenIdentifierMintAddress")}</FormLabel><Input id="mint-token-mint" value={props.mint} onChange={e => props.onMintChange(e.target.value)} placeholder={t("MintToken.pasteTheMintAddressToIssueTokens")} aria-describedby={`mint-token-mint-help${errors.mint ? ' mint-token-mint-error' : ''}`} />{errors.mint && <FormErrorMessage id="mint-token-mint-error">{errors.mint}</FormErrorMessage>}<FormHelperText id="mint-token-mint-help">{t("MintToken.notAWalletAddressYourCurrentMintAuthorityIs")}</FormHelperText></FormControl>
                <FormControl isInvalid={Boolean(errors.recipient)}><FormLabel htmlFor="mint-token-recipient">{t("MintToken.recipientWalletAddress")}<Text as="span" fontWeight="normal" color="gray.400">{t("MintToken.optional")}</Text></FormLabel><Input id="mint-token-recipient" value={props.recipient} onChange={e => props.onRecipientChange(e.target.value)} placeholder={t("MintToken.leaveBlankToSendToYourCurrentWallet")} aria-describedby={`mint-token-recipient-help${errors.recipient ? ' mint-token-recipient-error' : ''}`} />{errors.recipient && <FormErrorMessage id="mint-token-recipient-error">{errors.recipient}</FormErrorMessage>}<FormHelperText id="mint-token-recipient-help">{t("MintToken.theAppDerivesTheRecipientSAtaAndCreates")}</FormHelperText></FormControl>
                <FormControl isRequired isInvalid={Boolean(errors.amount)}><FormLabel htmlFor="mint-token-amount">{t("MintToken.tokensToMintNow")}</FormLabel><Input id="mint-token-amount" inputMode="decimal" value={props.amount} onChange={e => props.onAmountChange(e.target.value)} placeholder={t("MintToken.forExample10")} aria-describedby={`mint-token-amount-help${errors.amount ? ' mint-token-amount-error' : ''}`} />{errors.amount && <FormErrorMessage id="mint-token-amount-error">{errors.amount}</FormErrorMessage>}<FormHelperText id="mint-token-amount-help">{t("MintToken.validatedUsingTheMintSActualDecimalsTheseTokens")}</FormHelperText></FormControl>
                {errors.mint || errors.recipient || errors.amount
                    ? <Notice tone="warning">{t("MintToken.fixTheHighlightedInputsBeforeReviewingThisIssuance")}</Notice>
                    : <Notice>{t("MintToken.issuanceSummary", { amount: props.amount || '—', recipient: props.recipient ? t("MintToken.theRecipientAbove") : t("MintToken.yourCurrentWallet") })}</Notice>}
                <Button onClick={props.onSubmit} isLoading={props.busy} loadingText={t("MintToken.mintingCheckYourWallet")} isDisabled={!props.mint || !props.amount || !props.walletAddress || props.busy || Boolean(errors.mint || errors.recipient || errors.amount)}>{t("MintToken.reviewAndMintTokens")}</Button>
            </VStack>
        </Panel>
    </LessonLayout>;
}
