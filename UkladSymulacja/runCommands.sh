#!/bin/bash

# Build the project with idf.py
idf.py build

# Merge binaries with esptool.py
python /opt/esp/idf/components/esptool_py/esptool/esptool.py --chip esp32 merge_bin --output result.bin --fill-flash-size 4MB 0x1000 build/bootloader/bootloader.bin 0x8000 build/partition_table/partition-table.bin 0x10000 build/UkladSymulacja.bin --flash_mode dio --flash_freq 40m --flash_size 4MB


# Launch QEMU with the merged binary
qemu-system-xtensa -nographic -machine esp32 -drive file=result.bin,if=mtd,format=raw
