import { Component } from "@geajs/core";
import { definePage, html, raw, type PageProps } from "@fiyuu/core/client";

export const page = definePage({ intent: "Fiyuu framework documentation" });

export default class DocsPage extends Component<PageProps> {
  template() {
    return html`
      <div style="max-width:1200px; margin:0 auto; padding:120px 24px;">
        <div style="margin-bottom:60px;">
          <h1 style="font-family:'Bricolage Grotesque',sans-serif; font-size:48px; font-weight:800; color:var(--text); margin-bottom:16px;">
            Documentation
          </h1>
          <p style="font-size:16px; color:var(--text-secondary); line-height:1.7; max-width:600px;">
            Complete guides for building with Fiyuu. From routing to real-time communication.
          </p>
        </div>

        <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(300px, 1fr)); gap:20px; margin-bottom:80px;">
          <!-- Getting Started -->
          <a href="#getting-started" style="text-decoration:none;">
            <div class="bp-card" style="padding:32px; cursor:pointer;">
              <div style="font-family:'JetBrains Mono',monospace; font-size:24px; color:var(--accent); margin-bottom:12px;">→</div>
              <h3 style="font-size:16px; font-weight:600; color:var(--text); margin-bottom:8px;">Getting Started</h3>
              <p style="font-size:13px; color:var(--text-secondary); line-height:1.6;">Installation, project structure, and your first route.</p>
            </div>
          </a>

          <!-- Backend Patterns -->
          <a href="#backend-patterns" style="text-decoration:none;">
            <div class="bp-card" style="padding:32px; cursor:pointer;">
              <div style="font-family:'JetBrains Mono',monospace; font-size:24px; color:var(--accent); margin-bottom:12px;">@</div>
              <h3 style="font-size:16px; font-weight:600; color:var(--text); margin-bottom:8px;">Backend Patterns</h3>
              <p style="font-size:13px; color:var(--text-secondary); line-height:1.6;">Controllers, Services, Repositories, Guards, and Dependency Injection.</p>
            </div>
          </a>

          <!-- Database -->
          <a href="#database" style="text-decoration:none;">
            <div class="bp-card" style="padding:32px; cursor:pointer;">
              <div style="font-family:'JetBrains Mono',monospace; font-size:24px; color:var(--accent); margin-bottom:12px;">◆</div>
              <h3 style="font-size:16px; font-weight:600; color:var(--text); margin-bottom:8px;">Database</h3>
              <p style="font-size:13px; color:var(--text-secondary); line-height:1.6;">F1 DB, queries, indexing, transactions, and migrations.</p>
            </div>
          </a>

          <!-- Components -->
          <a href="#components" style="text-decoration:none;">
            <div class="bp-card" style="padding:32px; cursor:pointer;">
              <div style="font-family:'JetBrains Mono',monospace; font-size:24px; color:var(--accent); margin-bottom:12px;">◇</div>
              <h3 style="font-size:16px; font-weight:600; color:var(--text); margin-bottom:8px;">Components</h3>
              <p style="font-size:13px; color:var(--text-secondary); line-height:1.6;">FiyuuImage, Video, Link, Head — optimized and lazy-loaded.</p>
            </div>
          </a>

          <!-- Real-Time -->
          <a href="#realtime" style="text-decoration:none;">
            <div class="bp-card" style="padding:32px; cursor:pointer;">
              <div style="font-family:'JetBrains Mono',monospace; font-size:24px; color:var(--accent); margin-bottom:12px;">⟷</div>
              <h3 style="font-size:16px; font-weight:600; color:var(--text); margin-bottom:8px;">Real-Time</h3>
              <p style="font-size:13px; color:var(--text-secondary); line-height:1.6;">WebSocket rooms, NATS messaging, and live data streaming.</p>
            </div>
          </a>

          <!-- CLI -->
          <a href="#cli" style="text-decoration:none;">
            <div class="bp-card" style="padding:32px; cursor:pointer;">
              <div style="font-family:'JetBrains Mono',monospace; font-size:24px; color:var(--accent); margin-bottom:12px;">$</div>
              <h3 style="font-size:16px; font-weight:600; color:var(--text); margin-bottom:8px;">CLI Commands</h3>
              <p style="font-size:13px; color:var(--text-secondary); line-height:1.6;">fiyuu dev, build, start, sync, doctor, and more.</p>
            </div>
          </a>
        </div>

        <!-- Getting Started Section -->
        <section id="getting-started" style="margin-bottom:100px; padding-bottom:100px; border-bottom:1px solid var(--border-subtle);">
          <h2 style="font-family:'Bricolage Grotesque',sans-serif; font-size:32px; font-weight:700; color:var(--text); margin-bottom:32px;">Getting Started</h2>

          <div style="background:var(--bg-surface); border:1px solid var(--border-subtle); border-radius:2px; padding:32px; margin-bottom:32px;">
            <h3 style="font-size:14px; font-weight:600; color:var(--text); margin-bottom:16px; text-transform:uppercase; letter-spacing:0.05em;">Installation</h3>
            <div class="code-frame">
              <div class="code-frame-header">
                <span class="dot amber"></span>
                <span>bash</span>
              </div>
              <div class="code-frame-body">
                <pre>npm create fiyuu-app@latest my-app
cd my-app
npm install
npm run dev</pre>
              </div>
            </div>
          </div>

          <div style="margin-bottom:32px;">
            <h3 style="font-size:14px; font-weight:600; color:var(--text); margin-bottom:16px; text-transform:uppercase; letter-spacing:0.05em;">Project Structure</h3>
            <p style="color:var(--text-secondary); margin-bottom:16px; line-height:1.7;">Every route is a folder with deterministic files:</p>
            <div class="code-frame">
              <div class="code-frame-header">
                <span class="dot amber"></span>
                <span>file structure</span>
              </div>
              <div class="code-frame-body">
                <pre>app/
├── page.tsx       # User interface (GEA Component)
├── query.ts       # Server-side data fetching
├── action.ts      # Server-side mutations
├── schema.ts      # Zod types for validation
└── meta.ts        # SEO, render mode, metadata</pre>
              </div>
            </div>
          </div>
        </section>

        <!-- Backend Patterns Section -->
        <section id="backend-patterns" style="margin-bottom:100px; padding-bottom:100px; border-bottom:1px solid var(--border-subtle);">
          <h2 style="font-family:'Bricolage Grotesque',sans-serif; font-size:32px; font-weight:700; color:var(--text); margin-bottom:32px;">Backend Patterns</h2>

          <div style="margin-bottom:40px;">
            <h3 style="font-size:16px; font-weight:600; color:var(--text); margin-bottom:16px;">Spring Boot Style Decorators</h3>
            <p style="color:var(--text-secondary); margin-bottom:24px; line-height:1.7;">
              Fiyuu uses TypeScript decorators for a familiar, enterprise-like API. Define controllers with routes, services with business logic, and repositories for data access.
            </p>
          </div>

          <!-- Controller Example -->
          <div style="margin-bottom:40px;">
            <h4 style="font-size:13px; font-weight:600; color:var(--accent); margin-bottom:12px; text-transform:uppercase; letter-spacing:0.05em;">@Controller</h4>
            <div class="code-frame">
              <div class="code-frame-header">
                <span class="dot amber"></span>
                <span>src/api/user.controller.ts</span>
              </div>
              <div class="code-frame-body">
                <pre><span class="kw">import</span> { Controller, Get, Post, Body, Param } <span class="kw">from</span> <span class="str">'@fiyuu/core'</span>;
<span class="kw">import</span> { UserService } <span class="kw">from</span> <span class="str">'./user.service'</span>;

<span class="fn">@Controller</span>(<span class="str">'/api/users'</span>)
<span class="kw">class</span> UserController {
  <span class="fn">constructor</span>(<span class="kw">private</span> userService: UserService) {}

  <span class="fn">@Get</span>()
  <span class="kw">async</span> <span class="fn">list</span>() {
    <span class="kw">return</span> <span class="kw">await</span> <span class="kw">this</span>.userService.<span class="fn">findAll</span>();
  }

  <span class="fn">@Get</span>(<span class="str">'/:id'</span>)
  <span class="kw">async</span> <span class="fn">getById</span>(<span class="fn">@Param</span>(<span class="str">'id'</span>) id: <span class="tp">string</span>) {
    <span class="kw">return</span> <span class="kw">await</span> <span class="kw">this</span>.userService.<span class="fn">findById</span>(id);
  }

  <span class="fn">@Post</span>()
  <span class="kw">async</span> <span class="fn">create</span>(<span class="fn">@Body</span>() dto: <span class="tp">CreateUserDTO</span>) {
    <span class="kw">return</span> <span class="kw">await</span> <span class="kw">this</span>.userService.<span class="fn">create</span>(dto);
  }
}</pre>
              </div>
            </div>
          </div>

          <!-- Service Example -->
          <div style="margin-bottom:40px;">
            <h4 style="font-size:13px; font-weight:600; color:var(--accent); margin-bottom:12px; text-transform:uppercase; letter-spacing:0.05em;">@Service</h4>
            <div class="code-frame">
              <div class="code-frame-header">
                <span class="dot amber"></span>
                <span>src/api/user.service.ts</span>
              </div>
              <div class="code-frame-body">
                <pre><span class="kw">import</span> { Service } <span class="kw">from</span> <span class="str">'@fiyuu/core'</span>;
<span class="kw">import</span> { UserRepository } <span class="kw">from</span> <span class="str">'./user.repository'</span>;

<span class="fn">@Service</span>()
<span class="kw">class</span> UserService {
  <span class="fn">constructor</span>(<span class="kw">private</span> userRepo: UserRepository) {}

  <span class="kw">async</span> <span class="fn">findAll</span>() {
    <span class="kw">return</span> <span class="kw">this</span>.userRepo.<span class="fn">findAll</span>();
  }

  <span class="kw">async</span> <span class="fn">findById</span>(id: <span class="tp">string</span>) {
    <span class="kw">return</span> <span class="kw">this</span>.userRepo.<span class="fn">findById</span>(id);
  }

  <span class="kw">async</span> <span class="fn">create</span>(data: <span class="tp">CreateUserDTO</span>) {
    <span class="kw">return</span> <span class="kw">this</span>.userRepo.<span class="fn">save</span>(data);
  }
}</pre>
              </div>
            </div>
          </div>

          <!-- Repository Example -->
          <div style="margin-bottom:40px;">
            <h4 style="font-size:13px; font-weight:600; color:var(--accent); margin-bottom:12px; text-transform:uppercase; letter-spacing:0.05em;">@Repository</h4>
            <div class="code-frame">
              <div class="code-frame-header">
                <span class="dot amber"></span>
                <span>src/api/user.repository.ts</span>
              </div>
              <div class="code-frame-body">
                <pre><span class="kw">import</span> { Repository } <span class="kw">from</span> <span class="str">'@fiyuu/core'</span>;
<span class="kw">import</span> { db } <span class="kw">from</span> <span class="str">'@fiyuu/db'</span>;

<span class="fn">@Repository</span>(<span class="str">'users'</span>)
<span class="kw">class</span> UserRepository {
  <span class="kw">async</span> <span class="fn">findAll</span>() {
    <span class="kw">return</span> <span class="kw">await</span> db.<span class="fn">table</span>(<span class="str">'users'</span>).<span class="fn">find</span>();
  }

  <span class="kw">async</span> <span class="fn">findById</span>(id: <span class="tp">string</span>) {
    <span class="kw">return</span> <span class="kw">await</span> db.<span class="fn">table</span>(<span class="str">'users'</span>).<span class="fn">findOne</span>({ _id: id });
  }

  <span class="kw">async</span> <span class="fn">save</span>(user: <span class="tp">User</span>) {
    <span class="kw">return</span> <span class="kw">await</span> db.<span class="fn">table</span>(<span class="str">'users'</span>).<span class="fn">insert</span>(user);
  }
}</pre>
              </div>
            </div>
          </div>

          <!-- Scheduled Tasks -->
          <div style="margin-bottom:40px;">
            <h4 style="font-size:13px; font-weight:600; color:var(--accent); margin-bottom:12px; text-transform:uppercase; letter-spacing:0.05em;">@Scheduled</h4>
            <div class="code-frame">
              <div class="code-frame-header">
                <span class="dot amber"></span>
                <span>src/services/task.service.ts</span>
              </div>
              <div class="code-frame-body">
                <pre><span class="fn">@Service</span>()
<span class="kw">class</span> TaskService {
  <span class="fn">@Scheduled</span>(<span class="str">'*/5 * * * *'</span>) <span class="cm">// Every 5 minutes</span>
  <span class="kw">async</span> <span class="fn">cleanupExpiredSessions</span>() {
    <span class="cm">// Clean up logic</span>
  }

  <span class="fn">@Scheduled</span>(<span class="str">'0 0 * * *'</span>) <span class="cm">// Every night</span>
  <span class="kw">async</span> <span class="fn">generateDailyReport</span>() {
    <span class="cm">// Report generation</span>
  }
}</pre>
              </div>
            </div>
          </div>
        </section>

        <!-- Database Section -->
        <section id="database" style="margin-bottom:100px; padding-bottom:100px; border-bottom:1px solid var(--border-subtle);">
          <h2 style="font-family:'Bricolage Grotesque',sans-serif; font-size:32px; font-weight:700; color:var(--text); margin-bottom:32px;">Database</h2>

          <div style="margin-bottom:40px;">
            <h3 style="font-size:16px; font-weight:600; color:var(--text); margin-bottom:16px;">F1 Database Features</h3>
            <ul style="color:var(--text-secondary); line-height:1.8; margin-bottom:24px;">
              <li>• <strong>Indexing</strong> — Hash-based indexes for fast queries</li>
              <li>• <strong>Transactions</strong> — ACID transactions with automatic rollback</li>
              <li>• <strong>Migrations</strong> — Version your schema with migrations</li>
              <li>• <strong>Relations</strong> — One-to-many and many-to-many relationships</li>
              <li>• <strong>Aggregations</strong> — GROUP BY, COUNT, SUM, AVG</li>
            </ul>
          </div>

          <div style="margin-bottom:40px;">
            <h4 style="font-size:13px; font-weight:600; color:var(--accent); margin-bottom:12px; text-transform:uppercase; letter-spacing:0.05em;">Basic Queries</h4>
            <div class="code-frame">
              <div class="code-frame-header">
                <span class="dot amber"></span>
                <span>src/queries.ts</span>
              </div>
              <div class="code-frame-body">
                <pre><span class="kw">import</span> { db } <span class="kw">from</span> <span class="str">'@fiyuu/db'</span>;

<span class="cm">// Insert</span>
<span class="kw">const</span> user = <span class="kw">await</span> db.<span class="fn">table</span>(<span class="str">'users'</span>).<span class="fn">insert</span>({
  name: <span class="str">'Ali'</span>,
  email: <span class="str">'ali@example.com'</span>
});

<span class="cm">// Find all</span>
<span class="kw">const</span> users = <span class="kw">await</span> db.<span class="fn">table</span>(<span class="str">'users'</span>).<span class="fn">find</span>();

<span class="cm">// Find one</span>
<span class="kw">const</span> user = <span class="kw">await</span> db.<span class="fn">table</span>(<span class="str">'users'</span>).<span class="fn">findOne</span>({ email: <span class="str">'ali@example.com'</span> });

<span class="cm">// Update</span>
<span class="kw">await</span> db.<span class="fn">table</span>(<span class="str">'users'</span>).<span class="fn">update</span>({ _id: <span class="str">'123'</span> }, { name: <span class="str">'Ayşe'</span> });

<span class="cm">// Delete</span>
<span class="kw">await</span> db.<span class="fn">table</span>(<span class="str">'users'</span>).<span class="fn">delete</span>({ _id: <span class="str">'123'</span> });</pre>
              </div>
            </div>
          </div>

          <div style="margin-bottom:40px;">
            <h4 style="font-size:13px; font-weight:600; color:var(--accent); margin-bottom:12px; text-transform:uppercase; letter-spacing:0.05em;">Transactions</h4>
            <div class="code-frame">
              <div class="code-frame-header">
                <span class="dot amber"></span>
                <span>src/transactions.ts</span>
              </div>
              <div class="code-frame-body">
                <pre><span class="kw">await</span> db.<span class="fn">transaction</span>(<span class="kw">async</span> (tx) => {
  <span class="cm">// All operations auto-rollback on error</span>
  <span class="kw">const</span> user = <span class="kw">await</span> tx.<span class="fn">table</span>(<span class="str">'users'</span>).<span class="fn">insert</span>({
    name: <span class="str">'Ali'</span>,
    email: <span class="str">'ali@example.com'</span>
  });

  <span class="kw">await</span> tx.<span class="fn">table</span>(<span class="str">'profiles'</span>).<span class="fn">insert</span>({
    userId: user._id,
    bio: <span class="str">'Hello'</span>
  });
});</pre>
              </div>
            </div>
          </div>

          <div style="margin-bottom:40px;">
            <h4 style="font-size:13px; font-weight:600; color:var(--accent); margin-bottom:12px; text-transform:uppercase; letter-spacing:0.05em;">Migrations</h4>
            <div class="code-frame">
              <div class="code-frame-header">
                <span class="dot amber"></span>
                <span>migrations/001_create_users.ts</span>
              </div>
              <div class="code-frame-body">
                <pre><span class="kw">import</span> { db } <span class="kw">from</span> <span class="str">'@fiyuu/db'</span>;

<span class="kw">export</span> <span class="kw">const</span> up = <span class="kw">async</span> () => {
  <span class="kw">await</span> db.<span class="fn">table</span>(<span class="str">'users'</span>).<span class="fn">insert</span>({
    _id: <span class="str">'users_table'</span>,
    name: { type: <span class="str">'string'</span> },
    email: { type: <span class="str">'string'</span>, unique: true }
  });
};

<span class="kw">export</span> <span class="kw">const</span> down = <span class="kw">async</span> () => {
  <span class="kw">await</span> db.<span class="fn">table</span>(<span class="str">'users'</span>).<span class="fn">drop</span>();
};</pre>
              </div>
            </div>
          </div>
        </section>

        <!-- Components Section -->
        <section id="components" style="margin-bottom:100px; padding-bottom:100px; border-bottom:1px solid var(--border-subtle);">
          <h2 style="font-family:'Bricolage Grotesque',sans-serif; font-size:32px; font-weight:700; color:var(--text); margin-bottom:32px;">Components</h2>

          <div style="margin-bottom:40px;">
            <h3 style="font-size:16px; font-weight:600; color:var(--text); margin-bottom:16px;">Built-In Optimized Components</h3>
            <p style="color:var(--text-secondary); margin-bottom:24px; line-height:1.7;">
              Fiyuu includes server-side rendered components optimized for performance, SEO, and user experience. All lazy-loaded, responsive, and CLS-free.
            </p>
          </div>

          <div style="margin-bottom:40px;">
            <h4 style="font-size:13px; font-weight:600; color:var(--accent); margin-bottom:12px; text-transform:uppercase; letter-spacing:0.05em;">FiyuuImage</h4>
            <p style="color:var(--text-secondary); margin-bottom:16px; line-height:1.7;">Automatic lazy loading, responsive srcset generation, blur-up placeholders, and CLS prevention via required dimensions.</p>
            <div class="code-frame">
              <div class="code-frame-header">
                <span class="dot amber"></span>
                <span>app/page.tsx</span>
              </div>
              <div class="code-frame-body">
                <pre><span class="kw">import</span> { FiyuuImage } <span class="kw">from</span> <span class="str">'@fiyuu/core/components'</span>;

<span class="kw">const</span> html = <span class="fn">FiyuuImage</span>({
  src: <span class="str">'/image.jpg'</span>,
  alt: <span class="str">'Hero'</span>,
  width: 1200,
  height: 600,
  placeholder: <span class="str">'blur'</span>, <span class="cm">// or 'color:#f0f0f0'</span>
  priority: false <span class="cm">// lazy load by default</span>
});</pre>
              </div>
            </div>
          </div>

          <div style="margin-bottom:40px;">
            <h4 style="font-size:13px; font-weight:600; color:var(--accent); margin-bottom:12px; text-transform:uppercase; letter-spacing:0.05em;">FiyuuVideo</h4>
            <p style="color:var(--text-secondary); margin-bottom:16px; line-height:1.7;">Lazy loading with automatic poster image, preload control, and adaptive bitrate hints.</p>
            <div class="code-frame">
              <div class="code-frame-header">
                <span class="dot amber"></span>
                <span>app/page.tsx</span>
              </div>
              <div class="code-frame-body">
                <pre><span class="kw">import</span> { FiyuuVideo } <span class="kw">from</span> <span class="str">'@fiyuu/core/components'</span>;

<span class="kw">const</span> html = <span class="fn">FiyuuVideo</span>({
  src: <span class="str">'/video.mp4'</span>,
  poster: <span class="str">'/poster.jpg'</span>,
  width: 1280,
  height: 720,
  lazy: true,
  preload: <span class="str">'none'</span>
});</pre>
              </div>
            </div>
          </div>

          <div style="margin-bottom:40px;">
            <h4 style="font-size:13px; font-weight:600; color:var(--accent); margin-bottom:12px; text-transform:uppercase; letter-spacing:0.05em;">FiyuuLink</h4>
            <p style="color:var(--text-secondary); margin-bottom:16px; line-height:1.7;">Client-side navigation with prefetch on hover, active state detection, and external link handling.</p>
            <div class="code-frame">
              <div class="code-frame-header">
                <span class="dot amber"></span>
                <span>app/page.tsx</span>
              </div>
              <div class="code-frame-body">
                <pre><span class="kw">import</span> { FiyuuLink } <span class="kw">from</span> <span class="str">'@fiyuu/core/components'</span>;

<span class="kw">const</span> html = <span class="fn">FiyuuLink</span>({
  href: <span class="str">'/about'</span>,
  children: <span class="str">'About Us'</span>,
  prefetch: true <span class="cm">// Prefetch on hover</span>
});</pre>
              </div>
            </div>
          </div>

          <div style="margin-bottom:40px;">
            <h4 style="font-size:13px; font-weight:600; color:var(--accent); margin-bottom:12px; text-transform:uppercase; letter-spacing:0.05em;">FiyuuHead</h4>
            <p style="color:var(--text-secondary); margin-bottom:16px; line-height:1.7;">Manage SEO meta tags, Open Graph, Twitter Card, and structured data in one place.</p>
            <div class="code-frame">
              <div class="code-frame-header">
                <span class="dot amber"></span>
                <span>app/page.tsx</span>
              </div>
              <div class="code-frame-body">
                <pre><span class="kw">import</span> { FiyuuHead } <span class="kw">from</span> <span class="str">'@fiyuu/core/components'</span>;

<span class="kw">const</span> html = <span class="fn">FiyuuHead</span>({
  title: <span class="str">'Fiyuu Framework'</span>,
  description: <span class="str">'The framework AI can read'</span>,
  image: <span class="str">'/og-image.jpg'</span>,
  url: <span class="str">'https://fiyuu.work'</span>,
  structuredData: { <span class="prop">@type</span>: <span class="str">'WebSite'</span> }
});</pre>
              </div>
            </div>
          </div>
        </section>

        <!-- Real-Time Section -->
        <section id="realtime" style="margin-bottom:100px; padding-bottom:100px; border-bottom:1px solid var(--border-subtle);">
          <h2 style="font-family:'Bricolage Grotesque',sans-serif; font-size:32px; font-weight:700; color:var(--text); margin-bottom:32px;">Real-Time Communication</h2>

          <div style="margin-bottom:40px;">
            <h3 style="font-size:16px; font-weight:600; color:var(--text); margin-bottom:16px;">WebSocket Rooms</h3>
            <p style="color:var(--text-secondary); margin-bottom:24px; line-height:1.7;">
              Built-in room management for chat applications, notifications, and live collaboration.
            </p>
            <div class="code-frame">
              <div class="code-frame-header">
                <span class="dot amber"></span>
                <span>src/websocket.ts</span>
              </div>
              <div class="code-frame-body">
                <pre><span class="kw">import</span> { realtime } <span class="kw">from</span> <span class="str">'@fiyuu/realtime'</span>;

<span class="cm">// Server: On new connection</span>
realtime.<span class="fn">on</span>(<span class="str">'connect'</span>, (socket) => {
  socket.<span class="fn">joinRoom</span>(<span class="str">'chat-room-1'</span>);
  socket.<span class="fn">toRoom</span>(<span class="str">'chat-room-1'</span>, <span class="str">'message'</span>, {
    user: <span class="str">'system'</span>,
    text: <span class="str">'User joined'</span>
  });
});

<span class="cm">// Server: Handle message</span>
realtime.<span class="fn">on</span>(<span class="str">'message'</span>, (socket, data) => {
  socket.<span class="fn">toRoom</span>(<span class="str">'chat-room-1'</span>, <span class="str">'message'</span>, data);
});</pre>
              </div>
            </div>
          </div>
        </section>

        <!-- CLI Section -->
        <section id="cli">
          <h2 style="font-family:'Bricolage Grotesque',sans-serif; font-size:32px; font-weight:700; color:var(--text); margin-bottom:32px;">CLI Commands</h2>

          <div style="display:grid; gap:20px;">
            <div style="background:var(--bg-surface); border:1px solid var(--border-subtle); border-radius:2px; padding:20px;">
              <div style="font-family:'JetBrains Mono',monospace; font-size:13px; color:var(--accent); margin-bottom:8px;">fiyuu dev</div>
              <p style="color:var(--text-secondary); font-size:13px; line-height:1.6;">Start development server with hot reload</p>
            </div>
            <div style="background:var(--bg-surface); border:1px solid var(--border-subtle); border-radius:2px; padding:20px;">
              <div style="font-family:'JetBrains Mono',monospace; font-size:13px; color:var(--accent); margin-bottom:8px;">fiyuu build</div>
              <p style="color:var(--text-secondary); font-size:13px; line-height:1.6;">Build project for production</p>
            </div>
            <div style="background:var(--bg-surface); border:1px solid var(--border-subtle); border-radius:2px; padding:20px;">
              <div style="font-family:'JetBrains Mono',monospace; font-size:13px; color:var(--accent); margin-bottom:8px;">fiyuu start</div>
              <p style="color:var(--text-secondary); font-size:13px; line-height:1.6;">Start production server</p>
            </div>
            <div style="background:var(--bg-surface); border:1px solid var(--border-subtle); border-radius:2px; padding:20px;">
              <div style="font-family:'JetBrains Mono',monospace; font-size:13px; color:var(--accent); margin-bottom:8px;">fiyuu sync</div>
              <p style="color:var(--text-secondary); font-size:13px; line-height:1.6;">Generate AI documentation and project graph</p>
            </div>
            <div style="background:var(--bg-surface); border:1px solid var(--border-subtle); border-radius:2px; padding:20px;">
              <div style="font-family:'JetBrains Mono',monospace; font-size:13px; color:var(--accent); margin-bottom:8px;">fiyuu doctor</div>
              <p style="color:var(--text-secondary); font-size:13px; line-height:1.6;">Validate project structure and detect issues</p>
            </div>
          </div>
        </section>
      </div>
    `;
  }
}
