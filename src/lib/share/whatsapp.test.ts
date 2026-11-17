import { describe, expect, it } from "vitest";
import { tableCellsToRows, toCsv, whatsappShareUrl } from "./whatsapp";
describe("share helpers", () => {
  it("encodes the WhatsApp message", () => { expect(whatsappShareUrl(" Hi & apply ")).toBe("https://wa.me/?text=Hi%20%26%20apply"); });
  it("keeps real negative numbers but neutralises formula-looking text", () => { expect(toCsv([{ amount: -500, title: "-2+3", t: "\tcmd" }])).toBe('"amount","title","t"\r\n"-500","\'-2+3","\'\tcmd"'); });
  it("neutralises spreadsheet formulas in CSV", () => { expect(toCsv([{ a: "=SUM(1)", b: 'x"y' }])).toBe('"a","b"\r\n"\'=SUM(1)","x""y"'); });
  it("drops action columns when exporting a table", () => { expect(tableCellsToRows(["Name", "Status", "Actions", ""], [["Asha\n Rao", "open", "Edit", "x"]])).toEqual([{ Name: "Asha Rao", Status: "open" }]); });
});
