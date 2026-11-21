import { ManualLink } from '../manual/ManualLink';
import { useT } from '../../i18n/useT';
import React, { type ReactNode } from 'react';
import { Badge, Box, Button, Flex, Grid, Heading, HStack, Text, VStack } from '@chakra-ui/react';
import { ArrowBackIcon, ArrowForwardIcon } from '@chakra-ui/icons';
import { courseOrder, type LessonId, useCurriculum } from './curriculum';
import { useLearning } from './LearningContext';

export function Panel({ title, description, children }: { title?: string; description?: string; children: ReactNode }) {
    return <Box bg="white" borderWidth="1px" borderColor="gray.200" borderRadius="xl" p={{ base: 5, md: 8 }} minW={0}>
        {title && <Heading as="h3" fontSize="xl" mb={description ? 2 : 4}>{title}</Heading>}
        {description && <Text fontSize="sm" color="gray.500" mb={5} lineHeight="tall">{description}</Text>}
        {children}
    </Box>;
}
export function ConceptDetails({ title, children, open = false }: { title: string; children: ReactNode; open?: boolean }) {
    return <Box as="details" open={open || undefined} borderTopWidth="1px" borderColor="gray.100" py={3}>
        <Box as="summary" fontSize="sm" fontWeight="medium" color="gray.700">{title}</Box>
        <Box mt={3} fontSize="sm" color="gray.500" lineHeight="tall" minW={0}>{children}</Box>
    </Box>;
}
export function Notice({ children, tone = 'info' }: { children: ReactNode; tone?: 'info' | 'warning' | 'error' | 'success' }) {
    const colors = { info: ['purple.50', 'purple.800'], warning: ['orange.50', 'orange.900'], error: ['red.50', 'red.800'], success: ['green.50', 'green.800'] }[tone];
    return <Box role={tone === 'error' ? 'alert' : 'note'} bg={colors[0]} color={colors[1]} borderRadius="lg" px={4} py={3} fontSize="sm" lineHeight="tall" overflowWrap="anywhere">{children}</Box>;
}
export function ResultChecklist({ id, confirmed }: { id: Exclude<LessonId, 'overview'>; confirmed?: boolean }) {
    const t = useT();
    const { lessonById } = useCurriculum();
    const lesson = lessonById[id];
    return <Box borderTopWidth="1px" borderColor="gray.200" pt={5} mt={5}>
        <Text fontSize="xs" fontWeight="bold" color="gray.600" mb={2}>{confirmed ? t("learning.operationConfirmedVerifyNext") : t("learning.howDoYouVerifyTheResult")}</Text>
        <VStack as="ul" align="stretch" spacing={1} pl={4} color="gray.500" fontSize="sm">{lesson.checks.map(check => <Box as="li" key={check}>{check}</Box>)}</VStack>
        <Text fontSize="xs" color="gray.400" mt={2}>{t("learning.useDevnetExplorerAndOnChainAccountsAsThe")}</Text>
    </Box>;
}
export function LessonNavigation({ id }: { id: Exclude<LessonId, 'overview'> }) {
    const t = useT();
    const { lessonById } = useCurriculum();
    const { navigate } = useLearning();
    const position = courseOrder.indexOf(id);
    const previous = courseOrder[position - 1];
    const next = courseOrder[position + 1];
    return <Flex as="nav" aria-label={t("learning.previousAndNextLessons")} justify="space-between" gap={3} wrap="wrap" borderTopWidth="1px" borderColor="gray.200" pt={5} mt={7}>
        {previous && <Button variant="ghost" size="sm" leftIcon={<ArrowBackIcon />} onClick={() => navigate(previous)}>{previous === 'overview' ? t("learning.learningOverview") : lessonById[previous].shortTitle}</Button>}
        {next && <Button variant="outline" size="sm" ml="auto" rightIcon={<ArrowForwardIcon />} onClick={() => navigate(next)}>{t("learning.next")}{next === 'overview' ? t("learning.learningOverview") : lessonById[next].shortTitle}</Button>}
    </Flex>;
}
export function LessonLayout({ id, children, feedback, result, hideChecks = false }: { id: Exclude<LessonId, 'overview'>; children: ReactNode; feedback?: ReactNode; result?: ReactNode; hideChecks?: boolean }) {
    const t = useT();
    const { lessonById } = useCurriculum();
    const lesson = lessonById[id];
    return <Box minW={0}>
        <Box mb={{ base: 5, md: 7 }}>
            <HStack spacing={2} mb={3}><Badge colorScheme="purple">{lesson.groupLabel}</Badge><Text fontSize="xs" color="gray.400">{id === 'assets' ? t("learning.quickEntry") : t("learning.lesson", { v0: lesson.number })}</Text></HStack>
            <Heading as="h2" fontSize={{ base: '2xl', md: '36px' }}>{lesson.title}</Heading>
            <Text color="gray.500" mt={3} maxW="850px" fontSize={{ base: 'md', md: 'lg' }} lineHeight="tall">{lesson.goal}</Text>
            <Box mt={3}><ManualLink topic={id} /></Box>
        </Box>
        <Box bg="white" borderWidth="1px" borderColor="gray.200" borderRadius="lg" px={{ base: 5, md: 7 }} py={5} mb={6}>
            <Text fontSize="xs" fontWeight="bold" color="gray.600" mb={1}>{t("learning.beforeYouStart")}</Text><Text fontSize="sm" color="gray.500" lineHeight="tall">{lesson.prepare}</Text>
        </Box>
        {feedback && <Box mb={5}>{feedback}</Box>}
        {result && <Box mb={5}>{result}</Box>}
        <Grid templateColumns={{ base: 'minmax(0, 1fr)', '2xl': 'minmax(0, 1fr) 300px' }} gap={7} alignItems="start">
            <Box minW={0}>{children}{!hideChecks && <ResultChecklist id={id} />}</Box>
            <Box as="aside" aria-label={t("learning.concepts", { v0: lesson.shortTitle })} minW={0} bg="white" borderWidth="1px" borderColor="gray.200" borderRadius="xl" px={6} pt={6} pb={3}>
                <Text fontSize="xs" fontWeight="bold" letterSpacing="0.06em" color="gray.400" mb={2}>{t("learning.understandThisStep")}</Text>
                {lesson.concepts.map(concept => <ConceptDetails key={concept.title} title={concept.title}><Text>{concept.text}</Text></ConceptDetails>)}
            </Box>
        </Grid>
        <LessonNavigation id={id} />
    </Box>;
}
