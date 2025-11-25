export type Language = "en" | "es";

export interface LanguageStrings {
  // Navigation
  home: string;
  currentlyWatching: string;
  wantToWatch: string;
  watched: string;
  alreadyWatched: string;
  holidays: string;
  discovery: string;

  // Actions
  wantToWatchAction: string;
  currentlyWatchingAction: string;
  watchedAction: string;
  notInterestedAction: string;
  deleteAction: string;
  removeAction: string;
  reviewNotesAction: string;
  addTagAction: string;
  holidayAddAction: string;

  // Settings
  settings: string;
  general: string;
  notifications: string;
  accountAndProfile: string;
  displayAndLayout: string;
  notificationSettings: string;
  notificationSettingsDescription: string;
  notificationCenter: string;
  notificationCenterDescription: string;
  currentSettings: string;
  notificationTiming: string;
  notificationMethods: string;
  episodeReminders: string;
  enabled: string;
  disabled: string;
  timing24HoursBefore: string;
  timingCustomPro: string;
  methodsInAppPush: string;
  methodsInAppPushEmail: string;
  layout: string;
  data: string;
  pro: string;
  about: string;

  // General Settings
  displayName: string;
  myStatistics: string;
  tvShows: string;
  movies: string;
  notInterested: string;
  notInterestedManagement: string;
  manageNotInterestedList: string;
  personalityLevel: string;
  regular: string;
  semiSarcastic: string;
  severelySarcastic: string;
  friendlyAndHelpful: string;
  aBitCheeky: string;
  maximumSass: string;
  preview: string;
  resetSystemToDefaults: string;
  resetSettingsToDefaults: string;
  confirmResetSettings: string;
  resetSettingsSuccess: string;

  // Layout Settings
  themePreference: string;
  dark: string;
  light: string;
  darkBackgroundWithLightText: string;
  lightBackgroundWithDarkText: string;
  condensedView: string;
  enableEpisodeTracking: string;
  discoveryRecommendations: string;
  discoveryRecommendationsDescription: string;
  otherLayoutSettings: string;
  condensedViewDescription: string;
  episodeTrackingCondensedProRequired: string;
  episodeTrackingCondensedProAllowed: string;
  proFeatures: string;
  themePacksComingSoon: string;

  // My Lists
  myLists: string;
  enterListName: string;
  addToList: string;
  selectListFor: string;
  items: string;
  noListsYet: string;
  createFirstList: string;
  createNewList: string;
  listName: string;
  listDescription: string;
  listDescriptionOptional: string;
  default: string;
  edit: string;
  setAsDefault: string;
  delete: string;
  noListsCreated: string;
  createYourFirstList: string;
  listsUsed: string;
  confirmDeleteList: string;
  thisActionCannotBeUndone: string;
  save: string;
  cancel: string;
  darkThemeDescription: string;
  lightThemeDescription: string;

  // Additional My Lists
  enterNewName: string;
  rename: string;
  addItemsFromSearchOrDiscovery: string;
  createListsToOrganize: string;
  maxListsReached: string;
  upgradeForMoreLists: string;
  upgradeToPro: string;
  proUpgradeComingSoon: string;
  itemAlreadyExists: string;
  alreadyInList: string;
  confirmMoveToList: string;
  moveToList: string;
  listNotFound: string;
  failedToCreateList: string;
  failedToUpdateList: string;
  failedToDeleteList: string;
  failedToSetDefaultList: string;
  forYouSectionConfiguration: string;
  forYouSectionDescription: string;
  forYouAddAnotherRow: string;
  forYouTipText: string;

  // Notifications
  notificationTypes: string;
  upcomingEpisodeAlerts: string;
  weeklyDiscover: string;
  monthlyStatsDigest: string;
  alertConfiguration: string;
  advancedNotificationByLeadTime: string;
  pickTheList: string;

  // Data Management
  standardDataManagement: string;
  shareList: string;
  chooseListsAndShowsToShare: string;
  generatesCopyPasteableFormattedList: string;
  backupSystem: string;
  exportAllPersonalData: string;
  import: string;
  importPreviouslyExportedData: string;
  resetAllData: string;
  restoreSystemToDefaults: string;
  advancedSharingOptions: string;

  // Pro Features
  proManagement: string;
  unlockProFeatures: string;
  paymentPromptNotImplemented: string;
  proFeatureList: string;
  alertConfigurationDetails: string;
  hourlyConfig: string;
  themePacks: string;
  holidayAndMovieThemes: string;
  socialFeatures: string;
  flickwordTriviaSharedWatchlists: string;
  bloopersBehindTheScenes: string;
  activatesButtonOnShowCards: string;
  additionalFeaturesTBD: string;

  // About
  informationSections: string;
  aboutUniqueForYou: string;
  aboutTheCreators: string;
  aboutTheApp: string;
  shareYourThoughts: string;
  feedbackQuotesForMarquee: string;
  clipsForHomePagePlayer: string;
  venting: string;

  // Authentication
  signIn: string;
  signOut: string;
  signInHere: string;
  clickToSignOut: string;
  clickToSignIn: string;
  signedInAs: string;
  signInWithGoogle: string;
  signInWithApple: string;
  signInWithEmail: string;
  signInDescription: string;
  welcomeToFlicklet: string;
  whatShouldWeCallYou: string;
  username: string;
  usernameRequired: string;
  usernameDescription: string;
  saving: string;
  skip: string;

  // Common
  close: string;
  confirm: string;
  areYouSure: string;
  comingSoon: string;
  notImplemented: string;

  // Home Rails
  yourShows: string;
  upNext: string;
  inTheatersNearYou: string;

  // Placeholders
  noShowsInCurrentlyWatching: string;
  addSomeFromSearchOrDiscovery: string;
  noUpcomingEpisodes: string;
  addTvShowsToWatchingList: string;
  noPoster: string;

  // Statistics
  currentlyWatchingCount: string;
  wantToWatchCount: string;
  watchedCount: string;
  totalCount: string;

  // Feedback Panel
  tellUsWhatToImprove: string;
  typeYourFeedback: string;
  sendFeedback: string;
  whatsComing: string;
  betterRecommendations: string;
  episodeUpNextWithDates: string;
  shareListsWithFriends: string;

  // Theater Info
  yourLocalTheater: string;

  // Header
  logIn: string;
  logOut: string;
  guest: string;

  // Search Results
  noSynopsisAvailable: string;
  opensInTmdb: string;
  searchFailed: string;

  // Personality Messages
  procrastinatingProductively: string;
  curatingYourIndecision: string;
  becauseTimeIsAnIllusion: string;
  cinemaNowWithCommitmentIssues: string;
  yourBacklogCalledItsGrowing: string;

  // Confirmation Messages
  areYouSureChangeDisplayName: string;
  thisWillUpdateYourProfile: string;
  areYouSureResetSettings: string;
  usernameUpdateFailed: string;

  // Language Labels
  language: string;
  english: string;
  spanish: string;

  // Home Page Sections
  community: string;
  forYou: string;
  feedback: string;

  // Games
  flickword: string;
  flickword_tagline: string;
  daily_trivia: string;
  daily_trivia_tagline: string;
  play_now: string;
  close_game: string;
  games: string;
  won: string;
  lost: string;
  streak: string;
  best: string;
  win_percent: string;
  played: string;
  accuracy: string;

  // Theater
  detectingLocation: string;
  locationUnavailable: string;
  enableLocation: string;
  hideShowtimes: string;
  findShowtimes: string;
  loadingTheaters: string;
  noTheatersFound: string;
  kmAway: string;
  hideTimes: string;
  showTimes: string;
  todaysShowtimes: string;

  // Personality
  hasExquisiteTaste: string;
  definitelyNotProcrastinating: string;
  breaksForPopcornOnly: string;
  curatesChaosLikeAPro: string;

  // Community Player
  community_player_placeholder: string;

  // Data Management
  dataManagementComingSoon: string;

  // Rail Titles
  drama: string;
  comedy: string;
  horror: string;
  nowPlaying: string;

  // Search
  searchPlaceholder: string;
  allGenres: string;
  action: string;
  search: string;
  clear: string;

  // Marquee Controls
  showMarquee: string;
  hideMarquee: string;

  // Marquee Messages
  marqueeMessage1: string;
  marqueeMessage2: string;
  marqueeMessage3: string;
  marqueeMessage4: string;
  marqueeMessage5: string;
}
