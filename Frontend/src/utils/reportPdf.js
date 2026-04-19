const normalizeFileName = (value, fallback = "dental-report") => {
  const safe = String(value || "")
    .trim()
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
  return safe || fallback;
};

export const downloadReportPdf = async (authFetch, reportId, preferredName) => {
  if (!authFetch) {
    throw new Error("Authenticated request helper is required");
  }
  if (!reportId) {
    throw new Error("Report ID is required");
  }

  const res = await authFetch(`/api/reports/${reportId}/pdf`, {
    method: "GET",
  });

  if (!res.ok) {
    let message = "Failed to download PDF";
    try {
      const payload = await res.json();
      if (payload?.error) message = payload.error;
    } catch {
      // Ignore JSON parse errors and keep generic message.
    }
    throw new Error(message);
  }

  const blob = await res.blob();
  const objectUrl = window.URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = objectUrl;
  anchor.download = `${normalizeFileName(preferredName || reportId)}.pdf`;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  window.URL.revokeObjectURL(objectUrl);
};
