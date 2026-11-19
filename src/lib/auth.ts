import {
  requireIdentity,
  type VerifiedIdentity,
} from "../../cursor/identity";

export async function requireViewer(
  request: Request,
): Promise<VerifiedIdentity | Response> {
  return requireIdentity(request);
}

export function json(data: unknown, init?: { status?: number }) {
  return Response.json(data, {
    status: init?.status ?? 200,
    headers: { "cache-control": "private, no-store" },
  });
}

export function viewerLabel(identity: VerifiedIdentity) {
  if (identity.kind === "key") {
    return identity.name || "Integración";
  }
  return identity.name || identity.email || "Operador";
}
