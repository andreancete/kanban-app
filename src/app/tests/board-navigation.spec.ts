import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { ActivatedRoute } from '@angular/router';
import { of, throwError } from 'rxjs';
import { BoardComponent } from '../components/board/board.component';
import { KanbanService } from '../services/kanban.service';
import { Board, Column, Card } from '../models/board.model';

describe('Board Navigation Flow Tests', () => {
  let component: BoardComponent;
  let fixture: any;
  let mockKanbanService: jasmine.SpyObj<KanbanService>;
  let mockRouter: jasmine.SpyObj<Router>;
  let mockActivatedRoute: any;

  const mockBoard: Board = {
    id: '1',
    name: 'Test Board',
    columns: [
      {
        id: '1',
        title: 'To Do',
        order: 1,
        board: {} as Board,
        cards: [
          {
            id: '1',
            title: 'Test Card',
            description: 'Test Description',
            order: 1,
            column: {} as Column,
          },
        ],
      },
    ],
  };

  beforeEach(async () => {
    const kanbanServiceSpy = jasmine.createSpyObj('KanbanService', [
      'getBoard',
    ]);
    const routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    mockActivatedRoute = {
      paramMap: of(new Map([['id', '1']])),
    };

    await TestBed.configureTestingModule({
      imports: [BoardComponent],
      providers: [
        { provide: KanbanService, useValue: kanbanServiceSpy },
        { provide: Router, useValue: routerSpy },
        { provide: ActivatedRoute, useValue: mockActivatedRoute },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(BoardComponent);
    component = fixture.componentInstance;
    mockKanbanService = TestBed.inject(
      KanbanService
    ) as jasmine.SpyObj<KanbanService>;
    mockRouter = TestBed.inject(Router) as jasmine.SpyObj<Router>;
  });

  describe('Component Initialization', () => {
    it('should create component', () => {
      expect(component).toBeTruthy();
    });

    it('should extract board ID from route params on init', () => {
      mockKanbanService.getBoard.and.returnValue(of(mockBoard));

      component.ngOnInit();

      expect(component.boardId).toBe(1);
    });

    it('should call loadBoard after extracting ID', () => {
      mockKanbanService.getBoard.and.returnValue(of(mockBoard));
      spyOn(component, 'loadBoard').and.callThrough();

      component.ngOnInit();

      expect(component.loadBoard).toHaveBeenCalled();
    });
  });

  describe('Board Loading', () => {
    beforeEach(() => {
      component.boardId = 1;
    });

    it('should load board successfully', () => {
      mockKanbanService.getBoard.and.returnValue(of(mockBoard));

      component.loadBoard();

      expect(mockKanbanService.getBoard).toHaveBeenCalledWith(1);
      expect(component.board).toEqual(mockBoard);
    });

    it('should sort columns by order', () => {
      const boardWithUnsortedColumns: Board = {
        ...mockBoard,
        columns: [
          { ...mockBoard.columns[0], order: 3 },
          { ...mockBoard.columns[0], id: '2', order: 1 },
          { ...mockBoard.columns[0], id: '3', order: 2 },
        ],
      };

      mockKanbanService.getBoard.and.returnValue(of(boardWithUnsortedColumns));

      component.loadBoard();

      expect(component.board?.columns[0].order).toBe(1);
      expect(component.board?.columns[1].order).toBe(2);
      expect(component.board?.columns[2].order).toBe(3);
    });

    it('should handle service error', () => {
      const errorMessage = 'Service error';
      mockKanbanService.getBoard.and.returnValue(
        throwError(() => new Error(errorMessage))
      );
      spyOn(console, 'error');

      component.loadBoard();

      expect(mockRouter.navigate).toHaveBeenCalledWith(['/']);
      expect(console.error).toHaveBeenCalledWith(
        'Erro ao carregar quadro:',
        jasmine.any(Error)
      );
    });
  });

  describe('Route Parameter Handling', () => {
    it('should handle missing ID parameter', () => {
      const routeWithoutId = {
        paramMap: of(new Map()),
      };

      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        imports: [BoardComponent],
        providers: [
          { provide: KanbanService, useValue: mockKanbanService },
          { provide: Router, useValue: mockRouter },
          { provide: ActivatedRoute, useValue: routeWithoutId },
        ],
      });

      const newFixture = TestBed.createComponent(BoardComponent);
      const newComponent = newFixture.componentInstance;
      spyOn(newComponent, 'loadBoard');

      newComponent.ngOnInit();

      expect(newComponent.loadBoard).not.toHaveBeenCalled();
    });

    it('should handle invalid ID parameter', () => {
      const routeWithInvalidId = {
        paramMap: of(new Map([['id', 'invalid']])),
      };

      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        imports: [BoardComponent],
        providers: [
          { provide: KanbanService, useValue: mockKanbanService },
          { provide: Router, useValue: mockRouter },
          { provide: ActivatedRoute, useValue: routeWithInvalidId },
        ],
      });

      const newFixture = TestBed.createComponent(BoardComponent);
      const newComponent = newFixture.componentInstance;

      newComponent.ngOnInit();

      expect(newComponent.boardId).toBeNaN();
    });
  });

  describe('Template Rendering', () => {
    it('should show loading when board is null', () => {
      component.board = null;
      fixture.detectChanges();

      const loadingElement = fixture.nativeElement.querySelector('.loading');
      expect(loadingElement).toBeTruthy();
      expect(loadingElement.textContent).toContain('Carregando quadro...');
    });

    it('should show board when loaded', () => {
      component.board = mockBoard;
      fixture.detectChanges();

      const boardContainer =
        fixture.nativeElement.querySelector('.board-container');
      expect(boardContainer).toBeTruthy();
    });

    it('should show empty board message when no columns', () => {
      component.board = { ...mockBoard, columns: [] };
      fixture.detectChanges();

      const emptyBoard = fixture.nativeElement.querySelector('.empty-board');
      expect(emptyBoard).toBeTruthy();
      expect(emptyBoard.textContent).toContain('Quadro vazio');
    });
  });

  describe('Integration Tests', () => {
    it('should complete full navigation flow', async () => {
      mockKanbanService.getBoard.and.returnValue(of(mockBoard));

      // Simulate component initialization
      component.ngOnInit();

      // Wait for async operations
      await fixture.whenStable();
      fixture.detectChanges();

      // Verify final state
      expect(component.board).toEqual(mockBoard);
      expect(component.boardId).toBe(1);

      const boardContainer =
        fixture.nativeElement.querySelector('.board-container');
      expect(boardContainer).toBeTruthy();
    });
  });
});
