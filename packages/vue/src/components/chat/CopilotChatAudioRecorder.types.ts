/** Finite-state machine for the recorder. Mirrors the React type. */
export type AudioRecorderState = "idle" | "recording" | "processing";

/** Input mode for CopilotChatInput. Mirrors React CopilotChatInputMode. */
export type CopilotChatInputMode = "input" | "transcribe" | "processing";
