use crate::core::error::CoreError;
use std::collections::HashSet;
use std::sync::{Arc, Mutex};

#[derive(Clone, Default)]
pub(crate) struct SingleFlight {
    active: Arc<Mutex<HashSet<String>>>,
}

impl SingleFlight {
    pub(crate) fn begin(&self, key: &str) -> Result<SingleFlightPermit, CoreError> {
        let mut active = self
            .active
            .lock()
            .map_err(|_| CoreError::runtime("single_flight_lock", "运行状态锁不可用。"))?;
        if !active.insert(key.to_owned()) {
            return Err(CoreError::runtime(
                "single_flight_busy",
                "同一后台任务已经在执行。",
            ));
        }
        Ok(SingleFlightPermit {
            key: key.to_owned(),
            active: self.active.clone(),
        })
    }
}

pub(crate) struct SingleFlightPermit {
    key: String,
    active: Arc<Mutex<HashSet<String>>>,
}

impl Drop for SingleFlightPermit {
    fn drop(&mut self) {
        if let Ok(mut active) = self.active.lock() {
            active.remove(&self.key);
        }
    }
}
