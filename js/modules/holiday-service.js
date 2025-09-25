/**
 * Holiday Service Module
 * Manages Taiwan holiday data fetching and caching
 */
export class HolidayService {
  constructor() {
    this.TAIWAN_CALENDAR_API = 'https://opensheet.elk.sh/1yC_pjiP0orcMqRy0rpymMjDpISJhiJBcMoOmCowru84/taiwan-calendar';
    this.allHolidays = null;
    this.holidayCache = {};
  }

  async fetchHolidaysForMonth(year, month) {
    const key = `${year}-${month}`;
    if (this.holidayCache[key]) return this.holidayCache[key];
    
    try {
      if (!this.allHolidays) {
        const res = await fetch(this.TAIWAN_CALENDAR_API);
        this.allHolidays = await res.json();
      }
      
      const monthData = {};
      this.allHolidays.forEach(item => {
        if (item.date && item.date.startsWith(`${year}${month}`) && item.holidaycategory !== '星期六、星期日') {
          const formatted = `${item.date.slice(0,4)}-${item.date.slice(4,6)}-${item.date.slice(6,8)}`;
          monthData[formatted] = item;
        }
      });
      
      this.holidayCache[key] = monthData;
      return monthData;
    } catch (err) {
      console.error('Failed to fetch holidays:', err);
      this.holidayCache[key] = {};
      return {};
    }
  }
}