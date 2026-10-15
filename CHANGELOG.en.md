# Changelog

## v1.1.1 - 2026-10-15

### Added

### Improved

- Brighten the weekly bar chart with theme-matched colors for improved clarity and visual appeal.
- Refine the focus card layout with status text at the top left and horizontally aligned action buttons at the bottom right, using consistent button sizes and centered labels.
- Improve the daily progress ring on narrow screens so nearby text cannot compress it into an oval.

### Fixed

- Fix mobile card layout shifts caused by long English category names.
- Fix record cards overflowing the screen after a long press when titles contain long English text or parentheses; action buttons now appear on a separate row on mobile.
- Fix false "Export failed" alerts after saving backups with some Android file managers by distinguishing canceled shares from actual export errors.

### Removed

## v1.1.0 - 2026-10-13

Category management and focus experience update.

### Added

- Pause and resume focus sessions. Paused time is excluded from study duration.
- Edit a record’s title, category, date, start time, duration, and notes.
- Manage categories with custom names, optional English names, and colors.
- Choose from ten preset category colors or select a custom color.
- Archive and restore categories while keeping their historical records and statistics.
- Start a focus session without selecting a category.
- Add the Warm Orange theme and an orange heatmap palette.
- Add About ZHI SHI with access to release notes and open-source licenses.

### Improved

- Click a record to view its details, or long-press it for quick management actions.
- Use an in-app form to save a record when a study session ends.
- Show in-app confirmation dialogs when archiving or restoring categories.
- Improve form button spacing and dialog layouts.
- Preserve custom categories, English names, and archive status in backups.

### Notes

- Deleting a category keeps its historical records and marks them as Uncategorized.
- Release notes use local static data and can be viewed offline.

## v1.0.0 - 2026-10-12

First official release of ZHI SHI.

### Added

- Track focused study time with the duration hidden during a session and shown when it ends.
- Choose from four built-in categories: Mathematics, English, Major, and Politics.
- Add a study title and notes, and save the date, start time, and duration.
- Browse records by date and search titles or notes.
- Long-press a record to view its details or delete it.
- View daily study goals, today’s progress, seven-day trends, subject distribution, and a 13-week activity heatmap.
- Switch between Chinese and English and choose from five color themes.
- Edit your local display name and avatar.
- Export JSON backups, replace existing data on import, or merge records with duplicate removal.
- Use the app offline on the web, as a PWA, or through an Android APK.

### Improved

- Confirm before ending a session shorter than 25 minutes to help prevent accidental exits.
- Improve confirmation button layouts and access to avatar editing.
- Improve data export and sharing on Android.

### Notes

- Study data is stored on your device. No account is required.
- Focus sessions shorter than 25 minutes are not saved as study records.
- This release builds on the initial version completed on August 15, 2026, and serves as the baseline for the 1.x series.
