pub(crate) mod lifecycle;
pub(crate) mod state;

// 这里集中暴露桌面适配入口，但当前阶段不注册任何平台能力。
pub(crate) use lifecycle::run;
