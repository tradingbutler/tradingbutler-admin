import { Routes } from '@angular/router';
import { Brokers } from './brokers/brokers';

export const routes: Routes = [
    { path: '', component: Brokers, title: 'TradingButler — Brokers | Admin' },
    { path: '**', redirectTo: '' },
];
