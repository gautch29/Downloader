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

## 3. Mobile Responsiveness
- [ ] **Layout**: Resize window to mobile width.
- [ ] Verify padding is appropriate (not too wide/narrow).
- [ ] Verify inputs and buttons are easily tappable (large enough).
- [ ] Verify no horizontal scrolling. against the light glass. No white text on white backgrounds.
    5.  **Inputs**: Check that input fields are light (`bg-white/50`) with dark text.

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
