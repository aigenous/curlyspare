<script setup lang="ts">
import { RouterLink } from 'vue-router'
import { usePageMeta } from '../composables/usePageMeta'
import { usePalette } from '../composables/usePalette'
import { brand } from '../brand'
import { categoryLabel, t } from '../i18n'
import { publishedToolLeadStart, publishedToolSearchLabel } from '../lib/plural'
import { categories, tools } from '../registry'

const palette = usePalette()
// Switches to publicTools() when the allowlist PR #21 lands.
const publishedTools = tools
const toolCount = publishedTools.length

usePageMeta({
  title: `Narzędzia dla programistów — ${brand.name}`,
  description: t('homeLede'),
  path: '/',
})

const chips = [
  { slug: 'generator-pesel', label: 'PESEL' },
  { slug: 'generator-nip', label: 'NIP' },
  { slug: 'walidator-iban', label: 'IBAN' },
  { slug: 'formatowanie-json', label: 'JSON' },
  { slug: 'kodowanie-base64', label: 'Base64' },
  { slug: 'generator-uuid', label: 'UUID' },
] as const

function inCategory(category: (typeof categories)[number]) {
  return publishedTools.filter((tool) => tool.category === category)
}
</script>

<template>
  <section class="hero">
    <div class="wrap hero__in">
      <div class="hero__copy">
        <p class="kicker">
          {{ t('homeKicker') }}
        </p>
        <h1 class="h-display">
          Narzędzia, które <mark>pokazują obliczenia</mark>.
        </h1>
        <p class="lead">
          {{ publishedToolLeadStart(toolCount) }} dla programistów, testerów i analityków: walidatory
          PESEL, NIP, REGON i IBAN, generatory danych testowych, JSON, Base64, regex i reszta. Bez
          logowania.
        </p>
        <p class="lead">
          {{ t('homeLede') }}
        </p>
        <button
          class="search-trigger search-trigger--lg"
          type="button"
          aria-keyshortcuts="Control+K Meta+K"
          @click="palette.show()"
        >
          <svg
            class="icon"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <circle
              cx="11"
              cy="11"
              r="7"
            />
            <path d="m20 20-3.5-3.5" />
          </svg>
          <span>{{ publishedToolSearchLabel(toolCount) }}</span>
          <kbd class="kbd">Ctrl/⌘ K</kbd>
        </button>
        <nav
          class="chips"
          aria-label="Na skróty"
        >
          <span class="small muted">Na skróty:</span>
          <RouterLink
            v-for="chip in chips"
            :key="chip.slug"
            class="chip"
            :to="`/${chip.slug}`"
          >
            {{ chip.label }}
          </RouterLink>
        </nav>
      </div>
    </div>
  </section>

  <section
    id="narzedzia"
    class="section section--line"
    aria-labelledby="narzedzia-h"
  >
    <div class="wrap">
      <div class="section__head">
        <h2
          id="narzedzia-h"
          class="h1"
        >
          Spis narzędzi
        </h2>
        <p class="lead">
          Wszystkie działają bez konta. Na telefonie też.
        </p>
      </div>
      <div class="toc-groups">
        <section
          v-for="category in categories"
          :key="category"
          class="toc-group"
        >
          <h3>{{ categoryLabel(category) }}</h3>
          <ul class="toc">
            <li
              v-for="tool in inCategory(category)"
              :key="tool.slug"
            >
              <RouterLink
                class="toc__link"
                :to="`/${tool.slug}`"
              >
                <span class="toc__top">
                  <span class="toc__name">{{ tool.title }}</span>
                  <span class="toc__dots" />
                  <span class="toc__kind">{{ categoryLabel(tool.category) }}</span>
                </span>
                <span class="toc__desc">{{ tool.description }}</span>
              </RouterLink>
            </li>
          </ul>
        </section>
      </div>
    </div>
  </section>

  <section
    class="section section--line"
    aria-labelledby="zasady-h"
  >
    <div class="wrap">
      <div class="section__head">
        <h2
          id="zasady-h"
          class="h1"
        >
          Czego się trzymamy
        </h2>
      </div>
      <div class="principles">
        <div>
          <h3 class="h3">
            Pokazujemy obliczenia
          </h3>
          <p>
            Sam komunikat „niepoprawny” niczego nie wyjaśnia. Przy wyniku widzisz wagi, sumę
            kontrolną i cyfrę, przy której numer przestaje się zgadzać.
          </p>
        </div>
        <div>
          <h3 class="h3">
            Piszemy, gdzie liczymy
          </h3>
          <p>
            Jeśli narzędzie przetwarza dane w przeglądarce, mówi to przy polu. Jeśli któreś będzie
            potrzebować serwera, napiszemy to w tym samym miejscu.
          </p>
        </div>
        <div>
          <h3 class="h3">
            Dane testowe są oznaczone
          </h3>
          <p>
            Każda wygenerowana wartość ma etykietę <span class="tag tag--test">[TEST]</span>.
            Generatory służą do testowania oprogramowania. Nie tworzą dokumentów ani ich wzorów.
          </p>
        </div>
        <div>
          <h3 class="h3">
            Strona narzędzia to narzędzie
          </h3>
          <p>
            Najpierw pole i wynik, potem opis. Bez reklam i bez okienek z ofertą na stronach
            narzędzi.
          </p>
        </div>
      </div>
    </div>
  </section>

  <section
    class="section section--line"
    aria-labelledby="pytania-h"
  >
    <div class="wrap">
      <h2
        id="pytania-h"
        class="h2"
      >
        Pytania i odpowiedzi
      </h2>
      <div class="faq">
        <details>
          <summary>Czy narzędzia są darmowe?</summary>
          <p>Tak. Wszystkie narzędzia są darmowe i działają bez konta.</p>
        </details>
        <details>
          <summary>Czy wpisane dane trafiają na serwer?</summary>
          <p>
            Narzędzia z dopiskiem o przetwarzaniu w przeglądarce liczą lokalnie i nie wysyłamy
            wpisanych danych na serwer. Mimo to do testów używaj danych testowych, a nie
            prawdziwych.
          </p>
        </details>
        <details>
          <summary>Czy wygenerowany PESEL jest prawdziwy?</summary>
          <p>
            Nie pochodzi z rejestru. Ma poprawną budowę i sumę kontrolną, więc przejdzie walidację
            w testowanym formularzu, ale może przypadkiem pokrywać się z numerem istniejącej osoby.
            Używaj go wyłącznie w środowiskach testowych.
          </p>
        </details>
        <details>
          <summary>Kto za tym stoi?</summary>
          <p>
            CurlySpare tworzy aigenous: przedsięwzięcie oparte w 100% na AI, prowadzone w ramach
            jednoosobowej działalności gospodarczej Piotra Szewczyka. To nie jest osobna spółka.
          </p>
        </details>
      </div>
    </div>
  </section>
</template>
