// Turns a pasted Google Sheet or Drive folder link (or a bare ID) into its ID. Browser-safe and tested.

const ID = /^[A-Za-z0-9_-]+$/;

/** Spreadsheet ID from https://docs.google.com/spreadsheets/d/{id}/... or a bare ID; null when it is not one. */
export function parseSpreadsheetId(input: string): string | null {
  const text = input.trim();
  const fromUrl = /docs\.google\.com\/spreadsheets\/(?:u\/\d+\/)?d\/([A-Za-z0-9_-]+)/.exec(text)?.[1];
  const id = fromUrl ?? text;
  return ID.test(id) && id.length >= 20 && id.length <= 100 ? id : null;
}

/** Folder ID from https://drive.google.com/drive/(u/0/)folders/{id}, ...open?id={id}, or a bare ID; null otherwise. */
export function parseDriveFolderId(input: string): string | null {
  const text = input.trim();
  const fromFolders = /drive\.google\.com\/drive\/(?:u\/\d+\/)?folders\/([A-Za-z0-9_-]+)/.exec(text)?.[1];
  const fromOpen = /drive\.google\.com\/open\?(?:.*&)?id=([A-Za-z0-9_-]+)/.exec(text)?.[1];
  const id = fromFolders ?? fromOpen ?? (/^https?:/i.test(text) ? "" : text);
  return ID.test(id) && id.length >= 10 && id.length <= 100 ? id : null;
}

export const sheetUrl = (id: string) => `https://docs.google.com/spreadsheets/d/${id}/edit`;
export const folderUrl = (id: string) => `https://drive.google.com/drive/folders/${id}`;
