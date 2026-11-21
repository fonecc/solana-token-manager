import React from 'react';
import { Box, Button, Flex, Grid, Heading, Link, ListItem, OrderedList, Select, Text, UnorderedList, VStack } from '@chakra-ui/react';
import { manualSources, type ManualChapter, type ManualTopic } from '../../content/manual/types';
import { useT } from '../../i18n/useT';

const sections = ['prerequisites', 'steps', 'review', 'verify', 'troubleshooting', 'terms', 'sources'] as const;
export function ManualContent({ chapters, topic, onSelect }: { chapters: ManualChapter[]; topic?: ManualTopic; onSelect: (topic?: ManualTopic) => void }) {
    const t = useT();
    const index = chapters.findIndex(chapter => chapter.id === topic);
    const chapter = chapters[index];
    return <Box minW={0}>
        <Heading as="h2" fontSize={{ base: '2xl', md: '36px' }}>{chapter?.title || t('manual.title')}</Heading>
        <Text color="gray.500" fontSize={{ base: 'md', md: 'lg' }} mt={3} mb={7} maxW="900px" lineHeight="tall">{chapter?.summary || t('manual.intro')}</Text>
        {!chapter ? <Grid as="nav" aria-label={t('manual.contents')} templateColumns={{ base: 'minmax(0, 1fr)', md: 'repeat(2, minmax(0, 1fr))' }} gap={5}>
            {chapters.map((item, number) => <Box key={item.id} p={{ base: 5, md: 7 }} bg="white" borderWidth="1px" borderColor="gray.200" borderRadius="xl" minW={0}>
                <Text fontSize="xs" color="purple.600" mb={2}>{String(number + 1).padStart(2, '0')}</Text>
                <Heading as="h3" fontSize="xl" lineHeight="tall"><Link as="button" textAlign="left" onClick={() => onSelect(item.id)}>{item.title}</Link></Heading>
                <Text fontSize="sm" color="gray.500" lineHeight="tall" mt={2}>{item.summary}</Text>
                <Button variant="link" mt={4} onClick={() => onSelect(item.id)}>{t('manual.read')} →</Button>
            </Box>)}
        </Grid> : <>
            <Flex gap={3} wrap="wrap" align="center">
                <Button variant="outline" size="sm" onClick={() => onSelect()}>← {t('manual.contents')}</Button>
                <Box flex={1} minW={{ base: 'full', md: '240px' }}>
                    <Select aria-label={t('manual.chapter')} value={chapter.id} onChange={event => onSelect(event.target.value as ManualTopic)} bg="white">
                        {chapters.map(item => <option key={item.id} value={item.id}>{item.title}</option>)}
                    </Select>
                </Box>
            </Flex>
            <Flex as="nav" aria-label={t('manual.onThisPage')} gap={2} wrap="wrap" my={5}>
                {sections.map(section => <Link key={section} href={`#${section}`} px={3} py={2} bg="white" borderWidth="1px" borderColor="gray.200" borderRadius="lg" color="purple.700" fontSize="xs">{t(`manual.${section}`)}</Link>)}
            </Flex>
            <VStack as="article" align="stretch" spacing={5} maxW="1000px">
                {sections.map(section => <Box as="section" id={section} key={section} scrollMarginTop={5} bg="white" borderWidth="1px" borderColor={section === 'review' ? 'orange.200' : 'gray.200'} borderRadius="xl" p={{ base: 5, md: 8 }} minW={0} overflowWrap="anywhere">
                    <Heading as="h3" fontSize="2xl" lineHeight="tall" mb={4}><Link href={`#${section}`} color="inherit">{t(`manual.${section}`)}</Link></Heading>
                    {section === 'steps' ? <OrderedList spacing={5} pl={1}>
                        {chapter.steps.map((step, number) => <ListItem key={number} pl={1}>
                            <Heading as="h4" id={`step-${number + 1}`} fontSize="lg" lineHeight="tall" scrollMarginTop={5}><Link href={`#step-${number + 1}`}>{step.title}</Link></Heading>
                            <Text color="gray.600" fontSize="sm" lineHeight="1.9" mt={2}>{step.text}</Text>
                        </ListItem>)}
                    </OrderedList> : section === 'sources' ? <>
                        <Text fontSize="sm" color="gray.500" lineHeight="tall" mb={3}>{t('manual.sourceNote')}</Text>
                        <UnorderedList spacing={3}>{chapter.sources.map(id => <ListItem key={id}><Link href={manualSources[id].url} isExternal color="purple.700" fontSize="sm">{manualSources[id].title} ↗</Link></ListItem>)}</UnorderedList>
                    </> : <UnorderedList spacing={3} color="gray.600" fontSize="sm" lineHeight="1.9">{chapter[section].map((text, number) => <ListItem key={number}>{text}</ListItem>)}</UnorderedList>}
                </Box>)}
            </VStack>
            <Flex as="nav" aria-label={t('manual.contents')} mt={7} gap={4} justify="space-between" wrap="wrap" maxW="1000px">
                {chapters[index - 1] && <Button size="sm" variant="ghost" onClick={() => onSelect(chapters[index - 1].id)}>← {t('manual.previous')} · {chapters[index - 1].title}</Button>}
                {chapters[index + 1] && <Button size="sm" variant="outline" ml="auto" onClick={() => onSelect(chapters[index + 1].id)}>{t('manual.next')} · {chapters[index + 1].title} →</Button>}
            </Flex>
        </>}
    </Box>;
}
