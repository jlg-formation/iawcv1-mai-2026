# mcp-sqlite

Serveur MCP minimal en Bun qui expose un seul outil: `execute_sql`.

## Configuration VS Code / GitHub Copilot

Ce projet peut etre declare comme serveur MCP dans VS Code pour etre utilise par GitHub Copilot.

### Prerequis

- VS Code recent
- Extension GitHub Copilot et GitHub Copilot Chat installees
- Bun installe et disponible dans le `PATH`

### Cas 1: vous ouvrez directement le dossier `mcp-sqlite`

Le fichier `.vscode/mcp.json` du projet est deja pret:

```json
{
  "servers": {
    "sqlite-open-server": {
      "type": "stdio",
      "command": "bun",
      "args": [
        "--cwd",
        "${workspaceFolder}",
        "run",
        "src/index.ts",
        "--db",
        "./database.sqlite"
      ]
    }
  }
}
```

Ici, `bun --cwd` force explicitement le repertoire de travail sur le dossier ouvert par VS Code.

Dans ce mode, ouvrez simplement le dossier `mcp-sqlite` dans VS Code puis redemarrage de la fenetre si GitHub Copilot ne voit pas immediatement le serveur.

### Cas 2: vous gardez le workspace racine `chat-llm`

Dans votre workspace actuel, VS Code lit surtout le fichier `.vscode/mcp.json` situe a la racine du workspace. Il faut donc y fusionner l'entree du serveur SQLite.

Exemple de configuration compatible avec votre fichier actuel:

```json
{
  "servers": {
    "jlg-consulting": {
      "url": "https://www.jlg-consulting.com/mcp.php",
      "type": "http"
    },
    "sqlite-open-server": {
      "type": "stdio",
      "command": "bun",
      "args": [
        "--cwd",
        "${workspaceFolder}/mcp-sqlite",
        "run",
        "src/index.ts",
        "--db",
        "./database.sqlite"
      ]
    }
  },
  "inputs": []
}
```

Dans cette variante:

- le `command` reste `bun`
- `--cwd` fixe explicitement le repertoire de travail sur `${workspaceFolder}/mcp-sqlite`
- le script peut donc rester `src/index.ts`
- le fichier SQLite peut rester `./database.sqlite`

### Verification dans GitHub Copilot

Une fois la configuration en place:

1. Rechargez la fenetre VS Code.
2. Ouvrez GitHub Copilot Chat.
3. Verifiez que le serveur MCP `sqlite-open-server` est charge.
4. Demandez au modele d'appeler l'outil `execute_sql`.

Exemple de demande:

```text
Utilise l'outil execute_sql pour creer une table test puis inserer une ligne.
```

### Changer le fichier SQLite cible

Vous pouvez pointer vers n'importe quel fichier SQLite en modifiant les arguments du serveur dans `mcp.json`:

```json
{
  "type": "stdio",
  "command": "bun",
  "args": [
    "--cwd",
    "${workspaceFolder}/mcp-sqlite",
    "run",
    "src/index.ts",
    "--db",
    "D:/data/mon-fichier.sqlite"
  ]
}
```

Sous Windows, utilisez de preference soit des slashs `/`, soit des doubles antislashs `\\` dans les chemins JSON.

Note: la reference de configuration MCP de VS Code documente `command`, `args`, `env` et `envFile` pour les serveurs `stdio`, mais pas un champ `cwd`. Ici, le repertoire de travail est donc force de maniere fiable par Bun avec `--cwd`.

## Installation

```bash
bun install
```

## Lancement

```bash
bun run src/index.ts --db ./database.sqlite
```

Si `--db` n'est pas fourni, le serveur utilise `./database.sqlite`.

## Outil exposé

Nom: `execute_sql`

Entrée JSON:

```json
{
  "sql": "SELECT * FROM users WHERE id = ?1",
  "params": [1]
}
```

Exemple avec paramètres nommés:

```json
{
  "sql": "INSERT INTO users(name) VALUES ($name)",
  "params": {
    "name": "Alice"
  }
}
```

Le serveur ne filtre pas les requêtes SQL. Toute requête SQLite valide en lecture ou en écriture est transmise telle quelle à la base configurée.
