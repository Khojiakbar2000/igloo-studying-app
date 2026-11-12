# Social and widget architecture (later phase)

Keep the first prototype local. When social work begins, Supabase can provide identity, Postgres, Realtime presence, and private object storage without changing the local Pomodoro model.

## Suggested records

- `profiles`: public display name and avatar only.
- `friendships`: inviter, invitee, status (`pending`, `accepted`, `blocked`), timestamps. A room is visible only to accepted friends.
- `igloos`: owner and optional shared-room membership.
- `study_sessions`: owner, mode, planned duration, start/end timestamps, and completed focus seconds. Never expose unfinished sessions as completed progress.
- `room_presence`: short-lived Realtime presence state with room, user, and current mode; no durable location history.
- `photo_shares`: owner, private storage key, explicit audience, caption/reaction settings, and deletion timestamp.
- `reactions` and `shared_goals`: scoped to accepted friends or an explicitly shared igloo.

Use row-level security on every table and storage bucket. Photo reads require an accepted friendship and an active share record. Sharing starts off; each upload shows its audience before sending, and the owner can revoke a share and delete the object. Keep authentication identifiers and storage keys out of public profile records.

## Widgets

Widgets should show a compact snapshot: the penguin illustration, igloo progress, today's focus minutes, and optionally a friend-approved photo. The app writes a small, privacy-filtered snapshot to an iOS App Group or Android app-widget storage and asks the platform to refresh it after meaningful changes.

Do not run the Rive scene in a home-screen widget. iOS WidgetKit renders timeline entries and controls refresh timing; Android app widgets update through system-managed RemoteViews/Glance refreshes. Use a still image and scheduled or event-driven refreshes, with no promise of continuous animation or real-time presence. See [Apple WidgetKit timelines](https://developer.apple.com/documentation/widgetkit/keeping-a-widget-up-to-date) and [Android widget update guidance](https://developer.android.com/develop/ui/views/appwidgets/advanced).
