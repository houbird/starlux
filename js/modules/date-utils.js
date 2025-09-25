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
}