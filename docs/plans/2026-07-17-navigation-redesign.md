# Navigation Architecture Redesign

## Problem

Current navigation has 12 identified issues causing "business flow not smooth":
- No breadcrumbs anywhere in the app
- 9 meeting sub-pages are dead ends (no back to meeting)
- Root `/` is a blank page
- No logout button
- No guest profile link from meeting context
- No cross-links between sibling sub-pages

## Design Decisions

1. **Meeting sub-pages use tab-based navigation** — horizontal tabs at top of every meeting page (details/guests/agenda/reception/transport/lodging/catering/gifts/companions/fees), click to switch directly
2. **Guest in meeting context** — side panel shows tasks + "view full profile" link to global page
3. **Root path redirect** — `/` redirects to `/dashboard` (authed) or `/login`
4. **Logout button** in sidebar user section
5. **Breadcrumbs** for non-meeting pages (guest detail, vehicles, hotels)

## Implementation

### New Components

- `components/layout/MeetingTabs.tsx` — tab bar for meeting context
- `components/layout/Breadcrumbs.tsx` — breadcrumb trail

### Files Modified

- 9 meeting sub-page `page.tsx` files — add `<MeetingTabs>`
- `app/page.tsx` — redirect to dashboard/login
- `components/layout/StaffLayout.tsx` — add logout button
- `app/(staff)/meetings/[id]/guests/GuestManager.tsx` — Sheet adds profile link
- `app/(staff)/guests/[id]/page.tsx` — add breadcrumbs
