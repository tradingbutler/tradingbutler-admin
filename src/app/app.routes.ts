import { Routes } from '@angular/router';
import { Brokers } from './brokers/brokers';
import { Analytics } from './analytics/analytics';

export const routes: Routes = [
    { path: '', component: Brokers, title: 'TradingButler — Brokers | Admin' },
    { path: 'analytics', component: Analytics, title: 'TradingButler — Analytics | Admin' },
    { path: '**', redirectTo: '' },
];
