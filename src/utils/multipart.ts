const CRLF = "\r\n";

function utf8(value: string): Uint8Array {
  return new TextEncoder().encode(value);
}

function concat(parts: Uint8Array[]): ArrayBuffer {
  const length = parts.reduce((total, part) => total + part.byteLength, 0);
  const result = new Uint8Array(length);
  let offset = 0;
  for (const part of parts) {
    result.set(part, offset);
    offset += part.byteLength;
  }
  return result.buffer;
}

function quoteHeaderValue(value: string): string {
  return value.replace(/["\r\n]/g, (character) => {
    if (character === '"') return "%22";
    return "";
  });
}

export async function createMultipartBody(
  file: File,
  fileField: string,
  fields: Record<string, string>,
): Promise<{ body: ArrayBuffer; contentType: string }> {
  const boundary = `ObsiPastePic${Date.now().toString(36)}${Math.random().toString(36).slice(2)}`;
  const parts: Uint8Array[] = [];

  for (const [name, value] of Object.entries(fields)) {
    parts.push(
      utf8(
        `--${boundary}${CRLF}` +
          `Content-Disposition: form-data; name="${quoteHeaderValue(name)}"${CRLF}${CRLF}` +
          `${value}${CRLF}`,
      ),
    );
  }

  parts.push(
    utf8(
      `--${boundary}${CRLF}` +
        `Content-Disposition: form-data; name="${quoteHeaderValue(fileField)}"; filename="${quoteHeaderValue(file.name)}"${CRLF}` +
        `Content-Type: ${file.type || "application/octet-stream"}${CRLF}${CRLF}`,
    ),
  );
  parts.push(new Uint8Array(await file.arrayBuffer()));
  parts.push(utf8(`${CRLF}--${boundary}--${CRLF}`));

  return {
    body: concat(parts),
    contentType: `multipart/form-data; boundary=${boundary}`,
  };
}
