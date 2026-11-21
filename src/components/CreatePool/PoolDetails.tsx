import { useT } from '../../i18n/useT';
import React from 'react';
import { Accordion, AccordionButton, AccordionIcon, AccordionItem, AccordionPanel, Badge, Box, Button, Flex, Heading, SimpleGrid, Text, VStack } from '@chakra-ui/react';
import { AccountAddress } from '../common/AccountAddress';
import { useLearning } from '../learning/LearningContext';
import type { PoolDetailsData } from './types';

export const PoolDetails = ({ details, tokenMint }: { details: PoolDetailsData; tokenMint?: string }) => {
    const t = useT();
    const { navigate } = useLearning();
    return <Box borderWidth="1px" borderColor="green.200" borderRadius="xl" p={{ base: 4, md: 6 }} minW={0}>
    <Flex justify="space-between" align="center" gap={2} wrap="wrap" mb={3}><Heading as="h3" size="md">{t("CreatePool.poolCreatedVerifyTheResults")}</Heading><Badge colorScheme="green">{t("CreatePool.transactionConfirmed")}</Badge></Flex>
    <Text fontSize="sm" color="gray.600" lineHeight="tall" mb={4}>{t("CreatePool.theMarketAndAmmPoolAreLinkedSaveThe")}</Text>
    <Box bg="green.50" borderRadius="lg" p={4} mb={4}>
        <Text fontSize="xs" color="gray.600">{t("CreatePool.initialDepositsSubmittedAtCreation")}</Text>
        <Text fontWeight="semibold" mt={1} overflowWrap="anywhere">{details.baseAmount} {t("CreatePool.baseTokens")}{details.quoteAmount} SOL</Text>
        <Text fontSize="xs" color="gray.600" mt={2} lineHeight="tall">{t("CreatePool.theseAreTheCreationInputsNotLiveReservesAnd")}</Text>
    </Box>
    <VStack align="stretch" spacing={3}>
        <AccountAddress label={t("AddLiquidity.poolIdLiquidityPoolAddress")} value={details.poolId} description={t("CreatePool.useThisAddressToLoadAndVerifyThisAmm")} />
        <AccountAddress label={t("CreatePool.lpMintLiquidityShareToken")} value={details.lpMint} description={t("CreatePool.lpTokensRepresentAShareOfPoolLiquidityNot")} />
    </VStack>
    <Accordion allowToggle mt={3}>
        <AccordionItem border="none">
            <AccordionButton px={0} fontSize="xs"><Box flex="1" textAlign="left">{t("CreatePool.technicalDetailsTwoAmmPoolVaults")}</Box><AccordionIcon /></AccordionButton>
            <AccordionPanel px={0} pb={0}>
                <VStack align="stretch" spacing={3}>
                    <AccountAddress label={t("CreatePool.poolBaseTokenVault")} value={details.baseVault} compact description={t("CreatePool.theAmmPoolAccountHoldingBaseTokensSeparateFrom")} />
                    <AccountAddress label={t("CreatePool.poolWsolVault")} value={details.quoteVault} compact description={t("CreatePool.theAmmPoolSWsolAccountItIsNot")} />
                </VStack>
            </AccordionPanel>
        </AccordionItem>
    </Accordion>
    <SimpleGrid columns={{ base: 1, md: 2 }} gap={4} mt={5}>
        <Box bg="gray.50" borderRadius="lg" p={4}>
            <Heading as="h4" size="xs" mb={2}>{t("CreatePool.checkTheseThreeThingsFirst")}</Heading>
            <Text fontSize="xs" color="gray.600" lineHeight="tall">{t("CreatePool.1OpenEachTransactionRecordAndVerifyItsOutcome")}<br />{t("CreatePool.2CheckBothWalletBalancesSolAlsoCoversRent")}<br />{t("CreatePool.3CheckTheActualLpTokensReceivedInYour")}</Text>
        </Box>
        <Box bg="purple.50" borderRadius="lg" p={4}>
            <Heading as="h4" size="xs" mb={2}>{t("CreatePool.whatCanYouDoNext")}</Heading>
            <Text fontSize="xs" color="purple.800" lineHeight="tall">{t("CreatePool.loadThePoolIdInAddLiquidityOrLook")}</Text>
            <Button mt={3} size="sm" variant="outline" onClick={() => navigate('liquidity', tokenMint, { poolId: details.poolId })}>{t("CreatePool.useThisPoolIdInAddLiquidity")}</Button>
            <Text fontSize="xs" color="gray.500" mt={2}>{t("CreatePool.thisOnlyFillsTheAddressReadAndValidateIt")}</Text>
        </Box>
    </SimpleGrid>
    <Text fontSize="xs" color="gray.500" lineHeight="tall" mt={4}>{t("CreatePool.alsoSaveTheMarketIdAndEachSignatureRefreshing")}</Text>
</Box>;
};
