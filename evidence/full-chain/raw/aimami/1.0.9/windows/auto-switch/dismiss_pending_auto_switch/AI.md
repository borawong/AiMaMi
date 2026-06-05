# AI Handoff — dismiss_pending_auto_switch (Windows 1.0.9)

status: strictImplementationUse
source_binary_sha256: a5822387fa3f56dc03893111f4ffdd074daa882e8887ec4e7c394879c0e9fe0b
owner_addr: 0x14027F120 (renamed dismiss_pending_auto_switch_owner_sys)
core_addr: 0x1400AA290 (dismiss core impl)
argKeys: []
response_ok: Option<String> — old pendingSwitchAccountKey or null
response_err: CoreError (poisoned lock)
side_effect: clears pendingSwitchAccountKey in bootstrap state (sets to None) + WakeByAddressSingle
gate_leaf_status: strictImplementationUse (dim6 empty)
unknowns: frontend_ccf, test_acceptance_mapping
