Ultracite — Type-Safe, Accessible, and AI-Optimized Code Quality Framework
Ultracite delivers lightning-fast, zero-configuration code linting and formatting for modern JavaScript and TypeScript projects. It enforces strict type safety, accessibility standards, and consistent project-wide code quality powered by Biome’s high-performance formatting and linting engine.

⚡ Overview
Ultracite ensures that every line of code in your project adheres to enterprise-grade standards — from accessibility compliance to type safety and consistent style enforcement.

Key Highlights

Zero configuration out of the box

Subsecond linting and formatting performance

Maximum type safety across your codebase

AI-friendly and deterministic code generation

🧭 Before You Write Code
To maintain consistency and quality:

Review existing patterns in the codebase.

Account for edge cases and potential error scenarios.

Follow the enforced rules strictly.

Validate accessibility and ARIA compliance for all UI components.

♿ Accessibility (a11y) Standards
Ultracite enforces WCAG and ARIA best practices to ensure inclusive, accessible UIs.

Key Accessibility Guidelines:

Avoid using accessKey, <marquee>, or <blink>.

Don’t hide focusable elements with aria-hidden="true".

Use ARIA roles, props, and states only where supported.

Always include lang on <html>, title on <iframe> and <svg>.

Ensure all form labels, anchors, and alt attributes are screen-reader friendly.

Always include caption tracks for media.

Use semantic, keyboard-navigable HTML by default.

🧩 Code Quality and Complexity Rules
Maintain predictable, optimized, and maintainable code by following these quality standards.

Highlights:

Avoid unnecessary constructs: arguments, void, continue, or nested ternaries.

Use for...of instead of Array.forEach().

Prevent unused imports, variables, and unreachable code.

No any, no implicit types, no non-null assertions.

Replace manual Object.assign() calls with object spread.

Keep class and function definitions simple, focused, and well-typed.

Always validate performance and cognitive complexity levels.

⚛ React & JSX Best Practices
Ultracite ensures every React component follows predictable, modern patterns:

Hooks must be declared at the top level and have correct dependencies.

Always provide a unique key in list renders.

Avoid defining components inside other components.

Never use index as React key.

Prefer <>...</> over <Fragment>.

Avoid using both dangerouslySetInnerHTML and children.

Ensure event handlers are declared on the correct element type.

🦺 Correctness and Safety
Code correctness and runtime reliability are strictly validated.

Examples:

No unreachable or dead code.

Always call super() in subclass constructors before this.

Prevent variable shadowing and unsafe reassignment.

No sensitive values (API keys, tokens) hardcoded.

Avoid duplicate or redundant function logic.

Ensure Promise, await, and async functions are correctly used.

No use of global __dirname or __filename.

Prevent cyclic imports and polyfill duplication.

🪶 TypeScript Best Practices
Type safety is at the core of Ultracite’s philosophy.

Guidelines:

No any, non-null assertions, or implicit types.

Use as const where applicable.

Prefer import type and export type.

Avoid namespaces and enums; use literal unions instead.

Don’t merge interfaces or misuse overloads.

Keep typings strict, simple, and self-documenting.

🎨 Style & Consistency Rules
Ultracite enforces clean, readable, and consistent code style across your entire codebase.

Core Conventions:

No var, eval(), debugger, or console calls.

Always use === and !==.

Prefer const over let for single-assigned variables.

Use meaningful names and explicit error handling.

Keep consistent brace styles and indentation.

Avoid unnecessary nesting or control structures.

Prefer template literals, arrow functions, and shorthand operators.

⚙️ Next.js Specific Guidelines
Never use <img> or <head> directly — use Next.js components.

Only import next/document inside pages/_document.jsx.

Don’t use next/head inside _document.js.

This ensures full SSR compatibility and optimal hydration performance.

🧪 Testing Best Practices
Maintain reliable, non-flaky tests:

No export or module.exports in tests.

No focused (.only) or disabled (.skip) tests.

All assertions must be inside it() or test() blocks.

🛠 Common CLI Tasks
Command	Description
npx ultracite init	Initialize Ultracite in your project.
npx ultracite fix	Automatically format and fix code.
npx ultracite check	Analyze code for violations without fixing.
🚨 Example: Error Handling
typescript
// ✅ Preferred pattern
try {
  const result = await fetchData();
  return { success: true, data: result };
} catch (error) {
  console.error('API call failed:', error);
  return { success: false, error: error.message };
}

// ❌ Avoid this
try {
  return await fetchData();
} catch (e) {
  console.log(e);
}
🧱 Philosophy
Ultracite exists to help teams build accessible, reliable, and type-safe software at scale — without sacrificing speed or developer experience.

Built for:
Modern engineering teams, AI-assisted workflows, and developers who value precision and performance.



## Example: Error Handling
```typescript
// ✅ Good: Comprehensive error handling
try {
  const result = await fetchData();
  return { success: true, data: result };
} catch (error) {
  console.error('API call failed:', error);
  return { success: false, error: error.message };
}

// ❌ Bad: Swallowing errors
try {
  return await fetchData();
} catch (e) {
  console.log(e);
}
```
