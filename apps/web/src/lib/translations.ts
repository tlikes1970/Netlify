import type { Language, LanguageStrings } from './language.types';

const TRANSLATIONS: Record<Language, LanguageStrings> = {
  en: {
    // Navigation
    home: 'Home',
    currentlyWatching: 'Currently Watching',
    wantToWatch: 'Want to Watch',
    watched: 'Watched',
    holidays: 'Holidays',
    discovery: 'Discovery',
    
    // Actions
    wantToWatchAction: 'Want to Watch',
    currentlyWatchingAction: 'Currently Watching',
    watchedAction: 'Watched',
    notInterestedAction: 'Not Interested',
    deleteAction: 'Delete',
    removeAction: 'Remove',
    reviewNotesAction: 'Review/Notes',
    addTagAction: 'Add Tag',
    holidayAddAction: 'Holiday +',
    similarToAction: 'Similar To',
    refineSearchAction: 'Refine Search',
    
    // Settings
    settings: 'Settings',
    general: 'General',
    notifications: 'Notifications',
    layout: 'Layout',
    data: 'Data',
    pro: 'Pro',
    about: 'About',
    
    // General Settings
    displayName: 'Display Name',
    myStatistics: 'My Statistics',
    tvShows: 'TV Shows',
    movies: 'Movies',
    notInterestedManagement: 'Not Interested Management',
    manageNotInterestedList: 'Manage Not Interested List',
    personalityLevel: 'Personality Level',
    regular: 'Regular',
    semiSarcastic: 'Semi-sarcastic',
    severelySarcastic: 'Severely sarcastic',
    friendlyAndHelpful: 'Friendly and helpful',
    aBitCheeky: 'A bit cheeky',
    maximumSass: 'Maximum sass',
    preview: 'Preview',
    resetSystemToDefaults: 'Reset System to Defaults',
    
    // Layout Settings
    themePreference: 'Theme Preference',
    dark: 'Dark',
    light: 'Light',
    darkBackgroundWithLightText: 'Dark background with light text',
    lightBackgroundWithDarkText: 'Light background with dark text',
    basicCustomization: 'Basic Customization',
    condensedView: 'Condensed View',
    enableEpisodeTracking: 'Enable Episode Tracking',
    proFeatures: 'Pro Features',
    themePacksComingSoon: 'Theme packs coming soon...',
    
    // Notifications
    notificationTypes: 'Notification Types',
    upcomingEpisodeAlerts: 'Upcoming episode alerts',
    weeklyDiscover: 'Weekly discover',
    monthlyStatsDigest: 'Monthly stats digest',
    alertConfiguration: 'Alert Configuration (Pro)',
    advancedNotificationByLeadTime: 'Advanced notification by lead time in hours',
    pickTheList: 'Pick the list (currently watching or want to watch)',
    
    // Data Management
    standardDataManagement: 'Standard Data Management',
    shareList: 'Share List',
    chooseListsAndShowsToShare: 'Choose lists and shows to share',
    generatesCopyPasteableFormattedList: 'Generates copy/pasteable formatted list with Flicklet branding and link',
    backupSystem: 'Backup System (JSON)',
    exportAllPersonalData: 'Export all personal data',
    import: 'Import (JSON)',
    importPreviouslyExportedData: 'Import previously exported data',
    resetAllData: 'Reset All Data',
    restoreSystemToDefaults: 'Restore system to defaults',
    advancedSharingOptions: 'Advanced sharing options',
    
    // Pro Features
    proManagement: 'Pro Management',
    unlockProFeatures: 'Unlock pro features button (payment prompt - not implemented)',
    paymentPromptNotImplemented: 'Payment prompt - not implemented',
    proFeatureList: 'Pro feature list and descriptions',
    alertConfigurationDetails: 'Alert configuration details (hourly config)',
    hourlyConfig: 'Hourly config',
    themePacks: 'Theme packs (holiday and movie themes - not implemented)',
    holidayAndMovieThemes: 'Holiday and movie themes - not implemented',
    socialFeatures: 'Social features (FlickWord, Trivia, shared watchlists among friends)',
    flickwordTriviaSharedWatchlists: 'FlickWord, Trivia, shared watchlists among friends',
    bloopersBehindTheScenes: 'Bloopers/Behind the scenes (activates button on show cards)',
    activatesButtonOnShowCards: 'Activates button on show cards',
    additionalFeaturesTBD: 'Additional features TBD',
    
    // About
    informationSections: 'Information Sections',
    aboutUniqueForYou: 'About unique for you',
    aboutTheCreators: 'About the creators',
    aboutTheApp: 'About the app',
    feedback: 'Feedback',
    shareYourThoughts: 'Share your thoughts (feedback, quotes for marquee, clips for home page player, venting, etc.)',
    feedbackQuotesForMarquee: 'Feedback, quotes for marquee, clips for home page player, venting, etc.',
    clipsForHomePagePlayer: 'Clips for home page player',
    venting: 'Venting',
    
    // Common
    save: 'Save',
    cancel: 'Cancel',
    close: 'Close',
    confirm: 'Confirm',
    areYouSure: 'Are you sure?',
    comingSoon: 'Coming soon...',
    notImplemented: 'Not implemented',
    
    // Home Rails
    yourShows: 'Your Shows',
    upNext: 'Up Next',
    community: 'Community',
    forYou: 'For you',
    inTheatersNearYou: 'In Theaters Near You',
    
    // Placeholders
    noShowsInCurrentlyWatching: 'No shows in your currently watching list. Add some from search or discovery!',
    addSomeFromSearchOrDiscovery: 'Add some from search or discovery!',
    noUpcomingEpisodes: 'No upcoming episodes. Add TV shows to your watching list to see when new episodes air!',
    addTvShowsToWatchingList: 'Add TV shows to your watching list to see when new episodes air!',
    noPoster: 'No poster',
    
    // Statistics
    currentlyWatchingCount: 'Currently Watching',
    wantToWatchCount: 'Want to Watch',
    watchedCount: 'Watched',
    totalCount: 'Total',
    
    // Feedback Panel
    tellUsWhatToImprove: 'Tell us what to improve',
    typeYourFeedback: 'Type your feedback...',
    sendFeedback: 'Send Feedback',
    whatsComing: 'What\'s coming',
    betterRecommendations: 'Better recommendations',
    episodeUpNextWithDates: 'Episode "Up Next" with dates',
    shareListsWithFriends: 'Share lists with friends',
    
    // Theater Info
    inTheatersNearYou: 'In Theaters Near You',
    yourLocalTheater: 'Your Local Theater',
    
    // Header
    logIn: 'Log in',
    logOut: 'Log out',
    guest: 'Guest',
    
    // Search Results
    noSynopsisAvailable: 'No synopsis available.',
    opensInTmdb: 'Opens in TMDB',
    searchFailed: 'Search failed',
    
    // Personality Messages
    procrastinatingProductively: 'Procrastinating productively.',
    curatingYourIndecision: 'Curating your indecision.',
    becauseTimeIsAnIllusion: 'Because time is an illusion.',
    cinemaNowWithCommitmentIssues: 'Cinema, now with commitment issues.',
    yourBacklogCalledItsGrowing: 'Your backlog called. It\'s growing.',
    
    // Confirmation Messages
    areYouSureChangeDisplayName: 'Are you sure you want to change your display name?',
    thisWillUpdateYourProfile: 'This will update your profile.',
    areYouSureResetSettings: 'Are you sure you want to reset all settings to defaults?',
    
    // Language Labels
    language: 'Language',
    english: 'English',
    spanish: 'Español',
  },
  
  es: {
    // Navigation
    home: 'Inicio',
    currentlyWatching: 'Viendo Ahora',
    wantToWatch: 'Quiero Ver',
    watched: 'Visto',
    holidays: 'Fiestas',
    discovery: 'Descubrir',
    
    // Actions
    wantToWatchAction: 'Quiero Ver',
    currentlyWatchingAction: 'Viendo Ahora',
    watchedAction: 'Visto',
    notInterestedAction: 'No Me Interesa',
    deleteAction: 'Eliminar',
    removeAction: 'Quitar',
    reviewNotesAction: 'Reseña/Notas',
    addTagAction: 'Agregar Etiqueta',
    holidayAddAction: 'Fiesta +',
    similarToAction: 'Similar A',
    refineSearchAction: 'Refinar Búsqueda',
    
    // Settings
    settings: 'Configuración',
    general: 'General',
    notifications: 'Notificaciones',
    layout: 'Diseño',
    data: 'Datos',
    pro: 'Pro',
    about: 'Acerca De',
    
    // General Settings
    displayName: 'Nombre de Pantalla',
    myStatistics: 'Mis Estadísticas',
    tvShows: 'Programas de TV',
    movies: 'Películas',
    notInterestedManagement: 'Gestión de No Me Interesa',
    manageNotInterestedList: 'Gestionar Lista de No Me Interesa',
    personalityLevel: 'Nivel de Personalidad',
    regular: 'Regular',
    semiSarcastic: 'Semi-sarcástico',
    severelySarcastic: 'Severamente sarcástico',
    friendlyAndHelpful: 'Amigable y útil',
    aBitCheeky: 'Un poco descarado',
    maximumSass: 'Máximo descaro',
    preview: 'Vista Previa',
    resetSystemToDefaults: 'Restablecer Sistema a Valores Predeterminados',
    
    // Layout Settings
    themePreference: 'Preferencia de Tema',
    dark: 'Oscuro',
    light: 'Claro',
    darkBackgroundWithLightText: 'Fondo oscuro con texto claro',
    lightBackgroundWithDarkText: 'Fondo claro con texto oscuro',
    basicCustomization: 'Personalización Básica',
    condensedView: 'Vista Condensada',
    enableEpisodeTracking: 'Habilitar Seguimiento de Episodios',
    proFeatures: 'Características Pro',
    themePacksComingSoon: 'Paquetes de temas próximamente...',
    
    // Notifications
    notificationTypes: 'Tipos de Notificación',
    upcomingEpisodeAlerts: 'Alertas de episodios próximos',
    weeklyDiscover: 'Descubrimiento semanal',
    monthlyStatsDigest: 'Resumen de estadísticas mensuales',
    alertConfiguration: 'Configuración de Alertas (Pro)',
    advancedNotificationByLeadTime: 'Notificación avanzada por tiempo de anticipación en horas',
    pickTheList: 'Elige la lista (viendo ahora o quiero ver)',
    
    // Data Management
    standardDataManagement: 'Gestión de Datos Estándar',
    shareList: 'Compartir Lista',
    chooseListsAndShowsToShare: 'Elige listas y programas para compartir',
    generatesCopyPasteableFormattedList: 'Genera lista formateada copiable/pegable con marca Flicklet y enlace',
    backupSystem: 'Sistema de Respaldo (JSON)',
    exportAllPersonalData: 'Exportar todos los datos personales',
    import: 'Importar (JSON)',
    importPreviouslyExportedData: 'Importar datos previamente exportados',
    resetAllData: 'Restablecer Todos los Datos',
    restoreSystemToDefaults: 'Restaurar sistema a valores predeterminados',
    advancedSharingOptions: 'Opciones de compartir avanzadas',
    
    // Pro Features
    proManagement: 'Gestión Pro',
    unlockProFeatures: 'Botón de desbloquear características pro (prompt de pago - no implementado)',
    paymentPromptNotImplemented: 'Prompt de pago - no implementado',
    proFeatureList: 'Lista de características pro y descripciones',
    alertConfigurationDetails: 'Detalles de configuración de alertas (configuración por horas)',
    hourlyConfig: 'Configuración por horas',
    themePacks: 'Paquetes de temas (temas de fiestas y películas - no implementado)',
    holidayAndMovieThemes: 'Temas de fiestas y películas - no implementado',
    socialFeatures: 'Características sociales (FlickWord, Trivia, listas compartidas entre amigos)',
    flickwordTriviaSharedWatchlists: 'FlickWord, Trivia, listas compartidas entre amigos',
    bloopersBehindTheScenes: 'Bloopers/Detrás de escena (activa botón en tarjetas de programas)',
    activatesButtonOnShowCards: 'Activa botón en tarjetas de programas',
    additionalFeaturesTBD: 'Características adicionales por determinar',
    
    // About
    informationSections: 'Secciones de Información',
    aboutUniqueForYou: 'Acerca de único para ti',
    aboutTheCreators: 'Acerca de los creadores',
    aboutTheApp: 'Acerca de la aplicación',
    feedback: 'Comentarios',
    shareYourThoughts: 'Comparte tus pensamientos (comentarios, citas para marquesina, clips para reproductor de página principal, desahogo, etc.)',
    feedbackQuotesForMarquee: 'Comentarios, citas para marquesina, clips para reproductor de página principal, desahogo, etc.',
    clipsForHomePagePlayer: 'Clips para reproductor de página principal',
    venting: 'Desahogo',
    
    // Common
    save: 'Guardar',
    cancel: 'Cancelar',
    close: 'Cerrar',
    confirm: 'Confirmar',
    areYouSure: '¿Estás seguro?',
    comingSoon: 'Próximamente...',
    notImplemented: 'No implementado',
    
    // Home Rails
    yourShows: 'Tus Programas',
    upNext: 'Próximamente',
    community: 'Comunidad',
    forYou: 'Para ti',
    inTheatersNearYou: 'En Cines Cerca de Ti',
    
    // Placeholders
    noShowsInCurrentlyWatching: 'No hay programas en tu lista de viendo ahora. ¡Agrega algunos desde búsqueda o descubrimiento!',
    addSomeFromSearchOrDiscovery: '¡Agrega algunos desde búsqueda o descubrimiento!',
    noUpcomingEpisodes: 'No hay episodios próximos. ¡Agrega programas de TV a tu lista de viendo para ver cuándo salen nuevos episodios!',
    addTvShowsToWatchingList: '¡Agrega programas de TV a tu lista de viendo para ver cuándo salen nuevos episodios!',
    noPoster: 'Sin póster',
    
    // Statistics
    currentlyWatchingCount: 'Viendo Ahora',
    wantToWatchCount: 'Quiero Ver',
    watchedCount: 'Visto',
    totalCount: 'Total',
    
    // Feedback Panel
    tellUsWhatToImprove: 'Dinos qué mejorar',
    typeYourFeedback: 'Escribe tu comentario...',
    sendFeedback: 'Enviar Comentario',
    whatsComing: 'Lo que viene',
    betterRecommendations: 'Mejores recomendaciones',
    episodeUpNextWithDates: 'Episodio "Próximo" con fechas',
    shareListsWithFriends: 'Compartir listas con amigos',
    
    // Theater Info
    inTheatersNearYou: 'En Cines Cerca de Ti',
    yourLocalTheater: 'Tu Cine Local',
    
    // Header
    logIn: 'Iniciar sesión',
    logOut: 'Cerrar sesión',
    guest: 'Invitado',
    
    // Search Results
    noSynopsisAvailable: 'Sin sinopsis disponible.',
    opensInTmdb: 'Abre en TMDB',
    searchFailed: 'Búsqueda fallida',
    
    // Personality Messages
    procrastinatingProductively: 'Procrastinando productivamente.',
    curatingYourIndecision: 'Curando tu indecisión.',
    becauseTimeIsAnIllusion: 'Porque el tiempo es una ilusión.',
    cinemaNowWithCommitmentIssues: 'Cine, ahora con problemas de compromiso.',
    yourBacklogCalledItsGrowing: 'Tu lista pendiente llamó. Está creciendo.',
    
    // Confirmation Messages
    areYouSureChangeDisplayName: '¿Estás seguro de que quieres cambiar tu nombre de pantalla?',
    thisWillUpdateYourProfile: 'Esto actualizará tu perfil.',
    areYouSureResetSettings: '¿Estás seguro de que quieres restablecer todas las configuraciones a los valores predeterminados?',
    
    // Language Labels
    language: 'Idioma',
    english: 'English',
    spanish: 'Español',
  },
};

export default TRANSLATIONS;
