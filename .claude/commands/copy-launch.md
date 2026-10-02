# Copy Launch — Put a ready-to-run `claude` line for a kickoff on the clipboard

Build the one-line shell command that starts a fresh implementation session on a kickoff, and copy it to the macOS clipboard so it can be pasted straight into another terminal pane.

**Arguments**: $ARGUMENTS — a story ID (e.g. `T3-3`) or a kickoff path, optionally followed by the command to run (`implement` by default, or `work-on`) and/or an effort level (`low`, `medium`, `high`, `xhigh`, `max`).

---

## Steps

1. **Resolve the kickoff path.**
   - A path: use it as given, relative to the repo root.
   - A story ID: look for `.claude/local/plans/prompts/<story-id>-kickoff.md`. If that does not exist, list `.claude/local/plans/prompts/` and match a file whose name starts with the story ID (combined kickoffs look like `T2-5-T2-10-kickoff.md`). If none match, or more than one does, ask. Do not guess.
   - Confirm the file exists with `ls` before going on.
2. **Read the session name from the kickoff.** It is the bold text on the line `Suggest renaming this session to **<NAME>**`. If the kickoff has no such line, fall back to the story file's `**Session name:**` field; if that is missing too, ask.
3. **Pick the command:** `implement` unless the arguments name `work-on`.
4. **Pick the effort level**, first match wins:
   - an effort level named in the arguments;
   - the kickoff's `Suggested effort: **<level>**` line, if it has one;
   - otherwise `high`.

   Only `low`, `medium`, `high`, `xhigh` and `max` are valid. Anything else: ask.

5. **Build the line**, single-quoted so the shell passes each argument through untouched:

   ```
   claude -n '<SESSION NAME>' --effort <level> '/<command> <kickoff path>'
   ```

6. **Copy it** with `printf '%s' "<line>" | pbcopy` (no trailing newline, so pasting does not run it before it is checked).
7. **Reply with the line and nothing else of note**, e.g. "Copied: `claude -n 'T3-3-QUESTION-BANK-UI' --effort high '/implement .claude/local/plans/prompts/T3-3-kickoff.md'`". Run it from the repo root; the kickoff path is relative to it.

## Constraints

- Read-only apart from the clipboard: never edit or move the kickoff here, because `/implement` archives it when it loads it.
- If `pbcopy` is not available (not macOS), say so and print the line instead.
