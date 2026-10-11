# Web checkpoint 34 — Interview page: "Load more" paging

`src/app/(platform)/interview/page.tsx` requested one page of 30 questions and ignored
the `total` returned by the API, so anything past the first 30 was unreachable. With the
bank now at 83 questions (FE 42, BE 41) that hid 12 FE questions and 53 under "All".

- Q&A list uses `useInfiniteQuery` (page size 30, within the API's 50 cap) with a
  "Load more questions" button and a "Showing X of Y" line.
- Random order stays a single page ("Showing N random questions"): the server
  re-shuffles each request, so pages would repeat items.
- Needs the backend fix in api checkpoint 48 (list cache keys now include `limit`);
  without it, mixed page sizes can skip items.

Verified: `tsc --noEmit` clean, `next build` passes, and the paging rule was replayed
against the live API (FE 42, BE 41, All 83, all unique). Not rendered in a browser.
