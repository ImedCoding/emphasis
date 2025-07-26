# Emphasis

**Emphasis** est une plateforme pour les collectionneurs de figurines Popmart. Elle permet de :

* Créer et personnaliser un profil utilisateur (avatar, bio, pays)
* Afficher et parcourir sa collection et celles des autres
* Prouver la possession de figurines via QR code et photo
* Regrouper les figurines par collection et sous-série

---

## 📋 Prérequis

* Node.js (v16 LTS+)
* npm ou yarn
* PostgreSQL (ou SQLite pour tests rapides)

---

## 🚀 Installation

1. Clone le dépôt :

   ```bash
   git clone https://github.com/ImedItescia/emphasis.git
   cd emphasis
   ```

2. Installe les dépendances :

   ```bash
   npm install
   # ou
   yarn install
   ```

3. Crée un fichier `.env.local` à la racine et copie-colle :

   ```env
   # Base de données
   DATABASE_URL="postgresql://USER:PASS@HOST:PORT/DBNAME"

   # NextAuth.js
   NEXTAUTH_SECRET="une-chaine-secrete-pour-jwt"

   # (Optionnel) Google OAuth
   # GOOGLE_ID=...
   # GOOGLE_SECRET=...

   # (Optionnel) SMTP pour email
   # EMAIL_SERVER=smtp://user:pass@smtp.exemple.com:465
   # EMAIL_FROM="Emphasis <noreply@emphasis.com>"

   # AWS S3 (upload preuves)
   AWS_REGION=...
   S3_BUCKET=...
   ```

---

## 🔧 Configurer la base de données

1. Génère les migrations et mets à jour ta BDD :

   ```bash
   npx prisma migrate dev --name init
   ```
2. (Optionnel) Ouvre Prisma Studio pour vérifier les tables :

   ```bash
   npx prisma studio
   ```

---

## 🌱 Seed (catalogue de figurines)

Le catalogue de base est défini dans `data/figurines.json`. Pour peupler la table `Figurine` :

```bash
npx prisma db seed
```

Ce script lit `data/figurines.json` et fait un upsert sur chaque entrée.

---

## 🏃 Lancer le serveur de développement

```bash
npm run dev
# ou
yarn dev
```

Le site sera disponible sur [http://localhost:3000](http://localhost:3000).

---

## 📦 Construire pour la production

```bash
npm run build
npm start
```

---

## 📁 Structure du projet

```
/emphasis
├─ public/                # Assets statiques (images)
│  └─ images/
├─ data/                  # Fichiers de seed JSON
│  └─ figurines.json
├─ prisma/
│  ├─ migrations/         # Migrations Prisma
│  ├─ schema.prisma       # Schéma de la BDD
│  └─ seed.js             # Script de seed JS
├─ lib/
│  └─ prisma.js           # Instance PrismaClient
├─ components/            # Composants React
│  ├─ Navbar.js
│  ├─ UserBanner.js
│  ├─ CollectionGroup.js
│  └─ Footer.js
├─ pages/
│  ├─ api/                # API routes Next.js
│  │  ├─ auth/            # Authentification NextAuth
│  │  └─ user/update.js   # Mise à jour profil
│  ├─ auth/               # Pages login/register
│  ├─ profile/            # Page profil sécurisé
│  ├─ index.js            # Landing page
│  └─ _app.js             # Provider global
├─ styles/                # CSS/Tailwind
│  └─ globals.css
├─ tailwind.config.js     # Config Tailwind
├─ postcss.config.js      # Config PostCSS
├─ package.json
└─ README.md
```

---

## 🤝 Contribuer

1. Fork le projet
2. Crée une branche (`git checkout -b feat/ma-fonctionnalite`)
3. Code & teste
4. Ouvre une Pull Request

Merci pour tes contributions ! 🎉

---

## ⚖️ Licence

MIT © Emphasis SARL
