# Fotos locais para briefs de demonstração

Coloque aqui fotos reais do negócio, com autorização de uso. No brief, use:

```json
"media": {
  "photos": [
    { "local_path": "foto-prato.jpg", "caption": "Prato da casa", "generated": false }
  ]
}
```

O builder copia arquivos JPEG, PNG ou WebP de até 8 MB para cada job. `local_path` é relativo a esta pasta. Sites de comida sem fotos são rejeitados antes da geração. A foto deve retratar o negócio ou produto indicado no brief; uma imagem de outro restaurante não deve ser apresentada como prato próprio.
