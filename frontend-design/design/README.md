# Claude 디자인 적용 워크플로우

이 폴더는 `claude.ai/design`의 핸드오프 결과물을 보관하고, Next.js 코드로 흡수하는 단계를 정리한다.

## 폴더

```
design/
├── README.md          # 이 파일
├── tokens.json        # 색상/폰트/효과 토큰 (SSOT)
└── exports/
    ├── handoff.tar.gz                # 다운로드한 원본
    └── younseo-01/                   # 압축 해제 결과
        ├── README.md                 # Claude Design이 코딩 에이전트에게 남긴 안내
        ├── chats/                    # 디자인 회의 대화록 — 의도 파악용
        └── project/forecastlab/
            ├── landing.html
            ├── upload.html
            ├── dashboard.html
            ├── shared.css
            ├── landing.js
            └── hero-visuals.js
```

## 적용 절차

1. **새 핸드오프 받으면**: `design/exports/`에 압축 해제 → 기존 폴더는 백업 후 교체.
2. **README + 채팅 먼저 읽기**: `younseo-01/README.md`와 `chats/*`에 사용자의 최종 의도가 담겨 있다.
3. **타깃 HTML을 분해**:
   - 페이지별 `<style>` 블록 → `app/globals.css` 하단의 "Landing page — page-specific styles" 섹션에 매핑.
   - 공유 토큰(`shared.css`의 `:root`, `.btn`, `.nav`, `.glass`, `.reveal`, `.footer`) → `app/globals.css` 상단 디자인 시스템 블록 갱신.
   - 인라인 SVG 아이콘 → JSX로 변환(`stroke-width` → `strokeWidth` 등).
   - 동적 캔버스/SVG는 `public/forecastlab/`의 JS 파일을 그대로 사용.
4. **JS 런타임**: `landing.js`, `hero-visuals.js`는 `public/forecastlab/`에 그대로 둔다. Next.js `<Script strategy="afterInteractive" />`로 로드.
5. **링크 라우팅 변환**:
   - `upload.html` → `/upload`
   - `dashboard.html` → `/dashboard`
   - 동일 페이지 앵커(`#overview` 등)는 그대로 유지.
6. **토큰 변경 시**: `design/tokens.json`을 단일 진실 공급원으로 두고, `globals.css`의 `:root`와 `tailwind.config.ts`를 동기화한다.

## 주의 사항

- `landing.js`는 `window.parent.postMessage`로 Claude Design 에디터와 통신한다 — 일반 브라우저에서는 무해하므로 그대로 둔다.
- `.tweaks` 패널은 `.visible`이 추가될 때만 보인다(에디터 외에서는 숨김).
- `body { opacity: 0 }` 초기 스타일이 `body.loaded`에서 풀린다. `app/page.tsx`의 `useEffect`에서 클래스를 추가한다.
- 모델·평가지표 카피는 마케팅 콘텐츠이며 백엔드의 실제 모델(`MA, SES, Holt, Holt-Winters, Poly`) 및 10개 지표와 다를 수 있다. 일치시키려면 `lib/types.ts`의 라벨을 사용하거나 카피를 수정한다.
