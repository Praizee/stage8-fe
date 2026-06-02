// Syntax highlighter — produces HTML strings with <span> tokens
// Safe: all input is escaped before patterns are applied

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// ─── Token colours (Tailwind-compatible inline style strings) ────────────────
const C = {
  keyword:    "color:var(--color-primary)",
  string:     "color:oklch(0.7 0.18 160)",   // emerald
  number:     "color:oklch(0.78 0.18 60)",   // amber
  operator:   "color:oklch(0.72 0.2 293)",   // violet
  comment:    "color:var(--color-muted-foreground);font-style:italic",
  mongo_op:   "color:oklch(0.72 0.2 293)",   // violet – $operators
  gql_op:     "color:oklch(0.72 0.2 293)",   // violet – _operators
  punctuation:"color:var(--color-muted-foreground)",
  plain:      "",
} as const;

function span(style: string, text: string): string {
  return style ? `<span style="${style}">${text}</span>` : text;
}

// ─── Generic tokenizer ───────────────────────────────────────────────────────

type RawToken = [style: string, text: string];

function applyTokens(raw: string, regex: RegExp, resolve: (match: RegExpExecArray) => RawToken | null): RawToken[] {
  const tokens: RawToken[] = [];
  let lastIndex = 0;
  let m: RegExpExecArray | null;
  regex.lastIndex = 0;
  while ((m = regex.exec(raw)) !== null) {
    if (m.index > lastIndex) tokens.push([C.plain, raw.slice(lastIndex, m.index)]);
    const tok = resolve(m);
    if (tok) tokens.push(tok);
    else tokens.push([C.plain, m[0]]);
    lastIndex = m.index + m[0].length;
  }
  if (lastIndex < raw.length) tokens.push([C.plain, raw.slice(lastIndex)]);
  return tokens;
}

function render(tokens: RawToken[]): string {
  return tokens.map(([style, text]) => span(style, text)).join("");
}

// ─── SQL ─────────────────────────────────────────────────────────────────────

const SQL_KEYWORDS = /\b(SELECT|FROM|WHERE|AND|OR|IN|NOT|BETWEEN|LIKE|REGEXP|IS|NULL|TRUE|FALSE|DISTINCT|ORDER|BY|LIMIT|ASC|DESC|AS)\b/gi;
const SQL_REGEX = /(--[^\n]*)|(\/\*[\s\S]*?\*\/)|(')((?:[^'\\]|\\.)*)(')|([=!<>]+)|\b(\d+(?:\.\d+)?)\b/g;

export function highlightSQL(raw: string): string {
  const escaped = escapeHtml(raw);
  const tokens = applyTokens(escaped, SQL_REGEX, (m) => {
    if (m[1]) return [C.comment, m[1]];            // -- comment
    if (m[2]) return [C.comment, m[2]];            // /* comment */
    if (m[3]) return [C.string, m[3] + m[4] + m[5]]; // 'string'
    if (m[6]) return [C.operator, m[6]];           // = != < > >=
    if (m[7]) return [C.number, m[7]];             // numbers
    return null;
  });

  // Second pass: highlight keywords within plain tokens
  return render(
    tokens.flatMap(([style, text]) => {
      if (style !== C.plain) return [[style, text] as RawToken];
      const kws: RawToken[] = [];
      let last = 0;
      let km: RegExpExecArray | null;
      SQL_KEYWORDS.lastIndex = 0;
      while ((km = SQL_KEYWORDS.exec(text)) !== null) {
        if (km.index > last) kws.push([C.plain, text.slice(last, km.index)]);
        kws.push([C.keyword, km[0]]);
        last = km.index + km[0].length;
      }
      if (last < text.length) kws.push([C.plain, text.slice(last)]);
      return kws.length ? kws : [[C.plain, text] as RawToken];
    })
  );
}

// ─── MongoDB (JSON with $operator highlighting) ───────────────────────────────

const MONGO_REGEX = /("(?:[^"\\]|\\.)*")(\s*:)?|(\b(?:true|false|null)\b)|\b(\d+(?:\.\d+)?)\b/g;

export function highlightMongoDB(raw: string): string {
  const escaped = escapeHtml(raw);
  return render(
    applyTokens(escaped, MONGO_REGEX, (m) => {
      if (m[1]) {
        const key = m[1];
        const isOp = key.startsWith('"$');
        const colon = m[2] ?? "";
        // Key with colon
        if (colon) return [isOp ? C.mongo_op : C.string, key + colon];
        // Value string
        return [C.string, key];
      }
      if (m[3]) return [C.keyword, m[3]];
      if (m[4]) return [C.number, m[4]];
      return null;
    })
  );
}

// ─── GraphQL ─────────────────────────────────────────────────────────────────

const GQL_KEYWORDS = /\b(query|mutation|subscription|fragment|on|where|filter)\b/gi;
const GQL_REGEX = /("(?:[^"\\]|\\.)*")|(#[^\n]*)|(_[a-z]+\b)|\b(\d+(?:\.\d+)?)\b|(true|false|null)/g;

export function highlightGraphQL(raw: string): string {
  const escaped = escapeHtml(raw);
  const tokens = applyTokens(escaped, GQL_REGEX, (m) => {
    if (m[1]) return [C.string, m[1]];
    if (m[2]) return [C.comment, m[2]];
    if (m[3]) return [C.gql_op, m[3]];   // _eq _and _gt etc
    if (m[4]) return [C.number, m[4]];
    if (m[5]) return [C.keyword, m[5]];
    return null;
  });
  return render(
    tokens.flatMap(([style, text]) => {
      if (style !== C.plain) return [[style, text] as RawToken];
      const kws: RawToken[] = [];
      let last = 0; let km: RegExpExecArray | null;
      GQL_KEYWORDS.lastIndex = 0;
      while ((km = GQL_KEYWORDS.exec(text)) !== null) {
        if (km.index > last) kws.push([C.plain, text.slice(last, km.index)]);
        kws.push([C.keyword, km[0]]);
        last = km.index + km[0].length;
      }
      if (last < text.length) kws.push([C.plain, text.slice(last)]);
      return kws.length ? kws : [[C.plain, text] as RawToken];
    })
  );
}

export function highlight(code: string, lang: "sql" | "mongodb" | "graphql"): string {
  if (lang === "sql") return highlightSQL(code);
  if (lang === "mongodb") return highlightMongoDB(code);
  return highlightGraphQL(code);
}
