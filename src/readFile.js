// Reads text out of a PDF or Word (.docx) file, right in the browser.
// The libraries load only when needed, so the page itself stays fast.
export async function readFile(file) {
  const name = file.name.toLowerCase();

  if (name.endsWith(".pdf")) {
    const pdfjs = await import("pdfjs-dist");
    const worker = (await import("pdfjs-dist/build/pdf.worker.min.mjs?url")).default;
    pdfjs.GlobalWorkerOptions.workerSrc = worker;

    const pdf = await pdfjs.getDocument({ data: await file.arrayBuffer() }).promise;
    let out = "";
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      out += content.items.map((it) => it.str).join(" ") + "\n\n";
    }
    if (!out.trim()) throw new Error("No text found. This PDF may be made of scanned images.");
    return out;
  }

  if (name.endsWith(".docx")) {
    const m = await import("mammoth/mammoth.browser");
    const mammoth = m.default || m;
    const { value } = await mammoth.extractRawText({ arrayBuffer: await file.arrayBuffer() });
    if (!value.trim()) throw new Error("No text found in this Word file.");
    return value;
  }

  throw new Error("Please choose a .pdf or .docx file.");
}
