## Instalación

- node@22
- npm@latest
- pnpm

```bash
npm install --global pnpm@latest-10
```

```bash
pnpm install
```

## Como crear comandos

Necesitas un `package.json` en tu carpeta (`/apps/` o `/packages/`)

En el `package.json` necesitas definir los scripts, por ejemplo, `node index.js`

```json
{
    "name": "base_de_datos",
    "scripts": {
        "start": "node index.js"
    }
}
```

y para usar el comando tienes que ir a la carpeta raíz y ejecutar:

```bash
pnpm --filter base_de_datos start
```

- `--filter`: Se encarga de "entrar" en el paquete que le indicaste, va por `name`.

- `name`: Nombre del paquete a modificar

- `script`: Comando en `package.json` a ejecutar.