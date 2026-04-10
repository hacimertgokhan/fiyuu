/**
 * Skeleton Provider
 * 
 * @intent Wraps content with loading skeletons for better UX
 * @target page
 * @priority 30
 */

import { wrapWithSkeleton } from "@fiyuu/core/errors";

export interface SkeletonProviderProps {
  children: string;
  skeletonId?: string;
  skeletonType?: "card" | "text" | "image" | "button" | "avatar" | "title" | "paragraph";
}

export default function SkeletonProvider({ 
  children, 
  skeletonId = "skeleton",
  skeletonType = "card" 
}: SkeletonProviderProps): string {
  return wrapWithSkeleton(children, { id: skeletonId, skeleton: skeletonType });
}
