import { useT } from '../../i18n/useT';
import React from 'react';
import { ArrowForwardIcon, CheckCircleIcon, LockIcon } from '@chakra-ui/icons';
import { Badge, Box, Button, Flex, Grid, Heading, HStack, SimpleGrid, Text, VStack } from '@chakra-ui/react';
import { WalletButton } from '../WalletButton';
import { CreatorLinks } from '../brand/CreatorLinks';
import { useCurriculum } from '../learning/curriculum';

export function WelcomePanel() {
    const t = useT();
    const { lessons, groupLabel } = useCurriculum();
    return <VStack align="stretch" spacing={{ base: 7, md: 10 }}>
        <Grid templateColumns={{ base: 'minmax(0, 1fr)', lg: 'minmax(0, 1.15fr) minmax(0, 1fr)' }} gap={8} alignItems="center" py={{ base: 3, md: 8 }}>
            <Box minW={0}>
                <Badge colorScheme="purple" mb={5} whiteSpace="normal" maxW="full">{t("home.aHandsOnSolanaTokenCourseYouCanVerify")}</Badge>
                <Heading as="h2" fontSize={{ base: '34px', md: '48px', xl: '56px' }} lineHeight="1.25">{t("home.donTJustCreateTokens")}<br /><Box as="span" color="purple.600">{t("home.understandHowTheyWork")}</Box></Heading>
                <Text mt={5} color="gray.500" lineHeight="1.9" maxW="650px" fontSize={{ base: 'md', md: 'lg' }}>{t("home.startWithMintsAndAccountsThenPracticeMetadataMinting")}</Text>
                <Flex gap={3} wrap="wrap" mt={7}><WalletButton size="lg" label={t("home.connectWalletAndStart")} /><Button as="a" href="#learning-path" variant="ghost" rightIcon={<ArrowForwardIcon />}>{t("home.exploreTheLearningPath")}</Button></Flex>
                <Box mt={6} pt={5} borderTopWidth="1px" borderColor="gray.200" maxW="650px"><CreatorLinks /></Box>
            </Box>
            <Box bg="white" borderWidth="1px" borderColor="gray.200" borderRadius="2xl" p={{ base: 6, md: 10 }} boxShadow="0 12px 40px -24px rgba(45,35,80,0.18)" minW={0}>
                <Flex align="center" justify="space-between" gap={3} mb={6}><Text fontSize="xs" fontWeight="bold" color="gray.400">{t("home.fromConceptsToOnChainPractice")}</Text></Flex>
                <VStack align="stretch" spacing={0}>
                    {[
                        { title: t("home.createYourFirstToken"), text: t("home.mintAtaNameAndSymbolSmallIssuance"), caption: t("home.establishIdentityThenObserveSupply") },
                        { title: t("home.understandAssetsAndAuthorities"), text: t("home.transferFreezeAndThawBurnAndRevoke"), caption: t("home.whichActionsChangeBalancesAndWhichChangeControl") },
                        { title: t("home.exploreAdvancedDefi"), text: t("home.marketLiquidityPoolLpSwap"), caption: t("home.readRatiosQuotesAndProtections") },
                    ].map((item, index) => <Flex gap={4} key={item.title} pb={index < 2 ? 6 : 0}>
                        <Flex boxSize="40px" flexShrink={0} bg={index === 0 ? 'purple.600' : 'purple.50'} color={index === 0 ? 'white' : 'purple.600'} borderRadius="lg" align="center" justify="center" fontSize="xs" fontWeight="bold">0{index + 1}</Flex>
                        <Box minW={0}><Heading as="h3" fontSize="xl">{item.title}</Heading><Text fontSize="sm" color="gray.600" mt={2}>{item.text}</Text><Text fontSize="xs" color="gray.400" mt={1}>{item.caption}</Text></Box>
                    </Flex>)}
                </VStack>
                <Box bg="gray.50" borderRadius="lg" px={4} py={3} mt={6}><Text fontSize="xs" color="gray.500">{t("home.everyExperimentUnderstandTheGoalReviewInputsSignIn")}</Text></Box>
            </Box>
        </Grid>
        <SimpleGrid columns={{ base: 1, md: 3 }} gap={4}>
            {[{ title: t("home.prepareTwoThingsFirst"), icon: <CheckCircleIcon />, text: t("home.aSeparatePhantomTestWalletAndDevnetSolFor") }, { title: t("home.yourAssetsYourSignatures"), icon: <LockIcon />, text: t("home.theAppDoesNotNeedYourPrivateKeyEvery") }, { title: t("home.useCautionEvenOnATestNetwork"), icon: <ArrowForwardIcon />, text: t("home.burningPermanentAuthorityRevocationAndMetadataLockingAreIrreversible") }].map(item => <Box key={item.title} bg="white" borderWidth="1px" borderColor="gray.200" borderRadius="xl" p={{ base: 6, md: 8 }}><HStack color="purple.600" mb={3}>{item.icon}<Heading as="h3" fontSize="xl" color="gray.800">{item.title}</Heading></HStack><Text fontSize="sm" color="gray.500" lineHeight="tall">{item.text}</Text></Box>)}
        </SimpleGrid>
        <Box id="learning-path" scrollMarginTop={6}>
            <Heading as="h3" size="lg">{t("home.exploreThePathBeforeExperimenting")}</Heading><Text color="gray.500" mt={2} mb={5}>{t("home.startWithTokenBasicsOrChooseLessonsFreelyAfter")}</Text>
            <SimpleGrid columns={{ base: 1, md: 3 }} gap={5}>
                {(['basics', 'authorities', 'defi'] as const).map((group, index) => <Box key={group} bg="white" borderWidth="1px" borderColor="gray.200" borderRadius="xl" p={{ base: 6, md: 8 }}><Text fontSize="xs" color="purple.500" mb={2}>CHAPTER 0{index + 1}</Text><Heading as="h4" fontSize="xl" mb={4}>{groupLabel(group)}</Heading><VStack align="stretch" spacing={3}>{(index === 1 ? [lessons[0], ...lessons.filter(l => l.group === group)] : lessons.filter(l => l.group === group)).map(lesson => <Box key={lesson.id}><Text fontSize="sm" fontWeight="medium">{lesson.shortTitle}</Text><Text fontSize="xs" color="gray.500" mt={1} lineHeight="tall">{lesson.goal}</Text></Box>)}</VStack></Box>)}
            </SimpleGrid>
        </Box>
    </VStack>;
}
