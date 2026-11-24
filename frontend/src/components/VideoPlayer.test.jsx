import { render, screen } from "@testing-library/react";
import VideoPlayer, { lightVersionUrl } from "./VideoPlayer.jsx";

function mockHead(contentType, ok = true) {
  globalThis.fetch = vi.fn(() =>
    Promise.resolve({ ok, headers: { get: () => contentType } }),
  );
}

afterEach(() => {
  vi.restoreAllMocks();
  window.localStorage.clear();
});

describe("lightVersionUrl", () => {
  it("points an app video at its -480p copy and ignores other links", () => {
    expect(lightVersionUrl("/videos/exp01.mp4")).toBe("/videos/exp01-480p.mp4");
    expect(lightVersionUrl("https://www.youtube.com/watch?v=abc")).toBeNull();
    expect(lightVersionUrl("/videos/exp01.webm")).toBeNull();
    expect(lightVersionUrl("")).toBeNull();
  });
});

describe("VideoPlayer", () => {
  it("offers speed always and Data saver only when the lighter file is a real video", async () => {
    mockHead("video/mp4");
    render(<VideoPlayer url="/videos/exp01.mp4" />);
    expect(screen.getByLabelText("Speed")).toBeInTheDocument();
    expect(await screen.findByLabelText("Quality")).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Data saver (480p)" })).toBeInTheDocument();
  });

  it("hides the quality choice when the server answers with the app page instead", async () => {
    mockHead("text/html");
    render(<VideoPlayer url="/videos/exp01.mp4" />);
    await Promise.resolve();
    expect(screen.getByLabelText("Speed")).toBeInTheDocument();
    expect(screen.queryByLabelText("Quality")).not.toBeInTheDocument();
  });

  it("remembers the chosen speed", () => {
    mockHead("text/html");
    window.localStorage.setItem("ml-lab:video-speed", "1.5");
    render(<VideoPlayer url="/videos/exp01.mp4" />);
    expect(screen.getByLabelText("Speed")).toHaveValue("1.5");
  });
});
