import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { KanbanService } from '../services/kanban.service';

export interface DiagnosticResult {
  step: string;
  status: 'success' | 'error' | 'warning';
  message: string;
  data?: any;
  timestamp: Date;
}

@Injectable({
  providedIn: 'root',
})
export class BoardNavigationDiagnostic {
  private results: DiagnosticResult[] = [];

  constructor(private router: Router, private kanbanService: KanbanService) {}

  async runDiagnostic(boardId: number): Promise<DiagnosticResult[]> {
    this.results = [];

    console.log('🔍 Iniciando diagnóstico de navegação do board...');

    // 1. Verificar se o Router está disponível
    this.checkRouter();

    // 2. Verificar se o KanbanService está disponível
    this.checkKanbanService();

    // 3. Testar a conexão com a API
    await this.testApiConnection();

    // 4. Testar busca específica do board
    await this.testBoardRetrieval(boardId);

    // 5. Verificar estrutura dos dados
    await this.validateDataStructure(boardId);

    // 6. Testar navegação
    await this.testNavigation(boardId);

    this.printResults();
    return this.results;
  }

  private addResult(
    step: string,
    status: 'success' | 'error' | 'warning',
    message: string,
    data?: any
  ) {
    const result: DiagnosticResult = {
      step,
      status,
      message,
      data,
      timestamp: new Date(),
    };

    this.results.push(result);

    const emoji =
      status === 'success' ? '✅' : status === 'error' ? '❌' : '⚠️';
    console.log(`${emoji} [${step}] ${message}`, data || '');
  }

  private checkRouter() {
    try {
      if (this.router) {
        this.addResult('Router Check', 'success', 'Router está disponível');

        // Verificar rota atual
        const currentUrl = this.router.url;
        this.addResult(
          'Current Route',
          'success',
          `Rota atual: ${currentUrl}`,
          { url: currentUrl }
        );
      } else {
        this.addResult('Router Check', 'error', 'Router não está disponível');
      }
    } catch (error) {
      this.addResult(
        'Router Check',
        'error',
        'Erro ao verificar Router',
        error
      );
    }
  }

  private checkKanbanService() {
    try {
      if (this.kanbanService) {
        this.addResult(
          'Service Check',
          'success',
          'KanbanService está disponível'
        );

        // Verificar se os métodos existem
        if (typeof this.kanbanService.getBoard === 'function') {
          this.addResult(
            'Service Methods',
            'success',
            'Método getBoard está disponível'
          );
        } else {
          this.addResult(
            'Service Methods',
            'error',
            'Método getBoard não encontrado'
          );
        }
      } else {
        this.addResult(
          'Service Check',
          'error',
          'KanbanService não está disponível'
        );
      }
    } catch (error) {
      this.addResult(
        'Service Check',
        'error',
        'Erro ao verificar KanbanService',
        error
      );
    }
  }

  private async testApiConnection() {
    try {
      console.log('🌐 Testando conexão com API...');

      // Testar busca de boards (mais leve)
      const boards$ = this.kanbanService.getBoards();

      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Timeout')), 5000)
      );

      const boardsPromise = boards$.toPromise();

      const boards = await Promise.race([boardsPromise, timeoutPromise]);

      this.addResult(
        'API Connection',
        'success',
        'Conexão com API estabelecida',
        { boardCount: (boards as any[])?.length || 0 }
      );
    } catch (error: any) {
      if (error.message === 'Timeout') {
        this.addResult(
          'API Connection',
          'error',
          'Timeout na conexão com API (>5s)'
        );
      } else if (error.networkError) {
        this.addResult('API Connection', 'error', 'Erro de rede', {
          message: error.networkError.message,
          url: error.networkError.url,
        });
      } else {
        this.addResult(
          'API Connection',
          'error',
          'Erro na conexão com API',
          error
        );
      }
    }
  }

  private async testBoardRetrieval(boardId: number) {
    try {
      console.log(`📋 Testando busca do board ID: ${boardId}...`);

      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Timeout')), 5000)
      );

      const boardPromise = this.kanbanService.getBoard(boardId).toPromise();

      const board = await Promise.race([boardPromise, timeoutPromise]);

      if (board) {
        this.addResult(
          'Board Retrieval',
          'success',
          `Board ${boardId} encontrado`,
          {
            id: (board as any).id,
            name: (board as any).name,
            columnsCount: (board as any).columns?.length || 0,
          }
        );
      } else {
        this.addResult(
          'Board Retrieval',
          'warning',
          `Board ${boardId} retornado como null/undefined`
        );
      }
    } catch (error: any) {
      if (error.message === 'Timeout') {
        this.addResult(
          'Board Retrieval',
          'error',
          `Timeout ao buscar board ${boardId} (>5s)`
        );
      } else if (error.graphQLErrors?.length > 0) {
        this.addResult('Board Retrieval', 'error', 'Erro GraphQL', {
          errors: error.graphQLErrors.map((e: any) => e.message),
        });
      } else {
        this.addResult(
          'Board Retrieval',
          'error',
          `Erro ao buscar board ${boardId}`,
          error
        );
      }
    }
  }

  private async validateDataStructure(boardId: number) {
    try {
      console.log('🔍 Validando estrutura dos dados...');

      const board = await this.kanbanService.getBoard(boardId).toPromise();

      if (!board) {
        this.addResult(
          'Data Validation',
          'error',
          'Board não encontrado para validação'
        );
        return;
      }

      const issues: string[] = [];

      // Validar propriedades obrigatórias do board
      if (!board.id) issues.push('Board.id está ausente');
      if (!board.name) issues.push('Board.name está ausente');
      if (!Array.isArray(board.columns))
        issues.push('Board.columns não é um array');

      // Validar colunas
      if (board.columns) {
        board.columns.forEach((column, index) => {
          if (!column.id) issues.push(`Column[${index}].id está ausente`);
          if (!column.title) issues.push(`Column[${index}].title está ausente`);
          if (!Array.isArray(column.cards))
            issues.push(`Column[${index}].cards não é um array`);

          // Validar cards
          if (column.cards) {
            column.cards.forEach((card, cardIndex) => {
              if (!card.id)
                issues.push(
                  `Column[${index}].cards[${cardIndex}].id está ausente`
                );
              if (!card.title)
                issues.push(
                  `Column[${index}].cards[${cardIndex}].title está ausente`
                );
            });
          }
        });
      }

      if (issues.length === 0) {
        this.addResult(
          'Data Validation',
          'success',
          'Estrutura dos dados está válida'
        );
      } else {
        this.addResult(
          'Data Validation',
          'warning',
          'Problemas encontrados na estrutura dos dados',
          { issues }
        );
      }
    } catch (error) {
      this.addResult(
        'Data Validation',
        'error',
        'Erro ao validar estrutura dos dados',
        error
      );
    }
  }

  private async testNavigation(boardId: number) {
    try {
      console.log('🧭 Testando navegação...');

      const targetRoute = `/board/${boardId}`;

      // Testar se a rota é válida
      if (this.router.url === targetRoute) {
        this.addResult(
          'Navigation Test',
          'success',
          'Já está na rota correta',
          { route: targetRoute }
        );
      } else {
        // Simular navegação
        const navigationPromise = this.router.navigate(['/board', boardId]);

        await navigationPromise;

        if (this.router.url.includes(`/board/${boardId}`)) {
          this.addResult(
            'Navigation Test',
            'success',
            'Navegação realizada com sucesso',
            {
              from: this.router.url,
              to: targetRoute,
            }
          );
        } else {
          this.addResult(
            'Navigation Test',
            'warning',
            'Navegação não resultou na rota esperada',
            {
              expected: targetRoute,
              actual: this.router.url,
            }
          );
        }
      }
    } catch (error) {
      this.addResult(
        'Navigation Test',
        'error',
        'Erro durante navegação',
        error
      );
    }
  }

  private printResults() {
    console.log('\n📊 RESUMO DO DIAGNÓSTICO\n');

    const summary = {
      total: this.results.length,
      success: this.results.filter((r) => r.status === 'success').length,
      warnings: this.results.filter((r) => r.status === 'warning').length,
      errors: this.results.filter((r) => r.status === 'error').length,
    };

    console.log(`✅ Sucessos: ${summary.success}`);
    console.log(`⚠️  Avisos: ${summary.warnings}`);
    console.log(`❌ Erros: ${summary.errors}`);

    const errorResults = this.results.filter((r) => r.status === 'error');
    if (errorResults.length > 0) {
      console.log('\n🚨 ERROS ENCONTRADOS:');
      errorResults.forEach((result) => {
        console.log(`- [${result.step}] ${result.message}`);
      });
    }

    const warningResults = this.results.filter((r) => r.status === 'warning');
    if (warningResults.length > 0) {
      console.log('\n⚠️ AVISOS:');
      warningResults.forEach((result) => {
        console.log(`- [${result.step}] ${result.message}`);
      });
    }

    console.log(
      '\n📋 Todos os resultados estão disponíveis em diagnostic.results'
    );
  }

  getResults(): DiagnosticResult[] {
    return this.results;
  }

  getErrorsOnly(): DiagnosticResult[] {
    return this.results.filter((r) => r.status === 'error');
  }

  getWarningsOnly(): DiagnosticResult[] {
    return this.results.filter((r) => r.status === 'warning');
  }
}
