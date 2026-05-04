import { Download } from "lucide-react";

interface Filter {
  key: string;
  label: string;
  type: "text" | "date" | "select";
  options?: { value: string; label: string }[];
}

interface Props {
  title: string;
  endpoint: string;
  filters?: Filter[];
}

export function ReportDownloadBar({ title, endpoint, filters = [] }: Props) {
  function handleDownload() {
    const baseUrl = import.meta.env.VITE_API_URL ?? "http://localhost:8000/api/v1";
    const token = localStorage.getItem("access_token") ?? "";
    const form = document.createElement("form");
    form.method = "GET";
    form.action = `${baseUrl}${endpoint}`;
    form.target = "_blank";

    // Collect filter values from the DOM
    const inputs = document.querySelectorAll<HTMLInputElement | HTMLSelectElement>(`[data-report-filter="${endpoint}"]`);
    inputs.forEach((el) => {
      if (el.value) {
        const hidden = document.createElement("input");
        hidden.type = "hidden";
        hidden.name = el.name;
        hidden.value = el.value;
        form.appendChild(hidden);
      }
    });

    // Attach auth token via a temporary anchor with blob is not straightforward;
    // instead use fetch + blob download to preserve auth header
    const params: Record<string, string> = {};
    inputs.forEach((el) => { if (el.value) params[el.name] = el.value; });

    const url = `${baseUrl}${endpoint}?${new URLSearchParams(params)}`;
    fetch(url, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => res.blob())
      .then((blob) => {
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = `${title.toLowerCase().replace(/\s+/g, "_")}.csv`;
        a.click();
        URL.revokeObjectURL(a.href);
      })
      .catch(() => alert("Download failed. Please try again."));
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
        <button onClick={handleDownload}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white rounded-md"
          style={{ backgroundColor: "#3B6D11" }}>
          <Download size={12} /> Download CSV
        </button>
      </div>

      {filters.length > 0 && (
        <div className="flex flex-wrap gap-3">
          {filters.map((f) => (
            <div key={f.key}>
              <label className="block text-xs text-gray-500 mb-1">{f.label}</label>
              {f.type === "select" ? (
                <select name={f.key} data-report-filter={endpoint}
                  className="px-2 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-[#639922]">
                  <option value="">All</option>
                  {f.options?.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              ) : (
                <input type={f.type} name={f.key} data-report-filter={endpoint}
                  className="px-2 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-[#639922]" />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
