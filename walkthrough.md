# Verification Walkthrough

## 1. Visual Design & Branding (Strict Apple Style)
- [ ] **Header**:
    - [ ] Verify title is "dl.flgr.fr" (Dark text).
    - [ ] Verify logo/icon is **Apple Blue** (#0071E3) or neutral, NOT purple.
    - [ ] Verify "Activity" pulse is **Apple Blue**, NOT purple.
- [ ] **Home Page**:
    - [ ] Verify background is clean, off-white/grey (no colorful blobs).
    - [ ] Verify "Sparkles" icon is **Apple Blue**.
    - [ ] Verify "Download" button is solid **Apple Blue** with white text (no gradients).
    - [ ] Verify input fields have **Apple Blue** focus rings.
- [ ] **Download Card**:
    - [ ] Start a download.
    - [ ] Verify progress bar is **Apple Blue**.
    - [ ] Verify "Downloading" badge is **Apple Blue**.
    - [ ] Verify "Completed" badge is **Apple Green** (#34C759).
    - [ ] Verify "Error" badge is **Apple Red** (#FF3B30).
- [ ] **Settings Page**:
    - [ ] Verify section headers (Plex, Password) have **Apple Blue** accents.
    - [ ] Verify "Save" buttons are **Apple Blue**.
    - [ ] Verify links are **Apple Blue**.
- [ ] **Modals (Path Shortcuts)**:
    - [ ] Verify "Add" button is **Apple Blue**.
    - [ ] Verify "Trash" icon hover state is **Apple Red**.

## 2. Localization (French/English)
- [ ] **Header**: Toggle language. Verify "Settings" and "Logout" tooltips/text change.
- [ ] **Home**: Verify "Download from 1fichier", subtitle, and placeholders translate.
- [ ] **Download Card**: Verify status badges (Downloading, Completed, etc.) translate.
- [ ] **Settings**: Verify all labels, titles, and success/error messages translate.
- [ ] **Path Shortcuts**: Verify modal title, descriptions, and button labels translate.

### 3. System Dark Mode Verification
- [ ] **Toggle System Theme**: Switch your OS theme between Light and Dark.
- [ ] **Check Backgrounds**:
    - **Light Mode**: Should be white/light grey with light glass cards.
    - **Dark Mode**: Should be dark grey/black (`#1D1D1F`) with dark glass cards.
- [ ] **Check Text Legibility**: Ensure text is readable in both modes (Dark text on Light, White text on Dark).
- [ ] **Check Accents**: Verify "Apple Blue" buttons and icons look good in both modes.
- [ ] **Check Inputs**: Verify input fields have appropriate background and border colors in both modes.

### 4. Localization Check
- [ ] **Toggle Language**: Use the language toggle in the header.
- [ ] **Verify Translations**: Check that all text updates to the selected language (English/French).
- [ ] **Check Dynamic Content**: Ensure download status and error messages are translated.

## 2. Complete Localization
- **Objective**: Verify that ALL text is translated when switching languages.
- **Steps**:
    2.  **Header**:
        -   Hover over Settings icon -> "Paramètres" (tooltip/title)
        -   Hover over Logout icon -> "Déconnexion" (tooltip/title)
    3.  **Home Page**:
        -   "Active Downloads" -> "Téléchargements actifs"
        -   "No downloads yet" -> "Aucun téléchargement"
    4.  **Settings Page**:
        -   Labels: "URL Serveur Plex", "Jeton Plex"
        -   Buttons: "Enregistrer Plex", "Mettre à jour"
    5.  **Path Shortcuts Modal**:
        -   Title: "Gérer les raccourcis"
        -   Labels: "Nom", "Chemin"

## 3. Mobile Responsiveness
- **Objective**: Ensure the light theme looks good on mobile.
- **Steps**:
    1.  Resize to mobile width.
    2.  Verify that the pastel background blobs are visible but not overwhelming.
    3.  Check that the glass cards have appropriate padding and margins.
