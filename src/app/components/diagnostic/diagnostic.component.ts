import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  BoardNavigationDiagnostic,
  DiagnosticResult,
} from '../../services/board-navigation-diagnostic.service';

@Component({
  selector: 'app-diagnostic',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="diagnostic-container">
      <div class="diagnostic-header">
        <h2>🔍 Diagnóstico de Navegação do Board</h2>
        <p>Ferramenta para identificar problemas no fluxo de navegação</p>
      </div>

      <div class="diagnostic-form">
        <div class="form-group">
          <label for="boardId">ID do Board para testar:</label>
          <input
            id="boardId"
            type="number"
            [(ngModel)]="testBoardId"
            class="form-control"
            placeholder="Digite o ID do board (ex: 1)"
          />
        </div>

        <button
          class="btn btn-primary"
          (click)="runDiagnostic()"
          [disabled]="isRunning"
        >
          {{ isRunning ? 'Executando...' : 'Executar Diagnóstico' }}
        </button>
      </div>

      <div class="diagnostic-results" *ngIf="results.length > 0">
        <div class="results-summary">
          <h3>📊 Resumo</h3>
          <div class="summary-cards">
            <div class="summary-card success">
              <div class="count">{{ getSuccessCount() }}</div>
              <div class="label">Sucessos</div>
            </div>
            <div class="summary-card warning">
              <div class="count">{{ getWarningCount() }}</div>
              <div class="label">Avisos</div>
            </div>
            <div class="summary-card error">
              <div class="count">{{ getErrorCount() }}</div>
              <div class="label">Erros</div>
            </div>
          </div>
        </div>

        <div class="results-details">
          <h3>📋 Detalhes</h3>

          <div class="filter-buttons">
            <button
              class="btn btn-sm"
              [class.active]="filter === 'all'"
              (click)="filter = 'all'"
            >
              Todos
            </button>
            <button
              class="btn btn-sm"
              [class.active]="filter === 'error'"
              (click)="filter = 'error'"
            >
              Apenas Erros
            </button>
            <button
              class="btn btn-sm"
              [class.active]="filter === 'warning'"
              (click)="filter = 'warning'"
            >
              Apenas Avisos
            </button>
          </div>

          <div class="results-list">
            <div
              class="result-item"
              [class]="result.status"
              *ngFor="let result of getFilteredResults()"
            >
              <div class="result-header">
                <span class="result-icon">
                  {{
                    result.status === 'success'
                      ? '✅'
                      : result.status === 'error'
                      ? '❌'
                      : '⚠️'
                  }}
                </span>
                <span class="result-step">{{ result.step }}</span>
                <span class="result-timestamp">{{
                  formatTime(result.timestamp)
                }}</span>
              </div>
              <div class="result-message">{{ result.message }}</div>
              <div class="result-data" *ngIf="result.data">
                <details>
                  <summary>Ver dados</summary>
                  <pre>{{ formatData(result.data) }}</pre>
                </details>
              </div>
            </div>
          </div>
        </div>

        <div
          class="diagnostic-tips"
          *ngIf="getErrorCount() > 0 || getWarningCount() > 0"
        >
          <h3>💡 Dicas de Solução</h3>
          <div class="tips-list">
            <div class="tip" *ngFor="let tip of getTips()">
              <strong>{{ tip.problem }}:</strong> {{ tip.solution }}
            </div>
          </div>
        </div>
      </div>

      <div class="diagnostic-help">
        <h3>❓ Como usar</h3>
        <ol>
          <li>Digite o ID de um board que você quer testar (ex: 1)</li>
          <li>Clique em "Executar Diagnóstico"</li>
          <li>Analise os resultados para identificar problemas</li>
          <li>
            Use as dicas de solução para corrigir os problemas encontrados
          </li>
        </ol>

        <h4>🔍 O que é testado:</h4>
        <ul>
          <li>✅ Disponibilidade do Router</li>
          <li>✅ Disponibilidade do KanbanService</li>
          <li>✅ Conexão com a API GraphQL</li>
          <li>✅ Busca específica do board</li>
          <li>✅ Estrutura dos dados retornados</li>
          <li>✅ Funcionamento da navegação</li>
        </ul>
      </div>
    </div>
  `,
  styles: [
    `
      .diagnostic-container {
        padding: 20px;
        max-width: 1000px;
        margin: 0 auto;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto,
          sans-serif;
      }

      .diagnostic-header {
        text-align: center;
        margin-bottom: 30px;

        h2 {
          color: #333;
          margin-bottom: 10px;
        }

        p {
          color: #666;
          margin: 0;
        }
      }

      .diagnostic-form {
        background: #f8f9fa;
        padding: 20px;
        border-radius: 8px;
        margin-bottom: 30px;

        .form-group {
          margin-bottom: 15px;

          label {
            display: block;
            margin-bottom: 5px;
            font-weight: 500;
          }
        }
      }

      .form-control {
        width: 200px;
        padding: 8px 12px;
        border: 1px solid #ced4da;
        border-radius: 4px;
        font-size: 14px;
      }

      .btn {
        padding: 10px 20px;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        font-weight: 500;
        transition: all 0.2s;

        &.btn-primary {
          background: #007bff;
          color: white;

          &:hover:not(:disabled) {
            background: #0056b3;
          }

          &:disabled {
            background: #6c757d;
            cursor: not-allowed;
          }
        }

        &.btn-sm {
          padding: 5px 10px;
          font-size: 12px;
          margin-right: 5px;
          background: #e9ecef;
          color: #495057;

          &.active {
            background: #007bff;
            color: white;
          }
        }
      }

      .summary-cards {
        display: flex;
        gap: 15px;
        margin-top: 15px;
      }

      .summary-card {
        padding: 15px;
        border-radius: 8px;
        text-align: center;
        flex: 1;

        .count {
          font-size: 24px;
          font-weight: bold;
          margin-bottom: 5px;
        }

        .label {
          font-size: 12px;
          text-transform: uppercase;
        }

        &.success {
          background: #d4edda;
          color: #155724;
        }

        &.warning {
          background: #fff3cd;
          color: #856404;
        }

        &.error {
          background: #f8d7da;
          color: #721c24;
        }
      }

      .filter-buttons {
        margin: 15px 0;
      }

      .results-list {
        space-y: 10px;
      }

      .result-item {
        border: 1px solid #e9ecef;
        border-radius: 6px;
        padding: 15px;
        margin-bottom: 10px;

        &.success {
          border-left: 4px solid #28a745;
          background: #f8fff9;
        }

        &.warning {
          border-left: 4px solid #ffc107;
          background: #fffef7;
        }

        &.error {
          border-left: 4px solid #dc3545;
          background: #fff8f8;
        }
      }

      .result-header {
        display: flex;
        align-items: center;
        gap: 10px;
        margin-bottom: 8px;

        .result-step {
          font-weight: 600;
          flex: 1;
        }

        .result-timestamp {
          font-size: 12px;
          color: #666;
        }
      }

      .result-message {
        color: #333;
        margin-bottom: 10px;
      }

      .result-data {
        details {
          cursor: pointer;

          summary {
            font-size: 12px;
            color: #666;
            margin-bottom: 5px;
          }

          pre {
            background: #f1f3f4;
            padding: 10px;
            border-radius: 4px;
            font-size: 11px;
            overflow-x: auto;
            margin: 5px 0 0 0;
          }
        }
      }

      .diagnostic-tips {
        background: #e7f3ff;
        padding: 20px;
        border-radius: 8px;
        margin-top: 20px;

        .tip {
          margin-bottom: 10px;
          padding: 10px;
          background: white;
          border-radius: 4px;

          strong {
            color: #0066cc;
          }
        }
      }

      .diagnostic-help {
        background: #f8f9fa;
        padding: 20px;
        border-radius: 8px;
        margin-top: 30px;

        h3,
        h4 {
          color: #333;
          margin-top: 0;
        }

        ol,
        ul {
          padding-left: 20px;

          li {
            margin-bottom: 5px;
          }
        }
      }
    `,
  ],
})
export class DiagnosticComponent {
  testBoardId: number = 1;
  isRunning = false;
  results: DiagnosticResult[] = [];
  filter: 'all' | 'error' | 'warning' = 'all';

  constructor(private diagnostic: BoardNavigationDiagnostic) {}

  async runDiagnostic() {
    if (!this.testBoardId) {
      alert('Por favor, digite um ID de board válido');
      return;
    }

    this.isRunning = true;
    this.results = [];

    try {
      this.results = await this.diagnostic.runDiagnostic(this.testBoardId);
    } catch (error) {
      console.error('Erro ao executar diagnóstico:', error);
    } finally {
      this.isRunning = false;
    }
  }

  getSuccessCount(): number {
    return this.results.filter((r) => r.status === 'success').length;
  }

  getWarningCount(): number {
    return this.results.filter((r) => r.status === 'warning').length;
  }

  getErrorCount(): number {
    return this.results.filter((r) => r.status === 'error').length;
  }

  getFilteredResults(): DiagnosticResult[] {
    if (this.filter === 'all') return this.results;
    return this.results.filter((r) => r.status === this.filter);
  }

  formatTime(timestamp: Date): string {
    return timestamp.toLocaleTimeString();
  }

  formatData(data: any): string {
    return JSON.stringify(data, null, 2);
  }

  getTips(): Array<{ problem: string; solution: string }> {
    const tips = [];

    const hasApiError = this.results.some(
      (r) => r.step === 'API Connection' && r.status === 'error'
    );
    const hasTimeoutError = this.results.some((r) =>
      r.message.includes('Timeout')
    );
    const hasNetworkError = this.results.some((r) =>
      r.message.includes('rede')
    );
    const hasBoardNotFound = this.results.some(
      (r) => r.step === 'Board Retrieval' && r.status === 'error'
    );
    const hasDataStructureIssues = this.results.some(
      (r) => r.step === 'Data Validation' && r.status === 'warning'
    );

    if (hasApiError) {
      tips.push({
        problem: 'Erro de conexão com API',
        solution:
          'Verifique se a API está rodando em http://localhost:3000/graphql e se o CORS está configurado corretamente',
      });
    }

    if (hasTimeoutError) {
      tips.push({
        problem: 'Timeout na API',
        solution:
          'A API pode estar lenta ou sobrecarregada. Verifique logs do servidor e otimize queries',
      });
    }

    if (hasNetworkError) {
      tips.push({
        problem: 'Erro de rede',
        solution:
          'Verifique sua conexão de internet e se não há proxy/firewall bloqueando a requisição',
      });
    }

    if (hasBoardNotFound) {
      tips.push({
        problem: 'Board não encontrado',
        solution:
          'Verifique se o ID do board existe no banco de dados e se a query GraphQL está correta',
      });
    }

    if (hasDataStructureIssues) {
      tips.push({
        problem: 'Problemas na estrutura dos dados',
        solution:
          'Verifique se a API está retornando todos os campos obrigatórios conforme definido nos models',
      });
    }

    return tips;
  }
}
