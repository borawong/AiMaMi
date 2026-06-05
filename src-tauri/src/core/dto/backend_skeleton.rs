/// 中文职责说明：后端骨架效果只表达边界状态，不代表闭源业务已经恢复。
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(crate) enum BackendOperationEffect {
    Pending,
    NoOp,
    Unsupported,
}

impl BackendOperationEffect {
    pub(crate) fn code(self) -> &'static str {
        match self {
            Self::Pending => "pending",
            Self::NoOp => "no_op",
            Self::Unsupported => "unsupported",
        }
    }

    pub(crate) fn restored(self) -> bool {
        false
    }
}

/// 中文职责说明：repository 边界探针只记录是否经过仓储入口，不暴露本机路径。
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(crate) struct BackendBoundaryProbe {
    repository_checked: bool,
    repository_path_known: bool,
    platform_checked: bool,
    core_checked: bool,
}

impl BackendBoundaryProbe {
    pub(crate) fn unchecked() -> Self {
        Self {
            repository_checked: false,
            repository_path_known: false,
            platform_checked: false,
            core_checked: false,
        }
    }

    pub(crate) fn from_repository_source(source_path: String) -> Self {
        Self {
            repository_checked: true,
            repository_path_known: !source_path.trim().is_empty(),
            platform_checked: false,
            core_checked: false,
        }
    }

    fn with_core_checked(mut self) -> Self {
        self.core_checked = true;
        self
    }

    pub(crate) fn repository_checked(self) -> bool {
        self.repository_checked
    }

    pub(crate) fn repository_path_known(self) -> bool {
        self.repository_path_known
    }

    pub(crate) fn platform_checked(self) -> bool {
        self.platform_checked
    }

    pub(crate) fn core_checked(self) -> bool {
        self.core_checked
    }
}

/// 中文职责说明：core 层操作计划承接 usecase 校验后的意图，后续真实实现只能沿该计划扩展。
#[derive(Debug, Clone, PartialEq, Eq)]
pub(crate) struct BackendOperationPlan {
    module: &'static str,
    command: &'static str,
    effect: BackendOperationEffect,
    boundary: BackendBoundaryProbe,
}

impl BackendOperationPlan {
    pub(crate) fn pending(
        module: &'static str,
        command: &'static str,
        boundary: BackendBoundaryProbe,
    ) -> Self {
        Self::new(module, command, BackendOperationEffect::Pending, boundary)
    }

    pub(crate) fn no_op(
        module: &'static str,
        command: &'static str,
        boundary: BackendBoundaryProbe,
    ) -> Self {
        Self::new(module, command, BackendOperationEffect::NoOp, boundary)
    }

    pub(crate) fn unsupported(
        module: &'static str,
        command: &'static str,
        boundary: BackendBoundaryProbe,
    ) -> Self {
        Self::new(
            module,
            command,
            BackendOperationEffect::Unsupported,
            boundary,
        )
    }

    pub(crate) fn module(&self) -> &'static str {
        self.module
    }

    pub(crate) fn command(&self) -> &'static str {
        self.command
    }

    pub(crate) fn effect(&self) -> BackendOperationEffect {
        self.effect
    }

    pub(crate) fn boundary(&self) -> BackendBoundaryProbe {
        self.boundary
    }

    pub(crate) fn note(&self) -> &'static str {
        match self.effect {
            BackendOperationEffect::Pending => "后端业务实现由后续 PR 在当前边界内补齐",
            BackendOperationEffect::NoOp => {
                "当前命令只完成输入校验和边界编排，未执行文件、进程或系统副作用"
            }
            BackendOperationEffect::Unsupported => "当前命令缺少仓库内证据，保留契约并拒绝伪实现",
        }
    }

    fn new(
        module: &'static str,
        command: &'static str,
        effect: BackendOperationEffect,
        boundary: BackendBoundaryProbe,
    ) -> Self {
        Self {
            module,
            command,
            effect,
            boundary: boundary.with_core_checked(),
        }
    }
}
