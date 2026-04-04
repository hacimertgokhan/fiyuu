import { Component } from "@geajs/core";
import { html } from "@fiyuu/core/client";

export default class ReportsPage extends Component {
  template() {
    return html`
      <div class="page-header">
        <h1 class="page-title">Raporlar</h1>
        <p class="page-subtitle">Stok hareketleri ve performans raporları</p>
      </div>
      
      <div class="card">
        <h2>Stok Durumu Raporu</h2>
        <p>Bu özellik yakında eklenecek.</p>
      </div>
    `;
  }
}