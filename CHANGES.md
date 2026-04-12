# MCPanel — Lista zmian (Przebudowa)

## Naprawione błędy krytyczne

### Backend

#### `agent/agent.py`
- **KRYTYCZNY**: `start_server()` wywoływał `_get_java_start_command(path, data)` z 2 argumentami,
  ale funkcja wymaga 3 (`path, jar_file, data`) — każde uruchomienie serwera Java przez agenta kończyło się `TypeError`
- **KRYTYCZNY**: Kolejność argumentów JVM — `-jar server.jar` było wmieszane wewnątrz listy flag JVM zamiast na końcu
- Dodano automatyczne wykrywanie pliku JAR (`server.jar` → `paper.jar` → `purpur.jar` → ...)

#### `backend/app/auth.py`
- **KRYTYCZNY**: `get_jwt_identity()` zwraca `str`, ale kod porównywał z `int` (user_id) — błędna autoryzacja
- `logout()` nie wywoływał żadnej logiki backendowej, tylko zwracał OK
- Brak endpointu `PUT /auth/profiles` (wywoływany przez LanguageContext)
- Dodano helper `_get_current_user()` z bezpieczną konwersją `str→int`

#### `backend/app/routes.py`
- **KRYTYCZNY**: `DELETE /users/<id>` nie istniał (UserAdminManager wywoływał → 404)
- 99 wywołań `get_jwt_identity()` bez konwersji `int()` — mogło powodować błędy zapytań SQLAlchemy
- 12 miejsc bez null-guardu przed `user.role` — `AttributeError` przy nieistniejącym userze
- `_check_permission()` nie sprawdzała `if not user` przed `user.role`

#### `backend/app/__init__.py`
- **KRYTYCZNY**: `Access-Control-Allow-Origin: *` + `credentials: true` — niedozwolona kombinacja wg spec CORS
  (przeglądarka blokuje takie requesty)

#### `backend/app/server_manager.py`
- Race condition w `stop_server()` — dostęp do `self.processes` bez locka

### Frontend

#### `src/services/api.js`
- **KRYTYCZNY**: Dwa niezależne interceptory obsługujące 401 — race condition, podwójny redirect

#### `src/context/AuthContext.js`
- `logout()` tylko czyściło localStorage, nigdy nie invalidowało sesji na backendzie
- Brak `updateUserLanguage()` wywoływanego przez LanguageContext → `TypeError`

#### `src/components/AddUserDialog.js`
- Biały design (`background: white`, `color: #374151`) — nie pasował do ciemnego panelu

#### `src/components/ProgressBar.js`
- Biały design — nie pasował do panelu

---

## Nowe funkcje i ulepszenia

### Dashboard
- Auto-refresh co 10 sekund (cichy, bez flashowania)
- Jeden handler `handleAction(id, action)` zamiast 3 duplikatów
- Optimistic updates — status zmienia się natychmiast
- Modal potwierdzenia usunięcia (zamiast `toast.warning` z komponentem)
- Statystyki: łączne zajęte miejsce na dysku

### Console
- **Historia komend** (↑↓ strzałki, 50 ostatnich)
- **Kolorowanie logów**: WARN=żółty, ERROR=czerwony, JOIN=zielony, LEAVE=czerwony
- **Tryb pauzy** — zatrzymuje odświeżanie bez rozłączenia
- **Liczba linii** — 200/500 do wyboru
- **Tryb pełnoekranowy**
- **Scroll-to-bottom** przycisk gdy nie na dole
- **Kopiuj wszystko** do schowka
- ANSI escape codes automatycznie usuwane z logów

### Layout (Sidebar)
- **Zwijany sidebar** — 240px ↔ 60px z animacją
- **Sticky topbar** z blur/glassmorphism
- Overlay na mobile + płynna animacja
- Sekcje adminowe widoczne tylko dla `admin`/`moderator`

### Login
- Show/hide hasło
- Sensowne komunikaty: 423 → "Konto tymczasowo zablokowane"
- Autocomplete dla menadżerów haseł

### ServerControl (pełny rewrite)
- Jeden handler akcji z automatycznym polling statusu
- Mini-konsola z historią komend
- Dynamiczna lista graczy z analizy logów
- Zasoby CPU/RAM/Dysk z animowanymi paskami
- Szybkie zadania w siatce

### FileEditor
- Przyciski **Usuń / Zmień nazwę / Pobierz** przy każdym pliku
- Działający przycisk „Pobierz" w edytorze (był `disabled`)
- Usunięto debug `console.log` z uploadu

### UserAdminManager (pełny rewrite)
- Wszystkie `alert()`/`window.confirm()` zastąpione toast
- Walidacja hasła (min. 6 znaków) po stronie frontend
- Potwierdzenie błędów inline w modalu

---

## Oczyszczenie kodu

| Co usunięto | Liczba |
|-------------|--------|
| `console.log`/`console.error` z komponentów | **88** |
| `alert()` zastąpione `toast` | **~25** |
| Duplikaty interceptorów Axios | 1 |
| Puste `middleware.py` | pozostawiono (zgodność) |

---

## Konfiguracja

### `.env.example` — nowy plik
```
SECRET_KEY=your-secret-key-change-me
JWT_SECRET_KEY=your-jwt-secret-change-me
SERVER_BASE_PATH=/opt/mcpanel/servers
MAX_BACKUP_COUNT=10
FLASK_DEBUG=false
PORT=5000
ALLOWED_ORIGINS=https://panel.example.com
```

### `config.py` — ulepszenia
- `SQLALCHEMY_ENGINE_OPTIONS` z `pool_pre_ping` (zapobiega błędom zerwanych połączeń)
- `MAX_CONTENT_LENGTH = 500MB`
- `SERVER_BASE_PATH` z env

---

## Instalacja i uruchomienie

```bash
# Backend
cd backend
pip install -r requirements.txt
flask init-db
python run.py

# Frontend
cd frontend
npm install
npm start  # dev
npm run build  # produkcja
```
