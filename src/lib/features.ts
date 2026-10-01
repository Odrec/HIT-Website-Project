/**
 * Site-wide feature switches.
 *
 * Code constants rather than env vars on purpose: turning a feature back on
 * should go through a review and a release, not a quiet `.env` edit.
 */

/**
 * Studiennavigator (LLM study-programme chat). Switched off for HIT 2026 at the
 * ZSB's request — some recommendations and AI explanations still need review
 * with the subject representatives. While off, every entry point is hidden,
 * /navigator answers 404 and /api/navigator* answers 404 without calling the
 * model. Flip to `true` to bring it back.
 */
export const NAVIGATOR_ENABLED = false
