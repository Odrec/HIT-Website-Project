/**
 * Site-wide feature switches.
 *
 * A code constant, not an env var: most public pages are prerendered at build
 * time, so a runtime env read in Header/Footer would only take effect on the
 * dynamic pages and the navigation would differ from page to page.
 */

/**
 * Studiennavigator (LLM study-programme chat). Switched off for HIT 2026 at the
 * ZSB's request — some recommendations and AI explanations still need review
 * with the subject representatives. While off, every entry point is hidden,
 * /navigator answers 404 and /api/navigator* answers 404 without calling the
 * model. Flip to `true` to bring it back.
 */
export const NAVIGATOR_ENABLED = false
