# Next Runtime Migration

The legacy Next lesson records are migrated by slug in `devcraft-api` as follows:

| Slug | Runtime | Reason |
| --- | --- | --- |
| `nextjs-app-router-routing` | `next-lab` | File conventions and client-side navigation fit the constrained browser runtime. |
| `nextjs-server-client-components` | `next-lab` | Component boundary teaching can run with React client interactivity. |
| `nextjs-caching-revalidation` | `next-server` | Cache invalidation needs a real Next server and cannot be truthfully simulated in the browser. |

The `next-server` profile remains blocked on the disposable multi-file server executor. It must not be switched to a browser runtime.
