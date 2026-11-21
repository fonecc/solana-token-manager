import { useT } from '../../i18n/useT';
import React from 'react';
import { ArrowForwardIcon, CheckIcon, LockIcon } from '@chakra-ui/icons';
import { Badge, Box, Button, Flex, Grid, Heading, HStack, SimpleGrid, Text, VStack } from '@chakra-ui/react';
import { type LessonId, useCurriculum } from './curriculum';
import { useLearning } from './LearningContext';

export function LearningOverview() {
    const t = useT();
    const { lessons, groupLabel } = useCurriculum();
    const { navigate } = useLearning();
    return <VStack align="stretch" spacing={7}>
        <Box bg="white" borderWidth="1px" borderColor="gray.200" borderRadius="2xl" p={{ base: 6, md: 10, xl: 12 }} position="relative" overflow="hidden">
            <Badge colorScheme="purple" mb={4}>{t("learning.understandFirstVerifyForYourself")}</Badge>
            <Heading as="h2" fontSize={{ base: '2xl', md: '36px', xl: '40px' }} maxW="850px">{t("learning.exploreATokenSLifecycleOnATestNetwork")}</Heading>
            <Text color="gray.500" lineHeight="tall" mt={4} maxW="760px" fontSize={{ base: 'md', md: 'lg' }}>{t("learning.goBeyondClickingButtonsLearnWhichAccountsEachTransaction")}</Text>
            <Flex gap={3} wrap="wrap" mt={6}>
                <Button rightIcon={<ArrowForwardIcon />} onClick={() => navigate('create')}>{t("learning.startLesson1CreateAToken")}</Button>
                <Button variant="outline" onClick={() => navigate('assets')}>{t("learning.alreadyHaveATokenViewMyAssets")}</Button>
            </Flex>
            <Text fontSize="xs" color="gray.400" mt={4}>{t("learning.followTheRecommendedPathOrChooseFreelyFromThe")}</Text>
        </Box>
        <SimpleGrid columns={{ base: 1, md: 3 }} gap={4}>
            {[{ title: t("learning.01Prepare"), text: t("learning.separateTestWalletDevnetSolSolPaysFeesCreating"), icon: <LockIcon /> }, { title: t("learning.02Act"), text: t("learning.readTheGoalAndFieldHelpThenReviewWallet"), icon: <ArrowForwardIcon /> }, { title: t("learning.03Verify"), text: t("learning.saveSignaturesAndUseExplorerToCheckAccountsBalances"), icon: <CheckIcon /> }].map(item => <Box key={item.title} px={{ base: 5, md: 7 }} py={6} borderWidth="1px" borderColor="gray.200" borderRadius="xl" bg="white"><HStack color="purple.600" mb={2}>{item.icon}<Text fontSize="sm" fontWeight="semibold">{item.title}</Text></HStack><Text fontSize="sm" color="gray.500" lineHeight="tall">{item.text}</Text></Box>)}
        </SimpleGrid>
        <Box>
            <Flex align="baseline" gap={3} wrap="wrap" mb={4}><Heading as="h3" fontSize="2xl">{t("learning.yourLearningPath")}</Heading><Text fontSize="xs" color="gray.400">{t("learning.buildFoundationsBeforeProtocolIntegration")}</Text></Flex>
            <VStack align="stretch" spacing={4}>
                {(['basics', 'authorities', 'defi'] as const).map((group, index) => <Box key={group} bg="white" borderWidth="1px" borderColor="gray.200" borderRadius="xl" overflow="hidden">
                    <Flex justify="space-between" align="center" px={{ base: 5, md: 7 }} py={6} bg={index === 2 ? 'purple.50' : 'gray.50'} gap={3} wrap="wrap"><Box><Text fontSize="xs" color="gray.400">CHAPTER 0{index + 1}</Text><Heading as="h4" fontSize="xl" mt={1}>{groupLabel(group)}</Heading></Box><Badge colorScheme={index === 2 ? 'orange' : 'gray'}>{index === 2 ? t("learning.requiresTestnetPoolsHigherCosts") : t("learning.completeTheBasicLessonsFirst")}</Badge></Flex>
                    <VStack align="stretch" spacing={0}>
                        {(index === 1 ? [lessons[0], ...lessons.filter(lesson => lesson.group === group)] : lessons.filter(lesson => lesson.group === group)).map(lesson => <Button key={lesson.id} variant="ghost" colorScheme="gray" h="auto" py={6} px={{ base: 5, md: 7 }} borderRadius={0} justifyContent="stretch" textAlign="left" onClick={() => navigate(lesson.id as LessonId)} borderTopWidth="1px" borderColor="gray.100">
                            <Grid templateColumns="36px minmax(0, 1fr) 20px" w="full" gap={3} alignItems="center"><Text fontSize="xs" color="gray.400">{lesson.number}</Text><Box minW={0}><Text fontSize="lg" fontWeight="semibold" color="gray.800">{lesson.shortTitle}</Text><Text fontSize="sm" fontWeight="normal" color="gray.500" mt={1} lineHeight="tall">{lesson.goal}</Text></Box><ArrowForwardIcon color="gray.400" /></Grid>
                        </Button>)}
                    </VStack>
                </Box>)}
            </VStack>
        </Box>
    </VStack>;
}
