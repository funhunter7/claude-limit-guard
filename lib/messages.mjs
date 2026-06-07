// Thin re-export: the message catalog now lives in ./messages/ as per-language modules.
// Existing imports of `getMessages` from './messages.mjs' keep working unchanged.
export { getMessages } from './messages/index.mjs';
