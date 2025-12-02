'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

type Language = 'en' | 'fr';

type Translations = {
    [key in Language]: {
        [key: string]: string;
    };
};

const translations: Translations = {
    en: {
        'app.title': '1fichier Downloader',
        'nav.home': 'Home',
        'nav.search': 'Search Movies',
        'nav.series': 'Search Series',

        'nav.settings': 'Settings',
        'nav.logout': 'Logout',
        'nav.back': 'Back',
        'search.title': 'Movie Search',
        'search.subtitle': 'Search for movies on Zone-Telechargement',
        'search.placeholder': 'Enter movie title...',
        'search.button': 'Search',
        'search.searching': 'Searching...',
        'search.results': 'Search Results',
        'search.found': 'found',
        'search.no_results': 'No movies found. Try a different search.',
        'search.error': 'Search failed. Please try again.',
        'search.empty.title': 'Start searching for movies',
        'search.empty.subtitle': 'Enter a movie title above to find downloads',
        'series.title': 'Series Search',
        'series.subtitle': 'Search for TV series on Zone-Telechargement',
        'series.placeholder': 'Enter series title...',
        'series.empty.title': 'Start searching for series',
        'series.empty.subtitle': 'Enter a series title above to find downloads',
        'series.view_episodes': 'View Episodes',
        'series.no_episodes': 'No episodes found',
        'series.open_link': 'Open Link',
        'movie.download': 'Download',
        'movie.get_link': 'Get Link',
        'movie.added': 'Added to queue',
        'movie.fetching': 'Fetching links...',
        'movie.adding': 'Adding...',
        'movie.qualities': 'qualities',
        'movie.links_found': 'links found',
        'movie.in_plex': 'In Plex',
        'movie.instructions': 'Opens download page → Solve captcha → Copy link → Paste in home page',
        'movie.links_available': 'links available',
        'movie.link': 'Link',
        'download.title': 'Download Manager',
        'download.subtitle': 'Paste your 1fichier premium link and choose where to save it.',
        'download.placeholder': 'Paste 1fichier link here...',
        'download.button': 'Download',
        'download.path': 'Download Path',
        'download.path_placeholder': 'Select download path...',
        'download.path.default': 'Default (Downloads folder)',
        'download.path.custom': 'Custom path...',
        'download.custom_filename': 'Custom Filename (optional)',
        'download.active.title': 'Active Downloads',
        'download.active.count': 'Items',
        'download.empty.title': 'No downloads yet',
        'download.empty.subtitle': 'Add a link above to get started',
        'download.status.pending': 'Pending',
        'download.status.downloading': 'Downloading',
        'download.status.completed': 'Completed',
        'download.status.failed': 'Failed',
        'download.status.error': 'Error',
        'download.detecting_filename': 'Detecting filename...',
        'download.cancel.confirm': 'Are you sure you want to cancel this download?',
        'paths.manage': 'Manage Paths',
        'paths.title': 'Manage Path Shortcuts',
        'paths.description': 'Add, edit, or remove download path shortcuts',
        'paths.current': 'Current Shortcuts',
        'paths.default': '(Default download directory)',
        'paths.add.title': 'Add New Shortcut',
        'paths.add.name': 'Name',
        'paths.add.path': 'Path',
        'paths.add.help': 'Use absolute paths (e.g., /mnt/media/...) or relative to download directory',
        'paths.add.button': 'Add Shortcut',
        'paths.delete.confirm': 'Are you sure you want to delete this shortcut?',
        'settings.title': 'Settings',
        'settings.plex.title': 'Plex Integration',
        'settings.plex.url': 'Plex Server URL',
        'settings.plex.token': 'Plex Token',
        'settings.plex.save': 'Save Plex Settings',
        'settings.password.title': 'Change Password',
        'settings.password.current': 'Current Password',
        'settings.password.new': 'New Password',
        'settings.password.confirm': 'Confirm Password',
        'settings.password.save': 'Update Password',
        'settings.success': 'Settings saved successfully',
        'settings.error': 'Failed to save settings',
    },
    fr: {
        'app.title': 'Téléchargeur 1fichier',
        'nav.home': 'Accueil',
        'nav.search': 'Rechercher Films',
        'nav.series': 'Rechercher Séries',

        'nav.settings': 'Paramètres',
        'nav.logout': 'Déconnexion',
        'nav.back': 'Retour',
        'search.title': 'Recherche de Films',
        'search.subtitle': 'Rechercher des films sur Zone-Telechargement',
        'search.placeholder': 'Entrez le titre du film...',
        'search.button': 'Rechercher',
        'search.searching': 'Recherche...',
        'search.results': 'Résultats de recherche',
        'search.found': 'trouvé(s)',
        'search.no_results': 'Aucun film trouvé. Essayez une autre recherche.',
        'search.error': 'La recherche a échoué. Veuillez réessayer.',
        'search.empty.title': 'Commencez à rechercher des films',
        'search.empty.subtitle': 'Entrez un titre de film ci-dessus pour trouver des téléchargements',
        'series.title': 'Recherche de Séries',
        'series.subtitle': 'Rechercher des séries sur Zone-Telechargement',
        'series.placeholder': 'Entrez le titre de la série...',
        'series.empty.title': 'Commencez à rechercher des séries',
        'series.empty.subtitle': 'Entrez un titre de série ci-dessus pour trouver des téléchargements',
        'series.view_episodes': 'Voir les épisodes',
        'series.no_episodes': 'Aucun épisode trouvé',
        'series.open_link': 'Ouvrir le lien',
        'movie.download': 'Télécharger',
        'movie.get_link': 'Obtenir le lien',
        'movie.added': 'Ajouté à la file',
        'movie.fetching': 'Récupération...',
        'movie.adding': 'Ajout...',
        'movie.qualities': 'qualités',
        'movie.links_found': 'liens trouvés',
        'movie.in_plex': 'Dans Plex',
        'movie.instructions': 'Ouvre la page → Résoudre le captcha → Copier le lien → Coller sur la page d\'accueil',
        'movie.links_available': 'liens disponibles',
        'movie.link': 'Lien',
        'download.title': 'Gestionnaire de Téléchargement',
        'download.subtitle': 'Collez votre lien premium 1fichier et choisissez où l\'enregistrer.',
        'download.placeholder': 'Collez le lien 1fichier ici...',
        'download.button': 'Télécharger',
        'download.path': 'Chemin de téléchargement',
        'download.path_placeholder': 'Sélectionner le chemin...',
        'download.path.default': 'Par défaut (Dossier Téléchargements)',
        'download.path.custom': 'Chemin personnalisé...',
        'download.custom_filename': 'Nom de fichier personnalisé (optionnel)',
        'download.active.title': 'Téléchargements actifs',
        'download.active.count': 'éléments',
        'download.empty.title': 'Aucun téléchargement',
        'download.empty.subtitle': 'Ajoutez un lien ci-dessus pour commencer',
        'download.status.pending': 'En attente',
        'download.status.downloading': 'Téléchargement',
        'download.status.completed': 'Terminé',
        'download.status.failed': 'Échoué',
        'download.status.error': 'Erreur',
        'download.detecting_filename': 'Détection du nom...',
        'download.cancel.confirm': 'Êtes-vous sûr de vouloir annuler ce téléchargement ?',
        'paths.manage': 'Gérer les chemins',
        'paths.title': 'Gérer les raccourcis',
        'paths.description': 'Ajouter, modifier ou supprimer des raccourcis',
        'paths.current': 'Raccourcis actuels',
        'paths.default': '(Dossier par défaut)',
        'paths.add.title': 'Ajouter un raccourci',
        'paths.add.name': 'Nom',
        'paths.add.path': 'Chemin',
        'paths.add.help': 'Utilisez des chemins absolus ou relatifs',
        'paths.add.button': 'Ajouter',
        'paths.delete.confirm': 'Êtes-vous sûr de vouloir supprimer ce raccourci ?',
        'settings.title': 'Paramètres',
        'settings.plex.title': 'Intégration Plex',
        'settings.plex.url': 'URL Serveur Plex',
        'settings.plex.token': 'Jeton Plex',
        'settings.plex.save': 'Enregistrer Plex',
        'settings.password.title': 'Changer le mot de passe',
        'settings.password.current': 'Mot de passe actuel',
        'settings.password.new': 'Nouveau mot de passe',
        'settings.password.confirm': 'Confirmer le mot de passe',
        'settings.password.save': 'Mettre à jour',
        'settings.success': 'Paramètres enregistrés avec succès',
        'settings.error': 'Échec de l\'enregistrement',
    }
};

interface I18nContextType {
    language: Language;
    setLanguage: (lang: Language) => void;
    t: (key: string) => string;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

export function I18nProvider({ children }: { children: React.ReactNode }) {
    const [language, setLanguage] = useState<Language>('en');

    useEffect(() => {
        const savedLang = localStorage.getItem('language') as Language;
        if (savedLang && (savedLang === 'en' || savedLang === 'fr')) {
            setLanguage(savedLang);
        }
    }, []);

    const handleSetLanguage = (lang: Language) => {
        setLanguage(lang);
        localStorage.setItem('language', lang);
    };

    const t = (key: string) => {
        return translations[language][key] || key;
    };

    return (
        <I18nContext.Provider value={{ language, setLanguage: handleSetLanguage, t }}>
            {children}
        </I18nContext.Provider>
    );
}

export function useI18n() {
    const context = useContext(I18nContext);
    if (context === undefined) {
        throw new Error('useI18n must be used within an I18nProvider');
    }
    return context;
}
