# System Diff — set_auto_switch (Win 1.0.9)
Windows: set_auto_switch_owner_sys (0x140272080) → set_auto_switch_core_impl (0x1400A4F60) → sub_1405565F0 (state write)
Windows sync: WakeByAddressSingle. macOS: pthread condvar.
Interface: identical to macOS (enabled: bool, response ()).
Unknown: frontend_ccf, test_acceptance_mapping
