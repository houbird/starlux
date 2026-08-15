/**
 * Date Utilities Module
 * Handles date formatting and calculations
 */
export class DateUtils {
  static formatMonthDate(monthValue) {
    const [year, month] = monthValue.split('-').map(Number);
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;
    const currentDay = now.getDate();

    let day;
    if (year === currentYear && month === currentMonth) {
      day = currentDay;
    } else {
      day = 1;
    }
    
    const date = new Date(year, month - 1, day);
    date.setDate(date.getDate() + 1);
    return date.toISOString().split('T')[0];
  }

  static updateInputMonthValue(inputMonth, offset) {
    const inputMonthValue = inputMonth.value;
    const [year, month] = inputMonthValue.split('-');
    const date = new Date(year, month - 1, 1);
    date.setMonth(date.getMonth() + offset);
    const paddedMonth = (date.getMonth() + 1).toString().padStart(2, '0');
    return `${date.getFullYear()}-${paddedMonth}`.padEnd(7, '-');
  }

  static getCurrentMonth() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 2).padStart(2, '0');
    return `${year}-${month}`;
  }

  /**
   * Add a given number of days to a date string (YYYY-MM-DD)
   * @param {string} dateStr - Date in YYYY-MM-DD format
   * @param {number} days - Number of days to add
   * @returns {string} Date in YYYY-MM-DD format
   */
  static addDays(dateStr, days) {
    if (!dateStr) return '';
    const [year, month, day] = dateStr.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    date.setDate(date.getDate() + Number(days));
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  /**
   * Format ISO date string (YYYY-MM-DD) to slash-separated format (YYYY/MM/DD)
   * @param {string} isoDateStr - Date in YYYY-MM-DD format
   * @returns {string} Date in YYYY/MM/DD format
   */
  static formatDisplayDate(isoDateStr) {
    if (!isoDateStr) return '';
    return isoDateStr.replace(/-/g, '/');
  }

  /**
   * Generate return date options for Single-Day Comparison dropdown
   * @param {string} departureDateStr - Departure date in YYYY-MM-DD format
   * @param {number} maxDays - Maximum trip duration days (default 30)
   * @returns {Array<{days: number, isoDate: string, displayText: string}>}
   */
  static getReturnDateOptions(departureDateStr, maxDays = 30) {
    if (!departureDateStr) return [];
    const options = [];
    for (let days = 1; days <= maxDays; days++) {
      const isoDate = this.addDays(departureDateStr, days);
      const displayDate = this.formatDisplayDate(isoDate);
      const dayLabel = days === 1 ? 'day' : 'days';
      options.push({
        days,
        isoDate,
        displayText: `${displayDate} (${days} ${dayLabel})`
      });
    }
    return options;
  }
}