import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Calculate reading time in minutes based on content length
 * @param content Text content to calculate reading time for
 * @returns Estimated reading time in minutes
 */
export function calculateReadingTime(content: string): number {
  // Average reading speed is about 200-250 words per minute
  const wordsPerMinute = 225;
  const wordCount = content.trim().split(/\s+/).length;
  const readingTime = Math.ceil(wordCount / wordsPerMinute);
  
  // Return at least 1 minute even for very short content
  return Math.max(1, readingTime);
}
