// Small helpers shared by the student and instructor experiment pages.

/** True for a video file the browser can play directly: one served by the app ("/videos/…") or a link to .mp4/.webm/.ogg. */
export function isVideoFile(url) {
  if (!url) return false;
  if (url.startsWith("/")) return true;
  try {
    return /\.(mp4|webm|ogg)$/i.test(new URL(url).pathname);
  } catch {
    return false;
  }
}

export function toEmbedUrl(url) {
  try {
    const u = new URL(url);
    if (u.hostname.includes("youtube.com")) {
      const videoId = u.searchParams.get("v");
      if (videoId) return `https://www.youtube.com/embed/${videoId}`;
    }
    if (u.hostname === "youtu.be") return `https://www.youtube.com/embed${u.pathname}`;
  } catch { /* use the supplied URL as a fallback */ }
  return url;
}

export function simpleMarkdown(text) {
  const escaped = String(text || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\r\n/g, "\n");
  // Inline code is kept verbatim; elsewhere **bold**, *italic* and bare http(s) links
  // (opened in a new tab; trailing punctuation such as "." stays outside the link).
  const linkify = (s) =>
    s.replace(/\bhttps?:\/\/[^\s<]*[^\s<.,;:!?)]/g, (url) =>
      `<a href="${url.replace(/"/g, "&quot;")}" target="_blank" rel="noopener noreferrer">${url}</a>`);
  const inline = (s) =>
    s
      .split(/(`[^`]+`)/)
      .map((part) =>
        part.length > 1 && part.startsWith("`") && part.endsWith("`")
          ? `<code>${part.slice(1, -1)}</code>`
          : linkify(
              part
                .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
                .replace(/\*(.+?)\*/g, "<em>$1</em>"),
            ),
      )
      .join("");

  // Blocks are separated by blank lines. Inside a block: headings stand alone, "1." / "-" lines become a list,
  // other lines form a paragraph (single line breaks kept). No stray <br> around headings or lists.
  const out = [];
  for (const block of escaped.split(/\n\s*\n/)) {
    let para = [];
    let list = null;
    const flushPara = () => {
      if (para.length) out.push(`<p>${para.map(inline).join("<br>")}</p>`);
      para = [];
    };
    const flushList = () => {
      if (list) out.push(`<${list.tag}>${list.items.map((item) => `<li>${inline(item)}</li>`).join("")}</${list.tag}>`);
      list = null;
    };
    for (const raw of block.split("\n")) {
      const line = raw.trim();
      if (!line) continue;
      const heading = line.match(/^(#{1,3}) (.+)$/);
      const ordered = line.match(/^\d+[.)] (.+)$/);
      const bullet = line.match(/^[-*] (.+)$/);
      if (heading) {
        flushPara();
        flushList();
        const level = heading[1].length;
        out.push(`<h${level}>${inline(heading[2])}</h${level}>`);
      } else if (ordered || bullet) {
        flushPara();
        const tag = ordered ? "ol" : "ul";
        if (list && list.tag !== tag) flushList();
        if (!list) list = { tag, items: [] };
        list.items.push((ordered || bullet)[1]);
      } else {
        flushList();
        para.push(line);
      }
    }
    flushPara();
    flushList();
  }
  return out.join("");
}
