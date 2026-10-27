import { simpleMarkdown, toEmbedUrl } from "./contentFormat.js";

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
});
