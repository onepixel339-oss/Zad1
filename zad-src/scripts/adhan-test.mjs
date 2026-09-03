import { Coordinates, CalculationMethod, PrayerTimes } from 'adhan'
const coords = new Coordinates(30.04, 31.24)
const params = CalculationMethod.Egyptian()
// Cairo, 2026-09-03 (pass device-local noon of that date)
const t = new PrayerTimes(coords, new Date(2026, 8, 3, 12, 0), params)
console.log('fajr ISO:', t.fajr.toISOString())
console.log('dhuhr ISO:', t.dhuhr.toISOString())
console.log('maghrib ISO:', t.maghrib.toISOString())
const f = new Intl.DateTimeFormat('ar-EG-u-nu-latn', { timeZone: 'Africa/Cairo', hour: 'numeric', minute: '2-digit', hour12: true })
console.log('Cairo wall:', f.format(t.fajr), '|', f.format(t.dhuhr), '|', f.format(t.maghrib))
// Dubai selected while device tz differs: calendar date 2026-09-03 Dubai
const dxb = new PrayerTimes(new Coordinates(25.2, 55.27), new Date(2026, 8, 3, 12, 0), CalculationMethod.UmmAlQura())
const fd = new Intl.DateTimeFormat('ar-EG-u-nu-latn', { timeZone: 'Asia/Dubai', hour: 'numeric', minute: '2-digit', hour12: true })
console.log('Dubai wall:', fd.format(dxb.fajr), '|', fd.format(dxb.dhuhr), '|', fd.format(dxb.maghrib))
// Hijri check
const h = new Intl.DateTimeFormat('ar-SA-u-ca-islamic-umalqura-nu-latn', { timeZone: 'Africa/Cairo', day: 'numeric', month: 'long', year: 'numeric' })
console.log('Hijri:', h.format(new Date(2026, 8, 3)))
const w = new Intl.DateTimeFormat('ar-EG-u-nu-latn', { timeZone: 'Africa/Cairo', weekday: 'long' })
console.log('Weekday:', w.format(new Date(2026, 8, 3)))
