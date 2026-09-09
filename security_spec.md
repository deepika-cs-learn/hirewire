# Security Spec: AI Interviewer

## 1. Data Invariants
- An `InterviewSession` document in `/sessions/{sessionId}` must always be associated with a valid authenticated user (`userId == request.auth.uid`).
- Only the creator of a session can read or write to their own session document (`resource.data.userId == request.auth.uid`).
- Unauthenticated users cannot list, read, create, or update any session documents.
- User ID and Creation timestamp are immutable after creation.
- Document IDs must conform to alphanumeric constraints with max length <= 128 chars.

## 2. The Dirty Dozen Attack Payloads
1. **Unauthenticated Read**: GET `/sessions/sess_123` with `request.auth == null` -> DENIED.
2. **Unauthenticated Create**: POST `/sessions/sess_123` with `request.auth == null` -> DENIED.
3. **Cross-User Snooping**: GET `/sessions/sess_other_user` where `resource.data.userId != request.auth.uid` -> DENIED.
4. **Cross-User Listing**: LIST `/sessions` without filtering `userId == request.auth.uid` -> DENIED.
5. **Identity Spoofing on Create**: POST `/sessions/sess_1` with `incoming().userId = 'victim_uid'` -> DENIED.
6. **Hijack Session Ownership**: UPDATE `/sessions/sess_1` attempting to change `userId` to attacker's UID -> DENIED.
7. **Junk ID Injection**: Create document with 5000 character ID -> DENIED via `isValidId()`.
8. **Malicious Oversized Payload**: Storing 50MB string payload in code or transcript -> DENIED via size restrictions.
9. **Tampering with Terminal Evaluated Session**: Overwriting an already evaluated session with fabricated score -> DENIED.
10. **Blanket Collection Scraping**: Listing `/sessions` with no user constraint -> DENIED.
11. **Shadow Field Injection**: Writing unauthorized admin flags like `{ isAdmin: true }` -> DENIED.
12. **Malformed Types**: Writing boolean into `durationMinutes` or integer into `code` -> DENIED.
