import { useT } from '../../i18n/useT';
import React from 'react';
import { Box, FormControl, FormErrorMessage, FormHelperText, FormLabel, Heading, Input, SimpleGrid, Text, VStack } from '@chakra-ui/react';

export interface AmountInputsProps {
    baseAmount: string;
    quoteAmount: string;
    onBaseAmountChange: (value: string) => void;
    onQuoteAmountChange: (value: string) => void;
    isDisabled?: boolean;
}

export const isPositiveAmount = (value: string) => /^\d+(\.\d+)?$/.test(value) && /[1-9]/.test(value);

export const AmountInputs = ({ baseAmount, quoteAmount, onBaseAmountChange, onQuoteAmountChange, isDisabled = false }: AmountInputsProps) => {
    const t = useT(); return (<Box as="fieldset" disabled={isDisabled} bg="white" borderWidth="1px" borderColor="purple.200" borderRadius="xl" p={{ base: 4, md: 6 }} minW={0}>
    <VStack align="stretch" spacing={4}>
        <Box><Heading as="h3" size="sm">{t("CreatePool.step2SetInitialDeposits")}</Heading><Text fontSize="sm" color="gray.600" lineHeight="tall" mt={2}>{t("CreatePool.bothAssetsAreRequiredTheseArePoolDepositsNot")}</Text></Box>
        <SimpleGrid columns={{ base: 1, md: 2 }} gap={4}>
            <FormControl isInvalid={!isPositiveAmount(baseAmount)} isDisabled={isDisabled}>
                <FormLabel htmlFor="pool-base-amount" fontSize="sm">{t("CreatePool.baseTokenAmountCurrentMint")}</FormLabel>
                <Input id="pool-base-amount" value={baseAmount} onChange={e => onBaseAmountChange(e.target.value)} inputMode="decimal" aria-describedby="pool-base-help" bg="gray.50" isDisabled={isDisabled} />
                {!isPositiveAmount(baseAmount) && <FormErrorMessage>{t("CreatePool.enterADecimalAmountGreaterThan0")}</FormErrorMessage>}
                <FormHelperText id="pool-base-help" fontSize="xs" lineHeight="tall">{t("CreatePool.tokensDepositedFromYourWalletTheActualMintPrecision")}</FormHelperText>
            </FormControl>
            <FormControl isInvalid={!isPositiveAmount(quoteAmount)} isDisabled={isDisabled}>
                <FormLabel htmlFor="pool-quote-amount" fontSize="sm">{t("CreatePool.solAmountWsolOnChain")}</FormLabel>
                <Input id="pool-quote-amount" value={quoteAmount} onChange={e => onQuoteAmountChange(e.target.value)} inputMode="decimal" aria-describedby="pool-quote-help" bg="gray.50" isDisabled={isDisabled} />
                {!isPositiveAmount(quoteAmount) && <FormErrorMessage>{t("CreatePool.enterADecimalAmountGreaterThan0")}</FormErrorMessage>}
                <FormHelperText id="pool-quote-help" fontSize="xs" lineHeight="tall">{t("CreatePool.theSdkUsesNativeSolThroughItsWsolWrapping")}</FormHelperText>
            </FormControl>
        </SimpleGrid>
        <Box bg="purple.50" borderRadius="lg" p={4}>
            <Text fontSize="sm" fontWeight="semibold" color="purple.800">{t("CreatePool.whyDoBothAmountsMatter")}</Text>
            <Text fontSize="xs" color="purple.800" lineHeight="tall" mt={2}>{t("CreatePool.theInitialQuoteFollowsTheRatioOfSolDeposited")}</Text>
        </Box>
    </VStack>
</Box>); };
