export type IpcJsonPrimitive = string | number | boolean | null;

export type IpcJsonValue = IpcJsonPrimitive | IpcJsonObject | IpcJsonValue[];

export interface IpcJsonObject {
  [key: string]: IpcJsonValue | undefined;
}

export type IpcArgValue = IpcJsonValue | undefined;

export type IpcArgs = Record<string, IpcArgValue>;

export type IpcEvidencePayload = IpcJsonValue;

export type IpcEmptyPayload = Record<string, never>;
