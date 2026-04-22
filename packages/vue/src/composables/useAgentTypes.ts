// Re-export enum so it can be imported from the composable without
// a circular dependency on useAgent.ts.
export enum UseAgentUpdate {
  OnMessagesChanged = "OnMessagesChanged",
  OnStateChanged = "OnStateChanged",
  OnRunStatusChanged = "OnRunStatusChanged",
}
