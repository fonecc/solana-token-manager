import { useT } from '../../i18n/useT';
import React, { type ReactNode } from 'react';
import { Box, Flex, HStack, SimpleGrid, Text } from '@chakra-ui/react';
import { CheckCircleIcon } from '@chakra-ui/icons';
import { AccountAddress } from '../common/AccountAddress';
import { LessonLayout, Notice } from '../learning/LessonLayout';

export function PoolGuide({ tokenMint, stage, children }: { tokenMint: string; stage: 'market' | 'deposit' | 'done'; children?: ReactNode }) {
    const t = useT();
    const current = stage === 'market' ? 1 : stage === 'deposit' ? 2 : 3;
    return <LessonLayout id="pool" hideChecks={stage === 'done'}>
        <SimpleGrid columns={{ base: 2, md: 4 }} gap={2} mb={5} aria-label={t("CreatePool.poolCreationLearningSteps")}>
            {[t("CreatePool.prepareAssets"), t("CreatePool.createLoadMarket"), t("CreatePool.depositAndCreatePool"), t("CreatePool.verifyOnChainResults")].map((label, index) => <HStack key={label} p={3} borderRadius="lg" bg={index === current ? 'purple.50' : 'white'} color={index === current ? 'purple.700' : 'gray.500'} align="start" aria-current={index === current ? 'step' : undefined}>
                <Flex flexShrink={0} boxSize="24px" borderRadius="full" bg={index === current ? 'purple.100' : 'gray.100'} fontSize="xs" align="center" justify="center">{index > 0 && index < current ? <CheckCircleIcon /> : index + 1}</Flex><Text fontSize="xs" fontWeight="medium">{label}</Text>
            </HStack>)}
        </SimpleGrid>
        {!tokenMint ? <Box mb={4}><Notice>{t("CreatePool.noTokenSelectedChooseCreateLiquidityPoolFromThe")}</Notice></Box> : <Box mb={4}><AccountAddress label={t("CreatePool.currentBaseTokenMint")} value={tokenMint} compact description={t("CreatePool.classicSplTokenOnlyTheOtherSideIsFixed")} /></Box>}
        {stage !== 'done' && <Box mb={4}><Notice>{t("CreatePool.creatingAMintGivesNoTokenBalancePrepareBoth")}</Notice></Box>}
        <Box display="flex" flexDirection="column" gap={5} minW={0}>{children}</Box>
    </LessonLayout>;
}
