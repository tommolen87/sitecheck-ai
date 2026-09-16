---
name: Generated client typecheck
description: TypeScript lib settings needed by the generated fetch client
---

The generated API client uses `Headers.entries()`, so the client library TypeScript `lib` must include both `dom` and `dom.iterable`.

**Why:** The OpenAPI code generator emits a header-normalization helper that relies on iterable DOM header types; `dom` alone causes a library typecheck failure.

**How to apply:** When regenerating the shared API client in this workspace, preserve `dom.iterable` in `lib/api-client-react/tsconfig.json`.