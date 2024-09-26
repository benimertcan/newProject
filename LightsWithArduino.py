import json
import time
import serial

# Arduino ile bağlantı ayarları
arduino_port = 'COM6'  # Portu uygun şekilde değiştir (Windows için 'COMx')
baud_rate = 9600

# Arduino ile bağlantıyı aç
ser = serial.Serial(arduino_port, baud_rate)
time.sleep(2)  # Bağlantı için bekle

# JSON dosyasını oku
with open('recorded_events.json', 'r') as file:
    events = json.load(file)

def key_to_index(key):
    mapping = {'s': 0, 'd': 1, 'f': 2, 'j': 3, 'k': 4, 'l': 5}
    return mapping.get(key, -1)

# Etkinlikleri işleme
for event in events:
    event_type = event['type']
    key = event['key']
    timestamp = event['timestamp'] / 3500  # milisaniyeden saniyeye çevir

    time.sleep(timestamp)  # Belirli bir süre bekle

    led_index = key_to_index(key)
    if led_index != -1:
        if event_type == 'keydown':
            # LED'leri yak
            command = f'ON {led_index}\n'
            ser.write(command.encode())
        elif event_type == 'keyup':
            # LED'leri söndür
            command = f'OFF {led_index}\n'
            ser.write(command.encode())
    else:
        print(f"Geçersiz tuş: {key}")

# Bağlantıyı kapat
ser.close()
