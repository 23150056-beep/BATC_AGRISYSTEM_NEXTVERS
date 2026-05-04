import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search } from "lucide-react";
import { farmersApi, type FarmerListItem } from "../api/farmers.api";

const BAUANG_BARANGAYS = [
  "Baccuit Norte","Baccuit Sur","Bagbag","Ballay","Bella Union","Bili","Bungro",
  "Cabaroan (Poro)","Calumbaya","Carmay","Casilagan","Central East (Poblacion)",
  "Central West (Poblacion)","Dili","Disso-or","Guerrero","Lasip","Lingsat",
  "Mabanbanag","Maoasoas","Pagdalagan Norte","Pagdalagan Sur","Palina East",
  "Palina West","Penroad (Sao-it)","Piayong","Picinan","Pindangan East",
  "Pindangan West","Quintarong","Rabon","Ramot","San Agustin (Pugo)","San Felipe",
  "San Isidro (Baraoas)","San Juan","San Luis","Santa Monica","Sapilang",
];

interface Props {
  onSelect: (farmer: FarmerListItem) => void;
  isAdmin?: boolean;
}

export function FarmerTable({ onSelect }: Props) {
  const [search, setSearch] = useState("");
  const [barangay, setBarangay] = useState("");
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ["farmers", { search, barangay, page }],
    queryFn: () => farmersApi.list({ search: search || undefined, barangay: barangay || undefined, page }),
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search name or mobile…"
            className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#639922]"
          />
        </div>
        <select
          value={barangay}
          onChange={(e) => { setBarangay(e.target.value); setPage(1); }}
          className="text-sm border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#639922]"
        >
          <option value="">All barangays</option>
          {BAUANG_BARANGAYS.map((b) => <option key={b} value={b}>{b}</option>)}
        </select>
        {data && (
          <span className="text-xs text-gray-400 ml-auto">{data.count} record{data.count !== 1 ? "s" : ""}</span>
        )}
      </div>

      <div className="border border-gray-200 rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wide">
            <tr>
              <th className="px-4 py-3 text-left">Name</th>
              <th className="px-4 py-3 text-left">Barangay</th>
              <th className="px-4 py-3 text-left">Mobile</th>
              <th className="px-4 py-3 text-left">Livelihood</th>
              <th className="px-4 py-3 text-left">Flags</th>
              <th className="px-4 py-3 text-left">Encoded by</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {isLoading && (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">Loading…</td></tr>
            )}
            {!isLoading && data?.results.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">No farmers found.</td></tr>
            )}
            {data?.results.map((farmer) => (
              <tr
                key={farmer.id}
                onClick={() => onSelect(farmer)}
                className="hover:bg-[#EAF3DE] cursor-pointer transition-colors"
              >
                <td className="px-4 py-3 font-medium text-gray-900">{farmer.full_name}</td>
                <td className="px-4 py-3 text-gray-600 text-xs">{farmer.barangay}</td>
                <td className="px-4 py-3 text-gray-600">{farmer.mobile_number}</td>
                <td className="px-4 py-3 text-gray-600 text-xs capitalize">{farmer.livelihood_type.toLowerCase().replace("_", " ")}</td>
                <td className="px-4 py-3">
                  <div className="flex gap-1">
                    {farmer.is_4ps && <span className="px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded text-xs">4Ps</span>}
                    {farmer.is_pwd && <span className="px-1.5 py-0.5 bg-purple-100 text-purple-700 rounded text-xs">PWD</span>}
                    {farmer.is_ip && <span className="px-1.5 py-0.5 bg-orange-100 text-orange-700 rounded text-xs">IP</span>}
                  </div>
                </td>
                <td className="px-4 py-3 text-gray-500 text-xs">{farmer.encoded_by_name ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {data && data.count > 25 && (
        <div className="flex items-center justify-between text-sm text-gray-500">
          <span>Page {page}</span>
          <div className="flex gap-2">
            <button disabled={!data.previous} onClick={() => setPage((p) => p - 1)}
              className="px-3 py-1 border rounded disabled:opacity-40">Prev</button>
            <button disabled={!data.next} onClick={() => setPage((p) => p + 1)}
              className="px-3 py-1 border rounded disabled:opacity-40">Next</button>
          </div>
        </div>
      )}
    </div>
  );
}
