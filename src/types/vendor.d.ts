/**
 * Local type declarations for packages without bundled TypeScript types.
 * Keep minimal — only declare what the codebase actually uses.
 */

// formidable v3 — multipart/form-data parser (no bundled .d.ts in v3.5.x)
declare module 'formidable' {
  interface FormidableOptions {
    maxFileSize?: number;
    maxFields?: number;
    keepExtensions?: boolean;
  }

  interface File {
    filepath: string;
    mimetype: string | null;
    originalFilename: string | null;
    size: number | null;
    newFilename: string;
  }

  type Files = Record<string, File[] | undefined>;
  type Fields = Record<string, string[] | undefined>;

  interface IncomingForm {
    parse(
      req: import('http').IncomingMessage
    ): Promise<[Fields, Files]>;
  }

  function formidable(opts?: FormidableOptions): IncomingForm;
  export default formidable;
  export type { FormidableOptions, File, Files, Fields, IncomingForm };
}

// heic-convert — HEIC/HEIF to JPEG/PNG conversion (no @types package available)
declare module 'heic-convert' {
  interface ConvertOptions {
    buffer: Buffer;
    format: 'JPEG' | 'PNG';
    /** Quality 0–1 (JPEG only) */
    quality?: number;
  }

  function convert(opts: ConvertOptions): Promise<ArrayBuffer>;
  export default convert;
}
