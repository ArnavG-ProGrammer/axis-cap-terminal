# Authentication Information

AXIS CAP utilizes **Supabase** for secure backend authentication. 

## Registration and Sign In
Users and API Clients must authenticate via the `/login` portal which interfaces securely with our Supabase Authentication instance.

## Identity Providers
Currently, the platform supports standard Email & Password registration natively.

## Agents & Automation
At this time, there is no direct Server-to-Server or Agent OAuth scope exposed for the core financial ledger features. Access tokens are generated solely via user-driven actions in the browser client.
