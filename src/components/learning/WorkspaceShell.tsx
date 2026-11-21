import { useManual } from '../manual/ManualContext';
import { Brand } from '../brand/Brand';
import { SiteFooter } from '../brand/SiteFooter';
import { ManualLink } from '../manual/ManualLink';
import { LanguageSwitcher } from '../../i18n/LanguageSwitcher';
import { useT } from '../../i18n/useT';
import React, { useRef, type ReactNode } from 'react';
import { ArrowForwardIcon, HamburgerIcon, CloseIcon } from '@chakra-ui/icons';
import { Badge, Box, Button, Drawer, DrawerBody, DrawerCloseButton, DrawerContent, DrawerHeader, DrawerOverlay, Flex, Grid, Heading, HStack, IconButton, Text, VStack, useDisclosure } from '@chakra-ui/react';
import { lessonGroups, type LessonId, useCurriculum } from './curriculum';
import { AccountAddress } from '../common/AccountAddress';
import { WalletButton } from '../WalletButton';

export function CourseMenu({ active, onNavigate, onManualOpen }: { active: LessonId; onNavigate: (id: LessonId) => void; onManualOpen?: () => void }) {
    const t = useT();
    const { lessons, groupLabel } = useCurriculum();
    const manual = useManual();
    return <VStack as="nav" aria-label={t("learning.labLessons")} align="stretch" spacing={5}>
        {lessonGroups.map(group => <Box key={group}>
            <Text fontSize="xs" fontWeight="bold" color="gray.400" letterSpacing="0.1em" px={3} mb={2}>{groupLabel(group)}</Text>
            {group === 'start' && <MenuItem id="overview" title={t("learning.learningOverview")} number="⌂" active={active} onNavigate={onNavigate} />}
            {lessons.filter(lesson => lesson.group === group).map(lesson => <MenuItem key={lesson.id} id={lesson.id} title={lesson.shortTitle} number={lesson.number} active={active} onNavigate={onNavigate} />)}
        </Box>)}
        <Box borderTopWidth="1px" borderColor="gray.200" pt={4}><Button w="full" variant="ghost" justifyContent="flex-start" minH="48px" px={3} color={manual.isOpen ? 'purple.700' : 'gray.600'} bg={manual.isOpen ? 'purple.50' : 'transparent'} aria-current={manual.isOpen ? 'page' : undefined} onClick={() => { manual.open(); onManualOpen?.(); }}><Text as="span" w="30px" flexShrink={0} aria-hidden="true">▤</Text>{t('manual.title')}</Button></Box>
    </VStack>;
}
function MenuItem({ id, title, number, active, onNavigate }: { id: LessonId; title: string; number: string; active: LessonId; onNavigate: (id: LessonId) => void }) {
    const { isOpen: manualOpen } = useManual();
    const selected = !manualOpen && active === id;
    return <Button w="full" variant="ghost" justifyContent="flex-start" borderRadius="lg" size="sm" minH="48px" py={3} px={3} my={0.5} h="auto" color={selected ? 'purple.700' : 'gray.600'} bg={selected ? 'purple.50' : 'transparent'} aria-current={selected ? 'page' : undefined} onClick={() => onNavigate(id)}>
        <Text as="span" w="30px" flexShrink={0} fontSize="xs" color={selected ? 'purple.500' : 'gray.400'} textAlign="left">{number}</Text><Text as="span" fontSize="sm">{title}</Text>
    </Button>;
}
export function WorkspaceShell({ active, onNavigate, walletAddress, selectedMint, children }: { active: LessonId; onNavigate: (id: LessonId) => void; walletAddress: string; selectedMint: string; children: ReactNode }) {
    const t = useT();
    const { lessonById } = useCurriculum();
    const manual = useManual();
    const { isOpen, onOpen, onClose } = useDisclosure();
    const buttonRef = useRef<HTMLButtonElement>(null);
    const title = manual.isOpen ? t('manual.title') : active === 'overview' ? t("learning.learningOverview") : lessonById[active].shortTitle;
    return <Box minH="100vh" bg="canvas">
        <Box as="header" bg="white" borderBottomWidth="1px" borderColor="gray.200">
            <Flex maxW="1760px" mx="auto" px={{ base: 4, md: 6, xl: 10 }} py={4} justify="space-between" align="center" gap={3} wrap="wrap">
                <Button variant="unstyled" h="auto" minW={0} maxW="full" textAlign="left" onClick={() => onNavigate('overview')} aria-label={t("learning.returnToLearningOverview")}><Brand heading="h1" /></Button>
                <HStack spacing={3} flexWrap="wrap"><Badge colorScheme="green">Devnet</Badge><ManualLink /><LanguageSwitcher /><WalletButton /></HStack>
            </Flex>
        </Box>
        <Grid maxW="1760px" mx="auto" templateColumns={{ base: 'minmax(0, 1fr)', lg: '260px minmax(0, 1fr)' }} gap={{ base: 0, lg: 8, xl: 10 }} px={{ base: 4, md: 6, xl: 10 }} py={{ base: 5, lg: 9 }} alignItems="start">
            <Box as="aside" display={{ base: 'none', lg: 'block' }} position="sticky" top={5} minW={0}>
                <CourseMenu active={active} onNavigate={onNavigate} />
            </Box>
            <Box minW={0} as="main" id="lesson-main">
                <Flex display={{ base: 'flex', lg: 'none' }} justify="space-between" align="center" mb={4} bg="white" borderWidth="1px" borderColor="gray.200" borderRadius="lg" p={3} gap={3}>
                    <Box><Text fontSize="xs" color="gray.400">{t("learning.currentLesson")}</Text><Text fontWeight="semibold" fontSize="sm">{title}</Text></Box><Button ref={buttonRef} size="sm" variant="outline" leftIcon={<HamburgerIcon />} onClick={onOpen}>{t("learning.courseMenu")}</Button>
                </Flex>
                <Box as="details" display={manual.isOpen ? 'none' : undefined} mb={5} borderBottomWidth="1px" borderColor="gray.200" pb={3}>
                    <Flex as="summary" align="center" justify="space-between" gap={3} cursor="pointer" color="gray.500" fontSize="xs"><Text>{t("site.currentContext")} · {selectedMint ? t("learning.experimentMintSelected") : t("learning.noExperimentMintSelected")}</Text><Text flexShrink={0}>{t("learning.viewContext")}</Text></Flex>
                    <Grid templateColumns={{ base: 'minmax(0, 1fr)', md: 'repeat(2, minmax(0, 1fr))' }} gap={3} mt={3}>
                        <AccountAddress label={t("learning.currentTestWallet")} value={walletAddress} compact description={t("learning.theWalletThatSignsAndPaysFeesNotA")} />
                        {selectedMint ? <AccountAddress label={t("learning.currentExperimentMint")} value={selectedMint} compact description={t("learning.selectedFromACreationResultOrAssetCardA")} /> : <Box p={3} bg="white" borderRadius="lg"><Text fontSize="xs" color="gray.500">{t("learning.chooseAMintFromACreationResultOrMy")}</Text></Box>}
                    </Grid>
                </Box>
                {children}
                <SiteFooter />
            </Box>
        </Grid>
        <Drawer isOpen={isOpen} placement="left" onClose={onClose} finalFocusRef={buttonRef} size="xs"><DrawerOverlay /><DrawerContent><DrawerCloseButton aria-label={t("learning.closeCourseMenu")} /><DrawerHeader fontSize="xl">{t("learning.chooseAnExperiment")}</DrawerHeader><DrawerBody pb={6}><CourseMenu active={active} onNavigate={id => { onNavigate(id); onClose(); }} onManualOpen={onClose} /></DrawerBody></DrawerContent></Drawer>
    </Box>;
}
