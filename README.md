# 💧 System Inteligentnego Monitorowania Nawilżenia Gleby

Kompleksowa platforma IoT, która pomaga ogrodnikom i rolnikom dowiedzieć się **kiedy** oraz **ile** podlewać.  
Małe urządzenie umieszczone w glebie mierzy wilgotność, wysyła odczyty do chmury i zmienia kolor diody LED zgodnie z progami zdefiniowanymi przez użytkownika.

---

## 📘 Kontekst Biznesowy

• **Urządzenie** – w czasie rzeczywistym mierzy wilgotność i publikuje dane do backendu.<br/>
• **Backend** – zapisuje odczyty w PostgreSQL oraz udostępnia REST API i WebSocket do aktualizacji "na żywo".<br/>
• **Aplikacja webowa** – umożliwia rejestrację, przypisywanie urządzeń, konfigurację progów wilgotności oraz podgląd historii/aktualnych danych.

Korzyści:

1. 💧 **Oszczędność wody** – podlewasz tylko wtedy, gdy to konieczne.
2. 🧠 **Intuicyjne zarządzanie** – przyjazny interfejs i kolorowa dioda LED.
3. 📱 **Skalowalność** – sprawdzi się zarówno na balkonie, jak i w dużym gospodarstwie.

---

## 🎯 User Stories

1. **Monitorowanie roślin doniczkowych w domu**  
   _Jako_ miłośnik roślin domowych _chcę_ monitorować wilgotność gleby moich kwiatów, _aby_ nie zapomnieć o podlewaniu i nie przesuszyć ani nie przelać roślin.

2. **Ogród przydomowy i działka**  
   _Jako_ działkowiec _chcę_ kontrolować wilgotność gleby na grządkach warzywnych, _aby_ optymalizować podlewanie i zwiększyć plony bez marnowania wody.

3. **Małe gospodarstwo rolne**  
   _Jako_ właściciel niewielkiej plantacji _chcę_ monitorować kilka różnych stref uprawy jednocześnie, _aby_ efektywnie zarządzać nawadnianiem i obniżyć koszty eksploatacji.

4. **Szklarnia i uprawa pod osłonami**  
   _Jako_ ogrodnik hobbystyczny _chcę_ śledzić warunki wilgotnościowe w szklarni, _aby_ zapewnić optymalne środowisko wzrostu dla moich warzyw i ziół.

5. **Balkon i taras miejski**  
   _Jako_ mieszkaniec miasta _chcę_ monitorować mini-ogródek na balkonie, _aby_ dbać o rośliny nawet podczas nieobecności lub urlopu.

6. **Automatyzacja nawadniania** (planowane)  
   _Jako_ użytkownik systemu _chcę_ otrzymywać powiadomienia lub automatycznie włączać nawadnianie, _aby_ moje rośliny zawsze miały odpowiednią wilgotność bez mojej stałej kontroli.

---

## 🧱 Stos technologiczny

• **Backend** – Fastify (TypeScript), Prisma, PostgreSQL, JWT, WebSocket  
• **Frontend** – React 18 (Vite + TypeScript), Material-UI  
• **Infrastruktura** – Docker Compose (środowisko developerskie)  
• **Symulator** – skrypt Python 3 emulujący urządzenie

---

## 🚀 Szybki start

### 1. Wymagania wstępne

- Node.js ≥ 20
- npm (w zestawie z Node) lub pnpm / yarn
- Docker + wtyczka Docker Compose

### 2. Klonowanie repozytorium

```bash
# pobierz repozytorium
$ git clone https://github.com/your-org/cdv-iot.git
$ cd cdv-iot
```

### 3. Zmienne środowiskowe

W katalogu `backend/` utwórz plik `.env`:

```ini
JWT_SECRET="super-secret-jwt-key"
PORT="8080"
```

Adres bazy danych jest już zdefiniowany w _docker-compose.dev.yml_.

---

### 4. Uruchomienie backendu

```bash
cd backend
npm run docker:dev   # buduje obraz i uruchamia Postgres + Fastify pod http://localhost:8080
```

Dokumentacja API będzie dostępna pod `http://localhost:8080/docs` - wymaga zalogowania się. (login: `secretuser`, hasło: `secretpassword`)

Zatrzymanie usług:

```bash
npm run docker:stop
```

> ℹ️ **Pozostałe komendy** (np. migracje bazy) wykonuj _wewnątrz_ kontenera:
>
> ```bash
> # przykład
> docker compose -f docker-compose.dev.yml exec app npm run db:migrate
> ```

---

### 5. Frontend

```bash
cd frontend
npm install
npm run dev          # Vite nasłuchuje pod http://localhost:5173
```

---

### 6. Symulator urządzenia (opcjonalnie)

```bash
cd SymulacjaUklad
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
python main.py       # wysyła przykładowe pomiary przez HTTP / WebSocket
```

---

## 📂 Struktura projektu (skrót)

```
cdv-iot/
├── backend/          Fastify API & Docker files
│   ├── prisma/       Prisma schema & migrations
│   └── src/          Źródła TypeScript (routes, plugins, utils)
├── frontend/         Aplikacja React (Vite)
└── SymulacjaUklad/   Symulator w Pythonie
```

---

## 🛠 Przydatne komendy (wewnątrz kontenera backendu)

| Komenda                 | Opis                                   |
| ----------------------- | -------------------------------------- |
| `npm run db:migrate`    | Zastosuj migracje Prisma               |
| `npm run db:seed`       | Zasiej przykładowe dane                |
| `npm run db:refresh`    | Reset + migracje + seed w jednym kroku |
| `npm run docker:studio` | Uruchom Prisma Studio (`/studio`)      |
| `npm run format`        | Uruchom Prettier na całym kodzie       |
