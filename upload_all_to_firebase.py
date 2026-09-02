import json
import urllib.request
import os

def val_to_firestore(v):
    if v is None:
        return {'nullValue': None}
    elif isinstance(v, bool):
        return {'booleanValue': v}
    elif isinstance(v, int):
        return {'integerValue': str(v)}
    elif isinstance(v, float):
        return {'doubleValue': v}
    elif isinstance(v, str):
        return {'stringValue': v}
    elif isinstance(v, list):
        return {'arrayValue': {'values': [val_to_firestore(x) for x in v]}}
    elif isinstance(v, dict):
        return {'mapValue': {'fields': {k: val_to_firestore(sub_v) for k, sub_v in v.items()}}}
    else:
        return {'stringValue': str(v)}

def to_firestore_fields(d):
    return {k: val_to_firestore(v) for k, v in d.items()}

def main():
    with open('data/legacy_seed.json', 'r', encoding='utf-8') as f:
        data = json.load(f)

    project_id = 'acr-event-2026'
    api_key = 'AIzaSyDNcFA06yGys4z2HOkyxtpaFxDdLtQl6WM'
    commit_url = f'https://firestore.googleapis.com/v1/projects/{project_id}/databases/(default)/documents:commit?key={api_key}'

    # 1. Clean and update settings with file assets
    settings = data.get('settings', {})
    if settings.get('waPanitia') == '#ERROR!' or not settings.get('waPanitia'):
        settings['waPanitia'] = '6281234567890'
    
    settings['gambar'] = json.dumps([
        'assets/gallery/gallery_1.png',
        'assets/gallery/gallery_2.png',
        'assets/gallery/gallery_3.png',
        'assets/gallery/gallery_4.png'
    ])
    settings['benefits'] = json.dumps([
        'assets/benefits/benefit_1.png',
        'assets/benefits/benefit_2.png',
        'assets/benefits/benefit_3.png',
        'assets/benefits/benefit_4.png'
    ])
    settings['bgHero'] = 'assets/bg_hero.png'

    settings_doc_name = f'projects/{project_id}/databases/(default)/documents/settings/event_config'
    settings_write = {
        'writes': [{
            'update': {
                'name': settings_doc_name,
                'fields': to_firestore_fields(settings)
            }
        }]
    }
    
    req = urllib.request.Request(commit_url, data=json.dumps(settings_write).encode('utf-8'), headers={'Content-Type': 'application/json'})
    urllib.request.urlopen(req)
    print("Settings uploaded successfully to Firestore!")

    # 2. Upload peserta in batches of 50 to avoid request payload size limits
    peserta_list = data.get('peserta', [])
    total = len(peserta_list)
    print(f"Uploading {total} participants to Firestore...")

    batch_size = 50
    for i in range(0, total, batch_size):
        chunk = peserta_list[i:i+batch_size]
        writes = []
        for p in chunk:
            doc_name = f"projects/{project_id}/databases/(default)/documents/peserta/{p['kode']}"
            writes.append({
                'update': {
                    'name': doc_name,
                    'fields': to_firestore_fields(p)
                }
            })
        
        req = urllib.request.Request(commit_url, data=json.dumps({'writes': writes}).encode('utf-8'), headers={'Content-Type': 'application/json'})
        urllib.request.urlopen(req)
        print(f"Batch {min(i + batch_size, total)}/{total} uploaded successfully.")

    print(f"\nSUCCESS! ALL {total} PARTICIPANTS AND SETTINGS ARE LIVE IN FIRESTORE!")

if __name__ == '__main__':
    main()
