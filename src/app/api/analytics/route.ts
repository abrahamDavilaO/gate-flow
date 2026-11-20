import { json, requireViewer } from "@/lib/auth";
import { getAnalytics } from "@/lib/analytics";

export async function GET(request: Request) {
  const viewer = await requireViewer(request);
  if (viewer instanceof Response) return viewer;
  const params = new URL(request.url).searchParams;
  const report = await getAnalytics({
    range: params.get("range"),
    group: params.get("group"),
    operation: params.get("op"),
  });
  return json(report);
}
