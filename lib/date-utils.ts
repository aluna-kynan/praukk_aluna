export type TimeFilterOption = 
  | "this_month"
  | "this_week"
  | "last_week"
  | "last_month"
  | "this_year"
  | "last_year"
  | "all";

export const TIME_FILTER_OPTIONS: { value: TimeFilterOption; label: string }[] = [
  { value: "this_month", label: "Bulan Ini" },
  { value: "this_week", label: "Minggu Ini" },
  { value: "last_week", label: "Minggu Lalu" },
  { value: "last_month", label: "Bulan Lalu" },
  { value: "this_year", label: "Tahun Ini" },
  { value: "last_year", label: "Tahun Lalu" },
  { value: "all", label: "Semua Waktu" },
];

export function isDateInFilter(
  dateStr: string | null | undefined, 
  filter: TimeFilterOption | string
): boolean {
  if (filter === "all" || !filter) return true;
  if (!dateStr) return false;

  const targetDate = new Date(dateStr);
  if (isNaN(targetDate.getTime())) return false;

  const now = new Date();

  // Helper for Week (Monday to Sunday)
  const getWeekRange = (refDate: Date) => {
    const day = refDate.getDay();
    const diffToMon = day === 0 ? -6 : 1 - day;
    const monday = new Date(refDate);
    monday.setDate(refDate.getDate() + diffToMon);
    monday.setHours(0, 0, 0, 0);

    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    sunday.setHours(23, 59, 59, 999);
    return { monday, sunday };
  };

  switch (filter) {
    case "this_week": {
      const { monday, sunday } = getWeekRange(now);
      return targetDate >= monday && targetDate <= sunday;
    }
    case "last_week": {
      const prevWeekRef = new Date(now);
      prevWeekRef.setDate(now.getDate() - 7);
      const { monday, sunday } = getWeekRange(prevWeekRef);
      return targetDate >= monday && targetDate <= sunday;
    }
    case "this_month": {
      const start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
      const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
      return targetDate >= start && targetDate <= end;
    }
    case "last_month": {
      const start = new Date(now.getFullYear(), now.getMonth() - 1, 1, 0, 0, 0, 0);
      const end = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
      return targetDate >= start && targetDate <= end;
    }
    case "this_year": {
      const start = new Date(now.getFullYear(), 0, 1, 0, 0, 0, 0);
      const end = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
      return targetDate >= start && targetDate <= end;
    }
    case "last_year": {
      const start = new Date(now.getFullYear() - 1, 0, 1, 0, 0, 0, 0);
      const end = new Date(now.getFullYear() - 1, 11, 31, 23, 59, 59, 999);
      return targetDate >= start && targetDate <= end;
    }
    default:
      return true;
  }
}

export function getDatePresetRange(filter: TimeFilterOption): { startDate: string; endDate: string } {
  const now = new Date();
  const formatDate = (d: Date) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const getWeekRange = (refDate: Date) => {
    const day = refDate.getDay();
    const diffToMon = day === 0 ? -6 : 1 - day;
    const monday = new Date(refDate);
    monday.setDate(refDate.getDate() + diffToMon);

    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    return { monday, sunday };
  };

  switch (filter) {
    case "this_week": {
      const { monday, sunday } = getWeekRange(now);
      return { startDate: formatDate(monday), endDate: formatDate(sunday) };
    }
    case "last_week": {
      const prevWeekRef = new Date(now);
      prevWeekRef.setDate(now.getDate() - 7);
      const { monday, sunday } = getWeekRange(prevWeekRef);
      return { startDate: formatDate(monday), endDate: formatDate(sunday) };
    }
    case "this_month": {
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      return { startDate: formatDate(start), endDate: formatDate(end) };
    }
    case "last_month": {
      const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const end = new Date(now.getFullYear(), now.getMonth(), 0);
      return { startDate: formatDate(start), endDate: formatDate(end) };
    }
    case "this_year": {
      const start = new Date(now.getFullYear(), 0, 1);
      const end = new Date(now.getFullYear(), 11, 31);
      return { startDate: formatDate(start), endDate: formatDate(end) };
    }
    case "last_year": {
      const start = new Date(now.getFullYear() - 1, 0, 1);
      const end = new Date(now.getFullYear() - 1, 11, 31);
      return { startDate: formatDate(start), endDate: formatDate(end) };
    }
    case "all":
    default:
      return { startDate: "", endDate: "" };
  }
}

