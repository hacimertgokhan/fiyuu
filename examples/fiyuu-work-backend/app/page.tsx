import { Component } from "@geajs/core";
import { html } from "@fiyuu/core/client";

export default class HomePage extends Component {
  template() {
    return html`
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Fiyuu Work API</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              background: #0a0a0f;
              color: #e4e4e7;
              line-height: 1.6;
            }
            .container { max-width: 1200px; margin: 0 auto; padding: 40px 20px; }
            h1 { font-size: 48px; background: linear-gradient(135deg, #22c55e, #16a34a); -webkit-background-clip: text; -webkit-text-fill-color: transparent; margin-bottom: 16px; }
            h2 { font-size: 24px; color: #71717a; margin-bottom: 40px; }
            h3 { font-size: 20px; color: #22c55e; margin: 32px 0 16px; }
            .badge {
              display: inline-block;
              background: #22c55e20;
              color: #22c55e;
              padding: 4px 12px;
              border-radius: 4px;
              font-size: 12px;
              font-weight: 600;
              text-transform: uppercase;
              letter-spacing: 0.5px;
            }
            .endpoint {
              background: #18181b;
              border: 1px solid #27272a;
              border-radius: 8px;
              padding: 20px;
              margin: 16px 0;
            }
            .method {
              display: inline-block;
              padding: 4px 8px;
              border-radius: 4px;
              font-size: 12px;
              font-weight: 600;
              margin-right: 12px;
            }
            .method.get { background: #3b82f620; color: #3b82f6; }
            .method.post { background: #22c55e20; color: #22c55e; }
            .method.patch { background: #f59e0b20; color: #f59e0b; }
            .method.delete { background: #ef444420; color: #ef4444; }
            .path { font-family: 'Monaco', 'Menlo', monospace; color: #e4e4e7; }
            .description { color: #71717a; margin-top: 8px; }
            .section { margin-bottom: 48px; }
            .features {
              display: grid;
              grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
              gap: 20px;
              margin: 40px 0;
            }
            .feature {
              background: #18181b;
              border: 1px solid #27272a;
              border-radius: 8px;
              padding: 24px;
            }
            .feature h4 { color: #22c55e; margin-bottom: 8px; }
            .feature p { color: #71717a; font-size: 14px; }
            code {
              background: #27272a;
              padding: 2px 6px;
              border-radius: 4px;
              font-family: 'Monaco', 'Menlo', monospace;
              font-size: 14px;
            }
            pre {
              background: #0f0f13;
              border: 1px solid #27272a;
              border-radius: 8px;
              padding: 16px;
              overflow-x: auto;
              margin: 16px 0;
            }
            pre code { background: none; padding: 0; }
            a { color: #22c55e; text-decoration: none; }
            a:hover { text-decoration: underline; }
            .footer { margin-top: 60px; padding-top: 40px; border-top: 1px solid #27272a; text-align: center; color: #52525b; }
          </style>
        </head>
        <body>
          <div class="container">
            <span class="badge">v0.4.7</span>
            <h1>Fiyuu Work API</h1>
            <h2>Full-featured Task Management SaaS Backend</h2>
            
            <p>This is a demonstration backend showcasing all Fiyuu framework capabilities:</p>
            
            <div class="features">
              <div class="feature">
                <h4>🔐 Authentication</h4>
                <p>JWT-based auth with password hashing, token refresh, and protected routes</p>
              </div>
              <div class="feature">
                <h4>🏢 Multi-tenant Workspaces</h4>
                <p>Role-based access control with admin, member, and viewer roles</p>
              </div>
              <div class="feature">
                <h4>📊 Projects & Tasks</h4>
                <p>Full CRUD with status tracking, priorities, assignments, and comments</p>
              </div>
              <div class="feature">
                <h4>🔔 Real-time Notifications</h4>
                <p>WebSocket-powered live updates and notification system</p>
              </div>
              <div class="feature">
                <h4>⚡ Background Services</h4>
                <p>Scheduled tasks with cron jobs and activity logging</p>
              </div>
              <div class="feature">
                <h4>🗄️ F1 Database</h4>
                <p>Built-in database with transactions, indexes, and migrations</p>
              </div>
            </div>
            
            <div class="section">
              <h3>Authentication</h3>
              
              <div class="endpoint">
                <span class="method post">POST</span>
                <span class="path">/api/auth</span>
                <div class="description">Register or login with { action: "register" | "login", name?, email, password }</div>
              </div>
              
              <div class="endpoint">
                <span class="method get">GET</span>
                <span class="path">/api/auth/me</span>
                <div class="description">Get current user profile (requires Bearer token)</div>
              </div>
              
              <div class="endpoint">
                <span class="method patch">PATCH</span>
                <span class="path">/api/auth/me</span>
                <div class="description">Update profile (requires Bearer token)</div>
              </div>
            </div>
            
            <div class="section">
              <h3>Workspaces</h3>
              
              <div class="endpoint">
                <span class="method get">GET</span>
                <span class="path">/api/workspaces</span>
                <div class="description">List user's workspaces</div>
              </div>
              
              <div class="endpoint">
                <span class="method post">POST</span>
                <span class="path">/api/workspaces</span>
                <div class="description">Create new workspace</div>
              </div>
              
              <div class="endpoint">
                <span class="method get">GET</span>
                <span class="path">/api/workspaces/:id</span>
                <div class="description">Get workspace with members and projects</div>
              </div>
              
              <div class="endpoint">
                <span class="method patch">PATCH</span>
                <span class="path">/api/workspaces/:id</span>
                <div class="description">Update workspace (admin only)</div>
              </div>
              
              <div class="endpoint">
                <span class="method delete">DELETE</span>
                <span class="path">/api/workspaces/:id</span>
                <div class="description">Delete workspace (admin only)</div>
              </div>
            </div>
            
            <div class="section">
              <h3>Workspace Members</h3>
              
              <div class="endpoint">
                <span class="method post">POST</span>
                <span class="path">/api/workspaces/:id/members</span>
                <div class="description">Invite member by email</div>
              </div>
              
              <div class="endpoint">
                <span class="method patch">PATCH</span>
                <span class="path">/api/workspaces/:id/members?userId=xxx</span>
                <div class="description">Update member role</div>
              </div>
              
              <div class="endpoint">
                <span class="method delete">DELETE</span>
                <span class="path">/api/workspaces/:id/members?userId=xxx</span>
                <div class="description">Remove member</div>
              </div>
            </div>
            
            <div class="section">
              <h3>Projects</h3>
              
              <div class="endpoint">
                <span class="method get">GET</span>
                <span class="path">/api/projects?workspaceId=xxx</span>
                <div class="description">List workspace projects</div>
              </div>
              
              <div class="endpoint">
                <span class="method post">POST</span>
                <span class="path">/api/projects</span>
                <div class="description">Create project</div>
              </div>
            </div>
            
            <div class="section">
              <h3>Tasks</h3>
              
              <div class="endpoint">
                <span class="method get">GET</span>
                <span class="path">/api/tasks?workspaceId=xxx&status=&assigneeId=</span>
                <div class="description">List tasks with filters and stats</div>
              </div>
              
              <div class="endpoint">
                <span class="method post">POST</span>
                <span class="path">/api/tasks</span>
                <div class="description">Create task</div>
              </div>
              
              <div class="endpoint">
                <span class="method get">GET</span>
                <span class="path">/api/tasks/:id</span>
                <div class="description">Get task with comments</div>
              </div>
              
              <div class="endpoint">
                <span class="method patch">PATCH</span>
                <span class="path">/api/tasks/:id</span>
                <div class="description">Update task</div>
              </div>
              
              <div class="endpoint">
                <span class="method delete">DELETE</span>
                <span class="path">/api/tasks/:id</span>
                <div class="description">Delete task</div>
              </div>
            </div>
            
            <div class="section">
              <h3>Comments</h3>
              
              <div class="endpoint">
                <span class="method post">POST</span>
                <span class="path">/api/tasks/:id/comments</span>
                <div class="description">Add comment to task</div>
              </div>
            </div>
            
            <div class="section">
              <h3>Notifications</h3>
              
              <div class="endpoint">
                <span class="method get">GET</span>
                <span class="path">/api/notifications?unread=true</span>
                <div class="description">Get notifications</div>
              </div>
              
              <div class="endpoint">
                <span class="method post">POST</span>
                <span class="path">/api/notifications</span>
                <div class="description">Mark as read (action: "markAllRead" or notificationId)</div>
              </div>
            </div>
            
            <div class="section">
              <h3>Uploads</h3>
              
              <div class="endpoint">
                <span class="method post">POST</span>
                <span class="path">/api/uploads</span>
                <div class="description">Upload file (multipart/form-data)</div>
              </div>
            </div>
            
            <div class="section">
              <h3>WebSocket</h3>
              <p>Connect to <code>ws://localhost:4051/notifications?token=JWT</code> for real-time updates.</p>
              <pre><code>// Join workspace
{ "event": "join-workspace", "data": { "workspaceId": "xxx" } }

// Typing indicator
{ "event": "typing", "data": { "workspaceId": "xxx", "taskId": "xxx", "isTyping": true } }

// Task update
{ "event": "task-update", "data": { "workspaceId": "xxx", "task": {...} } }</code></pre>
            </div>
            
            <div class="section">
              <h3>Quick Start</h3>
              <pre><code># 1. Register
curl -X POST http://localhost:4050/api/auth \\
  -H "Content-Type: application/json" \\
  -d '{"action":"register","name":"John","email":"john@example.com","password":"password"}'

# 2. Create workspace
curl -X POST http://localhost:4050/api/workspaces \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer TOKEN" \\
  -d '{"name":"My Team","description":"Our workspace"}'

# 3. Create project
curl -X POST http://localhost:4050/api/projects \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer TOKEN" \\
  -d '{"name":"Website Redesign","workspaceId":"xxx"}'

# 4. Create task
curl -X POST http://localhost:4050/api/tasks \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer TOKEN" \\
  -d '{"title":"Design homepage","projectId":"xxx","workspaceId":"xxx"}'</code></pre>
            </div>
            
            <div class="footer">
              <p>Built with <a href="https://github.com/hacimertgokhan/fiyuu">Fiyuu Framework</a></p>
              <p>Demonstrates: @Controller, @Service, @Repository, @Guard, F1 Database, WebSocket, Background Services</p>
            </div>
          </div>
        </body>
      </html>
    `;
  }
}
