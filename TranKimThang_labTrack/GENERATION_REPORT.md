# Generation coverage report

No verified domain template matched. A conservative schema/CRUD baseline was generated with standard Authentication/RBAC support.

- Models parsed: 8
- APIs parsed: 9
- Authentication requested: True
- Roles found: auditor, manager

## Manual review required
- POST /auth/register: no model mapping
- POST /auth/login: no model mapping
- PATCH /samples/:id/complete: generated CRUD baseline; business rule needs a verified domain module
- GET /reports/sample-turnaround: no model mapping
- GET /reports/reagent-usage: no model mapping
- Payment calculation detected; formula must be verified.
- Atomic multi-document writes detected; MongoDB transaction design must be verified.
