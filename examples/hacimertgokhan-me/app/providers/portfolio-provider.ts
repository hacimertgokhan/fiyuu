/**
 * Portfolio Provider
 * 
 * @intent Loads and provides portfolio data from private assets
 * @target layout
 * @priority 20
 */

import { readPrivateJson } from "@fiyuu/runtime/server-private";

export interface PortfolioProviderProps {
  children: string;
}

export default async function PortfolioProvider({ children }: PortfolioProviderProps): Promise<string> {
  // Load portfolio data from private assets
  let portfolioData: any = {};
  
  try {
    portfolioData = await readPrivateJson("data/portfolio.json");
  } catch (error) {
    console.warn("[PortfolioProvider] Could not load portfolio data:", error);
    portfolioData = { projects: [], skills: [], experience: [] };
  }
  
  return `
    <div data-portfolio-provider="true" 
         data-projects="${portfolioData.projects?.length || 0}"
         data-skills="${portfolioData.skills?.length || 0}">
      ${children}
    </div>
  `;
}
