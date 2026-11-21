import { useT } from '../../i18n/useT';
import React from 'react';
import { ArrowForwardIcon, RepeatIcon } from '@chakra-ui/icons';
import { Badge, Box, Button, Flex, FormControl, FormErrorMessage, FormHelperText, FormLabel, Heading, HStack, NumberInput, NumberInputField, SimpleGrid, Text, VStack } from '@chakra-ui/react';
import type { CreatedToken } from './index';
import type { TransactionUpdate } from '../../lib/solana/transactions';
import { AccountAddress } from '../common/AccountAddress';
import { TransactionFeedback } from '../common/TransactionFeedback';
import { LessonLayout, Notice, Panel } from '../learning/LessonLayout';

export interface CreateTokenViewProps {
    decimals: string;
    onDecimalsChange: (value: string) => void;
    balance: number | null;
    balanceError?: string;
    isRefreshing: boolean;
    operation: 'create' | 'airdrop' | null;
    walletReady: boolean;
    result: CreatedToken | null;
    updates: TransactionUpdate[];
    onRefresh: () => void;
    onAirdrop: () => void;
    onCreate: () => void;
    onNext?: (step: 'metadata' | 'mint', result: CreatedToken) => void;
}
export function CreateTokenView({ decimals, onDecimalsChange, balance, balanceError, isRefreshing, operation, walletReady, result, updates, onRefresh, onAirdrop, onCreate, onNext }: CreateTokenViewProps) {
    const t = useT();
    const validDecimals = /^\d+$/.test(decimals) && Number(decimals) <= 9;
    const busy = operation !== null;
    return <LessonLayout id="create" feedback={<TransactionFeedback updates={updates} />} result={result && <Panel title={t("CreateToken.accountsCreatedSetANameAndSymbolNext")}>
        <Text fontSize="sm" color="gray.500" mb={4}>{t("CreateToken.creationSummary", { decimals: result.decimals })}</Text>
        <SimpleGrid columns={{ base: 1, md: 2 }} spacing={3}>
            <AccountAddress label={t("CreateToken.mintAddress")} value={result.mint} description={t("CreateToken.theUniqueIdentifierForThisTokenUseItIn")} />
            <AccountAddress label={t("CreateToken.ataAddress")} value={result.ata} description={t("CreateToken.yourCurrentWalletSAssociatedAccountForThisToken")} />
        </SimpleGrid>
        {onNext && <Flex gap={3} wrap="wrap" mt={5}><Button size="sm" rightIcon={<ArrowForwardIcon />} onClick={() => onNext('metadata', result)}>{t("CreateToken.nextSetNameAndSymbol")}</Button><Button variant="outline" size="sm" onClick={() => onNext('mint', result)}>{t("CreateToken.goToMintTokens")}</Button></Flex>}
    </Panel>}>
        <Panel title={t("CreateToken.setTokenPrecision")} description={t("CreateToken.thisStepOnlyCreatesAMintAndYourWallet")}>
            <Box as="fieldset" disabled={busy} minW={0}>
                <Flex justify="space-between" align="center" gap={3} wrap="wrap" bg="gray.50" borderRadius="lg" p={4} mb={5}>
                    <Box><Text fontSize="xs" color="gray.500">{t("CreateToken.forRentAndFees")}</Text><HStack><Text fontSize="xl" fontWeight="semibold">{balance === null ? '—' : balance.toLocaleString('en-US', { minimumFractionDigits: 4, maximumFractionDigits: 4 })} <Box as="span" fontSize="sm" color="gray.500">SOL</Box></Text><Badge colorScheme="green">Devnet</Badge></HStack></Box>
                    <Flex gap={2} wrap="wrap"><Button size="xs" variant="ghost" leftIcon={<RepeatIcon />} onClick={onRefresh} isLoading={isRefreshing} isDisabled={!walletReady || busy}>{t("CreateToken.refresh")}</Button><Button size="xs" variant="outline" onClick={onAirdrop} isLoading={operation === 'airdrop'} loadingText={t("CreateToken.requesting")} isDisabled={!walletReady || busy || isRefreshing}>{t("CreateToken.getTestSol")}</Button></Flex>
                </Flex>
                {balanceError && <Box mb={4}><Notice tone="warning">{balanceError}{t("CreateToken.refreshToTryAgain")}</Notice></Box>}
                <Text fontSize="xs" color="gray.500" mb={5}>{t("CreateToken.solIsNotTheTokenYouAreCreatingTest")}</Text>
                <FormControl isInvalid={!validDecimals}>
                    <FormLabel htmlFor="create-token-decimals">{t("CreateToken.tokenDecimals")}</FormLabel>
                    <NumberInput value={decimals} onChange={onDecimalsChange} min={0} max={9} clampValueOnBlur={false} keepWithinRange={false} isDisabled={busy}><NumberInputField id="create-token-decimals" aria-describedby="create-token-decimals-help" /></NumberInput>
                    {!validDecimals && <FormErrorMessage>{t("CreateToken.enterAnIntegerFrom0To9")}</FormErrorMessage>}
                    <FormHelperText id="create-token-decimals-help">{t("CreateToken.decimalsDefineTheSmallestUnitNotTheIssuanceAmount")}</FormHelperText>
                </FormControl>
                <Flex gap={2} wrap="wrap" mt={3}>{[{ value: '0', label: t("CreateToken.0DecimalsWholeTokens") }, { value: '6', label: t("CreateToken.6DecimalsOneMillionth") }, { value: '9', label: t("CreateToken.9DecimalsOneBillionth") }].map(option => <Button key={option.value} size="xs" variant={decimals === option.value ? 'solid' : 'outline'} aria-pressed={decimals === option.value} onClick={() => onDecimalsChange(option.value)} isDisabled={busy}>{option.label}</Button>)}</Flex>
                {validDecimals && <Box mt={4}><Notice>{t("CreateToken.unitSummary", { units: (10n ** BigInt(decimals)).toLocaleString('en-US') })}<br />{t("CreateToken.example")}{Number(decimals) === 0 ? t("CreateToken.onlyWholeTokensCanBeTransferred05Tokens") : t("CreateToken.theSmallestTransferableAmountIs01Tokens", { v0: '0'.repeat(Number(decimals) - 1) })}</Notice></Box>}
                <Box borderTopWidth="1px" borderColor="gray.100" mt={6} pt={5}>
                    <Button w="full" onClick={onCreate} isLoading={operation === 'create'} loadingText={t("CreatePool.creatingCheckYourWallet")} isDisabled={!walletReady || busy || isRefreshing || !validDecimals}>{result ? t("CreateToken.createAnotherToken") : t("CreateToken.createMintAndAta")}</Button>
                    <Text fontSize="xs" color="gray.500" mt={3}>{result ? t("CreateToken.creatingAgainGeneratesANewMintItDoesNot") : t("CreateToken.yourWalletPaysActualRentAndFeesAndReceives")}</Text>
                </Box>
            </Box>
        </Panel>
    </LessonLayout>;
}
