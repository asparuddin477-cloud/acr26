import json
import csv
import os
from datetime import datetime

seed_path = os.path.join('data', 'legacy_seed.json')
out_csv_path = os.path.join('data', 'database_peserta_acr2026.csv')

with open(seed_path, 'r', encoding='utf-8') as f:
    data = json.load(f)

cols = [
    'kode', 'nama', 'ktp', 'gender', 'kategori', 'bibName', 'wa', 'jersey',
    'komunitas', 'alamat', 'provinsi', 'kota', 'darurat', 'komorbid',
    'tagihan', 'diskon', 'status', 'bibNumber', 'checkedIn',
    'kodeLogistik', 'logistikDiambil', 'bukti', 'createdAt'
]

peserta_list = data.get('peserta', [])

with open(out_csv_path, 'w', newline='', encoding='utf-8-sig') as f:
    writer = csv.writer(f)
    writer.writerow(cols)
    
    for p in peserta_list:
        row = []
        for c in cols:
            val = p.get(c, '')
            if c == 'ktp':
                # Format as text so Excel doesn't turn it into scientific notation (e.g. 6.474E+15)
                val = f'="{val}"' if val else ''
            elif c in ['wa', 'darurat']:
                # Format phone numbers as text to preserve leading zero
                val_str = str(val).strip()
                if val_str and not val_str.startswith('0') and not val_str.startswith('+'):
                    val_str = '0' + val_str
                val = f'="{val_str}"' if val_str else ''
            elif c == 'bukti':
                val = '[Ada Bukti]' if val else '[Tidak Ada Bukti]'
            elif c == 'checkedIn':
                val = 'TRUE' if val in [True, 'TRUE', 'true'] else 'FALSE'
            elif c == 'createdAt':
                # Format readable date if timestamp integer
                if isinstance(val, (int, float)) and val > 1000000000:
                    try:
                        # Could be milliseconds
                        ts = val / 1000 if val > 100000000000 else val
                        val = datetime.fromtimestamp(ts).strftime('%Y-%m-%d %H:%M:%S')
                    except Exception:
                        pass
            elif isinstance(val, str):
                val = val.replace('\r', ' ').replace('\n', ' ').strip()
            row.append(val)
        writer.writerow(row)

print(f"Berhasil membuat CSV: {out_csv_path} dengan {len(peserta_list)} peserta.")
