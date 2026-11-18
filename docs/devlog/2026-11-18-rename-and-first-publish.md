# 2026-11-18: rename to Tile Rivals and first publish

**Rename:** the working title "Versus 2048" became **Tile Rivals** (repo `tile-rivals`). It reads better, isn't tied to the 2048 name, and fits the head-to-head idea. Everything was renamed in one pass: page title, header, package name and lockfile, local storage keys (`tilerivals.*`, safe to change before release because nobody has saved data yet), README and docs. A search confirmed no leftovers of the old name. The word "versus" remains as the name of the two-player mode.

**Screenshots:** three captures for the README (gameplay, game over, mobile). The browser pane shows only the page, so images contain no desktop, browser chrome, file paths or tab titles. They are re-encoded as PNGs, and a metadata check found only a generic colour profile and no text fields. I retook the mobile shot because the first one caught the floating "+80" score pop overlapping the SCORE label mid-animation. That overlap is brief and only visible during the pop, but it is worth a polish pass in M6.

**Docs clean-up before going public:** the plan still read "draft, awaiting approval" and ended with questions addressed to the author. The status line now says what is done, and the open questions became a "Decisions made" list. A search of tracked files for personal names, other projects and machine wording found nothing else.

**Scope of this publish:** M0 to M2 only. Computer opponent (M3), online play (M4), reconnects (M5) and the accessibility pass (M6) are not built yet and are shown unchecked in the README.
