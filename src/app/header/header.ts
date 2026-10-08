import { Component, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { TbLogo } from '../shared/tb-logo';

@Component({
    selector: 'app-header',
    imports: [RouterLink, RouterLinkActive, TbLogo],
    templateUrl: './header.html',
    changeDetection: ChangeDetectionStrategy.Eager,
    styleUrl: './header.scss',
})
export class Header {
    protected readonly version = APP_VERSION;
}
