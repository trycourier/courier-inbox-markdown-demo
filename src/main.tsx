import { useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import Markdown from 'markdown-to-jsx';
import sanitizeHtml from 'sanitize-html';
import {
  CourierInbox,
  useCourier,
  type CourierInboxListItemFactoryProps,
} from '@trycourier/courier-react';

/**
 * Demo credentials, hardcoded so this runs straight after `npm install` with no
 * setup. The JWT is user-scoped to the inbox and expires 2026-11-12.
 *
 * This is fine for a throwaway demo and wrong for production: a JWT in the bundle
 * is readable by anyone who loads the page. In a real app, mint it on your backend
 * and refresh it there — and never put a Courier API key in client code, which
 * could send messages and issue tokens for the whole workspace.
 */
const USER_ID = 'markdown-demo';
const JWT =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzY29wZSI6InVzZXJfaWQ6bWFya2Rvd24tZGVtbyByZWFkOm1lc3NhZ2VzIGluYm94OnJlYWQ6bWVzc2FnZXMgaW5ib3g6d3JpdGU6ZXZlbnRzIiwidGVuYW50X3Njb3BlIjoicHVibGlzaGVkL2Vudl8wMW0wMHN5YzVwZnpzdG5zZXZyMTllZjlnZSIsInRlbmFudF9pZCI6Indya18wMW0wMHN5YjBrZnFlYTRkdDI0d2NycWI5ei9lbnZfMDFtMDBzeWM1cGZ6c3Ruc2V2cjE5ZWY5Z2UiLCJpYXQiOjE3ODY3MzUyMDYsImV4cCI6MTc5NDUxMTIwNiwianRpIjoiMzk1Mjc3ZGMtNWM4OS00OTJmLThkMjEtMTY0Yzk5OTNlMDVkIn0.a8YI_yes8LKcdXj8XVOwzF837hbCRoNK_aBiROnAzkA';

/**
 * Sanitize options for a one-line inbox field.
 *
 * Not optional: the Courier API stores and returns `title`/`preview` verbatim, so
 * a <script> tag in message content arrives at the browser intact. Whatever
 * renders these fields is responsible for cleaning them.
 */
const sanitizeOptions: sanitizeHtml.IOptions = {
  allowedTags: ['a', 'b', 'strong', 'i', 'em', 'code', 'br', 's', 'del'],
  // target/rel must be allowed here too, or the transform below is undone.
  allowedAttributes: { a: ['href', 'title', 'target', 'rel'] },
  allowedSchemes: ['http', 'https', 'mailto'],
  transformTags: {
    a: sanitizeHtml.simpleTransform('a', { target: '_blank', rel: 'noopener noreferrer' }),
  },
};

/**
 * markdown-to-jsx options.
 *
 * `forceInline` keeps a one-line string out of a block <p> and collapses every
 * block construct (headings, lists, tables, hr) to plain text — which leaves <a>
 * and <img> as the only tags markdown can still emit. Both need constraining
 * *here* rather than in sanitizeOptions, because sanitizeHtml runs first and so
 * only governs HTML that was already in the string; anything markdown itself
 * generates never reaches that allowlist.
 */
const markdownOptions = {
  forceInline: true,
  overrides: {
    a: { props: { target: '_blank', rel: 'noopener noreferrer' } },
    // `![alt](src)` would otherwise render an <img> even though `img` is not
    // allowed, turning message content into an arbitrary remote request.
    img: () => null,
  },
};

/**
 * Renders one inbox field as markdown: sanitize the raw string, then let
 * markdown-to-jsx turn the surviving markdown into React elements. The output is
 * real JSX, so there is no `dangerouslySetInnerHTML` in this path.
 *
 * Requires markdown-to-jsx >= 8, which implements CommonMark's intraword
 * emphasis rule — below that, an interpolated value like `orders_table_` renders
 * as "orders" + italic "table" + "_".
 */
function MarkdownField({ text }: { text: string }) {
  return <Markdown options={markdownOptions}>{sanitizeHtml(text, sanitizeOptions)}</Markdown>;
}

/**
 * The custom list item. The inbox's built-in item deliberately does not apply
 * markdown emphasis — it only makes links clickable — so rendering markdown
 * means supplying your own item through `renderListItem`.
 */
function MarkdownInboxItem({ message }: CourierInboxListItemFactoryProps) {
  const unread = !message.read;

  // Clicking a row shows the whole message object, which is the easiest way to
  // see the raw `title`/`preview` strings next to what the markdown renders.
  const show = () => alert(JSON.stringify(message, null, 2));

  const onClick = (event: React.MouseEvent<HTMLDivElement>) => {
    // A link inside the title/preview should navigate, not open the alert.
    if ((event.target as HTMLElement).closest('a')) return;
    show();
  };

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={`Show ${message.title ?? 'message'}`}
      onClick={onClick}
      onKeyDown={(event) => {
        if (event.key !== 'Enter' && event.key !== ' ') return;
        event.preventDefault();
        show();
      }}
      style={{
        display: 'flex',
        gap: 10,
        padding: '14px 16px',
        borderBottom: '1px solid #e0e0e0',
        fontSize: 14,
        lineHeight: 1.4,
        cursor: 'pointer',
      }}
    >
      <span
        aria-hidden
        style={{
          width: 8,
          height: 8,
          marginTop: 5,
          flexShrink: 0,
          borderRadius: '50%',
          background: unread ? '#2f6df6' : 'transparent',
        }}
      />
      <div style={{ minWidth: 0 }}>
        {message.title && (
          <div style={{ fontWeight: unread ? 600 : 500, marginBottom: 2 }}>
            <MarkdownField text={message.title} />
          </div>
        )}
        {message.preview && (
          <div style={{ color: '#555' }}>
            <MarkdownField text={message.preview} />
          </div>
        )}
      </div>
    </div>
  );
}

function App() {
  const courier = useCourier();

  useEffect(() => {
    // No apiUrls override: the SDK already points at Courier production.
    courier.shared.signIn({ userId: USER_ID, jwt: JWT });
  }, []);

  return (
    <main style={{ height: '100%', fontFamily: 'system-ui, sans-serif' }}>
      <CourierInbox
        renderListItem={(props: CourierInboxListItemFactoryProps | null | undefined) =>
          props ? <MarkdownInboxItem {...props} /> : <></>
        }
      />
    </main>
  );
}

createRoot(document.getElementById('root')!).render(<App />);
