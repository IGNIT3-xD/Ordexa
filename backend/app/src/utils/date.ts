/**
 * Add calendar months while clamping to the last valid day of the target
 * month (so Jan 31 + 1 month = Feb 28/29, not Mar 3).
 */
export const addMonths = (date: Date, months: number): Date => {
    const result = new Date(date);
    const day = result.getDate();

    result.setDate(1);
    result.setMonth(result.getMonth() + months);

    const lastDayOfMonth = new Date(
        result.getFullYear(),
        result.getMonth() + 1,
        0
    ).getDate();

    result.setDate(Math.min(day, lastDayOfMonth));

    return result;
};

/** Start of the current month at local midnight. */
export const startOfMonth = (date: Date = new Date()): Date => {
    const result = new Date(date);
    result.setDate(1);
    result.setHours(0, 0, 0, 0);
    return result;
};
