// Public holidays configuration for 2025-2026
// Format: "YYYY-MM-DD"
const PUBLIC_HOLIDAYS = [
  // 2025
  "2025-01-26", // Republic Day
  "2025-03-14", // Holi
  "2025-04-10", // Mahavir Jayanti
  "2025-04-18", // Good Friday
  "2025-08-15", // Independence Day
  "2025-08-27", // Janmashtami
  "2025-10-02", // Gandhi Jayanti
  "2025-10-21", // Dussehra
  "2025-10-31", // Diwali
  "2025-11-05", // Guru Nanak Jayanti
  "2025-12-25", // Christmas
  
  // 2026
  "2026-01-26", // Republic Day
  "2026-03-04", // Holi
  "2026-03-30", // Mahavir Jayanti
  "2026-04-03", // Good Friday
  "2026-08-15", // Independence Day
  "2026-08-16", // Janmashtami
  "2026-10-02", // Gandhi Jayanti
  "2026-10-11", // Dussehra
  "2026-10-19", // Diwali
  "2026-11-25", // Guru Nanak Jayanti
  "2026-12-25", // Christmas
];

export const isPublicHoliday = (date: Date = new Date()): boolean => {
  const dateString = date.toISOString().split('T')[0]; // Format as YYYY-MM-DD
  return PUBLIC_HOLIDAYS.includes(dateString);
};

export const getHolidayName = (date: Date = new Date()): string | null => {
  const dateString = date.toISOString().split('T')[0];
  const holidayIndex = PUBLIC_HOLIDAYS.indexOf(dateString);
  
  if (holidayIndex === -1) return null;
  
  // Holiday names mapping (same order as PUBLIC_HOLIDAYS array)
  const holidayNames = [
    "Republic Day", "Holi", "Mahavir Jayanti", "Good Friday", 
    "Independence Day", "Janmashtami", "Gandhi Jayanti", "Dussehra", 
    "Diwali", "Guru Nanak Jayanti", "Christmas",
    "Republic Day", "Holi", "Mahavir Jayanti", "Good Friday",
    "Independence Day", "Janmashtami", "Gandhi Jayanti", "Dussehra",
    "Diwali", "Guru Nanak Jayanti", "Christmas"
  ];
  
  return holidayNames[holidayIndex] || "Public Holiday";
};

export const PUBLIC_HOLIDAYS_LIST = PUBLIC_HOLIDAYS;
