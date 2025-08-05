import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

// Utility for combining Tailwind classes
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Format date for display
export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(date)
}

// Calculate user level based on points
export function calculateLevel(points: number): number {
  return Math.floor(points / 100) + 1
}

// Get points needed for next level
export function getPointsToNextLevel(points: number): number {
  const currentLevel = calculateLevel(points)
  const pointsForNextLevel = currentLevel * 100
  return pointsForNextLevel - points
}

// Format file size for image uploads
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

// Generate random ID (temporary until we use proper database IDs)
export function generateId(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36)
}