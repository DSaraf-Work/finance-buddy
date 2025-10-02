# Generation Guide

1) Generate TypeScript DTOs from `openapi/finance-buddy-openapi.yaml` into:
   - `packages/shared/src/dto/`

2) Generate API route handlers (empty stubs) into:
   - `apps/web/src/pages/api/` matching OpenAPI paths

3) Ensure default field values & status codes match OpenAPI.

4) Do not implement business logic in stubs. Logic lands in later commits.
