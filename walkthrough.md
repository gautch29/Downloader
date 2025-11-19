# Verification Walkthrough: Visual Overhaul & Localization

## 1. Visual Redesign ("Liquid Glass")
- **Objective**: Verify the new "Apple-like liquid glass" aesthetic.
- **Steps**:
    1.  Navigate to the home page (`/`).
    2.  Observe the background: It should be a dark, animated mesh gradient.
    3.  Observe the cards: They should have a glassmorphism effect (blur, transparency, subtle borders).
    4.  Check the "Add Download" section and "Active Downloads" list for the new styling.
    5.  Navigate to Settings (`/settings`) and verify the same aesthetic is applied to the Plex and Password forms.

## 2. Localization (English/French)
- **Objective**: Verify language switching works correctly.
- **Steps**:
    1.  Look for the language toggle (FR/EN) in the header.
    2.  Click "FR".
    3.  Verify that text on the page changes to French (e.g., "Start New Download" -> "Nouvel ajout", "Active Downloads" -> "Téléchargements actifs").
    4.  Click "EN".
    5.  Verify text reverts to English.
    6.  Navigate to Settings and verify translations there as well.

## 3. Branding
- **Objective**: Verify the app name is updated.
- **Steps**:
    1.  Check the browser tab title. It should read "dl.flgr.fr".
    2.  Check the header logo/text. It should display "dl.flgr.fr".

## 4. Mobile Responsiveness
- **Objective**: Verify the layout on mobile devices.
- **Steps**:
    1.  Resize the browser window to a mobile width (e.g., 375px).
    2.  Verify that the layout adapts:
        -   The header should fit or stack elements gracefully.
        -   The "Add Download" card should stack inputs vertically if needed.
        -   The download cards should be full width.
        -   Padding and margins should be appropriate for touch.

## 5. Plex Integration (Regression Test)
- **Objective**: Ensure Plex settings still work with the new UI.
- **Steps**:
    1.  Go to Settings.
    2.  Enter/Update Plex URL and Token.
    3.  Click Save.
    4.  Verify success message appears and settings are saved.
