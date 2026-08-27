/**
 * SkillOutput — the typed workflow-launch handshake a workflow SKILL.md
 * writes back to the engine (AHQ-210/AHQ-211 D1).
 *
 * The Claude hop contributes exactly one fact the engine cannot know itself:
 * where the workflow skill is installed. The engine builds and spawns the
 * actual launch command natively from it — no command string ever crosses
 * the hop.
 *
 * Evolution rule (from the AHQ-211 plan): `skillBaseDir` stays required with
 * frozen meaning; any future keys must be optional with engine defaults, so
 * older workflows (only the one key) and newer engines coexist with no
 * version negotiation.
 */
export interface SkillOutput {
  /** Absolute path of the skill's base directory (contains ts-workflow/). */
  skillBaseDir: string;
}
