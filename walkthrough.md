# Verification Walkthrough: "Joyful Glass" Redesign & Localization

## 1. "Joyful Glass" Aesthetic (Light Mode)
- **Objective**: Verify the new light, Apple-inspired aesthetic.
- **Steps**:
    1.  Navigate to the home page (`/`).
    2.  **Background**: Confirm the background is **white** with subtle, moving pastel blobs (violet, blue, pink). It should feel bright and airy, not dark.
    3.  **Glass Cards**: Verify cards are white/translucent (`bg-white/70`) with a strong blur, creating a "frosted glass" look over the moving background.
    4.  **Text Contrast**: Ensure all text is dark (`text-zinc-900` or `text-zinc-500`) and easily readable against the light glass. No white text on white backgrounds.
    5.  **Inputs**: Check that input fields are light (`bg-white/50`) with dark text.

## 2. Complete Localization
- **Objective**: Verify that ALL text is translated when switching languages.
- **Steps**:
    1.  Toggle language to **French (FR)**.
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
