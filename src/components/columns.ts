import { ColumnDef } from "@tanstack/react-table";
import { Listing } from "./SearchResults";

export const columns: ColumnDef<Listing, string>[] = [
  {
    accessorFn: (row: Listing) => row.listing_name,
    header: "名稱",
  },
  {
    accessorFn: (row: Listing) => row.location,
    header: "位置",
  },
  {
    accessorFn: (row: Listing) => row.description,
    header: "描述",
  },
  {
    accessorFn: (row: Listing) => row.state?.state_name || "",
    header: "地區",
  },
  {
    accessorFn: (row: Listing) => row.services?.map((s: { service: { service_name: string } }) => s.service.service_name).join(", ") || "",
    header: "服務",
  },
  {
    accessorFn: (row: Listing) => row.religions?.map((r: { religion: { religion_name: string } }) => r.religion.religion_name).join(", ") || "",
    header: "宗教",
  },
  {
    accessorFn: (row: Listing) => row.gods?.map((g: { god: { god_name: string } }) => g.god.god_name).join(", ") || "",
    header: "神祇",
  },
]; 