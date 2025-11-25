import type { Language, LanguageStrings } from "./language.types";

const TRANSLATIONS: Record<Language, LanguageStrings> = {
  en: {
    // Navigation
    home: "Home",
    currentlyWatching: "Currently Watching",
    wantToWatch: "Want to Watch",
    watched: "Watched",
    alreadyWatched: "Already Watched",
    holidays: "Holidays",
    discovery: "Discovery",

    // Actions
    wantToWatchAction: "Want to Watch",
    currentlyWatchingAction: "Currently Watching",
    watchedAction: "Watched",
    notInterestedAction: "Not Interested",
    deleteAction: "Delete",
    removeAction: "Remove",
    reviewNotesAction: "Review/Notes",
    addTagAction: "Add Tag",
    holidayAddAction: "Holiday +",

    // Settings
    settings: "Settings",
    general: "General",
    notifications: "Notifications",
    displayAndLayout: "Display & Layout",
    notificationSettings: "Notification Settings",
    notificationSettingsDescription: "Configure timing and methods",
    notificationCenter: "Notification Center",
    notificationCenterDescription: "View notification history",
    currentSettings: "Current Settings",
    notificationTiming: "Timing",
    notificationMethods: "Methods",
    episodeReminders: "Episode Reminders",
    enabled: "Enabled",
    disabled: "Disabled",
    timing24HoursBefore: "24 hours before",
    timingCustomPro: "Custom (Pro)",
    methodsInAppPush: "In-app, Push",
    methodsInAppPushEmail: "In-app, Push, Email",
    layout: "Layout",
    data: "Data",
    pro: "Pro",
    about: "About",
    accountAndProfile: "Account & Profile",
    resetSettingsToDefaults: "Reset Settings to Defaults",
    confirmResetSettings:
      "Are you sure you want to reset your local settings to defaults? This only affects this device.",
    resetSettingsSuccess: "Your settings have been reset to defaults.",

    // General Settings
    displayName: "Display Name",
    myStatistics: "My Statistics",
    tvShows: "TV Shows",
    movies: "Movies",
    notInterested: "Not Interested",
    notInterestedManagement: "Not Interested Management",
    manageNotInterestedList: "Manage Not Interested List",
    personalityLevel: "Personality Level",
    regular: "Regular",
    semiSarcastic: "Semi-sarcastic",
    severelySarcastic: "Severely sarcastic",
    friendlyAndHelpful: "Friendly and helpful",
    aBitCheeky: "A bit cheeky",
    maximumSass: "Maximum sass",
    preview: "Preview",
    resetSystemToDefaults: "Reset System to Defaults",

    // Layout Settings
    themePreference: "Theme Preference",
    dark: "Dark",
    light: "Light",
    darkBackgroundWithLightText: "Dark background with light text",
    lightBackgroundWithDarkText: "Light background with dark text",
    discoveryRecommendations: "Discovery Recommendations",
    discoveryRecommendationsDescription:
      "Number of recommendations to show in Discovery",
    otherLayoutSettings: "Other Layout Settings",
    condensedView: "Condensed View",
    condensedViewDescription:
      "Show more items per screen with smaller cards and shorter button labels. Hides episode tracking and detailed features.",
    enableEpisodeTracking: "Enable Episode Tracking",
    episodeTrackingCondensedProRequired:
      "Episode tracking is disabled in condensed view. Upgrade to Pro to enable it.",
    episodeTrackingCondensedProAllowed:
      "Pro users can enable episode tracking even in condensed view",
    proFeatures: "Pro Features",
    themePacksComingSoon: "Theme packs coming soon...",

    // My Lists
    myLists: "My Lists",
    enterListName: "Enter list name:",
    addToList: "Add to List",
    selectListFor: "Select a list for",
    items: "items",
    noListsYet: "No lists created yet",
    createFirstList: "Create Your First List",
    createNewList: "Create New List",
    listName: "List name",
    listDescription: "List description (optional)",
    listDescriptionOptional: "List description (optional)",
    default: "Default",
    edit: "Edit",
    setAsDefault: "Set as Default",
    delete: "Delete",
    noListsCreated: "No lists created yet",
    createYourFirstList: "Create Your First List",
    listsUsed: "Lists used",
    confirmDeleteList: "Are you sure you want to delete",
    thisActionCannotBeUndone: "This action cannot be undone.",
    save: "Save",
    cancel: "Cancel",
    darkThemeDescription: "Dark background with light text",
    lightThemeDescription: "Light background with dark text",

    // Additional My Lists
    enterNewName: "Enter new name:",
    rename: "Rename",
    addItemsFromSearchOrDiscovery: "Add items from search or discovery",
    createListsToOrganize:
      "Create lists to organize your favorite shows and movies",
    maxListsReached: "Maximum lists reached",
    upgradeForMoreLists: "Upgrade to Pro for more lists",
    upgradeToPro: "Upgrade to Pro",
    proUpgradeComingSoon: "Pro upgrade coming soon!",
    itemAlreadyExists: "Item Already Exists",
    alreadyInList: "is already in",
    confirmMoveToList: "Do you want to move it to the selected list?",
    moveToList: "Move to List",
    listNotFound: "List not found",
    failedToCreateList: "Failed to create list",
    failedToUpdateList: "Failed to update list",
    failedToDeleteList: "Failed to delete list",
    failedToSetDefaultList: "Failed to set default list",
    forYouSectionConfiguration: "For You Section Configuration",
    forYouSectionDescription:
      'Customize the three "For You" rows on your home page. Each row combines a main genre with a subgenre for personalized recommendations.',
    forYouAddAnotherRow: "+ Add Another Row",
    forYouTipText:
      "💡 Tip: Your For You section will show personalized recommendations based on these genre combinations. The titles will automatically update as you make selections.",

    // Notifications
    notificationTypes: "Notification Types",
    upcomingEpisodeAlerts: "Upcoming episode alerts",
    weeklyDiscover: "Weekly discover",
    monthlyStatsDigest: "Monthly stats digest",
    alertConfiguration: "Alert Configuration (Pro)",
    advancedNotificationByLeadTime:
      "Advanced notification by lead time in hours",
    pickTheList: "Pick the list (currently watching or want to watch)",

    // Data Management
    standardDataManagement: "Standard Data Management",
    shareList: "Share List",
    chooseListsAndShowsToShare: "Choose lists and shows to share",
    generatesCopyPasteableFormattedList:
      "Generates copy/pasteable formatted list with Flicklet branding and link",
    backupSystem: "Backup System (JSON)",
    exportAllPersonalData: "Export all personal data",
    import: "Import (JSON)",
    importPreviouslyExportedData: "Import previously exported data",
    resetAllData: "Reset All Data",
    restoreSystemToDefaults: "Restore system to defaults",
    advancedSharingOptions: "Advanced sharing options",

    // Pro Features
    proManagement: "Pro Management",
    unlockProFeatures:
      "Unlock pro features button (payment prompt - not implemented)",
    paymentPromptNotImplemented: "Payment prompt - not implemented",
    proFeatureList: "Pro feature list and descriptions",
    alertConfigurationDetails: "Alert configuration details (hourly config)",
    hourlyConfig: "Hourly config",
    themePacks: "Theme packs (holiday and movie themes - not implemented)",
    holidayAndMovieThemes: "Holiday and movie themes - not implemented",
    socialFeatures:
      "Social features (FlickWord, Trivia, shared watchlists among friends)",
    flickwordTriviaSharedWatchlists:
      "FlickWord, Trivia, shared watchlists among friends",
    bloopersBehindTheScenes:
      "Bloopers/Behind the scenes (activates button on show cards)",
    activatesButtonOnShowCards: "Activates button on show cards",
    additionalFeaturesTBD: "Additional features TBD",

    // About
    informationSections: "Information Sections",
    aboutUniqueForYou: "About unique for you",
    aboutTheCreators: "About the creators",
    aboutTheApp: "About the app",
    shareYourThoughts:
      "Share your thoughts (feedback, quotes for marquee, clips for home page player, venting, etc.)",
    feedbackQuotesForMarquee:
      "Feedback, quotes for marquee, clips for home page player, venting, etc.",
    clipsForHomePagePlayer: "Clips for home page player",
    venting: "Venting",

    // Authentication
    signIn: "Sign In",
    signOut: "Sign Out",
    signInHere: "Sign in here",
    clickToSignOut: "Click to sign out",
    clickToSignIn: "Click to sign in",
    signedInAs: "Signed in as",
    signInWithGoogle: "Sign in with Google",
    signInWithApple: "Sign in with Apple",
    signInWithEmail: "Sign in with Email",
    signInDescription: "Sign in to sync your lists across devices",
    welcomeToFlicklet: "Welcome to Flicklet!",
    whatShouldWeCallYou: "What should we call you?",
    username: "Username",
    usernameRequired: "Username is required",
    usernameDescription: "This will be used for personalized messages",
    saving: "Saving...",
    skip: "Skip",

    // Common
    close: "Close",
    confirm: "Confirm",
    areYouSure: "Are you sure?",
    comingSoon: "Coming soon...",
    notImplemented: "Not implemented",

    // Home Rails
    yourShows: "Your Shows",
    upNext: "Up Next",
    inTheatersNearYou: "In Theaters Near You",

    // Placeholders
    noShowsInCurrentlyWatching:
      "No shows in your currently watching list. Add some from search or discovery!",
    addSomeFromSearchOrDiscovery: "Add some from search or discovery!",
    noUpcomingEpisodes:
      "No upcoming episodes. Add TV shows to your watching list to see when new episodes air!",
    addTvShowsToWatchingList:
      "Add TV shows to your watching list to see when new episodes air!",
    noPoster: "No poster",

    // Statistics
    currentlyWatchingCount: "Currently Watching",
    wantToWatchCount: "Want to Watch",
    watchedCount: "Watched",
    totalCount: "Total",

    // Feedback Panel
    tellUsWhatToImprove: "Tell us what to improve",
    typeYourFeedback: "Type your feedback...",
    sendFeedback: "Send Feedback",
    whatsComing: "What's coming",
    betterRecommendations: "Better recommendations",
    episodeUpNextWithDates: 'Episode "Up Next" with dates',
    shareListsWithFriends: "Share lists with friends",

    // Theater Info
    yourLocalTheater: "Your Local Theater",

    // Header
    logIn: "Log in",
    logOut: "Log out",
    guest: "Guest",

    // Search Results
    noSynopsisAvailable: "No synopsis available.",
    opensInTmdb: "Opens in TMDB",
    searchFailed: "Search failed",

    // Personality Messages
    procrastinatingProductively: "Procrastinating productively.",
    curatingYourIndecision: "Curating your indecision.",
    becauseTimeIsAnIllusion: "Because time is an illusion.",
    cinemaNowWithCommitmentIssues: "Cinema, now with commitment issues.",
    yourBacklogCalledItsGrowing: "Your backlog called. It's growing.",

    // Confirmation Messages
    areYouSureChangeDisplayName:
      "Are you sure you want to change your display name?",
    thisWillUpdateYourProfile: "This will update your profile.",
    areYouSureResetSettings:
      "Are you sure you want to reset all settings to defaults?",
    usernameUpdateFailed: "Failed to update username. Please try again.",

    // Language Labels
    language: "Language",
    english: "English",
    spanish: "Español",

    // Home Page Sections
    community: "Community",
    forYou: "For you",
    feedback: "Feedback",

    // Games
    flickword: "FlickWord",
    flickword_tagline: "Wordle-style daily word play",
    daily_trivia: "Daily Trivia",
    daily_trivia_tagline: "Fresh question, new bragging rights",
    play_now: "Play Now",
    close_game: "Close Game",
    games: "Games",
    won: "Won",
    lost: "Lost",
    streak: "Streak",
    best: "Best",
    win_percent: "Win %",
    played: "Played",
    accuracy: "Accuracy",

    // Theater
    detectingLocation: "Detecting your location...",
    locationUnavailable: "Location unavailable",
    enableLocation: "Enable location",
    hideShowtimes: "Hide",
    findShowtimes: "Find",
    loadingTheaters: "Loading theaters...",
    noTheatersFound:
      "No theaters found nearby. Try expanding your search radius.",
    kmAway: "km away",
    hideTimes: "Hide",
    showTimes: "Show",
    todaysShowtimes: "Today's Showtimes:",

    // Rail Titles
    drama: "Drama",
    comedy: "Comedy",
    horror: "Horror",
    nowPlaying: "Now Playing",

    // Personality
    hasExquisiteTaste: "Has exquisite taste",
    definitelyNotProcrastinating: "Definitely not procrastinating",
    breaksForPopcornOnly: "Breaks for popcorn only",
    curatesChaosLikeAPro: "Curates chaos like a pro",

    // Community Player
    community_player_placeholder: "Community content coming soon",

    // Data Management
    dataManagementComingSoon: "Data management features coming soon",

    // Search
    searchPlaceholder: "Search movies, shows, people…",
    allGenres: "All genres",
    action: "Action",
    search: "Search",
    clear: "Clear",

    // Marquee Controls
    showMarquee: "Show marquee",
    hideMarquee: "Hide",

    // Marquee Messages
    marqueeMessage1: "I'm sorry, Dave. I'm afraid I can't do that.",
    marqueeMessage2: "Roads? Where we're going, we don't need roads.",
    marqueeMessage3: "Houston, we have a problem.",
    marqueeMessage4: "May the odds be ever in your favor.",
    marqueeMessage5: "I'll be back.",

    // Theater & Location
  },

  es: {
    // Navigation
    home: "Inicio",
    currentlyWatching: "Viendo Ahora",
    wantToWatch: "Quiero Ver",
    watched: "Visto",
    alreadyWatched: "Ya Visto",
    holidays: "Fiestas",
    discovery: "Descubrir",

    // Actions
    wantToWatchAction: "Quiero Ver",
    currentlyWatchingAction: "Viendo Ahora",
    watchedAction: "Visto",
    notInterestedAction: "No Me Interesa",
    deleteAction: "Eliminar",
    removeAction: "Quitar",
    reviewNotesAction: "Reseña/Notas",
    addTagAction: "Agregar Etiqueta",
    holidayAddAction: "Fiesta +",

    // Settings
    settings: "Configuración",
    general: "General",
    notifications: "Notificaciones",
    displayAndLayout: "Pantalla y diseño",
    notificationSettings: "Configuración de notificaciones",
    notificationSettingsDescription: "Configura el horario y los métodos",
    notificationCenter: "Centro de notificaciones",
    notificationCenterDescription: "Ver historial de notificaciones",
    currentSettings: "Configuración actual",
    notificationTiming: "Horario",
    notificationMethods: "Métodos",
    episodeReminders: "Recordatorios de episodios",
    enabled: "Activado",
    disabled: "Desactivado",
    timing24HoursBefore: "24 horas antes",
    timingCustomPro: "Personalizado (Pro)",
    methodsInAppPush: "En la app, Push",
    methodsInAppPushEmail: "En la app, Push, Email",
    layout: "Diseño",
    data: "Datos",
    pro: "Pro",
    about: "Acerca De",
    accountAndProfile: "Cuenta y perfil",
    resetSettingsToDefaults:
      "Restablecer configuración a valores predeterminados",
    confirmResetSettings:
      "¿Estás seguro de que quieres restablecer la configuración local a valores predeterminados? Esto solo afecta a este dispositivo.",
    resetSettingsSuccess:
      "Tu configuración se ha restablecido a los valores predeterminados.",

    // General Settings
    displayName: "Nombre de Pantalla",
    myStatistics: "Mis Estadísticas",
    tvShows: "Programas de TV",
    movies: "Películas",
    notInterested: "No Me Interesa",
    notInterestedManagement: "Gestión de No Me Interesa",
    manageNotInterestedList: "Gestionar Lista de No Me Interesa",
    personalityLevel: "Nivel de Personalidad",
    regular: "Regular",
    semiSarcastic: "Semi-sarcástico",
    severelySarcastic: "Severamente sarcástico",
    friendlyAndHelpful: "Amigable y útil",
    aBitCheeky: "Un poco descarado",
    maximumSass: "Máximo descaro",
    preview: "Vista Previa",
    resetSystemToDefaults: "Restablecer Sistema a Valores Predeterminados",

    // Layout Settings
    themePreference: "Preferencia de Tema",
    dark: "Oscuro",
    light: "Claro",
    darkBackgroundWithLightText: "Fondo oscuro con texto claro",
    lightBackgroundWithDarkText: "Fondo claro con texto oscuro",
    discoveryRecommendations: "Recomendaciones de descubrimiento",
    discoveryRecommendationsDescription:
      "Número de recomendaciones que se muestran en Descubrir",
    otherLayoutSettings: "Otras opciones de diseño",
    condensedView: "Vista condensada",
    condensedViewDescription:
      "Muestra más elementos por pantalla con tarjetas más pequeñas y etiquetas de botones más cortas. Oculta seguimiento de episodios y funciones detalladas.",
    enableEpisodeTracking: "Habilitar Seguimiento de Episodios",
    episodeTrackingCondensedProRequired:
      "El seguimiento de episodios está desactivado en la vista condensada. Actualiza a Pro para activarlo.",
    episodeTrackingCondensedProAllowed:
      "Los usuarios Pro pueden activar el seguimiento de episodios incluso en vista condensada",
    proFeatures: "Características Pro",
    themePacksComingSoon: "Paquetes de temas próximamente...",

    // My Lists
    myLists: "Mis Listas",
    enterListName: "Ingresa nombre de lista:",
    addToList: "Agregar a Lista",
    selectListFor: "Selecciona una lista para",
    items: "elementos",
    noListsYet: "Aún no hay listas creadas",
    createFirstList: "Crea Tu Primera Lista",
    createNewList: "Crear Nueva Lista",
    listName: "Nombre de lista",
    listDescription: "Descripción de lista (opcional)",
    listDescriptionOptional: "Descripción de lista (opcional)",
    default: "Predeterminada",
    edit: "Editar",
    setAsDefault: "Establecer como Predeterminada",
    delete: "Eliminar",
    noListsCreated: "Aún no hay listas creadas",
    createYourFirstList: "Crea Tu Primera Lista",
    listsUsed: "Listas usadas",
    confirmDeleteList: "¿Estás seguro de que quieres eliminar",
    thisActionCannotBeUndone: "Esta acción no se puede deshacer.",
    save: "Guardar",
    cancel: "Cancelar",
    darkThemeDescription: "Fondo oscuro con texto claro",
    lightThemeDescription: "Fondo claro con texto oscuro",

    // Additional My Lists
    enterNewName: "Ingresa nuevo nombre:",
    rename: "Renombrar",
    addItemsFromSearchOrDiscovery:
      "Agregar elementos desde búsqueda o descubrimiento",
    createListsToOrganize:
      "Crea listas para organizar tus programas y películas favoritas",
    maxListsReached: "Máximo de listas alcanzado",
    upgradeForMoreLists: "Actualiza a Pro para más listas",
    upgradeToPro: "Actualizar a Pro",
    proUpgradeComingSoon: "¡Actualización a Pro próximamente!",
    itemAlreadyExists: "El Elemento Ya Existe",
    alreadyInList: "ya está en",
    confirmMoveToList: "¿Quieres moverlo a la lista seleccionada?",
    moveToList: "Mover a Lista",
    listNotFound: "Lista no encontrada",
    failedToCreateList: "No se pudo crear la lista",
    failedToUpdateList: "No se pudo actualizar la lista",
    failedToDeleteList: "No se pudo eliminar la lista",
    failedToSetDefaultList:
      "No se pudo establecer la lista como predeterminada",
    forYouSectionConfiguration: "Configuración de la sección Para ti",
    forYouSectionDescription:
      'Personaliza las tres filas "Para ti" de tu página principal. Cada fila combina un género principal con un subgénero para recomendaciones personalizadas.',
    forYouAddAnotherRow: "+ Agregar otra fila",
    forYouTipText:
      "💡 Consejo: Tu sección Para ti mostrará recomendaciones personalizadas según estas combinaciones de géneros. Los títulos se actualizarán automáticamente conforme hagas selecciones.",

    // Notifications
    notificationTypes: "Tipos de Notificación",
    upcomingEpisodeAlerts: "Alertas de episodios próximos",
    weeklyDiscover: "Descubrimiento semanal",
    monthlyStatsDigest: "Resumen de estadísticas mensuales",
    alertConfiguration: "Configuración de Alertas (Pro)",
    advancedNotificationByLeadTime:
      "Notificación avanzada por tiempo de anticipación en horas",
    pickTheList: "Elige la lista (viendo ahora o quiero ver)",

    // Data Management
    standardDataManagement: "Gestión de Datos Estándar",
    shareList: "Compartir Lista",
    chooseListsAndShowsToShare: "Elige listas y programas para compartir",
    generatesCopyPasteableFormattedList:
      "Genera lista formateada copiable/pegable con marca Flicklet y enlace",
    backupSystem: "Sistema de Respaldo (JSON)",
    exportAllPersonalData: "Exportar todos los datos personales",
    import: "Importar (JSON)",
    importPreviouslyExportedData: "Importar datos previamente exportados",
    resetAllData: "Restablecer Todos los Datos",
    restoreSystemToDefaults: "Restaurar sistema a valores predeterminados",
    advancedSharingOptions: "Opciones de compartir avanzadas",

    // Pro Features
    proManagement: "Gestión Pro",
    unlockProFeatures:
      "Botón de desbloquear características pro (prompt de pago - no implementado)",
    paymentPromptNotImplemented: "Prompt de pago - no implementado",
    proFeatureList: "Lista de características pro y descripciones",
    alertConfigurationDetails:
      "Detalles de configuración de alertas (configuración por horas)",
    hourlyConfig: "Configuración por horas",
    themePacks:
      "Paquetes de temas (temas de fiestas y películas - no implementado)",
    holidayAndMovieThemes: "Temas de fiestas y películas - no implementado",
    socialFeatures:
      "Características sociales (FlickWord, Trivia, listas compartidas entre amigos)",
    flickwordTriviaSharedWatchlists:
      "FlickWord, Trivia, listas compartidas entre amigos",
    bloopersBehindTheScenes:
      "Bloopers/Detrás de escena (activa botón en tarjetas de programas)",
    activatesButtonOnShowCards: "Activa botón en tarjetas de programas",
    additionalFeaturesTBD: "Características adicionales por determinar",

    // About
    informationSections: "Secciones de Información",
    aboutUniqueForYou: "Acerca de único para ti",
    aboutTheCreators: "Acerca de los creadores",
    aboutTheApp: "Acerca de la aplicación",
    shareYourThoughts:
      "Comparte tus pensamientos (comentarios, citas para marquesina, clips para reproductor de página principal, desahogo, etc.)",
    feedbackQuotesForMarquee:
      "Comentarios, citas para marquesina, clips para reproductor de página principal, desahogo, etc.",
    clipsForHomePagePlayer: "Clips para reproductor de página principal",
    venting: "Desahogo",

    // Authentication
    signIn: "Iniciar Sesión",
    signOut: "Cerrar Sesión",
    signInHere: "Inicia sesión aquí",
    clickToSignOut: "Haz clic para cerrar sesión",
    clickToSignIn: "Haz clic para iniciar sesión",
    signedInAs: "Conectado como",
    signInWithGoogle: "Iniciar sesión con Google",
    signInWithApple: "Iniciar sesión con Apple",
    signInWithEmail: "Iniciar sesión con Email",
    signInDescription:
      "Inicia sesión para sincronizar tus listas entre dispositivos",
    welcomeToFlicklet: "¡Bienvenido a Flicklet!",
    whatShouldWeCallYou: "¿Cómo deberíamos llamarte?",
    username: "Nombre de usuario",
    usernameRequired: "El nombre de usuario es requerido",
    usernameDescription: "Esto se usará para mensajes personalizados",
    saving: "Guardando...",
    skip: "Omitir",

    // Common
    close: "Cerrar",
    confirm: "Confirmar",
    areYouSure: "¿Estás seguro?",
    comingSoon: "Próximamente...",
    notImplemented: "No implementado",

    // Home Rails
    yourShows: "Tus Programas",
    upNext: "Próximamente",
    inTheatersNearYou: "En Cines Cerca de Ti",

    // Placeholders
    noShowsInCurrentlyWatching:
      "No hay programas en tu lista de viendo ahora. ¡Agrega algunos desde búsqueda o descubrimiento!",
    addSomeFromSearchOrDiscovery:
      "¡Agrega algunos desde búsqueda o descubrimiento!",
    noUpcomingEpisodes:
      "No hay episodios próximos. ¡Agrega programas de TV a tu lista de viendo para ver cuándo salen nuevos episodios!",
    addTvShowsToWatchingList:
      "¡Agrega programas de TV a tu lista de viendo para ver cuándo salen nuevos episodios!",
    noPoster: "Sin póster",

    // Statistics
    currentlyWatchingCount: "Viendo Ahora",
    wantToWatchCount: "Quiero Ver",
    watchedCount: "Visto",
    totalCount: "Total",

    // Feedback Panel
    tellUsWhatToImprove: "Dinos qué mejorar",
    typeYourFeedback: "Escribe tu comentario...",
    sendFeedback: "Enviar Comentario",
    whatsComing: "Lo que viene",
    betterRecommendations: "Mejores recomendaciones",
    episodeUpNextWithDates: 'Episodio "Próximo" con fechas',
    shareListsWithFriends: "Compartir listas con amigos",

    // Theater Info
    yourLocalTheater: "Tu Cine Local",

    // Header
    logIn: "Iniciar sesión",
    logOut: "Cerrar sesión",
    guest: "Invitado",

    // Search Results
    noSynopsisAvailable: "Sin sinopsis disponible.",
    opensInTmdb: "Abre en TMDB",
    searchFailed: "Búsqueda fallida",

    // Personality Messages
    procrastinatingProductively: "Procrastinando productivamente.",
    curatingYourIndecision: "Curando tu indecisión.",
    becauseTimeIsAnIllusion: "Porque el tiempo es una ilusión.",
    cinemaNowWithCommitmentIssues: "Cine, ahora con problemas de compromiso.",
    yourBacklogCalledItsGrowing: "Tu lista pendiente llamó. Está creciendo.",

    // Confirmation Messages
    areYouSureChangeDisplayName:
      "¿Estás seguro de que quieres cambiar tu nombre de pantalla?",
    thisWillUpdateYourProfile: "Esto actualizará tu perfil.",
    areYouSureResetSettings:
      "¿Estás seguro de que quieres restablecer todas las configuraciones a los valores predeterminados?",
    usernameUpdateFailed:
      "No se pudo actualizar el nombre de usuario. Inténtalo de nuevo.",

    // Language Labels
    language: "Idioma",
    english: "English",
    spanish: "Español",

    // Home Page Sections
    community: "Comunidad",
    forYou: "Para ti",
    feedback: "Comentarios",

    // Games
    flickword: "FlickWord",
    flickword_tagline: "Juego de palabras diario estilo Wordle",
    daily_trivia: "Trivia Diaria",
    daily_trivia_tagline: "Pregunta fresca, nuevos derechos de presumir",
    play_now: "Jugar Ahora",
    close_game: "Cerrar Juego",
    games: "Juegos",
    won: "Ganados",
    lost: "Perdidos",
    streak: "Racha",
    best: "Mejor",
    win_percent: "% Ganados",
    played: "Jugados",
    accuracy: "Precisión",

    // Theater
    detectingLocation: "Detectando tu ubicación...",
    locationUnavailable: "Ubicación no disponible",
    enableLocation: "Habilitar ubicación",
    hideShowtimes: "Ocultar",
    findShowtimes: "Buscar",
    loadingTheaters: "Cargando cines...",
    noTheatersFound:
      "No se encontraron cines cerca. Intenta expandir tu radio de búsqueda.",
    kmAway: "km de distancia",
    hideTimes: "Ocultar",
    showTimes: "Mostrar",
    todaysShowtimes: "Horarios de Hoy:",

    // Personality
    hasExquisiteTaste: "Tiene gusto exquisito",
    definitelyNotProcrastinating: "Definitivamente no procrastinando",
    breaksForPopcornOnly: "Descansos solo para palomitas",
    curatesChaosLikeAPro: "Curaduría del caos como profesional",

    // Community Player
    community_player_placeholder: "Contenido comunitario próximamente",

    // Data Management
    dataManagementComingSoon: "Funciones de gestión de datos próximamente",

    // Rail Titles
    drama: "Drama",
    comedy: "Comedia",
    horror: "Terror",
    nowPlaying: "En Cartelera",

    // Search
    searchPlaceholder: "Buscar películas, programas, personas…",
    allGenres: "Todos los géneros",
    action: "Acción",
    search: "Buscar",
    clear: "Limpiar",

    // Marquee Controls
    showMarquee: "Mostrar marquesina",
    hideMarquee: "Ocultar",

    // Marquee Messages
    marqueeMessage1: "Lo siento, Dave. Me temo que no puedo hacer eso.",
    marqueeMessage2: "¿Carreteras? A donde vamos, no necesitamos carreteras.",
    marqueeMessage3: "Houston, tenemos un problema.",
    marqueeMessage4: "Que la suerte esté siempre de tu lado.",
    marqueeMessage5: "Volveré.",

    // Theater & Location
  },
};

export default TRANSLATIONS;
