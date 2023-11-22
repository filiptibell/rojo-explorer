use anyhow::{Context, Result};
use rbx_dom_weak::{types::Ref, Instance};
use serde::{Deserialize, Serialize};

use crate::server::{dom::Dom, rpc::RpcMessage};

#[derive(Debug, Clone, Serialize)]
pub(super) struct ResponseInstance {
    id: Ref,
    class_name: String,
    name: String,
    children: Vec<Ref>,
}

impl ResponseInstance {
    fn from_dom_instance(inst: &Instance) -> Self {
        Self {
            id: inst.referent(),
            class_name: inst.class.to_owned(),
            name: inst.name.to_owned(),
            children: inst.children().to_vec(),
        }
    }
}

#[derive(Debug, Clone, Deserialize)]
pub(super) struct RootRequest {}

impl RootRequest {
    pub async fn respond_to(self, msg: RpcMessage, dom: &mut Dom) -> Result<RpcMessage> {
        let instance = dom
            .get_root_instance()
            .map(ResponseInstance::from_dom_instance);
        msg.respond()
            .with_data(instance)
            .context("failed to serialize response")
    }
}

#[derive(Debug, Clone, Deserialize)]
pub(super) struct GetRequest {
    id: Ref,
}

impl GetRequest {
    pub async fn respond_to(self, msg: RpcMessage, dom: &mut Dom) -> Result<RpcMessage> {
        let instance = dom
            .get_instance(self.id)
            .map(ResponseInstance::from_dom_instance);
        msg.respond()
            .with_data(instance)
            .context("failed to serialize response")
    }
}

#[derive(Debug, Clone, Deserialize)]
pub(super) struct ChildrenRequest {
    id: Ref,
}

impl ChildrenRequest {
    pub async fn respond_to(self, msg: RpcMessage, dom: &mut Dom) -> Result<RpcMessage> {
        let child_ids = dom
            .get_instance(self.id)
            .map(|inst| inst.children())
            .unwrap_or_default();
        let instances = child_ids
            .iter()
            .filter_map(|id| dom.get_instance(*id))
            .map(ResponseInstance::from_dom_instance)
            .collect::<Vec<_>>();
        msg.respond()
            .with_data(instances)
            .context("failed to serialize response")
    }
}
