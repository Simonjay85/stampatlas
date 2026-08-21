import { describe, expect, it } from "vitest";
import { classifyCommonsReuseStatus, mapCommonsPage } from "./wikimedia";

describe("Wikimedia Commons import mapper", () => {
  it("keeps only compatible clear reuse statuses and retains attribution metadata", () => {
    expect(classifyCommonsReuseStatus("CC BY-SA 4.0")).toBe("needs_review");
    expect(classifyCommonsReuseStatus("CC BY 4.0")).toBe("cc_by");
    const record = mapCommonsPage({ pageid: 10, title: "File:Example stamp.jpg", fullurl: "https://commons.wikimedia.org/wiki/File:Example_stamp.jpg", imageinfo: [{ url: "https://upload.wikimedia.org/stamp.jpg", thumburl: "https://upload.wikimedia.org/stamp-thumb.jpg", mime: "image/jpeg", extmetadata: { LicenseShortName: { value: "Public domain" }, Artist: { value: "<a>Example creator</a>" } } }] });
    expect(record).toMatchObject({ title: "Example stamp", reuseStatus: "public_domain", attribution: "Example creator", assets: [expect.objectContaining({ reuseStatus: "public_domain" })] });
  });

  it("does not map non-image results", () => {
    expect(mapCommonsPage({ pageid: 11, title: "File:Example.pdf", imageinfo: [{ url: "https://upload.wikimedia.org/example.pdf", mime: "application/pdf" }] })).toBeNull();
  });
});
