import { Timestamp } from 'firebase/firestore';

/**
 * Safely converts a Firebase Timestamp to a JavaScript Date object
 * Handles various timestamp formats including serialized/deserialized ones
 */
export function safeTimestampToDate(value: any): Date {
  // If it's already a Date, return it
  if (value instanceof Date) {
    return value;
  }

  // If it's a valid Firebase Timestamp with toDate method
  if (value && typeof value.toDate === 'function') {
    return value.toDate();
  }

  // If it's a serverTimestamp that wasn't processed
  if (value && value._methodName === 'serverTimestamp') {
    console.warn('ServerTimestamp não processado detectado, usando timestamp atual');
    return new Date();
  }

  // If it's a number (milliseconds since epoch)
  if (typeof value === 'number') {
    return new Date(value);
  }

  // If it's an object with seconds and nanoseconds (Firebase Timestamp serialized)
  if (value && typeof value === 'object' && 'seconds' in value) {
    return new Date(value.seconds * 1000 + (value.nanoseconds || 0) / 1000000);
  }

  // If it's an object with _seconds and _nanoseconds (Firebase Timestamp deserialized incorrectly)
  if (value && typeof value === 'object' && '_seconds' in value) {
    return new Date(value._seconds * 1000 + (value._nanoseconds || 0) / 1000000);
  }

  // Fallback: return current date
  console.warn('Formato de timestamp não reconhecido, usando timestamp atual:', value);
  return new Date();
}

/**
 * Safely converts a value to a Firebase Timestamp
 * Handles various input formats
 */
export function safeToTimestamp(value: any): Timestamp {
  // If it's already a Timestamp, return it
  if (value && typeof value.toDate === 'function') {
    return value as Timestamp;
  }

  // If it's a Date object
  if (value instanceof Date) {
    return Timestamp.fromDate(value);
  }

  // If it's a number (milliseconds since epoch)
  if (typeof value === 'number') {
    return Timestamp.fromMillis(value);
  }

  // If it's an object with seconds and nanoseconds
  if (value && typeof value === 'object' && 'seconds' in value) {
    return new Timestamp(value.seconds, value.nanoseconds || 0);
  }

  // If it's an object with _seconds and _nanoseconds
  if (value && typeof value === 'object' && '_seconds' in value) {
    return new Timestamp(value._seconds, value._nanoseconds || 0);
  }

  // Fallback: return current timestamp
  console.warn('Formato de timestamp não reconhecido, usando timestamp atual:', value);
  return Timestamp.now();
}

/**
 * Checks if a value is a valid timestamp (can be converted to Date)
 */
export function isValidTimestamp(value: any): boolean {
  try {
    const date = safeTimestampToDate(value);
    return date instanceof Date && !isNaN(date.getTime());
  } catch {
    return false;
  }
}
