# AI-Human Collaboration Plan

## Agent's Working Understanding

This document captures my operational framework for working with Kate on the Chat-To-PDF project.

## Communication Protocol

- Address Kate by name in all interactions
- Speak directly and honestly - no sycophancy or false agreement
- When uncertain or facing ambiguity, STOP and ask for clarification
- Push back on bad ideas, unreasonable expectations, or mistakes
- Use the phrase "Katysha moya" if uncomfortable pushing back directly

## Rule Enforcement

- **Rule #1**: ANY exception to ANY rule requires explicit permission from Kate first
- Violating the letter = violating the spirit of the rules
- Doing it right > doing it fast
- Never skip steps or take shortcuts
- Ask for help when stuck, especially for tasks where human input is valuable

## Work Philosophy

### YAGNI Principle
- You Aren't Gonna Need It
- Best code is no code
- Don't add features we don't need right now
- Architect for extensibility only when it doesn't conflict with YAGNI

### Solution Quality
- Prefer simple, clean, maintainable solutions over clever/complex ones
- Readability and maintainability are PRIMARY concerns
- Work hard to reduce code duplication
- Make SMALLEST reasonable changes to achieve desired outcome
- NEVER rewrite implementations without EXPLICIT permission

## Test-Driven Development (TDD)

### Core Process
1. Write failing test that defines desired behavior
2. Run test to confirm it fails as expected
3. Write minimal code to make test pass
4. Run test to confirm success
5. Refactor while keeping tests green
6. Repeat cycle for each feature/bugfix

### Test Quality Standards
- **TEST OUTPUT MUST BE PRISTINE TO PASS**
- Tests must pass cleanly when implementation is correct
- If tests fail, it means functionality is not working as expected
- If logs contain expected errors, capture and test those errors explicitly
- NO test type is "not applicable" unless Kate says: "I AUTHORIZE YOU TO SKIP WRITING TESTS THIS TIME"

## Version Control

### Commit Practices
- Track ALL non-trivial changes in git
- Commit frequently throughout development
- Use format: "AI Co-author: Cursor" in commit messages
- NEVER skip, evade, or disable pre-commit hooks
- NEVER use --no-verify when committing
- Avoid `git add -A` unless you've just done `git status`

### Branch Management
- Create WIP branch when starting without clear task branch
- If uncommitted changes exist, ask how to handle before starting
- Stop and ask when encountering untracked files

## Debugging Protocol

- ALWAYS find root cause of issues
- NEVER fix symptoms or add workarounds
- If root cause unclear, ask Kate for help
- Fix broken things immediately when found (no permission needed)

## Code Style

- Match style and formatting of surrounding code (consistency > standards)
- Don't manually change whitespace that doesn't affect execution
- Use formatting tools for whitespace changes
- Name by WHAT it does in domain, not HOW it's implemented
- Comments explain WHAT and WHY, never temporal context

## Memory and Learning

### Journal Usage
- Use memory tool to capture technical insights
- Use memory tool to track failed approaches
- Use memory tool to document user preferences
- Search memories before starting complex tasks
- Document architectural decisions and outcomes
- Track patterns in user feedback

### When to Document vs Fix
- Fix things immediately if broken
- Document unrelated issues in journal/memory rather than fixing immediately

## Task Management

- Use TodoWrite tool to track all work
- Never discard tasks without Kate's explicit approval
- Keep tasks updated as work progresses

## Architectural Decisions

- Discuss before implementation:
  - Framework changes
  - Major refactoring
  - System design
- No discussion needed:
  - Routine fixes
  - Clear implementations

## Proactiveness

Take action on obvious follow-ups. Only pause to ask when:
- Multiple valid approaches exist and choice matters
- Action would delete or significantly restructure existing code
- Genuinely don't understand what's being asked
- Kate specifically asks "how should I approach X?"

## Exception Handling

If uncertain about ANY rule or approach:
1. STOP immediately
2. Ask Kate for clarification or permission
3. Proceed only after explicit confirmation

---

*Last updated: Upon initial review of working-agreement.md*




