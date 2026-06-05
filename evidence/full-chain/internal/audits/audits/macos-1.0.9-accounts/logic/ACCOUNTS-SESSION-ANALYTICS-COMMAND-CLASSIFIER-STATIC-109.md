# Accounts Session Analytics Command Classifier Static Reducer - AiMaMi 1.0.9

Scope: accounts-only same-version macOS AiMaMi 1.0.9 static reducer for the
command classifier tables used by the shared session analytics parse leaf.

This reducer consumes IDA Pro MCP HTTP reads against the SOT binary under
`<source-location>/source-binary/`. It writes no
raw/intermediate artifact, appends no `INDEX.jsonl` row, edits no product code
or rule/spec file, runs no product test, and does not promote any gate.

## Evidence

- SOT binary root:
  `<source-location>/source-binary/`
- IDA active endpoint:
  `<local-tool-endpoint>`
- SOT executable:
  `<source-location>/source-binary/AiMaMi 1.0.9.app/Contents/MacOS/AiMaMi`
- SOT executable SHA-256:
  `1db044e8efab3b9eba8668b5a008f4952194ec0dd6a70a10725a5e7ad0350482`
- IDA database:
  `<source-location>/source-binary/AiMaMi 1.0.9_ida.app/Contents/MacOS/AiMaMi.i64`
- Parser owner:
  `parse_all_sessions` at `0x100547988`
- Write-like classifier table:
  `off_1012D1618` at `0x1012d1618`
- Read-like classifier table:
  `off_1012D1768` at `0x1012d1768`

## Static Classifier Tables

`parse_all_sessions` lowercases command payload text and scans the write-like
table first. If a match is found, it increments the write-like counter. If no
write-like match is found, it scans the read-like table and increments the
read-like counter on match. Non-matching commands remain outside both
counters.

### Write-like Table `0x1012d1618`

| Index | Pattern | String VA | Length |
|---:|---|---:|---:|
| 0 | `sed ` | `0x100f3e5d4` | 4 |
| 1 | `sed\t` | `0x100f3e5d8` | 4 |
| 2 | `echo >` | `0x100f3aaba` | 6 |
| 3 | `echo >>` | `0x100f3aac0` | 7 |
| 4 | `cat >` | `0x100f3aac7` | 5 |
| 5 | `cat >>` | `0x100f3aacc` | 6 |
| 6 | `tee ` | `0x100f3e5dc` | 4 |
| 7 | `cp ` | `0x100f3aad2` | 3 |
| 8 | `mv ` | `0x100f3aad5` | 3 |
| 9 | `mkdir ` | `0x100f3aad8` | 6 |
| 10 | `rm ` | `0x100f3aade` | 3 |
| 11 | `touch ` | `0x100f3aae1` | 6 |
| 12 | `chmod ` | `0x100f3aae7` | 6 |
| 13 | `chown ` | `0x100f3aaed` | 6 |
| 14 | `write` | `0x100f3aaf3` | 5 |
| 15 | `patch ` | `0x100f3aaf8` | 6 |
| 16 | `git commit` | `0x100f3aafe` | 10 |
| 17 | `git add` | `0x100f3ab08` | 7 |
| 18 | 
pm install` | `0x100f3ab0f` | 11 |
| 19 | `pip install` | `0x100f3ab1a` | 11 |
| 20 | `cargo add` | `0x100f3ab25` | 9 |

### Read-like Table `0x1012d1768`

| Index | Pattern | String VA | Length |
|---:|---|---:|---:|
| 0 | `cat ` | `0x100f3e5e0` | 4 |
| 1 | `head ` | `0x100f3ab2e` | 5 |
| 2 | `tail ` | `0x100f3ab33` | 5 |
| 3 | `less ` | `0x100f3ab38` | 5 |
| 4 | `more ` | `0x100f3ab3d` | 5 |
| 5 | `grep ` | `0x100f3ab42` | 5 |
| 6 | `rg ` | `0x100f3ab47` | 3 |
| 7 | `find ` | `0x100f3ab4a` | 5 |
| 8 | `ls ` | `0x100f3ab4f` | 3 |
| 9 | `pwd` | `0x100f3ab52` | 3 |
| 10 | `wc ` | `0x100f3ab55` | 3 |
| 11 | `file ` | `0x100f3ab58` | 5 |
| 12 | `stat ` | `0x100f3ab5d` | 5 |
| 13 | `du ` | `0x100f3ab62` | 3 |
| 14 | `df ` | `0x100f3ab65` | 3 |
| 15 | `git status` | `0x100f3ab68` | 10 |
| 16 | `git log` | `0x100f3ab72` | 7 |
| 17 | `git diff` | `0x100f3a228` | 8 |
| 18 | `git show` | `0x100f3a230` | 8 |
| 19 | 
pm list` | `0x100f3a238` | 8 |
| 20 | `cargo check` | `0x100f3ab79` | 11 |

## Reducer Conclusion

`accountsSessionAnalyticsCommandClassifierStatic` /
`sessionAnalyticsCommandClassifierStatic` is accepted as a same-version static
classifier-table reducer only. It proves the exact string contents, order, and
string VAs of the write-like and read-like command classifier tables used by
the shared session analytics parse leaf.

## Still Missing Before Strict

- exact runtime analytics IPC request/response/error envelope bytes;
- exact source directory paths and JSONL byte fixtures under real AiMaMi
  runtime state;
- before-after/no-write proof for analytics commands;
- runtime command strings that exercise boundary cases such as leading shell
  wrappers, mixed case, quotes, semicolons, newlines, aliases, and substring
  false positives;
- frontend chart/query/loading/error consumption state;
- executed source archive acceptance mapping;
- independent Windows 1.0.9 closure.

## Gate Effect

- `consumerStartReady`: unchanged.
- `consumerStartBlocked`: unchanged.
- `strictImplementationUse`: false / `0`.
- `readyToImplement`: false / `0`.
- `implementation_use`: false.
- `gate_accepted`: false.
- `full_leaf_100`: false.
- `moduleExitAllowed`: false.

Accounts remains the active locked module. This reducer does not permit
switching to plugins, relay, system, or tray.
