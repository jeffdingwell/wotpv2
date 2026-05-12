# Security Specification - Words of the Prophets

## Data Invariants
1. A lyric cannot be created without a valid `userId` matching the authenticated user.
2. A comment must reference an existing `lyricId`.
3. `createdAt` must be set to `request.time` server-side and remain immutable.
4. `updatedAt` must be updated on every modification to a lyric.
5. All IDs must be correctly formatted strings to prevent poisoning.
6. Admin role is strictly restricted to `jeff@bolddesign.ca`.

## The "Dirty Dozen" Payloads (Deny Targets)
1. **Unauthorized Create**: Create a lyric while not signed in.
2. **Identity Spoofing**: Signed-in user 'A' creates a lyric with `userId` set to 'B'.
3. **Ghost Field Injection**: Add a hidden `isVerified: true` field to a lyric document.
4. **ID Poisoning**: Attempt to create a comment with a 1MB junk string as `lyricId`.
5. **Timestamp Manipulation**: Set `createdAt` to a date in the past.
6. **Immutable Field Attack**: Attempt to change `userId` on an existing lyric.
7. **Privilege Escalation**: Attempt to delete another user's lyric without being the admin.
8. **PII Scraping**: Attempt to read the entire `lyrics` collection without verification (though app allows public read, we should ensure no hidden sensitive data).
9. **Status Shortcutting**: (Not applicable here as there are no outcome states, but we'll guard against shadow updates).
10. **Shadow Update**: Update a lyric and try to change `createdAt`.
11. **Resource Exhaustion**: Send a 2MB string for the `text` field.
12. **Recursive Cost Attack**: (Guard by ordering logic auth -> static -> dynamic).

## Security Matrix

| Collection | Create | Read (Get/List) | Update | Delete |
|------------|--------|-----------------|--------|--------|
| lyrics     | Verified + Owner | Public | Verified + Owner/Admin | Verified + Owner/Admin |
| comments   | Verified + Owner | Public | N/A (Locked) | Verified + Owner/Admin |
