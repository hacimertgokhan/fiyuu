// Template utilities — compose, clientData, raw, unsafeHtml are new additions
// Note: html, defineComponent, when, ComponentProps live in intent.ts
export { compose, clientData, raw, unsafeHtml, escapeHtml, RawHtml } from "./template.js";

// Core contracts (excluding definePage/defineLayout/defineAction - see intent.js)
export * from "./contracts.js";
export * from "./artifacts.js";
export * from "./config.js";
export * from "./generator.js";
export * from "./media.js";
export * from "./responsive.js";
export * from "./responsive-wrapper.js";
export * from "./scanner.js";
export * from "./state.js";
// export * from "./virtual.js"; // TODO: Create virtual.ts or remove this export
export * from "./reactive.js";
export * from "./providers.js";
export * from "./errors.js";

// Intent-based programming (defines definePage, defineLayout, defineAction, defineApi, defineComponent)
export * from "./intent.js";

// Decorators & DI
export * from "./decorators/index.js";

// HTTP Exceptions
export * from "./exceptions/http.js";
