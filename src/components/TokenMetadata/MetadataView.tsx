import { useT } from '../../i18n/useT';
import { metadataFieldErrors } from '../../lib/solana/metadata';
import { addressError } from '../learning/inputValidation';
import React, { useRef, useState } from 'react';
import { AlertDialog, AlertDialogBody, AlertDialogContent, AlertDialogFooter, AlertDialogHeader, AlertDialogOverlay, Box, Button, Checkbox, Flex, FormControl, FormErrorMessage, FormHelperText, FormLabel, Input, Link, Text, VStack } from '@chakra-ui/react';
import type { TransactionUpdate } from '../../lib/solana/transactions';
import { AccountAddress } from '../common/AccountAddress';
import { TransactionFeedback } from '../common/TransactionFeedback';
import { LessonLayout, Notice, Panel } from '../learning/LessonLayout';
import { useLearning } from '../learning/LearningContext';

export interface MetadataViewProps {
    mint: string; name: string; symbol: string; uri: string; mode: number; allowUpdate: boolean; busy: boolean; error: string;
    result: { mint: string; name: string; symbol: string; mutable: boolean } | null;
    updates: TransactionUpdate[];
    onMintChange: (value: string) => void; onNameChange: (value: string) => void; onSymbolChange: (value: string) => void; onUriChange: (value: string) => void;
    onModeChange: (value: number) => void; onAllowUpdateChange: (value: boolean) => void; onSubmit: () => void;
}
export function MetadataView(props: MetadataViewProps) {
    const t = useT();
    const [confirmOpen, setConfirmOpen] = useState(false);
    const cancelRef = useRef<HTMLButtonElement>(null);
    const { navigate } = useLearning();
    const errors = { ...metadataFieldErrors(props.name, props.symbol, props.uri, t), mint: addressError(props.mint, t) };
    const invalid = Boolean(errors.mint || errors.name || errors.symbol || errors.uri);
    const bytes = (value: string) => new TextEncoder().encode(value).length;
    return <LessonLayout id="metadata" feedback={<TransactionFeedback updates={props.updates} />} result={props.result && <Panel title={t("TokenMetadata.metadataTransactionConfirmed")}>
        <Text fontSize="sm" color="gray.500" mb={3}>{t("TokenMetadata.resultSummary", { name: props.result.name, symbol: props.result.symbol, state: props.result.mutable ? t("TokenMetadata.futureUpdatesAllowed") : t("TokenMetadata.permanentlyLocked") })}</Text>
        <AccountAddress label={t("TokenMetadata.mintUpdatedInThisOperation")} value={props.result.mint} compact />
        <Button variant="outline" size="sm" mt={4} onClick={() => navigate('mint', props.result!.mint)}>{t("TokenMetadata.nextMintASmallAmount")}</Button>
    </Panel>}>
        <Panel title={t("TokenMetadata.nameSymbolAndOptionalImageMetadata")}>
            <VStack as="fieldset" disabled={props.busy} align="stretch" spacing={5}>
                <Flex gap={2} bg="gray.50" borderRadius="lg" p={1} role="group" aria-label={t("TokenMetadata.metadataOperationMode")}>{[t("TokenMetadata.firstTimeSetup"), t("TokenMetadata.updateExisting")].map((label, index) => <Button key={label} flex={1} size="sm" variant={props.mode === index ? 'solid' : 'ghost'} aria-pressed={props.mode === index} onClick={() => props.onModeChange(index)} isDisabled={props.busy}>{label}</Button>)}</Flex>
                <Text fontSize="xs" color="gray.500">{props.mode === 0 ? t("TokenMetadata.forAMintWithoutMetadataYetRequiresMintAuthority") : t("TokenMetadata.updatesExistingMutableMetadataOnlyRequiresUpdateAuthorityOther")}</Text>
                {props.error && <Notice tone="error">{props.error}</Notice>}
                <FormControl isRequired isInvalid={Boolean(props.mint && errors.mint)}><FormLabel htmlFor="metadata-mint">{t("BurnToken.tokenIdentifierMintAddress")}</FormLabel><Input aria-errormessage={errors.mint ? 'metadata-mint-error' : undefined} id="metadata-mint" value={props.mint} onChange={e => props.onMintChange(e.target.value)} placeholder={t("TokenMetadata.pasteAnExistingMintAddress")} />{props.mint && errors.mint && <FormErrorMessage id="metadata-mint-error">{errors.mint}</FormErrorMessage>}</FormControl>
                <FormControl isRequired isInvalid={Boolean(props.name && errors.name)}><FormLabel htmlFor="metadata-name">{t("TokenMetadata.tokenName")}</FormLabel><Input aria-errormessage={errors.name ? 'metadata-name-error' : undefined} id="metadata-name" value={props.name} onChange={e => props.onNameChange(e.target.value)} placeholder={t("TokenMetadata.forExampleMyLearningToken")} aria-describedby="metadata-name-help" />{props.name && errors.name && <FormErrorMessage id="metadata-name-error">{errors.name}</FormErrorMessage>}<FormHelperText id="metadata-name-help">{t("TokenMetadata.nameByteHelp", { count: bytes(props.name) })}</FormHelperText></FormControl>
                <FormControl isRequired isInvalid={Boolean(props.symbol && errors.symbol)}><FormLabel htmlFor="metadata-symbol">{t("TokenMetadata.tokenSymbol")}</FormLabel><Input aria-errormessage={errors.symbol ? 'metadata-symbol-error' : undefined} id="metadata-symbol" value={props.symbol} onChange={e => props.onSymbolChange(e.target.value)} placeholder={t("TokenMetadata.forExampleLearn")} aria-describedby="metadata-symbol-help" />{props.symbol && errors.symbol && <FormErrorMessage id="metadata-symbol-error">{errors.symbol}</FormErrorMessage>}<FormHelperText id="metadata-symbol-help">{t("TokenMetadata.symbolByteHelp", { count: bytes(props.symbol) })}</FormHelperText></FormControl>
                <FormControl isInvalid={Boolean(props.uri && errors.uri)}><FormLabel htmlFor="metadata-uri">{t("TokenMetadata.jsonMetadataUrl")}<Text as="span" fontWeight="normal" color="gray.400">{t("MintToken.optional")}</Text></FormLabel><Input aria-errormessage={errors.uri ? 'metadata-uri-error' : undefined} id="metadata-uri" value={props.uri} onChange={e => props.onUriChange(e.target.value)} placeholder={t("TokenMetadata.httpsOrIpfs")} aria-describedby="metadata-uri-help" />{props.uri && errors.uri && <FormErrorMessage id="metadata-uri-error">{errors.uri}</FormErrorMessage>}<FormHelperText id="metadata-uri-help">{t("TokenMetadata.uriByteHelp", { count: bytes(props.uri) })}<Link href="/token-metadata.example.json" isExternal color="purple.600">{t("TokenMetadata.viewJsonExample")}</Link></FormHelperText></FormControl>
                <Box bg={props.allowUpdate ? 'gray.50' : 'orange.50'} p={4} borderRadius="lg"><Checkbox isChecked={props.allowUpdate} onChange={e => props.onAllowUpdateChange(e.target.checked)}>{t("TokenMetadata.allowFutureMetadataUpdates")}</Checkbox><Text fontSize="xs" color={props.allowUpdate ? 'gray.500' : 'orange.900'} mt={2}>{props.allowUpdate ? t("TokenMetadata.keepThisEnabledForTheBasicLessonSoYou") : t("TokenMetadata.turningThisOffPermanentlyLocksTheMetadataEvenIf")}</Text></Box>
                <Button onClick={() => props.allowUpdate ? props.onSubmit() : setConfirmOpen(true)} isLoading={props.busy} loadingText={t("TokenMetadata.processingCheckYourWallet")} isDisabled={!props.mint || !props.name.trim() || !props.symbol.trim() || props.busy || invalid}>{props.mode === 0 ? t("TokenMetadata.confirmMetadataCreation") : t("TokenMetadata.confirmMetadataUpdate")}</Button>
            </VStack>
        </Panel>
        <AlertDialog isOpen={confirmOpen} leastDestructiveRef={cancelRef} onClose={() => setConfirmOpen(false)} isCentered><AlertDialogOverlay /><AlertDialogContent><AlertDialogHeader>{t("TokenMetadata.permanentlyLockThisTokenSMetadata")}</AlertDialogHeader><AlertDialogBody><AccountAddress label={t("TokenMetadata.mintToLock")} value={props.mint} compact /><Box mt={3}><Notice tone="warning">{t("TokenMetadata.theNameSymbolAndUriWillNoLongerBe")}</Notice></Box></AlertDialogBody><AlertDialogFooter><Button ref={cancelRef} variant="ghost" onClick={() => setConfirmOpen(false)}>{t("BurnToken.backToReview")}</Button><Button colorScheme="red" onClick={() => { setConfirmOpen(false); props.onSubmit(); }}>{t("TokenMetadata.confirmPermanentLockAndSubmit")}</Button></AlertDialogFooter></AlertDialogContent></AlertDialog>
    </LessonLayout>;
}
