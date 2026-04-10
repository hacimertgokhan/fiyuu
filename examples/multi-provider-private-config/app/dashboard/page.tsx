/**
 * Dashboard Page Example
 * 
 * Demonstrates:
 * - ifAnyError for error handling
 * - wrapWithSkeleton for loading states
 * - wrapWithErrorBoundary for error boundaries
 * - tryRender for combined error + skeleton handling
 */

import { Component } from "@geajs/core";
import { html, definePage } from "@fiyuu/core/client";
import {
  ifAnyError,
  ifAnyErrorAsync,
  wrapWithSkeleton,
  wrapWithErrorBoundary,
  tryRender,
  defaultSkeleton,
  readPrivateJson,
  readPrivateCsv,
} from "@fiyuu/core";

export const page = definePage({
  intent: "Dashboard with error handling and skeleton loading",
});

export default class DashboardPage extends Component {
  async template() {
    // Example 1: Using ifAnyErrorAsync for data fetching
    const { result: userData, error: userError, hasError: hasUserError } = await ifAnyErrorAsync(
      async () => {
        // Read from private directory (server-side only)
        const users = await readPrivateCsv("data/users.csv");
        const config = await readPrivateJson("config/auth-config.json");
        return { users, config };
      },
      {
        fallback: { users: [], config: null },
        onError: (err) => console.error("Failed to load dashboard data:", err),
        source: "dashboard-page",
      }
    );

    // Example 2: Using wrapWithSkeleton for loading state
    const usersTable = wrapWithSkeleton(
      this.renderUsersTable(userData?.users || []),
      {
        id: "users-table",
        skeleton: defaultSkeleton("card"),
        minDisplayMs: 300,
      }
    );

    // Example 3: Using wrapWithErrorBoundary for error isolation
    const statsWidget = wrapWithErrorBoundary(
      this.renderStatsWidget(),
      {
        id: "stats-widget",
        source: "StatsWidget",
        fallback: (error, retry) => `
          <div class="stats-error">
            <p>Stats unavailable</p>
            <button onclick="${retry}">Retry</button>
          </div>
        `,
      }
    );

    // Example 4: Using tryRender for combined handling
    const chartContent = tryRender(
      () => this.renderChart(),
      {
        skeleton: defaultSkeleton("image"),
        errorBoundary: true,
        fallback: `<div class="chart-fallback">Chart could not be loaded</div>`,
        source: "DashboardChart",
      }
    );

    return html`
      <div class="dashboard">
        <header class="dashboard-header">
          <h1>Dashboard</h1>
          ${hasUserError ? html`<div class="warning-banner">Some data failed to load</div>` : ""}
        </header>

        <div class="dashboard-grid">
          <!-- Stats Widget with Error Boundary -->
          <section class="widget stats-widget">
            <h2>Statistics</h2>
            ${statsWidget}
          </section>

          <!-- Users Table with Skeleton -->
          <section class="widget users-widget">
            <h2>Users (${userData?.users?.length || 0})</h2>
            ${usersTable}
          </section>

          <!-- Chart with Skeleton + Error Boundary -->
          <section class="widget chart-widget">
            <h2>Analytics</h2>
            ${chartContent}
          </section>
        </div>
      </div>
    `;
  }

  renderUsersTable(users: Array<Record<string, string>>): string {
    if (!users.length) {
      return `<p class="empty-state">No users found</p>`;
    }

    const rows = users
      .map(
        (user) => `
      <tr>
        <td>${user.name}</td>
        <td>${user.email}</td>
        <td><span class="badge badge-${user.role}">${user.role}</span></td>
      </tr>
    `
      )
      .join("");

    return `
      <table class="users-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Role</th>
          </tr>
        </thead>
        <tbody>
          ${rows}
        </tbody>
      </table>
    `;
  }

  renderStatsWidget(): string {
    return `
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-value">1,234</div>
          <div class="stat-label">Total Users</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">89</div>
          <div class="stat-label">Active Now</div>
        </div>
      </div>
    `;
  }

  renderChart(): string {
    return `
      <div class="chart-container">
        <div class="chart-bars">
          <div class="bar" style="height: 60%"></div>
          <div class="bar" style="height: 80%"></div>
          <div class="bar" style="height: 45%"></div>
        </div>
      </div>
    `;
  }
}
