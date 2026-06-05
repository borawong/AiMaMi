# Publication Hygiene Rules

These rules define what should be checked before adding reconstruction material
to the repository.

## Required Placeholders

| Material | Replacement |
| --- | --- |
| Source location outside this repository | `<source-location>` |
| Local account name | `<local-user>` |
| Local absolute path | `<local-path>` |
| Network location | `<network-share>` |
| Real person or customer data | `<redacted-user-data>` |
| Account secret or credential value | `<redacted-secret>` |

## Do Not Publish

- API keys, signing keys, session identifiers, cookies, and auth material
- Local-only paths, share paths, account names, and workstation details
- Raw logs, raw runtime traces, raw session content, personal data, and
  generated dumps that have not been reviewed
- Expanded database companion files
- Exploit, bypass, attack, or evasion material

## Screening Patterns

Reject or rewrite content matching these forms before publication:

- Non-public network address patterns
- Share-style paths beginning with double separators
- Drive-root absolute paths
- Home-directory absolute paths
- Long opaque bearer-like values
- Assignment lines that name an account secret and contain a real value

## Publication Rules

- Use repository-relative paths in public documents.
- Keep Apache-2.0, Tauri 2 + React + Rust, and public repository structure
  visible.
- Do not rely on local environment state to explain restoration steps.
- Keep large reference assets outside the main source repository and document
  their external location, size, and hash by manifest.
