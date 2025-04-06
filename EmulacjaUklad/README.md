# Instrukcja załadowania dla zjadaczy chleba 

https://docs.rust-embedded.org/book/start/qemu.html

## Instalacja zależności po sklonowaniu tego repo
- Instalacja rusta z https://rustup.rs/
- Instalacja QEMU (emulator układu) z https://www.qemu.org/download/#windows

Po instalacji trzeba zresetować terminal (wyjście z VSC)

## Polecenia w terminalu przed uruchomieniem 
``` console
  rustup target add thumbv7m-none-eabi

  cargo build
  
  cargo run
```