import urllib.request
import json
import os

os.makedirs('data', exist_ok=True)
url = 'https://script.google.com/macros/s/AKfycbzldmzIAyVsrH1iIiKvGR_SDj0wyQliwAf02HscSZn5e31MfinWTNZtQ-calrk-wkYZ/exec'

print("Downloading peserta...")
req1 = urllib.request.Request(
    url,
    data=json.dumps({'action': 'getAllPeserta', 'payload': {}}).encode('utf-8'),
    headers={'Content-Type': 'text/plain;charset=utf-8'}
)
res1 = urllib.request.urlopen(req1)
peserta = json.loads(res1.read().decode('utf-8')).get('data', [])
print(f"Downloaded {len(peserta)} peserta.")

print("Downloading settings...")
req2 = urllib.request.Request(
    url,
    data=json.dumps({'action': 'getSettings', 'payload': {}}).encode('utf-8'),
    headers={'Content-Type': 'text/plain;charset=utf-8'}
)
res2 = urllib.request.urlopen(req2)
settings = json.loads(res2.read().decode('utf-8')).get('data', {})
print(f"Downloaded settings: {settings.get('judul')}")

with open('data/legacy_seed.json', 'w', encoding='utf-8') as f:
    json.dump({'settings': settings, 'peserta': peserta}, f, ensure_ascii=False, indent=2)

print("Saved data/legacy_seed.json successfully!")
