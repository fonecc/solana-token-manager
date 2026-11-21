import { useT } from '../../i18n/useT';
import React from 'react';
import { Accordion, AccordionButton, AccordionIcon, AccordionItem, AccordionPanel, Alert, AlertIcon, Box, Button, FormControl, FormHelperText, FormLabel, Heading, Input, Text, VStack } from '@chakra-ui/react';
import type { TransactionUpdate } from '../../lib/solana/transactions';
import { TransactionFeedback } from '../common/TransactionFeedback';

export interface MarketSetupProps {
    ready: boolean;
    operation: 'create' | 'load' | null;
    canCreate: boolean;
    canLoad: boolean;
    manualId: string;
    error: string;
    updates: TransactionUpdate[];
    onManualIdChange: (value: string) => void;
    onCreate: () => void;
    onLoad: () => void;
}

export function MarketSetup({ ready, operation, canCreate, canLoad, manualId, error, updates, onManualIdChange, onCreate, onLoad }: MarketSetupProps) {
    const t = useT();
    const busy = operation !== null;
    return <VStack align="stretch" spacing={4} minW={0}>
        {!ready && <Box as="fieldset" disabled={busy} bg="white" borderWidth="1px" borderColor="gray.200" borderRadius="xl" p={{ base: 4, md: 6 }} minW={0}>
            <Heading as="h3" size="sm">{t("CreatePool.step1PrepareAnOpenbookMarket")}</Heading>
            <Text fontSize="sm" color="gray.600" lineHeight="tall" mt={3}>{t("CreatePool.prepareAnOrderBookMarketForTheCurrentMint")}</Text>
            <Box bg="orange.50" borderRadius="lg" p={3} my={4}><Text fontSize="xs" color="orange.900" lineHeight="tall">{t("CreatePool.aMarketHasMultipleOnChainAccountsAndMay")}</Text></Box>
            <Button colorScheme="purple" onClick={onCreate} isLoading={operation === 'create'} loadingText={t("CreatePool.creatingCheckYourWallet")} isDisabled={!canCreate || busy} w={{ base: 'full', md: 'auto' }}>{t("CreatePool.createANewOpenbookMarket")}</Button>
            <Accordion allowToggle mt={4}>
                <AccordionItem border="none">
                    <AccordionButton px={0} fontSize="xs"><Box flex="1" textAlign="left">{t("CreatePool.advancedParametersFixedForThisTutorial")}</Box><AccordionIcon /></AccordionButton>
                    <AccordionPanel px={0} fontSize="xs" color="gray.600" lineHeight="tall">{t("CreatePool.lotsize1IsTheBaseOrderQuantityIncrementTicksize")}</AccordionPanel>
                </AccordionItem>
            </Accordion>
            <Box borderTopWidth="1px" borderColor="gray.100" mt={4} pt={4}>
                <Heading as="h4" size="xs">{t("CreatePool.haveAMarketOrRecoveringAnInterruptedFlow")}</Heading>
                <Text fontSize="xs" color="gray.600" lineHeight="tall" mt={2} mb={3}>{t("CreatePool.checkTheOriginalSignaturesFirstThenLoadTheCompleted")}</Text>
                <FormControl isDisabled={busy}>
                    <FormLabel htmlFor="pool-market-id" fontSize="sm">{t("CreatePool.marketIdMarketAddress")}</FormLabel>
                    <Input id="pool-market-id" value={manualId} onChange={e => onManualIdChange(e.target.value)} isDisabled={busy} aria-describedby="pool-market-help" placeholder={t("CreatePool.pasteTheFullOpenbookMarketAddress")} />
                    <FormHelperText id="pool-market-help" fontSize="xs" lineHeight="tall">{t("CreatePool.theGeneratedAddressIsFilledBeforeCreationHavingAn")}</FormHelperText>
                </FormControl>
                <Button size="sm" variant="outline" mt={3} onClick={onLoad} isLoading={operation === 'load'} loadingText={t("CreatePool.validatingReadOnly")} isDisabled={!canLoad || busy}>{t("CreatePool.validateAndLoadExistingMarket")}</Button>
            </Box>
        </Box>}
        {error && !ready && <Alert status="error" borderRadius="lg" alignItems="start"><AlertIcon /><Box minW={0}><Text fontSize="sm" fontWeight="semibold">{t("CreatePool.marketStepNotCompleted")}</Text><Text fontSize="xs" overflowWrap="anywhere" mt={1}>{error}</Text><Text fontSize="xs" mt={2}>{t("CreatePool.ifYouHaveSignaturesCheckTheirStatusFirstDo")}</Text></Box></Alert>}
        {updates.length > 0 && <Text fontSize="xs" fontWeight="semibold" color="gray.600">{t("CreatePool.marketStepTransactionRecords")}</Text>}
        <TransactionFeedback updates={updates} />
    </VStack>;
}
