# HTML Content Viewer

Un tool per visualizzare contenuti HTML strutturati caricati da un file CSV.

## Descrizione

Questo tool consente di:
- Caricare contenuti HTML da un file CSV (o Google Sheet pubblicato)
- Filtrare i contenuti per gruppo di lezione (`lesson_group`)
- Visualizzare il contenuto in modo ordinato e leggibile
- Supportare HTML completo nei campi heading e content

## Struttura CSV

Il file CSV deve contenere le seguenti colonne:

| heading | content | lesson_group |
|---------|---------|--------------|
| `<h4 id="pilastri"><strong>Pilastri concettuali</strong></h4>` | `<p>In questa sezione...</p>` | `lesson1` |
| `<h4 id="definizioni"><strong>Definizioni</strong></h4>` | `<p>Ecco le definizioni...</p>` | `lesson2` |

### Colonne richieste:
- **heading**: HTML per l'intestazione (può contenere tag HTML completi)
- **content**: HTML per il contenuto (supporta paragrafi, liste, formattazione, ecc.)
- **lesson_group**: Identificatore del gruppo di lezione (es: `lesson1`, `lesson2`, ecc.)

## Utilizzo

### URL di base
```
/tools/html-content-viewer/index.html
```

### Parametri URL

| Parametro | Descrizione | Obbligatorio | Esempio |
|-----------|-------------|--------------|---------|
| `csv` | URL del file CSV (o Google Sheet) | Sì | `?csv=https://docs.google.com/spreadsheets/d/...` |
| `lesson_group` | Identificatore del gruppo di lezione da visualizzare | Sì | `?lesson_group=lesson1` |

### Esempio completo

```
/tools/html-content-viewer/index.html?csv=https://docs.google.com/spreadsheets/d/1abc123.../edit#gid=0&lesson_group=lesson1
```

## Come usare con Google Sheets

1. Crea un foglio Google con le colonne: `heading`, `content`, `lesson_group`
2. Compila i dati con il contenuto HTML desiderato
3. Condividi il foglio: **File → Pubblica sul Web**
4. Copia il link della versione CSV dal foglio pubblicato
5. Crea un URL com questo:
   ```
   /tools/html-content-viewer/index.html?csv=YOUR_SHEET_URL&lesson_group=lesson1
   ```

## Esempio di contenuto

```csv
heading,content,lesson_group
"<h4><strong>Titolo 1</strong></h4>","<p>Contenuto della sezione con <strong>testo in grassetto</strong> e link.</p><p>Secondo paragrafo.</p>",lesson1
"<h4><strong>Titolo 2</strong></h4>","<ul><li>Elemento 1</li><li>Elemento 2</li></ul>",lesson1
"<h4><strong>Titolo 3</strong></h4>","<p>Altro contenuto per il gruppo lesson2.</p>",lesson2
```

## Caratteristiche

✅ Caricamento da CSV o Google Sheets  
✅ Filtraggio per gruppo di lezione  
✅ Supporto completo per HTML personalizzato  
✅ Design responsivo (mobile-friendly)  
✅ Tema scuro supportato  
✅ Messaggi di errore chiari  
✅ Gestione automatica dei separatori tra elementi  

## Note tecniche

- Il tool utilizza **PapaParse** per il parsing robusto del CSV
- I contenuti vuoti o con `lesson_group` non corrispondente vengono ignorati
- Il tool supporta URLs Google Sheets e indirizzi CSV standard
- L'HTML nei campi viene renderizzato direttamente (prestare attenzione alla sicurezza dei dati)
