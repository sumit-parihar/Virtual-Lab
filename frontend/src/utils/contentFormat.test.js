import { isVideoFile, simpleMarkdown, toEmbedUrl } from "./contentFormat.js";

describe("isVideoFile", () => {
  it("recognises files the browser can play directly", () => {
    expect(isVideoFile("/videos/exp01-simple-linear-regression.mp4")).toBe(true);
    expect(isVideoFile("https://example.com/lesson.webm")).toBe(true);
    expect(isVideoFile("https://www.youtube.com/watch?v=abc123")).toBe(false);
    expect(isVideoFile("")).toBe(false);
    expect(isVideoFile(null)).toBe(false);
  });
});

describe("toEmbedUrl", () => {
  it("turns YouTube links into embed links", () => {
    expect(toEmbedUrl("https://www.youtube.com/watch?v=abc123")).toBe("https://www.youtube.com/embed/abc123");
    expect(toEmbedUrl("https://youtu.be/abc123")).toBe("https://www.youtube.com/embed/abc123");
  });

  it("leaves other links alone", () => {
    expect(toEmbedUrl("https://example.com/video.mp4")).toBe("https://example.com/video.mp4");
  });
});

describe("simpleMarkdown", () => {
  it("formats headings, bold and code", () => {
    const html = simpleMarkdown("## Title\n**bold** and `code`");
    expect(html).toContain("<h2>Title</h2>");
    expect(html).toContain("<strong>bold</strong>");
    expect(html).toContain("<code>code</code>");
  });

  it("escapes HTML so notes cannot inject markup", () => {
    expect(simpleMarkdown("<script>alert(1)</script>")).not.toContain("<script>");
  });

  it("makes paragraphs and lists without stray line breaks around headings", () => {
    const html = simpleMarkdown("## Steps\n\nIntro line\nsecond line\n\n1. Load\n2. Split\n\n- a\n- b");
    expect(html).toBe(
      "<h2>Steps</h2><p>Intro line<br>second line</p><ol><li>Load</li><li>Split</li></ol><ul><li>a</li><li>b</li></ul>"
    );
  });

  it("keeps a heading followed directly by text apart", () => {
    expect(simpleMarkdown("### Note\nText")).toBe("<h3>Note</h3><p>Text</p>");
  });

  it("turns bare links into new-tab anchors, leaving trailing punctuation and inline code alone", () => {
    const html = simpleMarkdown("- Docs: https://scikit-learn.org/stable/modules/linear_model.html.\n- `https://x.org`");
    expect(html).toContain(
      '<a href="https://scikit-learn.org/stable/modules/linear_model.html" target="_blank" rel="noopener noreferrer">https://scikit-learn.org/stable/modules/linear_model.html</a>.'
    );
    expect(html).toContain("<code>https://x.org</code>");
  });

  it("does not linkify javascript: or other schemes", () => {
    expect(simpleMarkdown("javascript:alert(1)")).not.toContain("<a");
  });
});
