import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { Observable } from 'rxjs';
import { BrokerApi } from '../core/broker-api';
import { Broker, IssuedKey } from '../core/broker';

@Component({
    selector: 'app-brokers',
    imports: [FormsModule],
    templateUrl: './brokers.html',
    styleUrl: './brokers.scss',
})
export class Brokers implements OnInit {
    private readonly api = inject(BrokerApi);

    protected objectKeys(obj: Record<string, string> | null | undefined): string[] {
        return Object.keys(obj ?? {});
    }

    protected readonly brokers = signal<Broker[]>([]);
    protected readonly loading = signal(true);
    protected readonly loadError = signal('');

    protected readonly stats = computed(() => {
        const list = this.brokers();
        return {
            total: list.length,
            active: list.filter((b) => b.has_key).length,
            restricted: list.filter((b) => b.allowed_ips.length > 0).length,
        };
    });

    // Create form
    protected readonly showForm = signal(false);
    protected idInput = '';
    protected nameInput = '';
    protected ipsInput = '';
    protected openAccountUrlInput = '';
    protected readonly logoInput = signal('');
    protected readonly submitting = signal(false);
    protected readonly formError = signal('');

    protected readonly issued = signal<IssuedKey | null>(null);
    protected readonly copied = signal(false);

    protected readonly busyId = signal('');
    protected readonly rowError = signal('');

    // Inline IP editor
    protected readonly editingId = signal('');
    protected editIps = '';

    // URL editor
    protected readonly urlEditingId = signal('');
    protected urlEditInput = '';

    // Logo editor
    protected readonly logoEditingId = signal('');
    protected readonly logoEditFile = signal('');

    // Symbol map editor
    protected readonly symbolMapEditingId = signal('');
    protected readonly symbolMapRows = signal<{ alias: string; canonical: string }[]>([]);

    ngOnInit(): void {
        this.load();
    }

    private load(): void {
        this.loading.set(true);
        this.loadError.set('');
        this.api.list().subscribe({
            next: (brokers) => {
                this.brokers.set(brokers);
                this.loading.set(false);
            },
            error: (err: HttpErrorResponse) => {
                this.loadError.set(this.messageFrom(err, 'Failed to load brokers'));
                this.loading.set(false);
            },
        });
    }

    protected openForm(): void {
        this.idInput = '';
        this.nameInput = '';
        this.ipsInput = '';
        this.openAccountUrlInput = '';
        this.logoInput.set('');
        this.formError.set('');
        this.showForm.set(true);
    }

    protected closeForm(): void {
        this.showForm.set(false);
    }

    protected onLogoFile(event: Event): void {
        const file = (event.target as HTMLInputElement).files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = () => this.logoInput.set(reader.result as string);
        reader.readAsDataURL(file);
    }

    protected submit(): void {
        if (this.submitting()) return;
        const id = this.idInput.trim();
        const name = this.nameInput.trim();
        this.formError.set('');

        if (!id || !name) {
            this.formError.set('Both an ID and a name are required.');
            return;
        }
        if (/[\s:]/.test(id)) {
            this.formError.set('ID must not contain spaces or ":".');
            return;
        }

        this.submitting.set(true);
        this.issued.set(null);
        this.copied.set(false);

        this.api
            .create(
                id,
                name,
                this.parseIps(this.ipsInput),
                this.openAccountUrlInput.trim(),
                this.logoInput(),
            )
            .subscribe({
                next: (key) => {
                    this.issued.set(key);
                    this.submitting.set(false);
                    this.closeForm();
                    this.load();
                },
                error: (err: HttpErrorResponse) => {
                    this.formError.set(this.messageFrom(err, 'Failed to create broker'));
                    this.submitting.set(false);
                },
            });
    }

    protected regenerate(broker: Broker): void {
        if (
            !confirm(
                `Regenerate the API key for "${broker.name}"? The current key will stop working immediately.`,
            )
        ) {
            return;
        }
        this.runRowAction(broker.id, this.api.regenerateKey(broker.id), (key) => {
            this.issued.set(key as IssuedKey);
            this.copied.set(false);
        });
    }

    protected remove(broker: Broker): void {
        if (
            !confirm(
                `Delete broker "${broker.name}"? This also removes its live stream and snapshot.`,
            )
        ) {
            return;
        }
        this.runRowAction(broker.id, this.api.remove(broker.id));
    }

    // IP editor
    protected startEditIps(broker: Broker): void {
        this.editingId.set(broker.id);
        this.editIps = broker.allowed_ips.join(', ');
        this.rowError.set('');
    }

    protected cancelEditIps(): void {
        this.editingId.set('');
        this.editIps = '';
    }

    protected saveIps(broker: Broker): void {
        this.runRowAction(
            broker.id,
            this.api.updateAllowedIps(broker.id, this.parseIps(this.editIps)),
            () => this.editingId.set(''),
        );
    }

    // URL editor
    protected startEditUrl(broker: Broker): void {
        this.urlEditingId.set(broker.id);
        this.urlEditInput = broker.open_account_url;
        this.rowError.set('');
    }

    protected cancelEditUrl(): void {
        this.urlEditingId.set('');
        this.urlEditInput = '';
    }

    protected saveUrl(broker: Broker): void {
        this.runRowAction(
            broker.id,
            this.api.updateOpenAccountUrl(broker.id, this.urlEditInput.trim()),
            () => this.urlEditingId.set(''),
        );
    }

    // Logo editor
    protected openLogoEditor(broker: Broker): void {
        this.logoEditingId.set(broker.id);
        this.logoEditFile.set(broker.logo ?? '');
        this.rowError.set('');
    }

    protected closeLogoEditor(): void {
        this.logoEditingId.set('');
        this.logoEditFile.set('');
    }

    protected onLogoEditFile(event: Event): void {
        const file = (event.target as HTMLInputElement).files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = () => this.logoEditFile.set(reader.result as string);
        reader.readAsDataURL(file);
    }

    protected saveLogo(id: string): void {
        this.runRowAction(id, this.api.updateLogo(id, this.logoEditFile()), () =>
            this.closeLogoEditor(),
        );
    }

    // Symbol map editor
    protected openSymbolMapEditor(broker: Broker): void {
        this.symbolMapEditingId.set(broker.id);
        const rows = Object.entries(broker.symbol_map ?? {}).map(([alias, canonical]) => ({
            alias,
            canonical,
        }));
        this.symbolMapRows.set(rows.length > 0 ? rows : [{ alias: '', canonical: '' }]);
        this.rowError.set('');
    }

    protected closeSymbolMapEditor(): void {
        this.symbolMapEditingId.set('');
        this.symbolMapRows.set([]);
    }

    protected addSymbolMapRow(): void {
        this.symbolMapRows.update((rows) => [...rows, { alias: '', canonical: '' }]);
    }

    protected removeSymbolMapRow(index: number): void {
        this.symbolMapRows.update((rows) => rows.filter((_, i) => i !== index));
    }

    protected saveSymbolMap(id: string): void {
        const symbol_map: Record<string, string> = {};
        for (const { alias, canonical } of this.symbolMapRows()) {
            const a = alias.trim();
            const c = canonical.trim();
            if (!a || !c) continue;
            symbol_map[a] = c;
        }
        this.runRowAction(id, this.api.updateSymbolMap(id, symbol_map), () =>
            this.closeSymbolMapEditor(),
        );
    }

    private runRowAction<T>(id: string, req: Observable<T>, onSuccess?: (value: T) => void): void {
        if (this.busyId()) return;
        this.busyId.set(id);
        this.rowError.set('');
        req.subscribe({
            next: (value) => {
                onSuccess?.(value);
                this.busyId.set('');
                this.load();
            },
            error: (err: HttpErrorResponse) => {
                this.rowError.set(this.messageFrom(err, 'Action failed'));
                this.busyId.set('');
            },
        });
    }

    protected async copyKey(): Promise<void> {
        const key = this.issued()?.api_key;
        if (!key) return;
        try {
            await navigator.clipboard.writeText(key);
            this.copied.set(true);
        } catch {
            this.copied.set(false);
        }
    }

    protected dismissKey(): void {
        this.issued.set(null);
        this.copied.set(false);
    }

    private parseIps(raw: string): string[] {
        return raw
            .split(/[\s,]+/)
            .map((s) => s.trim())
            .filter((s) => s.length > 0);
    }

    private messageFrom(err: HttpErrorResponse, fallback: string): string {
        const apiMessage = err.error?.error;
        return typeof apiMessage === 'string' && apiMessage ? apiMessage : fallback;
    }
}
