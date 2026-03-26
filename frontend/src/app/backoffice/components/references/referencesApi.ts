import type { Reference } from "../../types";

export type ReferenceWritePayload = {
  reference: string;
  reference_short: string;
  image: string;
  image_thumb?: string;
  icon: string;
  situation: string;
  tasks: string[];
  actions: string[];
  results: string[];
};

export type ReferenceUploadResponse = {
  url?: string;
  thumbnail_url?: string;
};

export class ReferencesApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "ReferencesApiError";
    this.status = status;
  }
}

function getErrorMessage(status: number, text: string): string {
  return text || `Erreur API (${status})`;
}

async function ensureOk(response: Response): Promise<Response> {
  if (!response.ok) {
    const text = await response.text();
    throw new ReferencesApiError(response.status, getErrorMessage(response.status, text));
  }
  return response;
}

export async function listAdminReferences(apiBase: string, token: string): Promise<Reference[]> {
  const response = await fetch(`${apiBase}/api/contact/references/admin`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  await ensureOk(response);
  return (await response.json()) as Reference[];
}

export async function patchAdminReferenceOrder(
  apiBase: string,
  token: string,
  id: number,
  orderIndex: number,
): Promise<void> {
  const response = await fetch(`${apiBase}/api/contact/references/admin/${id}`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ order_index: orderIndex }),
  });
  await ensureOk(response);
}

export async function deleteAdminReference(apiBase: string, token: string, id: number): Promise<void> {
  const response = await fetch(`${apiBase}/api/contact/references/admin/${id}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
  await ensureOk(response);
}

export async function saveAdminReference(
  apiBase: string,
  token: string,
  editingId: number | null,
  payload: ReferenceWritePayload,
): Promise<Reference> {
  const response = await fetch(
    editingId
      ? `${apiBase}/api/contact/references/admin/${editingId}`
      : `${apiBase}/api/contact/references/admin`,
    {
      method: editingId ? "PUT" : "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    },
  );
  await ensureOk(response);
  return (await response.json()) as Reference;
}

export async function uploadAdminReferenceFile(
  apiBase: string,
  token: string,
  file: File,
): Promise<ReferenceUploadResponse> {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(`${apiBase}/api/contact/references/admin/upload`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  });
  await ensureOk(response);
  return (await response.json()) as ReferenceUploadResponse;
}
