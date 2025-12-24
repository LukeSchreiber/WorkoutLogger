export function getMonthStart(date: Date): Date {
    const d = new Date(date);
    d.setDate(1);
    return d;
}

export function getMonthEnd(date: Date): Date {
    const d = new Date(date);
    d.setMonth(d.getMonth() + 1);
    d.setDate(0);
    return d;
}

export function formatYYYYMMDD(date: Date): string {
    const offset = date.getTimezoneOffset();
    const d = new Date(date.getTime() - (offset * 60 * 1000));
    return d.toISOString().split('T')[0];
}

export function getCalendarDays(currentDate: Date): Date[] {
    const startOfMonth = getMonthStart(currentDate);
    const endOfMonth = getMonthEnd(currentDate);

    const startDay = startOfMonth.getDay(); // 0 (Sun) - 6 (Sat)
    const endDay = endOfMonth.getDay();

    const days: Date[] = [];

    // Add padding days from prev month
    for (let i = startDay; i > 0; i--) {
        const d = new Date(startOfMonth);
        d.setDate(d.getDate() - i);
        days.push(d);
    }

    // Add actual days
    for (let i = 1; i <= endOfMonth.getDate(); i++) {
        const d = new Date(startOfMonth);
        d.setDate(i);
        days.push(d);
    }

    // Add padding days for next month
    for (let i = 1; i < (7 - endDay); i++) {
        const d = new Date(endOfMonth);
        d.setDate(d.getDate() + i);
        days.push(d);
    }

    // Ensure we have full weeks (padding might be incomplete if month ends on Sat, 
    // but the loop above `i < 7 - 6 = 1` which is correct, loop won't run.
    // However if endDay is Saturday (6), we add 0 days. 
    // Wait, typical calendars just fill the row. The loop condition `i < (7 - endDay)`
    // If Sat (6), 7-6 = 1, i < 1 (false), adds 0 days. Perfect.

    return days;
}
