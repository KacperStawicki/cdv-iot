## 📘 Kontekst Biznesowy

Naszym produktem jest **inteligentne urządzenie do monitorowania nawodnienia gleby**.  
Urządzenie regularnie **pobiera dane o poziomie wilgotności gleby** i wysyła je do systemu backendowego.

---

### 🔄 Sposób działania

- 🌱 **Urządzenie** mierzy wilgotność gleby i wysyła dane do backendu.
- 🖥️ **Backend** odbiera dane i przypisuje je do kont użytkowników na podstawie ID urządzenia.
- 🧑‍💻 **Użytkownik**:
  - Dodaje urządzenie do swojego konta podając jego **unikalny identyfikator (ID)**.
  - Może nadać każdemu urządzeniu **własną nazwę** ułatwiającą identyfikację.
  - Może ustawić **progi wilgotności**, przy których zmienia się kolor **lampki sygnalizacyjnej**:
    - 🔴 **Czerwony** – np. 30%
    - 🟠 **Pomarańczowy** – np. 60%
    - 🟢 **Zielony** – np. 90%

---

### 🧱 Technologie i baza danych

- Dane urządzeń i ustawienia użytkowników są zapisywane w **bazie danych PostgreSQL**.
- Interfejs frontendowy pozwala na:
  - Rejestrację i zarządzanie urządzeniami.
  - Konfigurację progów nawodnienia.
  - Wizualizację aktualnego poziomu wilgotności gleby.

---

### 🎯 Wartość dla użytkownika

- 💧 **Optymalizacja zużycia wody**
- 📊 **Szybkie reagowanie** na zmiany środowiskowe
- 🧠 **Proste i intuicyjne zarządzanie** nawodnieniem gleby
- 📱 **Nowoczesny i skalowalny system** dostępny przez przeglądarkę

---

System przeznaczony jest zarówno dla:
- 🏡 **Użytkowników domowych** – np. ogrody, uprawy balkonowe,
- 🚜 **Profesjonalnych gospodarstw rolnych** – zarządzających dużymi obszarami upraw.
