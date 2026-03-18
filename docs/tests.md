# Processus de Test & Assurance Qualité

## Types de Tests implémentés
Le POC intègre une pyramide de tests pour garantir la qualité et la non-régression.

| Type | Outil | Responsable | État |
| :--- | :--- | :--- | :--- |
| **Unitaires** | Jest / Vitest | Développeur | ✅ Success |
| **Intégration** | Docker Compose / SuperTest | Développeur | ✅ Success |
| **Linting** | ESLint / Prettier | Pipeline CI | ✅ Success |
| **Sécurité (SAST)** | CodeQL / NPM Audit | Pipeline CI | ✅ Success |

## Formalisation du processus
1. **Local** : Le développeur exécute `npm test` avant de commit.
2. **PR Workflow** : À chaque ouverture de Pull Request, les tests unitaires et le linting sont exécutés automatiquement via GitHub Actions.
3. **Staging** : Les tests d'intégration sont exécutés contre une version éphémère de l'infrastructure avant le merge final.

## Preuve d'exécution (POC)
Les tests unitaires du `catalog-service` et du `moderation-worker` sont exécutés lors du build Docker. Une erreur dans les tests bloque la création de l'image et donc le déploiement via Argo CD.
