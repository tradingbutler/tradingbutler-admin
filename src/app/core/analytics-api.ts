import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { InstanceAnalytics } from './analytics';

/**
 * Thin client over the admin-api analytics endpoints. Requests are same-origin
 * (`/api/...`) and proxied to the Rust service — in dev via `proxy.conf.json`,
 * in prod via whatever fronts the admin SPA. No cross-origin calls.
 */
@Injectable({ providedIn: 'root' })
export class AnalyticsApi {
    private readonly http = inject(HttpClient);

    collector(): Observable<InstanceAnalytics[]> {
        return this.http.get<InstanceAnalytics[]>('/api/analytics/collector');
    }

    rateStreamer(): Observable<InstanceAnalytics[]> {
        return this.http.get<InstanceAnalytics[]>('/api/analytics/rate-streamer');
    }
}
