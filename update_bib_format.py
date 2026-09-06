import json
import urllib.request
import re
import time

def update_seed_files():
    print("1. Mengupdate data/legacy_seed.json...")
    with open('data/legacy_seed.json', 'r', encoding='utf-8') as f:
        data = json.load(f)

    converted_count = 0
    for p in data.get('peserta', []):
        b = p.get('bibNumber', '')
        m = re.match(r'^([A-Za-z]+)-?(\d+)$', b)
        if m:
            prefix, num = m.groups()
            num_val = int(num)
            if num_val < 1000:
                p['bibNumber'] = f"{prefix}-{1000 + num_val}"
                converted_count += 1

    with open('data/legacy_seed.json', 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    print(f"   -> Selesai! {converted_count} peserta di legacy_seed.json diperbarui.")

    print("2. Mengupdate js/seed-data.js...")
    with open('js/seed-data.js', 'w', encoding='utf-8') as f:
        f.write("window.LEGACY_SEED = " + json.dumps(data, ensure_ascii=False) + ";\n")
    print("   -> Selesai! js/seed-data.js berhasil diperbarui.")

def update_firestore():
    project_id = 'acr-event-2026'
    api_key = 'AIzaSyDNcFA06yGys4z2HOkyxtpaFxDdLtQl6WM'
    commit_url = f'https://firestore.googleapis.com/v1/projects/{project_id}/databases/(default)/documents:commit?key={api_key}'

    print("3. Mengambil seluruh dokumen peserta dari Firestore...")
    all_docs = []
    page_token = None
    while True:
        url = f'https://firestore.googleapis.com/v1/projects/{project_id}/databases/(default)/documents/peserta?pageSize=300&key={api_key}'
        if page_token:
            url += f'&pageToken={page_token}'
        req = urllib.request.Request(url)
        res = urllib.request.urlopen(req)
        body = json.loads(res.read().decode('utf-8'))
        batch = body.get('documents', [])
        all_docs.extend(batch)
        page_token = body.get('nextPageToken')
        if not page_token:
            break

    print(f"   -> Ditemukan {len(all_docs)} dokumen di Firestore.")

    updates = []
    for doc in all_docs:
        doc_name = doc['name']
        fields = doc.get('fields', {})
        b = fields.get('bibNumber', {}).get('stringValue', '')
        m = re.match(r'^([A-Za-z]+)-?(\d+)$', b)
        if m:
            prefix, num = m.groups()
            num_val = int(num)
            if num_val < 1000:
                new_bib = f"{prefix}-{1000 + num_val}"
                updates.append({
                    'update': {
                        'name': doc_name,
                        'fields': {
                            'bibNumber': {'stringValue': new_bib}
                        }
                    },
                    'updateMask': {
                        'fieldPaths': ['bibNumber']
                    }
                })

    print(f"   -> {len(updates)} dokumen perlu diupdate ke format 1000+.")

    batch_size = 50
    for i in range(0, len(updates), batch_size):
        chunk = updates[i:i+batch_size]
        payload = {'writes': chunk}
        req = urllib.request.Request(
            commit_url,
            data=json.dumps(payload).encode('utf-8'),
            headers={'Content-Type': 'application/json'}
        )
        urllib.request.urlopen(req)
        print(f"   -> Batch {min(i + batch_size, len(updates))}/{len(updates)} tersimpan.")
        time.sleep(0.1)

    print("\nSUKSES! Seluruh nomor BIB berhasil diperbarui ke format 1000+.")

if __name__ == '__main__':
    update_seed_files()
    update_firestore()
