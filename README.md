# Courier Inbox — markdown in a custom list item

A one-file React app: a full-screen `<CourierInbox>` whose rows are rendered by a
custom list item that treats each message's `title` and `preview` as markdown.
Everything is in [`src/main.tsx`](src/main.tsx).

Upgrading to the latest `markdown-to-jsx` (`^9`) solves the `snake_case` problem.
CommonMark says an underscore can't open or close emphasis inside a word, which is
what keeps identifiers intact — older versions didn't implement that rule, so a
value like `orders_table_` rendered as "orders" + *table* + "_". On the current
version you get working italics *and* untouched identifiers, with no escaping and
no inspecting the message payload.

## Run it

```bash
npm install
npm run dev
```

Then open the URL Vite prints. No config and no `.env` — the demo user and a
user-scoped JWT are hardcoded at the top of [`src/main.tsx`](src/main.tsx), and the
inbox already has messages in it. Click any row to see the full message object.

The JWT expires **2026-11-12**. Hardcoding it is deliberate so this runs on clone,
and it is not how to ship: mint the JWT on your backend instead, and never put a
Courier API key in client code.

## Other scripts

```bash
npm run build      # typecheck + production build
npm run preview    # serve the build
```
