import { useT } from '../../i18n/useT';
import React from 'react';
import { Accordion, AccordionButton, AccordionIcon, AccordionItem, AccordionPanel, Badge, Box, Flex, Heading, Text, VStack } from '@chakra-ui/react';
import { AccountAddress } from '../common/AccountAddress';
import type { MarketDetailsData } from './types';

export const MarketDetails = ({ details, poolCreated = false }: { details: MarketDetailsData; poolCreated?: boolean }) => {
    const t = useT(); return (<Box borderWidth="1px" borderColor="green.200" borderRadius="xl" p={{ base: 4, md: 5 }} minW={0}>
    <Flex justify="space-between" align="center" gap={2} wrap="wrap" mb={3}>
        <Heading as="h3" size="sm">{t("CreatePool.step1MarketReady")}</Heading><Badge colorScheme="green">{t("CreatePool.validated")}</Badge>
    </Flex>
    <Text fontSize="sm" color="gray.600" lineHeight="tall" mb={4}>{poolCreated ? t("CreatePool.thisIsTheOpenbookMarketLinkedToThisPool") : t("CreatePool.aMarketMatchingTheCurrentMintWsolPairIs")}</Text>
    <AccountAddress label={t("CreatePool.marketIdMarketAddress")} value={details.marketId} compact description={t("CreatePool.thePrerequisiteOrderBookMarketForThisAppS")} />
    <Accordion allowToggle mt={3}>
        <AccordionItem border="none">
            <AccordionButton px={0} fontSize="xs"><Box flex="1" textAlign="left">{t("CreatePool.technicalDetailsMarketTokensAndVaults")}</Box><AccordionIcon /></AccordionButton>
            <AccordionPanel px={0} pb={0}>
                <VStack align="stretch" spacing={3}>
                    <AccountAddress label={t("CreatePool.marketBaseMint")} value={details.baseMint} compact />
                    <AccountAddress label={t("CreatePool.marketQuoteMintWsol")} value={details.quoteMint} compact description={t("CreatePool.wsolRepresentsNativeSolAsAnSplTokenAnd")} />
                    <AccountAddress label={t("CreatePool.marketBaseVault")} value={details.baseVault} compact description={t("CreatePool.anAssetAccountUsedByTheOpenbookMarketIt")} />
                    <AccountAddress label={t("CreatePool.marketWsolVault")} value={details.quoteVault} compact description={t("CreatePool.thisBelongsToTheMarketItDoesNotMean")} />
                </VStack>
            </AccordionPanel>
        </AccordionItem>
    </Accordion>
</Box>); };
