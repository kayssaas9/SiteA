---
name: Mobile image normalization
description: Mobile camera uploads need MIME-tolerant selection and server-side HEIC conversion before OneShot.
---

Mobile pickers may provide an empty MIME type and iPhone photos may be HEIC/HEIF. Accept known image extensions in the browser, then convert every uploaded image to a real JPEG on the server before sending it to OneShot.

**Why:** Desktop uploads are commonly JPEG/PNG, while mobile uploads can otherwise reach OneShot with a mismatched MIME or unsupported HEIC bytes and surface the opaque “The string did not match the pattern” error.

**How to apply:** Keep `sharp` as the normalizer and use the dedicated HEIC decoder only as its fallback; never send an unconverted source while naming it `.jpg`. For Safari multipart requests, preserve the bytes but append a sliced Blob with a fixed ASCII filename and safe MIME metadata.