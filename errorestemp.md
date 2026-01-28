$ bun run lint
$ biome check src/
src\types\auth.ts:201:49 lint/style/useTemplate  FIXABLE  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  i Template literals are preferred over string concatenation.
  
    200 │       for (const route of sortedRoutes) {
  > 201 │               if (pathname === route || pathname.startsWith(route + "/")) {
        │                                                             ^^^^^^^^^^^
    202 │                       return ROUTE_ACCESS[route].includes(role);
    203 │               }
  
  i Unsafe fix: Use a template literal.
  
    199 199 │ 
    200 200 │           for (const route of sortedRoutes) {
    201     │ - → → if·(pathname·===·route·||·pathname.startsWith(route·+·"/"))·{
        201 │ + → → if·(pathname·===·route·||·pathname.startsWith(`${route}/`))·{
    202 202 │                           return ROUTE_ACCESS[route].includes(role);
    203 203 │                   }


src\app\(admin)\admin\(protected)\consentimientos\page.tsx:371:16 lint/suspicious/noArrayIndexKey ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  ! Avoid using the index of an array as key property in an element.

    369 │                                                               {selectedConsent.minors.map((minor, index) => (
    370 │                                                                       <div
  > 371 │                                                                               key={index}
        │                                                                                    ^^^^^
    372 │                                                                               className="bg-surface-muted rounded-lg p-3"
    373 │                                                                       >

  i This is the source of the key value.

    367 │                                                       </h4>
    368 │                                                       <div className="space-y-2">
  > 369 │                                                               {selectedConsent.minors.map((minor, index) => (
        │                                                                                                   ^^^^^
    370 │                                                                       <div
    371 │                                                                               key={index}

  i The order of the items may change, and this also affects performances and component state.

  i Check the React documentation. 


src\app\(admin)\admin\(protected)\estadisticas\page.tsx:136:17 lint/suspicious/noArrayIndexKey ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  ! Avoid using the index of an array as key property in an element.

    134 │                               <div className="space-y-3">
    135 │                                       {SKELETON_WIDTHS.map((width, i) => (
  > 136 │                                               <div key={i} className="space-y-1">
        │                                                         ^
    137 │                                                       <div className="flex justify-between">
    138 │                                                               <div className="h-3 w-12 bg-surface-muted rounded animate-pulse" />

  i This is the source of the key value.

    133 │                       <CardContent>
    134 │                               <div className="space-y-3">
  > 135 │                                       {SKELETON_WIDTHS.map((width, i) => (
        │                                                                    ^
    136 │                                               <div key={i} className="space-y-1">
    137 │                                                       <div className="flex justify-between">

  i The order of the items may change, and this also affects performances and component state.

  i Check the React documentation.


src\app\(admin)\admin\(protected)\estadisticas\page.tsx:299:18 lint/suspicious/noArrayIndexKey ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  ! Avoid using the index of an array as key property in an element.

    297 │                                                                               {[...Array(5)].map((_, i) => (
    298 │                                                                                       <div
  > 299 │                                                                                               key={i}
        │                                                                                                    ^
    300 │                                                                                               className="flex justify-between items-center"
    301 │                                                                                       >

  i This is the source of the key value.

    295 │                                                               <CardContent>
    296 │                                                                       <div className="space-y-3">
  > 297 │                                                                               {[...Array(5)].map((_, i) => (
        │                                                                                                      ^
    298 │                                                                                       <div
    299 │                                                                                               key={i}

  i The order of the items may change, and this also affects performances and component state.

  i Check the React documentation.


src\app\(admin)\admin\(protected)\estadisticas\page.tsx:319:22 lint/suspicious/noArrayIndexKey ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  ! Avoid using the index of an array as key property in an element.

    317 │                                                                       <div className="space-y-4">
    318 │                                                                               {[...Array(3)].map((_, i) => (
  > 319 │                                                                                       <div key={i} className="flex justify-between">
        │                                                                                                 ^
    320 │                                                                                               <div className="h-4 w-24 bg-surface-muted rounded animate-pulse" />
    321 │                                                                                               <div className="h-5 w-12 bg-surface-muted rounded animate-pulse" />

  i This is the source of the key value.

    316 │                                                               <CardContent>
    317 │                                                                       <div className="space-y-4">
  > 318 │                                                                               {[...Array(3)].map((_, i) => (
        │                                                                                                      ^
    319 │                                                                                       <div key={i} className="flex justify-between">
    320 │                                                                                               <div className="h-4 w-24 bg-surface-muted rounded animate-pulse" />

  i The order of the items may change, and this also affects performances and component state.

  i Check the React documentation.


src\app\(admin)\admin\(protected)\estadisticas\page.tsx:544:22 lint/suspicious/noArrayIndexKey ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  ! Avoid using the index of an array as key property in an element.

    542 │                                                                       <div className="space-y-1.5 sm:space-y-2 max-h-[250px] sm:max-h-[300px] overflow-y-auto pr-1 sm:pr-2">
    543 │                                                                               {data.chartData.map((item, index) => (
  > 544 │                                                                                       <div key={index} className="space-y-0.5 sm:space-y-1">
        │                                                                                                 ^^^^^
    545 │                                                                                               <div className="flex items-center justify-between text-[10px] sm:text-xs">
    546 │                                                                                                       <span className="text-foreground/60 w-12 sm:w-16 shrink-0 truncate">

  i This is the source of the key value.

    541 │                                                                       {/* Bars */}
    542 │                                                                       <div className="space-y-1.5 sm:space-y-2 max-h-[250px] sm:max-h-[300px] overflow-y-auto pr-1 sm:pr-2">
  > 543 │                                                                               {data.chartData.map((item, index) => (
        │                                                                                                          ^^^^^
    544 │                                                                                       <div key={index} className="space-y-0.5 sm:space-y-1">
    545 │                                                                                               <div className="flex items-center justify-between text-[10px] sm:text-xs">

  i The order of the items may change, and this also affects performances and component state.

  i Check the React documentation.


src\app\(admin)\admin\(protected)\estadisticas\page.tsx:598:19 lint/suspicious/noArrayIndexKey ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  ! Avoid using the index of an array as key property in an element.

    596 │                                                                                       {data.topDays.map((day, index) => (
    597 │                                                                                               <div
  > 598 │                                                                                                       key={index}
        │                                                                                                            ^^^^^
    599 │                                                                                                       className="flex items-center justify-between"
    600 │                                                                                               >

  i This is the source of the key value.

    594 │                                                                       {data.topDays.length > 0 ? (
    595 │                                                                               <div className="space-y-3">
  > 596 │                                                                                       {data.topDays.map((day, index) => (
        │                                                                                                               ^^^^^
    597 │                                                                                               <div
    598 │                                                                                                       key={index}

  i The order of the items may change, and this also affects performances and component state.

  i Check the React documentation.


src\app\(admin)\admin\(protected)\page.tsx:294:19 lint/suspicious/noArrayIndexKey ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  ! Avoid using the index of an array as key property in an element.

    292 │                                                                                       {searchResult.consent.minorsSnapshot.map((minor, idx) => (
    293 │                                                                                               <div
  > 294 │                                                                                                       key={idx}
        │                                                                                                            ^^^
    295 │                                                                                                       className="p-3 bg-surface-muted rounded-xl border border-border/50 hover:border-green-500/30 transition-colors"
    296 │                                                                                               >

  i This is the source of the key value.

    290 │                                                                               </p>
    291 │                                                                               <div className="space-y-2">
  > 292 │                                                                                       {searchResult.consent.minorsSnapshot.map((minor, idx) => (
        │                                                                                                                                        ^^^
    293 │                                                                                               <div
    294 │                                                                                                       key={idx}

  i The order of the items may change, and this also affects performances and component state.

  i Check the React documentation.


src\app\(admin)\admin\(protected)\usuarios\page.tsx:48:3 lint/correctness/noUnusedVariables ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  ! This variable hasPendingWrites is unused.

    46 │                loading: recentLoading,
    47 │                fromCache,
  > 48 │                hasPendingWrites,
       │                ^^^^^^^^^^^^^^^^
    49 │                refresh,
    50 │        } = useRecentRegistrations(7);

  i Unused variables are often the result of typos, incomplete refactors, or other sources of bugs.


src\app\(kiosk)\exito\page.tsx:18:9 lint/correctness/noUnusedVariables  FIXABLE  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  ! This variable isHovering is unused.

    16 │        const { t, language } = useLanguage();
    17 │        const [countdown, setCountdown] = useState(8);
  > 18 │        const [isHovering, setIsHovering] = useState(false);
       │               ^^^^^^^^^^
    19 │ 
    20 │        const consecutivo = searchParams.get("consecutivo") || "---";

  i Unused variables are often the result of typos, incomplete refactors, or other sources of bugs.

  i Unsafe fix: If this is intentional, prepend isHovering with an underscore.
  
     16  16 │           const { t, language } = useLanguage();
     17  17 │           const [countdown, setCountdown] = useState(8);
     18     │ - → const·[isHovering,·setIsHovering]·=·useState(false);
         18 │ + → const·[_isHovering,·setIsHovering]·=·useState(false);
     19  19 │   
     20  20 │           const consecutivo = searchParams.get("consecutivo") || "---";


src\store\kioskStore.ts:85:7 lint/complexity/useOptionalChain  FIXABLE  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  ! Change to an optional chain.

    83 │        restoreSession: () => {
    84 │                const session = getKioskSession();
  > 85 │                if (session && session.isAuthenticated) {
       │                    ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    86 │                        set({
    87 │                                step: session.step,

  i Unsafe fix: Change to an optional chain.

     83  83 │           restoreSession: () => {
     84  84 │                   const session = getKioskSession();
     85     │ - → → if·(session·&&·session.isAuthenticated)·{
         85 │ + → → if·(session?.isAuthenticated)·{
     86  86 │                           set({
     87  87 │                                   step: session.step,


src\types\auth.ts:79:11 lint/correctness/noUnusedVariables ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  ! This interface AuthenticatedUser is unused.

    77 │  * Información del usuario autenticado con su rol.
    78 │  */
  > 79 │ interface AuthenticatedUser {
       │           ^^^^^^^^^^^^^^^^^
    80 │        uid: string;
    81 │        email: string;

  i Unused variables are often the result of typos, incomplete refactors, or other sources of bugs.


src\app\(admin)\admin\(protected)\page.tsx:3:1 assist/source/organizeImports  FIXABLE  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  × The imports and exports are not sorted.

     1 │ "use client";
     2 │ 
   > 3 │ import {
       │ ^^^^^^^^
   > 4 │        Baby,
        ...
  > 15 │        XCircle,
  > 16 │ } from "lucide-react";
       │ ^^^^^^^^^^^^^^^^^^^^^^
    17 │ import { useCallback, useEffect, useRef, useState } from "react";
    18 │ import { Badge } from "@/components/admin/Badge";

  i Safe fix: Organize Imports (Biome)

     24  24 │   } from "@/components/admin/Card";
     25  25 │   import { StatCard } from "@/components/admin/StatCard";
     26     │ - import·{·adminGet,·adminFetch·}·from·"@/lib/adminApi";
         26 │ + import·{·adminFetch,·adminGet·}·from·"@/lib/adminApi";
     27  27 │   import { formatRelativeTime } from "@/lib/utils";
     28  28 │ 


src\app\(admin)\admin\(protected)\usuarios\[id]\page.tsx:3:1 assist/source/organizeImports  FIXABLE  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  × The imports and exports are not sorted.

     1 │ "use client";
     2 │ 
   > 3 │ import {
       │ ^^^^^^^^
   > 4 │        ArrowLeft,
        ...
  > 17 │        User,
  > 18 │ } from "lucide-react";
       │ ^^^^^^^^^^^^^^^^^^^^^^
    19 │ import Image from "next/image";
    20 │ import { useRouter } from "next/navigation";

  i Safe fix: Organize Imports (Biome)

     29  29 │           CardTitle,
     30  30 │   } from "@/components/admin/Card";
     31     │ - import·{·formatEPS·}·from·"@/lib/utils/formatters";
     32     │ - import·{·Modal·}·from·"@/components/admin/Modal";
     33     │ - import·{·adminGet,·adminPost,·getAuthToken·}·from·"@/lib/adminApi";
     34     │ - import·{·formatRelativeTime·}·from·"@/lib/utils";
         31 │ + import·{·Modal·}·from·"@/components/admin/Modal";
         32 │ + import·{·adminGet,·adminPost,·getAuthToken·}·from·"@/lib/adminApi";
         33 │ + import·{·formatRelativeTime·}·from·"@/lib/utils";
         34 │ + import·{·formatEPS·}·from·"@/lib/utils/formatters";
     35  35 │ 
     36  36 │   interface Minor {


src\app\(kiosk)\consentimiento\page.tsx:3:1 assist/source/organizeImports  FIXABLE  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  × The imports and exports are not sorted.

    1 │ "use client";
    2 │ 
  > 3 │ import { zodResolver } from "@hookform/resolvers/zod";
      │ ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    4 │ import { AlertCircle, CheckCircle2, FileText, Maximize2, PenTool, Sparkles, Users } from "lucide-react";
    5 │ import { useRouter } from "next/navigation";

  i Safe fix: Organize Imports (Biome)

     13  13 │           type SignaturePadRef,
     14  14 │   } from "@/components/kiosk/SignaturePad";
     15     │ - import·{
     16     │ - → type·ConsentFormData,
     17     │ - → getConsentSchema,
     18     │ - }·from·"@/lib/schemas/consent.schema";
     19     │ - import·{·useKioskStore·}·from·"@/store/kioskStore";
     20     │ - import·{·useLanguage·}·from·"@/contexts/LanguageContext";
         15 │ + import·{·useLanguage·}·from·"@/contexts/LanguageContext";
         16 │ + import·{
         17 │ + → type·ConsentFormData,
         18 │ + → getConsentSchema,
         19 │ + }·from·"@/lib/schemas/consent.schema";
         20 │ + import·{·useKioskStore·}·from·"@/store/kioskStore";
     21  21 │ 
     22  22 │   export default function ConsentPage() {


src\app\(kiosk)\consentimiento\page.tsx:4:23 lint/correctness/noUnusedImports  FIXABLE  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  × Several of these imports are unused.

    3 │ import { zodResolver } from "@hookform/resolvers/zod";
  > 4 │ import { AlertCircle, CheckCircle2, FileText, Maximize2, PenTool, Sparkles, Users } from "lucide-react";
      │                       ^^^^^^^^^^^^
    5 │ import { useRouter } from "next/navigation";
    6 │ import { useEffect, useRef, useState } from "react";

  i Unused imports might be the result of an incomplete refactoring.

  i Unsafe fix: Remove the unused imports.

    4 │ import·{·AlertCircle,·CheckCircle2,·FileText,·Maximize2,·PenTool,·Sparkles,·Users·}·from·"lucide-react";
      │                       --------------

src\app\(kiosk)\exito\page.tsx:3:1 assist/source/organizeImports  FIXABLE  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  × The imports and exports are not sorted.

    1 │ "use client";
    2 │ 
  > 3 │ import { ArrowRight, CheckCircle2, PartyPopper, Sparkles, Star, Rocket } from "lucide-react";
      │ ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    4 │ import { useRouter, useSearchParams } from "next/navigation";
    5 │ import { Suspense, useEffect, useState } from "react";

  i Safe fix: Organize Imports (Biome)

      4   4 │   import { useRouter, useSearchParams } from "next/navigation";
      5   5 │   import { Suspense, useEffect, useState } from "react";
      6     │ - import·{·useKioskStore·}·from·"@/store/kioskStore";
      7     │ - import·{·useLanguage·}·from·"@/contexts/LanguageContext";
          6 │ + import·{·useLanguage·}·from·"@/contexts/LanguageContext";
          7 │ + import·{·useKioskStore·}·from·"@/store/kioskStore";
      8   8 │ 
      9   9 │   /**


src\app\(kiosk)\ingreso\page.tsx:3:1 assist/source/organizeImports  FIXABLE  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  × The imports and exports are not sorted.

    1 │ "use client";
    2 │ 
  > 3 │ import { Loader2, Fingerprint, Sparkles } from "lucide-react";
      │ ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    4 │ import { useRouter } from "next/navigation";
    5 │ import { type FormEvent, useCallback, useState } from "react";

  i Safe fix: Organize Imports (Biome)

      5   5 │   import { type FormEvent, useCallback, useState } from "react";
      6   6 │   import { VirtualKeypad } from "@/components/kiosk/VirtualKeypad";
      7     │ - import·{·useKioskStore·}·from·"@/store/kioskStore";
      8     │ - import·{·useLanguage·}·from·"@/contexts/LanguageContext";
          7 │ + import·{·useLanguage·}·from·"@/contexts/LanguageContext";
          8 │ + import·{·useKioskStore·}·from·"@/store/kioskStore";
      9   9 │ 
     10  10 │   const MIN_DIGITS = 5;


src\app\(kiosk)\layout.tsx:3:1 assist/source/organizeImports  FIXABLE  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  × The imports and exports are not sorted.

    1 │ "use client";
    2 │ 
  > 3 │ import type { ReactNode } from "react";
      │ ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    4 │ import { useRouter } from "next/navigation";
    5 │ import { Home, Sparkles } from "lucide-react";

  i Safe fix: Organize Imports (Biome)

     1  1 │   "use client";
     2  2 │ 
     3    │ - import·type·{·ReactNode·}·from·"react";
        3 │ + import·{·Home,·Sparkles·}·from·"lucide-react";
     4  4 │   import { useRouter } from "next/navigation";
     5    │ - import·{·Home,·Sparkles·}·from·"lucide-react";
     6    │ - import·{·ThemeToggle·}·from·"@/components/ui/ThemeToggle";
        5 │ + import·type·{·ReactNode·}·from·"react";
        6 │ + import·{·KioskSessionRestorer·}·from·"@/components/kiosk/KioskSessionRestorer";
     7  7 │   import { LanguageToggle } from "@/components/kiosk/LanguageToggle";
     8    │ - import·{·KioskSessionRestorer·}·from·"@/components/kiosk/KioskSessionRestorer";
        8 │ + import·{·ThemeToggle·}·from·"@/components/ui/ThemeToggle";
     9  9 │   import { AuthProvider } from "@/contexts/AuthContext";
    10 10 │   import { LanguageProvider, useLanguage } from "@/contexts/LanguageContext";


src\store\kioskStore.ts:1:1 assist/source/organizeImports  FIXABLE  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  × The imports and exports are not sorted.

  > 1 │ import { create } from "zustand";
      │ ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    2 │ import type { UserProfile } from "@/types/firestore";
    3 │ import {

  i Safe fix: Organize Imports (Biome)

      1   1 │   import { create } from "zustand";
      2     │ - import·type·{·UserProfile·}·from·"@/types/firestore";
      3     │ - import·{
      4     │ - → clearKioskSession,
      5     │ - → getKioskSession,
      6     │ - → saveKioskSession,
      7     │ - }·from·"@/lib/utils/kioskSession";
          2 │ + import·{
          3 │ + → clearKioskSession,
          4 │ + → getKioskSession,
          5 │ + → saveKioskSession,
          6 │ + }·from·"@/lib/utils/kioskSession";
          7 │ + import·type·{·UserProfile·}·from·"@/types/firestore";
      8   8 │ 
      9   9 │   export interface ConsentFormState {


The number of diagnostics exceeds the limit allowed. Use --max-diagnostics to increase it.
Diagnostics not shown: 82.
Checked 120 files in 45ms. No fixes applied.
Found 60 errors.
Found 37 warnings.
Found 5 infos.
check ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  × Some errors were emitted while running checks.


error: script "lint" exited with code 1

danielxxomg@DESKTOP-9QMHDCM MINGW64 ~/Desktop/jumping_park_app (main)
$ bun run audit
$ bun run audit:dead && bun run audit:dupe && bun run audit:circ
$ knip
Unused exports (1)
browserConsoleCode  scripts/migrate-consent-multilang.ts:237:14
Configuration hints (2)
sharp                knip.json  Remove from ignoreDependencies
src/middleware.ts    knip.json  Refine entry pattern (no matches)
error: script "audit:dead" exited with code 1
error: script "audit" exited with code 1

danielxxomg@DESKTOP-9QMHDCM MINGW64 ~/Desktop/jumping_park_app (main)
$ bun run audit:dupe
$ jscpd src/ --config .jscpd.json
Clone found (typescript):
 - src\app\api\admin\users\[id]\permissions\route.ts [135:4 - 146:8] (11 lines, 92 tokens)
   src\app\api\admin\users\[id]\permissions\route.ts [35:6 - 46:5]

Clone found (typescript):
 - src\app\api\admin\users\[id]\permissions\route.ts [146:2 - 162:8] (16 lines, 114 tokens)
   src\app\api\admin\users\[id]\permissions\route.ts [71:8 - 88:8]

Clone found (typescript):
 - src\app\api\admin\users\[id]\permissions\route.ts [162:4 - 173:7] (11 lines, 78 tokens)
   src\app\api\admin\users\[id]\permissions\route.ts [89:4 - 101:6]

Clone found (typescript):
 - src\app\api\admin\users\[id]\permissions\route.ts [180:49 - 193:2] (13 lines, 82 tokens)
   src\app\api\admin\users\[id]\permissions\route.ts [115:51 - 128:2]

Clone found (typescript):
 - src\app\api\admin\consents\[id]\pdf\route.ts [35:9 - 52:12] (17 lines, 125 tokens)
   src\app\api\admin\consents\[id]\resend\route.ts [29:3 - 46:8]

Clone found (tsx):
 - src\app\(admin)\admin\(protected)\usuarios\[id]\page.tsx [491:2 - 497:16] (6 lines, 58 tokens)
   src\app\(admin)\admin\(protected)\usuarios\[id]\page.tsx [455:9 - 460:5]

Clone found (tsx):
 - src\app\(admin)\admin\(protected)\usuarios\[id]\page.tsx [497:2 - 503:16] (6 lines, 55 tokens)
   src\app\(admin)\admin\(protected)\usuarios\[id]\page.tsx [460:2 - 464:5]

Clone found (typescript):
 - src\app\api\usuarios\[uid]\menores\route.ts [108:9 - 118:9] (10 lines, 109 tokens)
   src\app\api\usuarios\[uid]\menores\route.ts [82:9 - 92:2]

Clone found (typescript):
 - src\app\api\admin\settings\consent\route.ts [21:36 - 27:21] (6 lines, 55 tokens)
   src\app\api\admin\settings\consent\route.ts [13:39 - 19:15]

Clone found (typescript):
 - src\app\api\admin\export\consents\route.ts [15:1 - 58:18] (43 lines, 412 tokens)
   src\app\api\admin\export\users\route.ts [9:1 - 51:13]

Clone found (typescript):
 - src\app\api\admin\export\consents\route.ts [133:10 - 144:6] (11 lines, 90 tokens)
   src\app\api\admin\export\users\route.ts [86:2 - 96:11]

Clone found (typescript):
 - src\app\api\admin\export\consents\route.ts [146:18 - 157:38] (11 lines, 78 tokens)
   src\app\api\admin\export\users\route.ts [96:11 - 107:35]

Clone found (typescript):
 - src\app\api\admin\consents\[id]\route.ts [19:3 - 28:5] (9 lines, 79 tokens)
   src\app\api\admin\consents\[id]\resend\route.ts [37:3 - 46:8]

Clone found (typescript):
 - src\app\api\admin\consents\[id]\route.ts [86:7 - 97:6] (11 lines, 90 tokens)
   src\app\api\admin\users\[id]\permissions\route.ts [35:6 - 46:4]

Clone found (typescript):
 - src\app\api\admin\consents\[id]\route.ts [89:15 - 107:6] (18 lines, 128 tokens)
   src\app\api\admin\consents\[id]\route.ts [12:16 - 46:6]

Clone found (tsx):
 - src\app\(admin)\admin\(protected)\menores\page.tsx [60:6 - 68:10] (8 lines, 83 tokens)
   src\app\(admin)\admin\(protected)\usuarios\page.tsx [53:5 - 61:12]

Clone found (tsx):
 - src\app\(admin)\admin\(protected)\menores\page.tsx [137:2 - 153:11] (16 lines, 160 tokens)
   src\app\(admin)\admin\(protected)\usuarios\[id]\page.tsx [142:5 - 158:15]

Clone found (tsx):
 - src\app\(admin)\admin\(protected)\menores\page.tsx [320:2 - 332:47] (12 lines, 92 tokens)
   src\app\(admin)\admin\(protected)\usuarios\page.tsx [302:7 - 314:41]

Clone found (tsx):
 - src\app\(admin)\admin\(protected)\estadisticas\page.tsx [393:6 - 406:6] (13 lines, 89 tokens)
   src\app\(admin)\admin\(protected)\estadisticas\page.tsx [349:9 - 362:9]

Clone found (tsx):
 - src\app\(admin)\admin\(protected)\estadisticas\page.tsx [437:7 - 450:7] (13 lines, 89 tokens)
   src\app\(admin)\admin\(protected)\estadisticas\page.tsx [349:9 - 362:9]

Clone found (javascript):
 - src\app\(admin)\admin\(protected)\consentimientos\page.tsx [322:2 - 527:2] (205 lines, 1598 tokens)
   src\app\(admin)\admin\(protected)\usuarios\[id]\page.tsx [444:2 - 678:2]

Clone found (tsx):
 - src\app\(admin)\admin\(protected)\consentimientos\page.tsx [58:2 - 85:13] (27 lines, 224 tokens)
   src\app\(admin)\admin\(protected)\usuarios\[id]\page.tsx [155:4 - 180:21]

Clone found (tsx):
 - src\app\(admin)\admin\(protected)\consentimientos\page.tsx [80:6 - 90:29] (10 lines, 75 tokens)
   src\app\(admin)\admin\(protected)\usuarios\page.tsx [133:10 - 141:26]

Clone found (tsx):
 - src\app\(admin)\admin\(protected)\consentimientos\page.tsx [92:4 - 105:20] (13 lines, 88 tokens)
   src\app\(admin)\admin\(protected)\usuarios\page.tsx [141:6 - 153:17]

Clone found (tsx):
 - src\app\(admin)\admin\(protected)\consentimientos\page.tsx [133:5 - 142:2] (9 lines, 99 tokens)
   src\app\(admin)\admin\(protected)\usuarios\[id]\page.tsx [644:12 - 652:6]

Clone found (tsx):
 - src\app\(admin)\admin\(protected)\consentimientos\page.tsx [212:8 - 230:7] (18 lines, 125 tokens)
   src\app\(admin)\admin\(protected)\usuarios\page.tsx [235:5 - 253:8]

Clone found (tsx):
 - src\app\(admin)\admin\(protected)\consentimientos\page.tsx [263:7 - 275:47] (12 lines, 71 tokens)
   src\app\(admin)\admin\(protected)\usuarios\page.tsx [257:7 - 269:71]

Clone found (tsx):
 - src\app\(admin)\admin\(protected)\consentimientos\page.tsx [265:13 - 276:16] (11 lines, 64 tokens)
   src\app\(admin)\admin\(protected)\menores\page.tsx [305:4 - 316:14]

Clone found (tsx):
 - src\app\(admin)\admin\(protected)\consentimientos\page.tsx [324:4 - 343:2] (19 lines, 155 tokens)
   src\app\(admin)\admin\(protected)\usuarios\[id]\page.tsx [478:6 - 497:3]

Clone found (tsx):
 - src\app\(admin)\admin\(protected)\consentimientos\page.tsx [343:10 - 349:2] (6 lines, 55 tokens)
   src\app\(admin)\admin\(protected)\usuarios\[id]\page.tsx [460:9 - 503:3]

Clone found (tsx):
 - src\app\(admin)\admin\(protected)\consentimientos\page.tsx [349:7 - 354:2] (5 lines, 53 tokens)
   src\app\(admin)\admin\(protected)\usuarios\[id]\page.tsx [503:4 - 509:3]

Clone found (tsx):
 - src\app\(admin)\admin\(protected)\consentimientos\page.tsx [364:7 - 371:11] (7 lines, 66 tokens)
   src\app\(admin)\admin\(protected)\usuarios\[id]\page.tsx [523:8 - 530:12]

Clone found (tsx):
 - src\app\(admin)\admin\(protected)\consentimientos\page.tsx [373:10 - 381:6] (8 lines, 81 tokens)
   src\app\(admin)\admin\(protected)\usuarios\[id]\page.tsx [532:11 - 540:21]

Clone found (tsx):
 - src\app\(admin)\admin\(protected)\consentimientos\page.tsx [381:2 - 399:2] (18 lines, 136 tokens)
   src\app\(admin)\admin\(protected)\usuarios\[id]\page.tsx [541:10 - 558:2]

Clone found (tsx):
 - src\app\(admin)\admin\(protected)\consentimientos\page.tsx [399:7 - 477:12] (78 lines, 543 tokens)
   src\app\(admin)\admin\(protected)\usuarios\[id]\page.tsx [560:7 - 638:10]

Clone found (tsx):
 - src\app\(admin)\admin\(protected)\consentimientos\page.tsx [484:7 - 538:2] (54 lines, 388 tokens)
   src\app\(admin)\admin\(protected)\usuarios\[id]\page.tsx [636:2 - 688:3]

Clone found (tsx):
 - src\app\(admin)\admin\(protected)\configuracion\page.tsx [187:16 - 194:5] (7 lines, 64 tokens)
   src\app\(admin)\admin\(protected)\configuracion\page.tsx [84:18 - 91:7]

Clone found (tsx):
 - src\app\(admin)\admin\(protected)\configuracion\page.tsx [194:5 - 203:5] (9 lines, 66 tokens)
   src\app\(admin)\admin\(protected)\configuracion\page.tsx [91:7 - 100:7]

Clone found (tsx):
 - src\app\(admin)\admin\(protected)\configuracion\page.tsx [203:5 - 219:153] (16 lines, 132 tokens)
   src\app\(admin)\admin\(protected)\configuracion\page.tsx [100:7 - 116:158]

Clone found (tsx):
 - src\app\(admin)\admin\(protected)\configuracion\page.tsx [220:21 - 234:5] (14 lines, 102 tokens)
   src\app\(admin)\admin\(protected)\configuracion\page.tsx [117:24 - 134:7]

Clone found (tsx):
 - src\app\(admin)\admin\(protected)\configuracion\page.tsx [234:5 - 267:15] (33 lines, 206 tokens)
   src\app\(admin)\admin\(protected)\configuracion\page.tsx [134:7 - 167:18]

Clone found (tsx):
 - src\app\(admin)\admin\(protected)\configuracion\page.tsx [854:7 - 862:6] (8 lines, 72 tokens)
   src\app\(admin)\admin\(protected)\configuracion\page.tsx [764:10 - 772:8]

Clone found (typescript):
 - src\app\api\admin\staff\route.ts [23:2 - 39:5] (16 lines, 123 tokens)
   src\app\api\admin\users\route.ts [8:2 - 23:2]

Clone found (typescript):
 - src\app\api\admin\roles\route.ts [145:87 - 155:8] (10 lines, 80 tokens)
   src\app\api\admin\set-admin\route.ts [57:4 - 67:3]

Clone found (typescript):
 - src\app\api\admin\roles\route.ts [171:7 - 177:2] (6 lines, 70 tokens)
   src\app\api\admin\roles\route.ts [76:5 - 82:2]

Clone found (typescript):
 - src\app\api\admin\roles\route.ts [210:2 - 220:23] (10 lines, 84 tokens)
   src\app\api\admin\set-admin\route.ts [57:4 - 155:22]

Clone found (typescript):
 - src\app\api\admin\minors\route.ts [5:1 - 25:13] (20 lines, 205 tokens)
   src\app\api\admin\users\route.ts [5:1 - 25:12]

Clone found (typescript):
 - src\app\api\admin\consents\route.ts [21:8 - 27:7] (6 lines, 68 tokens)
   src\app\api\admin\users\route.ts [17:4 - 23:2]

Clone found (typescript):
 - src\app\api\admin\consents\route.ts [51:7 - 58:2] (7 lines, 116 tokens)
   src\app\api\admin\consents\[id]\route.ts [63:15 - 70:2]

Clone found (javascript):
 - src\components\admin\settings\StaffManager.tsx [475:6 - 503:19] (28 lines, 231 tokens)
   src\components\admin\settings\StaffManager.tsx [423:2 - 449:18]

Clone found (tsx):
 - src\components\admin\settings\StaffManager.tsx [114:10 - 123:7] (9 lines, 71 tokens)
   src\components\admin\settings\StaffManager.tsx [77:11 - 86:8]

Clone found (tsx):
 - src\components\admin\settings\StaffManager.tsx [152:5 - 167:2] (15 lines, 120 tokens)
   src\components\admin\settings\StaffManager.tsx [113:5 - 128:9]

Clone found (tsx):
 - src\components\admin\settings\StaffManager.tsx [180:5 - 191:19] (11 lines, 86 tokens)
   src\components\admin\settings\StaffManager.tsx [138:2 - 149:17]

Clone found (tsx):
 - src\components\admin\settings\StaffManager.tsx [197:6 - 210:25] (13 lines, 83 tokens)
   src\components\admin\settings\StaffManager.tsx [109:24 - 122:19]

Clone found (tsx):
 - src\components\admin\settings\StaffManager.tsx [223:21 - 235:14] (12 lines, 95 tokens)
   src\components\admin\settings\StaffManager.tsx [179:19 - 149:17]

Clone found (tsx):
 - src\components\admin\settings\StaffManager.tsx [488:2 - 519:18] (31 lines, 226 tokens)
   src\components\admin\settings\StaffManager.tsx [434:15 - 465:18]

Clone found (tsx):
 - src\components\admin\settings\StaffManager.tsx [540:4 - 555:15] (15 lines, 81 tokens)
   src\components\admin\settings\StaffManager.tsx [443:7 - 458:13]

Clone found (tsx):
 - src\app\(kiosk)\otp\page.tsx [150:8 - 155:32] (5 lines, 64 tokens)
   src\app\(kiosk)\registro\page.tsx [78:2 - 83:27]

Clone found (tsx):
 - src\app\(kiosk)\otp\page.tsx [188:61 - 197:12] (9 lines, 70 tokens)
   src\app\(kiosk)\registro\page.tsx [156:61 - 165:7]

Clone found (tsx):
 - src\app\(kiosk)\otp\page.tsx [236:60 - 246:2] (10 lines, 90 tokens)
   src\app\(kiosk)\registro\page.tsx [210:61 - 219:2]

Clone found (tsx):
 - src\app\(kiosk)\consentimiento\page.tsx [294:206 - 301:9] (7 lines, 70 tokens)
   src\app\(kiosk)\registro\page.tsx [352:186 - 359:33]

Clone found (typescript):
 - src\lib\utils\dateUtils.ts [132:2 - 140:17] (8 lines, 76 tokens)
   src\lib\utils\dateUtils.ts [103:2 - 111:17]

Clone found (typescript):
 - src\lib\schemas\legalContent.schema.ts [19:47 - 32:7] (13 lines, 69 tokens)
   src\app\api\admin\settings\consent\route.ts [13:39 - 19:6]

Clone found (typescript):
 - src\lib\schemas\legalContent.schema.ts [36:44 - 49:18] (13 lines, 73 tokens)
   src\app\api\admin\settings\consent\route.ts [13:39 - 32:15]

Clone found (typescript):
 - src\lib\schemas\legalContent.schema.ts [59:2 - 64:20] (5 lines, 74 tokens)
   src\app\api\admin\settings\consent\route.ts [33:2 - 38:20]

Clone found (typescript):
 - src\lib\schemas\legalContent.schema.ts [158:23 - 163:33] (5 lines, 109 tokens)
   src\lib\schemas\legalContent.schema.ts [137:30 - 142:23]

Clone found (typescript):
 - src\lib\schemas\consent.schema.ts [105:2 - 115:2] (10 lines, 75 tokens)
   src\lib\schemas\crud.schema.ts [81:2 - 94:2]

Clone found (tsx):
 - src\components\kiosk\MinorsSection.tsx [172:2 - 181:2] (9 lines, 102 tokens)
   src\app\(admin)\admin\(protected)\usuarios\[id]\page.tsx [146:10 - 155:4]

Clone found (tsx):
 - src\components\kiosk\MinorHistoryModal.tsx [137:2 - 158:6] (21 lines, 218 tokens)
   src\components\kiosk\MinorsSection.tsx [165:5 - 186:4]

Clone found (tsx):
 - src\components\kiosk\MinorHistoryModal.tsx [168:2 - 178:6] (10 lines, 77 tokens)
   src\components\kiosk\MinorsSection.tsx [206:9 - 215:7]

Clone found (tsx):
 - src\components\kiosk\MinorFormModal.tsx [17:7 - 31:15] (14 lines, 80 tokens)
   src\components\kiosk\MinorInlineForm.tsx [14:8 - 28:16]

Clone found (tsx):
 - src\components\kiosk\MinorFormModal.tsx [37:20 - 48:12] (11 lines, 93 tokens)
   src\components\kiosk\MinorInlineForm.tsx [32:21 - 43:13]

Clone found (tsx):
 - src\components\kiosk\MinorFormModal.tsx [66:2 - 84:71] (18 lines, 114 tokens)
   src\components\kiosk\MinorHistoryModal.tsx [192:2 - 209:70]

Clone found (tsx):
 - src\components\kiosk\MinorFormModal.tsx [121:6 - 131:7] (10 lines, 65 tokens)
   src\components\kiosk\MinorHistoryModal.tsx [337:6 - 347:7]

Clone found (javascript):
 - src\components\kiosk\KioskInput.tsx [321:2 - 347:7] (26 lines, 107 tokens)
   src\components\kiosk\KioskInput.tsx [169:5 - 195:8]

Clone found (tsx):
 - src\components\admin\Sidebar.tsx [158:38 - 173:2] (15 lines, 109 tokens)
   src\components\admin\Sidebar.tsx [115:43 - 133:19]

Clone found (tsx):
 - src\components\admin\AdminGuard.tsx [183:5 - 188:13] (5 lines, 53 tokens)
   src\components\admin\AdminGuard.tsx [171:10 - 176:12]

Clone found (typescript):
 - src\services\userService.ts [89:2 - 96:3] (7 lines, 73 tokens)
   src\app\api\admin\roles\route.ts [48:9 - 54:7]

Clone found (typescript):
 - src\services\userService.ts [150:8 - 161:2] (11 lines, 164 tokens)
   src\services\userService.ts [81:4 - 51:2]

Clone found (typescript):
 - src\services\userService.ts [188:5 - 196:4] (8 lines, 133 tokens)
   src\app\api\admin\consents\[id]\route.ts [66:10 - 62:2]

Clone found (typescript):
 - src\services\userService.ts [253:2 - 262:6] (9 lines, 115 tokens)
   src\services\userService.ts [89:2 - 99:6]

Clone found (typescript):
 - src\services\userService.ts [274:15 - 287:16] (13 lines, 90 tokens)
   src\services\userService.ts [112:15 - 125:2]

Clone found (typescript):
 - src\services\userService.ts [297:9 - 307:2] (10 lines, 137 tokens)
   src\services\userService.ts [247:4 - 52:2]

Clone found (typescript):
 - src\services\userService.ts [347:4 - 354:4] (7 lines, 80 tokens)
   src\services\userService.ts [247:3 - 254:5]

Clone found (typescript):
 - src\services\userService.ts [364:6 - 371:5] (7 lines, 86 tokens)
   src\services\userService.ts [347:5 - 254:5]

Clone found (typescript):
 - src\services\userService.ts [565:16 - 579:6] (14 lines, 94 tokens)
   src\services\userService.ts [112:15 - 126:5]

Clone found (typescript):
 - src\services\userService.ts [640:2 - 645:2] (5 lines, 70 tokens)
   src\services\userService.ts [583:5 - 588:5]

Clone found (typescript):
 - src\services\pdfService.ts [466:3 - 480:5] (14 lines, 81 tokens)
   src\services\pdfService.ts [407:3 - 421:6]

Clone found (typescript):
 - src\services\pdfService.ts [557:2 - 571:7] (14 lines, 81 tokens)
   src\services\pdfService.ts [407:3 - 421:6]

Clone found (typescript):
 - src\lib\api-middleware.ts [192:2 - 203:29] (11 lines, 100 tokens)
   src\lib\api-middleware.ts [179:7 - 187:47]

Clone found (typescript):
 - src\lib\api-middleware.ts [228:2 - 261:7] (33 lines, 273 tokens)
   src\lib\api-middleware.ts [139:12 - 173:12]

Clone found (typescript):
 - src\lib\api-middleware.ts [261:7 - 283:2] (22 lines, 213 tokens)
   src\lib\api-middleware.ts [170:2 - 192:2]

Clone found (typescript):
 - src\lib\api-middleware.ts [283:7 - 295:2] (12 lines, 110 tokens)
   src\lib\api-middleware.ts [192:8 - 206:2]

Clone found (typescript):
 - src\lib\adminApi.ts [64:9 - 69:20] (5 lines, 62 tokens)
   src\lib\adminApi.ts [51:2 - 42:25]

Clone found (typescript):
 - src\lib\adminApi.ts [82:5 - 87:21] (5 lines, 84 tokens)
   src\lib\adminApi.ts [37:2 - 42:25]

Clone found (typescript):
 - src\hooks\useConsents.ts [5:2 - 14:2] (9 lines, 67 tokens)
   src\services\userService.ts [499:9 - 508:9]

Clone found (tsx):
 - src\contexts\AuthContext.tsx [115:9 - 128:8] (13 lines, 82 tokens)
   src\contexts\AuthContext.tsx [100:3 - 113:17]

┌────────────┬────────────────┬─────────────┬──────────────┬──────────────┬──────────────────┬───────────────────┐
│ Format     │ Files analyzed │ Total lines │ Total tokens │ Clones found │ Duplicated lines │ Duplicated tokens │
├────────────┼────────────────┼─────────────┼──────────────┼──────────────┼──────────────────┼───────────────────┤
│ typescript │ 62             │ 10012       │ 68728        │ 45           │ 532 (5.31%)      │ 4867 (7.08%)      │
├────────────┼────────────────┼─────────────┼──────────────┼──────────────┼──────────────────┼───────────────────┤
│ javascript │ 46             │ 6145        │ 43212        │ 3            │ 259 (4.21%)      │ 1936 (4.48%)      │
├────────────┼────────────────┼─────────────┼──────────────┼──────────────┼──────────────────┼───────────────────┤
│ tsx        │ 51             │ 12417       │ 85346        │ 49           │ 719 (5.79%)      │ 5540 (6.49%)      │
├────────────┼────────────────┼─────────────┼──────────────┼──────────────┼──────────────────┼───────────────────┤
│ css        │ 1              │ 31          │ 165          │ 0            │ 0 (0%)           │ 0 (0%)            │
├────────────┼────────────────┼─────────────┼──────────────┼──────────────┼──────────────────┼───────────────────┤
│ Total:     │ 160            │ 28605       │ 197451       │ 97           │ 1510 (5.28%)     │ 12343 (6.25%)     │
└────────────┴────────────────┴─────────────┴──────────────┴──────────────┴──────────────────┴───────────────────┘
Found 97 clones.
HTML report saved to report\html\
ERROR: jscpd found too many duplicates (5.28%) over threshold (0%)
Error: ERROR: jscpd found too many duplicates (5.28%) over threshold (0%)
    at ThresholdReporter.report (C:\Users\danielxxomg\Desktop\jumping_park_app\node_modules\@jscpd\finder\dist\index.js:612:13)
    at C:\Users\danielxxomg\Desktop\jumping_park_app\node_modules\@jscpd\finder\dist\index.js:110:18
    at Array.forEach (<anonymous>)
    at C:\Users\danielxxomg\Desktop\jumping_park_app\node_modules\@jscpd\finder\dist\index.js:109:22
    at async C:\Users\danielxxomg\Desktop\jumping_park_app\node_modules\jscpd\dist\jscpd.js:351:5
error: script "audit:dupe" exited with code 1

danielxxomg@DESKTOP-9QMHDCM MINGW64 ~/Desktop/jumping_park_app (main)
$ bun run audit:circ
$ depcruise src --include-only "^src" --config .dependency-cruiser.js

✔ no dependency violations found (121 modules, 262 dependencies cruised)


danielxxomg@DESKTOP-9QMHDCM MINGW64 ~/Desktop/jumping_park_app (main)
$