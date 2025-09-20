import { Response } from "express";
import { Builder } from "xml2js";

type FormatType = "json" | "xml";

export function sendFormatted(
  res: Response,
  data: any,
  format: FormatType,
  rootName = "data"
) {
  if (format === "xml") {
    const builder = new Builder({ rootName });
    const xml = builder.buildObject(data);
    res.type("application/xml").send(xml);
  } else {
    res.json(data);
  }
}

export function chooseFormat(req: any): FormatType {
  // Query param wins, otherwise check Accept header (default JSON)
  if (req.query.format) {
    if (String(req.query.format).toLowerCase() === "xml") return "xml";
    return "json";
  }
  const accept = (req.headers.accept || "").toLowerCase();
  if (accept.includes("xml")) return "xml";
  return "json";
}
