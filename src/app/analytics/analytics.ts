import {
    Component,
    OnDestroy,
    OnInit,
    computed,
    inject,
    signal,
    ChangeDetectionStrategy,
} from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { forkJoin } from 'rxjs';
import { AnalyticsApi } from '../core/analytics-api';
import { InstanceAnalytics } from '../core/analytics';

const REFRESH_INTERVAL_MS = 5_000;

@Component({
    selector: 'app-analytics',
    imports: [],
    templateUrl: './analytics.html',
    changeDetection: ChangeDetectionStrategy.Eager,
    styleUrl: './analytics.scss',
})
export class Analytics implements OnInit, OnDestroy {
    private readonly api = inject(AnalyticsApi);
    private refreshHandle?: ReturnType<typeof setInterval>;

    protected readonly collector = signal<InstanceAnalytics[]>([]);
    protected readonly rateStreamer = signal<InstanceAnalytics[]>([]);
    protected readonly loading = signal(true);
    protected readonly loadError = signal('');

    protected readonly stats = computed(() => {
        const connectionCount = (list: InstanceAnalytics[]) =>
            list.reduce((sum, instance) => sum + instance.connections.length, 0);
        const collector = this.collector();
        const rateStreamer = this.rateStreamer();
        return {
            collectorInstances: collector.length,
            collectorConnections: connectionCount(collector),
            rateStreamerInstances: rateStreamer.length,
            rateStreamerConnections: connectionCount(rateStreamer),
        };
    });

    ngOnInit(): void {
        this.load();
        this.refreshHandle = setInterval(() => this.load(false), REFRESH_INTERVAL_MS);
    }

    ngOnDestroy(): void {
        if (this.refreshHandle !== undefined) {
            clearInterval(this.refreshHandle);
        }
    }

    private load(showSpinner = true): void {
        if (showSpinner) {
            this.loading.set(true);
        }
        this.loadError.set('');
        forkJoin({
            collector: this.api.collector(),
            rateStreamer: this.api.rateStreamer(),
        }).subscribe({
            next: ({ collector, rateStreamer }) => {
                this.collector.set(collector);
                this.rateStreamer.set(rateStreamer);
                this.loading.set(false);
            },
            error: (err: HttpErrorResponse) => {
                this.loadError.set(this.messageFrom(err, 'Failed to load analytics'));
                this.loading.set(false);
            },
        });
    }

    protected connectedFor(connectedAt: number): string {
        const seconds = Math.max(0, Math.floor(Date.now() / 1000) - connectedAt);
        if (seconds < 60) return `${seconds}s`;
        const minutes = Math.floor(seconds / 60);
        if (minutes < 60) return `${minutes}m`;
        const hours = Math.floor(minutes / 60);
        if (hours < 24) return `${hours}h ${minutes % 60}m`;
        const days = Math.floor(hours / 24);
        return `${days}d ${hours % 24}h`;
    }

    private messageFrom(err: HttpErrorResponse, fallback: string): string {
        const apiMessage = err.error?.error;
        return typeof apiMessage === 'string' && apiMessage ? apiMessage : fallback;
    }
}
