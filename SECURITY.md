# Security

For a suspected vulnerability, use the repository's private vulnerability reporting
feature when available; do not disclose exploit details or customer data in a public
issue. If private reporting is unavailable, ask the maintainer for a private channel
without including sensitive details.

The package is currently an unreleased alpha. Track Django security updates and pin
supported patch versions in deployments. Follow least privilege when assigning group
templates. Audit history stores plaintext before/after values in the application DB;
protect database access/backups and choose an appropriate retention period.

Formula expressions have no host-language execution facilities. UI values are rendered
as text. Mutations use CSRF and server-side field/row checks. External application
hooks and background context restoration are part of the integrating project's trust boundary.
