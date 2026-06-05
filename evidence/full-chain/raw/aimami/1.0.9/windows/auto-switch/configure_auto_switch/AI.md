# AI Handoff — configure_auto_switch (Windows 1.0.9)

status: strictImplementationUse
source_binary_sha256: a5822387fa3f56dc03893111f4ffdd074daa882e8887ec4e7c394879c0e9fe0b
owner_addr: 0x14027BE90 (renamed configure_auto_switch_owner_sys)
core_addr: 0x1400A7C00 (renamed configure_auto_switch_core_impl)
argKeys: [threshold5hPercent: u32, thresholdWeeklyPercent: u32]
response_ok: ()
response_err: CoreError (poisoned lock, missing param)
side_effect: writes two threshold u32 fields to RwLock bootstrap state + WakeByAddressSingle
gate_leaf_status: strictImplementationUse (dim6 empty)
unknowns: frontend_ccf, test_acceptance_mapping
