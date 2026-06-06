/**
 * 中文职责说明：定义前端 IPC 边界可传输的 JSON 骨架；无证据字段只能保持结构化 JSON，不伪造业务 DTO。
 */
export type IpcJsonPrimitive = string | number | boolean | null;

export type IpcJsonValue = IpcJsonPrimitive | IpcJsonObject | IpcJsonValue[];

export interface IpcJsonObject {
  [key: string]: IpcJsonValue | undefined;
}

export type IpcArgValue = IpcJsonValue | undefined;

export type IpcArgs = Record<string, IpcArgValue>;

export type IpcEvidencePayload = IpcJsonValue;

export type IpcEmptyPayload = Record<string, never>;
