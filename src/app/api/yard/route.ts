import { json, requireViewer } from "@/lib/auth";
import { getYard } from "@/lib/yard";

export async function GET(request: Request) {
  const viewer = await requireViewer(request);
  if (viewer instanceof Response) return viewer;
  const yard = await getYard();
  return json(yard);
}
