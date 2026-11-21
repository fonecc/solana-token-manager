import { useMemo } from 'react';
import { useT } from '../../i18n/useT';
import type { Translate, MessageKey } from '../../i18n/message';

export type LessonId = 'overview' | 'assets' | 'create' | 'metadata' | 'mint' | 'freeze' | 'burn' | 'pool' | 'liquidity' | 'swap';
export interface Lesson {
    id: Exclude<LessonId, 'overview'>;
    number: string;
    title: MessageKey;
    shortTitle: MessageKey;
    group: LessonGroup;
    goal: MessageKey;
    prepare: MessageKey;
    concepts: { title: MessageKey; text: MessageKey }[];
    checks: MessageKey[];
}

export const lessons: Lesson[] = [
    { id: 'assets', number: '↗', title: "learning.understandYourAssetsAndAuthorities", shortTitle: "learning.myAssets", group: "start", goal: "learning.distinguishWhatYouHoldFromWhatYouCanManage", prepare: "learning.connectASeparateTestWalletReadingBalancesNeedsNo", concepts: [{ title: "learning.holdingTokensIsNotAuthority", text: "learning.balancesTrackHoldingsMintingFreezingAndMetadataUpdatesEach" }, { title: "learning.solAndYourTokens", text: "learning.solPaysNetworkFeesAndAccountRentWrappedSol" }, { title: "learning.transfersAndPermanentRevocation", text: "learning.transfersChangeBalancesNotTotalSupplyRevocationPermanentlyRemoves" }], checks: ["learning.afterATransferCheckBothSendingAndReceivingAta", "learning.afterRevocationCheckThatTheMintAuthorityInQuestion"] },
    { id: 'create', number: '01', title: "learning.createATokenSIdentity", shortTitle: "learning.createToken", group: "basics", goal: "learning.createAMintAndYourTokenAccountLearnWhy", prepare: "learning.prepareASeparateTestWalletAndALittleDevnet", concepts: [{ title: "learning.mintTokenIdentifier", text: "learning.storesDecimalsSupplyAndAuthoritiesNamesMayBeIdentical" }, { title: "learning.ataAssociatedTokenAccount", text: "learning.linksAWalletToOneTokenAndRecordsThe" }, { title: "learning.precisionIsNotIssuance", text: "learning.decimalsDefineTheSmallestFractionOfATokenThey" }], checks: ["learning.theMintIsInitializedWithTheSelectedDecimals", "learning.yourAtaMatchesTheCorrectWalletAndMintSupply"] },
    { id: 'metadata', number: '02', title: "learning.giveYourTokenANameAndSymbol", shortTitle: "learning.nameAndImage", group: "basics", goal: "learning.associateANameSymbolAndOptionalJsonUrlWith", prepare: "learning.initialSetupRequiresMintAuthorityEditingExistingMetadataRequires", concepts: [{ title: "learning.displayInformationDoesNotChangeTheToken", text: "learning.metadataDoesNotChangeTheMintAddressDecimalsSupply" }, { title: "learning.theUriPointsToJson", text: "learning.imagesAndAdditionalDetailsComeFromTheJsonAt" }, { title: "learning.futureUpdatesAndPermanentLocking", text: "learning.whileMutableTheUpdateAuthorityCanEditMetadataTurning" }], checks: ["learning.metadataShownInExplorerBelongsToTheIntendedMint", "learning.nameSymbolUriAndMutabilityMatchYourSigningReview"] },
    { id: 'mint', number: '03', title: "learning.mintTokensIntoAnAccount", shortTitle: "learning.mintTokens", group: "basics", goal: "learning.issueASmallAdditionalAmountToAWalletObserve", prepare: "learning.yourWalletNeedsMintAuthorityAMintWhoseMint", concepts: [{ title: "learning.additionalAmountNotTargetSupply", text: "learning.entering10Issues10MoreTokensItDoesNot" }, { title: "learning.useAWalletAddressForTheRecipient", text: "learning.theAppDerivesTheRecipientAtaAndCreatesIt" }], checks: ["learning.theRecipientWalletSAtaBalanceIncreases", "learning.mintSupplyIncreasesByTheSameAmountDecimalsRemain"] },
    { id: 'freeze', number: '04', title: "learning.freezeAndThawATokenAccount", shortTitle: "learning.freezeAndThaw", group: "authorities", goal: "learning.observeASpecificAtaSStateChangingRatherThan", prepare: "learning.requiresFreezeAuthorityReadTheTokenAuthorityThenCheck", concepts: [{ title: "learning.aSpecificAtaIsFrozen", text: "learning.enterTheTargetWalletTheAppDerivesItsAta" }, { title: "learning.freezingIsNotRevocation", text: "learning.aWalletRetainingFreezeAuthorityCanThawAnAccount" }], checks: ["learning.theTargetAtaChangesBetweenFrozenAndInitializedAs", "learning.freezingOrThawingDoesNotChangeBalancesOrTotal"] },
    { id: 'burn', number: '05', title: "learning.burnASmallHoldingAndObserveSupply", shortTitle: "TokenList.burnTokens", group: "authorities", goal: "learning.permanentlyReduceTokensInYourAtaAndVerifyThe", prepare: "learning.yourAtaMustHaveAnAvailableBalanceAndNot", concepts: [{ title: "learning.lessBalanceAndLessSupply", text: "learning.burningIsNotSendingTokensElsewhereTheBurnedTokens" }, { title: "learning.burningDoesNotDisableMinting", text: "learning.burningDoesNotRevokeMintAuthorityItsHolderCan" }], checks: ["learning.yourAtaBalanceDecreasesByTheBurnedAmount", "learning.mintSupplyDecreasesTheMintAddressAndAuthoritiesRemain"] },
    { id: 'pool', number: '06', title: "learning.buildALiquidityPoolFromTwoAssets", shortTitle: "TokenList.createLiquidityPool", group: "defi", goal: "learning.prepareAMarketThenDepositTheTokenAndSol", prepare: "learning.requiresTokenHoldingsDepositSolAndExtraSolFor", concepts: [{ title: "learning.aMarketIsNotAPool", text: "learning.thisLegacyAmmV4FlowRequiresAnOpenbookMarket" }, { title: "learning.lpRepresentsLiquidityShares", text: "learning.lpTokensRepresentAPoolShareTheLpMint" }, { title: "learning.advancedLessonLimitations", text: "learning.protocolFeesAndRentCanFarExceedATransfer" }], checks: ["learning.marketAndPoolMintsCorrectlyMatchTheIntendedMint", "learning.savePoolIdMarketIdAndEachSignatureCheck"] },
    { id: 'liquidity', number: '07', title: "learning.addLiquidityToAnExistingPool", shortTitle: "TokenList.addLiquidity", group: "defi", goal: "learning.depositBothAssetsAtThePoolRatioUnderstandEstimated", prepare: "learning.obtainTheActualAmmV4PoolIdAndBoth", concepts: [{ title: "learning.bothAmountsFollowThePoolRatio", text: "learning.enterABaseAmountTheSdkEstimatesTheOther" }, { title: "learning.maximumQuoteSideDeposit", text: "learning.thisLessonUsesAFixed1BoundOnThe" }, { title: "learning.lpAndExiting", text: "learning.verifyYourLpBalanceIncreaseAfterDepositingLiquidityRemoval" }], checks: ["learning.theLoadedPoolIdAndBothMintsIdentifyThe", "learning.checkActualDebitsAndLpIncreasesFeesAreAdditional"] },
    { id: 'swap', number: '08', title: "learning.understandAQuoteBeforeSwapping", shortTitle: "learning.swapTokens", group: "defi", goal: "learning.chooseInputAndOutputTokensUnderstandEstimatesMinimumReceived", prepare: "learning.requiresAnAvailableDevnetAmmV4PoolForThe", concepts: [{ title: "learning.estimatedReceivedMinimumReceived", text: "learning.estimatesReflectCurrentPoolStateMinimumReceivedIsAn" }, { title: "learning.slippageAndPriceImpact", text: "learning.slippageIsTheQuoteMovementYouAllowPriceImpact" }, { title: "learning.quotesExpire", text: "learning.theSamePoolIsReadAgainBeforeSubmissionAn" }], checks: ["learning.checkThatInputOutputMintsDirectionAndPoolId", "learning.verifyActualBalanceChangesAndTheMinimumReceivedConstraint"] },
];
export const lessonById = Object.fromEntries(lessons.map(lesson => [lesson.id, lesson])) as Record<Exclude<LessonId, 'overview'>, Lesson>;
export const legacyLessonIds: LessonId[] = ['assets', 'create', 'metadata', 'mint', 'pool', 'burn', 'freeze', 'liquidity', 'swap'];
export const courseOrder: LessonId[] = ['overview', 'create', 'metadata', 'mint', 'assets', 'freeze', 'burn', 'pool', 'liquidity', 'swap'];
export type LessonGroup = 'start' | 'basics' | 'authorities' | 'defi';
export const lessonGroups: LessonGroup[] = ["start", "basics", "authorities", "defi"];

const groupKeys: Record<LessonGroup, MessageKey> = {
    "start": "learning.startHere",
    "basics": "home.tokenBasics",
    "authorities": "home.assetsAndAuthorities",
    "defi": "TokenList.defiAdvanced"
};

export function getCurriculum(t: Translate) {
    const localized = lessons.map(lesson => ({
        ...lesson,
        title: t(lesson.title), shortTitle: t(lesson.shortTitle),
        goal: t(lesson.goal), prepare: t(lesson.prepare),
        groupLabel: t(groupKeys[lesson.group]),
        concepts: lesson.concepts.map(concept => ({ title: t(concept.title), text: t(concept.text) })),
        checks: lesson.checks.map(check => t(check)),
    }));
    return {
        lessons: localized,
        lessonById: Object.fromEntries(localized.map(lesson => [lesson.id, lesson])) as Record<Exclude<LessonId, 'overview'>, typeof localized[number]>,
        groupLabel: (group: LessonGroup) => t(groupKeys[group]),
    };
}

export function useCurriculum() {
    const t = useT();
    return useMemo(() => getCurriculum(t), [t]);
}
