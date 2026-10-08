import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';

import { Brokers } from './brokers';

describe('Brokers loading', () => {
    let fixture: ComponentFixture<Brokers>;
    let http: HttpTestingController;

    const failNext = () =>
        http
            .expectOne('/api/brokers')
            .flush({ error: 'boom' }, { status: 500, statusText: 'Server Error' });

    const text = () => (fixture.nativeElement as HTMLElement).textContent ?? '';

    beforeEach(async () => {
        vi.useFakeTimers();
        await TestBed.configureTestingModule({
            imports: [Brokers],
            providers: [provideHttpClient(), provideHttpClientTesting()],
        }).compileComponents();
        http = TestBed.inject(HttpTestingController);
        fixture = TestBed.createComponent(Brokers);
        fixture.detectChanges();
    });

    afterEach(() => {
        http.verify();
        vi.useRealTimers();
    });

    it('shows a loader while the first request is pending', () => {
        expect(fixture.nativeElement.querySelector('.loader__spinner')).not.toBeNull();
        http.expectOne('/api/brokers').flush([]);
    });

    it('retries 3 times, then shows the error', async () => {
        failNext();
        for (let attempt = 1; attempt <= 3; attempt++) {
            fixture.detectChanges();
            expect(text()).toContain(`retry ${attempt}/3`);
            await vi.advanceTimersByTimeAsync(attempt * 1000);
            failNext();
        }
        fixture.detectChanges();
        expect(fixture.nativeElement.querySelector('.loader__spinner')).toBeNull();
        expect(text()).toContain('boom');
        expect(text()).toContain('gave up after 3 retries');
        expect(text()).toContain('Try again');
    });

    it('does not retry a 4xx', async () => {
        http.expectOne('/api/brokers').flush(
            { error: 'forbidden' },
            { status: 403, statusText: 'Forbidden' },
        );
        await vi.advanceTimersByTimeAsync(10_000);
        fixture.detectChanges();
        expect(text()).toContain('forbidden');
        expect(text()).not.toContain('gave up');
        // http.verify() in afterEach fails if a retry request went out.
    });

    it('retries network errors', async () => {
        http.expectOne('/api/brokers').error(new ProgressEvent('error'));
        fixture.detectChanges();
        expect(text()).toContain('retry 1/3');
        await vi.advanceTimersByTimeAsync(1000);
        http.expectOne('/api/brokers').flush([]);
        fixture.detectChanges();
        expect(text()).toContain('No brokers yet.');
    });

    it('recovers if a retry succeeds', async () => {
        failNext();
        await vi.advanceTimersByTimeAsync(1000);
        http.expectOne('/api/brokers').flush([]);
        fixture.detectChanges();
        expect(fixture.nativeElement.querySelector('.loader')).toBeNull();
        expect(text()).toContain('No brokers yet.');
    });
});
