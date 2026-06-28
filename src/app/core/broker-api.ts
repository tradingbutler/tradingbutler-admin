import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { Broker, IssuedKey } from './broker';

/**
 * Thin client over the admin-api broker endpoints. Requests are same-origin
 * (`/api/...`) and proxied to the Rust service — in dev via `proxy.conf.json`,
 * in prod via whatever fronts the admin SPA. No cross-origin calls.
 */
@Injectable({ providedIn: 'root' })
export class BrokerApi {
    private readonly http = inject(HttpClient);

    list(): Observable<Broker[]> {
        return this.http.get<Broker[]>('/api/brokers');
    }

    create(
        id: string,
        name: string,
        allowed_ips: string[],
        open_account_url: string,
        logo: string,
    ): Observable<IssuedKey> {
        return this.http.post<IssuedKey>('/api/brokers', {
            id,
            name,
            allowed_ips,
            open_account_url,
            logo,
        });
    }

    regenerateKey(id: string): Observable<IssuedKey> {
        return this.http.post<IssuedKey>(`/api/brokers/${encodeURIComponent(id)}/key`, {});
    }

    updateLogo(id: string, logo: string): Observable<void> {
        return this.http.put<void>(`/api/brokers/${encodeURIComponent(id)}/logo`, { logo });
    }

    updateOpenAccountUrl(id: string, open_account_url: string): Observable<void> {
        return this.http.put<void>(`/api/brokers/${encodeURIComponent(id)}/open-account-url`, {
            open_account_url,
        });
    }

    updateAllowedIps(id: string, allowed_ips: string[]): Observable<Broker> {
        return this.http.put<Broker>(`/api/brokers/${encodeURIComponent(id)}/allowed-ips`, {
            allowed_ips,
        });
    }

    remove(id: string): Observable<void> {
        return this.http.delete<void>(`/api/brokers/${encodeURIComponent(id)}`);
    }
}
