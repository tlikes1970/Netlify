/** Flicklet-owned account, access and recovery display copy. Internal identities stay unchanged. */
export const ACCOUNT_TRANSLATIONS = {
  en: {
    adminAccessTitle: "Full Access grants",
    adminAccessCopy: "Grant or revoke Full Access for an existing Flicklet account. Revoking a grant does not remove purchased access or change the trial.",
    adminAccessTarget: "Account email or account ID",
    adminAccessSelf: "Use my account",
    adminAccessGrant: "Grant Full Access",
    adminAccessRevoke: "Revoke grant",
    adminAccessSaving: "Updating…",
    adminAccessGranted: "Full Access granted to {target}.",
    adminAccessRevoked: "Full Access grant revoked for {target}.",
    adminAccessError: "Could not update the grant. Check the account email or ID, your administrator permission and connection, then retry.",
    accessAdminGranted: "Administrator-granted Full Access",
    accessAdminCopy: "Full Access has been granted to your Flicklet account by an administrator.",

    recoveryUnsupported:
      "This backup version is not supported. Choose a supported Flicklet backup.",
    accessReadOnlyHint: "Read-Only — unlock Full Access",
    accessTrialHint: "Included in your Full Access trial",
    accessExtrasNeed: "Extras need Full Access",
    accessExtrasTrial:
      "Start your 21-day Full Access trial or unlock in Settings to view Extras for this title.",
    accessBehindScenes:
      "Start your 21-day trial or unlock Full Access in Settings for behind-the-scenes content.",
    accessOpenSettings: "Open Full Access settings",
    accessSimilarTrial:
      "Shows Like This is included during your trial. Unlock Full Access to keep it after your trial ends.",
    accessListsUnlock: "Unlock Full Access for unlimited custom lists",
    accessReminderTrial:
      "Sign in to start your 21-day trial for hour-by-hour reminder timing.",
    recoveryStorage:
      "Restore failed and local recovery was blocked by device storage. Keep this window open and retry after freeing storage.",
    profileSaving: "Saving…",
    profileRetry: "Try again",

    accountEmail: "Email",
    accountPassword: "Password",
    accountEmailPlaceholder: "your@email.com",
    accountRequired: "Email and password are required",
    accountInvalidEmail: "Please enter a valid email address",
    accountPasswordLength: "Password must be at least 6 characters",
    accountCredentials:
      "Invalid email or password. Please check your details and try again.",
    accountExists: "An account already uses this email. Try signing in.",
    accountNetwork: "Connection failed. Check your connection and try again.",
    accountCancelled: "Sign-in was cancelled. You can try again.",
    accountUnavailable:
      "This sign-in method is unavailable. Try another method.",
    accountAttempts: "Too many attempts. Please wait and try again.",
    accountDisabled: "This account is disabled. Try another account.",
    accountProviderConflict:
      "This email uses another sign-in method. Use that method to sign in.",
    accountError: "Sign-in failed. Please try again.",
    accountCreateError: "Account creation failed. Please try again.",
    accountRedirect: "Redirecting to sign in...",
    accountWait: "Please wait",
    accountCreating: "Creating...",
    accountSigningIn: "Signing in...",
    accountCreate: "Create Account",
    accountNew: "Don't have an account? Create one",
    accountExisting: "Already have an account? Sign in",
    accountBrowserTitle: "Sign-in needs your device's browser",
    accountBrowserCopy:
      "Sign-in may not work in this browser or installed web app. Tap 'Open in browser' to continue securely.",
    accountOpenBrowser: "Open in Browser",
    profilePrompt: "What should we call you?",
    profileLabel: "Flicklet preferred name",
    profileCopy: "What should Flicklet call you?",
    profilePlaceholder: "e.g. Travis or Dr. Smith",
    profileSignIn: "Sign in to set your preferred name.",
    profileRequired: "Please enter a preferred name.",
    profileLength: "Please use 100 characters or fewer.",
    profileWait: "Please wait before saving your preferred name.",
    profileSaveError:
      "Your preferred name could not be saved. Please try again.",
    profileLoadError:
      "Your preferred name could not be loaded. Please try again.",
    accountChanged: "The signed-in account changed. Please try again.",
    accessName: "Full Access",
    accessUnlock: "Unlock Full Access",
    accessUnlockShort: "Unlock",
    accessLearn: "Learn more",
    accessReadOnlyHeading: "Trial ended — Read-Only",
    accessReadOnly:
      "Your trial has ended, but your library is still yours. You can continue browsing, exporting, and restoring your data anytime.",
    accessExplainer:
      "Full Access is a one-time purchase that keeps tracking, reminders, and editing available while helping support the app and continued development. No subscriptions, no ads, and no selling your data.",
    accessIntro: "Flicklet starts fully unlocked for your first 21 days.",
    accessTrialActive: "Full access trial active",
    accessTrialOne: "Full access trial: {count} day left",
    accessTrialOther: "Full access trial: {count} days left",
    accessTrialToday: "Trial ends today — unlock Full Access to keep editing",
    accessTrialSuffix: "· Unlock anytime to keep full access after trial",
    accessBanner:
      "Start your 21-day Full Access trial, or unlock Full Access to keep editing after trial.",
    accessPanel:
      "21-day Full Access trial — explore everything. A one-time unlock helps support the app and continued development.",
    accessPurchased: "Purchased",
    accessComplete: "One-time purchase complete",
    accessPrice: "{price} · one-time purchase",
    accessPriceLoading: "Checking Google Play price…",
    accessPriceUnavailable: "Price temporarily unavailable",
    accessPricePlay: "One-time purchase · price shown in Google Play",
    accessTrial21: "21-day Full Access trial active",
    accessSignIn: "Sign in to start your 21-day trial",
    accessThanks:
      "Thanks for supporting Flicklet. Your purchase keeps Full Access unlocked.",
    accessExplore:
      "{trial}. Explore everything — reminders, Shows Like This, Extras, and your full library.",
    accessFeaturesCopy:
      "Unlock continued library editing, reminders, Shows Like This, Extras, and unlimited custom lists.",
    accessPriceRetry:
      "Google Play pricing could not be loaded. Try again when Play Billing is available.",
    accessTrialKeep:
      "Unlock Full Access anytime to keep editing after your trial ends.",
    accessIncluded: "Included during your trial",
    accessIncludes: "What full access includes",
    accessShows: "Shows Like This",
    accessShowsCopy:
      "Insights and easter eggs on movie and TV cards during your trial or with Full Access.",
    accessExtras: "Extras",
    accessExtrasCopy:
      "Additional behind-the-scenes and related videos on movie and TV cards during your trial or with Full Access.",
    accessReminders: "Episode Reminders",
    accessRemindersCopy:
      "Android alerts around 8:00 AM on the day a new episode airs.",
    accessLists: "Unlimited Custom Lists",
    accessListsCopy: "Organize titles into as many personal lists as you need.",
    purchaseAndroidOnly:
      "Purchase and Restore Purchases are available in the Flicklet Android app. Existing account access works here.",
    purchaseRestore: "Restore Purchases",
    purchasePending:
      "Payment is pending. Full Access will unlock after payment completes and your purchase is verified. You can use Restore Purchases later.",
    purchaseMismatch:
      "This purchase belongs to another Flicklet account. Sign out and sign in with the Flicklet account used for the purchase, then restore it. The purchase cannot be transferred.",
    purchaseRestoreEmpty:
      "No completed Full Access purchase was found for this account. Check your Google Play account and try again.",
    purchaseNotOwned:
      "Google Play could not confirm an owned Full Access purchase. Check your Play account and try Restore Purchases.",
    accountSignedIn: "Signed in",
    accountSignedOut: "Signed out",
    accountSignedInAs: "Signed in as {email}",
    accessListLimit:
      "Maximum {count} custom lists without Full Access. Unlock Full Access in Settings for unlimited lists.",
    purchaseSuccess: "Purchase confirmed. Full Access unlocked.",
    purchaseError: "The purchase could not be completed. Please try again.",
    purchaseCancelled: "Purchase cancelled. You can try again.",
    purchaseUnavailable:
      "Google Play billing is unavailable. Please try again later.",
    purchaseProduct:
      "The Full Access product is temporarily unavailable. Please try again later.",
    purchaseValidation:
      "Your purchase could not be verified. Please try again.",
    recoveryData: "Data & Backups",
    recoveryManagement: "Data Management",
    recoveryBackup: "Backup Data",
    recoveryDownload: "Download Backup",
    recoveryBackupCopy:
      "Download a portable snapshot of your library, lists, progress, preferences and Flicklet preferred name. Login credentials and paid access are excluded.",
    recoveryRestore: "Restore Data",
    recoveryRestoreButton: "Restore from Backup",
    recoveryRestoreCopy:
      "Restore your library, lists, progress and backed-up preferences. When signed in, supported cloud data is replaced too. Your login, handle and access are preserved.",
    recoveryConfirm:
      "Restore the Flicklet backup from {date}? Your current library, custom lists and backed-up preferences will be replaced. Your login, account handle and access will stay unchanged.",
    recoverySuccess:
      "Backup restored successfully. Flicklet will reload to show your restored data.",
    recoveryReminderWarning:
      "Your data was restored, but device reminder cancellation could not finish. Check Android reminders.",
    recoveryBackupError: "Backup creation failed. Please try again.",
    recoveryRestoreError: "Restore failed. Please try again.",
    recoveryInvalid:
      "This is not a valid supported Flicklet backup. Choose another backup file.",
    recoverySize: "The backup exceeds 10 MB. Choose a smaller backup.",
    recoveryCloudLimit:
      "This backup exceeds the safe cloud restore limit. Nothing was changed.",
    recoveryProfile: "Your profile could not be loaded. Please try again.",
    recoveryPending:
      "A restore or recovery is pending. Finish recovery and reload Flicklet before continuing.",
    recoveryReload:
      "The signed-in account changed. Reload Flicklet before continuing.",
    recoveryNative:
      "Android reminder recovery could not finish. Reload Flicklet to recover local state, then check Android reminders before retrying.",
    startOverTitle: "Start Over",
    startOverBefore: "Before you start over",
    startOverConfirm: "Start Over?",
    startOverIntro:
      "Clear your Flicklet content and reset preferences. Your login, account handle and access will be kept.",
    startOverBackupCopy:
      "You can download a Flicklet backup first, or continue without one. Starting a download does not confirm that the file was saved. Keep the file if you want to restore supported content later.",
    startOverRemoval:
      "This will remove your Flicklet library, lists, ratings, notes, progress, reminders, personalization, preferred name and app preferences from this account and this device.",
    startOverPreserved:
      "Your login, account handle, Full Access and server trial entitlement will be kept. If you are signed out, only this device’s Flicklet data will be reset.",
    startOverRecovery:
      "You can restore supported content later only if you have a Flicklet backup.",
    startOverWithout: "Continue Without Backup",
    startOverDelete: "Type DELETE to confirm",
    recoveryCreating: "Creating backup…",
    startOverBusy: "Starting over…",
    startOverError: "Start Over failed. Please try again.",
  },
  es: {
    adminAccessTitle: "Concesiones de Acceso completo",
    adminAccessCopy: "Concede o revoca Acceso completo para una cuenta existente de Flicklet. Revocar una concesión no elimina el acceso comprado ni cambia la prueba.",
    adminAccessTarget: "Correo o ID de la cuenta",
    adminAccessSelf: "Usar mi cuenta",
    adminAccessGrant: "Conceder Acceso completo",
    adminAccessRevoke: "Revocar concesión",
    adminAccessSaving: "Actualizando…",
    adminAccessGranted: "Acceso completo concedido a {target}.",
    adminAccessRevoked: "Concesión de Acceso completo revocada para {target}.",
    adminAccessError: "No se pudo actualizar la concesión. Comprueba el correo o ID de la cuenta, tu permiso de administrador y la conexión, y vuelve a intentarlo.",
    accessAdminGranted: "Acceso completo concedido por un administrador",
    accessAdminCopy: "Un administrador ha concedido Acceso completo a tu cuenta de Flicklet.",

    recoveryUnsupported:
      "Esta versión de copia de seguridad no es compatible. Elige una copia de Flicklet compatible.",
    accessReadOnlyHint: "Solo lectura — desbloquea Acceso completo",
    accessTrialHint: "Incluido en tu prueba de Acceso completo",
    accessExtrasNeed: "Los extras requieren Acceso completo",
    accessExtrasTrial:
      "Inicia tu prueba de Acceso completo de 21 días o desbloquéalo en Ajustes para ver los extras de este título.",
    accessBehindScenes:
      "Inicia tu prueba de 21 días o desbloquea Acceso completo en Ajustes para ver contenido del rodaje.",
    accessOpenSettings: "Abrir los ajustes de Acceso completo",
    accessSimilarTrial:
      "Los títulos similares están incluidos durante tu prueba. Desbloquea Acceso completo para mantener esta función al terminar la prueba.",
    accessListsUnlock:
      "Desbloquea Acceso completo para tener listas personalizadas ilimitadas",
    accessReminderTrial:
      "Inicia sesión para comenzar tu prueba de 21 días y ajustar la antelación de los recordatorios por horas.",
    recoveryStorage:
      "La restauración falló y el almacenamiento del dispositivo bloqueó la recuperación local. Mantén esta ventana abierta, libera espacio e inténtalo de nuevo.",
    profileSaving: "Guardando…",
    profileRetry: "Inténtalo de nuevo",

    accountEmail: "Correo electrónico",
    accountPassword: "Contraseña",
    accountEmailPlaceholder: "tu@correo.com",
    accountRequired: "El correo electrónico y la contraseña son obligatorios",
    accountInvalidEmail: "Introduce una dirección de correo electrónico válida",
    accountPasswordLength: "La contraseña debe tener al menos 6 caracteres",
    accountCredentials:
      "El correo electrónico o la contraseña no son válidos. Revisa los datos e inténtalo de nuevo.",
    accountExists:
      "Ya existe una cuenta con este correo electrónico. Intenta iniciar sesión.",
    accountNetwork:
      "No se pudo conectar. Revisa tu conexión e inténtalo de nuevo.",
    accountCancelled:
      "Se canceló el inicio de sesión. Puedes intentarlo de nuevo.",
    accountUnavailable:
      "Este método de inicio de sesión no está disponible. Prueba otro método.",
    accountAttempts: "Demasiados intentos. Espera e inténtalo de nuevo.",
    accountDisabled: "Esta cuenta está deshabilitada. Prueba otra cuenta.",
    accountProviderConflict:
      "Este correo utiliza otro método de inicio de sesión. Usa ese método para iniciar sesión.",
    accountError: "No se pudo iniciar sesión. Inténtalo de nuevo.",
    accountCreateError: "No se pudo crear la cuenta. Inténtalo de nuevo.",
    accountRedirect: "Redirigiendo para iniciar sesión...",
    accountWait: "Espera, por favor",
    accountCreating: "Creando...",
    accountSigningIn: "Iniciando sesión...",
    accountCreate: "Crear cuenta",
    accountNew: "¿No tienes una cuenta? Crea una",
    accountExisting: "¿Ya tienes una cuenta? Inicia sesión",
    accountBrowserTitle:
      "Para iniciar sesión necesitas el navegador de tu dispositivo",
    accountBrowserCopy:
      "Es posible que no puedas iniciar sesión en este navegador o aplicación web instalada. Pulsa «Abrir en el navegador» para continuar de forma segura.",
    accountOpenBrowser: "Abrir en el navegador",
    profilePrompt: "¿Cómo quieres que te llamemos?",
    profileLabel: "Nombre preferido en Flicklet",
    profileCopy: "¿Cómo quieres que te llame Flicklet?",
    profilePlaceholder: "p. ej., Travis o Dr. Smith",
    profileSignIn: "Inicia sesión para establecer tu nombre preferido.",
    profileRequired: "Introduce un nombre preferido.",
    profileLength: "Usa 100 caracteres o menos.",
    profileWait: "Espera antes de guardar tu nombre preferido.",
    profileSaveError:
      "No se pudo guardar tu nombre preferido. Inténtalo de nuevo.",
    profileLoadError:
      "No se pudo cargar tu nombre preferido. Inténtalo de nuevo.",
    accountChanged:
      "La cuenta con sesión iniciada ha cambiado. Inténtalo de nuevo.",
    accessName: "Acceso completo",
    accessUnlock: "Desbloquear Acceso completo",
    accessUnlockShort: "Desbloquear",
    accessLearn: "Más información",
    accessReadOnlyHeading: "Prueba finalizada — Solo lectura",
    accessReadOnly:
      "Tu prueba ha finalizado, pero tu biblioteca sigue siendo tuya. Puedes seguir consultando, exportando y restaurando tus datos cuando quieras.",
    accessExplainer:
      "Acceso completo es una compra única que mantiene disponibles el seguimiento, los recordatorios y la edición, y ayuda a financiar la aplicación y su desarrollo. Sin suscripciones, sin anuncios y sin vender tus datos.",
    accessIntro:
      "Flicklet comienza con todas las funciones desbloqueadas durante tus primeros 21 días.",
    accessTrialActive: "Prueba de Acceso completo activa",
    accessTrialOne: "Prueba de Acceso completo: queda {count} día",
    accessTrialOther: "Prueba de Acceso completo: quedan {count} días",
    accessTrialToday:
      "La prueba termina hoy — desbloquea Acceso completo para seguir editando",
    accessTrialSuffix:
      "· Desbloquéalo cuando quieras para mantener Acceso completo al terminar la prueba",
    accessBanner:
      "Inicia tu prueba de Acceso completo de 21 días o desbloquea Acceso completo para seguir editando después.",
    accessPanel:
      "Prueba de Acceso completo de 21 días — explora todas las funciones. Una compra única ayuda a financiar la aplicación y su desarrollo.",
    accessPurchased: "Comprado",
    accessComplete: "Compra única completada",
    accessPrice: "{price} · compra única",
    accessPriceLoading: "Consultando el precio de Google Play…",
    accessPriceUnavailable: "Precio temporalmente no disponible",
    accessPricePlay: "Compra única · el precio se muestra en Google Play",
    accessTrial21: "Prueba de Acceso completo de 21 días activa",
    accessSignIn: "Inicia sesión para comenzar tu prueba de 21 días",
    accessThanks:
      "Gracias por apoyar Flicklet. Tu compra mantiene Acceso completo desbloqueado.",
    accessExplore:
      "{trial}. Explora todas las funciones: recordatorios, títulos similares, extras y toda tu biblioteca.",
    accessFeaturesCopy:
      "Desbloquea la edición continua de la biblioteca, recordatorios, títulos similares, extras y listas personalizadas ilimitadas.",
    accessPriceRetry:
      "No se pudo cargar el precio de Google Play. Inténtalo de nuevo cuando la facturación de Google Play esté disponible.",
    accessTrialKeep:
      "Desbloquea Acceso completo cuando quieras para seguir editando al terminar tu prueba.",
    accessIncluded: "Incluido durante tu prueba",
    accessIncludes: "Qué incluye Acceso completo",
    accessShows: "Títulos similares",
    accessShowsCopy:
      "Información y curiosidades en las tarjetas de películas y series durante tu prueba o con Acceso completo.",
    accessExtras: "Extras",
    accessExtrasCopy:
      "Vídeos adicionales del rodaje y relacionados en las tarjetas de películas y series durante tu prueba o con Acceso completo.",
    accessReminders: "Recordatorios de episodios",
    accessRemindersCopy:
      "Avisos de Android alrededor de las 8:00 el día en que se emite un nuevo episodio.",
    accessLists: "Listas personalizadas ilimitadas",
    accessListsCopy:
      "Organiza los títulos en tantas listas personales como necesites.",
    purchaseAndroidOnly:
      "La compra y la restauración de compras están disponibles en la aplicación Flicklet para Android. El acceso de tu cuenta funciona aquí.",
    purchaseRestore: "Restaurar compras",
    purchasePending:
      "El pago está pendiente. Acceso completo se desbloqueará cuando se complete el pago y se verifique la compra. Puedes restaurar las compras más tarde.",
    purchaseMismatch:
      "Esta compra pertenece a otra cuenta de Flicklet. Cierra sesión e inicia sesión con la cuenta de Flicklet utilizada para comprar y restaura la compra. La compra no se puede transferir.",
    purchaseRestoreEmpty:
      "No se encontró una compra completada de Acceso completo para esta cuenta. Comprueba tu cuenta de Google Play e inténtalo de nuevo.",
    purchaseNotOwned:
      "Google Play no pudo confirmar una compra de Acceso completo. Comprueba tu cuenta de Play e intenta restaurar las compras.",
    accountSignedIn: "Sesión iniciada",
    accountSignedOut: "Sesión cerrada",
    accountSignedInAs: "Sesión iniciada como {email}",
    accessListLimit:
      "Máximo de {count} listas personalizadas sin Acceso completo. Desbloquéalo en Ajustes para tener listas ilimitadas.",
    purchaseSuccess: "Compra confirmada. Acceso completo desbloqueado.",
    purchaseError: "No se pudo completar la compra. Inténtalo de nuevo.",
    purchaseCancelled: "Compra cancelada. Puedes intentarlo de nuevo.",
    purchaseUnavailable:
      "La facturación de Google Play no está disponible. Inténtalo más tarde.",
    purchaseProduct:
      "El producto Acceso completo no está disponible temporalmente. Inténtalo más tarde.",
    purchaseValidation: "No se pudo verificar tu compra. Inténtalo de nuevo.",
    recoveryData: "Datos y copias de seguridad",
    recoveryManagement: "Gestión de datos",
    recoveryBackup: "Crear copia de seguridad",
    recoveryDownload: "Descargar copia de seguridad",
    recoveryBackupCopy:
      "Descarga una copia portátil de tu biblioteca, listas, progreso, preferencias y nombre preferido de Flicklet. No incluye credenciales de inicio de sesión ni acceso de pago.",
    recoveryRestore: "Restaurar datos",
    recoveryRestoreButton: "Restaurar desde una copia de seguridad",
    recoveryRestoreCopy:
      "Restaura tu biblioteca, listas, progreso y preferencias incluidas en la copia. Si tienes sesión iniciada, también se reemplazan los datos compatibles de la nube. Se conservan tu inicio de sesión, identificador de cuenta y acceso.",
    recoveryConfirm:
      "¿Restaurar la copia de seguridad de Flicklet del {date}? Se reemplazarán tu biblioteca actual, las listas personalizadas y las preferencias incluidas en la copia. Tu inicio de sesión, identificador de cuenta y acceso no cambiarán.",
    recoverySuccess:
      "La copia de seguridad se ha restaurado. Flicklet se recargará para mostrar tus datos restaurados.",
    recoveryReminderWarning:
      "Se restauraron tus datos, pero no se pudo completar la cancelación de los recordatorios del dispositivo. Revisa los recordatorios de Android.",
    recoveryBackupError:
      "No se pudo crear la copia de seguridad. Inténtalo de nuevo.",
    recoveryRestoreError:
      "No se pudo restaurar la copia de seguridad. Inténtalo de nuevo.",
    recoveryInvalid:
      "Este archivo no es una copia de seguridad válida y compatible de Flicklet. Elige otro archivo.",
    recoverySize:
      "La copia de seguridad supera los 10 MB. Elige una copia más pequeña.",
    recoveryCloudLimit:
      "Esta copia supera el límite seguro de restauración en la nube. No se cambió nada.",
    recoveryProfile: "No se pudo cargar tu perfil. Inténtalo de nuevo.",
    recoveryPending:
      "Hay una restauración o recuperación pendiente. Completa la recuperación y recarga Flicklet antes de continuar.",
    recoveryReload:
      "La cuenta con sesión iniciada ha cambiado. Recarga Flicklet antes de continuar.",
    recoveryNative:
      "No se pudo completar la recuperación de los recordatorios de Android. Recarga Flicklet para recuperar el estado local y revisa los recordatorios de Android antes de intentarlo de nuevo.",
    startOverTitle: "Empezar de nuevo",
    startOverBefore: "Antes de empezar de nuevo",
    startOverConfirm: "¿Empezar de nuevo?",
    startOverIntro:
      "Borra tu contenido de Flicklet y restablece las preferencias. Se conservarán tu inicio de sesión, identificador de cuenta y acceso.",
    startOverBackupCopy:
      "Puedes descargar primero una copia de seguridad de Flicklet o continuar sin ella. Iniciar la descarga no confirma que el archivo se haya guardado. Conserva el archivo si quieres restaurar contenido compatible más adelante.",
    startOverRemoval:
      "Se eliminarán tu biblioteca de Flicklet, listas, valoraciones, notas, progreso, recordatorios, personalización, nombre preferido y preferencias de la aplicación de esta cuenta y este dispositivo.",
    startOverPreserved:
      "Se conservarán tu inicio de sesión, identificador de cuenta, Acceso completo y derecho a la prueba registrado en el servidor. Si no tienes sesión iniciada, solo se restablecerán los datos de Flicklet de este dispositivo.",
    startOverRecovery:
      "Solo podrás restaurar contenido compatible más adelante si tienes una copia de seguridad de Flicklet.",
    startOverWithout: "Continuar sin copia de seguridad",
    startOverDelete: "Escribe DELETE para confirmar",
    recoveryCreating: "Creando copia de seguridad…",
    startOverBusy: "Empezando de nuevo…",
    startOverError: "No se pudo empezar de nuevo. Inténtalo de nuevo.",
  },
};
export type AccountLanguageStrings = {
  [K in keyof typeof ACCOUNT_TRANSLATIONS.en]: string;
};
