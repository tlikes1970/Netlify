/* ============== Internationalization (i18n) ============== */
/* Unified keys, no duplicates, EN/ES aligned 1:1 */

const I18N = {
  en: {
    // Theme / UI toggles
    go_dark: "🌙 Go Dark",
    go_light: "☀️ Go Light",

    // App identity
    app_title: "Flicklet",
    subtitle: "TV & Movie Tracker",

    // High-level stats / sections
    binge_total: "Total Binge Time",
    currently_watching: "Currently Watching",
    want_to_watch: "Want to Watch",
    already_watched: "Already Watched",
    currently_airing: "Currently Airing",
    series_complete: "Series Complete",
    coming_soon: "Coming Soon",
    next: "Next",
    last: "Last",
    start: "Start",
    because_you_liked: "Because you liked",

    // Global navigation
    home: "Home",
    discover: "Discover",
    settings: "Settings",

    // Settings tabs + descriptions
    general: "General",
    notifications: "Notifications",
    layout: "Layout",
    data: "Data",
    pro: "Pro",
    about: "About",
    general_description: "Manage your account and basic preferences",
    notifications_description: "Choose which types of notifications you'd like to receive",
    layout_settings: "Layout Settings",
    layout_description: "Customize how your lists and cards are displayed",
    data_management: "Data Management",
    data_description: "Export, import, or reset your data",
    pro_features: "Pro Features",
    pro_description: "Unlock advanced features and premium content with Flicklet Pro",
    settings_description: "Application settings",

    // Settings options
    condensed_list_view: "Condensed list view (more items per screen)",
    show_posters: "Show movie/TV show posters",
    dark_mode: "Dark mode (auto-detect system preference)",
    home_page_lists: "Home Page TV/Movie Lists",

    // Data actions
    export_json: "Export JSON",
    import_json: "Import JSON",
    extra_trivia_pro: "Extra Trivia (Pro)",
    export_csv_pro: "Export CSV (Pro)",
    reset_all_data: "Reset All Data",
    data_hint: "Export saves flicklet-export.json to your device's Downloads/Files. Import accepts a valid Flicklet export.",

    // Pro preview
    preview_pro_features: "Preview Pro Features",
    pro_hint: "Toggle Pro features on/off to see what's available",
    pro_features_include: "Pro Features Include:",
    pro_simulate: "Pro (simulate)",

    // Feedback feature
    share_your_thoughts: "Share Your Thoughts",
    feedback: "Share Your Thoughts",
    feedback_working: "Share your thoughts! Give us app feedback, tell us what's working (or not), share a quote for our rotation, make a confession, or just vent. We're listening!",
    your_message: "Your Message",
    feedback_placeholder: "Share your thoughts, feedback, quotes, confessions, or just vent here...",
    send: "Share It!",

    // Share / lists
    share_lists: "Share Lists",
    share_this_list: "Share This List",
    share_selected: "Select Items to Share",
    share_link: "Share link",
    share_instructions: "Click to select which shows and movies to share",

    // File pickers
    choose_file: "Choose File",
    no_file_chosen: "No file chosen",

    // Search
    search: "Search",
    search_placeholder: "Search for shows or movies...",
    search_for_shows: "Search for shows or movies...",
    search_tips: "Search tips: Use * for wildcards (e.g., \"marvel*\" for Marvel shows)",
    search_results: "Search Results",
    end_of_search_results: "End of search results",
    search_failed: "Search failed",
    no_results: "No results",
    no_results_found: "No results found",
    searching: "Searching...",
    search_loading: "Searching...",
    search_results_cleared: "Search results cleared due to language change.",
    please_search_again: "Please search again to see results in the new language.",

    // Counts / stats
    currently_watching_count: "Currently Watching",
    want_to_watch_count: "Want to Watch",
    already_watched_count: "Already Watched",
    stats: "Stats",
    total_items: "Total items",
    watching_count: "Watching",
    wishlist_count: "Wishlist",
    watched_count: "Watched",
    top_genres: "Top Genres",
    average_rating: "Average Rating",

    // Generic statuses
    loading: "Loading...",
    failed_to_load: "Failed to load",
    no_items: "No items.",
    no_description: "No description.",
    unknown: "Unknown",

    // Cards / actions
    notes_tags: "Notes/Tags",
    remove: "Remove",
    your_rating: "Your Rating",
    not_interested: "Not Interested",
    add: "Add",
    more_actions: "More actions",
    continue: "Continue",
    available_on: "Available on",
    watch_on: "Watch on",
    upgrade_to_reveal: " — upgrade to reveal",
    upgrade_to_watch: " — upgrade to watch",
    extras: "Extras",
    already_in_list: "Already in {list}.",
    moved_to: "Moved to {list}.",
    added_to: "Added to {list}.",

    // Curated homepage
    trending_title: "Trending",
    trending_subtitle: "What everyone is watching",
    staff_picks_title: "Staff Picks",
    staff_picks_subtitle: "Curated by us",
    new_this_week_title: "New This Week",
    new_this_week_subtitle: "Fresh releases",

    // Discovery / recommendations
    discover_description: "Recommendations based on your likes and ratings.",
    not_enough_signals: "Not enough signals yet. Like or rate a few items first.",
    recommendations_failed: "Failed to load recommendations.",

    // FlickWord
    flickword_title: "FlickWord",
    flickword_play: "Play",
    flickword_streak: "Streak",
    flickword_best: "Best",
    flickword_played: "Played",
    flickword_daily_challenge: "FlickWord Daily Challenge",
    hours_left_motivation: "Hours left to play today's game!",
    play_todays_word: "Play Today's Word",
    streak: "STREAK",
    best: "BEST",
    played: "PLAYED",

    // Quotes
    quote_title: "Daily Quote",
    quote_of_the_day: "Quote of the Day",
    random_quote: "Random Quote",
    quote_1: "\"I am serious... and don't call me Shirley.\" — *Airplane!*",
    quote_2: "\"Streaming is a lifestyle, not a choice.\" — Ancient Proverb",
    quote_3: "\"Binge now. Cry later.\" — You, last night at 2AM",
    quote_4: "\"One does not simply watch one episode.\" — Boromir, probably",
    quote_5: "\"You had me at 'skip recap.'\"",
    quote_6: "\"Art is long, episodes are longer.\" — Someone with no plans",
    quote_7: "\"We were on a break! From reality.\"",
    quote_8: "\"I came, I saw, I queued it.\"",
    quote_9: "\"To stream, perchance to nap.\" — Hamlet (director's cut)",
    quote_10: "\"In this house we respect the 'Are you still watching?' prompt.\"",
    quote_11: "\"The algorithm thinks I'm complicated. It's right.\"",
    quote_12: "\"If found, return to the couch.\"",
    quote_13: "\"My love language is 'skip ad.'\"",
    quote_14: "\"I contain multitudes and several watchlists.\"",
    quote_15: "\"Sundays are for pilots and denial.\"",
    quote_16: "\"Ctrl+Z for life, play for comfort.\"",
    quote_17: "\"I fear no man, but I fear finales.\"",
    quote_18: "\"This app gets me. Terrifying.\"",
    quote_19: "\"Plot holes are just cardio for the brain.\"",
    quote_20: "\"We accept the dopamine we think we deserve.\"",
    quote_21: "\"I have never finished anything. Except seasons.\"",
    quote_22: "\"Today's vibe: closed captions and open snacks.\"",
    quote_23: "\"Foreshadowing? I hardly know her.\"",
    quote_24: "\"Character development is my cardio.\"",
    quote_25: "\"If the title card hits, I'm staying.\"",
    quote_26: "\"Minimalism, but for episodes.\"",
    quote_27: "\"'Are you still watching?' yes, Netflix, I'm thriving.\"",
    quote_28: "\"I ship productivity with naps.\"",
    quote_29: "\"Comfort show supremacy.\"",
    quote_30: "\"This queue is a personality test I'm failing.\"",

    // Notifications / toasts
    notification_success: "Success",
    notification_error: "Error",
    notification_warning: "Warning",
    notification_info: "Info",

    // Cloud / offline
    cloud_sync_ok: "Data synced successfully",
    cloud_load_failed: "Failed to load cloud data",
    cloud_sync_failed: "Cloud sync failed",
    offline_mode: "Offline Mode",
    auth_unavailable_offline: "Authentication unavailable - working in offline mode",
    working_offline_mode: "Working in offline mode - data will be stored locally only",

    // Auth & onboarding
    sign_in_title: "Sign in to sync",
    sign_in_subtitle: "Sign in to back up your lists and sync across devices.",
    sign_in_create_account: "Sign In / Create Account",
    signing_in: "Signing in...",
    sign_in_subtitle_text: "Sign in to back up your lists and sync across devices.",
    please_enter_display_name: "Please enter a display name.",
    welcome_title: "Welcome! What should we call you?",
    welcome_subtitle: "This will personalize your headers and stats.",
    welcome: "Welcome",
    display_name: "Display Name",
    display_name_placeholder: "Display name",
    save_name: "Save",
    sign_in_account: "Sign in / Account",
    account: "Account",
    user: "User",
    email_signin: "Email Sign-In",
    email_label: "Email",
    continue_google: "Continue with Google",
    click_to_sign_in: "Click to sign in",
    signed_in_as: "Signed in as",
    click_to_sign_out: "Click to sign out.",
    click_to_log_out: "click to log out",
    sign_out: "Sign Out",
    sign_out_confirmation: "Sign out as",
    signed_in_successfully: "Signed in successfully",
    signed_out_successfully: "Signed out successfully",
    sign_out_failed: "Sign out failed",

    // Auth errors
    auth_system_unavailable: "Authentication system is not available. Please refresh the page.",
    error_loading_user_data: "Error loading user data. Please try again.",
    auth_system_error: "Authentication system error. Please refresh the page.",
    firestore_not_available: "Firestore not available",
    no_displayname_field: "No displayName field to remove",
    auth_system_loading: "Authentication system is loading. Please try again in a moment.",
    google_signin_unavailable: "Google sign-in is not available. Please refresh the page.",
    apple_signin_unavailable: "Apple sign-in is not available. Please refresh the page.",
    email_signin_unavailable: "Email sign-in is not available. Please refresh the page.",
    unable_to_show_signin: "Unable to show sign-in modal. Please refresh the page.",
    signin_system_not_ready: "Sign-in system is not ready. Please refresh the page.",

    // Genres
    action: "Action",
    adventure: "Adventure",
    animation: "Animation",
    comedy: "Comedy",
    crime: "Crime",
    documentary: "Documentary",
    drama: "Drama",
    family: "Family",
    fantasy: "Fantasy",
    history: "History",
    horror: "Horror",
    music: "Music",
    mystery: "Mystery",
    romance: "Romance",
    science_fiction: "Science Fiction",
    tv_movie: "TV Movie",
    thriller: "Thriller",
    war: "War",
    western: "Western",
    action_adventure: "Action & Adventure",
    kids: "Kids & Family",
    news: "News & Current Events",
    reality: "Reality TV",
    sci_fi_fantasy: "Sci-Fi & Fantasy",
    soap: "Soap Opera",
    talk: "Talk Shows",
    war_politics: "War & Politics",
    talk_show: "Talk Shows",
    reality_tv: "Reality TV",

    // Language change message
    language: "Language",
    language_changed_to: "Language changed to {lang}",

    // Home sections (grouped)
    "home.my_library": "My Library",
    "home.my_library_sub": "Your personal watchlists and progress",
    "home.community": "Community",
    "home.community_sub": "Spotlight videos and community games",
    "home.curated": "Curated",
    "home.curated_sub": "Trending shows and staff recommendations",
    "home.personalized": "Personalized",
    "home.personalized_sub": "Recommendations just for you",
    "home.theaters": "In Theaters Near Me",
    "home.theaters_sub": "What's playing at your local cinemas",
    "home.feedback_link": "Feedback",
    "home.feedback_link_sub": "Help us improve Flicklet",
    "feedback_link_text": "Have thoughts to share? We'd love to hear them!",

    // Trivia
    trivia_title: "Trivia",
    trivia_next: "Next",
    trivia_loading: "Loading...",
    trivia_error: "Error loading trivia",
    trivia_correct: "Correct!",
    trivia_incorrect: "Incorrect",
    trivia_question: "Question",
    trivia_answer: "Answer",
    trivia_completed_today: " • Completed today",
    trivia_come_back_tomorrow: "Come back tomorrow for a new question.",
    trivia_incorrect_answer: "Nope — correct answer is",
    trivia_streak_up: "Trivia: +1 streak",
    trivia_try_again_tomorrow: "Trivia: try again tomorrow",
    trivia_ok: "OK"
  },

  es: {
    // Theme / UI toggles
    go_dark: "🌙 Modo Oscuro",
    go_light: "☀️ Modo Claro",

    // App identity
    app_title: "Flicklet",
    subtitle: "Rastreador de TV y Películas",

    // High-level stats / sections
    binge_total: "Tiempo Total de Maratón",
    currently_watching: "Viendo Actualmente",
    want_to_watch: "Quiero Ver",
    already_watched: "Ya Visto",
    currently_airing: "Transmitiéndose Actualmente",
    series_complete: "Serie Completa",
    coming_soon: "Próximamente",
    next: "Siguiente",
    last: "Último",
    start: "Comenzar",
    because_you_liked: "Porque te gustó",

    // Global navigation
    home: "Inicio",
    discover: "Descubrir",
    settings: "Configuración",

    // Settings tabs + descriptions
    general: "General",
    notifications: "Notificaciones",
    layout: "Diseño",
    data: "Datos",
    pro: "Pro",
    about: "Acerca de",
    general_description: "Gestiona tu cuenta y preferencias básicas",
    notifications_description: "Elige qué tipos de notificaciones quieres recibir",
    layout_settings: "Configuración de Diseño",
    layout_description: "Personaliza cómo se muestran tus listas y tarjetas",
    data_management: "Gestión de Datos",
    data_description: "Exportar, importar o restablecer tus datos",
    pro_features: "Características Pro",
    pro_description: "Desbloquea características avanzadas y contenido premium con Flicklet Pro",
    settings_description: "Configuración de la aplicación",

    // Settings options
    condensed_list_view: "Vista de lista condensada (más elementos por pantalla)",
    show_posters: "Mostrar carteles de películas/programas de TV",
    dark_mode: "Modo oscuro (detectar automáticamente preferencia del sistema)",
    home_page_lists: "Listas de TV/Películas de la Página Principal",

    // Data actions
    export_json: "Exportar JSON",
    import_json: "Importar JSON",
    extra_trivia_pro: "Trivia Extra (Pro)",
    export_csv_pro: "Exportar CSV (Pro)",
    reset_all_data: "Restablecer Todos los Datos",
    data_hint: "La exportación guarda flicklet-export.json en la carpeta Descargas/Archivos de tu dispositivo. La importación acepta una exportación válida de Flicklet.",

    // Pro preview
    preview_pro_features: "Vista Previa de Características Pro",
    pro_hint: "Activa/desactiva las características Pro para ver qué está disponible",
    pro_features_include: "Las Características Pro Incluyen:",
    pro_simulate: "Pro (simular)",

    // Feedback feature
    share_your_thoughts: "Comparte Tus Pensamientos",
    feedback: "Comparte Tus Pensamientos",
    feedback_working: "¡Comparte tus pensamientos! Danos retroalimentación de la app, cuéntanos qué funciona (o no), comparte una cita para nuestra rotación, haz una confesión, o simplemente desahógate. ¡Estamos escuchando!",
    your_message: "Tu Mensaje",
    feedback_placeholder: "Comparte tus pensamientos, comentarios, citas, confesiones o simplemente desahógate aquí...",
    send: "¡Compártelo!",

    // Share / lists
    share_lists: "Compartir Listas",
    share_this_list: "Compartir Esta Lista",
    share_selected: "Seleccionar Elementos para Compartir",
    share_link: "Compartir enlace",
    share_instructions: "Haz clic para seleccionar qué series y películas compartir",

    // File pickers
    choose_file: "Elegir Archivo",
    no_file_chosen: "Ningún archivo elegido",

    // Search
    search: "Buscar",
    search_placeholder: "Buscar series o películas...",
    search_for_shows: "Buscar series o películas...",
    search_tips: "Consejos de búsqueda: Usa * para comodines (ej., \"marvel*\" para series de Marvel)",
    search_results: "Resultados de Búsqueda",
    end_of_search_results: "Fin de resultados de búsqueda",
    search_failed: "Búsqueda falló",
    no_results: "Sin resultados",
    no_results_found: "No se encontraron resultados",
    searching: "Buscando...",
    search_loading: "Buscando...",
    search_results_cleared: "Resultados de búsqueda limpiados debido al cambio de idioma.",
    please_search_again: "Por favor busca nuevamente para ver resultados en el nuevo idioma.",

    // Counts / stats
    currently_watching_count: "Viendo Actualmente",
    want_to_watch_count: "Quiero Ver",
    already_watched_count: "Ya Visto",
    stats: "Estadísticas",
    total_items: "Total de elementos",
    watching_count: "Viendo",
    wishlist_count: "Lista de Deseos",
    watched_count: "Visto",
    top_genres: "Géneros Principales",
    average_rating: "Calificación Promedio",

    // Generic statuses
    loading: "Cargando...",
    failed_to_load: "Error al cargar",
    no_items: "No hay elementos.",
    no_description: "Sin descripción.",
    unknown: "Desconocido",

    // Cards / actions
    notes_tags: "Notas/Etiquetas",
    remove: "Eliminar",
    your_rating: "Tu Calificación",
    not_interested: "No me interesa",
    add: "Agregar",
    more_actions: "Más acciones",
    continue: "Continuar",
    available_on: "Disponible en",
    watch_on: "Ver en",
    upgrade_to_reveal: " — actualiza para revelar",
    upgrade_to_watch: " — actualiza para ver",
    extras: "Extras",
    already_in_list: "Ya está en {list}.",
    moved_to: "Movido a {list}.",
    added_to: "Agregado a {list}.",

    // Curated homepage
    trending_title: "Tendencia",
    trending_subtitle: "Lo que todos están viendo",
    staff_picks_title: "Selecciones del Equipo",
    staff_picks_subtitle: "Curado por nosotros",
    new_this_week_title: "Nuevo Esta Semana",
    new_this_week_subtitle: "Estrenos frescos",

    // Discovery / recommendations
    discover_description: "Recomendaciones basadas en tus gustos y calificaciones.",
    not_enough_signals: "Aún no hay suficientes señales. Dale like o califica algunos elementos primero.",
    recommendations_failed: "Error al cargar recomendaciones.",

    // FlickWord
    flickword_title: "FlickWord",
    flickword_play: "Jugar",
    flickword_streak: "Racha",
    flickword_best: "Mejor",
    flickword_played: "Jugado",
    flickword_daily_challenge: "Desafío Diario FlickWord",
    hours_left_motivation: "¡Horas restantes para jugar el juego de hoy!",
    play_todays_word: "Jugar Palabra de Hoy",
    streak: "RACHA",
    best: "MEJOR",
    played: "JUGADO",

    // Quotes
    quote_title: "Cita Diaria",
    quote_of_the_day: "Cita del Día",
    random_quote: "Cita Aleatoria",
    quote_1: "\"Soy serio... y no me llames Shirley.\" — *¡Aterriza como puedas!*",
    quote_2: "\"El streaming es un estilo de vida, no una opción.\" — Proverbio Antiguo",
    quote_3: "\"Maratón ahora. Llora después.\" — Tú, anoche a las 2AM",
    quote_4: "\"Uno no simplemente ve un episodio.\" — Boromir, probablemente",
    quote_5: "\"Me conquistaste con 'saltar resumen'.\"",
    quote_6: "\"El arte es largo, los episodios son más largos.\" — Alguien sin planes",
    quote_7: "\"¡Estábamos en un descanso! De la realidad.\"",
    quote_8: "\"Vine, vi, lo puse en cola.\"",
    quote_9: "\"Transmitir, tal vez dormitar.\" — Hamlet (versión del director)",
    quote_10: "\"En esta casa respetamos el aviso '¿Sigues viendo?'\"",
    quote_11: "\"El algoritmo piensa que soy complicado. Tiene razón.\"",
    quote_12: "\"Si se encuentra, devolver al sofá.\"",
    quote_13: "\"Mi lenguaje del amor es 'saltar anuncio'.\"",
    quote_14: "\"Contengo multitudes y varias watchlists.\"",
    quote_15: "\"Los domingos son para pilotos y negación.\"",
    quote_16: "\"Ctrl+Z para la vida, play para consuelo.\"",
    quote_17: "\"No temo a ningún hombre, pero temo a los finales.\"",
    quote_18: "\"Esta app me entiende. Aterrador.\"",
    quote_19: "\"Los agujeros de guión son cardio para el cerebro.\"",
    quote_20: "\"Aceptamos la dopamina que creemos merecer.\"",
    quote_21: "\"Nunca he terminado nada. Excepto temporadas.\"",
    quote_22: "\"Vibe de hoy: subtítulos y snacks.\"",
    quote_23: "\"¿Presagio? Apenas la conozco.\"",
    quote_24: "\"El desarrollo de personajes es mi cardio.\"",
    quote_25: "\"Si la tarjeta de título pega, me quedo.\"",
    quote_26: "\"Minimalismo, pero para episodios.\"",
    quote_27: "\"'¿Sigues viendo?' sí, Netflix, estoy prosperando.\"",
    quote_28: "\"Envío productividad con siestas.\"",
    quote_29: "\"Supremacía de serie de consuelo.\"",
    quote_30: "\"Esta cola es una prueba de personalidad que estoy fallando.\"",

    // Notifications / toasts
    notification_success: "Éxito",
    notification_error: "Error",
    notification_warning: "Advertencia",
    notification_info: "Información",

    // Cloud / offline
    cloud_sync_ok: "Datos sincronizados exitosamente",
    cloud_load_failed: "Error al cargar datos de la nube",
    cloud_sync_failed: "Error de sincronización en la nube",
    offline_mode: "Modo Sin Conexión",
    auth_unavailable_offline: "Autenticación no disponible - trabajando en modo sin conexión",
    working_offline_mode: "Trabajando en modo sin conexión - los datos se almacenarán solo localmente",

    // Auth & onboarding
    sign_in_title: "Inicia sesión para sincronizar",
    sign_in_subtitle: "Inicia sesión para respaldar tus listas y sincronizar entre dispositivos.",
    sign_in_create_account: "Iniciar Sesión / Crear Cuenta",
    signing_in: "Iniciando sesión...",
    sign_in_subtitle_text: "Inicia sesión para respaldar tus listas y sincronizar entre dispositivos.",
    please_enter_display_name: "Por favor ingresa un nombre de pantalla.",
    welcome_title: "¡Bienvenido! ¿Cómo deberíamos llamarte?",
    welcome_subtitle: "Esto personalizará tus encabezados y estadísticas.",
    welcome: "Bienvenido",
    display_name: "Nombre de pantalla",
    display_name_placeholder: "Nombre de pantalla",
    save_name: "Guardar",
    sign_in_account: "Iniciar sesión / Cuenta",
    account: "Cuenta",
    user: "Usuario",
    email_signin: "Inicio de Sesión por Email",
    email_label: "Email",
    continue_google: "Continuar con Google",
    click_to_sign_in: "Haz clic para iniciar sesión",
    signed_in_as: "Conectado como",
    click_to_sign_out: "Cerrar sesión aquí",
    click_to_log_out: "haz clic para cerrar sesión",
    sign_out: "Cerrar Sesión",
    sign_out_confirmation: "Cerrar sesión como",
    signed_in_successfully: "Inicio de sesión exitoso",
    signed_out_successfully: "Sesión cerrada exitosamente",
    sign_out_failed: "Error al cerrar sesión",

    // Auth errors
    auth_system_unavailable: "El sistema de autenticación no está disponible. Por favor, actualiza la página.",
    error_loading_user_data: "Error al cargar datos del usuario. Por favor, inténtalo de nuevo.",
    auth_system_error: "Error del sistema de autenticación. Por favor, actualiza la página.",
    firestore_not_available: "Firestore no disponible",
    no_displayname_field: "No hay campo displayName que eliminar",
    auth_system_loading: "El sistema de autenticación se está cargando. Por favor, inténtalo en un momento.",
    google_signin_unavailable: "El inicio de sesión con Google no está disponible. Por favor, actualiza la página.",
    apple_signin_unavailable: "El inicio de sesión con Apple no está disponible. Por favor, actualiza la página.",
    email_signin_unavailable: "El inicio de sesión por email no está disponible. Por favor, actualiza la página.",
    unable_to_show_signin: "No se puede mostrar el modal de inicio de sesión. Por favor, actualiza la página.",
    signin_system_not_ready: "El sistema de inicio de sesión no está listo. Por favor, actualiza la página.",

    // Genres
    action: "Acción",
    adventure: "Aventura",
    animation: "Animación",
    comedy: "Comedia",
    crime: "Crimen",
    documentary: "Documental",
    drama: "Drama",
    family: "Familiar",
    fantasy: "Fantasía",
    history: "Historia",
    horror: "Terror",
    music: "Música",
    mystery: "Misterio",
    romance: "Romance",
    science_fiction: "Ciencia Ficción",
    tv_movie: "Película de TV",
    thriller: "Suspenso",
    war: "Guerra",
    western: "Western",
    action_adventure: "Acción y Aventura",
    kids: "Niños y Familia",
    news: "Noticias y Actualidad",
    reality: "Realidad TV",
    sci_fi_fantasy: "Ciencia Ficción y Fantasía",
    soap: "Telenovela",
    talk: "Programas de Entrevistas",
    war_politics: "Guerra y Política",
    talk_show: "Programas de Entrevistas",
    reality_tv: "Realidad TV",

    // Language change message
    language: "Idioma",
    language_changed_to: "Idioma cambiado a {lang}",

    // Home sections (grouped)
    "home.my_library": "Mi Biblioteca",
    "home.my_library_sub": "Tus listas de seguimiento y progreso personal",
    "home.community": "Comunidad",
    "home.community_sub": "Videos destacados y juegos de la comunidad",
    "home.curated": "Curado",
    "home.curated_sub": "Series populares y recomendaciones del equipo",
    "home.personalized": "Personalizado",
    "home.personalized_sub": "Recomendaciones solo para ti",
    "home.theaters": "En Cines Cerca de Mí",
    "home.theaters_sub": "Qué se está proyectando en tus cines locales",
    "home.feedback_link": "Comentarios",
    "home.feedback_link_sub": "Ayúdanos a mejorar Flicklet",
    "feedback_link_text": "¿Tienes pensamientos que compartir? ¡Nos encantaría escucharlos!",

    // Trivia
    trivia_title: "Trivia",
    trivia_next: "Siguiente",
    trivia_loading: "Cargando...",
    trivia_error: "Error al cargar trivia",
    trivia_correct: "¡Correcto!",
    trivia_incorrect: "Incorrecto",
    trivia_question: "Pregunta",
    trivia_answer: "Respuesta",
    trivia_completed_today: " • Completado hoy",
    trivia_come_back_tomorrow: "Vuelve mañana para una nueva pregunta.",
    trivia_incorrect_answer: "No — la respuesta correcta es",
    trivia_streak_up: "Trivia: +1 racha",
    trivia_try_again_tomorrow: "Trivia: intenta de nuevo mañana",
    trivia_ok: "OK"
  }
};

// Translation function: strict fallback to EN if missing
function t(key, lang = 'en') {
  const pack = I18N[lang] || I18N.en;
  return (pack[key] ?? I18N.en[key] ?? key);
}

/* Apply translations for:
   - text nodes: [data-i18n]
   - placeholders: [data-i18n-placeholder]
   - title attributes: [data-i18n-title]
   - aria-labels: [data-i18n-aria-label]
*/
function applyTranslations(lang = 'en') {
  const apply = (sel, fn) => {
    document.querySelectorAll(sel).forEach(el => {
      const key = el.getAttribute(sel.replace(/^\[|\]$/g,''));
      const val = t(key, lang);
      if (val && val !== key) fn(el, val);
    });
  };

  apply('[data-i18n]',        (el, val) => { el.textContent = val; });
  apply('[data-i18n-placeholder]', (el, val) => { el.placeholder = val; });
  apply('[data-i18n-title]',  (el, val) => { el.title = val; });
  apply('[data-i18n-aria-label]', (el, val) => { el.setAttribute('aria-label', val); });
}

// Expose globally
if (typeof window !== 'undefined') {
  window.I18N = I18N;
  window.t = t;
  window.applyTranslations = applyTranslations;
}

// CJS export (optional tooling)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { I18N, t, applyTranslations };
}
