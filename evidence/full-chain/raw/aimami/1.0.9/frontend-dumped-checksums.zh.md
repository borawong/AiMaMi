# 前端 dumped 资产校验说明

## 总体状态

通过，附 manifest hash 记录说明。

- macOS dumped 文件共 31 个，manifest 中对应 dumped 记录共 31 个。
- 文件大小全部匹配。
- 当前 dumped 文件 sha256 以仓库内现有 dumped 文件重新计算值为准。
- manifest 中 21 条 hash 记录为 64 位且匹配，10 条 hash 记录长度异常，0 条 hash 记录为有效长度但不匹配。
- 这 10 条属于 manifest 记录问题，需要后续修复 manifest 记录；不要据此把实际 dumped 文件判为损坏。
- 主 bundle hash 匹配。
- Windows tauri-dumped 关键文件 10 个均存在，大小和 sha256 已重新记录。
- 敏感扫描结果：PASS。

## 导入范围

- macOS dumped：31 个文件，仅记录 dumped 内相对路径、文件大小、当前 sha256、manifest 大小是否匹配、manifest hash 状态。
- Windows tauri-dumped：记录 `index.html`、主入口 JS、CSS，以及 accounts、relay、settings、skills、mcp、maintenance、sessions 页面 chunk。
- 本说明不记录任何内部源路径、共享盘、本机路径、机器名或用户名。

## 匿名化说明

- 仓库只保留 dumped 内相对路径、文件大小和 hash。
- 仓库不保留内部源路径、共享盘、本机路径、机器名、用户名、凭据或地址。
- manifest 对比只记录大小是否匹配，以及 hash 记录状态。
- 敏感扫描只查真实内部路径、项目名、共享名、本机用户名和地址；普通十六进制片段不作为敏感词。

## macOS 31 文件校验表

| 相对路径 | 大小(字节) | 当前 sha256 | manifest 大小 | manifest hash 状态 |
| --- | ---: | --- | --- | --- |
| assets/accounts-page-CJFT2P5o.js | 55265 | `e340c64f7d8fa05ce8215efba75684dad64e33dac1ad3f5c6bdccbd0e31f27cf` | 匹配 | 匹配 |
| assets/analytics-panel-D01GGJ7u.js | 31271 | `a5aaa4ea6b3c31225090ba6d46c507305b31d16d0447721470f861c333254b18` | 匹配 | 记录长度异常 |
| assets/app-C4jGp0lC.js | 1225 | `a2b01cf17373cfa1ee4165665edec4fd177a90a2a38a711119b7f04ed4741752` | 匹配 | 匹配 |
| assets/badge-lO7WXF4P.js | 722 | `a1a51238293a9c15fcc287c3fcc10778bef98c92600ba534762a34e15027ebe8` | 匹配 | 匹配 |
| assets/bento-card-Dmmk84Fo.js | 549 | `eb5753700b4dc21284b739b19ef3d1011a24f454198eead723f648b23e763b0f` | 匹配 | 匹配 |
| assets/chevron-down-BeWDzAuc.js | 296 | `2eddd547bec4b8f4386b9fed1af92fdc001e9ba382c25d1479d85c58044b1d4b` | 匹配 | 记录长度异常 |
| assets/chevron-right-UPip_PAp.js | 298 | `eab2e3d6cb14b4c77332db4d36d30dcd25c36aca7aca6b7d62f1e52b6f4b54b6` | 匹配 | 匹配 |
| assets/copy-5aWLQhLO.js | 400 | `c2c4364e9c8758cbbb10f822ffdef73d1e535eb24152daf25b89515a34ecf3bf` | 匹配 | 匹配 |
| assets/globe-BPF4oTl2.js | 411 | `1db0abc793708234754b11acb3427bd8cecfc7ab6dbaa2c24b7dbf2c354698e8` | 匹配 | 匹配 |
| assets/index-7820-NqI.js | 288 | `f6597dbe70007903406fd8fdf99b8c884e22706d85e8ac13118384e9506b2364` | 匹配 | 匹配 |
| assets/index-CCpZHHpo.js | 232 | `dd497ca0a12c1175bcd8631dc945f74da90fcd7ce7da432d043719668b83217c` | 匹配 | 匹配 |
| assets/index-CJQqyjVG.js | 1080 | `9730c5ce21b2299df59bdfe5163dd1785035deae44cdf54c2bbabc1f041805bf` | 匹配 | 记录长度异常 |
| assets/index-CL22l5v8.js | 656775 | `a03d23862a4ec489c0aa81fc131027b4b4894ef9a846e1cd19b8e3c69a390cc0` | 匹配 | 匹配 |
| assets/index-DOPtUrVF.css | 100753 | `259c2ba398594ad2220dc724fe7c7e73ba92cf4c796019123384d3ad64176822` | 匹配 | 匹配 |
| assets/maintenance-page-j6kXR210.js | 15367 | `3603cea7d0b03dc5879ea04f556370664bcdceac56154026d6e72850dd3c2c51` | 匹配 | 记录长度异常 |
| assets/mcp-page-CWT3lnG-.js | 11430 | `486097aeb2f372601f80137c6254a24f784ce4c3c6b6e4f15c272def6d4514aa` | 匹配 | 匹配 |
| assets/pencil-B_hZHMms.js | 445 | `705b8cd3a95bdc39c1636eed4b2705d8d39aafd2d033a5184f373c2eb48c6a99` | 匹配 | 匹配 |
| assets/plugins-page-BOi_QT1c.js | 2483 | `d4307b285c5869114b8db1a7a96b94b9789516ea5d76eb5506616acb0be800e5` | 匹配 | 记录长度异常 |
| assets/plus-DLmEjR9w.js | 322 | `6d80c0346e3161cb12bd2cf99e432a83e3f5cc806993cbb683e11d21acaeb75b` | 匹配 | 匹配 |
| assets/refresh-cw-YG16BpN4.js | 489 | `c434d14a6e26c371026d554271e328a86520c6611f7cd1bd6f21fa1c47c50f66` | 匹配 | 记录长度异常 |
| assets/relay-page-CljGSoid.js | 70243 | `73ae24a53fde91e2b9927eb9bfcb38ff6ca6f8ca38f897a5701e0f4a9ac88027` | 匹配 | 匹配 |
| assets/rotate-ccw-DdA7m5aQ.js | 368 | `d48bbf121ad189e382a1026a6ba1c5dc6330b7490362822afa9a2d9f20180743` | 匹配 | 记录长度异常 |
| assets/select-D3TF-G7B.js | 21560 | `9978f52ed9ec7f3721a20dbb0f1ce3dcd235d598e2999b75c83ac0717053d2b8` | 匹配 | 匹配 |
| assets/sessions-page-_V8EZ45X.js | 15218 | `8e8705b7586668d3d2b2927d5ac6e5b3eb561240cb0fe0282addb8de64100bb2` | 匹配 | 匹配 |
| assets/settings-page-CHeElwco.js | 9784 | `6a68849a28f85934e2c8db8d437d46a84e221946875539a6c4e17223b14d606b` | 匹配 | 匹配 |
| assets/skills-page-R7hR7Rs1.js | 7819 | `bb11132812434eb63349e631756f39b97aaa3c2c5dd069cc073086308b4eb040` | 匹配 | 记录长度异常 |
| assets/switch-CLDV4nI8.js | 2484 | `d6e46864f5d37a250903a2749c9fd986951353a556e3b6fc5deff7053f5f3740` | 匹配 | 记录长度异常 |
| assets/trash-2-Bq5byYZP.js | 526 | `2042aaa981f937bdafb6e43616ab40be6527bc110acfe9b0cf0cf9dc20f4c471` | 匹配 | 匹配 |
| assets/upload-OvMZGXcd.js | 426 | `e6208be11a1f7d58b6319e1dc8c17f1784633df3ff71de90bcfd71a6f25f3548` | 匹配 | 匹配 |
| assets/use-relay-providers-BNphfsn5.js | 3722 | `d717a0a9ec4c50b1ae83d2285a719f669b176ea3aca65dc4199a883de2297327` | 匹配 | 记录长度异常 |
| index.html | 1455 | `99038169300fd720e61222e63f34096cbc9d84591ee4e14fe7075b40f10d5ee6` | 匹配 | 匹配 |

## Windows 关键文件校验表

| 文件 | 相对路径 | 大小(字节) | sha256 |
| --- | --- | ---: | --- |
| index | index.html | 1487 | `0e7b942dc5ac067166898c33603811626205b554d91fcf96be6da4a8c50b7c5f` |
| 主 JS | assets/index-CL22l5v8.js | 656775 | `a03d23862a4ec489c0aa81fc131027b4b4894ef9a846e1cd19b8e3c69a390cc0` |
| CSS | assets/index-DOPtUrVF.css | 100753 | `259c2ba398594ad2220dc724fe7c7e73ba92cf4c796019123384d3ad64176822` |
| accounts chunk | assets/accounts-page-CJFT2P5o.js | 55265 | `e340c64f7d8fa05ce8215efba75684dad64e33dac1ad3f5c6bdccbd0e31f27cf` |
| relay chunk | assets/relay-page-CljGSoid.js | 70243 | `73ae24a53fde91e2b9927eb9bfcb38ff6ca6f8ca38f897a5701e0f4a9ac88027` |
| settings chunk | assets/settings-page-CHeElwco.js | 9784 | `6a68849a28f85934e2c8db8d437d46a84e221946875539a6c4e17223b14d606b` |
| skills chunk | assets/skills-page-R7hR7Rs1.js | 7819 | `bb11132812434eb63349e631756f39b97aaa3c2c5dd069cc073086308b4eb040` |
| mcp chunk | assets/mcp-page-CWT3lnG-.js | 11430 | `486097aeb2f372601f80137c6254a24f784ce4c3c6b6e4f15c272def6d4514aa` |
| maintenance chunk | assets/maintenance-page-j6kXR210.js | 15367 | `3603cea7d0b03dc5879ea04f556370664bcdceac56154026d6e72850dd3c2c51` |
| sessions chunk | assets/sessions-page-_V8EZ45X.js | 15218 | `8e8705b7586668d3d2b2927d5ac6e5b3eb561240cb0fe0282addb8de64100bb2` |

## 敏感扫描结果

PASS。

扫描范围为本说明和 Windows frontend contract 报告。扫描规则只覆盖真实内部路径、项目名、共享名、本机用户名和地址，不把普通十六进制片段当作敏感词。
