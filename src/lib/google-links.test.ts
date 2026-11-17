import { describe, expect, it } from "vitest";
import { parseDriveFolderId, parseSpreadsheetId } from "./google-links";

describe("Google links", () => {
  it("reads the Sheet ID from the owner's share link", () => {
    expect(parseSpreadsheetId("https://docs.google.com/spreadsheets/d/1Ns1zDFs99YaTtDlG0df9DPNlsj2SarHs3InoCl8FFIc/edit?usp=sharing")).toBe("1Ns1zDFs99YaTtDlG0df9DPNlsj2SarHs3InoCl8FFIc");
  });
  it("accepts a bare Sheet ID and rejects other links", () => {
    expect(parseSpreadsheetId("1Ns1zDFs99YaTtDlG0df9DPNlsj2SarHs3InoCl8FFIc")).toBe("1Ns1zDFs99YaTtDlG0df9DPNlsj2SarHs3InoCl8FFIc");
    expect(parseSpreadsheetId("https://example.com/not-a-sheet")).toBeNull();
  });
  it("reads a Drive folder ID from folder and open links", () => {
    expect(parseDriveFolderId("https://drive.google.com/drive/u/0/folders/1AbCdEfGhIjKlMn?usp=sharing")).toBe("1AbCdEfGhIjKlMn");
    expect(parseDriveFolderId("https://drive.google.com/open?id=1AbCdEfGhIjKlMn")).toBe("1AbCdEfGhIjKlMn");
    expect(parseDriveFolderId("https://example.com/folders/1AbCdEfGhIjKlMn")).toBeNull();
  });
});
