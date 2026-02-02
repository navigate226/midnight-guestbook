import { Logger } from "pino";
import {parse as uuidParser} from "uuid"
import { DerivedGuestbook, DerivedMessage } from "./common-types.js";
import { Guestbook, Message } from "@guestbook/guestbook-contract";
import { persistentCommit, CompactTypeBytes } from "@midnight-ntwrk/compact-runtime";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Checks if two Uint8Arrays equal each other
export function arraysEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}

export const randomNonceBytes = (length: number, logger?: Logger): Uint8Array => {
    const newBytes = new Uint8Array(length);
    crypto.getRandomValues(newBytes);
    logger?.info("Random nonce bytes", newBytes)
    return newBytes;
}
export function uint8arraytostring(array: Uint8Array): string {
  // Debug logging
  console.log('Converting array:', Array.from(array).map(b => b.toString(16).padStart(2, '0')).join(''));
  console.log('Array length:', array.length);
  
  if (array.length < 16) {
    throw new Error(`Array too short for UUID conversion: ${array.length} bytes`);
  }
  
  // Take first 16 bytes and check if they contain actual data
  const uuidBytes = array.slice(0, 16);
  
  // Check if all bytes are zero (invalid UUID)
  if (uuidBytes.every(byte => byte === 0)) {
    // Instead of throwing, return a default or handle gracefully
    console.warn('Received all-zero UUID bytes, this might indicate uninitialized data');
    return '00000000-0000-0000-0000-000000000000'; // Return null UUID
    // Or throw with more context:
    // throw new Error(`Invalid UUID: all bytes are zero. Full array: ${Array.from(array).map(b => b.toString(16).padStart(2, '0')).join('')}`);
  }
  
  const hex = Array.from(uuidBytes)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
  
  const formatted = [
    hex.slice(0, 8),
    hex.slice(8, 12),
    hex.slice(12, 16),
    hex.slice(16, 20),
    hex.slice(20, 32)
  ].join('-');
  
  // Validate UUID format
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(formatted)) {
    throw new Error(`Invalid UUID format: ${formatted}`);
  }
  
  return formatted;
}

// Convert UUID string to padded Uint8Array for blockchain
export function uuidToUint8Array(uuidStr: string): Uint8Array {
  // Remove hyphens and convert to bytes
  const hex = uuidStr.replace(/-/g, '');
  const bytes = new Uint8Array(hex.length / 2);
  
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substr(i, 2), 16);
  }
  
  // Pad to 32 bytes for blockchain storage
  const padded = new Uint8Array(32);
  padded.set(bytes, 0); // Place UUID bytes at the beginning
  
  return padded;
}

export function hexStringToUint8Array(hexStr: string): Uint8Array {
  // Validate UUID format first
  if (!UUID_REGEX.test(hexStr)) {
    throw new Error(`Invalid UUID format: ${hexStr}`);
  }
  
  // Use the conversion function instead of uuidParser
  return uuidToUint8Array(hexStr);
}

// Alias for backwards compatibility and clarity
export const uuidStringToUint8Array = uuidToUint8Array;

export function numberToUint8Array(num: number | bigint, length = 32): Uint8Array {
  const arr = new Uint8Array(length);
  let temp = BigInt(num);

  // Fill the array from the start (little-endian to match Compact Field->Bytes conversion)
  for (let i = 0; i < length; i++) {
    arr[i] = Number(temp & 0xffn);
    temp >>= 8n;
  }

  return arr;
}

// Convert UUID (displayed format) back to counter number
// The UUID format like "01000000-0000-0000-0000-000000000000" represents counter 1
// This is the inverse of uint8arraytostring()
export function uuidStringToCounterNumber(uuidStr: string): number {
  if (!UUID_REGEX.test(uuidStr)) {
    throw new Error(`Invalid guestbook id format: ${uuidStr}`);
  }
  // Remove hyphens to get the hex string
  const hex = uuidStr.replace(/-/g, '');
  // The counter is encoded in LITTLE-ENDIAN format at the start of the 32-byte array
  // So we take the first 8 hex chars (4 bytes) and parse as little-endian
  const counterHex = hex.substring(0, 8);
  
  // Parse as little-endian: reverse byte pairs before parseInt
  const byte0 = counterHex.substring(0, 2);
  const byte1 = counterHex.substring(2, 4);
  const byte2 = counterHex.substring(4, 6);
  const byte3 = counterHex.substring(6, 8);
  const littleEndianHex = byte3 + byte2 + byte1 + byte0;
  
  const counterNum = parseInt(littleEndianHex, 16);
  if (Number.isNaN(counterNum)) {
    throw new Error(`Guestbook id could not be converted to a counter: ${uuidStr}`);
  }
  return counterNum;
}

export function pad(s: string, n: number): Uint8Array {
  const encoder = new TextEncoder();
  const utf8Bytes = encoder.encode(s);
  if (n < utf8Bytes.length) {
    throw new Error(`The padded length n must be at least ${utf8Bytes.length}`);
  }
  const paddedArray = new Uint8Array(n);
  paddedArray.set(utf8Bytes);
  return paddedArray;
}

export function createDerivedGuestbooksArray(guestbooks: {
  isEmpty(): boolean;
  size(): bigint;
  member(key_0: Uint8Array): boolean;
  lookup(key_0: Uint8Array): Guestbook;
  [Symbol.iterator](): Iterator<[Uint8Array, Guestbook]>
}): DerivedGuestbook[] {
    return Array.from(guestbooks).map(([key, guestbook]) => ({
      id: uint8arraytostring(key),
      guestbook: guestbook,
  }));
}

export function createDerivedMessagesArray(messages: {
  isEmpty(): boolean;
  size(): bigint;
  member(key_0: Uint8Array): boolean;
  lookup(key_0: Uint8Array): Message;
  [Symbol.iterator](): Iterator<[Uint8Array, Message]>
}): DerivedMessage[] {
    return Array.from(messages).map(([key, message]) => ({
      id: uint8arraytostring(key),
      message: message,
  }));
}

/**
 * Generate a guest commit hash that matches the Compact contract's generateCommit circuit.
 * This replicates the logic: persistentCommit<Guest>({id: secretKey}, rand)
 * 
 * This uses a simplified implementation that should match the contract's behavior.
 * The Guest struct is { id: Bytes<32> }, which when serialized is just the 32 bytes of the id.
 * 
 * @param secretKey - The user's secret key (32 bytes)
 * @param guestbookId - The guestbook ID used as randomness (32 bytes)
 * @returns The guest commit hash (32 bytes)
 */
export function generateGuestCommit(secretKey: Uint8Array, guestbookId: Uint8Array): Uint8Array {
  // Create a simple type descriptor for Bytes<32>
  const bytesType = new CompactTypeBytes(32);
  
  // For a struct with a single Bytes<32> field, the serialization is just the bytes themselves
  // So we use the secretKey directly as the value to commit
  return persistentCommit(bytesType, secretKey, guestbookId);
}

export default {randomNonceBytes, uint8arraytostring, numberToUint8Array, createDerivedGuestbooksArray, createDerivedMessagesArray, pad, generateGuestCommit };