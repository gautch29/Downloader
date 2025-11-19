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
        'nav.settings': 'Settings',
        'nav.logout': 'Logout',
        'download.title': 'Download Manager',
        'download.placeholder': 'Paste 1fichier link here...',
        'download.button': 'Download',
        'download.status.pending': 'Pending',
        'download.status.downloading': 'Downloading',
        'download.status.completed': 'Completed',
        'download.status.failed': 'Failed',
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
        'nav.settings': 'Paramètres',
        'nav.logout': 'Déconnexion',
        'download.title': 'Gestionnaire de Téléchargement',
        'download.placeholder': 'Collez le lien 1fichier ici...',
        'download.button': 'Télécharger',
        'download.status.pending': 'En attente',
        'download.status.downloading': 'Téléchargement',
        'download.status.completed': 'Terminé',
        'download.status.failed': 'Échoué',
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
