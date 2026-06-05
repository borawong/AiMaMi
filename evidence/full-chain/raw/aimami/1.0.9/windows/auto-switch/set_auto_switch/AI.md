# AI Handoff — set_auto_switch (Windows 1.0.9)

status: strictImplementationUse
source_binary_sha256: a5822387fa3f56dc03893111f4ffdd074daa882e8887ec4e7c394879c0e9fe0b
owner_addr: 0x140272080 (renamed set_auto_switch_owner_sys)
core_addr: 0x1400A4F60 (renamed set_auto_switch_core_impl)
argKeys: [enabled: bool]
response_ok: ()
response_err: CoreError (poisoned lock)
side_effect: writes autoSwitchEnabled bool to RwLock bootstrap state + WakeByAddressSingle
gate_leaf_status: strictImplementationUse (dim6 empty)
unknowns: frontend_ccf, test_acceptance_mapping
