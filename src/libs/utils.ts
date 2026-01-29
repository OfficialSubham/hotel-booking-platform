export function substractDates(checkInDate: Date, checkOutDate: Date) {
    const oneDay = 24 * 60 * 60 * 1000; //miliseconds
    const diffInMiliseconds = checkOutDate.getTime() - checkInDate.getTime();

    return diffInMiliseconds / oneDay;
}
