import { Component, ChangeDetectionStrategy, input } from '@angular/core';

/** The TradingButler mark, live. Same drawing as `branding/icon.svg` — a price
 *  chart climbing to its peak, the Nadir mark turned upside down — with the
 *  phirepass logo's motion carried over beat for beat:
 *
 *  - the lift: a coloured drop shadow rather than a box shadow, so it follows
 *    the rounded silhouette, raised a pixel on hover;
 *  - `tb-flow`: a short dash climbing the price line from the first close to
 *    the peak, the way phirepass sends one out along its path. The line is
 *    drawn twice: a dim rail, and the dashed copy on top of it;
 *  - `tb-pulse`: the peak breathes in scale and opacity, like phirepass's
 *    relay ring, so the destination reads as live;
 *  - `tb-breathe`: the area under the line breathes in opacity, like
 *    phirepass's node.
 *
 *  `pathLength="100"` normalises the line, so the dash pattern (20 on, 100
 *  off) is in percent of it: one dash per 2.4 s run, and the gap is longer
 *  than the line, so a run never shows a second dash at either end.
 *
 *  Gradient ids are static. Several instances on one page all define the same
 *  gradients, so duplicate ids resolve identically, and it stays SSR-safe with
 *  no per-instance id to generate.
 *
 *  All motion stops under prefers-reduced-motion; the mark is fully legible
 *  static, so nothing is lost. */
@Component({
    selector: 'app-tb-logo',
    imports: [],
    template: `
        <svg
            class="tb-logo"
            viewBox="0 0 48 48"
            [attr.width]="size()"
            [attr.height]="size()"
            [attr.role]="title() ? 'img' : 'presentation'"
            [attr.aria-hidden]="title() ? null : 'true'"
            xmlns="http://www.w3.org/2000/svg"
        >
            @if (title()) {
                <title>{{ title() }}</title>
            }
            <defs>
                <linearGradient
                    id="tb-mark"
                    gradientUnits="userSpaceOnUse"
                    x1="8"
                    y1="41"
                    x2="40"
                    y2="9"
                >
                    <stop offset="0%" stop-color="hsl(352 94% 58%)" />
                    <stop offset="35%" stop-color="hsl(4 96% 58%)" />
                    <stop offset="70%" stop-color="hsl(16 100% 58%)" />
                    <stop offset="100%" stop-color="hsl(28 100% 64%)" />
                </linearGradient>
                <linearGradient id="tb-body" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stop-color="hsl(358 36% 14%)" />
                    <stop offset="50%" stop-color="hsl(8 38% 9%)" />
                    <stop offset="100%" stop-color="hsl(18 42% 8%)" />
                </linearGradient>
                <radialGradient id="tb-bloom" cx="62%" cy="30%" r="60%">
                    <stop offset="0%" stop-color="hsl(10 98% 58%)" stop-opacity="0.40" />
                    <stop offset="100%" stop-color="hsl(10 98% 58%)" stop-opacity="0" />
                </radialGradient>
                <linearGradient id="tb-edge" x1="0%" y1="100%" x2="100%" y2="0%">
                    <stop offset="0%" stop-color="hsl(352 94% 58%)" stop-opacity="0.8" />
                    <stop offset="100%" stop-color="hsl(28 100% 64%)" stop-opacity="0.55" />
                </linearGradient>
                <linearGradient id="tb-area" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stop-color="hsl(10 98% 60%)" stop-opacity="0.38" />
                    <stop offset="100%" stop-color="hsl(10 98% 60%)" stop-opacity="0.02" />
                </linearGradient>
            </defs>

            <!-- Body: near-black, faintly red, with a lit edge. -->
            <rect x="1" y="1" width="46" height="46" rx="12" fill="url(#tb-body)" />
            <rect x="1" y="1" width="46" height="46" rx="12" fill="url(#tb-bloom)" />
            <rect
                x="1"
                y="1"
                width="46"
                height="46"
                rx="12"
                fill="none"
                stroke="url(#tb-edge)"
                stroke-width="1.8"
            />

            <!-- Gridlines. -->
            <path
                d="M10.5 18.5 L38.5 18.5 M10.5 28 L38.5 28"
                fill="none"
                stroke="url(#tb-mark)"
                stroke-width="1"
                opacity="0.22"
            />
            <!-- Area under the line. -->
            <path
                class="tb-breathe"
                d="M10.5 33 L15 27.5 L19 31 L23.5 22.5 L27.5 26 L31.5 18.5 L35.5 14.5 L35.5 37.5 L10.5 37.5 Z"
                fill="url(#tb-area)"
            />
            <!-- Axes. -->
            <path
                d="M10.5 9.5 L10.5 37.5 L38.5 37.5"
                fill="none"
                stroke="url(#tb-mark)"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
                opacity="0.6"
            />

            <!-- The price line: a rail, and a dash climbing it to the peak. -->
            <path
                d="M10.5 33 L15 27.5 L19 31 L23.5 22.5 L27.5 26 L31.5 18.5 L35.5 14.5"
                fill="none"
                stroke="url(#tb-mark)"
                stroke-width="2.8"
                stroke-linecap="round"
                stroke-linejoin="round"
                opacity="0.6"
            />
            <path
                class="tb-flow"
                d="M10.5 33 L15 27.5 L19 31 L23.5 22.5 L27.5 26 L31.5 18.5 L35.5 14.5"
                pathLength="100"
                fill="none"
                stroke="url(#tb-mark)"
                stroke-width="3.2"
                stroke-linecap="round"
                stroke-linejoin="round"
            />

            <!-- Today, the peak: solid, live. -->
            <circle class="tb-pulse" cx="35.5" cy="14.5" r="3.8" fill="url(#tb-mark)" />
        </svg>
    `,
    changeDetection: ChangeDetectionStrategy.Eager,
    styles: [
        `
            :host {
                display: inline-flex;
                flex-shrink: 0;
            }

            .tb-logo {
                display: block;
                filter: drop-shadow(0 6px 16px hsl(8 96% 54% / 0.42));
                transition:
                    filter 0.4s ease,
                    transform 0.4s ease;
            }

            .tb-logo:hover {
                filter: drop-shadow(0 6px 18px hsl(12 98% 58% / 0.5));
                transform: translateY(-1px);
            }

            @keyframes tb-flow {
                from {
                    stroke-dashoffset: 120;
                }
                to {
                    stroke-dashoffset: 0;
                }
            }

            @keyframes tb-pulse {
                0%,
                100% {
                    opacity: 0.55;
                    transform: scale(1);
                }
                50% {
                    opacity: 1;
                    transform: scale(1.14);
                }
            }

            @keyframes tb-breathe {
                0%,
                100% {
                    opacity: 0.75;
                }
                50% {
                    opacity: 1;
                }
            }

            .tb-flow {
                stroke-dasharray: 20 100;
                animation: tb-flow 2.4s linear infinite;
            }

            .tb-pulse {
                transform-box: fill-box;
                transform-origin: center;
                animation: tb-pulse 2.4s ease-in-out infinite;
            }

            .tb-breathe {
                animation: tb-breathe 2.4s ease-in-out infinite;
            }

            @media (prefers-reduced-motion: reduce) {
                .tb-flow,
                .tb-pulse,
                .tb-breathe {
                    animation: none;
                }

                .tb-flow {
                    stroke-dasharray: none;
                    opacity: 0;
                }
            }
        `,
    ],
})
export class TbLogo {
    /** Rendered size in px (the mark is square). */
    readonly size = input(36);
    /** Accessible name. Omit when a text wordmark sits beside the mark. */
    readonly title = input<string>();
}
