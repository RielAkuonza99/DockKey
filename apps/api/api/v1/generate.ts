import type { VercelRequest, VercelResponse } from "@vercel/node";
import { generatorHandler } from "../_lib/handler.js";
export default function handler(req: VercelRequest, res: VercelResponse) {
  return generatorHandler(req, res, "send");
}
